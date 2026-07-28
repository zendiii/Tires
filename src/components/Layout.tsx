/*
 * App shell: sticky header with the brand lockup + nav, page content, footer.
 * Rendered once at the route root; pages appear in <Outlet />.
 */
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import Logo from './Logo'

/** React Router keeps scroll position between pages; reset it on navigation. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-display text-sm transition-colors ${
    isActive ? 'text-brand' : 'text-neutral-400 hover:text-white'
  }`

export default function Layout() {
  const { count } = useCart()

  return (
    <div className="flex min-h-screen flex-col bg-surface-dark text-white">
      <ScrollToTop />

      <header className="sticky top-0 z-50 border-b border-edge bg-surface-dark/85 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-6">
          <Link to="/" aria-label="Dino's Mobile Tires — home">
            <Logo className="h-8 w-auto sm:h-9" />
          </Link>

          <nav className="flex items-center gap-5 sm:gap-7">
            <NavLink to="/shop/vehicle" className={navLinkClass}>
              By Vehicle
            </NavLink>
            <NavLink to="/shop/size" className={navLinkClass}>
              By Size
            </NavLink>
            <NavLink
              to="/cart"
              className="skew-brand relative border border-edge px-5 py-2 transition-colors hover:border-brand"
            >
              <span className="skew-fix block font-display text-sm">Cart</span>
              {count > 0 && (
                <span className="skew-fix absolute -top-2.5 -right-2.5 flex h-5 min-w-5 items-center justify-center bg-brand px-1 font-display text-xs text-white">
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

      <footer className="border-t border-edge py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center">
          <Logo className="h-7 w-auto opacity-60" />
          <p className="font-display text-xs tracking-wide text-neutral-500">
            Ship to Home · Mobile Installation · In-Shop Installation
          </p>
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} Dino's Mobile Tires — v{__APP_VERSION__}
          </p>
        </div>
      </footer>
    </div>
  )
}
