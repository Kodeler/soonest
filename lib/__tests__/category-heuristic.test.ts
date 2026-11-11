import { describe, it, expect } from "vitest";
import {
  categorizeServices,
  DEFAULT_CATEGORY_SLUG,
  matchCategorySlug,
} from "../category-heuristic";

describe("matchCategorySlug", () => {
  it.each([
    ["Men's Haircut", "haircut"],
    ["Skin Fade", "haircut"],
    ["Beard Trim & Line Up", "haircut"],
    ["Hot Towel Shave", "haircut"],
    ["Kids Cut", "haircut"],
    ["Balayage + Toner", "haircut"],
    ["Beard grooming", "haircut"],
    ["Classic Manicure", "nails"],
    ["Mani/Pedi Combo", "nails"],
    ["Gel Color Change", "nails"],
    ["Acrylic Full Set", "nails"],
    ["Nail Trim", "nails"],
    ["60 min RMT Massage", "massage"],
    ["Deep Tissue (90 min)", "massage"],
    ["Registered Massage Therapy", "massage"],
    ["Hot Stone", "massage"],
    ["Brow Lamination", "brows-lashes"],
    ["Classic Lash Extensions", "brows-lashes"],
    ["Brow Wax", "brows-lashes"],
    ["Laser Hair Removal", "spa"],
    ["Signature Facial", "spa"],
    ["Brazilian Wax", "spa"],
    ["Dog Nail Trim", "pet-grooming"],
    ["Physio Assessment", "physiotherapy"],
    ["Chiropractic Adjustment", "chiropractor"],
    ["Reformer Pilates", "yoga"],
    ["Small Tattoo", "tattoo"],
  ])("%s → %s", (name, slug) => {
    expect(matchCategorySlug(name)).toBe(slug);
  });

  it("is case/accent insensitive", () => {
    expect(matchCategorySlug("MASSAGE SUÉDOIS massage")).toBe("massage");
    expect(matchCategorySlug("PÉDICURE pedicure")).toBe("nails");
  });

  it("does not match substrings inside other words", () => {
    // "cuticle" must not hit the haircut "cut" rule; "manifest" not "mani".
    expect(matchCategorySlug("Cuticle care")).toBeNull();
    expect(matchCategorySlug("Manifestation session")).toBeNull();
  });

  it("returns null for names with no signal", () => {
    expect(matchCategorySlug("Consultation")).toBeNull();
    expect(matchCategorySlug("")).toBeNull();
    expect(matchCategorySlug("   ")).toBeNull();
  });
});

describe("categorizeServices", () => {
  it("unmatched services inherit the business's dominant category", () => {
    expect(
      categorizeServices(["60 min Massage", "90 min Massage", "Consultation"])
    ).toEqual(["massage", "massage", "massage"]);
  });

  it("keeps per-service matches in mixed catalogs", () => {
    expect(
      categorizeServices(["Haircut", "Fade", "Classic Manicure", "Express"])
    ).toEqual(["haircut", "haircut", "nails", "haircut"]);
  });

  it("falls back to the default when nothing matches", () => {
    expect(categorizeServices(["Consultation", "Session"])).toEqual([
      DEFAULT_CATEGORY_SLUG,
      DEFAULT_CATEGORY_SLUG,
    ]);
    expect(categorizeServices(["Session"], "spa")).toEqual(["spa"]);
  });

  it("handles an empty catalog", () => {
    expect(categorizeServices([])).toEqual([]);
  });
});
