import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const adapter =
  tursoUrl && tursoToken
    ? new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
    : new PrismaLibSql({ url: `file:${path.resolve(process.cwd(), "dev.db")}` });

const prisma = new PrismaClient({ adapter });

const SEED_LAT = parseFloat(process.env.SEED_LAT || "43.6532");
const SEED_LNG = parseFloat(process.env.SEED_LNG || "-79.3832");

const CATEGORIES = [
  { name: "Massage Therapy", slug: "massage", icon: "💆", vertical: "health" },
  { name: "Physiotherapy", slug: "physiotherapy", icon: "🏃", vertical: "health" },
  { name: "Osteopath", slug: "osteopath", icon: "🦴", vertical: "health" },
  { name: "Dentist", slug: "dentist", icon: "🦷", vertical: "health" },
  { name: "Haircut", slug: "haircut", icon: "✂️", vertical: "personal" },
  { name: "Nails", slug: "nails", icon: "💅", vertical: "personal" },
  { name: "Brows & Lashes", slug: "brows-lashes", icon: "👁️", vertical: "personal" },
  { name: "Tattoo", slug: "tattoo", icon: "🎨", vertical: "personal" },
  { name: "Mechanic", slug: "mechanic", icon: "🔧", vertical: "auto" },
  { name: "Chiropractor", slug: "chiropractor", icon: "🤲", vertical: "health" },
];

interface MockProvider {
  name: string;
  latOffset: number;
  lngOffset: number;
  ratingAvg: number;
  ratingCount: number;
  priceTier: number;
  categorySlug: string;
  services: { name: string; durationMin: number; priceCents: number }[];
  phone: string;
}

