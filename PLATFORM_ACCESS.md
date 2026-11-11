# Platform access plan — real availability, authorized only

Goal: pull live open-slot data from booking platforms through their official
APIs, with each business's explicit authorization. No scraping, ever.

## Sequencing

1. **Square** (now) — barbers' dominant platform; production OAuth is
   self-serve for unlisted apps, no marketplace review needed.
2. **Calendly** (next) — self-serve developer portal; solo practitioners.
3. **Acuity / Squarespace Scheduling** (next) — OAuth client registration
   form; estheticians, tutors, solo RMTs.
4. **Mindbody** (later, needs traction) — partner application with a sales
   process and monthly API pricing; spas, massage chains, fitness.
5. **Jane App** (relationship play) — no public API. Toronto RMT/physio/chiro
   run on it. Until Jane opens up, the manual Live tier is the path; a
   partnership pitch becomes credible once we have provider counts.
6. **Fresha / Booksy** (bench) — closed platforms, partnership applications
   documented in NEXT_STEPS.md.

## Square — status and steps

Research finding (Feb 2026 forum guidance): unlisted/private Square apps get
production OAuth without any review. Marketplace listing (optional, later) is
the only gated path. Each seller must have Square Appointments enabled;
seller-level booking writes need their Appointments Plus/Premium plan.

Code shipped:
- `/api/connect/square` → production-aware, CSRF state cookie.
- `/api/connect/square/callback` → state verification, token upsert per
  merchant, branded success/failure pages.
- `/api/cron/refresh-square-tokens` → daily token rotation (30-day expiry,
  Square recommends ≤7-day refresh).
- Booking **writes** remain disabled in production until the create-booking
  payload is production-grade (service variation + team member + customer).
  Availability reads are the launch feature.

Owner steps (Square developer dashboard, developer.squareup.com/apps):
1. Create an application named `Soonest` (or open the existing one).
2. In **OAuth** settings, switch to the **Production** tab and set the
   Production Redirect URL: `https://soonest.today/api/connect/square/callback`
3. Copy the **Production Application ID** and **Production Application
   Secret** into Vercel env vars (Production + Preview):
   - `SQUARE_APPLICATION_ID`
   - `SQUARE_APPLICATION_SECRET`
   - `SQUARE_ENVIRONMENT` = `production`
4. Redeploy. The connect link is then live:
   `https://soonest.today/api/connect/square`

After the first merchant connects: build the read pipeline (sync their
locations/services into Provider rows as a new `square` live tier, pull
`SearchAvailability` for soonest-slot ranking). That work is gated on having
one real connected merchant to test against.

## Calendly — steps

1. Owner: create a developer account at developer.calendly.com (free),
   create an OAuth app, redirect URL
   `https://soonest.today/api/connect/calendly/callback`.
2. Code: OAuth connect/callback routes (mirror Square's), availability read
   via Event Type Available Times API.

## Acuity (Squarespace Scheduling) — steps

1. Owner: register an OAuth2 client at developers.acuityscheduling.com
   (registration form; approval may route through Squarespace partnerships —
   submit and see). Redirect URL:
   `https://soonest.today/api/connect/acuity/callback`.
2. Code: OAuth connect/callback routes, availability via
   `/api/v1/availability/times`.

## Mindbody — steps (deferred)

Partner application at developers.mindbodyonline.com. Requires approval and
monthly API pricing; each studio activates our integration with a code.
Apply when we have >20 live providers or a studio asking for us by name,
whichever comes first.

## Rules that do not bend

- A platform connection is created by the business owner clicking authorize,
  never by us logging into their account.
- Availability shown in-app must come from an authorized API read.
- Tokens are secrets: stored server-side, rotated by cron, never logged.
