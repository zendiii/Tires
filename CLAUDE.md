# Dino's Tires

Product vision lives in goal.md — read it before feature work.

## Key Decisions

- Stack: Vite + React + TypeScript + Tailwind v4; hosted on Vercel (GitHub repo auto-deploys)
- No backend in phase 1 — tire/fitment data ships as static JSON; serverless functions (Stripe, fitment APIs) and Supabase (auth/orders) come in later phases
- Tailwind v4: design tokens live in `@theme` in src/index.css; there is no tailwind.config.js
- Brand palette comes from the logo, not goal.md: red `#e24233`, black, white — goal.md says "orange" but that predates the real branding. Do not reintroduce orange.
- Logo is used as cropped PNG, not the source SVG: the SVGs set the wordmark as live text in Zuume Bold (a licensed font visitors lack), so SVG would render it in a wrong fallback face
- Display type is Anton (free stand-in for the logo's Zuume Bold); body is Inter. Both self-hosted via @fontsource — no external font CDN
- Angular `skew-brand`/`skew-fix` utilities echo the logo's raked badge; square corners, never rounded
- Progressive disclosure over dense filter pages — guide the customer step by step
- OEM (factory) tire size is always recommended first; upgrades second

## Domain Knowledge

- Tire size format: 275/55R20 = width(mm)/aspect-ratio R wheel-diameter(in)
- "Staggered setup" = different tire sizes front vs rear (Corvette, BMW M, etc.) — UI must handle both axles
- Fulfillment is three-way: ship to home, mobile installation, in-shop installation

## Current Phase

- Scheduling is the primary conversion path; tire e-commerce is gated behind `FEATURES.ecommerce` in src/config/site.ts until live inventory/pricing APIs exist. Shop pages stay browsable but show a preview banner and disabled Add to Cart.
- Booking runs on Housecall Pro. The booking URL is account-specific (Marketing → Online Booking) and lives in `BOOKING.url`; never invent one — an empty value degrades to a contact fallback by design.

## Conventions

- SemVer starting at 0.1.0; update CHANGELOG.md ([Unreleased] section) with each significant change
- Conventional commits (feat:/fix:/docs:/refactor:/test:)
- The user is learning — briefly explain non-obvious technical decisions when making them
