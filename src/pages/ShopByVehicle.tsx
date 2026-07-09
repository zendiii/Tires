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

function ResultsSection({ title, size, isOemSize }: {
  title?: string
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
    <section className="mt-12">
      {title && <h3 className="mb-6 text-lg font-bold">{title}</h3>}
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
        <p className="mb-2 text-sm font-semibold tracking-[0.3em] text-brand uppercase">
          Shop by Vehicle
        </p>
        <p className="mb-10 max-w-md text-center text-neutral-400">
          Four quick steps and we'll show you exactly what fits.
        </p>
        <VehicleSelector onComplete={setVehicle} />
      </div>
    )
  }

  // Act 2 — fitment + results.
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
  const isOemSelected = selectedSize === fitment.front

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.3em] text-brand uppercase">
            Your Vehicle
          </p>
          <h1 className="mt-1 text-3xl font-bold">{vehicleName}</h1>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-neutral-700 px-4 py-1.5 text-sm transition-colors hover:border-brand hover:text-brand"
        >
          Change vehicle
        </button>
      </div>

      <div className="mt-10 rounded-2xl border border-neutral-800 bg-surface-card p-8">
        <WheelVisualizer fitment={fitment} selectedSize={selectedSize} />

        {fitment.staggered ? (
          <p className="mt-6 text-center text-sm text-neutral-400">
            This vehicle has a <span className="text-white">staggered setup</span> — the rear
            tires are wider than the fronts, so you'll need both sizes.
          </p>
        ) : (
          fitment.upgrades.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedSize(fitment.front)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  isOemSelected
                    ? 'bg-brand text-black'
                    : 'border border-neutral-700 text-neutral-300 hover:border-brand hover:text-brand'
                }`}
              >
                {fitment.front} · Factory
              </button>
              {fitment.upgrades.map((upgrade) => (
                <button
                  key={upgrade}
                  type="button"
                  onClick={() => setSelectedSize(upgrade)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    selectedSize === upgrade
                      ? 'bg-brand text-black'
                      : 'border border-neutral-700 text-neutral-300 hover:border-brand hover:text-brand'
                  }`}
                >
                  {upgrade} · Upgrade
                </button>
              ))}
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
