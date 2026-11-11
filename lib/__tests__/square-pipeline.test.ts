import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Square } from "square";

// No real DB, no real Square SDK: the pipeline is exercised against mocks.
vi.mock("@/lib/db", () => ({
  prisma: {
    sellerToken: { findUnique: vi.fn(), findMany: vi.fn() },
    provider: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    service: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    serviceCategory: { findMany: vi.fn() },
  },
}));

const searchAvailability = vi.fn();
vi.mock("@/lib/square-client", () => ({
  makeSquareClient: vi.fn(() => ({ bookings: { searchAvailability } })),
}));

const { prisma } = await import("@/lib/db");
const db = vi.mocked(prisma, true);
const { makeSquareClient } = await import("@/lib/square-client");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("square token lookup", () => {
  it("returns the merchant's token by (source, merchant id)", async () => {
    const { getSquareAccessToken } = await import("../square-tokens");
    db.sellerToken.findUnique.mockResolvedValueOnce({
      accessToken: "tok_A",
      expiresAt: new Date(Date.now() + 86400000),
    } as never);
    expect(await getSquareAccessToken("MERCHANT_A")).toBe("tok_A");
    expect(db.sellerToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          source_externalSellerId: { source: "square", externalSellerId: "MERCHANT_A" },
        },
      })
    );
  });

  it("treats missing or expired tokens as absent", async () => {
    const { getSquareAccessToken } = await import("../square-tokens");
    expect(await getSquareAccessToken(null)).toBeNull();
    expect(db.sellerToken.findUnique).not.toHaveBeenCalled();

    db.sellerToken.findUnique.mockResolvedValueOnce(null as never);
    expect(await getSquareAccessToken("M")).toBeNull();

    db.sellerToken.findUnique.mockResolvedValueOnce({
      accessToken: "old",
      expiresAt: new Date(Date.now() - 1000),
    } as never);
    expect(await getSquareAccessToken("M")).toBeNull();
  });

  it("batch lookup keeps only usable tokens", async () => {
    const { getSquareAccessTokens } = await import("../square-tokens");
    db.sellerToken.findMany.mockResolvedValueOnce([
      { externalSellerId: "A", accessToken: "tA", expiresAt: null },
      { externalSellerId: "B", accessToken: "tB", expiresAt: new Date(0) },
    ] as never);
    const map = await getSquareAccessTokens(["A", "B", "A"]);
    expect([...map.entries()]).toEqual([["A", "tA"]]);
  });

  it("lists sellers, skipping the 'unknown' placeholder", async () => {
    const { listSquareSellers } = await import("../square-tokens");
    db.sellerToken.findMany.mockResolvedValueOnce([
      { externalSellerId: "A", accessToken: "tA", expiresAt: null },
      { externalSellerId: "unknown", accessToken: "tU", expiresAt: null },
    ] as never);
    expect(await listSquareSellers()).toEqual([{ merchantId: "A", accessToken: "tA" }]);
  });
});

const location: Square.Location = {
  id: "L1",
  businessName: "Ossington Cuts",
  status: "ACTIVE",
  coordinates: { latitude: 43.648, longitude: -79.42 },
  address: { addressLine1: "100 Ossington Ave", locality: "Toronto", administrativeDistrictLevel1: "ON" },
};

const catalog = [
  {
    type: "ITEM",
    id: "ITEM_CUT",
    itemData: {
      name: "Skin Fade",
      productType: "APPOINTMENTS_SERVICE",
      variations: [
        {
          type: "ITEM_VARIATION",
          id: "VAR_FADE",
          itemVariationData: {
            name: "Regular",
            serviceDuration: BigInt(45 * 60000),
            priceMoney: { amount: BigInt(4500), currency: "CAD" },
            pricingType: "FIXED_PRICING",
            availableForBooking: true,
          },
        },
      ],
    },
  },
  {
    type: "ITEM",
    id: "ITEM_CONSULT",
    itemData: {
      name: "Consultation",
      productType: "APPOINTMENTS_SERVICE",
      variations: [
        {
          type: "ITEM_VARIATION",
          id: "VAR_CONSULT",
          itemVariationData: {
            serviceDuration: BigInt(15 * 60000),
            priceMoney: { amount: BigInt(0), currency: "CAD" },
            pricingType: "FIXED_PRICING",
          },
        },
      ],
    },
  },
] as Square.CatalogObject[];

