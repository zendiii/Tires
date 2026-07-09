/*
 * Vehicle fitment service — powers the Year → Make → Model → Trim flow.
 *
 * Future backend: a licensed fitment API (e.g. Wheel Size, DriveRight)
 * behind a serverless function that keeps the API key secret.
 * Today: a small bundled sample database. Sizes are plausible but SAMPLE
 * data — do not treat as real fitment guidance yet.
 */
import type { Fitment, Vehicle, VehicleRecord } from '../types'
import { fakeFetch } from './api'
import vehiclesJson from '../data/vehicles.json'

const VEHICLES = vehiclesJson as VehicleRecord[]

export async function getYears(): Promise<number[]> {
  const years = [...new Set(VEHICLES.map((v) => v.year))].sort((a, b) => b - a)
  return fakeFetch('/api/fitment/years', years)
}

export async function getMakes(year: number): Promise<string[]> {
  const makes = [...new Set(VEHICLES.filter((v) => v.year === year).map((v) => v.make))].sort()
  return fakeFetch(`/api/fitment/${year}/makes`, makes)
}

export async function getModels(year: number, make: string): Promise<string[]> {
  const models = [
    ...new Set(
      VEHICLES.filter((v) => v.year === year && v.make === make).map((v) => v.model),
    ),
  ].sort()
  return fakeFetch(`/api/fitment/${year}/${make}/models`, models)
}

export async function getTrims(year: number, make: string, model: string): Promise<string[]> {
  const trims = VEHICLES.filter(
    (v) => v.year === year && v.make === make && v.model === model,
  ).map((v) => v.trim)
  return fakeFetch(`/api/fitment/${year}/${make}/${model}/trims`, trims)
}

/** OEM + upgrade sizes for a fully-specified vehicle. */
export async function getFitment(vehicle: Vehicle): Promise<Fitment | null> {
  const record = VEHICLES.find(
    (v) =>
      v.year === vehicle.year &&
      v.make === vehicle.make &&
      v.model === vehicle.model &&
      v.trim === vehicle.trim,
  )
  return fakeFetch('/api/fitment/lookup', record?.fitment ?? null)
}
