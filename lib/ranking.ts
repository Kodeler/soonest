import type { ProviderResult, RankedResult, RankingWeights } from "./types";

export function rankResults(
  results: ProviderResult[],
  userLat: number,
  userLng: number,
  radiusKm: number,
  weights: RankingWeights,
  now: Date = new Date()
): RankedResult[] {
  const windowMs = 7 * 24 * 60 * 60 * 1000;

  return results
    .map((r) => {
      const timeScore = computeTimeScore(r.soonestSlot?.startsAt, now, windowMs);
      const distanceScore = computeDistanceScore(r.distanceKm ?? radiusKm, radiusKm);
      const ratingScore = computeRatingScore(r.ratingAvg, r.ratingCount);
      const priceScore = computePriceScore(r.priceTier);

      const score =
        weights.time * timeScore +
        weights.distance * distanceScore +
        weights.rating * ratingScore +
        weights.price * priceScore;

      const breakdown = { timeScore, distanceScore, ratingScore, priceScore };
      const rankingReason = buildReason(breakdown, weights);

      return { ...r, score, breakdown, rankingReason };
    })
    .sort((a, b) => b.score - a.score);
}

export function computeTimeScore(
  startsAtIso: string | undefined,
  now: Date,
  windowMs: number
): number {
  if (!startsAtIso) return 0;
  const ms = new Date(startsAtIso).getTime() - now.getTime();
  if (ms < 0) return 1;
  if (ms <= 30 * 60 * 1000) return 1;
  return Math.max(0, 1 - ms / windowMs);
}

export function computeDistanceScore(
  distanceKm: number,
  radiusKm: number
): number {
  if (distanceKm <= 0) return 1;
  return Math.max(0, 1 - distanceKm / radiusKm);
}

export function computeRatingScore(
  ratingAvg: number,
  ratingCount: number
): number {
  const base = ratingAvg / 5;
  const confidence = Math.min(1, ratingCount / 50);
  const prior = 0.6;
  return prior * (1 - confidence) + base * confidence;
}

export function computePriceScore(priceTier: number): number {
  return Math.max(0, 1 - (priceTier - 1) / 3);
}

function buildReason(
  breakdown: RankedResult["breakdown"],
  weights: RankingWeights
): string {
  const factors: { label: string; contribution: number }[] = [
    { label: "Available soon", contribution: weights.time * breakdown.timeScore },
    { label: "Nearby", contribution: weights.distance * breakdown.distanceScore },
    { label: "Highly rated", contribution: weights.rating * breakdown.ratingScore },
    { label: "Great value", contribution: weights.price * breakdown.priceScore },
  ];

  const top = factors
    .filter((f) => f.contribution > 0.05)
    .sort((a, b) => b.contribution - a.contribution);

  if (top.length === 0) return "Best match";
  if (top.length === 1) return top[0].label;
  return `${top[0].label} · ${top[1].label}`;
}
