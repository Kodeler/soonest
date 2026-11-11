import { describe, it, expect } from "vitest";
import type { Square } from "square";
import {
  availabilitiesToSlots,
  availabilityQueryWindow,
  formatSquareAddress,
  isPresentAtLocation,
  mapCatalogItemServices,
  mapCatalogServicesForLocation,
  moneyToCents,
  msToMinutes,
  squareSlotId,
  toUsableLocation,
} from "../square-mapping";

function variation(
  id: string,
  data: Partial<Square.CatalogItemVariation>,
  extra: Partial<Square.CatalogObjectBase> = {}
): Square.CatalogObject {
  return {
    type: "ITEM_VARIATION",
    id,
    ...extra,
    itemVariationData: {
      pricingType: "FIXED_PRICING",
      availableForBooking: true,
      ...data,
    },
  } as Square.CatalogObject;
}

function item(
  id: string,
  name: string,
  variations: Square.CatalogObject[],
  extra: Partial<Square.CatalogObjectBase> = {}
): Square.CatalogObject {
  return {
    type: "ITEM",
    id,
    ...extra,
    itemData: { name, productType: "APPOINTMENTS_SERVICE", variations },
  } as Square.CatalogObject;
}

const cad = (cents: number): Square.Money => ({ amount: BigInt(cents), currency: "CAD" });

describe("msToMinutes", () => {
  it("converts Square's millisecond bigint durations", () => {
    expect(msToMinutes(BigInt(3600000))).toBe(60);
    expect(msToMinutes(BigInt(2700000))).toBe(45);
    expect(msToMinutes(1800000)).toBe(30);
  });
  it("rounds to the nearest minute", () => {
    expect(msToMinutes(BigInt(1_830_000))).toBe(31);
  });
  it("rejects missing, zero and negative durations", () => {
    expect(msToMinutes(null)).toBeNull();
    expect(msToMinutes(undefined)).toBeNull();
    expect(msToMinutes(BigInt(0))).toBeNull();
    expect(msToMinutes(-60000)).toBeNull();
    expect(msToMinutes(10_000)).toBeNull();
  });
});

describe("moneyToCents", () => {
  it("passes through Square's smallest-unit amount", () => {
    expect(moneyToCents(cad(4500))).toBe(4500);
    expect(moneyToCents(cad(0))).toBe(0);
  });
  it("returns null when there is no fixed price", () => {
    expect(moneyToCents(undefined)).toBeNull();
    expect(moneyToCents({ currency: "CAD" })).toBeNull();
    expect(moneyToCents({ amount: null })).toBeNull();
  });
});

describe("isPresentAtLocation", () => {
  it("defaults to present everywhere", () => {
    expect(isPresentAtLocation({}, "L1")).toBe(true);
  });
  it("honours absentAtLocationIds", () => {
    expect(isPresentAtLocation({ presentAtAllLocations: true, absentAtLocationIds: ["L1"] }, "L1")).toBe(false);
  });
  it("honours presentAtLocationIds when not global", () => {
    const o = { presentAtAllLocations: false, presentAtLocationIds: ["L2"] };
    expect(isPresentAtLocation(o, "L1")).toBe(false);
    expect(isPresentAtLocation(o, "L2")).toBe(true);
  });
});

