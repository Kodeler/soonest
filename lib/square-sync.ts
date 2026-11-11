// Syncs connected Square merchants into Provider/Service rows so search
// reads the DB instead of fanning out to Square on every query.
//
// For each SellerToken(source "square"): pull the merchant's locations and
// APPOINTMENTS_SERVICE catalog, then upsert one Provider per ACTIVE
// location (source "square", externalId = location id, externalSellerId =
// merchant id) with one Service per bookable item variation (externalId =
// service variation id, real duration and fixed price).
//
// Safety rules:
// - A merchant whose Square reads fail is left exactly as it was: we never
//   retire rows on partial data.
// - Locations that disappear (deactivated, or no bookable services left)
//   are retired so they stop appearing as live.
// - Ratings are always 0/0: Square gives us no authorized rating source.
// - One merchant failing never stops the others.
import type { Square } from "square";
import { prisma } from "@/lib/db";
import { makeSquareClient } from "@/lib/square-client";
import { listSquareSellers } from "@/lib/square-tokens";
import { categorizeServices, DEFAULT_CATEGORY_SLUG } from "@/lib/category-heuristic";
import {
  mapCatalogServicesForLocation,
  toUsableLocation,
  type MappedSquareService,
  type UsableLocation,
} from "@/lib/square-mapping";
import { uniqueSlug } from "@/lib/slug";

export interface SquareCatalogApi {
  listLocations(): Promise<Square.Location[]>;
  listAppointmentServices(): Promise<Square.CatalogObject[]>;
}

const MAX_CATALOG_PAGES = 50;

export function squareCatalogApi(accessToken: string): SquareCatalogApi {
  const client = makeSquareClient(accessToken);
  const opts = { timeoutInSeconds: 15, maxRetries: 1 };
  return {
    async listLocations() {
      const res = await client.locations.list(opts);
      return res.locations ?? [];
    },
    async listAppointmentServices() {
      const items: Square.CatalogObject[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < MAX_CATALOG_PAGES; page++) {
        const res = await client.catalog.searchItems(
          {
            productTypes: ["APPOINTMENTS_SERVICE"],
            archivedState: "ARCHIVED_STATE_NOT_ARCHIVED",
            limit: 100,
            cursor,
          },
          opts
        );
        items.push(...(res.items ?? []));
        cursor = res.cursor || undefined;
        if (!cursor) break;
      }
      return items;
    },
  };
}

export interface PlannedService extends MappedSquareService {
  categorySlug: string;
}

export interface PlannedLocation {
  location: UsableLocation;
  services: PlannedService[];
}

/**
 * Pure: which Providers/Services a merchant's Square data should produce.
 * Locations with no bookable services are omitted (nothing to search).
 */
export function planMerchantSync(
  locations: Square.Location[],
  items: Square.CatalogObject[]
): PlannedLocation[] {
  const plans: PlannedLocation[] = [];
  for (const raw of locations) {
    const location = toUsableLocation(raw);
    if (!location) continue;
    const mapped = mapCatalogServicesForLocation(items, location.id);
    if (mapped.length === 0) continue;
    const slugs = categorizeServices(mapped.map((s) => s.name));
    plans.push({
      location,
      services: mapped.map((s, i) => ({ ...s, categorySlug: slugs[i] })),
    });
  }
  return plans;
}

export interface MerchantSyncResult {
  merchantId: string;
  ok: boolean;
  providers: number;
  services: number;
  retired: number;
  error?: string;
}

export interface SquareSyncSummary {
  merchants: number;
  ok: number;
  failed: number;
  providers: number;
  services: number;
  retired: number;
  results: MerchantSyncResult[];
}

async function retireProvider(providerId: string): Promise<void> {
  // Square providers never own Slot rows, but guard anyway: a service with
  // history is kept rather than cascading into bookings.
  await prisma.service.deleteMany({
    where: { providerId, slots: { none: {} } },
  });
  const remaining = await prisma.service.count({ where: { providerId } });
  if (remaining === 0) {
    await prisma.provider.delete({ where: { id: providerId } }).catch(() => {});
  }
}

