export interface SearchQuery {
  lat: number;
  lng: number;
  radiusKm: number;
  categorySlug?: string;
  keyword?: string;
  asap?: boolean;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

/**
 * Data-fidelity tier of a listing.
 * - "live": Soonest reads this provider's calendar through an authorized
 *   source (in-system slots or a connected platform adapter) and can rank
 *   by real availability and complete bookings in-app.
 * - "listed": a directory entry built from the provider's own public info.
 *   No availability data; booking hands off to the provider's booking page.
 * The UI must never present a listed provider as having live availability.
 */
export type ListingTier = "live" | "listed";

export interface ProviderResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  ratingAvg: number;
  ratingCount: number;
  priceTier: number;
  source: string;
  tier: ListingTier;
  bookingUrl?: string;
  website?: string;
  externalId?: string;
  npi?: string;
  phone?: string;
  imageUrl?: string;
  services: ServiceResult[];
  soonestSlot?: SlotResult;
  distanceKm?: number;
}

export interface ServiceResult {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  categorySlug: string;
}

export interface SlotResult {
  id: string;
  serviceId: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  source: string;
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  bookingUrl?: string;
  error?: string;
}

export interface BookingProvider {
  source: string;
  search(query: SearchQuery): Promise<ProviderResult[]>;
  getSlots(
    providerId: string,
    serviceId: string,
    range: TimeRange
  ): Promise<SlotResult[]>;
  book(slotId: string, contact: ContactInfo): Promise<BookingResult>;
}

export interface RankedResult extends ProviderResult {
  score: number;
  breakdown: {
    timeScore: number;
    distanceScore: number;
    ratingScore: number;
    priceScore: number;
  };
  rankingReason: string;
}

export interface RankingWeights {
  time: number;
  distance: number;
  rating: number;
  price: number;
}
