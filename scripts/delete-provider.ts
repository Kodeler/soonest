// Deletes a provider (and its services/slots/reviews) by exact name.
// Usage: npx tsx scripts/delete-provider.ts "Provider Name"
// Respects TURSO_DATABASE_URL/TURSO_AUTH_TOKEN like the seed script.
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

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error("Usage: npx tsx scripts/delete-provider.ts \"Provider Name\"");
    process.exit(1);
  }
  const p = await prisma.provider.findFirst({ where: { name } });
  if (!p) {
    console.log(`No provider named "${name}"`);
    return;
  }
  const slotIds = (
    await prisma.slot.findMany({
      where: { service: { providerId: p.id } },
      select: { id: true },
    })
  ).map((s) => s.id);
  await prisma.booking.deleteMany({ where: { slotId: { in: slotIds } } });
  await prisma.slot.deleteMany({ where: { service: { providerId: p.id } } });
  await prisma.review.deleteMany({ where: { providerId: p.id } });
  await prisma.service.deleteMany({ where: { providerId: p.id } });
  await prisma.provider.delete({ where: { id: p.id } });
  console.log(`Deleted "${name}" (${p.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
