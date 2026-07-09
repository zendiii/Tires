/*
 * App shell: sticky header with nav + cart badge, page content, footer.
 * Rendered once at the route root; pages appear in <Outlet />.
 */
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCart } from '../context/CartContext'

/** React Router keeps scroll position between pages; reset it on navigation. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-brand' : 'text-neutral-400 hover:text-white'
  }`

export default function Layout() {
  const { count } = useCart()

  return (
    <div className="flex min-h-screen flex-col bg-surface-dark text-white">
      <ScrollToTop />

      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-surface-dark/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-bold tracking-[0.25em] text-white uppercase">
            Dino's <span className="text-brand">Tires</span>
          </Link>

          <nav className="flex items-center gap-6">
            <NavLink to="/shop/vehicle" className={navLinkClass}>
              Shop by Vehicle
            </NavLink>
            <NavLink to="/shop/size" className={navLinkClass}>
              Shop by Size
            </NavLink>
            <NavLink
              to="/cart"
              className="relative rounded-full border border-neutral-700 px-4 py-1.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
            >
              Cart
              {count > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-black">
                  {count}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-center text-xs text-neutral-600">
          <p>Ship to home · Mobile installation · In-shop installation</p>
          <p>© {new Date().getFullYear()} Dino's Tires — v{__APP_VERSION__}</p>
        </div>
      </footer>
    </div>
  )
}
