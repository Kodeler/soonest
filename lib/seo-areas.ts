// Neighborhood definitions for the SEO landing pages. A provider belongs to
// an area when it sits within radiusKm of the area's center. Areas overlap
// on purpose: a shop on the Ossington strip legitimately belongs on both the
// Ossington and Trinity Bellwoods pages.

export interface Area {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  blurb: string;
}

export const TORONTO_AREAS: Area[] = [
  {
    slug: "queen-west",
    name: "Queen West",
    lat: 43.6468,
    lng: -79.4043,
    radiusKm: 1.3,
    blurb:
      "The Queen Street West strip from Spadina to Trinity Bellwoods — one of the densest runs of independent shops in the city.",
  },
  {
    slug: "ossington",
    name: "Ossington",
    lat: 43.649,
    lng: -79.4201,
    radiusKm: 1.2,
    blurb:
      "The Ossington strip and the surrounding Trinity Bellwoods blocks, from Queen up to Dundas.",
  },
  {
    slug: "dundas-west",
    name: "Dundas West",
    lat: 43.6501,
    lng: -79.4283,
    radiusKm: 1.3,
    blurb:
      "Dundas Street West through Little Portugal, between Ossington and Lansdowne.",
  },
  {
    slug: "kensington-chinatown",
    name: "Kensington & Chinatown",
    lat: 43.6529,
    lng: -79.4,
    radiusKm: 1.1,
    blurb:
      "Kensington Market, Chinatown and the Spadina corridor down to Queen.",
  },
  {
    slug: "king-west",
    name: "King West & Liberty Village",
    lat: 43.6421,
    lng: -79.4121,
    radiusKm: 1.4,
    blurb:
      "King Street West, Niagara and Liberty Village, from Bathurst out to Dufferin.",
  },
  {
    slug: "parkdale",
    name: "Parkdale",
    lat: 43.639,
    lng: -79.435,
    radiusKm: 1.3,
    blurb: "Queen West past Dufferin through Parkdale.",
  },
  {
    slug: "roncesvalles",
    name: "Roncesvalles",
    lat: 43.645,
    lng: -79.4485,
    radiusKm: 1.3,
    blurb: "Roncesvalles Avenue and the Dundas West junction around it.",
  },
  {
    slug: "little-italy",
    name: "Little Italy",
    lat: 43.6553,
    lng: -79.4138,
    radiusKm: 1.1,
    blurb: "College Street between Bathurst and Ossington.",
  },
  {
    slug: "the-junction",
    name: "The Junction",
    lat: 43.6654,
    lng: -79.4715,
    radiusKm: 1.6,
    blurb: "Dundas Street West through The Junction, west of Keele.",
  },
];

export interface CategoryLanding {
  // URL segment, chosen for search language rather than internal naming
  slug: string;
  // Internal ServiceCategory slug this landing maps to
  categorySlug: string;
  // "Barbershops" — used in headings
  plural: string;
  // "barbershop" — used in running copy
  singular: string;
  // schema.org type for JSON-LD
  schemaType: string;
}

export const CATEGORY_LANDINGS: CategoryLanding[] = [
  {
    slug: "barbers",
    categorySlug: "haircut",
    plural: "Barbershops",
    singular: "barbershop",
    schemaType: "BarberShop",
  },
  {
    slug: "nails",
    categorySlug: "nails",
    plural: "Nail salons",
    singular: "nail salon",
    schemaType: "NailSalon",
  },
  {
    slug: "massage",
    categorySlug: "massage",
    plural: "Massage clinics",
    singular: "massage clinic",
    schemaType: "HealthAndBeautyBusiness",
  },
];

export function getLanding(slug: string): CategoryLanding | undefined {
  return CATEGORY_LANDINGS.find((c) => c.slug === slug);
}

export function getArea(slug: string): Area | undefined {
  return TORONTO_AREAS.find((a) => a.slug === slug);
}
