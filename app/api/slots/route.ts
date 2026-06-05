import { NextRequest } from "next/server";
import { getRegistry } from "@/lib/providers/registry";
import { slotsSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = slotsSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { providerId, serviceId, startDate, endDate } = parsed.data;
    const registry = getRegistry();
    const slots = await registry.getSlots(providerId, serviceId, {
      start: new Date(startDate),
      end: new Date(endDate),
    });

    return Response.json({ slots });
  } catch (e) {
    console.error("Slots error:", e);
    return Response.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
