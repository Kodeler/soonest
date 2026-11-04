import { prisma } from "@/lib/db";

export const revalidate = 300;

// Honest, DB-derived numbers for the homepage. Sample listings are
// excluded from provider counts so the marketing never outruns reality;
// slot count covers the bookable (live-tier) inventory only.
export async function GET() {
  try {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);

    const [realProviders, liveProviders, openSlots] = await Promise.all([
      prisma.provider.count({ where: { source: { not: "mock" } } }),
      prisma.provider.count({
        where: { source: { notIn: ["mock", "listed"] } },
      }),
      prisma.slot.count({
        where: {
          status: "open",
          startsAt: { gte: now, lte: weekFromNow },
          service: { provider: { source: { not: "mock" } } },
        },
      }),
    ]);

    return Response.json({
      providers: realProviders,
      liveProviders,
      openSlots,
    });
  } catch {
    return Response.json({ providers: 0, liveProviders: 0, openSlots: 0 });
  }
}
