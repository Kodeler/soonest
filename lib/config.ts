export const SEED_CITY = process.env.SEED_CITY || "Toronto";
export const SEED_LAT = parseFloat(process.env.SEED_LAT || "43.6532");
export const SEED_LNG = parseFloat(process.env.SEED_LNG || "-79.3832");

export const SQUARE_ENABLED =
  !!process.env.SQUARE_ACCESS_TOKEN && !!process.env.SQUARE_APPLICATION_ID;
export const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || "sandbox";

export const ZOCDOC_ENABLED =
  !!process.env.ZOCDOC_CLIENT_ID && !!process.env.ZOCDOC_CLIENT_SECRET;
export const ZOCDOC_ENV = process.env.ZOCDOC_ENV || "sandbox";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export const DEFAULT_SEARCH_RADIUS_KM = 25;

export const RANKING_WEIGHTS = {
  default: { time: 0.4, distance: 0.25, rating: 0.35, price: 0 },
  asap: { time: 0.7, distance: 0.2, rating: 0.1, price: 0 },
};
