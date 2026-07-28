# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
