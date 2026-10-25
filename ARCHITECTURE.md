# Architecture & File Guide

A map of every file in this project and what it's for — so you know exactly
where to make a change. Start with the task table, then use the file tour
below for detail.

## "I want to change X — which file?"

| Task | File(s) to edit |
|---|---|
| Add / remove / reorder hero photos | Drop originals in `src/assets/Cameo/`, add an entry to `scripts/optimize-photos.mjs`, run it, then list the photo in `src/data/photos.ts` |
| Change how fast photos rotate, or the scrim darkness | `src/components/HeroPhotos.tsx` (`HOLD_MS`, `FADE_MS`, the `bg-surface-dark/70` overlay) |
| **Update Housecall Pro booking** | `src/config/site.ts` → `BOOKING.token` / `BOOKING.orgName` (both appear in the embed code at Housecall Pro → Marketing → Online Booking) |
| Change how the booking CTA looks or behaves | `src/components/BookButton.tsx` |
| **Turn tire shopping back on** | `src/config/site.ts` → `FEATURES.ecommerce = true`. One flag re-enables Add to Cart, the cart, checkout, and drops every "coming soon" label sitewide. |
| **Change how much we mark tires up** | `api/_lib/pricing.ts` → `MARKUP_TIERS`. Server-only by design — see the warning at the top of that file |
| **Source tires from ATD instead of sample JSON** | `src/config/site.ts` → `FEATURES.liveCatalog = true` (after the ATD env vars are set in Vercel) |
| Change the Instagram / phone number | `src/config/site.ts` → `SITE` |
| **Implement the real backend APIs** | `src/services/catalog.ts` and `src/services/fitment.ts` — replace the `fakeFetch(...)` bodies with real `fetch('/api/...')` calls. Nothing outside `src/services/` needs to change. |
| Edit the theme (brand red, surfaces, fonts) | `src/index.css` — the `@theme` block holds every design token; Tailwind generates utilities (`bg-brand`, etc.) from it |
| Swap or re-crop the logo | `src/components/Logo.tsx` + `src/assets/logo-*.png` (originals in `src/assets/CMYK/`) |
| Add / edit tires in the catalog | `src/data/tires.json` |
| Add / edit vehicles and OEM fitments | `src/data/vehicles.json` |
| Change fulfillment options or install fees | `src/types/index.ts` → `FULFILLMENT_OPTIONS` |
| Add a new page | Create it in `src/pages/`, then register the route in `src/App.tsx` |
| Change header, nav, or footer | `src/components/Layout.tsx` |
| Change how a tire result card looks | `src/components/TireCard.tsx` |
| Change the wheel visualizer | `src/components/WheelVisualizer.tsx` |
| Change cart behavior (add/remove/persistence) | `src/context/CartContext.tsx` |
| Change the placeholder tire illustration | `src/components/TireGraphic.tsx` |
| Change SEO title / favicon | `index.html`, `public/favicon.svg` |
| Bump the version | `package.json` (`version`) + add a section to `CHANGELOG.md` — the footer picks up the version automatically |

## How data flows

```
pages/ ──calls──▶ services/ ──today──▶ src/data/*.json  (bundled sample data)
                     │
                     └────future────▶ /api/* serverless functions (Vercel)
                                          └──▶ fitment API, Stripe, Supabase
```

Components never import JSON directly. Every data access goes through
`src/services/`, whose functions are `async` and shaped like real API calls.
That's the seam where the backend gets swapped in — the UI won't know the
difference.

## Backend plan: tire inventory & ordering (ATD)

Supplier is **American Tire Distributors**, reached through the **Tirewire
Connections Center** API. Findings from its public WSDLs:

- **SOAP 1.1 over HTTPS** — `https://ws.tirewire.com/connectionscenter/*.asmx`
  (`commonservice`, `productsservice`, `ordersservice`, `wheelsservice`).
  Always HTTPS: credentials ride on every request.
- **Auth:** `AccessKey` + `GroupToken` per call, plus a `ConnectionID`
  identifying your ATD account among your supplier connections.
- **Key operations:** `ValidateGroupToken`, `GetConnectionsByGroup`,
  `GetAllMakes`, `GetTires`, `GetTireByID`, `GetShipToOptions`, `PlaceOrder`.
- `GetTires` accepts `TireSize` **or** `Width`/`Aspect`/`Rim` — the same fields
  `parseTireSize()` already produces, so our search model maps over directly.

