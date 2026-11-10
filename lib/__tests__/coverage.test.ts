import { describe, it, expect } from "vitest";
import { hideSamplesWhenCovered } from "../coverage";
import type { ProviderResult } from "../types";

function p(id: string, source: string): ProviderResult {
  return {
    id,
    name: id,
    address: "x",
    lat: 0,
    lng: 0,
    ratingAvg: 0,
    ratingCount: 0,
    priceTier: 2,
    source,
    tier: source === "listed" ? "listed" : "live",
    services: [],
  };
}

describe("hideSamplesWhenCovered", () => {
  it("drops samples once real coverage meets the threshold", () => {
    const results = [
      ...Array.from({ length: 5 }, (_, i) => p(`real${i}`, "listed")),
      p("mock1", "mock"),
      p("mock2", "mock"),
    ];
    const out = hideSamplesWhenCovered(results);
    expect(out).toHaveLength(5);
    expect(out.every((r) => r.source !== "mock")).toBe(true);
  });

  it("keeps samples while real coverage is thin", () => {
    const results = [
      p("real1", "listed"),
      p("mock1", "mock"),
      p("mock2", "mock"),
    ];
    expect(hideSamplesWhenCovered(results)).toHaveLength(3);
  });
});
