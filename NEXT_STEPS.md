# Soonest — Operating Playbook

Updated 2026-11-05. The July version of this document described a plan; this
one describes a running system and what feeds it.

## Where things stand

Live at soonest.today:

- **44 real barbershops** across the west-downtown corridor (Queen West,
  Ossington, Dundas West, Kensington, Little Italy, King West/Liberty
  Village, Parkdale, Roncesvalles, The Junction), all listed-tier:
  published prices, direct booking links, zero fabricated data.
- **Listing-fidelity tiers**: `live` (authorized calendar, bookable in-app,
  ⚡ badge) vs `listed` (directory entry, books on the shop's own site).
  The UI never claims availability it cannot prove. Sample data is labeled.
- **Listings as code**: `data/wedge/*.json` is the directory. A build-time
  sync (`scripts/sync-wedge-listings.ts`) upserts it to production,
  geocodes addresses, and refuses any listing whose booking URL fails a
  live check. Migrations also auto-apply at build.
- **Acquisition surfaces**: nine neighborhood SEO pages
  (`/toronto/barbers/...`), per-shop permalink pages (`/shop/<slug>`) with
  structured data, sitemap coverage.
- **Funnels**: claim-your-listing card on every listed shop (feeds
  `/admin/leads`, kind `claim`), contact page with the listing policy
  (kind `contact`), concierge "we'll find you the soonest" request
  (kind `concierge`, phone-first), founding-provider Stripe signup.
- **Instrumentation**: first-party event log (searches, provider views,
  booking confirms/fails, outbound booking clicks, call clicks, lead
  submissions by kind) plus Vercel Analytics component.

## The flywheel

1. Consumers find Soonest via neighborhood/shop SEO pages and search.
2. Outbound booking clicks and concierge requests prove demand per shop.
3. Shops discover their listing (customers mention it, self-googling,
   referral traffic) and land on the claim card.
4. Claims convert to Live connections (Square self-serve today; Fresha /
   Booksy partnerships later) — the ⚡ badge is the status carrot.
5. Live shops make the "soonest" ranking real, which makes the consumer
   product better, which restarts the loop.

## Data rules (non-negotiable)

- Never fabricate. Every listing: confirmed address, a booking URL that
  responds, at least one shop-published price. Durations may be estimates,
  noted per listing.
- No ratings without an authorized rating source. Unrated shops show the
  New badge and are never described as "highly rated".
- No scraping of availability. Live open times come only from authorized
  calendar connections.
- Record rejects and the reason in the data file's `_meta` so they are not
  re-added blindly. Known traps: renamed shops with stale listings at the
  same address, closed shops with live-looking profiles, per-barber
  platform profiles that are one shop, conflicting addresses.
- Corrections or removal on an owner's request, fast, once verified.

## Growth order

1. **Densify the pocket** (done to 44; keep topping up as shops qualify —
   the `_meta` exclusions list carries the bench and why each is waiting).
2. **Second vertical on the same strips**: nails/brows reuse the same
   neighborhood pages (one entry in `lib/seo-areas.ts` CATEGORY_LANDINGS)
   and the same data pipeline (`data/wedge/<vertical>.json` with its
   categorySlug in `_meta`).
3. **New geography last**, pulled by search-event data, not guesses.

## Live-tier supply roadmap

- **Square** (built): self-serve OAuth at `/api/connect/square`. Submit the
  production app review — it is calendar time, not effort.
- **Fresha / Booksy / Vagaro / Mindbody**: partner-API applications; one
  partnership bulk-upgrades every listed shop on that platform. Apply
  early, they take weeks.
- **Jane** (health verticals later): no public API; partnership inquiry or
  direct provider connections only. The scraper stub stays disabled.
- **Zocdoc** (US health, much later): adapter and sandbox already exist.

## Operating cadence (human)

- Check `/admin/leads` daily once traffic starts; answer claims and
  concierge requests fast — response speed is the product.
- Watch events for which shops get booking clicks; those are the warm
  Live-upgrade pitches.
- Keep `data/wedge/*.json` fresh: prices drift; the deploy log's SKIP
  lines flag dead booking URLs.

## Architecture notes that still hold

- One `BookingProvider` interface; all adapters are peers; ranking, API
  and UI never branch on source. Adding a platform is one adapter file
  plus a registry entry.
- Ranking: time/distance/rating/price weights with Bayesian-dampened
  ratings; ASAP mode reweights toward time. Listed shops score zero on
  time by construction.
- Consumer auth, payments (Stripe Connect marketplace flow), push
  notifications, provider dashboard, PWA/native clients: unchanged future
  items, in roughly that order, gated on demand signal.
