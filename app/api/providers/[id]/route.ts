import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

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

    const slots = await prisma.slot.findMany({
      where: {
        service: { providerId: id },
        status: "open",
        startsAt: { gte: now, lte: weekFromNow },
      },
      orderBy: { startsAt: "asc" },
      include: { service: true },
    });

    return Response.json({
      provider: {
        ...provider,
        services: provider.services.map((s) => ({
          id: s.id,
          name: s.name,
          durationMin: s.durationMin,
          priceCents: s.priceCents,
          categorySlug: s.category.slug,
          categoryName: s.category.name,
        })),
      },
      slots: slots.map((s) => ({
        id: s.id,
        serviceId: s.serviceId,
        serviceName: s.service.name,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        source: provider.source,
      })),
      reviews: provider.reviews,
    });
  } catch (e) {
    console.error("Provider detail error:", e);
    return Response.json({ error: "Failed to load provider" }, { status: 500 });
  }
}
