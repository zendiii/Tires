/*
 * Core domain types for Dino's Tires.
 *
 * Everything downstream (data files, services, components) imports from here,
 * so the shape of a "tire" or a "fitment" is defined exactly once (DRY).
 */

/** Broad tire categories used for filtering. */
export type TireCategory = 'all-season' | 'performance' | 'all-terrain' | 'highway'

export const TIRE_CATEGORY_LABELS: Record<TireCategory, string> = {
  'all-season': 'All-Season',
  performance: 'Performance',
  'all-terrain': 'All-Terrain',
  highway: 'Highway',
}

/**
 * A tire size like "275/55R20", broken into its parts:
 * width (mm) / aspect ratio (% of width) R rim diameter (inches).
 */
export interface TireSize {
  width: number
  aspectRatio: number
  rimDiameter: number
}

/** One product in the catalog. Prices are per tire, USD. */
export interface Tire {
  id: string
  brand: string
  model: string
  category: TireCategory
  price: number
  /** Sizes this model is available in, e.g. ["275/55R20"]. */
  sizes: string[]
  /** Mileage warranty in miles; null for tires sold without one (common for performance). */
  mileageWarranty: number | null
  rating: number
  reviewCount: number
  /** Load range code, e.g. "SL" (standard), "XL" (extra load), "E" (heavy duty). */
  loadRange: string
  inStock: boolean
}

/**
 * Factory + upgrade tire sizes for one vehicle configuration.
 * On a staggered setup (Corvette, BMW M...) front and rear differ.
 */
export interface Fitment {
  front: string
  rear: string
  staggered: boolean
  /** Popular non-OEM sizes owners commonly move to. */
  upgrades: string[]
}

/** One row of the vehicle fitment database. */
export interface VehicleRecord {
  year: number
  make: string
  model: string
  trim: string
  fitment: Fitment
}

/** The customer's fully-selected vehicle. */
export interface Vehicle {
  year: number
  make: string
  model: string
  trim: string
}

/** How the customer wants their tires. The core of Dino's differentiator. */
export type FulfillmentMethod = 'ship' | 'mobile' | 'shop'

export const FULFILLMENT_OPTIONS: {
  id: FulfillmentMethod
  label: string
  description: string
  feePerTire: number
}[] = [
  {
    id: 'ship',
    label: 'Ship to Home',
    description: 'Free shipping, arrives in 2-4 business days.',
    feePerTire: 0,
  },
  {
    id: 'mobile',
    label: 'Mobile Installation',
    description: 'We come to you — home or office. Installed on the spot.',
    feePerTire: 25,
  },
  {
    id: 'shop',
    label: 'In-Shop Installation',
    description: "Installed at Dino's while you wait.",
    feePerTire: 20,
  },
]

/** An item in the shopping cart: a specific tire in a specific size. */
export interface CartItem {
  tireId: string
  size: string
  quantity: number
}

/** Parse "275/55R20" into parts; returns null if the string isn't a valid size. */
export function parseTireSize(size: string): TireSize | null {
  const match = size.match(/^(\d{3})\/(\d{2})R(\d{2})$/i)
  if (!match) return null
  return {
    width: Number(match[1]),
    aspectRatio: Number(match[2]),
    rimDiameter: Number(match[3]),
  }
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}
