/*
 * App — root component.
 *
 * Current state: a placeholder landing screen that proves the design tokens
 * (dark surface + brand orange) and Tailwind are wired up correctly.
 * The two buttons map to the site's two shopping paths (see goal.md) and
 * will become real routes in a later version.
 */
function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-surface-dark px-6 text-white">
      <header className="text-center">
        <p className="mb-3 text-sm font-semibold tracking-[0.3em] text-brand uppercase">
          Dino's Tires
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          The right tires, without the noise.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-neutral-400">
          Find your factory fitment in seconds — shipped to your door or
          installed wherever you are.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          className="rounded-full bg-brand px-8 py-3 font-semibold text-black transition-colors hover:bg-brand-hover"
        >
          Shop by Vehicle
        </button>
        <button
          type="button"
          className="rounded-full border border-neutral-700 px-8 py-3 font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          Shop by Tire Size
        </button>
      </div>

      <p className="text-xs text-neutral-600">v0.1.0 — foundation</p>
    </main>
  )
}

export default App
