import { prisma } from "@/lib/db";
import { haversineKm } from "@/lib/geo";
import { sendBookingEmails } from "@/lib/notify";
import type {
  BookingProvider,
  BookingResult,
  ContactInfo,
  ProviderResult,
  SearchQuery,
  SlotResult,
  TimeRange,
} from "@/lib/types";

export class MockBookingProvider implements BookingProvider {
  source = "mock";

  async search(query: SearchQuery): Promise<ProviderResult[]> {
    // Serves every DB-resident provider: sample ("mock"), real managed
    // ("manual"), and directory entries ("listed"). The first two are live
    // tier (we hold their calendar); "listed" has no availability data and
    // books on the provider's own site.
    const providers = await prisma.provider.findMany({
      where: { source: { in: ["mock", "manual", "listed"] } },
      include: {
        services: { include: { category: true } },
      },
    });

    const now = new Date();
    const results: ProviderResult[] = [];

    for (const p of providers) {
      const dist = haversineKm(query.lat, query.lng, p.lat, p.lng);
      if (dist > query.radiusKm) continue;

      if (
        query.categorySlug &&
        !p.services.some((s) => s.category.slug === query.categorySlug)
      )
        continue;

      if (
        query.keyword &&
        !p.name.toLowerCase().includes(query.keyword.toLowerCase()) &&
        !p.services.some((s) =>
          s.name.toLowerCase().includes(query.keyword!.toLowerCase())
        )
      )
        continue;

      const relevantServices = query.categorySlug
        ? p.services.filter((s) => s.category.slug === query.categorySlug)
        : p.services;

      const isListed = p.source === "listed";

      const serviceIds = relevantServices.map((s) => s.id);
      const soonestSlot = isListed
        ? null
        : await prisma.slot.findFirst({
            where: {
              serviceId: { in: serviceIds },
              status: "open",
              startsAt: { gte: now },
            },
            orderBy: { startsAt: "asc" },
            include: { service: true },
          });

      results.push({
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        priceTier: p.priceTier,
        source: p.source,
        tier: isListed ? "listed" : "live",
        bookingUrl: p.bookingUrl ?? undefined,
        website: p.website ?? undefined,
        phone: p.phone ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        services: relevantServices.map((s) => ({
          id: s.id,
          name: s.name,
          durationMin: s.durationMin,
          priceCents: s.priceCents,
          categorySlug: s.category.slug,
        })),
        soonestSlot: soonestSlot
          ? {
              id: soonestSlot.id,
              serviceId: soonestSlot.serviceId,
              serviceName: soonestSlot.service.name,
              startsAt: soonestSlot.startsAt.toISOString(),
              endsAt: soonestSlot.endsAt.toISOString(),
              source: "mock",
            }
          : undefined,
        distanceKm: Math.round(dist * 10) / 10,
      });
    }

    return results;
  }

  async getSlots(
    providerId: string,
    serviceId: string,
    range: TimeRange
  ): Promise<SlotResult[]> {
    const slots = await prisma.slot.findMany({
      where: {
        serviceId,
        status: "open",
        startsAt: { gte: range.start },
        endsAt: { lte: range.end },
        service: { providerId },
      },
      orderBy: { startsAt: "asc" },
      include: { service: true },
    });

    return slots.map((s) => ({
      id: s.id,
      serviceId: s.serviceId,
      serviceName: s.service.name,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      source: "mock",
    }));
  }

  async book(slotId: string, contact: ContactInfo): Promise<BookingResult> {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { service: { include: { provider: true } } },
    });
    if (!slot || slot.status !== "open") {
      return { success: false, error: "Slot no longer available" };
    }

    // Simulate occasional "just taken" failures (10% chance) — sample
    // listings only. Real (manual) providers must never fake-fail.
    if (slot.service.provider.source === "mock" && Math.random() < 0.1) {
      await prisma.slot.update({
        where: { id: slotId },
        data: { status: "booked" },
      });
      return { success: false, error: "This slot was just taken" };
    }

    const booking = await prisma.$transaction(async (tx) => {
      await tx.slot.update({
        where: { id: slotId },
        data: { status: "booked" },
      });
      return tx.booking.create({
        data: {
          slotId,
          source: slot.service.provider.source,
          contactName: contact.name,
          contactPhone: contact.phone,
          contactEmail: contact.email,
          status: "confirmed",
        },
      });
    });

    // Real bookings notify everyone involved; sample bookings are demos
    // and must never email anyone. Awaited (not fire-and-forget) because
    // serverless may freeze the function right after the response.
    if (slot.service.provider.source !== "mock") {
      await sendBookingEmails({
        providerName: slot.service.provider.name,
        providerNotifyEmail: slot.service.provider.notifyEmail,
        serviceName: slot.service.name,
        startsAt: slot.startsAt,
        durationMin: slot.service.durationMin,
        customerName: contact.name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        bookingId: booking.id,
      });
    }

    return { success: true, bookingId: booking.id };
  }
}
