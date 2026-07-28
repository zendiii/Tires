/*
 * Landing page: the brand lockup, then the two shopping paths as large cards.
 * Deliberately sparse — the logo is loud, so the space around it stays quiet
 * (goal.md: premium feel through restraint).
 */
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const PATHS = [
  {
    to: '/shop/vehicle',
    title: 'Shop by Vehicle',
    body: "Tell us your year, make, model, and trim — we'll recommend your factory size first.",
    cta: 'Start with your vehicle',
  },
  {
    to: '/shop/size',
    title: 'Shop by Size',
    body: 'Already know your size? Jump straight to results, like 275/55R20.',
    cta: 'Search by size',
  },
]

const PROMISES = [
  ['Ship to Home', 'Free 2-4 day delivery on every set.'],
  ['Mobile Installation', 'We come to your driveway or office.'],
  ['In-Shop Installation', "Same-day fitting at Dino's."],
]

export default function Home() {
  return (
    <div className="flex flex-col items-center px-6 py-20 sm:py-28">
      <header className="flex flex-col items-center text-center">
        <Logo
          variant="square"
          className="h-32 w-auto animate-[fade-up_0.7s_ease_both] sm:h-40"
        />
        <h1 className="mt-10 max-w-3xl animate-[fade-up_0.7s_ease_0.15s_both] font-display text-5xl sm:text-7xl">
          The right tires,
          <br />
          <span className="text-brand">without the noise.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md animate-[fade-up_0.7s_ease_0.25s_both] text-neutral-400">
          Find your factory fitment in seconds — shipped to your door or
          installed wherever you are.
        </p>
      </header>

      <div className="mt-16 grid w-full max-w-3xl animate-[fade-up_0.7s_ease_0.35s_both] gap-5 sm:grid-cols-2">
        {PATHS.map((path) => (
          <Link
            key={path.to}
            to={path.to}
            className="group relative overflow-hidden border border-edge bg-surface-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand"
          >
            {/* Raked red edge that extends on hover — the logo's angle as motion. */}
            <span className="skew-brand absolute top-0 -left-1 h-full w-1.5 bg-brand transition-all duration-300 group-hover:w-3" />
            <h2 className="font-display text-2xl transition-colors group-hover:text-brand">
              {path.title}
            </h2>
            <p className="mt-2.5 text-sm text-neutral-400">{path.body}</p>
            <p className="mt-8 font-display text-sm text-brand">{path.cta} →</p>
          </Link>
        ))}
      </div>

      <div className="mt-20 grid max-w-3xl animate-[fade-up_0.7s_ease_0.45s_both] gap-10 text-center sm:grid-cols-3">
        {PROMISES.map(([title, body]) => (
          <div key={title}>
            <h3 className="font-display text-base text-white">{title}</h3>
            <p className="mt-1.5 text-sm text-neutral-500">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
