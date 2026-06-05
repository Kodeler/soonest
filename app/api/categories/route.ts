import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json({ categories });
  } catch (e) {
    console.error("Categories error:", e);
    return Response.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
