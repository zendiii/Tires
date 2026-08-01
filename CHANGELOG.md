# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.2] - 2026-07-28

### Fixed

- **The actual cause of the Windows crash / black screen.** `ScrollToTop` used
  a concise arrow body — `useEffect(() => window.scrollTo(0, 0), [pathname])` —
  which returns whatever `scrollTo` returns. React treats any non-undefined
  return as the effect's cleanup function, so on the next navigation it called
  that value and threw "1 is not a function" (a timer/handle id), tearing down
  the app. Per spec `scrollTo` returns undefined, but extensions and
  smooth-scroll polyfills commonly patch it — which is why only Windows
  machines hit it. Now uses a block body so nothing is returned.

  The 0.5.1 animation changes were real hardening but were not the root cause;
  before the error boundary existed, this same crash is what produced the
  black page.

## [0.5.1] - 2026-07-28

### Fixed

- **Black screen on Windows after navigating to the landing page.** Hero
  elements animated with `animation-fill-mode: both`, which pins an element to
  the keyframe's opening frame (`opacity: 0`) until its animation runs — so
  anything preventing the animation from starting left the content permanently
  invisible against our near-black background. The entrance animation now
  carries no fill-mode and no delay, so a missed animation costs a fade rather
  than the whole page.
- The reduced-motion media query overrode `animation-duration` but not
  `animation-delay` or `animation-fill-mode`, leaving staggered content hidden
  for the length of its delay. It now neutralises delay, iteration count, and
  fill-mode. This path matters more on Windows, where the OS animation toggle
  is commonly off.

### Added

- `ErrorBoundary` around the app: an uncaught render error previously unmounted
  the whole React tree, leaving a bare black page with nothing in the console.
  Errors now show a readable message with a reload button and are logged.

## [0.5.0] - 2026-07-28

### Added

- `BookButton`: one booking CTA used sitewide (header, hero, preview banner,
  tire detail, cart). Renders as a real link to the hosted booking page and
  upgrades to Housecall Pro's in-page modal once their widget loads
- `src/services/booking.ts`: loads the Housecall Pro widget script exactly once
  and exposes `openBookingModal()`
- "See how mobile installation works" link on the landing page, so `/book`
  stays reachable now that the header CTA opens the modal directly

### Fixed

- **Booking rendered as a blank white box.** Their booking app stays empty
  until it receives an `hcp:open` postMessage handshake, which only Housecall
  Pro's own widget script sends — a hand-rolled `<iframe>` never gets it. Now
  integrated via the official widget script, which owns the iframe and the
  handshake. (The earlier guess that the embedding domain needed allow-listing
  was wrong; framing was never blocked.)

### Changed

- `BOOKING` config now holds `token` + `orgName` (both from the Housecall Pro
  embed code) instead of a pasted URL; the hosted booking URL is derived from
  them, matching what their script builds
- Booking modal iframe preloads (`disableLazy=true`) so it opens instantly

## [0.4.0] - 2026-07-11

### Added

- Booking page at `/book` wrapping Housecall Pro online booking, with a
  graceful fallback until the account booking URL is filled in
- `src/config/site.ts`: single place for feature gates, the Housecall Pro
  booking URL, and social links
- Instagram link in the footer (@dinosmobiletires)
- `PreviewBanner` on all shopping pages explaining that pricing isn't live and
  routing customers to booking instead

### Changed

- **Scheduling is now the site's primary path.** Landing page leads with
  "Schedule Service"; tire shopping moved below it as a labelled preview
- Header's primary action is "Book Now"; the cart button is hidden while
  e-commerce is gated
- Tire e-commerce gated behind `FEATURES.ecommerce` (currently `false`) until
  live inventory/pricing APIs are connected: Add to Cart shows "Coming Soon",
  prices are marked as estimates, and `/cart` redirects the customer to booking
- Tire detail page's primary action is now "Book an Install with This Tire"

## [0.3.0] - 2026-07-11

### Added

- Brand logo assets (`src/assets/CMYK/`) wired into a reusable `Logo` component;
  lockup now appears in the header, hero, and footer
- Self-hosted display type: Anton (headings) + Inter (body), matching the
  logo's condensed uppercase wordmark
- Angular `skew-brand` / `skew-fix` / `clip-speed` utilities derived from the
  logo's raked badge, applied to buttons, badges, and section rules
- Brand favicon replacing the Vite default; `theme-color` and meta description
- ARCHITECTURE.md: file-by-file guide for contributors (where to plug in
  backend APIs, edit the theme, add data, etc.); README now links to it

### Changed

- **Accent color is now brand red `#e24233`** (sampled from the logo), replacing
  the placeholder orange — goal.md's "orange" predated the real branding
- Business name corrected to "Dino's Mobile Tires" throughout
- Surfaces warmed toward red so neutrals no longer read cold/blue
- Rounded corners replaced with square edges to match the logo's geometry
- Reduced-motion preference now respected

### Fixed

- Rewind chips in the vehicle selector were unreadable on hover (red text on
  red fill) — the parent was missing the `group` class

## [0.2.0] - 2026-07-08

### Added

- React Router with app shell (sticky header, cart badge, footer)
- Shop by Vehicle: progressive Year → Make → Model → Trim selector, wheel/tire
  visualizer (handles staggered setups), OEM-first results with upgrade sizes
- Shop by Size: size picker with brand/type/load-range filters and sorting,
  sharable via URL query
- Tire detail page with spec table and quantity picker (defaults to a set of 4)
- Cart with fulfillment choice (ship / mobile install / in-shop) and
  localStorage persistence; checkout button is a placeholder for the Stripe phase
- Services layer (`src/services/`) that mimics future backend endpoints while
  serving bundled sample JSON (tire catalog + vehicle fitment data)
- `vercel.json` SPA rewrite so deep links work on Vercel

### Changed

- TypeScript `strict` mode enabled
- Footer version now injected from package.json at build time

## [0.1.0] - 2026-07-03

### Added

- Initial project scaffold: Vite + React + TypeScript
- Tailwind CSS v4 with brand design tokens (dark surfaces, orange accent)
- Placeholder landing screen with the two shopping paths (by vehicle / by size)
- Project docs: README, CHANGELOG, CLAUDE.md, goal.md, AI-BestPractices.md
