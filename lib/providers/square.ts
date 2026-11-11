// Square adapter. Providers and services come from the DB, populated by
// lib/square-sync.ts (cron + OAuth callback) — search never lists Square
// locations or catalogs live. Availability IS read live, per merchant, with
// that merchant's own OAuth token and the service's real variation id.
//
// Honesty: a Square provider is live tier only because availability comes
// from this authorized read. On any error we show no availability for that
// provider (never stale or invented slots), and ratings are always 0/0.
import { haversineKm } from "@/lib/geo";
import { prisma } from "@/lib/db";
import { makeSquareClient } from "@/lib/square-client";
import { getSquareAccessToken, getSquareAccessTokens } from "@/lib/square-tokens";
import {
  availabilitiesToSlots,
  availabilityQueryWindow,
  type AvailabilitySlotContext,
} from "@/lib/square-mapping";
import type {
  BookingProvider,
  BookingResult,
  ContactInfo,
  ProviderResult,
  SearchQuery,
  SlotResult,
  TimeRange,
} from "@/lib/types";

const makeClient = makeSquareClient;

/** Providers per search that get a live soonest-slot read. */
export const MAX_SEARCH_PROVIDERS = 10;
/** Services probed per provider for its soonest slot. */
export const MAX_SERVICES_PER_PROVIDER = 3;
/** Services read for a provider detail view. */
export const MAX_DETAIL_SERVICES = 10;
const SOONEST_WINDOW_MS = 7 * 86400000;
const SEARCH_CALL_TIMEOUT_S = 5;
const SOONEST_CACHE_TTL_MS = 60_000;

// Short per-instance cache for soonest-slot reads so repeated searches
// don't hammer Square. Only successful reads are cached; an error is never
// remembered as "no availability".
const soonestCache = new Map<string, { at: number; slot: SlotResult | null }>();

function stripPrefix(providerId: string): string {
  return providerId.startsWith("square-") ? providerId.slice("square-".length) : providerId;
}

/**
 * One SearchAvailability read for one service at one location. Throws on
 * API/network failure; callers decide how to degrade.
 */
async function readServiceSlots(
  accessToken: string,
  ctx: AvailabilitySlotContext,
  range: TimeRange,
  timeoutInSeconds?: number,
  now: Date = new Date()
): Promise<SlotResult[]> {
  const window = availabilityQueryWindow(range.start, range.end, now);
  if (!window) return [];
  const client = makeClient(accessToken);
  const res = await client.bookings.searchAvailability(
    {
      query: {
        filter: {
          startAtRange: {
            startAt: window.start.toISOString(),
            endAt: window.end.toISOString(),
          },
          locationId: ctx.locationId,
          segmentFilters: [{ serviceVariationId: ctx.serviceVariationId }],
        },
      },
    },
    { timeoutInSeconds: timeoutInSeconds ?? 10, maxRetries: 0 }
  );
  // Clip back to what the caller asked for (the window may be widened to
  // Square's 24h minimum).
  return availabilitiesToSlots(
    res.availabilities,
    ctx,
    window.start,
    new Date(Math.min(range.end.getTime(), window.end.getTime()))
  );
}

async function soonestForService(
  accessToken: string,
  ctx: AvailabilitySlotContext,
  now: Date
): Promise<SlotResult | null> {
  const key = `${ctx.locationId}|${ctx.serviceVariationId}`;
  const hit = soonestCache.get(key);
  if (hit && now.getTime() - hit.at < SOONEST_CACHE_TTL_MS) {
    // Re-check the cached slot hasn't started yet.
    if (!hit.slot || new Date(hit.slot.startsAt) > now) return hit.slot;
  }
  const slots = await readServiceSlots(
    accessToken,
    ctx,
    { start: now, end: new Date(now.getTime() + SOONEST_WINDOW_MS) },
    SEARCH_CALL_TIMEOUT_S,
    now
  );
  const slot = slots[0] ?? null;
  soonestCache.set(key, { at: now.getTime(), slot });
  return slot;
}

export class SquareBookingProvider implements BookingProvider {
  source = "square";

