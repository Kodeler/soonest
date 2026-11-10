// Encodes/decodes search state in the /search URL so results are
// shareable and the browser back button works through searches.

export interface SearchQuery {
  lat: number;
  lng: number;
  radiusKm: number;
  categorySlug: string;
  keyword: string;
  asap: boolean;
}

export const DEFAULT_QUERY: SearchQuery = {
  lat: 43.6532,
  lng: -79.3832,
  radiusKm: 25,
  categorySlug: "",
  keyword: "",
  asap: false,
};

export function toQueryString(q: SearchQuery): string {
  const p = new URLSearchParams();
  if (q.categorySlug) p.set("cat", q.categorySlug);
  if (q.keyword) p.set("q", q.keyword);
  if (q.asap) p.set("asap", "1");
  if (
    Math.abs(q.lat - DEFAULT_QUERY.lat) > 1e-6 ||
    Math.abs(q.lng - DEFAULT_QUERY.lng) > 1e-6
  ) {
    p.set("lat", q.lat.toFixed(5));
    p.set("lng", q.lng.toFixed(5));
  }
  if (q.radiusKm !== DEFAULT_QUERY.radiusKm) p.set("r", String(q.radiusKm));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function num(v: string | null, fallback: number): number {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function fromSearchParams(sp: URLSearchParams): SearchQuery {
  return {
    lat: num(sp.get("lat"), DEFAULT_QUERY.lat),
    lng: num(sp.get("lng"), DEFAULT_QUERY.lng),
    radiusKm: num(sp.get("r"), DEFAULT_QUERY.radiusKm),
    categorySlug: sp.get("cat") ?? "",
    keyword: sp.get("q") ?? "",
    asap: sp.get("asap") === "1",
  };
}
