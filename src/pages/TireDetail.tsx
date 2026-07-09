/*
 * Tire detail page: /tire/:id?size=275/55R20
 * Bigger visual, full spec table, quantity picker (defaults to 4 — tires are
 * usually replaced as a set), add to cart.
 */
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Tire } from '../types'
import { TIRE_CATEGORY_LABELS, formatPrice } from '../types'
import { getTireById } from '../services/catalog'
import { useCart } from '../context/CartContext'
import TireGraphic from '../components/TireGraphic'

export default function TireDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { addItem } = useCart()

  const [tire, setTire] = useState<Tire | null | undefined>(undefined) // undefined = loading
  const [quantity, setQuantity] = useState(4)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    getTireById(id).then(setTire)
  }, [id])

  if (tire === undefined) {
    return <p className="animate-pulse px-6 py-24 text-center text-neutral-500">Loading…</p>
  }
  if (tire === null) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-neutral-400">We couldn't find that tire.</p>
        <Link to="/shop/size" className="mt-4 inline-block text-brand hover:underline">
          Browse tires →
        </Link>
      </div>
    )
  }

  // Which size is being shopped: from the URL if valid, else the first available.
  const requestedSize = searchParams.get('size')
  const size =
    requestedSize && tire.sizes.includes(requestedSize) ? requestedSize : tire.sizes[0]

  const specs: [string, string][] = [
    ['Size', size],
    ['Type', TIRE_CATEGORY_LABELS[tire.category]],
    ['Load range', tire.loadRange],
    ['Mileage warranty', tire.mileageWarranty ? `${tire.mileageWarranty.toLocaleString()} miles` : 'None (performance)'],
    ['Rating', `★ ${tire.rating.toFixed(1)} (${tire.reviewCount.toLocaleString()} reviews)`],
    ['Availability', tire.inStock ? 'In stock' : 'Out of stock'],
  ]

  const handleAdd = () => {
    addItem(tire.id, size, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex justify-center rounded-2xl border border-neutral-800 bg-surface-card p-12">
          <TireGraphic className="h-64 w-64" />
        </div>

        <div>
          <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            {tire.brand}
          </p>
          <h1 className="mt-1 text-4xl font-bold">{tire.model}</h1>
          <p className="mt-2 font-mono text-neutral-400">{size}</p>

          <p className="mt-6 text-4xl font-bold">
            {formatPrice(tire.price)}
            <span className="ml-2 text-sm font-normal text-neutral-500">per tire</span>
          </p>

          <dl className="mt-8 divide-y divide-neutral-800 border-y border-neutral-800">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <dt className="text-neutral-500">{label}</dt>
                <dd className="font-medium text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-3 text-sm text-neutral-400">
              Quantity
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-full border border-neutral-700 bg-surface-card px-4 py-2 text-white focus:border-brand focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={!tire.inStock}
              onClick={handleAdd}
              className="rounded-full bg-brand px-8 py-3 font-semibold text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              {added ? 'Added ✓' : `Add ${quantity} to Cart — ${formatPrice(tire.price * quantity)}`}
            </button>
          </div>

          <p className="mt-6 text-sm text-neutral-500">
            Ship to home, mobile installation, or in-shop — choose at checkout.
          </p>
        </div>
      </div>
    </div>
  )
}
