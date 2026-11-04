import type { MetadataRoute } from "next";
import { CATEGORY_LANDINGS, TORONTO_AREAS } from "@/lib/seo-areas";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://soonest.today";

export default function sitemap(): MetadataRoute.Sitemap {
  const landingPages: MetadataRoute.Sitemap = CATEGORY_LANDINGS.flatMap(
    (c) => [
      {
        url: `${BASE}/toronto/${c.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      ...TORONTO_AREAS.map((a) => ({
        url: `${BASE}/toronto/${c.slug}/${a.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ]
  );

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    ...landingPages,
    { url: `${BASE}/providers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
