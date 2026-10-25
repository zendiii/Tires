/*
 * POST /api/stripe/webhook — Stripe's callback when money actually moves.
 *
 * WHY THIS EXISTS AT ALL
 * The success page is not proof of payment. A customer can close the tab
 * before redirecting, pay by a method that settles hours later, or simply type
 * /order/success into the address bar. This endpoint is Stripe telling our
 * server, out of band and cryptographically signed, what really happened. It
 * is the only trustworthy place to fulfil an order.
 *
 * SIGNATURE VERIFICATION IS NOT OPTIONAL. The URL is public — anyone can POST
 * a fake "payment succeeded" event at it. constructEventAsync is what proves
 * the body came from Stripe, and it needs the EXACT raw bytes: parsing the
 * body to JSON first and re-serialising changes whitespace and key order, and
 * the signature stops matching.
 */
import { STRIPE_CONFIGURED, WEBHOOK_SECRET, getStripe } from '../_lib/stripe'
import type Stripe from 'stripe'

export const config = { runtime: 'nodejs' }

/*
 * Named export, so @vercel/node hands us a real Web Request. That matters more
 * here than anywhere else: signature verification needs request.text() to read
 * the untouched raw body, which the legacy (req, res) path does not provide.
 */

export async function POST(request: Request): Promise<Response> {
  if (!STRIPE_CONFIGURED || !WEBHOOK_SECRET) {
    console.error('[webhook] Stripe is not configured; event dropped')
    return new Response('Not configured', { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    // request.text() gives the untouched body. Do not swap this for .json().
    const raw = await request.text()
    event = await getStripe().webhooks.constructEventAsync(raw, signature, WEBHOOK_SECRET)
  } catch (error) {
    // 400 tells Stripe not to retry — a bad signature will never become good.
    console.error('[webhook] signature verification failed:', error)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      // Fires later for methods that don't settle instantly (bank debits).
      // Both mean "this order is paid" and are handled identically.
      case 'checkout.session.async_payment_succeeded':
        await onPaid(event.data.object)
        break

      case 'checkout.session.async_payment_failed':
        console.warn('[webhook] delayed payment failed for', event.data.object.id)
        break

      default:
        // Stripe sends whatever the endpoint is subscribed to; unknown types
        // are acknowledged so they aren't retried forever.
        break
    }
  } catch (error) {
    // 500 asks Stripe to retry with backoff. Use it only for OUR failures
    // (supplier down, database unreachable) — things that may work next time.
    console.error('[webhook] handler failed for', event.type, error)
    return new Response('Handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * A paid order.
 *
 * Stripe guarantees at-least-once delivery, not exactly-once: this can run
 * twice for the same session after a retry. Every side effect added below must
 * therefore be keyed on session.id and skip if already done — otherwise a
 * network blip becomes a second set of tires shipped to the same driveway.
 */
async function onPaid(session: Stripe.Checkout.Session): Promise<void> {
  const cart = session.metadata?.cart ?? ''
  const fulfillment = session.metadata?.fulfillment ?? 'unknown'

  // Structured so these are greppable in Vercel's log search. Until Supabase
  // lands (later phase), this log IS the order record — Stripe's dashboard
  // holds the money side, and the cart packing holds the product side.
  console.info(
    '[order]',
    JSON.stringify({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      total: session.amount_total,
      currency: session.currency,
      email: session.customer_details?.email,
      phone: session.customer_details?.phone,
      name: session.customer_details?.name,
      address: session.customer_details?.address,
      fulfillment,
      cart,
    }),
  )

  // ---------------------------------------------------------------------
  // NEXT PHASE — this is the seam where the order stops being a log line:
  //
  //   1. Persist to Supabase, keyed on session.id, and bail out early if the
  //      row already exists. That single check is what makes this idempotent.
  //   2. Place the matching ATD order (PlaceOrder, using the product codes
  //      packed into metadata.cart). Deliberately not wired yet: it moves real
  //      inventory and needs a sandbox run first.
  //   3. For 'mobile' / 'shop', create the Housecall Pro job from
  //      customer_details so the install is on the schedule automatically.
  //   4. Email the customer. Stripe's own receipt covers payment, not the
  //      appointment.
  //
  // Order matters: persist FIRST. If step 2 throws and we return 500, Stripe
  // retries — and without a record written, the retry places a second order.
  // ---------------------------------------------------------------------
}