Consequences for the architecture:

1. **Credentials can never reach the browser.** The frontend calls our own
   `/api/*` serverless functions on Vercel; those hold the keys and talk SOAP.
   Never prefix these with `VITE_` — Vite inlines those into the bundle.
2. **Don't proxy per page view.** Inventory refreshes hourly and pricing daily
   across millions of SKUs, so catalog/pricing data gets cached (Supabase), with
   a live stock check only at checkout.
3. `src/services/catalog.ts` keeps its current signatures — only the bodies
   change, from reading bundled JSON to calling `/api/*`.

Run `node scripts/atd-check.mjs` (credentials via env) to verify access and
discover your ATD `ConnectionID`.

### Pricing and markup

ATD returns **`BuyPrice`** (your dealer cost) and `Tax` (federal excise tax).
The customer must never see either the cost or the margin, which is exactly why
markup happens in `api/`, not in `src/`:

```
browser ──▶ /api/tires/search ──▶ ATD SOAP (BuyPrice, Tax)
                   │
                   ├─ applyMarkup(cost) → retail        api/_lib/pricing.ts
                   └─ strips BuyPrice from the response
browser ◀── retail price only
```

`api/_lib/pricing.ts` holds a tiered ladder: the markup percentage falls as cost
rises, with a minimum dollar margin protecting cheap tires. FET is added *after*
markup and never multiplied — it's a tax, not merchandise. There's an optional
`mapCents` floor for brands that enforce Minimum Advertised Price.

| Files | Role |
|---|---|
| `api/_lib/pricing.ts` | The markup ladder. **Never import from `src/`** |
| `api/_lib/atd.ts` | SOAP client; maps ATD's response to a public shape with cost removed |
| `api/tires/search.ts` | `GET /api/tires/search?size=275/55R20` |

## Payments (Stripe)

Setup is a dashboard exercise, written up in `notes/stripe-setup.md`. What
follows is why the code looks the way it does.

### Hosted Checkout, not embedded Elements

The server creates a Checkout Session and the browser is redirected to
stripe.com. The payoff is what we *don't* have: no Stripe.js in the bundle, no
publishable key, and no card number ever entering our code, our network, or our
logs. It also gets Apple Pay, Google Pay, 3D Secure, and address collection for
free. The cost is a redirect away from our own styling, which for a handful of
transactions a day is a trade worth making.

### The trust boundary

```
browser ──▶ POST /api/checkout/session   { tireId, size, quantity, fulfillment }
                   │                       ^^^^^^ no prices. ever.
                   ├─ quoteCart() re-prices from ATD      api/_lib/quote.ts
                   ├─ applyMarkup(cost) → retail          api/_lib/pricing.ts
                   └─ stripe.checkout.sessions.create()
browser ◀── { url } ──▶ stripe.com ──▶ /order/success?session_id=…

stripe.com ──▶ POST /api/stripe/webhook  (signed, out of band)
                   └─ the only trustworthy "this was paid"
```

The cart in localStorage holds no money — only `{ tireId, size, quantity }` —
and that is load-bearing, not incidental. If the client sent prices, anyone
could edit localStorage and buy a $400 tire for $1; we'd ship it and Stripe
would capture the dollar. Every amount in a session is recomputed server-side.

### Why the webhook exists when there's already a success page

The success page proves only that a browser loaded a URL. The customer can
close the tab before redirecting, pay by a method that settles hours later, or
type the path in by hand. `api/stripe/webhook.ts` is Stripe telling our server
directly, with an HMAC signature we verify against the raw request bytes —
which is why it reads `request.text()` and must never be switched to `.json()`.

Stripe guarantees *at-least-once* delivery. Anything added to that handler has
to be keyed on `session.id` and skip work already done, or a retry turns into a
second set of tires in the same driveway.

### The sample-catalog rail

Checkout will price from the bundled sample JSON under a Stripe **test** key,
and refuses under a **live** key. That makes the full payment flow buildable
before ATD credentials exist, while making it structurally impossible for the
live site to sell inventory we can't source. It keys off the `sk_test_` prefix
rather than a flag, so there is nothing to forget to turn off.

