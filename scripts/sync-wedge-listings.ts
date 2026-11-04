// Syncs data/wedge/*.json directory listings into the database as
// listed-tier providers (source: "listed"). Runs during the Vercel build,
// after migrations, so the live directory always matches the reviewed,
// version-controlled data files.
//
// Foundations this script enforces:
// - A listing only goes live if its bookingUrl actually responds
//   (HEAD/GET < 500). Dead booking links are skipped and logged, never
//   shipped. Set SKIP_LISTING_VERIFY=1 to bypass (local dev, where the
//   sandbox blocks outbound traffic).
// - Coordinates come from Mapbox geocoding of the address when a token is
//   available; otherwise the data file's fallback coordinates are used and
//   logged.
// - Idempotent upserts keyed on (name, source="listed"): re-running updates
//   fields and services in place. It never touches live-tier providers, and
//   a listing removed from the file is left in the DB (remove manually).
// - Any per-listing failure skips that listing; the build never fails over
//   directory content.
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { slugify } from "../lib/slug";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const adapter =
  tursoUrl && tursoToken
    ? new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
    : new PrismaLibSql({ url: `file:${path.resolve(process.cwd(), "dev.db")}` });

const prisma = new PrismaClient({ adapter });

interface WedgeService {
  name: string;
  durationMin: number;
  priceCents: number;
}

interface WedgeListing {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  bookingUrl: string;
  priceTier: number;
  fallbackLat?: number;
  fallbackLng?: number;
  services: WedgeService[];
}

interface WedgeFile {
  _meta: { categorySlug: string };
  listings: WedgeListing[];
}

const SKIP_VERIFY = process.env.SKIP_LISTING_VERIFY === "1";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

async function verifyBookingUrl(url: string): Promise<boolean> {
  if (SKIP_VERIFY) return true;
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: { "user-agent": "SoonestDirectoryBot/1.0 (+https://soonest.today)" },
      });
      // Anything the booking platform serves (including 403-to-bots) proves
      // the host and path exist; only 404/410 and 5xx mean a dead link.
      if (res.status === 404 || res.status === 410 || res.status >= 500) {
        if (method === "GET") return false;
        continue;
      }
      return true;
    } catch {
      if (method === "GET") return false;
    }
  }
  return false;
}

async function geocode(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${MAPBOX_TOKEN}&proximity=-79.42,43.645&limit=1`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: { center: [number, number] }[];
    };
    const center = data.features?.[0]?.center;
    if (!center) return null;
    return { lat: center[1], lng: center[0] };
  } catch {
    return null;
  }
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "shop";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const taken = await prisma.provider.findUnique({ where: { slug } });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function syncListing(
  listing: WedgeListing,
  categoryId: string
): Promise<"created" | "updated" | "skipped"> {
  const ok = await verifyBookingUrl(listing.bookingUrl);
  if (!ok) {
    console.warn(
      `  SKIP ${listing.name}: bookingUrl failed verification (${listing.bookingUrl})`
    );
    return "skipped";
  }

  let coords =
    (await geocode(listing.address)) ??
    (listing.fallbackLat !== undefined && listing.fallbackLng !== undefined
      ? { lat: listing.fallbackLat, lng: listing.fallbackLng }
      : null);
  if (!coords) {
    console.warn(`  SKIP ${listing.name}: no coordinates available`);
    return "skipped";
  }

  const existing = await prisma.provider.findFirst({
    where: { name: listing.name, source: "listed" },
    include: { services: true },
  });

  const fields = {
    address: listing.address,
    lat: coords.lat,
    lng: coords.lng,
    phone: listing.phone ?? null,
    priceTier: listing.priceTier,
    bookingUrl: listing.bookingUrl,
    website: listing.website ?? null,
  };

  if (existing) {
    const slug = existing.slug ?? (await uniqueSlug(listing.name));
    await prisma.provider.update({
      where: { id: existing.id },
      data: { ...fields, slug },
    });
    // Replace the service menu wholesale — listed services have no slots
    // or bookings attached, so this is safe.
    await prisma.service.deleteMany({ where: { providerId: existing.id } });
    for (const svc of listing.services) {
      await prisma.service.create({
        data: { providerId: existing.id, categoryId, ...svc },
      });
    }
    return "updated";
  }

  const provider = await prisma.provider.create({
    data: {
      name: listing.name,
      slug: await uniqueSlug(listing.name),
      source: "listed",
      ratingAvg: 0,
      ratingCount: 0,
      ...fields,
    },
  });
  for (const svc of listing.services) {
    await prisma.service.create({
      data: { providerId: provider.id, categoryId, ...svc },
    });
  }
  return "created";
}

async function main() {
  const dir = path.resolve(process.cwd(), "data", "wedge");
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    console.log("No data/wedge directory; nothing to sync.");
    return;
  }

  const counts = { created: 0, updated: 0, skipped: 0 };

  for (const file of files) {
    const parsed = JSON.parse(
      readFileSync(path.join(dir, file), "utf8")
    ) as WedgeFile;

    const category = await prisma.serviceCategory.findUnique({
      where: { slug: parsed._meta.categorySlug },
    });
    if (!category) {
      console.warn(
        `SKIP ${file}: category "${parsed._meta.categorySlug}" not in DB`
      );
      continue;
    }

    console.log(`Syncing ${file} (${parsed.listings.length} listings)...`);
    for (const listing of parsed.listings) {
      try {
        counts[await syncListing(listing, category.id)]++;
      } catch (e) {
        counts.skipped++;
        console.warn(`  SKIP ${listing.name}:`, e);
      }
    }
  }

  console.log(
    `Wedge sync done: ${counts.created} created, ${counts.updated} updated, ${counts.skipped} skipped.`
  );
}

main()
  .catch((e) => {
    // Directory content must never fail a deploy.
    console.error("Wedge sync error (non-fatal):", e);
  })
  .finally(() => prisma.$disconnect());
