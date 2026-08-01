/*
 * Landing page.
 *
 * Priority order reflects what the business can actually transact today:
 * booking an installation is the primary call to action, and tire shopping
 * sits below it as a labelled preview until inventory/pricing APIs are live
 * (see FEATURES.ecommerce in src/config/site.ts). When that flag flips, the
 * shopping section drops its "coming soon" treatment automatically.
 */
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import BookButton from '../components/BookButton'
import { FEATURES } from '../config/site'

const PROMISES = [
  ['We Come to You', 'Mobile installation at your home or office.'],
  ['Or Visit the Shop', 'Same-day fitting while you wait.'],
  ['Done Right', 'Mounted, balanced, and torqued to spec.'],
]

const SHOP_PATHS = [
  {
    to: '/shop/vehicle',
    title: 'Shop by Vehicle',
    body: "Year, make, model, trim — we'll show your factory size first.",
  },
  {
    to: '/shop/size',
    title: 'Shop by Size',
    body: 'Already know your size? Go straight to results, like 275/55R20.',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col items-center px-6 py-20 sm:py-24">
      {/* Primary: booking */}
      <header className="flex flex-col items-center text-center">
        <Logo
          variant="square"
          className="h-28 w-auto animate-[fade-up_0.7s_ease_both] sm:h-36"
        />
        <h1 className="mt-10 max-w-3xl animate-[fade-up_0.7s_ease_0.15s_both] font-display text-5xl sm:text-7xl">
          Tires installed
          <br />
          <span className="text-brand">wherever you are.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md animate-[fade-up_0.7s_ease_0.25s_both] text-neutral-400">
          Mobile tire service that comes to your driveway — or bring it by the
          shop. Pick a time and we'll handle the rest.
        </p>

        <BookButton className="skew-brand mt-10 animate-[fade-up_0.7s_ease_0.35s_both] bg-brand px-12 py-5 text-xl text-white transition-colors hover:bg-brand-hover sm:text-2xl">
          Schedule Service
        </BookButton>

        <Link
          to="/book"
          className="mt-6 animate-[fade-up_0.7s_ease_0.4s_both] font-display text-sm text-neutral-400 transition-colors hover:text-brand"
        >
          See how mobile installation works →
        </Link>
      </header>

      <div className="mt-20 grid max-w-3xl animate-[fade-up_0.7s_ease_0.45s_both] gap-10 text-center sm:grid-cols-3">
        {PROMISES.map(([title, body]) => (
          <div key={title}>
            <h2 className="font-display text-base text-white">{title}</h2>
            <p className="mt-1.5 text-sm text-neutral-500">{body}</p>
          </div>
        ))}
      </div>

      {/* Secondary: tire shopping, gated until pricing/inventory APIs land */}
      <section className="mt-24 w-full max-w-3xl border-t border-edge pt-14">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <h2 className="font-display text-2xl text-neutral-300">Shop Tires</h2>
          {!FEATURES.ecommerce && (
            <span className="skew-brand border border-neutral-700 px-3 py-1">
              <span className="skew-fix block font-display text-xs text-neutral-400">
                Coming Soon
              </span>
            </span>
          )}
        </div>

        {!FEATURES.ecommerce && (
          <p className="mx-auto mb-8 max-w-md text-center text-sm text-neutral-500">
            Online ordering opens once our live inventory feed is connected.
            Browse the catalog now to see what fits — then book an install and
            we'll source your set.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {SHOP_PATHS.map((path) => (
            <Link
              key={path.to}
              to={path.to}
              className={`group relative overflow-hidden border p-7 transition-all duration-300 hover:-translate-y-0.5 ${
                FEATURES.ecommerce
                  ? 'border-edge bg-surface-card hover:border-brand'
                  : 'border-edge/60 bg-surface-card/40 hover:border-neutral-600'
              }`}
            >
              <h3
                className={`font-display text-xl transition-colors ${
                  FEATURES.ecommerce
                    ? 'group-hover:text-brand'
                    : 'text-neutral-400 group-hover:text-neutral-200'
                }`}
              >
                {path.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-500">{path.body}</p>
              <p className="mt-6 font-display text-sm text-neutral-500">
                {FEATURES.ecommerce ? 'Start →' : 'Preview →'}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
