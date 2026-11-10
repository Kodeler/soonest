import { NextRequest } from "next/server";
import { getRegistry } from "@/lib/providers/registry";
import { rankResults } from "@/lib/ranking";
import { RANKING_WEIGHTS } from "@/lib/config";
import { searchSchema } from "@/lib/validation";
import { logEvent } from "@/lib/events";
import { hideSamplesWhenCovered } from "@/lib/coverage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = searchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const query = parsed.data;
    const registry = getRegistry();
    const results = hideSamplesWhenCovered(await registry.search(query));
    const weights = query.asap
      ? RANKING_WEIGHTS.asap
      : RANKING_WEIGHTS.default;

    const ranked = rankResults(
      results,
      query.lat,
      query.lng,
      query.radiusKm,
      weights
    );

    logEvent("search", {
      category: query.categorySlug ?? null,
      keyword: query.keyword ? true : false,
      asap: query.asap,
      results: ranked.length,
      liveResults: ranked.filter((r) => r.tier === "live").length,
    });

    return Response.json({
      results: ranked,
      meta: {
        total: ranked.length,
        sources: registry.enabledSources,
        asap: query.asap,
      },
    });
  } catch (e) {
    console.error("Search error:", e);
    return Response.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