async function persistLocation(
  merchantId: string,
  plan: PlannedLocation,
  categoryIds: Map<string, string>
): Promise<{ providerId: string; services: number }> {
  const { location } = plan;
  const existing = await prisma.provider.findFirst({
    where: { source: "square", externalId: location.id },
    include: { services: { select: { id: true, externalId: true } } },
  });

  const fields = {
    name: location.name,
    address: location.address,
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
    website: location.website,
    externalSellerId: merchantId,
    bookingUrl: null,
    ratingAvg: 0,
    ratingCount: 0,
  };

  const isTaken = async (slug: string) =>
    !!(await prisma.provider.findUnique({ where: { slug }, select: { id: true } }));

  const provider = existing
    ? await prisma.provider.update({
        where: { id: existing.id },
        data: { ...fields, slug: existing.slug ?? (await uniqueSlug(location.name, isTaken)) },
      })
    : await prisma.provider.create({
        data: {
          ...fields,
          source: "square",
          externalId: location.id,
          slug: await uniqueSlug(location.name, isTaken),
        },
      });

  const byExternal = new Map(
    (existing?.services ?? [])
      .filter((s) => s.externalId)
      .map((s) => [s.externalId as string, s.id])
  );
  const fallbackCategory = categoryIds.get(DEFAULT_CATEGORY_SLUG);
  const keep = new Set<string>();
  let count = 0;

  for (const svc of plan.services) {
    const categoryId = categoryIds.get(svc.categorySlug) ?? fallbackCategory;
    if (!categoryId) continue;
    const data = {
      name: svc.name,
      durationMin: svc.durationMin,
      priceCents: svc.priceCents,
      categoryId,
    };
    const existingId = byExternal.get(svc.serviceVariationId);
    if (existingId) {
      await prisma.service.update({ where: { id: existingId }, data });
      keep.add(existingId);
    } else {
      const created = await prisma.service.create({
        data: { ...data, providerId: provider.id, externalId: svc.serviceVariationId },
      });
      keep.add(created.id);
    }
    count++;
  }

  const stale = (existing?.services ?? [])
    .map((s) => s.id)
    .filter((id) => !keep.has(id));
  if (stale.length > 0) {
    await prisma.service.deleteMany({
      where: { id: { in: stale }, slots: { none: {} } },
    });
  }

  return { providerId: provider.id, services: count };
}

export async function syncSquareMerchant(
  merchantId: string,
  api: SquareCatalogApi,
  categoryIds: Map<string, string>
): Promise<MerchantSyncResult> {
  const result: MerchantSyncResult = {
    merchantId,
    ok: false,
    providers: 0,
    services: 0,
    retired: 0,
  };

  let plans: PlannedLocation[];
  try {
    const [locations, items] = await Promise.all([
      api.listLocations(),
      api.listAppointmentServices(),
    ]);
    plans = planMerchantSync(locations, items);
  } catch (e) {
    // Read failure: leave this merchant's rows untouched.
    result.error = e instanceof Error ? e.message : String(e);
    return result;
  }

  const kept = new Set<string>();
  for (const plan of plans) {
    try {
      const { providerId, services } = await persistLocation(merchantId, plan, categoryIds);
      kept.add(providerId);
      result.providers++;
      result.services += services;
    } catch (e) {
      console.error(`Square sync: location ${plan.location.id} failed:`, e);
    }
  }

  // Retire this merchant's providers whose location no longer yields a
  // bookable, mappable listing.
  const stale = await prisma.provider.findMany({
    where: {
      source: "square",
      externalSellerId: merchantId,
      id: { notIn: [...kept] },
    },
    select: { id: true },
  });
  for (const p of stale) {
    await retireProvider(p.id);
    result.retired++;
  }

  result.ok = true;
  return result;
}

/**
 * Syncs every connected Square merchant (or just `merchantId`). Never
 * throws for a single merchant's failure; safe to call with zero sellers.
 */
export async function syncSquareMerchants(
  options: {
    merchantId?: string;
    apiFor?: (accessToken: string) => SquareCatalogApi;
  } = {}
): Promise<SquareSyncSummary> {
  const sellers = await listSquareSellers(new Date(), options.merchantId);
  const summary: SquareSyncSummary = {
    merchants: sellers.length,
    ok: 0,
    failed: 0,
    providers: 0,
    services: 0,
    retired: 0,
    results: [],
  };
  if (sellers.length === 0) return summary;

  const categories = await prisma.serviceCategory.findMany({
    select: { id: true, slug: true },
  });
  const categoryIds = new Map(categories.map((c) => [c.slug, c.id]));
  const apiFor = options.apiFor ?? squareCatalogApi;

  for (const seller of sellers) {
    const r = await syncSquareMerchant(seller.merchantId, apiFor(seller.accessToken), categoryIds);
    summary.results.push(r);
    if (r.ok) summary.ok++;
    else summary.failed++;
    summary.providers += r.providers;
    summary.services += r.services;
    summary.retired += r.retired;
  }
  return summary;
}
