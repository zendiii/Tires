/*
 * /order/success?session_id=cs_... — where Stripe sends the customer back.
 *
 * This page CONFIRMS an order; it does not create one. The session id in the
 * URL is only a lookup key — we ask our server what Stripe actually says about
 * it, because anyone can type this path into the address bar. Fulfilment (the
 * supplier order, the scheduled install) happens in api/stripe/webhook.ts,
 * which hears from Stripe directly and can't be faked by a visitor.
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrderSummary } from '../services/checkout'
import type { OrderSummary } from '../services/checkout'
import { formatPrice } from '../types'
import { useCart } from '../context/CartContext'
import { SITE } from '../config/site'

/** What happens next, in the customer's terms, per fulfillment choice. */
const NEXT_STEPS: Record<string, string> = {
  ship: "Your tires ship from our distributor and arrive in 2-4 business days. We'll email tracking as soon as it's issued.",
  mobile:
    "We'll call you at the number you gave Stripe to lock in a time and confirm where the van should park.",
  shop: "We'll call you to set your appointment. Bring the vehicle in and you'll be back on the road the same visit.",
}

export default function OrderSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id') ?? ''
  const { clear } = useCart()

  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Block body: a concise arrow would return this promise, and React calls
    // any non-undefined return as the effect's cleanup. See CHANGELOG 0.5.2.
    if (!sessionId) {
      setError('We could not find that order.')
      return
    }

    let cancelled = false
    getOrderSummary(sessionId)
      .then((summary) => {
        if (cancelled) return
        setOrder(summary)
        // Empty the cart only once payment is confirmed — a customer who
        // backed out of Stripe should find their cart exactly as they left it.
        if (summary.paid) clear()
      })
      .catch(() => {
        if (!cancelled) setError('We could not find that order.')
      })

    return () => {
      cancelled = true
    }
    // `clear` is stable (useCallback in CartProvider), so depending on it
    // costs nothing and keeps the dependency list honest.
  }, [sessionId, clear])

  if (error) {
    return (
      <div className="px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Order not found</h1>
        <p className="mx-auto mt-3 max-w-md text-neutral-400">
          If you were charged, your confirmation email has the details — or give
          us a call and we'll sort it out.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {SITE.phone && (
            <a
              href={`tel:${SITE.phone}`}
              className="skew-brand bg-brand px-7 py-3 transition-colors hover:bg-brand-hover"
            >
              <span className="skew-fix block font-display text-sm text-white">
                Call {SITE.phoneDisplay}
              </span>
            </a>
          )}
          <Link
            to="/"
            className="skew-brand border border-edge px-7 py-3 transition-colors hover:border-brand"
          >
            <span className="skew-fix block font-display text-sm">Back Home</span>
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="px-6 py-24 text-center text-neutral-400">
        Confirming your order…
      </div>
    )
  }

  // Paid but not yet settled (bank debits clear over days). Saying "confirmed"
  // here would be a promise we can't keep if it later fails.
  if (!order.paid) {
    return (
      <div className="px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Payment processing</h1>
        <p className="mx-auto mt-3 max-w-md text-neutral-400">
          Your payment is still clearing. We'll email you the moment it lands and
          start on your order then.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-enter mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="skew-brand h-8 w-1.5 bg-brand" />
        <h1 className="font-display text-4xl">You're set</h1>
      </div>

      <p className="mt-4 text-neutral-400">
        Payment confirmed{order.email ? <> — receipt sent to {order.email}</> : null}.
      </p>

      <div className="mt-10 border border-edge bg-surface-card p-6">
        <dl className="space-y-2.5 text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-4">
              <dt className="text-neutral-400">
                {item.description}
                {item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </dt>
              {/* Stripe reports cents; the UI formats dollars. */}
              <dd className="shrink-0">{formatPrice(item.amount / 100)}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-edge pt-3">
            <dt className="font-display text-lg">Total paid</dt>
            <dd className="font-display text-2xl">{formatPrice(order.total / 100)}</dd>
          </div>
        </dl>
      </div>

      {order.fulfillment && NEXT_STEPS[order.fulfillment] && (
        <div className="mt-6 border-l-2 border-brand bg-surface-card p-5">
          <h2 className="font-display text-lg">What happens next</h2>
          <p className="mt-2 text-sm text-neutral-400">
            {NEXT_STEPS[order.fulfillment]}
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          to="/"
          className="skew-brand bg-brand px-7 py-3 transition-colors hover:bg-brand-hover"
        >
          <span className="skew-fix block font-display text-sm text-white">Back Home</span>
        </Link>
        {SITE.phone && (
          <a
            href={`tel:${SITE.phone}`}
            className="skew-brand border border-edge px-7 py-3 transition-colors hover:border-brand"
          >
            <span className="skew-fix block font-display text-sm">
              Questions? {SITE.phoneDisplay}
            </span>
          </a>
        )}
      </div>
    </div>
  )
}