describe("mapCatalogItemServices", () => {
  it("maps each variation by its own id with real duration and price", () => {
    const svc = item("ITEM1", "Haircut", [
      variation("VAR_SHORT", { name: "Short", serviceDuration: BigInt(1800000), priceMoney: cad(3500) }),
      variation("VAR_LONG", { name: "Long", serviceDuration: BigInt(3600000), priceMoney: cad(6000) }),
    ]);
    expect(mapCatalogItemServices(svc, "L1")).toEqual([
      { serviceVariationId: "VAR_SHORT", name: "Haircut (Short)", durationMin: 30, priceCents: 3500 },
      { serviceVariationId: "VAR_LONG", name: "Haircut (Long)", durationMin: 60, priceCents: 6000 },
    ]);
  });

  it("uses the item name alone for a single/Regular variation", () => {
    const svc = item("ITEM1", "Skin Fade", [
      variation("V1", { name: "Regular", serviceDuration: BigInt(2700000), priceMoney: cad(4000) }),
    ]);
    expect(mapCatalogItemServices(svc, "L1")[0].name).toBe("Skin Fade");
  });

  it("drops variations that cannot be shown truthfully", () => {
    const svc = item("ITEM1", "Massage", [
      variation("NO_DURATION", { priceMoney: cad(9000) }),
      variation("VARIABLE", { pricingType: "VARIABLE_PRICING", serviceDuration: BigInt(3600000) }),
      variation("NO_PRICE", { serviceDuration: BigInt(3600000) }),
      variation("NOT_BOOKABLE", { availableForBooking: false, serviceDuration: BigInt(3600000), priceMoney: cad(9000) }),
      variation("DELETED", { serviceDuration: BigInt(3600000), priceMoney: cad(9000) }, { isDeleted: true }),
      variation("OK", { serviceDuration: BigInt(3600000), priceMoney: cad(9000) }),
    ]);
    expect(mapCatalogItemServices(svc, "L1").map((s) => s.serviceVariationId)).toEqual(["OK"]);
  });

  it("applies per-location price overrides", () => {
    const svc = item("ITEM1", "Massage", [
      variation("V1", {
        serviceDuration: BigInt(3600000),
        priceMoney: cad(9000),
        locationOverrides: [{ locationId: "L2", priceMoney: cad(11000) }],
      }),
    ]);
    expect(mapCatalogItemServices(svc, "L1")[0].priceCents).toBe(9000);
    expect(mapCatalogItemServices(svc, "L2")[0].priceCents).toBe(11000);
  });

  it("skips items and variations not offered at the location", () => {
    const local = item(
      "ITEM1",
      "Haircut",
      [variation("V1", { serviceDuration: BigInt(1800000), priceMoney: cad(3000) })],
      { presentAtAllLocations: false, presentAtLocationIds: ["L2"] }
    );
    expect(mapCatalogItemServices(local, "L1")).toEqual([]);
    expect(mapCatalogItemServices(local, "L2")).toHaveLength(1);
  });

  it("ignores non-service and archived items", () => {
    const retail = {
      type: "ITEM",
      id: "R1",
      itemData: { name: "Pomade", productType: "REGULAR", variations: [] },
    } as Square.CatalogObject;
    const archived = {
      type: "ITEM",
      id: "A1",
      itemData: { name: "Old cut", isArchived: true, variations: [] },
    } as Square.CatalogObject;
    expect(mapCatalogItemServices(retail, "L1")).toEqual([]);
    expect(mapCatalogItemServices(archived, "L1")).toEqual([]);
  });

  it("dedupes variations across items", () => {
    const v = variation("V1", { serviceDuration: BigInt(1800000), priceMoney: cad(3000) });
    const out = mapCatalogServicesForLocation([item("I1", "Cut", [v]), item("I2", "Cut", [v])], "L1");
    expect(out).toHaveLength(1);
  });
});

describe("locations", () => {
  const base: Square.Location = {
    id: "L1",
    name: "Main",
    businessName: "Queen West Barbers",
    status: "ACTIVE",
    coordinates: { latitude: 43.645, longitude: -79.41 },
    address: {
      addressLine1: "1205 Queen St W",
      addressLine2: "Unit 2",
      locality: "Toronto",
      administrativeDistrictLevel1: "ON",
      postalCode: "M6K 1L3",
    },
    phoneNumber: "+1 416-555-0100",
  };

  it("formats the address like the directory data", () => {
    expect(formatSquareAddress(base.address)).toBe("1205 Queen St W Unit 2, Toronto, ON");
    expect(formatSquareAddress(undefined)).toBe("");
  });

  it("maps an active location with coordinates", () => {
    expect(toUsableLocation(base)).toEqual({
      id: "L1",
      name: "Queen West Barbers",
      address: "1205 Queen St W Unit 2, Toronto, ON",
      lat: 43.645,
      lng: -79.41,
      phone: "+1 416-555-0100",
      website: null,
    });
  });

  it("rejects inactive or unplaceable locations", () => {
    expect(toUsableLocation({ ...base, status: "INACTIVE" })).toBeNull();
    expect(toUsableLocation({ ...base, coordinates: undefined })).toBeNull();
    expect(toUsableLocation({ ...base, coordinates: { latitude: 43.6, longitude: null } })).toBeNull();
  });
});

