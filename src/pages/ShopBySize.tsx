/*
 * Shop-by-size: the fast path for customers who know their size (goal.md).
 * No visualizer here on purpose — this page is optimized for speed:
 * size picker + filters + results, nothing else.
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Tire, TireCategory } from '../types'
import { TIRE_CATEGORY_LABELS } from '../types'
import { getAvailableSizes, getFilterOptions, searchTiresBySize } from '../services/catalog'
import TireCard from '../components/TireCard'
import PreviewBanner from '../components/PreviewBanner'

type SortOrder = 'rating' | 'price-asc' | 'price-desc'

const SELECT_CLASS =
  'border border-edge bg-surface-card px-4 py-2.5 text-sm text-white transition-colors focus:border-brand focus:outline-none'

export default function ShopBySize() {
  // The selected size lives in the URL (?size=275/55R20) so results are
  // shareable and survive a refresh.
  const [searchParams, setSearchParams] = useSearchParams()
  const size = searchParams.get('size')

  const [sizes, setSizes] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loadRanges, setLoadRanges] = useState<string[]>([])
  const [tires, setTires] = useState<Tire[] | null>(null)

  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [loadRange, setLoadRange] = useState('')
  const [sort, setSort] = useState<SortOrder>('rating')

  useEffect(() => {
    getAvailableSizes().then(setSizes)
    getFilterOptions().then((options) => {
      setBrands(options.brands)
      setLoadRanges(options.loadRanges)
    })
  }, [])

  useEffect(() => {
    if (!size) return
    let cancelled = false
    setTires(null)
    searchTiresBySize(size, {
      brand: brand || undefined,
      category: (category as TireCategory) || undefined,
      loadRange: loadRange || undefined,
    }).then((result) => {
      if (!cancelled) setTires(result)
    })
    return () => {
      cancelled = true
    }
  }, [size, brand, category, loadRange])

  const sorted = useMemo(() => {
    if (!tires) return null
    const copy = [...tires]
    if (sort === 'price-asc') copy.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') copy.sort((a, b) => b.price - a.price)
    return copy // 'rating' is the service's default order
  }, [tires, sort])

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PreviewBanner />
      <h1 className="font-display text-4xl">Shop by Size</h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400">
        Your size is printed on the sidewall — width / aspect ratio R wheel
        diameter, like 275/55R20.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select
          value={size ?? ''}
          onChange={(e) => setSearchParams(e.target.value ? { size: e.target.value } : {})}
          className={`${SELECT_CLASS} border-brand font-mono`}
          aria-label="Tire size"
        >
          <option value="">Select a size…</option>
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Brand"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Tire type"
        >
          <option value="">All types</option>
          {(Object.keys(TIRE_CATEGORY_LABELS) as TireCategory[]).map((c) => (
            <option key={c} value={c}>{TIRE_CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        <select
          value={loadRange}
          onChange={(e) => setLoadRange(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Load range"
        >
          <option value="">All load ranges</option>
          {loadRanges.map((lr) => (
            <option key={lr} value={lr}>Load {lr}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOrder)}
          className={SELECT_CLASS}
          aria-label="Sort order"
        >
          <option value="rating">Top rated</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      <div className="mt-12">
        {!size ? (
          <p className="text-neutral-500">Pick a size above to see available tires.</p>
        ) : sorted === null ? (
          <p className="animate-pulse text-neutral-500">Finding tires…</p>
        ) : sorted.length === 0 ? (
          <p className="text-neutral-400">No tires match those filters — try removing one.</p>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <span className="skew-brand h-6 w-1.5 bg-brand" />
              <h2 className="font-display text-2xl">
                {sorted.length} {sorted.length === 1 ? 'tire' : 'tires'} in {size}
              </h2>
            </div>
            <div className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((tire) => (
                <TireCard key={tire.id} tire={tire} size={size} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