| Files | Role |
|---|---|
| `api/_lib/stripe.ts` | Server-only client, pinned API version, `SITE_URL` redirect base. **Holds the secret key** |
| `api/_lib/quote.ts` | Validates the cart and re-prices it from the supplier. The trust boundary |
| `api/checkout/session.ts` | `POST` opens a session; `GET ?id=cs_…` reads one back for the confirmation page |
| `api/stripe/webhook.ts` | Signature-verified fulfilment hook. Carries the seam for the ATD order + Housecall Pro job |
| `api/_lib/http.ts` | `requestUrl()` (relative-URL safe) and the shared `json()` responder |
| `src/services/checkout.ts` | Client half: posts the cart, follows the returned URL |

### Serverless function conventions (learned the hard way)

**Export named methods, never `export default`.** `@vercel/node` decides
between the modern Web signature (`Request` in, `Response` out) and the legacy
Node `(req, res)` signature by looking for exported `GET`/`POST`/etc. or a
`fetch`. A default export silently takes the legacy path: your returned
`Response` is thrown away, `res.end()` is never called, and the request hangs
with no error anywhere. It only shows up as "the function is still running
after 30s".

**Never call `new URL(request.url)` bare.** Deployed, `request.url` is
absolute; under `vercel dev` it is a relative path and `new URL` throws. Use
`requestUrl()` from `api/_lib/http.ts`.

**Run the functions with `npm run dev:api`, not `npm run dev`.** Plain Vite
serves the React app and 404s every `/api/*` route. `vercel dev` runs both —
and it does not pick up `.env.local` by itself, which the script handles.

## File tour

### Root

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts (`dev` / `build` / `lint` / `preview`), and the app version (single source of truth, injected into the footer at build time) |
| `vite.config.ts` | Build config: React plugin, Tailwind v4 plugin, version injection |
| `vercel.json` | SPA rewrite — serves `index.html` for every URL so React Router deep links (e.g. `/shop/vehicle`) survive a refresh on Vercel. The source pattern is `/((?!api/).*)`: the negative lookahead is what keeps `/api/*` reaching the serverless functions instead of being handed the HTML shell. Do not simplify it to `/(.*)`. Vercel schema-validates this file and rejects unknown keys, so it cannot carry a `comment` field — the note lives here instead |
| `index.html` | The single HTML shell; page `<title>` lives here |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | TypeScript config (strict mode on; `app` covers `src/`, `node` covers `vite.config.ts`) |
| `.oxlintrc.json` | Linter rules |
| `.gitignore` | Untracked-file rules |
| `README.md` | Project intro, setup, deployment |
| `CHANGELOG.md` | Version history (Keep a Changelog format, SemVer) |
| `CLAUDE.md` | Context loaded by AI coding agents: key decisions, domain knowledge, conventions |
| `goal.md` | The product vision — read this first to understand what we're building |
| `AI-BestPractices.md` | Working agreements for AI-assisted development (local only, not committed) |

### `src/` — application code

| File | Purpose |
|---|---|
| `main.tsx` | Entry point: mounts React, wraps the app in the router and cart provider |
| `App.tsx` | Route table — every page is registered here |
| `index.css` | **The theme.** Tailwind + font imports, `@theme` design tokens (brand red `#e24233`, warm-dark surfaces, display/body fonts), the angular `skew-brand` utilities, and shared animations |
| `vite-env.d.ts` | Type declarations for Vite globals (`__APP_VERSION__`) |

### `src/config/` — business configuration

| File | Purpose |
|---|---|
| `site.ts` | **Start here for business changes.** `FEATURES` (is e-commerce live?), `BOOKING` (Housecall Pro link + embed mode), and `SITE` (Instagram, phone). No component hardcodes these. |

### `src/types/` — shared domain types

| File | Purpose |
|---|---|
| `index.ts` | The vocabulary of the app: `Tire`, `Fitment`, `VehicleRecord`, `CartItem`, tire-size parsing/formatting helpers, and `FULFILLMENT_OPTIONS` (ship / mobile / in-shop, with fees). Everything imports its types from here. |

### `src/assets/` — brand artwork

| File | Purpose |
|---|---|
| `CMYK/` | The original logo package from the designer: EPS / PDF / PNG / SVG / WebP, each in Black, White, Full (color-on-light), and OverBlack (color-on-dark) variants |
| `Cameo/` | **Not in git.** Raw job photos straight off a phone (~30MB). Keep your own backup — `scripts/optimize-photos.mjs` reads from here |
| `photos/` | Optimized, committed output of that script — what the site actually ships |
| `logo-horizontal.png` | OverBlack horizontal lockup, cropped to content — used in the header and footer |
| `logo-square.png` | OverBlack stacked lockup, cropped to content — used in the hero |