describe("availabilitiesToSlots", () => {
  const ctx = {
    locationId: "L1",
    serviceId: "svc_db_1",
    serviceVariationId: "VAR1",
    serviceName: "Haircut",
    fallbackDurationMin: 30,
  };
  const rangeStart = new Date("2026-11-12T14:00:00Z");
  const rangeEnd = new Date("2026-11-19T14:00:00Z");

  it("returns ISO slots sorted, deduped per start, with real segment durations", () => {
    const slots = availabilitiesToSlots(
      [
        {
          startAt: "2026-11-12T16:00:00Z",
          locationId: "L1",
          appointmentSegments: [{ teamMemberId: "TM2", serviceVariationId: "VAR1", durationMinutes: 45 }],
        },
        {
          startAt: "2026-11-12T15:00:00Z",
          locationId: "L1",
          appointmentSegments: [{ teamMemberId: "TM1", serviceVariationId: "VAR1", durationMinutes: 45 }],
        },
        {
          // Same start, another barber: one slot, not two.
          startAt: "2026-11-12T15:00:00Z",
          locationId: "L1",
          appointmentSegments: [{ teamMemberId: "TM2", serviceVariationId: "VAR1", durationMinutes: 45 }],
        },
      ],
      ctx,
      rangeStart,
      rangeEnd
    );
    expect(slots).toEqual([
      {
        id: squareSlotId("L1", 0, "2026-11-12T15:00:00.000Z"),
        serviceId: "svc_db_1",
        serviceName: "Haircut",
        startsAt: "2026-11-12T15:00:00.000Z",
        endsAt: "2026-11-12T15:45:00.000Z",
        source: "square",
      },
      {
        id: squareSlotId("L1", 1, "2026-11-12T16:00:00.000Z"),
        serviceId: "svc_db_1",
        serviceName: "Haircut",
        startsAt: "2026-11-12T16:00:00.000Z",
        endsAt: "2026-11-12T16:45:00.000Z",
        source: "square",
      },
    ]);
  });

  it("normalizes offset timestamps to UTC ISO without shifting the instant", () => {
    const [slot] = availabilitiesToSlots(
      [{ startAt: "2026-11-12T10:00:00-05:00", appointmentSegments: [] }],
      ctx,
      rangeStart,
      rangeEnd
    );
    expect(slot.startsAt).toBe("2026-11-12T15:00:00.000Z");
    // No segment duration → the synced service duration.
    expect(slot.endsAt).toBe("2026-11-12T15:30:00.000Z");
  });

  it("clips to the range and drops other locations / bad rows", () => {
    const slots = availabilitiesToSlots(
      [
        { startAt: "2026-11-12T13:00:00Z" },
        { startAt: "2026-11-20T13:00:00Z" },
        { startAt: "2026-11-13T13:00:00Z", locationId: "OTHER" },
        { startAt: "not a date" },
        { startAt: null },
      ],
      ctx,
      rangeStart,
      rangeEnd
    );
    expect(slots).toEqual([]);
  });

  it("keeps the id format book() parses", () => {
    const id = squareSlotId("LOC9", 3, "2026-11-12T15:00:00.000Z");
    const parts = id.split("-");
    expect(parts[2]).toBe("LOC9");
    expect(parts.slice(4).join("-")).toBe("2026-11-12T15:00:00.000Z");
  });
});

describe("availabilityQueryWindow", () => {
  const now = new Date("2026-11-12T12:00:00Z");
  it("widens short windows to Square's 24h minimum", () => {
    const w = availabilityQueryWindow(now, new Date("2026-11-12T15:00:00Z"), now)!;
    expect(w.start.toISOString()).toBe("2026-11-12T12:00:00.000Z");
    expect(w.end.toISOString()).toBe("2026-11-13T12:00:00.000Z");
  });
  it("starts no earlier than now and caps at 32 days", () => {
    const w = availabilityQueryWindow(
      new Date("2026-11-01T00:00:00Z"),
      new Date("2027-03-01T00:00:00Z"),
      now
    )!;
    expect(w.start.toISOString()).toBe(now.toISOString());
    expect(w.end.getTime() - w.start.getTime()).toBe(32 * 86400000);
  });
  it("returns null for ranges entirely in the past", () => {
    expect(availabilityQueryWindow(new Date("2026-11-01"), new Date("2026-11-02"), now)).toBeNull();
  });
});
