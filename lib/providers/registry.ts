import { prisma } from "@/lib/db";
import type {
  BookingProvider,
  BookingResult,
  ContactInfo,
  ProviderResult,
  SearchQuery,
  SlotResult,
  TimeRange,
} from "@/lib/types";
import { MockBookingProvider } from "./mock";
import { SquareBookingProvider } from "./square";
import { ZocdocBookingProvider } from "./zocdoc";

export class ProviderRegistry {
  private providers: BookingProvider[] = [];

  constructor() {
    this.providers.push(new MockBookingProvider());

    // Square seller tokens come from the DB (OAuth), so the app id alone
    // enables the adapter. With zero connected sellers it returns nothing.
    if (process.env.SQUARE_APPLICATION_ID) {
      this.providers.push(new SquareBookingProvider());
    }

    if (
      process.env.ZOCDOC_CLIENT_ID &&
      process.env.ZOCDOC_CLIENT_SECRET
    ) {
      this.providers.push(new ZocdocBookingProvider());
    }
  }

  async search(query: SearchQuery): Promise<ProviderResult[]> {
    const allResults = await Promise.all(
      this.providers.map((p) => p.search(query).catch(() => []))
    );

    const flat = allResults.flat();
    return dedupeResults(flat);
  }

  async getSlots(
    providerId: string,
    serviceId: string,
    range: TimeRange
  ): Promise<SlotResult[]> {
    const source = await resolveSource(providerId);
    const provider = this.providers.find((p) => p.source === source);
    if (!provider) return [];
    return provider.getSlots(providerId, serviceId, range);
  }

  async book(
    slotId: string,
    contact: ContactInfo
  ): Promise<BookingResult> {
    const source = detectSlotSource(slotId);
    const provider = this.providers.find((p) => p.source === source);
    if (!provider) {
      return { success: false, error: "Unknown booking source" };
    }
    return provider.book(slotId, contact);
  }

  get enabledSources(): string[] {
    return this.providers.map((p) => p.source);
  }
}

function detectSource(providerId: string): string {
  if (providerId.startsWith("square-")) return "square";
  if (providerId.startsWith("zocdoc-")) return "zocdoc";
  return "mock";
}

// Synced platform providers (e.g. Square) are DB rows with plain cuid ids,
// so an unprefixed id is resolved by the row's source.
async function resolveSource(providerId: string): Promise<string> {
  const prefixed = detectSource(providerId);
  if (prefixed !== "mock") return prefixed;
  const row = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { source: true },
  });
  return row?.source === "square" ? "square" : "mock";
}

function detectSlotSource(slotId: string): string {
  if (slotId.startsWith("square-")) return "square";
  if (slotId.startsWith("zocdoc-")) return "zocdoc";
  return "mock";
}

function dedupeResults(results: ProviderResult[]): ProviderResult[] {
  const seen = new Map<string, ProviderResult>();

  for (const r of results) {
    const key = normalizeKey(r.name, r.address);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, r);
    } else if (preferOver(r, existing)) {
      seen.set(key, r);
    }
  }

  return Array.from(seen.values());
}

// When the same business appears twice, keep the higher-fidelity record:
// a live (calendar-connected) record beats a listed directory entry, and
// any real record beats a sample.
function preferOver(a: ProviderResult, b: ProviderResult): boolean {
  const fidelity = (r: ProviderResult) =>
    r.source === "mock" ? 0 : r.tier === "listed" ? 1 : 2;
  return fidelity(a) > fidelity(b);
}

function normalizeKey(name: string, address: string): string {
  return `${name.toLowerCase().trim()}|${address.toLowerCase().trim()}`;
}

let registryInstance: ProviderRegistry | null = null;

export function getRegistry(): ProviderRegistry {
  if (!registryInstance) {
    registryInstance = new ProviderRegistry();
  }
  return registryInstance;
}