### `src/data/` — sample data (temporary stand-in for the backend)

| File | Purpose |
|---|---|
| `tires.json` | Tire catalog: brand, model, category, price, sizes, warranty, rating, load range, stock |
| `vehicles.json` | Fitment database: year/make/model/trim → OEM sizes, staggered flag, upgrade sizes. **Sample data** — replaced by a licensed fitment API in a later phase |

### `src/services/` — data access (the backend seam)

| File | Purpose |
|---|---|
| `api.ts` | Placeholder plumbing: `fakeFetch()` simulates network latency; `DEBUG_SERVICES` flag logs simulated calls |
| `booking.ts` | **Real** integration (not a placeholder): loads the Housecall Pro widget script once and opens its booking modal. Explains why a plain iframe of the booking URL renders blank |
| `catalog.ts` | Tire queries: search by size with filters, get by id, filter options, available sizes. Future: `GET /api/tires...` |
| `fitment.ts` | Vehicle flow queries: years → makes → models → trims → fitment. Future: serverless proxy to a fitment API (keeps the API key secret) |
| `checkout.ts` | **Real** integration: posts the cart to `/api/checkout/session` and follows Stripe's URL. Sends no prices — see the Payments section |

### `src/context/` — shared state

| File | Purpose |
|---|---|
| `CartContext.tsx` | Cart state via React Context: add/update/remove/clear, item count for the header badge, localStorage persistence. Future: syncs to Supabase for logged-in users |

### `src/components/` — reusable UI

| File | Purpose |
|---|---|
| `Layout.tsx` | App shell: sticky header with logo, nav + Book Now CTA, footer with Instagram link, scroll reset on navigation |
| `Logo.tsx` | The brand lockup (horizontal + square variants). Uses cropped PNGs rather than the source SVGs — see the file's comment for why |
| `BookButton.tsx` | The booking CTA used everywhere. A real link that upgrades to the Housecall Pro modal when their widget is ready |
| `ErrorBoundary.tsx` | Catches render errors so a crash shows a readable message instead of a blank black page |
| `HeroPhotos.tsx` | Rotating job-photo backdrop for the landing hero, clipped to the logo's raked hexagon and scrimmed for text contrast |
| `PreviewBanner.tsx` | The "pricing isn't live yet" notice on shopping pages. Renders nothing once `FEATURES.ecommerce` is true |
| `icons.tsx` | Inline social/UI glyphs (currently Instagram) |
| `TireCard.tsx` | One tire in a results grid: brand, model, image, price, warranty, rating, stock, OEM badge, View Details / Add to Cart |
| `TireGraphic.tsx` | Stylized SVG tire — placeholder until real product photography |
| `WheelVisualizer.tsx` | Close-up wheel drawing whose proportions come from the actual tire size; renders front + rear for staggered vehicles |
| `VehicleSelector.tsx` | Progressive Year → Make → Model → Trim picker with back-tracking chips |

### `src/pages/` — one file per route

| File | Route | Purpose |
|---|---|---|
| `Home.tsx` | `/` | Landing: booking-first hero, service promises, then tire shopping as a gated preview |
| `Book.tsx` | `/book` | Housecall Pro booking (inline iframe), how-it-works steps, service list. Falls back to a contact card when `BOOKING.url` is empty |
| `ShopByVehicle.tsx` | `/shop/vehicle` | Vehicle selector → wheel visualizer → OEM-first results (staggered-aware) |
| `ShopBySize.tsx` | `/shop/size` | Fast size search with brand/type/load-range filters and sorting; size lives in the URL |
| `TireDetail.tsx` | `/tire/:id` | Spec table, quantity picker (defaults to a set of 4), add to cart |
| `CartPage.tsx` | `/cart` | Line items, fulfillment choice with fees, estimated totals, and the Stripe checkout button |
| `OrderSuccess.tsx` | `/order/success` | Confirms a finished Checkout Session and clears the cart. Confirms only — fulfilment happens in the webhook |

### `public/`

| File | Purpose |
|---|---|
| `favicon.svg` | Browser tab icon |