describe("planMerchantSync", () => {
  it("plans one provider per usable location with categorized variation services", async () => {
    const { planMerchantSync } = await import("../square-sync");
    const plans = planMerchantSync(
      [location, { ...location, id: "L_OFF", status: "INACTIVE" }],
      catalog
    );
    expect(plans).toHaveLength(1);
    expect(plans[0].location.id).toBe("L1");
    expect(plans[0].services).toEqual([
      { serviceVariationId: "VAR_FADE", name: "Skin Fade", durationMin: 45, priceCents: 4500, categorySlug: "haircut" },
      { serviceVariationId: "VAR_CONSULT", name: "Consultation", durationMin: 15, priceCents: 0, categorySlug: "haircut" },
    ]);
  });

  it("omits locations with no bookable services", async () => {
    const { planMerchantSync } = await import("../square-sync");
    expect(planMerchantSync([location], [])).toEqual([]);
  });
});

describe("syncSquareMerchants", () => {
  it("is a clean no-op with zero connected sellers", async () => {
    const { syncSquareMerchants } = await import("../square-sync");
    db.sellerToken.findMany.mockResolvedValueOnce([] as never);
    const apiFor = vi.fn();
    const summary = await syncSquareMerchants({ apiFor });
    expect(summary).toMatchObject({ merchants: 0, ok: 0, failed: 0, providers: 0 });
    expect(apiFor).not.toHaveBeenCalled();
    expect(db.provider.create).not.toHaveBeenCalled();
  });

  it("leaves a merchant's rows untouched when Square reads fail", async () => {
    const { syncSquareMerchants } = await import("../square-sync");
    db.sellerToken.findMany.mockResolvedValueOnce([
      { externalSellerId: "M1", accessToken: "t1", expiresAt: null },
    ] as never);
    db.serviceCategory.findMany.mockResolvedValueOnce([{ id: "cat_hair", slug: "haircut" }] as never);
    const summary = await syncSquareMerchants({
      apiFor: () => ({
        listLocations: () => Promise.reject(new Error("401 UNAUTHORIZED")),
        listAppointmentServices: () => Promise.resolve([]),
      }),
    });
    expect(summary.failed).toBe(1);
    expect(summary.results[0].error).toContain("401");
    expect(db.provider.findMany).not.toHaveBeenCalled();
    expect(db.service.deleteMany).not.toHaveBeenCalled();
    expect(db.provider.delete).not.toHaveBeenCalled();
  });

  it("creates the provider and services from the merchant's catalog", async () => {
    const { syncSquareMerchants } = await import("../square-sync");
    db.sellerToken.findMany.mockResolvedValueOnce([
      { externalSellerId: "M1", accessToken: "t1", expiresAt: null },
    ] as never);
    db.serviceCategory.findMany.mockResolvedValueOnce([{ id: "cat_hair", slug: "haircut" }] as never);
    db.provider.findFirst.mockResolvedValueOnce(null as never);
    db.provider.findUnique.mockResolvedValueOnce(null as never); // slug free
    db.provider.create.mockResolvedValueOnce({ id: "prov_1" } as never);
    db.service.create.mockResolvedValue({ id: "svc_x" } as never);
    db.provider.findMany.mockResolvedValueOnce([] as never); // nothing stale

    const summary = await syncSquareMerchants({
      apiFor: () => ({
        listLocations: () => Promise.resolve([location]),
        listAppointmentServices: () => Promise.resolve(catalog),
      }),
    });

    expect(summary).toMatchObject({ merchants: 1, ok: 1, providers: 1, services: 2, retired: 0 });
    expect(db.provider.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: "square",
        externalId: "L1",
        externalSellerId: "M1",
        slug: "ossington-cuts",
        bookingUrl: null,
        ratingAvg: 0,
        ratingCount: 0,
        lat: 43.648,
        lng: -79.42,
      }),
    });
    expect(db.service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerId: "prov_1",
        externalId: "VAR_FADE",
        durationMin: 45,
        priceCents: 4500,
        categoryId: "cat_hair",
      }),
    });
  });
});

