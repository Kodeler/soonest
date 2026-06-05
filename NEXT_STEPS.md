# Soonest — Next Steps

## Per-Provider OAuth Reality

Most personal-service booking platforms require each seller to individually authorize your app via OAuth. There is no "city-wide search" API — you build coverage by onboarding providers one at a time.

### Square (ready now)
- OAuth connect flow is built (`/api/connect/square`)
- Each Square seller authorizes your app, granting APPOINTMENTS_READ/WRITE scope
- You get their bookable catalog and live availability
- Self-serve: any Square seller can connect in < 2 minutes
- Production: apply at Square Developer Dashboard, pass app review

### Fresha / Booksy / Vagaro / Mindbody
- Each requires a developer partnership application
- Fresha: partner API with per-salon OAuth; good coverage in beauty/wellness
- Booksy: REST API, per-provider authorization; strong in barbershops
- Vagaro: API available to approved partners; salon/spa/fitness
- Mindbody: mature API with broad gym/studio coverage; requires commercial agreement
- **Implementation pattern**: create a new class implementing `BookingProvider`, add to `ProviderRegistry` — zero changes to UI or ranking

### Jane (osteo/physio/chiro in Canada)
- No public API exists
- Dominant platform for manual therapy in Canada
- Options: (1) partnership inquiry, (2) scraper adapter (fragile, ToS concerns), (3) direct provider integration via iFrame/deep-link
- The `ScraperBookingProvider` stub exists for this scenario but is disabled

### Zocdoc (US health)
- Developer partnership required (apply at developer.zocdoc.com)
- Once approved, you get broad multi-provider real-time availability without onboarding individual providers
- Covers dentists, doctors, dermatologists, therapists across many EHR systems
- Sandbox with predefined test providers is ready in the codebase
- **Gate**: Zocdoc adapter is US-only and health-category-only by design

## Seller Onboarding Strategy

### Phase 1: Self-serve connectors (Square, eventually Fresha)
- Provider visits `/connect/[platform]`, authorizes in 2 minutes
- Immediate availability on the platform
- Works well for 1-location businesses

### Phase 2: Partnership APIs (Zocdoc, Mindbody)
- Bulk coverage: one partnership covers thousands of providers
- No per-provider onboarding needed
- Higher barrier to entry (commercial agreement, app review)

### Phase 3: Aggregator deals
- Partner with booking aggregators (e.g., Treatwell in Europe)
- Affiliate/meta-search model: show availability, hand off booking
- Revenue via referral fees or booking margins

## Recommended Vertical-by-City Rollout

### Toronto (seed city)
1. **Hair / Barber** — high frequency, price-insensitive, Square-heavy → fast to populate
2. **Massage / Physio / Chiro** — Jane-dominated, needs partnership or scraper
3. **Nails / Brows** — Fresha/Booksy-heavy, needs those partnerships
4. **Dental** — harder, mostly legacy PMS systems; consider Zocdoc-like meta-search

### New York (expansion)
1. **Health** — Zocdoc partnership gives instant breadth across doctors/dentists/therapists
2. **Hair / Beauty** — Mindbody + Booksy covers most
3. **Tattoo / Specialty** — Square self-serve likely sufficient

### General pattern
- Lead with the vertical where you have API coverage
- Supplement with self-serve OAuth connectors
- Fill gaps with manual outreach + provider onboarding

## Consumer Auth & Payments

### Consumer Authentication
- Not in MVP — booking is anonymous (name/phone/email only)
- Next: add email-based magic link auth (no passwords)
- Enables: booking history, favorites, re-booking, preferences
- Stack: NextAuth.js or Clerk, with a `User` model in Prisma

### Payments
- Most personal-service bookings are paid at the provider
- For prepaid/deposit models: integrate Stripe Connect
- Marketplace flow: user pays Soonest, Soonest pays provider minus commission
- Requires: consumer auth, provider payout setup, refund handling
- Regulatory: may need money transmitter licensing depending on jurisdiction

## Technical Priorities

1. **Real-time availability refresh** — cache strategy for mock slots, polling for live adapters
2. **Geolocation + geocoding** — Mapbox geocoding for address-to-lat/lng search
3. **Push notifications** — "slot opening" alerts for high-demand providers
4. **Provider dashboard** — for sellers to manage their connected accounts
5. **Analytics** — search patterns, booking conversion, category demand by area
6. **PWA manifest** — installable web app with offline search cache
7. **React Native** — API and types are already client-agnostic; mobile client reuses everything

## Adding a New Adapter

Adding a new booking platform (e.g., Fresha) requires exactly one new file:

```typescript
// lib/providers/fresha.ts
export class FreshaBookingProvider implements BookingProvider {
  source = "fresha";
  async search(query: SearchQuery): Promise<ProviderResult[]> { ... }
  async getSlots(providerId: string, serviceId: string, range: TimeRange): Promise<SlotResult[]> { ... }
  async book(slotId: string, contact: ContactInfo): Promise<BookingResult> { ... }
}
```

Then add it to `ProviderRegistry`:

```typescript
if (process.env.FRESHA_API_KEY) {
  this.providers.push(new FreshaBookingProvider());
}
```

No changes to ranking, API routes, or UI. The architecture ensures every adapter is a peer — the system is source-agnostic by design.
