/*
 * Shop-by-vehicle flow, in two acts (progressive disclosure):
 *   1. Pick the vehicle step by step (VehicleSelector).
 *   2. See the wheel visualization + tires for the OEM size, with upgrade
 *      sizes one tap away. OEM is always the default recommendation.
 * Staggered vehicles get separate front/rear result sections.
 */
import { useEffect, useState } from 'react'
import type { Fitment, Tire, Vehicle } from '../types'
import { getFitment } from '../services/fitment'
import { searchTiresBySize } from '../services/catalog'
import VehicleSelector from '../components/VehicleSelector'
import WheelVisualizer from '../components/WheelVisualizer'
import TireCard from '../components/TireCard'

/** Section heading with the logo's raked red rule. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="skew-brand h-6 w-1.5 bg-brand" />
      <h3 className="font-display text-2xl">{children}</h3>
    </div>
  )
}

function ResultsSection({ title, size, isOemSize }: {
  title: string
  size: string
  isOemSize: boolean
}) {
  const [tires, setTires] = useState<Tire[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setTires(null)
    searchTiresBySize(size).then((result) => {
      if (!cancelled) setTires(result)
    })
    return () => {
      cancelled = true
    }
  }, [size])

  return (
    <section className="mt-14">
      <SectionHeading>{title}</SectionHeading>
      {tires === null ? (
        <p className="animate-pulse text-neutral-500">Finding tires…</p>
      ) : tires.length === 0 ? (
        <p className="text-neutral-400">No tires in stock for {size} yet.</p>
      ) : (
        <div className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {tires.map((tire, i) => (
            <TireCard key={tire.id} tire={tire} size={size} isOem={isOemSize && i === 0} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function ShopByVehicle() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [fitment, setFitment] = useState<Fitment | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicle) return
    let cancelled = false
    getFitment(vehicle).then((result) => {
      if (cancelled) return
      setFitment(result)
      setSelectedSize(result?.front ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [vehicle])

  const reset = () => {
    setVehicle(null)
    setFitment(null)
    setSelectedSize(null)
  }

  // Act 1 — vehicle selection.
  if (!vehicle || !fitment || !selectedSize) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-16">
        <h1 className="font-display text-4xl">Shop by Vehicle</h1>
        <p className="mt-3 mb-12 max-w-md text-center text-neutral-400">
          Four quick steps and we'll show you exactly what fits.
        </p>
        <VehicleSelector onComplete={setVehicle} />
      </div>
    )
  }

  // Act 2 — fitment + results.
  const isOemSelected = selectedSize === fitment.front

  const sizeButton = (value: string, tag: string) => {
    const active = selectedSize === value
    return (
      <button
        key={value}
        type="button"
        onClick={() => setSelectedSize(value)}
        className={`skew-brand border px-6 py-2.5 transition-colors ${
          active
            ? 'border-brand bg-brand'
            : 'border-edge text-neutral-300 hover:border-brand hover:text-brand'
        }`}
      >
        <span className={`skew-fix block font-display text-sm ${active ? 'text-white' : ''}`}>
          {value} · {tag}
        </span>
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs tracking-widest text-brand">Your Vehicle</p>
          <h1 className="mt-1 font-display text-4xl">
            {vehicle.year} {vehicle.make} {vehicle.model}{' '}
            <span className="text-neutral-500">{vehicle.trim}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={reset}
          className="skew-brand border border-edge px-5 py-2 transition-colors hover:border-brand"
        >
          <span className="skew-fix block font-display text-sm">Change Vehicle</span>
        </button>
      </div>

      <div className="mt-10 border border-edge bg-surface-card p-8">
        <WheelVisualizer fitment={fitment} selectedSize={selectedSize} />

        {fitment.staggered ? (
          <p className="mt-8 text-center text-sm text-neutral-400">
            This vehicle has a <span className="font-display text-brand">staggered setup</span> —
            the rear tires are wider than the fronts, so you'll need both sizes.
          </p>
        ) : (
          fitment.upgrades.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {sizeButton(fitment.front, 'Factory')}
              {fitment.upgrades.map((upgrade) => sizeButton(upgrade, 'Upgrade'))}
            </div>
          )
        )}
      </div>

      {fitment.staggered ? (
        <>
          <ResultsSection title={`Front — ${fitment.front}`} size={fitment.front} isOemSize />
          <ResultsSection title={`Rear — ${fitment.rear}`} size={fitment.rear} isOemSize />
        </>
      ) : (
        <ResultsSection
          title={isOemSelected ? 'Recommended for your vehicle' : `Upgrade size — ${selectedSize}`}
          size={selectedSize}
          isOemSize={isOemSelected}
        />
      )}
    </div>
  )
}
