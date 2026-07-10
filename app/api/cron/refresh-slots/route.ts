import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Regenerates the rolling availability window for mock providers.
// Vercel cron hits this daily; without it, all seeded slots drift into
// the past and the demo looks dead. Booked slots are never touched —
// only open ones are dropped and regenerated.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const services = await prisma.service.findMany({
      where: { provider: { source: "mock" } },
      select: { id: true, durationMin: true, providerId: true },
    });

    await prisma.slot.deleteMany({
      where: {
        status: "open",
        service: { provider: { source: "mock" } },
      },
    });

    const now = new Date();
    let created = 0;

    for (let i = 0; i < services.length; i++) {
      const svc = services[i];
      const slotStarts: Date[] = [];

      // Near-term slots (next 0-4 hours) so ASAP always returns results
      for (let h = 0; h < 3; h++) {
        const minutesFromNow = 15 + Math.floor((i * 17 + h * 43) % 240);
        const start = new Date(now.getTime() + minutesFromNow * 60000);
        start.setSeconds(0, 0);
        start.setMinutes(Math.round(start.getMinutes() / 15) * 15);
        slotStarts.push(start);
      }

      // Today through day 3
      for (let d = 0; d < 3; d++) {
        for (let s = 0; s < 4; s++) {
          const day = new Date(now);
          day.setDate(day.getDate() + d);
          day.setHours(9 + s * 2 + (i % 3), (i * 15 + s * 30) % 60, 0, 0);
          if (day > now) slotStarts.push(day);
        }
      }

      // Days 3-7
      for (let d = 3; d < 7; d++) {
        for (let s = 0; s < 3; s++) {
          const day = new Date(now);
          day.setDate(day.getDate() + d);
          day.setHours(10 + s * 3, 0, 0, 0);
          slotStarts.push(day);
        }
      }

      for (const start of slotStarts) {
        await prisma.slot.create({
          data: {
            serviceId: svc.id,
            startsAt: start,
            endsAt: new Date(start.getTime() + svc.durationMin * 60000),
            status: "open",
          },
        });
        created++;
      }
    }

    return Response.json({ ok: true, services: services.length, created });
  } catch (e) {
    console.error("Slot refresh error:", e);
    return Response.json({ error: "Refresh failed" }, { status: 500 });
  }
}
