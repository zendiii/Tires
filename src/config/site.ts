/*
 * Site-wide configuration: feature gates, booking, and social links.
 *
 * This is the file to edit when the business changes — no component should
 * hardcode a URL, phone number, or "is this feature live yet" decision.
 */

/**
 * Feature gates.
 *
 * Tire e-commerce is built and browsable but not transactable: we don't have
 * live inventory/pricing API access yet, so prices and stock in the catalog
 * are sample data. Flip `ecommerce` to true once those APIs are wired into
 * src/services/ — that single change re-enables Add to Cart, the cart, and
 * checkout across the whole site.
 */
export const FEATURES: { ecommerce: boolean } = {
  ecommerce: false,
}

/**
 * Housecall Pro online booking.
 *
 * HOW TO FILL THIS IN:
 *   Housecall Pro → Marketing → Online Booking → copy your booking link.
 *   It looks like https://book.housecallpro.com/book/<company>/<token>
 *
 * Leave it empty and the booking page degrades gracefully to a "call us"
 * card instead of rendering a dead button.
 *
 * `embed`:
 *   false (default) — the CTA opens Housecall Pro's hosted booking page in a
 *     new tab. Always works, since it's an ordinary link.
 *   true — renders the booking flow inline in an iframe. Housecall Pro's page
 *     is built for this (transparent background, 100% height), but their app
 *     renders blank when it doesn't recognise the embedding domain. If you
 *     want inline booking, add this site's domain to the allowed/website
 *     field in Housecall Pro → Marketing → Online Booking, then flip this to
 *     true. An "open in a new tab" link always sits under the frame so a
 *     blank embed can never strand a customer.
 */
export const BOOKING: { url: string; embed: boolean } = {
  url: 'https://book.housecallpro.com/book/Dinos-Mobile-Tires/e65ad10111d648baa6621c7ebc6572f5?v2=true&attr=9642',
  embed: false,
}

export const BOOKING_CONFIGURED: boolean = BOOKING.url !== ''

/** Public contact + social. Leave a field empty to hide it from the UI. */
export const SITE: {
  instagramUrl: string
  /** E.164 for the tel: link, plus a human-readable form. Both or neither. */
  phone: string
  phoneDisplay: string
} = {
  instagramUrl: 'https://www.instagram.com/dinosmobiletires/',
  phone: '',
  phoneDisplay: '',
}
