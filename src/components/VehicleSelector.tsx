/*
 * Progressive Year → Make → Model → Trim selector (goal.md: progressive
 * disclosure — one decision at a time, never a wall of dropdowns).
 *
 * Each completed step collapses into a small "chip" the customer can tap to
 * go back; the current step shows its options as large buttons.
 */
import { useEffect, useState } from 'react'
import type { Vehicle } from '../types'
import { getYears, getMakes, getModels, getTrims } from '../services/fitment'

type Step = 'year' | 'make' | 'model' | 'trim'

const STEP_TITLES: Record<Step, string> = {
  year: 'Select your year',
  make: 'Select your make',
  model: 'Select your model',
  trim: 'Select your trim',
}

export default function VehicleSelector({ onComplete }: {
  onComplete: (vehicle: Vehicle) => void
}) {
  const [year, setYear] = useState<number | null>(null)
  const [make, setMake] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const step: Step = year === null ? 'year' : make === null ? 'make' : model === null ? 'model' : 'trim'

  // Load the options for whichever step we're on.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = async (): Promise<string[]> => {
      if (year === null) return (await getYears()).map(String)
      if (make === null) return getMakes(year)
      if (model === null) return getModels(year, make)
      return getTrims(year, make, model)
    }
    load().then((result) => {
      if (cancelled) return
      setOptions(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [year, make, model])

  const select = (value: string) => {
    if (step === 'year') setYear(Number(value))
    else if (step === 'make') setMake(value)
    else if (step === 'model') setModel(value)
    else onComplete({ year: year!, make: make!, model: model!, trim: value })
  }

  // Chips for completed steps; tapping one rewinds to that step.
  const chips: { label: string; rewind: () => void }[] = []
  if (year !== null)
    chips.push({ label: String(year), rewind: () => { setYear(null); setMake(null); setModel(null) } })
  if (make !== null) chips.push({ label: make, rewind: () => { setMake(null); setModel(null) } })
  if (model !== null) chips.push({ label: model, rewind: () => setModel(null) })

  return (
    <div className="w-full max-w-2xl">
      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.rewind}
              className="rounded-full border border-brand/50 px-4 py-1 text-sm text-brand transition-colors hover:bg-brand hover:text-black"
              title="Change"
            >
              {chip.label} ✕
            </button>
          ))}
        </div>
      )}

      <h2 className="mb-6 text-2xl font-bold">{STEP_TITLES[step]}</h2>

      {loading ? (
        <p className="animate-pulse text-neutral-500">Loading…</p>
      ) : options.length === 0 ? (
        <p className="text-neutral-400">
          No matches in our fitment database yet — more vehicles are added regularly.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => select(option)}
              className="rounded-xl border border-neutral-800 bg-surface-card px-4 py-4 font-semibold transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
