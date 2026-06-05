import { describe, it, expect } from "vitest";
import {
  rankResults,
  computeTimeScore,
  computeDistanceScore,
  computeRatingScore,
  computePriceScore,
} from "../ranking";
import type { ProviderResult, RankingWeights } from "../types";

describe("computeTimeScore", () => {
  const now = new Date("2025-01-15T10:00:00Z");
  const window = 7 * 24 * 60 * 60 * 1000;

  it("returns 1.0 for a slot within 30 minutes", () => {
    const slot = new Date(now.getTime() + 15 * 60000).toISOString();
    expect(computeTimeScore(slot, now, window)).toBe(1.0);
  });

  it("returns 1.0 for a slot exactly at 30 minutes", () => {
    const slot = new Date(now.getTime() + 30 * 60000).toISOString();
    expect(computeTimeScore(slot, now, window)).toBe(1.0);
  });

  it("returns between 0 and 1 for a slot later in the window", () => {
    const slot = new Date(now.getTime() + 3 * 86400000).toISOString();
    const score = computeTimeScore(slot, now, window);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("returns 0 for undefined slot", () => {
    expect(computeTimeScore(undefined, now, window)).toBe(0);
  });

  it("returns 0 for a slot beyond the window", () => {
    const slot = new Date(now.getTime() + 8 * 86400000).toISOString();
    expect(computeTimeScore(slot, now, window)).toBe(0);
  });
});

describe("computeDistanceScore", () => {
  it("returns 1.0 at distance 0", () => {
    expect(computeDistanceScore(0, 25)).toBe(1);
  });

  it("returns 0 at the radius edge", () => {
    expect(computeDistanceScore(25, 25)).toBe(0);
  });

  it("returns 0.5 at half the radius", () => {
    expect(computeDistanceScore(12.5, 25)).toBeCloseTo(0.5);
  });
});

describe("computeRatingScore", () => {
  it("gives low-review-count providers a dampened score", () => {
    const highCountScore = computeRatingScore(4.7, 400);
    const lowCountScore = computeRatingScore(5.0, 2);
    expect(highCountScore).toBeGreaterThan(lowCountScore);
  });

  it("returns close to raw rating for high review counts", () => {
    const score = computeRatingScore(4.5, 500);
    expect(score).toBeCloseTo(4.5 / 5, 1);
  });
});

describe("computePriceScore", () => {
  it("returns 1.0 for tier 1", () => {
    expect(computePriceScore(1)).toBe(1);
  });

  it("returns 0 for tier 4", () => {
    expect(computePriceScore(4)).toBe(0);
  });
});

describe("rankResults", () => {
  const defaultWeights: RankingWeights = {
    time: 0.4,
    distance: 0.25,
    rating: 0.35,
    price: 0,
  };

  const asapWeights: RankingWeights = {
    time: 0.7,
    distance: 0.2,
    rating: 0.1,
    price: 0,
  };

  const now = new Date("2025-01-15T10:00:00Z");

  function makeProvider(overrides: Partial<ProviderResult>): ProviderResult {
    return {
      id: "test",
      name: "Test Provider",
      address: "123 Test St",
      lat: 43.65,
      lng: -79.38,
      ratingAvg: 4.5,
      ratingCount: 100,
      priceTier: 2,
      source: "mock",
      services: [],
      ...overrides,
    };
  }

  it("ranks sooner slots higher in ASAP mode", () => {
    const results = [
      makeProvider({
        id: "far",
        soonestSlot: {
          id: "s1",
          serviceId: "svc1",
          serviceName: "Svc",
          startsAt: new Date(now.getTime() + 4 * 86400000).toISOString(),
          endsAt: new Date(now.getTime() + 4 * 86400000 + 3600000).toISOString(),
          source: "mock",
        },
        distanceKm: 1,
      }),
      makeProvider({
        id: "soon",
        soonestSlot: {
          id: "s2",
          serviceId: "svc2",
          serviceName: "Svc",
          startsAt: new Date(now.getTime() + 20 * 60000).toISOString(),
          endsAt: new Date(now.getTime() + 80 * 60000).toISOString(),
          source: "mock",
        },
        distanceKm: 10,
      }),
    ];

    const ranked = rankResults(results, 43.65, -79.38, 25, asapWeights, now);
    expect(ranked[0].id).toBe("soon");
  });

  it("balances time and rating in default mode", () => {
    const results = [
      makeProvider({
        id: "quick-low-rated",
        soonestSlot: {
          id: "s1",
          serviceId: "svc1",
          serviceName: "Svc",
          startsAt: new Date(now.getTime() + 15 * 60000).toISOString(),
          endsAt: new Date(now.getTime() + 75 * 60000).toISOString(),
          source: "mock",
        },
        ratingAvg: 3.0,
        ratingCount: 10,
        distanceKm: 5,
      }),
      makeProvider({
        id: "later-high-rated",
        soonestSlot: {
          id: "s2",
          serviceId: "svc2",
          serviceName: "Svc",
          startsAt: new Date(now.getTime() + 2 * 86400000).toISOString(),
          endsAt: new Date(now.getTime() + 2 * 86400000 + 3600000).toISOString(),
          source: "mock",
        },
        ratingAvg: 4.9,
        ratingCount: 500,
        distanceKm: 2,
      }),
    ];

    const ranked = rankResults(results, 43.65, -79.38, 25, defaultWeights, now);
    expect(ranked.length).toBe(2);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("never uses source in ranking", () => {
    const a = makeProvider({ id: "a", source: "mock", distanceKm: 5 });
    const b = makeProvider({ id: "b", source: "square", distanceKm: 5 });

    const rankedA = rankResults([a], 43.65, -79.38, 25, defaultWeights, now);
    const rankedB = rankResults([b], 43.65, -79.38, 25, defaultWeights, now);
    expect(rankedA[0].score).toBe(rankedB[0].score);
  });

  it("returns breakdown for each result", () => {
    const results = [
      makeProvider({
        id: "test",
        soonestSlot: {
          id: "s1",
          serviceId: "svc1",
          serviceName: "Svc",
          startsAt: new Date(now.getTime() + 60 * 60000).toISOString(),
          endsAt: new Date(now.getTime() + 120 * 60000).toISOString(),
          source: "mock",
        },
        distanceKm: 3,
      }),
    ];

    const ranked = rankResults(results, 43.65, -79.38, 25, defaultWeights, now);
    expect(ranked[0].breakdown).toBeDefined();
    expect(ranked[0].breakdown.timeScore).toBeGreaterThanOrEqual(0);
    expect(ranked[0].breakdown.distanceScore).toBeGreaterThanOrEqual(0);
    expect(ranked[0].rankingReason).toBeTruthy();
  });
});
