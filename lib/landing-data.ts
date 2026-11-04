import { prisma } from "./db";
import { haversineKm } from "./geo";
import type { Area, CategoryLanding } from "./seo-areas";

export interface LandingProvider {
  id: string;
  slug: string | null;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  bookingUrl: string | null;
  priceTier: number;
  tier: "live" | "listed";
  distanceKm: number;
  services: { name: string; durationMin: number; priceCents: number }[];
}

// Real providers only — sample ("mock") listings never appear on SEO pages.
export async function getLandingProviders(
  landing: CategoryLanding,
  area?: Area
): Promise<LandingProvider[]> {
  const providers = await prisma.provider.findMany({
    where: {
      source: { not: "mock" },
      services: { some: { category: { slug: landing.categorySlug } } },
    },
    include: {
      services: {
        where: { category: { slug: landing.categorySlug } },
        orderBy: { priceCents: "asc" },
      },
    },
  });

  const results: LandingProvider[] = [];
  for (const p of providers) {
    const dist = area
      ? haversineKm(area.lat, area.lng, p.lat, p.lng)
      : 0;
    if (area && dist > area.radiusKm) continue;
    results.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      address: p.address,
      phone: p.phone,
      website: p.website,
      bookingUrl: p.bookingUrl,
      priceTier: p.priceTier,
      tier: p.source === "listed" ? "listed" : "live",
      distanceKm: Math.round(dist * 10) / 10,
      services: p.services.map((s) => ({
        name: s.name,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
      })),
    });
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}
