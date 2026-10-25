/*
 * Small HTTP helpers shared by the serverless functions.
 */

/**
 * Parses `request.url` safely in BOTH environments.
 *
 * Deployed on Vercel, `request.url` is an absolute URL
 * ("https://site.com/api/x?y=1"). Under `vercel dev` it is a RELATIVE path
 * ("/api/x?y=1"), and `new URL()` throws TypeError: Invalid URL on that.
 * Worse, the throw escapes the handler and kills the whole dev function
 * runner, so every later request to any endpoint hangs with no error —
 * which looks nothing like the actual cause.
 *
 * Supplying a base fixes it: when the input is already absolute the base is
 * ignored, and when it's relative the base makes it parseable. The host is
 * a throwaway — we only ever read the path and query off it.
 */
export function requestUrl(request: Request): URL {
  return new URL(request.url, 'http://localhost')
}

/**
 * JSON response.
 *
 * Defaults to `no-store`, because most of what these functions return is
 * specific to one customer (a checkout session, an order) and must never sit
 * in a shared CDN cache. Callers that ARE cacheable pass their own
 * Cache-Control, which overrides it — the spread puts `headers` last.
 */
export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}
