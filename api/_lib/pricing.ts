/*
 * Retail pricing — how ATD's dealer cost becomes the price a customer sees.
 *
 * ============================================================================
 * THIS FILE MUST NEVER BE IMPORTED FROM src/.
 * ============================================================================
 * Everything under api/ runs only on Vercel's servers. Anything imported from
 * src/ is compiled into the JavaScript bundle every visitor downloads — so if
 * this logic shipped to the browser, customers could read your cost and your
 * exact margin on every tire. The whole point of the serverless layer is that
 * ATD's `BuyPrice` never leaves the server.
 *
 * Money is handled in integer cents throughout. Floating-point dollars
 * accumulate rounding errors ($0.1 + $0.2 !== $0.3), which is how storefronts
 * end up a penny off at checkout.
 */

/** A markup band. The first band whose ceiling the cost falls under wins. */
interface MarkupTier {
  /** Upper bound of dealer cost, in cents, for this band. */
  maxCost: number
  /** Percentage added on top of cost. */
  percent: number
  /** Floor on absolute profit, in cents — protects margin on cheap tires. */
  minMargin: number
}

/**
 * Default markup ladder. Percentages fall as cost rises: a $60 tire and a $400
 * tire take the same labour to source and fit, so the cheap one needs a fatter
 * percentage to be worth stocking, while a flat 45% on the expensive one would
 * price you out of the market.
 *
 * These are starting numbers — tune them against what ATD actually charges you
 * and what your local competition lists. Changing them requires a deploy, which
 * is deliberate: pricing changes belong in git history.
 */
const MARKUP_TIERS: MarkupTier[] = [
  { maxCost: 7_500, percent: 50, minMargin: 2_500 }, // under $75
  { maxCost: 15_000, percent: 42, minMargin: 3_800 }, // $75–150
  { maxCost: 27_500, percent: 35, minMargin: 6_300 }, // $150–275
  { maxCost: Infinity, percent: 28, minMargin: 9_600 }, // $275+
]

/**
 * Global nudge applied after the tier calculation, from the
 * ATD_MARKUP_MULTIPLIER env var. Lets you run a sale or a
 * across-the-board increase without editing the ladder. 1 = no change.
 */
function globalMultiplier(): number {
  const raw = Number(process.env.ATD_MARKUP_MULTIPLIER)
  return Number.isFinite(raw) && raw > 0 ? raw : 1
}

/** Rounds up to the next .99 — 129.40 becomes 129.99. */
function roundToCharm(cents: number): number {
  return Math.ceil(cents / 100) * 100 - 1
}

export interface PricedTire {
  /** What the customer pays per tire, excluding FET. Cents. */
  price: number
  /**
   * Federal excise tax, passed straight through at cost. Cents.
   * FET is a government levy, not merchandise — marking it up inflates a tax
   * line, so it's added after markup and never multiplied.
   */
  fet: number
}

/**
 * Turns ATD dealer cost into customer-facing price.
 *
 * @param costCents - ATD's BuyPrice, in cents. Never returned to the client.
 * @param fetCents  - ATD's Tax (federal excise tax), in cents.
 * @param mapCents  - Optional Minimum Advertised Price floor, in cents. Some
 *                    manufacturers contractually forbid advertising below a set
 *                    figure; if you're enrolled in such a program, pass it and
 *                    the result is lifted to meet it.
 */
export function applyMarkup(costCents: number, fetCents = 0, mapCents = 0): PricedTire {
  if (!Number.isFinite(costCents) || costCents <= 0) {
    // No usable cost means we must not invent a price.
    return { price: 0, fet: 0 }
  }

  const tier = MARKUP_TIERS.find((t) => costCents <= t.maxCost) ?? MARKUP_TIERS[MARKUP_TIERS.length - 1]

  const byPercent = costCents * (1 + tier.percent / 100)
  const byFloor = costCents + tier.minMargin
  const marked = Math.max(byPercent, byFloor) * globalMultiplier()

  const price = Math.max(roundToCharm(Math.round(marked)), mapCents)

  return { price, fet: Math.max(0, Math.round(fetCents)) }
}

/** Parses ATD's decimal strings ("129.4500") into integer cents. */
export function toCents(value: string | number | undefined): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(value ?? '')
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
