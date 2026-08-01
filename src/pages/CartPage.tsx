/*
 * Cart + fulfillment selection. This is where Dino's differentiator shows up:
 * the customer picks HOW they get their tires (ship / mobile / in-shop),
 * with per-tire installation fees rolled into the total.
 *
 * Checkout itself is a placeholder — payments (Stripe) arrive with the
 * serverless backend in a later phase.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FulfillmentMethod, Tire } from '../types'
import { FULFILLMENT_OPTIONS, formatPrice } from '../types'
import { getTireById } from '../services/catalog'
import { useCart } from '../context/CartContext'
import { FEATURES } from '../config/site'
import TireGraphic from '../components/TireGraphic'
import BookButton from '../components/BookButton'

export default function CartPage() {
  const { items, count, updateQuantity, removeItem } = useCart()
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>('ship')
  // Tire details are fetched per cart item (cart stores only ids — the
  // catalog stays the single source of truth for names and prices).
  const [tires, setTires] = useState<Record<string, Tire>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all(items.map((i) => getTireById(i.tireId))).then((results) => {
      if (cancelled) return
      const map: Record<string, Tire> = {}
      results.forEach((tire) => {
        if (tire) map[tire.id] = tire
      })
      setTires(map)
    })
    return () => {
      cancelled = true
    }
  }, [items])

  // Online ordering is gated until inventory/pricing APIs are live. The route
  // stays reachable (old links, stale localStorage carts) but sends people to
  // the thing we can actually do today.
  if (!FEATURES.ecommerce) {
    return (
      <div className="px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Online ordering is coming soon</h1>
        <p className="mx-auto mt-3 max-w-md text-neutral-400">
          We're connecting our live inventory feed. Until then, book an
          installation and we'll source your set and confirm pricing.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <BookButton className="skew-brand bg-brand px-7 py-3 text-sm text-white transition-colors hover:bg-brand-hover">
            Schedule Service
          </BookButton>
          <Link
            to="/shop/vehicle"
            className="skew-brand border border-edge px-7 py-3 transition-colors hover:border-brand"
          >
            <span className="skew-fix block font-display text-sm">Browse Tires</span>
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-neutral-400">Let's find the right set for you.</p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/shop/vehicle" className="skew-brand bg-brand px-7 py-3 hover:bg-brand-hover">
            <span className="skew-fix block font-display text-sm text-white">Shop by Vehicle</span>
          </Link>
          <Link
            to="/shop/size"
            className="skew-brand border border-edge px-7 py-3 transition-colors hover:border-brand"
          >
            <span className="skew-fix block font-display text-sm">Shop by Size</span>
          </Link>
        </div>
      </div>
    )
  }

  const option = FULFILLMENT_OPTIONS.find((o) => o.id === fulfillment)!
  const subtotal = items.reduce(
    (sum, item) => sum + (tires[item.tireId]?.price ?? 0) * item.quantity,
    0,
  )
  const fulfillmentFee = option.feePerTire * count
  const total = subtotal + fulfillmentFee

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl">Your Cart</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Line items */}
        <div className="space-y-4">
          {items.map((item) => {
            const tire = tires[item.tireId]
            return (
              <div
                key={`${item.tireId}-${item.size}`}
                className="flex items-center gap-5 border border-edge bg-surface-card p-5"
              >
                <TireGraphic className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg">
                    {tire ? `${tire.brand} ${tire.model}` : 'Loading…'}
                  </p>
                  <p className="font-mono text-sm text-neutral-500">{item.size}</p>
                </div>
                <select
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.tireId, item.size, Number(e.target.value))}
                  className="border border-edge bg-surface-dark px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none"
                  aria-label="Quantity"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <p className="w-24 text-right font-display text-lg">
                  {tire ? formatPrice(tire.price * item.quantity) : '—'}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.tireId, item.size)}
                  className="text-neutral-600 transition-colors hover:text-brand"
                  aria-label="Remove from cart"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        {/* Fulfillment + summary */}
        <aside className="h-fit space-y-7 border border-edge bg-surface-card p-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="skew-brand h-5 w-1.5 bg-brand" />
              <h2 className="font-display text-lg">How do you want them?</h2>
            </div>
            <div className="mt-4 space-y-3">
              {FULFILLMENT_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className={`block cursor-pointer border p-4 transition-colors ${
                    fulfillment === o.id
                      ? 'border-brand bg-brand/10'
                      : 'border-edge hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value={o.id}
                    checked={fulfillment === o.id}
                    onChange={() => setFulfillment(o.id)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between font-display">
                    {o.label}
                    <span className="text-sm text-brand">
                      {o.feePerTire === 0 ? 'Free' : `+${formatPrice(o.feePerTire)}/tire`}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-neutral-400">{o.description}</span>
                </label>
              ))}
            </div>
          </div>

          <dl className="space-y-2.5 border-t border-edge pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-400">Subtotal ({count} tires)</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-400">{option.label}</dt>
              <dd>{fulfillmentFee === 0 ? 'Free' : formatPrice(fulfillmentFee)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-edge pt-3">
              <dt className="font-display text-lg">Total</dt>
              <dd className="font-display text-2xl">{formatPrice(total)}</dd>
            </div>
          </dl>

          <div>
            <button
              type="button"
              disabled
              className="skew-brand w-full cursor-not-allowed bg-surface-raised py-3.5"
            >
              <span className="skew-fix block font-display text-neutral-500">Checkout</span>
            </button>
            <p className="mt-3 text-center text-xs text-neutral-600">
              Secure checkout with payment and appointment scheduling is coming
              in the next phase.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
