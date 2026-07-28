/*
 * One tire in a results grid. Shows everything goal.md asks for:
 * brand, model, image, price, warranty, rating, availability,
 * View Details + Add to Cart, and an OEM badge when applicable.
 *
 * Styling follows the logo: square corners, a raked red badge, and the
 * condensed display face for names and prices.
 */
import { Link } from 'react-router-dom'
import type { Tire } from '../types'
import { TIRE_CATEGORY_LABELS, formatPrice } from '../types'
import { useCart } from '../context/CartContext'
import TireGraphic from './TireGraphic'

interface TireCardProps {
  tire: Tire
  /** The size being shopped — a tire model comes in many sizes. */
  size: string
  /** Marks this result as the factory-recommended fitment. */
  isOem?: boolean
}

export default function TireCard({ tire, size, isOem = false }: TireCardProps) {
  const { addItem } = useCart()

  return (
    <article
      className={`group relative flex flex-col border bg-surface-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 ${
        isOem ? 'border-brand' : 'border-edge hover:border-neutral-600'
      }`}
    >
      {isOem && (
        <span className="skew-brand absolute -top-3 left-5 bg-brand px-3 py-1">
          <span className="skew-fix block font-display text-xs text-white">
            Factory Fitment
          </span>
        </span>
      )}

      <div className="mb-5 flex items-center justify-center">
        <TireGraphic className="h-32 w-32 transition-transform duration-500 group-hover:scale-105" />
      </div>

      <p className="font-display text-xs tracking-widest text-brand">{tire.brand}</p>
      <h3 className="mt-1 font-display text-xl text-white">{tire.model}</h3>
      <p className="mt-1.5 font-mono text-sm text-neutral-500">
        {size} · {TIRE_CATEGORY_LABELS[tire.category]} · Load {tire.loadRange}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 text-sm">
        <span className="text-brand">★ {tire.rating.toFixed(1)}</span>
        <span className="text-neutral-600">({tire.reviewCount.toLocaleString()})</span>
        {tire.mileageWarranty && (
          <span className="text-neutral-400">
            · {(tire.mileageWarranty / 1000).toFixed(0)}k mi warranty
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between pt-5">
        <div>
          <p className="font-display text-3xl">{formatPrice(tire.price)}</p>
          <p className="text-xs text-neutral-500">per tire</p>
        </div>
        <p
          className={`font-display text-xs ${
            tire.inStock ? 'text-emerald-400' : 'text-neutral-500'
          }`}
        >
          {tire.inStock ? 'In Stock' : 'Out of Stock'}
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          to={`/tire/${tire.id}?size=${encodeURIComponent(size)}`}
          className="skew-brand flex-1 border border-edge py-2.5 text-center transition-colors hover:border-brand"
        >
          <span className="skew-fix block font-display text-sm">Details</span>
        </Link>
        <button
          type="button"
          disabled={!tire.inStock}
          onClick={() => addItem(tire.id, size, 4)}
          className="skew-brand flex-1 bg-brand py-2.5 transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-neutral-600"
        >
          <span className="skew-fix block font-display text-sm text-white">Add to Cart</span>
        </button>
      </div>
    </article>
  )
}
