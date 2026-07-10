import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { leadSchema } from "@/lib/validation";

// Admin: list leads. Auth via the same secret that protects the cron route.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const leads = await prisma.providerLead.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ leads });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const lead = await prisma.providerLead.create({
      data: parsed.data,
    });

    return Response.json({ ok: true, id: lead.id });
  } catch (e) {
    console.error("Lead error:", e);
    return Response.json({ error: "Submission failed" }, { status: 500 });
  }
}
