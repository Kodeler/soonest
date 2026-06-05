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
  address: string;
  lat: number;
  lng: number;
  ratingAvg: number;
  ratingCount: number;
  priceTier: number;
  categorySlug: string;
  services: { name: string; durationMin: number; priceCents: number }[];
  phone: string;
}

const PROVIDERS: MockProvider[] = [
  // MASSAGE
  { name: "Serenity Massage Studio", address: "372 Queen St W", lat: 43.6490, lng: -79.3960, ratingAvg: 4.8, ratingCount: 312, priceTier: 2, categorySlug: "massage", services: [{ name: "Swedish Massage 60min", durationMin: 60, priceCents: 9500 }, { name: "Deep Tissue 90min", durationMin: 90, priceCents: 13000 }], phone: "(416) 555-0101" },
  { name: "Healing Hands RMT", address: "1920 Yonge St", lat: 43.6870, lng: -79.3920, ratingAvg: 4.6, ratingCount: 187, priceTier: 2, categorySlug: "massage", services: [{ name: "Relaxation Massage", durationMin: 60, priceCents: 8500 }, { name: "Hot Stone Massage", durationMin: 75, priceCents: 11500 }], phone: "(416) 555-0102" },
  { name: "Tranquil Touch Spa", address: "2300 Bloor St W", lat: 43.6510, lng: -79.4740, ratingAvg: 4.5, ratingCount: 198, priceTier: 3, categorySlug: "massage", services: [{ name: "Aromatherapy Massage", durationMin: 75, priceCents: 12500 }, { name: "Couples Massage", durationMin: 60, priceCents: 19000 }], phone: "(416) 555-0121" },
  { name: "Kensington Bodywork", address: "14 Kensington Ave", lat: 43.6545, lng: -79.4005, ratingAvg: 4.9, ratingCount: 89, priceTier: 2, categorySlug: "massage", services: [{ name: "Thai Massage", durationMin: 90, priceCents: 11000 }, { name: "Sports Massage", durationMin: 60, priceCents: 9000 }], phone: "(416) 555-0140" },
  { name: "Beaches Wellness RMT", address: "1978 Queen St E", lat: 43.6710, lng: -79.2950, ratingAvg: 4.7, ratingCount: 245, priceTier: 2, categorySlug: "massage", services: [{ name: "Prenatal Massage", durationMin: 60, priceCents: 9500 }, { name: "Cupping + Massage", durationMin: 75, priceCents: 12000 }], phone: "(416) 555-0141" },

  // PHYSIOTHERAPY
  { name: "Core Balance Physio", address: "110 King St E", lat: 43.6500, lng: -79.3730, ratingAvg: 4.9, ratingCount: 420, priceTier: 3, categorySlug: "physiotherapy", services: [{ name: "Initial Assessment", durationMin: 60, priceCents: 12000 }, { name: "Follow-up Treatment", durationMin: 30, priceCents: 7500 }], phone: "(416) 555-0103" },
  { name: "Move Well Physiotherapy", address: "790 Bay St", lat: 43.6610, lng: -79.3870, ratingAvg: 4.4, ratingCount: 95, priceTier: 2, categorySlug: "physiotherapy", services: [{ name: "Physio Assessment", durationMin: 45, priceCents: 10000 }, { name: "Rehab Session", durationMin: 30, priceCents: 7000 }], phone: "(416) 555-0104" },
  { name: "Precision Physio Clinic", address: "3080 Yonge St", lat: 43.7190, lng: -79.4000, ratingAvg: 4.3, ratingCount: 67, priceTier: 2, categorySlug: "physiotherapy", services: [{ name: "Manual Therapy", durationMin: 30, priceCents: 7500 }, { name: "Shockwave Therapy", durationMin: 20, priceCents: 8500 }], phone: "(416) 555-0125" },
  { name: "Junction Physio + Rehab", address: "2891 Dundas St W", lat: 43.6650, lng: -79.4680, ratingAvg: 4.6, ratingCount: 178, priceTier: 2, categorySlug: "physiotherapy", services: [{ name: "Vestibular Rehab", durationMin: 45, priceCents: 9500 }, { name: "Dry Needling", durationMin: 30, priceCents: 8000 }], phone: "(416) 555-0142" },
  { name: "Liberty Village Physio", address: "171 E Liberty St", lat: 43.6380, lng: -79.4175, ratingAvg: 4.8, ratingCount: 310, priceTier: 3, categorySlug: "physiotherapy", services: [{ name: "Sports Injury Rehab", durationMin: 45, priceCents: 10500 }, { name: "Post-Op Recovery", durationMin: 60, priceCents: 12000 }], phone: "(416) 555-0143" },

  // OSTEOPATH
  { name: "Align Osteopathy", address: "250 College St", lat: 43.6580, lng: -79.4020, ratingAvg: 4.7, ratingCount: 156, priceTier: 3, categorySlug: "osteopath", services: [{ name: "Osteopathic Treatment", durationMin: 50, priceCents: 13000 }, { name: "Cranial Osteopathy", durationMin: 60, priceCents: 14500 }], phone: "(416) 555-0105" },
  { name: "The Wellness Collective", address: "877 Annette St", lat: 43.6630, lng: -79.4555, ratingAvg: 4.8, ratingCount: 456, priceTier: 3, categorySlug: "osteopath", services: [{ name: "Visceral Osteopathy", durationMin: 50, priceCents: 14000 }, { name: "Sports Injury Treatment", durationMin: 60, priceCents: 15000 }], phone: "(416) 555-0122" },
  { name: "Danforth Osteo Clinic", address: "348 Danforth Ave", lat: 43.6780, lng: -79.3530, ratingAvg: 4.5, ratingCount: 112, priceTier: 2, categorySlug: "osteopath", services: [{ name: "Osteopathic Assessment", durationMin: 60, priceCents: 12000 }, { name: "Pediatric Osteopathy", durationMin: 40, priceCents: 11000 }], phone: "(416) 555-0144" },

  // DENTIST
  { name: "Midtown Dental", address: "284 Yonge St", lat: 43.6540, lng: -79.3810, ratingAvg: 4.5, ratingCount: 534, priceTier: 3, categorySlug: "dentist", services: [{ name: "Cleaning & Check-up", durationMin: 45, priceCents: 25000 }, { name: "Whitening", durationMin: 60, priceCents: 45000 }], phone: "(416) 555-0106" },
  { name: "Smile Bright Dental", address: "1849 Bayview Ave", lat: 43.7070, lng: -79.3750, ratingAvg: 4.3, ratingCount: 223, priceTier: 2, categorySlug: "dentist", services: [{ name: "Dental Exam", durationMin: 30, priceCents: 15000 }, { name: "Filling", durationMin: 45, priceCents: 20000 }], phone: "(416) 555-0107" },
  { name: "Golden Smile Dentistry", address: "1025 Keele St", lat: 43.6690, lng: -79.4640, ratingAvg: 4.7, ratingCount: 398, priceTier: 3, categorySlug: "dentist", services: [{ name: "Dental Cleaning", durationMin: 45, priceCents: 22000 }, { name: "Crown", durationMin: 90, priceCents: 120000 }], phone: "(416) 555-0126" },
  { name: "Leslieville Family Dental", address: "1101 Queen St E", lat: 43.6620, lng: -79.3310, ratingAvg: 4.6, ratingCount: 287, priceTier: 2, categorySlug: "dentist", services: [{ name: "New Patient Exam", durationMin: 60, priceCents: 18000 }, { name: "Root Canal", durationMin: 90, priceCents: 85000 }], phone: "(416) 555-0145" },
  { name: "Yorkville Dental Arts", address: "77 Bloor St W", lat: 43.6700, lng: -79.3900, ratingAvg: 4.8, ratingCount: 612, priceTier: 4, categorySlug: "dentist", services: [{ name: "Cosmetic Consultation", durationMin: 30, priceCents: 0 }, { name: "Invisalign Fitting", durationMin: 60, priceCents: 550000 }], phone: "(416) 555-0146" },

  // HAIRCUT
  { name: "Sharp Cuts Barbershop", address: "359 Bathurst St", lat: 43.6560, lng: -79.4110, ratingAvg: 4.8, ratingCount: 678, priceTier: 1, categorySlug: "haircut", services: [{ name: "Men's Haircut", durationMin: 30, priceCents: 3500 }, { name: "Beard Trim", durationMin: 15, priceCents: 1500 }], phone: "(416) 555-0108" },
  { name: "Luxe Hair Studio", address: "396 Ossington Ave", lat: 43.6530, lng: -79.4220, ratingAvg: 4.6, ratingCount: 445, priceTier: 3, categorySlug: "haircut", services: [{ name: "Cut & Style", durationMin: 45, priceCents: 7500 }, { name: "Color & Cut", durationMin: 120, priceCents: 18000 }], phone: "(416) 555-0109" },
  { name: "Bella's Hair Salon", address: "432 Danforth Ave", lat: 43.6780, lng: -79.3490, ratingAvg: 4.2, ratingCount: 89, priceTier: 2, categorySlug: "haircut", services: [{ name: "Women's Cut", durationMin: 45, priceCents: 5500 }, { name: "Blowout", durationMin: 30, priceCents: 3500 }], phone: "(416) 555-0110" },
  { name: "Fresh Fade Barbers", address: "914 Gerrard St E", lat: 43.6660, lng: -79.3390, ratingAvg: 4.9, ratingCount: 723, priceTier: 1, categorySlug: "haircut", services: [{ name: "Fade Haircut", durationMin: 30, priceCents: 3000 }, { name: "Kids Cut", durationMin: 20, priceCents: 2000 }], phone: "(416) 555-0123" },
  { name: "Roncesvalles Barber Co", address: "255 Roncesvalles Ave", lat: 43.6480, lng: -79.4500, ratingAvg: 4.7, ratingCount: 334, priceTier: 2, categorySlug: "haircut", services: [{ name: "Classic Cut", durationMin: 30, priceCents: 4000 }, { name: "Hot Towel Shave", durationMin: 30, priceCents: 3500 }], phone: "(416) 555-0147" },
  { name: "Queen West Hair Collective", address: "846 Queen St W", lat: 43.6450, lng: -79.4120, ratingAvg: 4.5, ratingCount: 201, priceTier: 3, categorySlug: "haircut", services: [{ name: "Balayage", durationMin: 150, priceCents: 25000 }, { name: "Trim & Style", durationMin: 30, priceCents: 5000 }], phone: "(416) 555-0148" },

  // NAILS
  { name: "Polished Nail Bar", address: "470 St Clair Ave W", lat: 43.6810, lng: -79.4180, ratingAvg: 4.7, ratingCount: 267, priceTier: 2, categorySlug: "nails", services: [{ name: "Gel Manicure", durationMin: 45, priceCents: 4500 }, { name: "Pedicure", durationMin: 60, priceCents: 5500 }], phone: "(416) 555-0111" },
  { name: "Nail Envy Studio", address: "507 Eglinton Ave E", lat: 43.7080, lng: -79.3770, ratingAvg: 4.4, ratingCount: 134, priceTier: 1, categorySlug: "nails", services: [{ name: "Classic Manicure", durationMin: 30, priceCents: 2500 }, { name: "Nail Art Set", durationMin: 75, priceCents: 6500 }], phone: "(416) 555-0112" },
  { name: "Gleam Nail Spa", address: "951 Harbord St", lat: 43.6560, lng: -79.4130, ratingAvg: 4.6, ratingCount: 178, priceTier: 2, categorySlug: "nails", services: [{ name: "Dip Powder Mani", durationMin: 50, priceCents: 5000 }, { name: "Spa Pedicure", durationMin: 60, priceCents: 6000 }], phone: "(416) 555-0124" },
  { name: "The Ten Spot Leslieville", address: "1080 Queen St E", lat: 43.6620, lng: -79.3340, ratingAvg: 4.5, ratingCount: 356, priceTier: 2, categorySlug: "nails", services: [{ name: "Express Mani", durationMin: 20, priceCents: 2500 }, { name: "Luxe Pedicure", durationMin: 50, priceCents: 7000 }], phone: "(416) 555-0149" },

  // BROWS & LASHES
  { name: "Arch & Lash Lounge", address: "544 Lawrence Ave W", lat: 43.7240, lng: -79.4330, ratingAvg: 4.9, ratingCount: 389, priceTier: 3, categorySlug: "brows-lashes", services: [{ name: "Lash Extensions Full Set", durationMin: 90, priceCents: 15000 }, { name: "Brow Lamination", durationMin: 45, priceCents: 7000 }], phone: "(416) 555-0113" },
  { name: "Brow Boss Studio", address: "581 Dufferin St", lat: 43.6550, lng: -79.4340, ratingAvg: 4.5, ratingCount: 201, priceTier: 2, categorySlug: "brows-lashes", services: [{ name: "Microblading", durationMin: 120, priceCents: 35000 }, { name: "Brow Wax & Tint", durationMin: 30, priceCents: 4000 }], phone: "(416) 555-0114" },
  { name: "Lash & Glow Beauty", address: "1136 Coxwell Ave", lat: 43.6890, lng: -79.3240, ratingAvg: 4.1, ratingCount: 56, priceTier: 1, categorySlug: "brows-lashes", services: [{ name: "Lash Lift & Tint", durationMin: 60, priceCents: 7500 }, { name: "Threading", durationMin: 15, priceCents: 1500 }], phone: "(416) 555-0127" },
  { name: "Studio Brow Yorkville", address: "100 Cumberland St", lat: 43.6710, lng: -79.3870, ratingAvg: 4.8, ratingCount: 445, priceTier: 3, categorySlug: "brows-lashes", services: [{ name: "Hybrid Lashes", durationMin: 75, priceCents: 12000 }, { name: "Brow Sculpt", durationMin: 30, priceCents: 5000 }], phone: "(416) 555-0150" },

  // TATTOO
  { name: "Inkwell Tattoo Parlour", address: "618 Broadview Ave", lat: 43.6680, lng: -79.3510, ratingAvg: 4.8, ratingCount: 512, priceTier: 3, categorySlug: "tattoo", services: [{ name: "Small Tattoo", durationMin: 60, priceCents: 15000 }, { name: "Custom Piece (per hour)", durationMin: 60, priceCents: 18000 }], phone: "(416) 555-0115" },
  { name: "Tiny Tats Studio", address: "1246 Dundas St W", lat: 43.6490, lng: -79.4280, ratingAvg: 4.3, ratingCount: 78, priceTier: 2, categorySlug: "tattoo", services: [{ name: "Flash Tattoo", durationMin: 30, priceCents: 8000 }, { name: "Fine Line Tattoo", durationMin: 45, priceCents: 12000 }], phone: "(416) 555-0116" },
  { name: "Ink & Iron Tattoo", address: "1509 Dundas St W", lat: 43.6500, lng: -79.4360, ratingAvg: 4.6, ratingCount: 301, priceTier: 3, categorySlug: "tattoo", services: [{ name: "Consultation + Design", durationMin: 30, priceCents: 0 }, { name: "Full Sleeve Session", durationMin: 180, priceCents: 50000 }], phone: "(416) 555-0129" },
  { name: "Passage Tattoo", address: "1129 College St", lat: 43.6540, lng: -79.4260, ratingAvg: 4.9, ratingCount: 634, priceTier: 3, categorySlug: "tattoo", services: [{ name: "Walk-in Flash", durationMin: 45, priceCents: 10000 }, { name: "Custom Illustrative", durationMin: 120, priceCents: 30000 }], phone: "(416) 555-0151" },

  // MECHANIC
  { name: "QuickFix Auto", address: "1540 Dupont St", lat: 43.6670, lng: -79.4510, ratingAvg: 4.6, ratingCount: 345, priceTier: 2, categorySlug: "mechanic", services: [{ name: "Oil Change", durationMin: 30, priceCents: 6500 }, { name: "Brake Inspection", durationMin: 60, priceCents: 12000 }], phone: "(416) 555-0117" },
  { name: "Metro Auto Care", address: "980 Lansdowne Ave", lat: 43.6610, lng: -79.4440, ratingAvg: 4.1, ratingCount: 167, priceTier: 1, categorySlug: "mechanic", services: [{ name: "Tire Change", durationMin: 45, priceCents: 8000 }, { name: "Full Inspection", durationMin: 90, priceCents: 15000 }], phone: "(416) 555-0118" },
  { name: "Road Ready Motors", address: "2655 Lawrence Ave E", lat: 43.7430, lng: -79.2700, ratingAvg: 4.5, ratingCount: 234, priceTier: 2, categorySlug: "mechanic", services: [{ name: "Diagnostic Check", durationMin: 60, priceCents: 9500 }, { name: "AC Service", durationMin: 90, priceCents: 18000 }], phone: "(416) 555-0128" },
  { name: "The Auto Shop TO", address: "45 Parliament St", lat: 43.6510, lng: -79.3630, ratingAvg: 4.4, ratingCount: 189, priceTier: 2, categorySlug: "mechanic", services: [{ name: "Winter Tire Swap", durationMin: 40, priceCents: 8000 }, { name: "Battery Replacement", durationMin: 30, priceCents: 15000 }], phone: "(416) 555-0152" },

  // CHIROPRACTOR
  { name: "Spine & Health Chiro", address: "766 Bay St", lat: 43.6600, lng: -79.3870, ratingAvg: 4.7, ratingCount: 289, priceTier: 2, categorySlug: "chiropractor", services: [{ name: "Chiro Adjustment", durationMin: 30, priceCents: 7500 }, { name: "Initial Consultation", durationMin: 60, priceCents: 12000 }], phone: "(416) 555-0119" },
  { name: "Urban Wellness Chiro", address: "803 University Ave", lat: 43.6560, lng: -79.3900, ratingAvg: 4.4, ratingCount: 112, priceTier: 2, categorySlug: "chiropractor", services: [{ name: "Adjustment", durationMin: 20, priceCents: 6500 }, { name: "Acupuncture Add-on", durationMin: 30, priceCents: 8500 }], phone: "(416) 555-0120" },
  { name: "Restore Chiropractic", address: "1173 Woodbine Ave", lat: 43.6880, lng: -79.3130, ratingAvg: 4.8, ratingCount: 567, priceTier: 3, categorySlug: "chiropractor", services: [{ name: "Full Spine Adjustment", durationMin: 30, priceCents: 8500 }, { name: "Posture Assessment", durationMin: 45, priceCents: 10000 }], phone: "(416) 555-0130" },
  { name: "King West Chiropractic", address: "500 King St W", lat: 43.6445, lng: -79.3970, ratingAvg: 4.6, ratingCount: 203, priceTier: 2, categorySlug: "chiropractor", services: [{ name: "Express Adjustment", durationMin: 15, priceCents: 5500 }, { name: "Soft Tissue Therapy", durationMin: 30, priceCents: 8000 }], phone: "(416) 555-0153" },
  { name: "Bloor Chiro & Wellness", address: "1098 Bloor St W", lat: 43.6600, lng: -79.4360, ratingAvg: 4.5, ratingCount: 145, priceTier: 2, categorySlug: "chiropractor", services: [{ name: "Chiro + Massage Combo", durationMin: 60, priceCents: 12000 }, { name: "Pediatric Chiro", durationMin: 20, priceCents: 6000 }], phone: "(416) 555-0154" },
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
  "Came back for the third time. Consistently great.",
  "New to the neighborhood and so glad I found this place.",
];

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

  const now = new Date();

  for (let i = 0; i < PROVIDERS.length; i++) {
    const p = PROVIDERS[i];
    const categoryId = catMap.get(p.categorySlug)!;

    const provider = await prisma.provider.create({
      data: {
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
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

      const slotStarts: Date[] = [];

      for (let h = 0; h < 3; h++) {
        const minutesFromNow = 15 + Math.floor((i * 17 + h * 43) % 240);
        const start = new Date(now.getTime() + minutesFromNow * 60000);
        start.setSeconds(0, 0);
        start.setMinutes(Math.round(start.getMinutes() / 15) * 15);
        slotStarts.push(start);
      }

      for (let d = 0; d < 3; d++) {
        for (let s = 0; s < 4; s++) {
          const day = new Date(now);
          day.setDate(day.getDate() + d);
          day.setHours(9 + s * 2 + (i % 3), (i * 15 + s * 30) % 60, 0, 0);
          if (day > now) slotStarts.push(day);
        }
      }

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
