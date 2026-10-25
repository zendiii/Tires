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
import { FEATURES } from '../config/site'
import TireGraphic from '../components/TireGraphic'
import PreviewBanner from '../components/PreviewBanner'
import BookButton from '../components/BookButton'

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
    return <p className="animate-pulse px-6 py-24 text-center text-ink-subtle">Loading…</p>
  }
  if (tire === null) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-ink-muted">We couldn't find that tire.</p>
        <Link to="/shop/size" className="mt-4 inline-block font-display text-brand-ink hover:underline">
          Browse tires →
        </Link>
      </div>
    )
  }

  // Which size is being shopped: from the URL if valid, else the first available.
  const requestedSize = searchParams.get('size')
  const size = requestedSize && tire.sizes.includes(requestedSize) ? requestedSize : tire.sizes[0]

  // Rows are dropped when the source doesn't carry that field — ATD supplies
  // no category or ratings, so those simply don't appear on live results.
  const specs: [string, string][] = [
    ['Size', size],
    ...(tire.category ? ([['Type', TIRE_CATEGORY_LABELS[tire.category]]] as [string, string][]) : []),
    ['Load range', tire.loadRange],
    ...(tire.speedRating ? ([['Speed rating', tire.speedRating]] as [string, string][]) : []),
    [
      'Mileage warranty',
      tire.mileageWarranty ? `${tire.mileageWarranty.toLocaleString()} miles` : 'None (performance)',
    ],
    ...(tire.rating !== undefined
      ? ([
          [
            'Rating',
            `★ ${tire.rating.toFixed(1)}${
              tire.reviewCount !== undefined ? ` (${tire.reviewCount.toLocaleString()} reviews)` : ''
            }`,
          ],
        ] as [string, string][])
      : []),
    ...(tire.fet ? ([['Federal excise tax', formatPrice(tire.fet)]] as [string, string][]) : []),
    ['Availability', tire.inStock ? 'In stock' : 'Out of stock'],
  ]

  const handleAdd = () => {
    addItem(tire.id, size, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PreviewBanner />
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex justify-center border border-edge bg-surface-card p-12">
          <TireGraphic className="h-64 w-64" />
        </div>

        <div>
          <p className="font-display text-xs tracking-widest text-brand-ink">{tire.brand}</p>
          <h1 className="mt-1 font-display text-5xl">{tire.model}</h1>
          <p className="mt-2 font-mono text-ink-muted">{size}</p>

          <p className={`mt-7 font-display text-5xl ${FEATURES.ecommerce ? '' : 'text-ink-muted'}`}>
            {formatPrice(tire.price)}
            <span className="ml-3 font-sans text-sm font-normal text-ink-subtle">
              {FEATURES.ecommerce ? 'per tire' : 'estimated, per tire'}
            </span>
          </p>

          <dl className="mt-8 divide-y divide-edge border-y border-edge">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <dt className="text-ink-subtle">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {FEATURES.ecommerce ? (
            <>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-3 text-sm text-ink-muted">
                  Quantity
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-edge bg-surface-card px-4 py-2.5 text-ink transition-colors focus:border-brand focus:outline-none"
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
                  className="skew-brand bg-brand px-8 py-3.5 text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-ink-faint"
                >
                  <span className="skew-fix block font-display">
                    {added ? 'Added ✓' : `Add ${quantity} — ${formatPrice(tire.price * quantity)}`}
                  </span>
                </button>
              </div>

              <p className="mt-6 text-sm text-ink-subtle">
                Ship to home, mobile installation, or in-shop — choose at checkout.
              </p>
            </>
          ) : (
            <div className="mt-8">
              <BookButton className="skew-brand inline-block bg-brand px-8 py-3.5 text-white transition-colors hover:bg-brand-hover">
                Book an Install with This Tire
              </BookButton>
              <p className="mt-4 text-sm text-ink-subtle">
                Online ordering isn't live yet. Book an appointment and we'll
                source this set and confirm real pricing before we come out.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
