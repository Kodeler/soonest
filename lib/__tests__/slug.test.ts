import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "../slug";

describe("uniqueSlug", () => {
  it("returns the plain slug when free", async () => {
    expect(await uniqueSlug("Ossington Cuts", async () => false)).toBe("ossington-cuts");
  });

  it("suffixes -2, -3 ... until free", async () => {
    const taken = new Set(["ossington-cuts", "ossington-cuts-2"]);
    expect(await uniqueSlug("Ossington Cuts", async (s) => taken.has(s))).toBe("ossington-cuts-3");
  });

  it("falls back when the name has no sluggable characters", async () => {
    expect(slugify("★★★")).toBe("");
    expect(await uniqueSlug("★★★", async () => false)).toBe("shop");
  });
});
