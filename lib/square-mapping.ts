// Pure mapping from Square API shapes to Soonest's data model. No SDK
// runtime import (type-only), no DB, no network — so every rule here is
// unit-testable. Honesty rules live here too: a service that cannot be
// represented truthfully (no fixed price, no duration, not bookable) is
// dropped rather than shown with invented numbers.
import type { Square } from "square";
import type { SlotResult } from "@/lib/types";

export interface MappedSquareService {
  /** Square catalog item variation id — what availability is searched on. */
  serviceVariationId: string;
  name: string;
  durationMin: number;
  priceCents: number;
}

/** Square serviceDuration is milliseconds (bigint in the SDK). */
export function msToMinutes(
  ms: bigint | number | null | undefined
): number | null {
  if (ms === null || ms === undefined) return null;
  const n = typeof ms === "bigint" ? Number(ms) : ms;
  if (!Number.isFinite(n) || n <= 0) return null;
  const min = Math.round(n / 60000);
  return min > 0 ? min : null;
}

/**
 * Square Money.amount is already in the smallest currency unit (cents for
 * CAD). Returns null when there is no fixed price — variable-priced
 * services must not be rendered as "Free".
 */
export function moneyToCents(
  money: Square.Money | null | undefined
): number | null {
  if (!money || money.amount === null || money.amount === undefined) {
    return null;
  }
  const n = Number(money.amount);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/** Whether a catalog object is offered at the given Square location. */
export function isPresentAtLocation(
  obj: Pick<
    Square.CatalogObjectBase,
    "presentAtAllLocations" | "presentAtLocationIds" | "absentAtLocationIds"
  >,
  locationId: string
): boolean {
  // Square's default when presentAtAllLocations is unset is true.
  if (obj.presentAtAllLocations !== false) {
    return !(obj.absentAtLocationIds ?? []).includes(locationId);
  }
  return (obj.presentAtLocationIds ?? []).includes(locationId);
}

function variationDisplayName(itemName: string, variationName: string, siblings: number): string {
  const v = variationName.trim();
  if (siblings <= 1 || !v || /^regular$/i.test(v) || v.toLowerCase() === itemName.toLowerCase()) {
    return itemName;
  }
  return `${itemName} (${v})`;
}

/**
 * Maps one APPOINTMENTS_SERVICE catalog item to the bookable services it
 * offers at `locationId` — one per item variation, keyed by the variation
 * id (not the item id: availability is searched per variation).
 */
export function mapCatalogItemServices(
  item: Square.CatalogObject,
  locationId: string
): MappedSquareService[] {
  if (item.type !== "ITEM" || item.isDeleted) return [];
  const data = item.itemData;
  if (!data || data.isArchived) return [];
  if (data.productType && data.productType !== "APPOINTMENTS_SERVICE") return [];
  if (!isPresentAtLocation(item, locationId)) return [];

  const itemName = (data.name ?? "").trim();
  if (!itemName) return [];

  const variations = (data.variations ?? []).filter(
    (v): v is Square.CatalogObject.ItemVariation =>
      v.type === "ITEM_VARIATION" && !v.isDeleted
  );

  const out: MappedSquareService[] = [];
  for (const v of variations) {
    const vd = v.itemVariationData;
    if (!vd) continue;
    if (vd.availableForBooking === false) continue;
    if (!isPresentAtLocation(v, locationId)) continue;

    const durationMin = msToMinutes(vd.serviceDuration);
    if (durationMin === null) continue;

    // A per-location override beats the base pricing. Variable pricing
    // has no truthful number to show, so the service is skipped.
    const override = vd.locationOverrides?.find((o) => o.locationId === locationId);
    const pricingType = override?.pricingType ?? vd.pricingType;
    if (pricingType === "VARIABLE_PRICING") continue;
    const priceCents = moneyToCents(override?.priceMoney ?? vd.priceMoney);
    if (priceCents === null) continue;

    out.push({
      serviceVariationId: v.id,
      name: variationDisplayName(itemName, vd.name ?? "", variations.length),
      durationMin,
      priceCents,
    });
  }
  return out;
}

export function mapCatalogServicesForLocation(
  items: Square.CatalogObject[],
  locationId: string
): MappedSquareService[] {
  const seen = new Set<string>();
  const out: MappedSquareService[] = [];
  for (const item of items) {
    for (const svc of mapCatalogItemServices(item, locationId)) {
      if (seen.has(svc.serviceVariationId)) continue;
      seen.add(svc.serviceVariationId);
      out.push(svc);
    }
  }
  return out;
}

/** "68 Abell St #8, Toronto, ON" — same shape as the wedge directory data. */
export function formatSquareAddress(address: Square.Address | null | undefined): string {
  if (!address) return "";
  const street = [address.addressLine1, address.addressLine2]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  return [street, address.locality?.trim(), address.administrativeDistrictLevel1?.trim()]
    .filter(Boolean)
    .join(", ");
}

export interface UsableLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
}

