import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";

const eventSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/),
  props: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid event" }, { status: 400 });
    }

    const propsJson = parsed.data.props
      ? JSON.stringify(parsed.data.props).slice(0, 2000)
      : null;

    await prisma.event.create({
      data: { name: parsed.data.name, propsJson },
    });

    return Response.json({ ok: true });
  } catch {
    // Never let analytics errors surface to the client as failures
    return Response.json({ ok: true });
  }
}
