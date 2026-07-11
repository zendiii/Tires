# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ARCHITECTURE.md: file-by-file guide for contributors (where to plug in
  backend APIs, edit the theme, add data, etc.); README now links to it

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