const PROVIDERS: MockProvider[] = [
  { name: "Serenity Massage Studio", latOffset: 0.005, lngOffset: -0.008, ratingAvg: 4.8, ratingCount: 312, priceTier: 2, categorySlug: "massage", services: [{ name: "Swedish Massage 60min", durationMin: 60, priceCents: 9500 }, { name: "Deep Tissue 90min", durationMin: 90, priceCents: 13000 }], phone: "(416) 555-0101" },
  { name: "Healing Hands RMT", latOffset: -0.012, lngOffset: 0.003, ratingAvg: 4.6, ratingCount: 187, priceTier: 2, categorySlug: "massage", services: [{ name: "Relaxation Massage", durationMin: 60, priceCents: 8500 }, { name: "Hot Stone Massage", durationMin: 75, priceCents: 11500 }], phone: "(416) 555-0102" },
  { name: "Core Balance Physio", latOffset: 0.018, lngOffset: -0.015, ratingAvg: 4.9, ratingCount: 420, priceTier: 3, categorySlug: "physiotherapy", services: [{ name: "Initial Assessment", durationMin: 60, priceCents: 12000 }, { name: "Follow-up Treatment", durationMin: 30, priceCents: 7500 }], phone: "(416) 555-0103" },
  { name: "Move Well Physiotherapy", latOffset: -0.008, lngOffset: 0.022, ratingAvg: 4.4, ratingCount: 95, priceTier: 2, categorySlug: "physiotherapy", services: [{ name: "Physio Assessment", durationMin: 45, priceCents: 10000 }, { name: "Rehab Session", durationMin: 30, priceCents: 7000 }], phone: "(416) 555-0104" },
  { name: "Align Osteopathy", latOffset: 0.01, lngOffset: 0.01, ratingAvg: 4.7, ratingCount: 156, priceTier: 3, categorySlug: "osteopath", services: [{ name: "Osteopathic Treatment", durationMin: 50, priceCents: 13000 }, { name: "Cranial Osteopathy", durationMin: 60, priceCents: 14500 }], phone: "(416) 555-0105" },
  { name: "Midtown Dental", latOffset: -0.003, lngOffset: -0.012, ratingAvg: 4.5, ratingCount: 534, priceTier: 3, categorySlug: "dentist", services: [{ name: "Cleaning & Check-up", durationMin: 45, priceCents: 25000 }, { name: "Whitening", durationMin: 60, priceCents: 45000 }], phone: "(416) 555-0106" },
  { name: "Smile Bright Dental", latOffset: 0.025, lngOffset: 0.005, ratingAvg: 4.3, ratingCount: 223, priceTier: 2, categorySlug: "dentist", services: [{ name: "Dental Exam", durationMin: 30, priceCents: 15000 }, { name: "Filling", durationMin: 45, priceCents: 20000 }], phone: "(416) 555-0107" },
  { name: "Sharp Cuts Barbershop", latOffset: -0.015, lngOffset: -0.005, ratingAvg: 4.8, ratingCount: 678, priceTier: 1, categorySlug: "haircut", services: [{ name: "Men's Haircut", durationMin: 30, priceCents: 3500 }, { name: "Beard Trim", durationMin: 15, priceCents: 1500 }], phone: "(416) 555-0108" },
  { name: "Luxe Hair Studio", latOffset: 0.002, lngOffset: 0.018, ratingAvg: 4.6, ratingCount: 445, priceTier: 3, categorySlug: "haircut", services: [{ name: "Cut & Style", durationMin: 45, priceCents: 7500 }, { name: "Color & Cut", durationMin: 120, priceCents: 18000 }], phone: "(416) 555-0109" },
  { name: "Bella's Hair Salon", latOffset: -0.02, lngOffset: 0.012, ratingAvg: 4.2, ratingCount: 89, priceTier: 2, categorySlug: "haircut", services: [{ name: "Women's Cut", durationMin: 45, priceCents: 5500 }, { name: "Blowout", durationMin: 30, priceCents: 3500 }], phone: "(416) 555-0110" },
  { name: "Polished Nail Bar", latOffset: 0.008, lngOffset: -0.02, ratingAvg: 4.7, ratingCount: 267, priceTier: 2, categorySlug: "nails", services: [{ name: "Gel Manicure", durationMin: 45, priceCents: 4500 }, { name: "Pedicure", durationMin: 60, priceCents: 5500 }], phone: "(416) 555-0111" },
  { name: "Nail Envy Studio", latOffset: -0.01, lngOffset: -0.018, ratingAvg: 4.4, ratingCount: 134, priceTier: 1, categorySlug: "nails", services: [{ name: "Classic Manicure", durationMin: 30, priceCents: 2500 }, { name: "Nail Art Set", durationMin: 75, priceCents: 6500 }], phone: "(416) 555-0112" },
  { name: "Arch & Lash Lounge", latOffset: 0.014, lngOffset: 0.008, ratingAvg: 4.9, ratingCount: 389, priceTier: 3, categorySlug: "brows-lashes", services: [{ name: "Lash Extensions Full Set", durationMin: 90, priceCents: 15000 }, { name: "Brow Lamination", durationMin: 45, priceCents: 7000 }], phone: "(416) 555-0113" },
  { name: "Brow Boss Studio", latOffset: -0.006, lngOffset: 0.015, ratingAvg: 4.5, ratingCount: 201, priceTier: 2, categorySlug: "brows-lashes", services: [{ name: "Microblading", durationMin: 120, priceCents: 35000 }, { name: "Brow Wax & Tint", durationMin: 30, priceCents: 4000 }], phone: "(416) 555-0114" },
  { name: "Inkwell Tattoo Parlour", latOffset: 0.022, lngOffset: -0.01, ratingAvg: 4.8, ratingCount: 512, priceTier: 3, categorySlug: "tattoo", services: [{ name: "Small Tattoo", durationMin: 60, priceCents: 15000 }, { name: "Custom Piece (per hour)", durationMin: 60, priceCents: 18000 }], phone: "(416) 555-0115" },
  { name: "Tiny Tats Studio", latOffset: -0.018, lngOffset: 0.007, ratingAvg: 4.3, ratingCount: 78, priceTier: 2, categorySlug: "tattoo", services: [{ name: "Flash Tattoo", durationMin: 30, priceCents: 8000 }, { name: "Fine Line Tattoo", durationMin: 45, priceCents: 12000 }], phone: "(416) 555-0116" },
  { name: "QuickFix Auto", latOffset: 0.03, lngOffset: -0.025, ratingAvg: 4.6, ratingCount: 345, priceTier: 2, categorySlug: "mechanic", services: [{ name: "Oil Change", durationMin: 30, priceCents: 6500 }, { name: "Brake Inspection", durationMin: 60, priceCents: 12000 }], phone: "(416) 555-0117" },
  { name: "Metro Auto Care", latOffset: -0.025, lngOffset: -0.02, ratingAvg: 4.1, ratingCount: 167, priceTier: 1, categorySlug: "mechanic", services: [{ name: "Tire Change", durationMin: 45, priceCents: 8000 }, { name: "Full Inspection", durationMin: 90, priceCents: 15000 }], phone: "(416) 555-0118" },
  { name: "Spine & Health Chiro", latOffset: 0.007, lngOffset: -0.003, ratingAvg: 4.7, ratingCount: 289, priceTier: 2, categorySlug: "chiropractor", services: [{ name: "Chiro Adjustment", durationMin: 30, priceCents: 7500 }, { name: "Initial Consultation", durationMin: 60, priceCents: 12000 }], phone: "(416) 555-0119" },
  { name: "Urban Wellness Chiro", latOffset: -0.004, lngOffset: 0.009, ratingAvg: 4.4, ratingCount: 112, priceTier: 2, categorySlug: "chiropractor", services: [{ name: "Adjustment", durationMin: 20, priceCents: 6500 }, { name: "Acupuncture Add-on", durationMin: 30, priceCents: 8500 }], phone: "(416) 555-0120" },
  { name: "Tranquil Touch Spa", latOffset: 0.016, lngOffset: 0.013, ratingAvg: 4.5, ratingCount: 198, priceTier: 3, categorySlug: "massage", services: [{ name: "Aromatherapy Massage", durationMin: 75, priceCents: 12500 }, { name: "Couples Massage", durationMin: 60, priceCents: 19000 }], phone: "(416) 555-0121" },
  { name: "The Wellness Collective", latOffset: -0.009, lngOffset: -0.007, ratingAvg: 4.8, ratingCount: 456, priceTier: 3, categorySlug: "osteopath", services: [{ name: "Visceral Osteopathy", durationMin: 50, priceCents: 14000 }, { name: "Sports Injury Treatment", durationMin: 60, priceCents: 15000 }], phone: "(416) 555-0122" },
  { name: "Fresh Fade Barbers", latOffset: 0.012, lngOffset: -0.016, ratingAvg: 4.9, ratingCount: 723, priceTier: 1, categorySlug: "haircut", services: [{ name: "Fade Haircut", durationMin: 30, priceCents: 3000 }, { name: "Kids Cut", durationMin: 20, priceCents: 2000 }], phone: "(416) 555-0123" },
  { name: "Gleam Nail Spa", latOffset: 0.019, lngOffset: 0.02, ratingAvg: 4.6, ratingCount: 178, priceTier: 2, categorySlug: "nails", services: [{ name: "Dip Powder Mani", durationMin: 50, priceCents: 5000 }, { name: "Spa Pedicure", durationMin: 60, priceCents: 6000 }], phone: "(416) 555-0124" },
  { name: "Precision Physio Clinic", latOffset: -0.016, lngOffset: 0.019, ratingAvg: 4.3, ratingCount: 67, priceTier: 2, categorySlug: "physiotherapy", services: [{ name: "Manual Therapy", durationMin: 30, priceCents: 7500 }, { name: "Shockwave Therapy", durationMin: 20, priceCents: 8500 }], phone: "(416) 555-0125" },
  { name: "Golden Smile Dentistry", latOffset: 0.004, lngOffset: -0.024, ratingAvg: 4.7, ratingCount: 398, priceTier: 3, categorySlug: "dentist", services: [{ name: "Dental Cleaning", durationMin: 45, priceCents: 22000 }, { name: "Crown", durationMin: 90, priceCents: 120000 }], phone: "(416) 555-0126" },
  { name: "Lash & Glow Beauty", latOffset: -0.022, lngOffset: -0.011, ratingAvg: 4.1, ratingCount: 56, priceTier: 1, categorySlug: "brows-lashes", services: [{ name: "Lash Lift & Tint", durationMin: 60, priceCents: 7500 }, { name: "Threading", durationMin: 15, priceCents: 1500 }], phone: "(416) 555-0127" },
  { name: "Road Ready Motors", latOffset: 0.028, lngOffset: 0.015, ratingAvg: 4.5, ratingCount: 234, priceTier: 2, categorySlug: "mechanic", services: [{ name: "Diagnostic Check", durationMin: 60, priceCents: 9500 }, { name: "AC Service", durationMin: 90, priceCents: 18000 }], phone: "(416) 555-0128" },
  { name: "Ink & Iron Tattoo", latOffset: -0.014, lngOffset: 0.025, ratingAvg: 4.6, ratingCount: 301, priceTier: 3, categorySlug: "tattoo", services: [{ name: "Consultation + Design", durationMin: 30, priceCents: 0 }, { name: "Full Sleeve Session", durationMin: 180, priceCents: 50000 }], phone: "(416) 555-0129" },
  { name: "Restore Chiropractic", latOffset: 0.009, lngOffset: -0.019, ratingAvg: 4.8, ratingCount: 567, priceTier: 3, categorySlug: "chiropractor", services: [{ name: "Full Spine Adjustment", durationMin: 30, priceCents: 8500 }, { name: "Posture Assessment", durationMin: 45, priceCents: 10000 }], phone: "(416) 555-0130" },
];

