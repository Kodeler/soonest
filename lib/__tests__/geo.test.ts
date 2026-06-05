import { describe, it, expect } from "vitest";
import { haversineKm } from "../geo";

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineKm(43.65, -79.38, 43.65, -79.38)).toBe(0);
  });

  it("returns correct distance for known points", () => {
    // Toronto to Hamilton is ~68 km
    const dist = haversineKm(43.6532, -79.3832, 43.2557, -79.8711);
    expect(dist).toBeGreaterThan(55);
    expect(dist).toBeLessThan(80);
  });

  it("is symmetric", () => {
    const ab = haversineKm(43.65, -79.38, 43.70, -79.40);
    const ba = haversineKm(43.70, -79.40, 43.65, -79.38);
    expect(ab).toBeCloseTo(ba);
  });
});
