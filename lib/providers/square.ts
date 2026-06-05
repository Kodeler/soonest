import { Client, Environment } from "square";
import { haversineKm } from "@/lib/geo";
import { prisma } from "@/lib/db";
import type {
  BookingProvider,
  BookingResult,
  ContactInfo,
  ProviderResult,
  SearchQuery,
  SlotResult,
  TimeRange,
} from "@/lib/types";

function getClient(): Client {
  if (process.env.SQUARE_ENVIRONMENT === "production") {
    throw new Error("Square production is not allowed in this build");
  }
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
    environment: Environment.Sandbox,
  });
}

export class SquareBookingProvider implements BookingProvider {
  source = "square";

  async search(query: SearchQuery): Promise<ProviderResult[]> {
    const client = getClient();
    const results: ProviderResult[] = [];

    const tokens = await prisma.sellerToken.findMany({
      where: { source: "square" },
    });

    const allTokens = process.env.SQUARE_ACCESS_TOKEN
      ? [
          {
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
            externalSellerId: "default",
          },
          ...tokens,
        ]
      : tokens;

    for (const token of allTokens) {
      try {
        const sellerClient = new Client({
          accessToken: token.accessToken,
          environment: Environment.Sandbox,
        });

        const { result: locResult } = await sellerClient.locationsApi.listLocations();
        const locations = locResult.locations || [];

        for (const loc of locations) {
          if (!loc.coordinates?.latitude || !loc.coordinates?.longitude) continue;

          const dist = haversineKm(
            query.lat,
            query.lng,
            loc.coordinates.latitude,
            loc.coordinates.longitude
          );
          if (dist > query.radiusKm) continue;

          const { result: catResult } =
            await sellerClient.catalogApi.searchCatalogItems({
              productTypes: ["APPOINTMENTS_SERVICE"],
            });

          const items = catResult.items || [];
          const services = items.map((item) => ({
            id: item.id!,
            name: item.itemData?.name || "Service",
            durationMin: 60,
            priceCents: Number(
              item.itemData?.variations?.[0]?.itemVariationData?.priceMoney
                ?.amount || 0
            ),
            categorySlug: "other",
          }));

          results.push({
            id: `square-${loc.id}`,
            name: loc.businessName || loc.name || "Square Business",
            address: [loc.address?.addressLine1, loc.address?.locality]
              .filter(Boolean)
              .join(", "),
            lat: loc.coordinates.latitude,
            lng: loc.coordinates.longitude,
            ratingAvg: 4.0,
            ratingCount: 0,
            priceTier: 2,
            source: "square",
            externalId: loc.id,
            phone: loc.phoneNumber ?? undefined,
            services,
            distanceKm: Math.round(dist * 10) / 10,
          });
        }
      } catch {
        // Seller token may be invalid — skip silently
      }
    }

    return results;
  }

  async getSlots(
    providerId: string,
    serviceId: string,
    range: TimeRange
  ): Promise<SlotResult[]> {
    const client = getClient();
    const locationId = providerId.replace("square-", "");

    try {
      const { result } = await client.bookingsApi.searchAvailability({
        query: {
          filter: {
            startAtRange: {
              startAt: range.start.toISOString(),
              endAt: range.end.toISOString(),
            },
            locationId,
            segmentFilters: [{ serviceVariationId: serviceId }],
          },
        },
      });

      return (result.availabilities || []).map((a, i) => ({
        id: `square-slot-${locationId}-${i}-${a.startAt}`,
        serviceId,
        serviceName: "Service",
        startsAt: a.startAt!,
        endsAt: new Date(
          new Date(a.startAt!).getTime() + 60 * 60 * 1000
        ).toISOString(),
        source: "square",
      }));
    } catch {
      return [];
    }
  }

  async book(slotId: string, contact: ContactInfo): Promise<BookingResult> {
    if (process.env.SQUARE_ENVIRONMENT === "production") {
      return { success: false, error: "Production booking not allowed" };
    }

    const client = getClient();
    const parts = slotId.split("-");
    const locationId = parts[2];
    const startAt = parts.slice(4).join("-");

    try {
      const { result } = await client.bookingsApi.createBooking({
        booking: {
          locationId,
          startAt,
          customerId: undefined,
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
