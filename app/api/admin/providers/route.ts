import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { regenerateSlotsForProvider } from "@/lib/slots";
import { slugify } from "@/lib/slug";

const dayHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

const adminProviderSchema = z
  .object({
    name: z.string().min(1).max(200),
    address: z.string().min(1).max(300),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    phone: z.string().max(40).optional(),
    priceTier: z.number().int().min(1).max(4).default(2),
    categorySlug: z.string().min(1),
    services: z
      .array(
        z.object({
          name: z.string().min(1).max(200),
          durationMin: z.number().int().min(5).max(480),
          priceCents: z.number().int().min(0).max(10000000),
        })
      )
      .min(1)
      .max(5),
    // "live": we manage the calendar (hours required, slots generated).
    // "listed": directory entry; booking happens on the provider's own
    // site (bookingUrl required, no slots are ever created).
    listingType: z.enum(["live", "listed"]).default("live"),
    hours: z.array(dayHoursSchema).length(7).optional(),
    bookingUrl: z.string().url().max(500).optional(),
    website: z.string().url().max(500).optional(),
  })
  .refine((d) => d.listingType !== "live" || !!d.hours, {
    message: "Live listings require weekly hours",
    path: ["hours"],
  })
  .refine((d) => d.listingType !== "listed" || !!d.bookingUrl, {
    message: "Listed providers require a bookingUrl",
    path: ["bookingUrl"],
  });

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = adminProviderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const category = await prisma.serviceCategory.findUnique({
      where: { slug: data.categorySlug },
    });
    if (!category) {
      return Response.json({ error: "Unknown category" }, { status: 400 });
    }

    const isListed = data.listingType === "listed";

    let slug: string | null = slugify(data.name) || null;
    if (slug && (await prisma.provider.findUnique({ where: { slug } }))) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        slug,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        priceTier: data.priceTier,
        source: isListed ? "listed" : "manual",
        ratingAvg: 0,
        ratingCount: 0,
        hoursJson: !isListed && data.hours ? JSON.stringify(data.hours) : null,
        bookingUrl: data.bookingUrl ?? null,
        website: data.website ?? null,
      },
    });

    for (const svc of data.services) {
      await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId: category.id,
          name: svc.name,
          durationMin: svc.durationMin,
          priceCents: svc.priceCents,
        },
      });
    }

    const slots = isListed ? 0 : await regenerateSlotsForProvider(provider.id);

    return Response.json({
      ok: true,
      id: provider.id,
      slots,
      tier: data.listingType,
    });
  } catch (e) {
    console.error("Admin provider error:", e);
    return Response.json({ error: "Creation failed" }, { status: 500 });
  }
}
