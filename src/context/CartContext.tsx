/*
 * Shopping cart state, shared app-wide via React Context.
 *
 * Why Context instead of prop-passing: the cart is read/written from many
 * unrelated places (header badge, tire cards, cart page), so it lives at the
 * top of the tree. Persisted to localStorage so a refresh doesn't empty it.
 * When Supabase arrives (later phase), this same interface can sync to a
 * server-side cart for logged-in users.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartItem } from '../types'

interface CartContextValue {
  items: CartItem[]
  /** Total number of tires (sum of quantities) — shown on the header badge. */
  count: number
  addItem: (tireId: string, size: string, quantity: number) => void
  updateQuantity: (tireId: string, size: string, quantity: number) => void
  removeItem: (tireId: string, size: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'dinos-tires.cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return [] // corrupted storage should never crash the app
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (tireId: string, size: string, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.tireId === tireId && i.size === size)
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [...prev, { tireId, size, quantity }]
    })
  }

  const updateQuantity = (tireId: string, size: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => !(i.tireId === tireId && i.size === size))
        : prev.map((i) => (i.tireId === tireId && i.size === size ? { ...i, quantity } : i)),
    )
  }

  const removeItem = (tireId: string, size: string) => updateQuantity(tireId, size, 0)

  const clear = () => setItems([])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext value={{ items, count, addItem, updateQuantity, removeItem, clear }}>
      {children}
    </CartContext>
  )
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}
