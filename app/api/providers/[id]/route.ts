import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { SquareBookingProvider } from "@/lib/providers/square";
import type { SlotResult } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        services: { include: { category: true } },
        reviews: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!provider) {
      return Response.json({ error: "Provider not found" }, { status: 404 });
    }

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);

    // Square-synced providers hold no Slot rows: their availability is read
    // live from the merchant's Square calendar (empty on any error).
    const slotResults: SlotResult[] =
      provider.source === "square"
        ? process.env.SQUARE_APPLICATION_ID
          ? await new SquareBookingProvider().getProviderSlots(id, {
              start: now,
              end: weekFromNow,
            })
          : []
        : (
            await prisma.slot.findMany({
              where: {
                service: { providerId: id },
                status: "open",
                startsAt: { gte: now, lte: weekFromNow },
              },
              orderBy: { startsAt: "asc" },
              include: { service: true },
            })
          ).map((s) => ({
            id: s.id,
            serviceId: s.serviceId,
            serviceName: s.service.name,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
            source: provider.source,
          }));

    logEvent("provider_viewed", {
      providerId: id,
      source: provider.source,
      tier: provider.source === "listed" ? "listed" : "live",
    });

    // Internal routing fields stay server-side.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { externalSellerId, notifyEmail, ...publicProvider } = provider;

    return Response.json({
      provider: {
        ...publicProvider,
        tier: provider.source === "listed" ? "listed" : "live",
        services: provider.services.map((s) => ({
          id: s.id,
          name: s.name,
          durationMin: s.durationMin,
          priceCents: s.priceCents,
          categorySlug: s.category.slug,
          categoryName: s.category.name,
        })),
      },
      slots: slotResults,
      reviews: provider.reviews,
    });
  } catch (e) {
    console.error("Provider detail error:", e);
    return Response.json({ error: "Failed to load provider" }, { status: 500 });
  }
}
