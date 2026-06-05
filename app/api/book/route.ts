import { NextRequest } from "next/server";
import { getRegistry } from "@/lib/providers/registry";
import { bookSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bookSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { slotId, name, phone, email } = parsed.data;
    const registry = getRegistry();
    const result = await registry.book(slotId, { name, phone, email });

    if (!result.success) {
      return Response.json(
        { error: result.error, slotTaken: true },
        { status: 409 }
      );
    }

    return Response.json(result);
  } catch (e) {
    console.error("Booking error:", e);
    return Response.json({ error: "Booking failed" }, { status: 500 });
  }
}
