import { prisma } from "./db";
import { atTorontoTime } from "./tz";

export interface DayHours {
  open: string; // "09:00"
  close: string; // "17:00"
  closed: boolean;
}

// Regenerates the rolling 7-day slot window for a provider from its stored
// weekly hours. Only open slots are dropped — booked ones are never touched.
export async function regenerateSlotsForProvider(
  providerId: string
): Promise<number> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { services: true },
  });
  if (!provider?.hoursJson) return 0;

  let hours: DayHours[];
  try {
    hours = JSON.parse(provider.hoursJson);
  } catch {
    return 0;
  }
  if (!Array.isArray(hours) || hours.length !== 7) return 0;

  await prisma.slot.deleteMany({
    where: { status: "open", service: { providerId } },
  });

  const now = new Date();
  let created = 0;

  for (const svc of provider.services) {
    // Slot cadence: service duration, but at least every 30 minutes
    const stepMs = Math.max(30, svc.durationMin) * 60000;

    for (let d = 0; d < 7; d++) {
      // Stored weekly hours are Toronto wall-clock times; build the open and
      // close instants in that zone (the server runs in UTC).
      const probe = atTorontoTime(now, d, 12, 0);
      const dh =
        hours[
          new Date(
            probe.toLocaleString("en-US", { timeZone: "America/Toronto" })
          ).getDay()
        ];
      if (!dh || dh.closed) continue;

      const [oh, om] = dh.open.split(":").map(Number);
      const [ch, cm] = dh.close.split(":").map(Number);
      if ([oh, om, ch, cm].some((n) => Number.isNaN(n))) continue;

      const open = atTorontoTime(now, d, oh, om);
      const close = atTorontoTime(now, d, ch, cm);

      for (
        let t = open.getTime();
        t + svc.durationMin * 60000 <= close.getTime();
        t += stepMs
      ) {
        if (t <= now.getTime()) continue;
        await prisma.slot.create({
          data: {
            serviceId: svc.id,
            startsAt: new Date(t),
            endsAt: new Date(t + svc.durationMin * 60000),
            status: "open",
          },
        });
        created++;
      }
    }
  }

  return created;
}
