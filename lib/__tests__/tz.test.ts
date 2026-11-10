import { describe, it, expect } from "vitest";
import { atTorontoTime, torontoHour } from "../tz";

describe("Toronto time helpers", () => {
  it("builds instants at the requested Toronto wall-clock hour", () => {
    // 1:00 AM Toronto on a November date is 06:00 UTC (EST, UTC-5)
    const base = new Date("2026-11-10T06:00:00Z");
    const nineAm = atTorontoTime(base, 0, 9, 30);
    expect(torontoHour(nineAm)).toBe(9);
    expect(nineAm.getUTCMinutes()).toBe(30);
    expect(nineAm.toISOString()).toBe("2026-11-10T14:30:00.000Z");
  });

  it("lands on the right Toronto day when days are added", () => {
    const base = new Date("2026-11-10T06:00:00Z");
    const tomorrowNoon = atTorontoTime(base, 1, 12, 0);
    expect(tomorrowNoon.toISOString()).toBe("2026-11-11T17:00:00.000Z");
  });
});
