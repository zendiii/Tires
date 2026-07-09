/*
 * Backend placeholder plumbing.
 *
 * Phase 1 has no backend: data ships as static JSON bundled with the app.
 * Every service function is async and returns a Promise, mimicking a real
 * network call. When serverless functions / a fitment API arrive, only the
 * services/ folder changes — pages and components keep the same contract.
 */

// DEBUG CONFIGURATION
export const DEBUG_SERVICES = false // log every simulated API call to the console

/** Small artificial delay so loading states are visible and realistic. */
const SIMULATED_LATENCY_MS = 200

/** Wraps local data in a Promise, standing in for fetch('/api/...'). */
export async function fakeFetch<T>(endpoint: string, data: T): Promise<T> {
  if (DEBUG_SERVICES) console.info(`[api] GET ${endpoint}`)
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))
  return data
}
