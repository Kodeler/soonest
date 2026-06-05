import type {
  BookingProvider,
  BookingResult,
  ContactInfo,
  ProviderResult,
  SearchQuery,
  SlotResult,
  TimeRange,
} from "@/lib/types";

// STUB: Scraping booking widgets is fragile and generally against platform
// terms of service. This adapter exists as a documented fallback architecture
// for platforms with no API (e.g. Jane, independent WordPress booking plugins).
// It is disabled by default and should not be pointed at any real site without
// explicit authorization from the platform operator.
//
// If you need to implement this:
// 1. Get written permission from the platform
// 2. Respect robots.txt and rate limits
// 3. Use a headless browser (Playwright) to render JS-heavy booking widgets
// 4. Cache aggressively to minimize requests
// 5. Build per-platform parsers — there is no universal booking widget format

export class ScraperBookingProvider implements BookingProvider {
  source = "scraper";

  async search(_query: SearchQuery): Promise<ProviderResult[]> {
    return [];
  }

  async getSlots(
    _providerId: string,
    _serviceId: string,
    _range: TimeRange
  ): Promise<SlotResult[]> {
    return [];
  }

  async book(
    _slotId: string,
    _contact: ContactInfo
  ): Promise<BookingResult> {
    return { success: false, error: "Scraper adapter is disabled" };
  }
}
