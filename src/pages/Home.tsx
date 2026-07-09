/*
 * Landing page: hero + the two shopping paths as large, inviting cards.
 * Deliberately sparse — luxury feel comes from restraint (goal.md).
 */
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex flex-col items-center px-6 py-24">
      <header className="text-center">
        <p className="mb-3 animate-[fade-up_0.6s_ease_both] text-sm font-semibold tracking-[0.3em] text-brand uppercase">
          Dino's Tires
        </p>
        <h1 className="max-w-2xl animate-[fade-up_0.6s_ease_0.1s_both] text-4xl font-bold tracking-tight sm:text-6xl">
          The right tires, without the noise.
        </h1>
        <p className="mx-auto mt-5 max-w-md animate-[fade-up_0.6s_ease_0.2s_both] text-neutral-400">
          Find your factory fitment in seconds — shipped to your door or
          installed wherever you are.
        </p>
      </header>

      <div className="mt-16 grid w-full max-w-3xl gap-6 animate-[fade-up_0.6s_ease_0.3s_both] sm:grid-cols-2">
        <Link
          to="/shop/vehicle"
          className="group rounded-2xl border border-neutral-800 bg-surface-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand"
        >
          <h2 className="text-xl font-bold group-hover:text-brand">Shop by Vehicle</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Tell us your year, make, model, and trim — we'll recommend your
            factory size first.
          </p>
          <p className="mt-6 text-sm font-semibold text-brand">Start with your car →</p>
        </Link>

        <Link
          to="/shop/size"
          className="group rounded-2xl border border-neutral-800 bg-surface-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand"
        >
          <h2 className="text-xl font-bold group-hover:text-brand">Shop by Tire Size</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Already know your size? Jump straight to results, like 275/55R20.
          </p>
          <p className="mt-6 text-sm font-semibold text-brand">Search by size →</p>
        </Link>
      </div>

      <div className="mt-20 grid max-w-3xl gap-8 text-center animate-[fade-up_0.6s_ease_0.4s_both] sm:grid-cols-3">
        {[
          ['Ship to Home', 'Free 2-4 day delivery on every set.'],
          ['Mobile Installation', 'We come to your driveway or office.'],
          ['In-Shop Installation', "Same-day fitting at Dino's."],
        ].map(([title, body]) => (
          <div key={title}>
            <h3 className="text-sm font-bold tracking-wide text-white uppercase">{title}</h3>
            <p className="mt-1 text-sm text-neutral-500">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
