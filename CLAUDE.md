# Dino's Tires

Product vision lives in goal.md — read it before feature work.

## Key Decisions

- Stack: Vite + React + TypeScript + Tailwind v4; hosted on Vercel (GitHub repo auto-deploys)
- No backend in phase 1 — tire/fitment data ships as static JSON; serverless functions (Stripe, fitment APIs) and Supabase (auth/orders) come in later phases
- Tailwind v4: design tokens live in `@theme` in src/index.css; there is no tailwind.config.js
- Progressive disclosure over dense filter pages — guide the customer step by step
- OEM (factory) tire size is always recommended first; upgrades second

## Domain Knowledge

- Tire size format: 275/55R20 = width(mm)/aspect-ratio R wheel-diameter(in)
- "Staggered setup" = different tire sizes front vs rear (Corvette, BMW M, etc.) — UI must handle both axles
- Fulfillment is three-way: ship to home, mobile installation, in-shop installation

## Conventions

- SemVer starting at 0.1.0; update CHANGELOG.md ([Unreleased] section) with each significant change
- Conventional commits (feat:/fix:/docs:/refactor:/test:)
- The user is learning — briefly explain non-obvious technical decisions when making them
