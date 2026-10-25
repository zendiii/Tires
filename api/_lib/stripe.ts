/*
 * Stripe client — SERVER ONLY.
 *
 * ============================================================================
 * THIS FILE MUST NEVER BE IMPORTED FROM src/.
 * ============================================================================
 * It holds the secret key. Anything under src/ is compiled into the bundle
 * every visitor downloads; a leaked `sk_live_...` lets a stranger issue
 * refunds, read every customer's details, and charge cards in your name.
 *
 * Note what this project does NOT need: Stripe.js and a publishable key.
 * We use hosted Checkout, where the server creates a session and the browser
 * is redirected to Stripe's own domain. Card numbers never touch our code,
 * our bundle, or our servers — which is the whole reason to do it this way.
 */
import Stripe from 'stripe'

/**
 * Reads an env var, tolerating a value that was pasted with surrounding
 * quotes or stray whitespace.
 *
 * `.env` files take values literally: STRIPE_SECRET_KEY="sk_test_..." yields a
 * string that BEGINS with a double-quote character, so every prefix check
 * fails and checkout answers a flat 503 with nothing in the log explaining
 * why. Cheap to absorb here; expensive to debug at 11pm.
 */
function env(name: string): string {
  const raw = (process.env[name] ?? '').trim()
  return raw.length >= 2 && raw[0] === raw[raw.length - 1] && (raw[0] === '"' || raw[0] === "'")
    ? raw.slice(1, -1).trim()
    : raw
}

const SECRET_KEY = env('STRIPE_SECRET_KEY')

/** Set once Stripe keys are in the environment; false locally by default. */
export const STRIPE_CONFIGURED: boolean = SECRET_KEY.startsWith('sk_')

/**
 * True when running against Stripe's test mode.
 *
 * This gates whether checkout may price from the bundled sample catalog: test
 * keys can, live keys cannot. It means a production deploy physically cannot
 * sell a made-up tire at a made-up price, with no extra config to forget.
 */
export const STRIPE_TEST_MODE: boolean = SECRET_KEY.startsWith('sk_test_')

/**
 * Stripe Tax. Off by default because it needs registrations configured in the
 * dashboard first — enabling it before that makes every session fail. Flip
 * STRIPE_AUTOMATIC_TAX=true once Florida (and anywhere else you have nexus)
 * is registered under Stripe → Tax.
 */
export const AUTOMATIC_TAX: boolean = env('STRIPE_AUTOMATIC_TAX') === 'true'

/** Verifies webhook signatures. Different value per endpoint, per mode. */
export const WEBHOOK_SECRET: string = env('STRIPE_WEBHOOK_SECRET')

let client: Stripe | null = null

/**
 * The Stripe client, built on first use.
 *
 * Lazily, and that matters: `new Stripe('')` THROWS. Constructing at module
 * load meant that on a deploy with no key set, importing this file crashed
 * before any handler ran — so the polite "payments aren't connected yet" 503
 * became an opaque 500. Callers must still check STRIPE_CONFIGURED first;
 * this only ensures they get the chance to.
 *
 * The API version is pinned deliberately. Stripe ties each account to a
 * default version in the dashboard, and if that default moves, response shapes
 * can change under code that was working fine. Pinning here means upgrades are
 * something you do on purpose, in a commit, not something that happens to you.
 */
export function getStripe(): Stripe {
  if (!STRIPE_CONFIGURED) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!client) {
    client = new Stripe(SECRET_KEY, {
      apiVersion: '2026-08-26.dahlia',
      appInfo: { name: "Dino's Mobile Tires", url: 'https://dinosmobiletires.com' },
    })
  }
  return client
}

/**
 * Absolute base URL for redirect targets.
 *
 * Deliberately NOT read from the request's Origin/Host header: those are
 * attacker-controlled, and a forged one would send a paying customer to
 * someone else's site after checkout. Set SITE_URL in Vercel; the
 * VERCEL_* fallbacks cover preview deploys.
 */
export function siteUrl(): string {
  const explicit = env('SITE_URL')
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:5173'
}
