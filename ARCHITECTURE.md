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

## File tour

### Root

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts (`dev` / `build` / `lint` / `preview`), and the app version (single source of truth, injected into the footer at build time) |
| `vite.config.ts` | Build config: React plugin, Tailwind v4 plugin, version injection |
| `vercel.json` | SPA rewrite — serves `index.html` for every URL so React Router deep links (e.g. `/shop/vehicle`) survive a refresh on Vercel |
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
| `CartPage.tsx` | `/cart` | Line items, fulfillment choice with fees, totals; checkout is disabled until the payments phase |

### `public/`

| File | Purpose |
|---|---|
| `favicon.svg` | Browser tab icon |
