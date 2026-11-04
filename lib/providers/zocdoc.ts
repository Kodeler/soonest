import { prisma } from "@/lib/db";
import { haversineKm } from "@/lib/geo";
import type {
  BookingProvider,
  BookingResult,
  ContactInfo,
  ProviderResult,
  SearchQuery,
  SlotResult,
  TimeRange,
} from "@/lib/types";

const SANDBOX_BASE = "https://api-developer-sandbox.zocdoc.com";

const US_HEALTH_SLUGS = new Set([
  "dentist",
  "doctor",
  "dermatologist",
  "optometrist",
  "psychiatrist",
  "therapist",
  "chiropractor",
  "osteopath",
  "physiotherapist",
  "primary-care",
]);

function isUSLocation(lat: number, lng: number): boolean {
  return lat >= 24.5 && lat <= 49.5 && lng >= -125 && lng <= -66.5;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${SANDBOX_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.ZOCDOC_CLIENT_ID,
      client_secret: process.env.ZOCDOC_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export class ZocdocBookingProvider implements BookingProvider {
  source = "zocdoc";

  async search(query: SearchQuery): Promise<ProviderResult[]> {
    if (!isUSLocation(query.lat, query.lng)) return [];
    if (query.categorySlug && !US_HEALTH_SLUGS.has(query.categorySlug))
      return [];

    try {
      const token = await getAccessToken();
      const params = new URLSearchParams({
        latitude: query.lat.toString(),
        longitude: query.lng.toString(),
        radius_miles: Math.round(query.radiusKm * 0.621371).toString(),
      });

      const res = await fetch(`${SANDBOX_BASE}/v1/providers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return [];
      const data = await res.json();
      const providers = data.providers || data.data || [];

      const results: ProviderResult[] = [];
      for (const p of providers) {
        const plat = p.location?.latitude || p.latitude;
        const plng = p.location?.longitude || p.longitude;
        if (!plat || !plng) continue;

        const dist = haversineKm(query.lat, query.lng, plat, plng);

        const availRes = await fetch(
          `${SANDBOX_BASE}/v1/provider_locations/${p.id}/availability?` +
            new URLSearchParams({
              start_date: new Date().toISOString().split("T")[0],
              end_date: new Date(Date.now() + 7 * 86400000)
                .toISOString()
                .split("T")[0],
            }),
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let soonestSlot: SlotResult | undefined;
        if (availRes.ok) {
          const availData = await availRes.json();
          const slots = availData.timeslots || availData.data || [];
          if (slots.length > 0) {
            const first = slots[0];
            soonestSlot = {
              id: `zocdoc-${p.id}-${first.start_time || first.startsAt}`,
              serviceId: `zocdoc-svc-${p.id}`,
              serviceName: p.specialty || "Appointment",
              startsAt: first.start_time || first.startsAt,
              endsAt:
                first.end_time ||
                new Date(
                  new Date(first.start_time || first.startsAt).getTime() +
                    30 * 60000
                ).toISOString(),
              source: "zocdoc",
            };
          }
        }

        results.push({
          id: `zocdoc-${p.id}`,
          name: p.name || p.display_name || "Provider",
          address: p.address || p.location?.address || "",
          lat: plat,
          lng: plng,
          ratingAvg: p.rating || 4.0,
          ratingCount: p.review_count || 0,
          priceTier: 2,
          source: "zocdoc",
          tier: "live",
          externalId: p.id?.toString(),
          npi: p.npi,
          services: [
            {
              id: `zocdoc-svc-${p.id}`,
              name: p.specialty || "Appointment",
              durationMin: 30,
              priceCents: 0,
              categorySlug: query.categorySlug || "doctor",
            },
          ],
          soonestSlot,
          distanceKm: Math.round(dist * 10) / 10,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  async getSlots(
    providerId: string,
    serviceId: string,
    range: TimeRange
  ): Promise<SlotResult[]> {
    if (!isUSLocation(0, 0)) return []; // Placeholder — real check at search time

    try {
      const token = await getAccessToken();
      const zocdocId = providerId.replace("zocdoc-", "");

      const res = await fetch(
        `${SANDBOX_BASE}/v1/provider_locations/${zocdocId}/availability?` +
          new URLSearchParams({
            start_date: range.start.toISOString().split("T")[0],
            end_date: range.end.toISOString().split("T")[0],
          }),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) return [];
      const data = await res.json();
      const timeslots = data.timeslots || data.data || [];

      return timeslots.map((s: Record<string, string>, i: number) => ({
        id: `zocdoc-slot-${zocdocId}-${i}`,
        serviceId,
        serviceName: "Appointment",
        startsAt: s.start_time || s.startsAt,
        endsAt:
          s.end_time ||
          new Date(
            new Date(s.start_time || s.startsAt).getTime() + 30 * 60000
          ).toISOString(),
        source: "zocdoc",
      }));
    } catch {
      return [];
    }
  }

  async book(slotId: string, contact: ContactInfo): Promise<BookingResult> {
    // Zocdoc meta-search: hand off to booking URL
    const parts = slotId.split("-");
    const zocdocId = parts[2];
    const bookingUrl = `https://www.zocdoc.com/doctor/${zocdocId}`;

    const booking = await prisma.booking.create({
      data: {
        slotId,
        source: "zocdoc",
        contactName: contact.name,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        status: "pending_redirect",
        bookingUrl,
      },
    });

    return {
      success: true,
      bookingId: booking.id,
      bookingUrl,
    };
  }
}
