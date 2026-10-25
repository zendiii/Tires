/*
 * GET /api/tires/search?size=275/55R20
 *
 * The browser's only route to ATD. Runs on Vercel with the supplier
 * credentials; returns marked-up retail prices and nothing about cost.
 */
import { ATD_CONFIGURED, searchBySize } from '../_lib/atd'
import { json, requestUrl } from '../_lib/http'

/*
 * Exported as a named method, not `export default`.
 *
 * @vercel/node only treats a function as a Web handler (Request in, Response
 * out) when the module exports GET/POST/etc. or a `fetch`. A default export is
 * called as a legacy Node (req, res) handler instead — it receives an
 * IncomingMessage, the returned Response is discarded, res.end() is never
 * called, and the request hangs forever with no error.
 */
export const config = { runtime: 'nodejs' }

const TIRE_SIZE = /^\d{3}\/\d{2}R\d{2}$/i

export async function GET(request: Request): Promise<Response> {
  const size = requestUrl(request).searchParams.get('size') ?? ''

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