const REVIEW_TEMPLATES = [
  "Amazing experience! Will definitely come back.",
  "Very professional. Highly recommend.",
  "Good service, but the wait was a bit long.",
  "Excellent attention to detail. Five stars!",
  "Friendly staff, clean space. Great value.",
  "Went in for a quick visit, left feeling great.",
  "Best in the city, hands down.",
  "Solid experience. Nothing to complain about.",
  "A bit pricey but the quality shows.",
  "Booked last minute and they fit me in perfectly.",
];

function generateAddresses(providers: MockProvider[]): string[] {
  const streets = [
    "Queen St W", "Bloor St W", "King St E", "Dundas St W", "College St",
    "Yonge St", "Spadina Ave", "Bathurst St", "Ossington Ave", "Danforth Ave",
    "St Clair Ave W", "Eglinton Ave E", "Lawrence Ave W", "Dufferin St",
    "Broadview Ave", "Roncesvalles Ave", "Parliament St", "Church St",
    "Bay St", "University Ave", "Dupont St", "Annette St", "Gerrard St E",
    "Harbord St", "Davenport Rd", "Keele St", "Lansdowne Ave", "Pape Ave",
    "Coxwell Ave", "Woodbine Ave",
  ];

  return providers.map((_, i) => {
    const num = 100 + i * 37;
    return `${num} ${streets[i % streets.length]}`;
  });
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.review.deleteMany();
  await prisma.service.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.serviceCategory.deleteMany();

  const catMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const created = await prisma.serviceCategory.create({ data: cat });
    catMap.set(cat.slug, created.id);
  }

  const addresses = generateAddresses(PROVIDERS);
  const now = new Date();

  for (let i = 0; i < PROVIDERS.length; i++) {
    const p = PROVIDERS[i];
    const categoryId = catMap.get(p.categorySlug)!;

    const provider = await prisma.provider.create({
      data: {
        name: p.name,
        address: addresses[i],
        lat: SEED_LAT + p.latOffset,
        lng: SEED_LNG + p.lngOffset,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        priceTier: p.priceTier,
        source: "mock",
        phone: p.phone,
      },
    });

    for (const svc of p.services) {
      const service = await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId,
          name: svc.name,
          durationMin: svc.durationMin,
          priceCents: svc.priceCents,
        },
      });

      // Generate rolling slots: some starting very soon (0-3 hours) for ASAP
      const slotStarts: Date[] = [];

      // Near-term slots (next 0-4 hours, ~3 slots)
      for (let h = 0; h < 3; h++) {
        const minutesFromNow = 15 + Math.floor((i * 17 + h * 43) % 240);
        const start = new Date(now.getTime() + minutesFromNow * 60000);
        start.setSeconds(0, 0);
        start.setMinutes(Math.round(start.getMinutes() / 15) * 15);
        slotStarts.push(start);
      }

      // Today/tomorrow slots
      for (let d = 0; d < 3; d++) {
        for (let s = 0; s < 4; s++) {
          const day = new Date(now);
          day.setDate(day.getDate() + d);
          day.setHours(9 + s * 2 + (i % 3), (i * 15 + s * 30) % 60, 0, 0);
          if (day > now) slotStarts.push(day);
        }
      }

      // Next week slots
      for (let d = 3; d < 7; d++) {
        for (let s = 0; s < 3; s++) {
          const day = new Date(now);
          day.setDate(day.getDate() + d);
          day.setHours(10 + s * 3, 0, 0, 0);
          slotStarts.push(day);
        }
      }

      for (const start of slotStarts) {
        const end = new Date(start.getTime() + svc.durationMin * 60000);
        await prisma.slot.create({
          data: {
            serviceId: service.id,
            startsAt: start,
            endsAt: end,
            status: "open",
          },
        });
      }
    }

    // Generate reviews
    const numReviews = Math.min(5, Math.floor(p.ratingCount / 50) + 1);
    for (let r = 0; r < numReviews; r++) {
      const daysAgo = Math.floor((i * 7 + r * 13) % 90);
      await prisma.review.create({
        data: {
          providerId: provider.id,
          rating: Math.max(3, Math.min(5, p.ratingAvg + ((r % 3) - 1) * 0.5)),
          text: REVIEW_TEMPLATES[(i + r) % REVIEW_TEMPLATES.length],
          createdAt: new Date(now.getTime() - daysAgo * 86400000),
        },
      });
    }
  }

  const providerCount = await prisma.provider.count();
  const slotCount = await prisma.slot.count();
  const categoryCount = await prisma.serviceCategory.count();
  console.log(
    `Seeded ${providerCount} providers, ${slotCount} slots, ${categoryCount} categories`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