  async search(query: SearchQuery): Promise<ProviderResult[]> {
    const providers = await prisma.provider.findMany({
      where: { source: "square" },
      include: { services: { include: { category: true } } },
    });
    if (providers.length === 0) return [];

    const keyword = query.keyword?.toLowerCase();
    const candidates: { result: ProviderResult; probe: AvailabilitySlotContext[]; merchantId: string | null }[] = [];

    for (const p of providers) {
      const dist = haversineKm(query.lat, query.lng, p.lat, p.lng);
      if (dist > query.radiusKm) continue;

      const relevant = query.categorySlug
        ? p.services.filter((s) => s.category.slug === query.categorySlug)
        : p.services;
      if (relevant.length === 0) continue;

      if (
        keyword &&
        !p.name.toLowerCase().includes(keyword) &&
        !p.services.some((s) => s.name.toLowerCase().includes(keyword))
      )
        continue;

      // Shortest services first: they fit the most calendar gaps, so they
      // surface the earliest real opening.
      const probe = relevant
        .filter((s) => s.externalId && p.externalId)
        .sort((a, b) => a.durationMin - b.durationMin)
        .slice(0, MAX_SERVICES_PER_PROVIDER)
        .map((s) => ({
          locationId: p.externalId as string,
          serviceId: s.id,
          serviceVariationId: s.externalId as string,
          serviceName: s.name,
          fallbackDurationMin: s.durationMin,
        }));

      candidates.push({
        merchantId: p.externalSellerId,
        probe,
        result: {
          id: p.id,
          name: p.name,
          address: p.address,
          lat: p.lat,
          lng: p.lng,
          ratingAvg: 0,
          ratingCount: 0,
          priceTier: p.priceTier,
          source: "square",
          tier: "live",
          externalId: p.externalId ?? undefined,
          phone: p.phone ?? undefined,
          website: p.website ?? undefined,
          imageUrl: p.imageUrl ?? undefined,
          services: relevant.map((s) => ({
            id: s.id,
            name: s.name,
            durationMin: s.durationMin,
            priceCents: s.priceCents,
            categorySlug: s.category.slug,
          })),
          distanceKm: Math.round(dist * 10) / 10,
        },
      });
    }

    if (candidates.length === 0) return [];

    // Live reads only for the nearest few; the rest are still real live
    // providers, just without a soonest slot on this search.
    const toProbe = [...candidates]
      .sort((a, b) => (a.result.distanceKm ?? 0) - (b.result.distanceKm ?? 0))
      .slice(0, MAX_SEARCH_PROVIDERS);

    const tokens = await getSquareAccessTokens(
      toProbe.map((c) => c.merchantId).filter((m): m is string => !!m)
    );
    const now = new Date();

    await Promise.all(
      toProbe.map(async (c) => {
        const token = c.merchantId ? tokens.get(c.merchantId) : undefined;
        if (!token || c.probe.length === 0) return;
        const found = await Promise.all(
          c.probe.map((ctx) =>
            soonestForService(token, ctx, now).catch(() => null)
          )
        );
        const earliest = found
          .filter((s): s is SlotResult => !!s)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
        if (earliest) c.result.soonestSlot = earliest;
      })
    );

    return candidates.map((c) => c.result);
  }

  async getSlots(
    providerId: string,
    serviceId: string,
    range: TimeRange
  ): Promise<SlotResult[]> {
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        providerId: stripPrefix(providerId),
        provider: { source: "square" },
      },
      include: { provider: true },
    });
    if (!service?.externalId || !service.provider.externalId) return [];

    const token = await getSquareAccessToken(service.provider.externalSellerId);
    if (!token) return [];

    try {
      return await readServiceSlots(
        token,
        {
          locationId: service.provider.externalId,
          serviceId: service.id,
          serviceVariationId: service.externalId,
          serviceName: service.name,
          fallbackDurationMin: service.durationMin,
        },
        range
      );
    } catch (e) {
      console.error(`Square availability failed for provider ${service.providerId}:`, e);
      return [];
    }
  }

  /**
   * All open slots for a provider's services in `range` (detail view).
   * A service whose read fails contributes nothing.
   */
  async getProviderSlots(providerId: string, range: TimeRange): Promise<SlotResult[]> {
    const services = await prisma.service.findMany({
      where: { providerId: stripPrefix(providerId), provider: { source: "square" } },
      select: { id: true },
      orderBy: { durationMin: "asc" },
      take: MAX_DETAIL_SERVICES,
    });
    const all = await Promise.all(
      services.map((s) => this.getSlots(providerId, s.id, range))
    );
    return all.flat().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async book(slotId: string, contact: ContactInfo): Promise<BookingResult> {
    // Booking writes stay sandbox-only until the create-booking payload is
    // production-grade (service variation, team member, customer id). We
    // never fire a half-built write at a real merchant's calendar.
    if (process.env.SQUARE_ENVIRONMENT === "production") {
      return { success: false, error: "Production booking not allowed" };
    }
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      return { success: false, error: "Square not configured" };
    }

    const client = makeClient(process.env.SQUARE_ACCESS_TOKEN);
    const parts = slotId.split("-");
    const locationId = parts[2];
    const startAt = parts.slice(4).join("-");

    try {
      await client.bookings.create({
        booking: {
          locationId,
          startAt,
          appointmentSegments: [],
        },
        idempotencyKey: slotId,
      });

      const booking = await prisma.booking.create({
        data: {
          slotId,
          source: "square",
          contactName: contact.name,
          contactPhone: contact.phone,
          contactEmail: contact.email,
          status: "confirmed",
        },
      });

      return { success: true, bookingId: booking.id };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Booking failed";
      return { success: false, error: msg };
    }
  }
}
