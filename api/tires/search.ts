/*
 * GET /api/tires/search?size=275/55R20
 *
 * The browser's only route to ATD. Runs on Vercel with the supplier
 * credentials; returns marked-up retail prices and nothing about cost.
 */
import { ATD_CONFIGURED, searchBySize } from '../_lib/atd'

/** Vercel passes the standard Web Request/Response. */
export const config = { runtime: 'nodejs' }

const TIRE_SIZE = /^\d{3}\/\d{2}R\d{2}$/i

export default async function handler(request: Request): Promise<Response> {
  const size = new URL(request.url).searchParams.get('size') ?? ''

  // Validate before spending an upstream call, and so nothing unchecked
  // reaches the SOAP envelope.
  if (!TIRE_SIZE.test(size)) {
    return json({ error: 'Provide a size like 275/55R20.' }, 400)
  }

  if (!ATD_CONFIGURED) {
    return json({ error: 'Tire supply is not connected yet.' }, 503)
  }

  try {
    const tires = await searchBySize(size.toUpperCase())
    return json(
      { size, count: tires.length, tires },
      200,
      // Inventory refreshes hourly upstream; a short shared cache keeps us well
      // inside rate limits while staying fresh enough to browse.
      { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' },
    )
  } catch (error) {
    // Log the detail server-side; return something safe to the customer.
    console.error('[api/tires/search]', error)
    return json({ error: 'Could not reach our tire supplier. Please try again.' }, 502)
  }
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}