/**
 * A Square location becomes a Provider only when it is ACTIVE and has
 * coordinates (we never geocode-guess a live provider's position).
 */
export function toUsableLocation(loc: Square.Location): UsableLocation | null {
  if (!loc.id) return null;
  if (loc.status && loc.status !== "ACTIVE") return null;
  const lat = loc.coordinates?.latitude;
  const lng = loc.coordinates?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = (loc.businessName || loc.name || "").trim();
  if (!name) return null;
  return {
    id: loc.id,
    name,
    address: formatSquareAddress(loc.address),
    lat,
    lng,
    phone: loc.phoneNumber?.trim() || null,
    website: loc.websiteUrl?.trim() || null,
  };
}

/**
 * Slot ids keep the legacy shape `square-slot-<locationId>-<i>-<startAt>`
 * because book() parses it (parts[2] = location, parts[4..] = startAt).
 */
export function squareSlotId(locationId: string, index: number, startAt: string): string {
  return `square-slot-${locationId}-${index}-${startAt}`;
}

export interface AvailabilitySlotContext {
  locationId: string;
  serviceId: string;
  serviceVariationId: string;
  serviceName: string;
  fallbackDurationMin: number;
}

/**
 * Converts Square availabilities into SlotResults: ISO timestamps (UTC,
 * as Square returns them; the UI formats in America/Toronto), real
 * durations from the appointment segment, one slot per start time (Square
 * returns one row per available team member), sorted, and clipped to
 * [rangeStart, rangeEnd). Nothing is ever synthesized.
 */
export function availabilitiesToSlots(
  availabilities: Square.Availability[] | null | undefined,
  ctx: AvailabilitySlotContext,
  rangeStart: Date,
  rangeEnd: Date
): SlotResult[] {
  const byStart = new Map<number, { startAt: string; durationMin: number }>();
  for (const a of availabilities ?? []) {
    if (!a.startAt) continue;
    if (a.locationId && a.locationId !== ctx.locationId) continue;
    const start = new Date(a.startAt);
    const t = start.getTime();
    if (!Number.isFinite(t)) continue;
    if (t < rangeStart.getTime() || t >= rangeEnd.getTime()) continue;
    if (byStart.has(t)) continue;

    const segments = a.appointmentSegments ?? [];
    const seg =
      segments.find((s) => s.serviceVariationId === ctx.serviceVariationId) ??
      segments[0];
    const segMin = seg?.durationMinutes;
    const durationMin =
      typeof segMin === "number" && segMin > 0 ? segMin : ctx.fallbackDurationMin;
    byStart.set(t, { startAt: start.toISOString(), durationMin });
  }

  return [...byStart.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, { startAt, durationMin }], i) => ({
      id: squareSlotId(ctx.locationId, i, startAt),
      serviceId: ctx.serviceId,
      serviceName: ctx.serviceName,
      startsAt: startAt,
      endsAt: new Date(t + durationMin * 60000).toISOString(),
      source: "square",
    }));
}

/**
 * Square's SearchAvailability requires a window of at least 24 hours (and
 * at most 32 days) starting no earlier than now. Returns the window to
 * query; callers clip results back to what they asked for.
 */
export function availabilityQueryWindow(
  start: Date,
  end: Date,
  now: Date = new Date()
): { start: Date; end: Date } | null {
  const DAY = 86400000;
  const s = new Date(Math.max(start.getTime(), now.getTime()));
  if (end.getTime() <= s.getTime()) return null;
  const minEnd = s.getTime() + DAY;
  const maxEnd = s.getTime() + 32 * DAY;
  const e = new Date(Math.min(Math.max(end.getTime(), minEnd), maxEnd));
  return { start: s, end: e };
}
