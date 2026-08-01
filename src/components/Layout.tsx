/*
 * App shell: sticky header with the brand lockup + nav, page content, footer.
 * Rendered once at the route root; pages appear in <Outlet />.
 *
 * While FEATURES.ecommerce is off, "Schedule Service" is the header's primary
 * action and the cart button is hidden — there's nothing to put in it.
 */
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { FEATURES, SITE } from '../config/site'
import { InstagramIcon } from './icons'
import BookButton from './BookButton'
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
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-6">
          <Link to="/" aria-label="Dino's Mobile Tires — home">
            <Logo className="h-8 w-auto sm:h-9" />
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <NavLink to="/shop/vehicle" className={navLinkClass}>
              By Vehicle
            </NavLink>
            <NavLink to="/shop/size" className={navLinkClass}>
              By Size
            </NavLink>

            {FEATURES.ecommerce && (
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
            )}

            <BookButton className="skew-brand bg-brand px-5 py-2.5 text-sm text-white transition-colors hover:bg-brand-hover">
              Book Now
            </BookButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-edge py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 text-center">
          <Logo className="h-7 w-auto opacity-60" />

          <p className="font-display text-xs tracking-wide text-neutral-500">
            Mobile Installation · In-Shop Installation · Flat Repair
          </p>

          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-neutral-500 transition-colors hover:text-brand"
            aria-label="Follow Dino's Mobile Tires on Instagram"
          >
            <InstagramIcon className="h-5 w-5" />
            <span className="font-display text-xs">@dinosmobiletires</span>
          </a>

          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} Dino's Mobile Tires — v{__APP_VERSION__}
          </p>
        </div>
      </footer>
    </div>
  )
}
