/*
 * One tire in a results grid. Shows everything goal.md asks for:
 * brand, model, image, price, warranty, rating, availability,
 * View Details + Add to Cart, and an OEM badge when applicable.
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
      className={`group relative flex flex-col rounded-2xl border bg-surface-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 ${
        isOem ? 'border-brand/60' : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {isOem && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-bold tracking-wide text-black uppercase">
          Factory Fitment
        </span>
      )}

      <div className="mb-4 flex items-center justify-center">
        <TireGraphic className="h-32 w-32 transition-transform duration-300 group-hover:scale-105" />
      </div>

      <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
        {tire.brand}
      </p>
      <h3 className="mt-1 font-semibold text-white">{tire.model}</h3>
      <p className="mt-1 text-sm text-neutral-500">
        {size} · {TIRE_CATEGORY_LABELS[tire.category]} · Load {tire.loadRange}
      </p>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-brand">★ {tire.rating.toFixed(1)}</span>
        <span className="text-neutral-600">({tire.reviewCount.toLocaleString()})</span>
        {tire.mileageWarranty && (
          <span className="text-neutral-400">
            · {(tire.mileageWarranty / 1000).toFixed(0)}k mi warranty
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold">{formatPrice(tire.price)}</p>
          <p className="text-xs text-neutral-500">per tire</p>
        </div>
        <p className={`text-xs font-medium ${tire.inStock ? 'text-emerald-400' : 'text-red-400'}`}>
          {tire.inStock ? 'In stock' : 'Out of stock'}
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          to={`/tire/${tire.id}?size=${encodeURIComponent(size)}`}
          className="flex-1 rounded-full border border-neutral-700 py-2 text-center text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          View Details
        </Link>
        <button
          type="button"
          disabled={!tire.inStock}
          onClick={() => addItem(tire.id, size, 4)}
          className="flex-1 rounded-full bg-brand py-2 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-600"
        >
          Add to Cart
        </button>
      </div>
    </article>
  )
}
