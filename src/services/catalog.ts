/*
 * Tire catalog service.
 *
 * Two sources, chosen by FEATURES.liveCatalog:
 *   live   — GET /api/tires/search, a Vercel function that queries ATD and
 *            applies our markup server-side (see api/_lib/pricing.ts)
 *   sample — the bundled JSON, so the shop stays browsable without credentials
 *
 * Callers don't know or care which is in use; the signatures never change.
 */
import type { Tire, TireCategory } from '../types'
import { FEATURES } from '../config/site'
import { fakeFetch } from './api'
import tiresJson from '../data/tires.json'

const CATALOG = tiresJson as Tire[]

export interface CatalogFilters {
  brand?: string
  category?: TireCategory
  loadRange?: string
  maxPrice?: number
}

/** One result from /api/tires/search. Prices arrive in integer cents. */
interface ApiTire {
  id: string
  brand: string
  model: string
  size: string
  price: number
  fet: number
  inStock: boolean
  loadRange: string
  speedRating: string
  warranty: string
  imageUrl: string
  productCode: string
}

/** Pulls a mileage figure out of ATD's free-text warranty string. */
function parseWarrantyMiles(warranty: string): number | null {
  const match = warranty?.match(/([\d,]{4,})\s*(?:mile|mi\b)/i)
  if (!match) return null
  const miles = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(miles) ? miles : null
}

function fromApi(tire: ApiTire): Tire {
  return {
    id: tire.id,
    brand: tire.brand,
    model: tire.model,
    // Server works in cents; the UI formats dollars.
    price: tire.price / 100,
    fet: tire.fet / 100,
    sizes: [tire.size],
    mileageWarranty: parseWarrantyMiles(tire.warranty),
    loadRange: tire.loadRange,
    speedRating: tire.speedRating,
    inStock: tire.inStock,
    imageUrl: tire.imageUrl,
    productCode: tire.productCode,
    // category / rating intentionally absent — ATD supplies neither.
  }
}

async function searchLive(size: string): Promise<Tire[]> {
  const response = await fetch(`/api/tires/search?size=${encodeURIComponent(size)}`)
  if (!response.ok) {
    throw new Error(`Tire search failed (${response.status})`)
  }
  const body = (await response.json()) as { tires: ApiTire[] }
  return body.tires.map(fromApi)
}

/** All tires available in a given size, best-rated first where we know ratings. */
export async function searchTiresBySize(
  size: string,
  filters: CatalogFilters = {},
): Promise<Tire[]> {
  if (FEATURES.liveCatalog) {
    const live = await searchLive(size)
    return live
      .filter((tire) => {
        if (filters.brand && tire.brand !== filters.brand) return false
        if (filters.loadRange && tire.loadRange !== filters.loadRange) return false
        if (filters.maxPrice !== undefined && tire.price > filters.maxPrice) return false
        // Category filtering is skipped on live data — ATD doesn't classify.
        return true
      })
      .sort((a, b) => a.price - b.price)
  }

  const results = CATALOG.filter((tire) => {
    if (!tire.sizes.includes(size)) return false
    if (filters.brand && tire.brand !== filters.brand) return false
    if (filters.category && tire.category !== filters.category) return false
    if (filters.loadRange && tire.loadRange !== filters.loadRange) return false
    if (filters.maxPrice !== undefined && tire.price > filters.maxPrice) return false
    return true
  }).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  return fakeFetch(`/api/tires?size=${size}`, results)
}

export async function getTireById(id: string): Promise<Tire | null> {
  const tire = CATALOG.find((t) => t.id === id) ?? null
  return fakeFetch(`/api/tires/${id}`, tire)
}

/** Distinct values for the filter dropdowns on the size-search page. */
export async function getFilterOptions(): Promise<{
  brands: string[]
  loadRanges: string[]
}> {
  const brands = [...new Set(CATALOG.map((t) => t.brand))].sort()
  const loadRanges = [...new Set(CATALOG.map((t) => t.loadRange))].sort()
  return fakeFetch('/api/tires/filters', { brands, loadRanges })
}

/** Every size that appears in the catalog — powers the size picker. */
export async function getAvailableSizes(): Promise<string[]> {
  const sizes = [...new Set(CATALOG.flatMap((t) => t.sizes))].sort()
  return fakeFetch('/api/tires/sizes', sizes)
}
