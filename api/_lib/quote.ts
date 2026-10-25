/*
 * Server-side cart pricing — the trust boundary for checkout.
 *
 * ============================================================================
 * THE RULE: the browser sends WHAT the customer wants, never WHAT IT COSTS.
 * ============================================================================
 * Our cart in localStorage holds only { tireId, size, quantity } — no money at
 * all. That is not an accident, and it must stay that way. If the client sent
 * prices and we forwarded them to Stripe, anyone could open devtools, edit
 * localStorage, and buy a $400 Michelin for $1. We would ship the tire and
 * Stripe would happily capture the dollar.
 *
 * So every price in a Checkout Session is recomputed here, on the server, from
 * the supplier feed. The client's numbers are never read — only its intent.
 *
 * SERVER-ONLY. Never import from src/.
 */
import { ATD_CONFIGURED, searchBySize } from './atd'
import { STRIPE_TEST_MODE } from './stripe'
import { FULFILLMENT_OPTIONS } from '../../src/types'
import type { FulfillmentMethod } from '../../src/types'
import sampleTires from '../../src/data/tires.json'

/** Guards against a typo'd or hostile quantity turning into a huge charge. */
const MAX_QUANTITY_PER_LINE = 8
const MAX_LINES = 6

/** What the browser is allowed to tell us. Note the absence of any price. */
export interface CartRequestItem {
  tireId: string
  size: string
  quantity: number
}

export interface QuoteLine {
  tireId: string
  size: string
  quantity: number
  name: string
  /** Customer price per tire in cents, markup applied, FET excluded. */
  unitPrice: number
  /** Federal excise tax per tire in cents, at cost. */
  fet: number
  /** ATD product code, when live. Needed to place the supplier order later. */
  productCode: string
}

export interface Quote {
  lines: QuoteLine[]
  fulfillment: { id: FulfillmentMethod; label: string; feePerTire: number }
  /** All totals in integer cents. */
  subtotal: number
  fetTotal: number
  fulfillmentTotal: number
  total: number
  tireCount: number
}

/** Thrown for anything the customer should see a specific message about. */
export class QuoteError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function isFulfillment(value: unknown): value is FulfillmentMethod {
  return value === 'ship' || value === 'mobile' || value === 'shop'
}

/**
 * Validates the raw JSON body into a cart we're willing to price.
 *
 * Everything arriving over the wire is untrusted, including shapes — a missing
 * field here would otherwise surface as `undefined` deep inside a Stripe call.
 */
export function parseCart(body: unknown): {
  items: CartRequestItem[]
  fulfillment: FulfillmentMethod
} {
  if (typeof body !== 'object' || body === null) {
    throw new QuoteError('Malformed request.')
  }

  const { items, fulfillment } = body as Record<string, unknown>

  if (!isFulfillment(fulfillment)) {
    throw new QuoteError('Choose how you want your tires delivered.')
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new QuoteError('Your cart is empty.')
  }
  if (items.length > MAX_LINES) {
    throw new QuoteError(`Orders are limited to ${MAX_LINES} different tires. Give us a call for a larger order.`)
  }

  const parsed = items.map((raw): CartRequestItem => {
    const { tireId, size, quantity } = (raw ?? {}) as Record<string, unknown>
    if (typeof tireId !== 'string' || typeof size !== 'string') {
      throw new QuoteError('Malformed cart item.')
    }
    // Number() on a non-numeric string gives NaN, which fails the range check.
    const qty = Math.floor(Number(quantity))
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QUANTITY_PER_LINE) {
      throw new QuoteError(`Quantities must be between 1 and ${MAX_QUANTITY_PER_LINE} per tire.`)
    }
    return { tireId, size, quantity: qty }
  })

  return { items: parsed, fulfillment }
}

/** Prices one line against live ATD inventory. */
async function priceFromAtd(item: CartRequestItem): Promise<QuoteLine> {
  const results = await searchBySize(item.size.toUpperCase())
  const tire = results.find((t) => t.id === item.tireId)

  if (!tire) {
    throw new QuoteError(`That tire is no longer available in ${item.size}.`, 409)
  }
  if (!tire.inStock) {
    throw new QuoteError(`${tire.brand} ${tire.model} just went out of stock.`, 409)
  }
  // Re-check the price is real. applyMarkup returns 0 for unusable cost, and a
  // $0 line in Stripe would be an order we ship for free.
  if (tire.price <= 0) {
    throw new QuoteError('We could not confirm pricing on that tire. Please call us.', 409)
  }

  return {
    tireId: tire.id,
    size: tire.size,
    quantity: item.quantity,
    name: `${tire.brand} ${tire.model}`,
    unitPrice: tire.price,
    fet: tire.fet,
    productCode: tire.productCode,
  }
}

/**
 * Prices one line against the bundled sample catalog.
 *
 * Only reachable under Stripe TEST keys — see checkoutSource(). This exists so
 * the whole payment flow can be built and tested before ATD credentials land,
 * without ever being able to take real money for imaginary stock.
 */
function priceFromSample(item: CartRequestItem): QuoteLine {
  const tire = (sampleTires as {
    id: string
    brand: string
    model: string
    price: number
    sizes: string[]
    inStock: boolean
  }[]).find((t) => t.id === item.tireId)

  if (!tire || !tire.sizes.includes(item.size)) {
    throw new QuoteError(`That tire is no longer available in ${item.size}.`, 409)
  }

  return {
    tireId: tire.id,
    size: item.size,
    quantity: item.quantity,
    name: `${tire.brand} ${tire.model}`,
    // Sample prices are dollars; everything past this line is integer cents.
    unitPrice: Math.round(tire.price * 100),
    fet: 0,
    productCode: '',
  }
}

/**
 * Which catalog checkout is allowed to price from.
 *
 * 'none' means refuse to open a session at all. That's the state a live-key
 * deploy lands in before ATD is connected, and it is the correct one: better a
 * disabled button than an order for a tire we can't actually source.
 */
export function checkoutSource(): 'atd' | 'sample' | 'none' {
  if (ATD_CONFIGURED) return 'atd'
  if (STRIPE_TEST_MODE) return 'sample'
  return 'none'
}

/** Recomputes every price from the supplier. The client's figures are ignored. */
export async function quoteCart(
  items: CartRequestItem[],
  fulfillment: FulfillmentMethod,
): Promise<Quote> {
  const source = checkoutSource()
  if (source === 'none') {
    throw new QuoteError('Online ordering is not available yet.', 503)
  }

  const lines =
    source === 'atd'
      ? await Promise.all(items.map(priceFromAtd))
      : items.map(priceFromSample)

  const option = FULFILLMENT_OPTIONS.find((o) => o.id === fulfillment)!
  const feePerTire = Math.round(option.feePerTire * 100)

  const tireCount = lines.reduce((n, l) => n + l.quantity, 0)
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0)
  const fetTotal = lines.reduce((n, l) => n + l.fet * l.quantity, 0)
  const fulfillmentTotal = feePerTire * tireCount

  return {
    lines,
    fulfillment: { id: option.id, label: option.label, feePerTire },
    subtotal,
    fetTotal,
    fulfillmentTotal,
    total: subtotal + fetTotal + fulfillmentTotal,
    tireCount,
  }
}
