# Soonest

Availability-first services booking aggregator. Searches every bookable service near a user and surfaces ranked options optimized for soonest available + closest + best reviewed.

Think "Kayak for appointments."

## Quick Start

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Seed mock data (30 providers across 10 categories)
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs fully on mock data with no external keys.

## Optional: Enable Live Adapters

Copy `.env.example` to `.env` and uncomment the keys you want:

### Square (sandbox)
1. Create a free Square Developer account
2. Create a sandbox app
3. Set `SQUARE_ACCESS_TOKEN`, `SQUARE_APPLICATION_ID`, `SQUARE_APPLICATION_SECRET`
4. Set `SQUARE_ENVIRONMENT=sandbox`

### Zocdoc (sandbox, US health only)
1. Apply for Zocdoc developer access
2. Set `ZOCDOC_CLIENT_ID`, `ZOCDOC_CLIENT_SECRET`, `ZOCDOC_ENV=sandbox`
3. Only returns results for US locations + health categories

### Mapbox (map view)
1. Create a free Mapbox account
2. Set `NEXT_PUBLIC_MAPBOX_TOKEN`
3. Without this, the app degrades to list-only view

## Architecture

```
SearchQuery → ProviderRegistry → [Mock, Square, Zocdoc, Scraper*]
                                        ↓
                                  Merge + Dedupe
                                        ↓
                                  Ranking Engine
                                        ↓
                                   Ranked Results → UI
```

*Scraper is a disabled stub.

### Key Principle
One `BookingProvider` interface. All providers are peers. Ranking, API routes, and UI never branch on source.

### Adding a New Adapter
1. Create `lib/providers/newplatform.ts` implementing `BookingProvider`
2. Add to `ProviderRegistry` constructor (gated by env key)
3. Done — no UI or ranking changes needed

## Ranking

```
score = wTime * timeScore + wDistance * distanceScore + wRating * ratingScore + wPrice * priceScore
```

| Mode    | Time | Distance | Rating | Price |
|---------|------|----------|--------|-------|
| Default | 0.40 | 0.25     | 0.35   | 0.00  |
| ASAP    | 0.70 | 0.20     | 0.10   | 0.00  |

Rating uses Bayesian dampening — 5.0 with 2 reviews doesn't beat 4.7 with 400.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma 7 + SQLite (dev) / Postgres (prod)
- Square Node SDK (sandbox)
- Mapbox GL JS (optional)
- Zod 4 for API validation
- Vitest for tests

## Project Structure

```
app/
  api/
    search/         POST — fan-out search across all providers
    providers/[id]  GET — provider detail + slots + reviews
    book/           POST — book a slot
    categories/     GET — all service categories
    connect/square/ GET — Square OAuth flow
  components/       React UI components
lib/
  providers/
    mock.ts         MockBookingProvider (always enabled)
    square.ts       SquareBookingProvider (sandbox)
    zocdoc.ts       ZocdocBookingProvider (sandbox, US health)
    scraper.ts      ScraperBookingProvider (disabled stub)
    registry.ts     ProviderRegistry (fan-out + dedupe)
  ranking.ts        Pure ranking engine
  types.ts          Shared TypeScript interfaces
  geo.ts            Haversine distance
  config.ts         Environment config + constants
  validation.ts     Zod schemas
prisma/
  schema.prisma     Data model
  seed.ts           Mock data generator
```

## Tests

```bash
npm test
```

Tests cover:
- Ranking engine (sub-scores, weight modes, source-agnosticism)
- Geo distance (haversine)
- All adapter interfaces
- Zocdoc US/health gating
- Scraper disabled state

## See Also

- [NEXT_STEPS.md](NEXT_STEPS.md) — per-provider OAuth reality, seller onboarding, rollout strategy, consumer auth + payments roadmap
