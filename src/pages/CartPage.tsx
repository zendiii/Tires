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
import TireGraphic from '../components/TireGraphic'

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

  if (items.length === 0) {
    return (
      <div className="px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-neutral-400">Let's find the right set for you.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/shop/vehicle"
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover"
          >
            Shop by Vehicle
          </Link>
          <Link
            to="/shop/size"
            className="rounded-full border border-neutral-700 px-6 py-2.5 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
          >
            Shop by Size
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
      <h1 className="text-3xl font-bold">Your Cart</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Line items */}
        <div className="space-y-4">
          {items.map((item) => {
            const tire = tires[item.tireId]
            return (
              <div
                key={`${item.tireId}-${item.size}`}
                className="flex items-center gap-5 rounded-2xl border border-neutral-800 bg-surface-card p-5"
              >
                <TireGraphic className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {tire ? `${tire.brand} ${tire.model}` : 'Loading…'}
                  </p>
                  <p className="font-mono text-sm text-neutral-500">{item.size}</p>
                </div>
                <select
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.tireId, item.size, Number(e.target.value))}
                  className="rounded-full border border-neutral-700 bg-surface-dark px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <p className="w-24 text-right font-semibold">
                  {tire ? formatPrice(tire.price * item.quantity) : '—'}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.tireId, item.size)}
                  className="text-neutral-600 transition-colors hover:text-red-400"
                  aria-label="Remove from cart"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        {/* Fulfillment + summary */}
        <aside className="h-fit space-y-6 rounded-2xl border border-neutral-800 bg-surface-card p-6">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-neutral-400 uppercase">
              How do you want them?
            </h2>
            <div className="mt-4 space-y-3">
              {FULFILLMENT_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
                    fulfillment === o.id
                      ? 'border-brand bg-brand/5'
                      : 'border-neutral-800 hover:border-neutral-600'
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
                  <span className="flex items-center justify-between font-semibold">
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

          <dl className="space-y-2 border-t border-neutral-800 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-400">Subtotal ({count} tires)</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-400">{option.label}</dt>
              <dd>{fulfillmentFee === 0 ? 'Free' : formatPrice(fulfillmentFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-800 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <div>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full bg-neutral-800 py-3 font-semibold text-neutral-500"
            >
              Checkout
            </button>
            <p className="mt-2 text-center text-xs text-neutral-600">
              Secure checkout with payment and appointment scheduling is coming
              in the next phase.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
