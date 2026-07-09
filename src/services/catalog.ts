/*
 * Tire catalog service.
 *
 * Future backend: GET /api/tires?size=...&brand=... backed by a database.
 * Today: filters the bundled JSON catalog in memory.
 */
import type { Tire, TireCategory } from '../types'
import { fakeFetch } from './api'
import tiresJson from '../data/tires.json'

const CATALOG = tiresJson as Tire[]

export interface CatalogFilters {
  brand?: string
  category?: TireCategory
  loadRange?: string
  maxPrice?: number
}

/** All tires available in a given size, OEM-relevant sort (rating first). */
export async function searchTiresBySize(
  size: string,
  filters: CatalogFilters = {},
): Promise<Tire[]> {
  const results = CATALOG.filter((tire) => {
    if (!tire.sizes.includes(size)) return false
    if (filters.brand && tire.brand !== filters.brand) return false
    if (filters.category && tire.category !== filters.category) return false
    if (filters.loadRange && tire.loadRange !== filters.loadRange) return false
    if (filters.maxPrice !== undefined && tire.price > filters.maxPrice) return false
    return true
  }).sort((a, b) => b.rating - a.rating)
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
