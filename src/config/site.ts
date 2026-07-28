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
 * `embed: true` renders the booking flow inline in an iframe (Housecall Pro
 * supports embedding). If their headers ever refuse to frame, set it to false
 * and the CTA opens the hosted page in a new tab instead.
 */
export const BOOKING: { url: string; embed: boolean } = {
  url: '',
  embed: true,
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
