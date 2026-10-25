/*
 * POST /api/checkout/session   — open a Stripe Checkout Session, return its URL
 * GET  /api/checkout/session?id=cs_... — read back what a finished session bought
 *
 * Both live in one file because Vercel counts serverless functions, not routes,
 * and the two halves share the same guards.
 *
 * The browser sends only { items: [{tireId, size, quantity}], fulfillment }.
 * Prices are recomputed here from the supplier — see api/_lib/quote.ts for why.
 */
import { STRIPE_CONFIGURED, AUTOMATIC_TAX, getStripe, siteUrl } from '../_lib/stripe'
import { QuoteError, checkoutSource, parseCart, quoteCart } from '../_lib/quote'
import type { Quote } from '../_lib/quote'
import { json, requestUrl } from '../_lib/http'
import type Stripe from 'stripe'

export const config = { runtime: 'nodejs' }

/** Guards both methods share. Returns a Response when checkout is unavailable. */
function unavailable(): Response | null {
  if (!STRIPE_CONFIGURED) return json({ error: 'Payments are not connected yet.' }, 503)
  if (checkoutSource() === 'none') return json({ error: 'Online ordering is not available yet.' }, 503)
  return null
}

/*
 * QuoteError carries a message written for the customer. Anything else is ours
 * to debug and theirs to be shielded from — an unmasked Stripe error can name
 * internal ids and account state.
 */
function fail(error: unknown): Response {
  if (error instanceof QuoteError) return json({ error: error.message }, error.status)
  console.error('[api/checkout/session]', error)
  return json({ error: 'We could not start checkout. Please try again.' }, 500)
}

export async function POST(request: Request): Promise<Response> {
  const blocked = unavailable()
  if (blocked) return blocked
  try {
    return await createSession(request)
  } catch (error) {
    return fail(error)
  }
}

export async function GET(request: Request): Promise<Response> {
  const blocked = unavailable()
  if (blocked) return blocked
  try {
    return await readSession(request)
  } catch (error) {
    return fail(error)
  }
}

async function createSession(request: Request): Promise<Response> {
  const { items, fulfillment } = parseCart(await request.json().catch(() => null))
  const quote = await quoteCart(items, fulfillment)

  const base = siteUrl()

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems(quote),

    // {CHECKOUT_SESSION_ID} is substituted by Stripe on redirect — it is a
    // literal placeholder, not a template string we fill in.
    success_url: `${base}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/cart`,

    // A mobile tire business runs on phone contact: this is the number the
    // tech calls when they're outside. Not optional for us.
    phone_number_collection: { enabled: true },

    // Doubles as the service address for mobile installs, and Stripe Tax needs
    // a destination to calculate against.
    shipping_address_collection: { allowed_countries: ['US'] },

    automatic_tax: { enabled: AUTOMATIC_TAX },

    // Everything the webhook needs to fulfil the order without re-pricing.
    // Stripe caps each metadata value at 500 characters, so the cart is packed
    // rather than stored as JSON.
    metadata: {
      fulfillment: quote.fulfillment.id,
      tire_count: String(quote.tireCount),
      cart: packCart(quote),
    },

    payment_intent_data: {
      description: `${quote.tireCount} tire(s) — ${quote.fulfillment.label}`,
    },
  })

  if (!session.url) {
    throw new Error('Stripe returned a session with no redirect URL')
  }

  // The client only ever needs somewhere to go.
  return json({ url: session.url })
}

async function readSession(request: Request): Promise<Response> {
  const id = requestUrl(request).searchParams.get('id') ?? ''

  // Reject anything that isn't shaped like a session id before spending a call.
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) {
    return json({ error: 'Unknown order.' }, 400)
  }

  const session = await getStripe().checkout.sessions.retrieve(id, {
    expand: ['line_items'],
  })

  // Return only what a confirmation page should show. The full session object
  // carries payment-method details and internal ids that have no business in
  // a page anyone with the URL can load.
  return json({
    paid: session.payment_status === 'paid',
    email: session.customer_details?.email ?? null,
    total: session.amount_total ?? 0,
    fulfillment: session.metadata?.fulfillment ?? null,
    items:
      session.line_items?.data.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })) ?? [],
  })
}

/**
 * Turns the quote into Stripe line items.
 *
 * FET rides inside each tire's unit price rather than as its own line. It is
 * a per-tire federal levy the customer genuinely owes, so it belongs in the
 * per-tire amount; splitting it out would leave a line whose quantity has to
 * track the tires' quantity forever. The disclosure lives in the description,
 * which is what prints on the Stripe receipt.
 */
function lineItems(quote: Quote): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const tires = quote.lines.map((line) => ({
    quantity: line.quantity,
    price_data: {
      currency: 'usd',
      unit_amount: line.unitPrice + line.fet,
      product_data: {
        name: `${line.name} — ${line.size}`,
        description:
          line.fet > 0
            ? `Includes $${(line.fet / 100).toFixed(2)} federal excise tax per tire.`
            : undefined,
      },
    },
  }))

  // Ship-to-home is free, and a $0 line item is rejected by Checkout.
  if (quote.fulfillment.feePerTire > 0) {
    tires.push({
      quantity: quote.tireCount,
      price_data: {
        currency: 'usd',
        unit_amount: quote.fulfillment.feePerTire,
        product_data: {
          name: quote.fulfillment.label,
          description: 'Per tire, mounted and balanced.',
        },
      },
    })
  }

  return tires
}

/**
 * Packs the cart into one metadata value: "id:size:qty:productCode|...".
 *
 * The webhook needs product codes to place the matching ATD order, and Stripe's
 * own line items don't carry them.
 */
function packCart(quote: Quote): string {
  const packed = quote.lines
    .map((l) => `${l.tireId}:${l.size}:${l.quantity}:${l.productCode}`)
    .join('|')

  // Truncating would silently drop a tire from the supplier order. MAX_LINES
  // in quote.ts keeps carts well under this, so overflow means a bug upstream.
  if (packed.length > 500) {
    throw new QuoteError('That order is too large to process online. Please call us.', 400)
  }
  return packed
}

