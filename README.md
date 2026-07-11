# Dino's Tires

![version](https://img.shields.io/badge/version-0.2.0-orange)

A premium online tire shopping experience — clean, modern, and guided, with
mobile installation built in. See [goal.md](goal.md) for the full product vision.

## Tech Stack

- **Frontend:** [Vite](https://vite.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (configured via `@theme` tokens in `src/index.css`)
- **Hosting:** [Vercel](https://vercel.com/), auto-deployed from this GitHub repo
- **Backend:** none yet — phase 1 is fully static; serverless functions and Supabase come in later phases

## Getting Started

```bash
npm install     # install dependencies
npm run dev     # start dev server at http://localhost:5173
npm run build   # type-check and build for production
npm run preview # preview the production build locally
```

## Project Structure

```
src/
  main.tsx       # entry point: mounts React, router, cart provider
  App.tsx        # route table
  index.css      # Tailwind + brand design tokens (@theme)
  types/         # shared domain types (Tire, Fitment, cart, fulfillment)
  data/          # sample tire catalog + vehicle fitment JSON
  services/      # data access — the seam where the real backend plugs in
  context/       # cart state (React Context + localStorage)
  components/    # layout, tire card, wheel visualizer, vehicle selector
  pages/         # one file per route
public/          # static files served as-is
```

**Contributors: see [ARCHITECTURE.md](ARCHITECTURE.md)** for a file-by-file
guide, including exactly where to plug in the backend APIs or edit the theme.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). We're in the
`0.x.x` initial-development phase; changes are tracked in
[CHANGELOG.md](CHANGELOG.md).

## Deployment

Pushing to `master` triggers a production deploy on Vercel. The custom domain
is managed at Namecheap and points to Vercel via DNS (CNAME → `cname.vercel-dns.com`).