describe("SquareBookingProvider", () => {
  const dbProvider = (id: string, lat: number, merchant = "M1") => ({
    id,
    name: `Shop ${id}`,
    address: "1 Queen St W, Toronto, ON",
    lat,
    lng: -79.4,
    priceTier: 2,
    source: "square",
    externalId: `LOC_${id}`,
    externalSellerId: merchant,
    phone: null,
    website: null,
    imageUrl: null,
    ratingAvg: 4.9, // must never leak through
    ratingCount: 99,
    services: [
      {
        id: `svc_${id}`,
        name: "Haircut",
        durationMin: 30,
        priceCents: 4000,
        externalId: `VAR_${id}`,
        category: { slug: "haircut" },
      },
    ],
  });

  it("returns nothing (and calls nothing) with no synced providers", async () => {
    const { SquareBookingProvider } = await import("../providers/square");
    db.provider.findMany.mockResolvedValueOnce([] as never);
    const res = await new SquareBookingProvider().search({ lat: 43.65, lng: -79.4, radiusKm: 10 });
    expect(res).toEqual([]);
    expect(searchAvailability).not.toHaveBeenCalled();
  });

  it("reads soonest slots with the owning merchant's token and the real variation id", async () => {
    const { SquareBookingProvider } = await import("../providers/square");
    db.provider.findMany.mockResolvedValueOnce([dbProvider("p1", 43.65)] as never);
    db.sellerToken.findMany.mockResolvedValueOnce([
      { externalSellerId: "M1", accessToken: "tok_M1", expiresAt: null },
    ] as never);
    const start = new Date(Date.now() + 3 * 3600000).toISOString();
    searchAvailability.mockResolvedValueOnce({
      availabilities: [
        {
          startAt: start,
          locationId: "LOC_p1",
          appointmentSegments: [{ teamMemberId: "T", serviceVariationId: "VAR_p1", durationMinutes: 30 }],
        },
      ],
    });

    const [r] = await new SquareBookingProvider().search({ lat: 43.65, lng: -79.4, radiusKm: 10 });
    expect(makeSquareClient).toHaveBeenCalledWith("tok_M1");
    const req = searchAvailability.mock.calls[0][0];
    expect(req.query.filter.locationId).toBe("LOC_p1");
    expect(req.query.filter.segmentFilters).toEqual([{ serviceVariationId: "VAR_p1" }]);
    const span =
      new Date(req.query.filter.startAtRange.endAt).getTime() -
      new Date(req.query.filter.startAtRange.startAt).getTime();
    expect(span).toBe(7 * 86400000);

    expect(r.tier).toBe("live");
    expect(r.ratingAvg).toBe(0);
    expect(r.ratingCount).toBe(0);
    expect(r.soonestSlot?.startsAt).toBe(new Date(start).toISOString());
    expect(r.soonestSlot?.serviceId).toBe("svc_p1");
  });

  it("keeps a provider without availability when its Square read fails or it has no token", async () => {
    const { SquareBookingProvider } = await import("../providers/square");
    db.provider.findMany.mockResolvedValueOnce([
      dbProvider("p2", 43.651),
      dbProvider("p3", 43.652, "M_NO_TOKEN"),
    ] as never);
    db.sellerToken.findMany.mockResolvedValueOnce([
      { externalSellerId: "M1", accessToken: "tok_M1", expiresAt: null },
    ] as never);
    searchAvailability.mockRejectedValueOnce(new Error("503"));

    const res = await new SquareBookingProvider().search({ lat: 43.65, lng: -79.4, radiusKm: 10 });
    expect(res.map((r) => r.id).sort()).toEqual(["p2", "p3"]);
    expect(res.every((r) => r.soonestSlot === undefined)).toBe(true);
    expect(searchAvailability).toHaveBeenCalledTimes(1); // p3 had no token
  });

  it("caps live reads per search to the nearest providers", async () => {
    const { SquareBookingProvider, MAX_SEARCH_PROVIDERS } = await import("../providers/square");
    const many = Array.from({ length: MAX_SEARCH_PROVIDERS + 5 }, (_, i) =>
      dbProvider(`cap${i}`, 43.65 + i * 0.001)
    );
    db.provider.findMany.mockResolvedValueOnce(many as never);
    db.sellerToken.findMany.mockResolvedValueOnce([
      { externalSellerId: "M1", accessToken: "tok_M1", expiresAt: null },
    ] as never);
    searchAvailability.mockResolvedValue({ availabilities: [] });

    const res = await new SquareBookingProvider().search({ lat: 43.65, lng: -79.4, radiusKm: 25 });
    expect(res).toHaveLength(MAX_SEARCH_PROVIDERS + 5);
    expect(searchAvailability).toHaveBeenCalledTimes(MAX_SEARCH_PROVIDERS);
    searchAvailability.mockReset();
  });

  it("getSlots uses the service's variation id, merchant token and real durations", async () => {
    const { SquareBookingProvider } = await import("../providers/square");
    db.service.findFirst.mockResolvedValueOnce({
      id: "svc_9",
      name: "Deep Tissue",
      durationMin: 60,
      externalId: "VAR_9",
      providerId: "p9",
      provider: { externalId: "LOC_9", externalSellerId: "M9" },
    } as never);
    db.sellerToken.findUnique.mockResolvedValueOnce({ accessToken: "tok_M9", expiresAt: null } as never);
    const start = new Date(Date.now() + 86400000);
    start.setUTCMinutes(0, 0, 0);
    searchAvailability.mockResolvedValueOnce({
      availabilities: [
        {
          startAt: start.toISOString(),
          locationId: "LOC_9",
          appointmentSegments: [{ teamMemberId: "T", serviceVariationId: "VAR_9", durationMinutes: 90 }],
        },
      ],
    });

    const slots = await new SquareBookingProvider().getSlots("p9", "svc_9", {
      start: new Date(),
      end: new Date(Date.now() + 7 * 86400000),
    });
    expect(makeSquareClient).toHaveBeenCalledWith("tok_M9");
    expect(searchAvailability.mock.calls[0][0].query.filter.segmentFilters).toEqual([
      { serviceVariationId: "VAR_9" },
    ]);
    expect(slots).toHaveLength(1);
    expect(slots[0].serviceName).toBe("Deep Tissue");
    expect(new Date(slots[0].endsAt).getTime() - start.getTime()).toBe(90 * 60000);
  });

  it("getSlots returns nothing on error rather than guessing", async () => {
    const { SquareBookingProvider } = await import("../providers/square");
    db.service.findFirst.mockResolvedValueOnce({
      id: "svc_9",
      name: "Deep Tissue",
      durationMin: 60,
      externalId: "VAR_9",
      providerId: "p9",
      provider: { externalId: "LOC_9", externalSellerId: "M9" },
    } as never);
    db.sellerToken.findUnique.mockResolvedValueOnce({ accessToken: "tok_M9", expiresAt: null } as never);
    searchAvailability.mockRejectedValueOnce(new Error("timeout"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const slots = await new SquareBookingProvider().getSlots("p9", "svc_9", {
      start: new Date(),
      end: new Date(Date.now() + 86400000),
    });
    errSpy.mockRestore();
    expect(slots).toEqual([]);
  });

  it("keeps production booking blocked", async () => {
    const { SquareBookingProvider } = await import("../providers/square");
    const prev = process.env.SQUARE_ENVIRONMENT;
    process.env.SQUARE_ENVIRONMENT = "production";
    const res = await new SquareBookingProvider().book("square-slot-L1-0-x", {
      name: "a",
      phone: "1",
      email: "a@b.c",
    });
    process.env.SQUARE_ENVIRONMENT = prev;
    expect(res).toEqual({ success: false, error: "Production booking not allowed" });
    expect(makeSquareClient).not.toHaveBeenCalled();
  });
});
