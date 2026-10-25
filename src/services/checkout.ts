/*
 * Checkout — hands the cart to our serverless function and follows Stripe.
 *
 * Note how little this file does, and especially what it does NOT send: no
 * prices. It posts the customer's intent (which tire, which size, how many,
 * how they want it) and the server works out the money from the supplier feed.
 * Anything this file claimed about price would be a number the customer could
 * have edited in devtools first.
 *
 * There is no Stripe.js here and no publishable key in the bundle. Hosted
 * Checkout is a plain redirect to stripe.com, so card details never pass
 * through our code at all.
 */
import type { CartItem, FulfillmentMethod } from '../types'

/** What the confirmation page shows. Mirrors GET /api/checkout/session. */
export interface OrderSummary {
  paid: boolean
  email: string | null
  /** Integer cents, as Stripe reports it. */
  total: number
  fulfillment: string | null
  items: { description: string | null; quantity: number | null; amount: number }[]
}

/**
 * Opens a Checkout Session and redirects the browser to Stripe.
 *
 * On success this never returns — the page navigates away. It throws only when
 * checkout couldn't be started, with a message meant for the customer.
 */
export async function startCheckout(
  items: CartItem[],
  fulfillment: FulfillmentMethod,
): Promise<never> {
  const response = await fetch('/api/checkout/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map(({ tireId, size, quantity }) => ({ tireId, size, quantity })),
      fulfillment,
    }),
  })

  const body = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null

  if (!response.ok || !body?.url) {
    throw new Error(body?.error ?? 'We could not start checkout. Please try again.')
  }

  // assign, not replace: the cart stays in history so "back" returns to it.
  window.location.assign(body.url)

  // Navigation isn't instant; this keeps callers from rendering a "done" state
  // in the gap, and satisfies the never-returns contract.
  return new Promise<never>(() => {})
}

/** Reads back a finished session so the success page can confirm it. */
export async function getOrderSummary(sessionId: string): Promise<OrderSummary> {
  const response = await fetch(
    `/api/checkout/session?id=${encodeURIComponent(sessionId)}`,
  )
  if (!response.ok) {
    throw new Error('We could not find that order.')
  }
  return (await response.json()) as OrderSummary
}
