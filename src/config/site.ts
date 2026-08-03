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
 *   Housecall Pro → Marketing → Online Booking → copy the embed code. It
 *   contains both values below:
 *     <button data-token="..." data-orgname="..." ...>
 *
 * Leave either empty and every booking CTA degrades to a contact card rather
 * than a dead button.
 *
 * Do NOT embed the booking page in a plain <iframe>. Their booking app stays
 * blank until it receives an `hcp:open` postMessage handshake, which only
 * their widget script sends — see src/services/booking.ts.
 */
export const BOOKING: { token: string; orgName: string } = {
  token: 'e65ad10111d648baa6621c7ebc6572f5',
  orgName: 'Dinos-Mobile-Tires',
}

export const BOOKING_CONFIGURED: boolean =
  BOOKING.token !== '' && BOOKING.orgName !== ''

/**
 * Housecall Pro's hosted booking page — the same URL their widget loads into
 * its modal. Used as the no-JS / script-blocked fallback so a booking CTA is
 * never a dead end.
 */
export const BOOKING_DIRECT_URL: string = BOOKING_CONFIGURED
  ? `https://book.housecallpro.com/book/${BOOKING.orgName}/${BOOKING.token}?v2=true`
  : ''

/** Public contact + social. Leave a field empty to hide it from the UI. */
export const SITE: {
  instagramUrl: string
  /** E.164 for the tel: link, plus a human-readable form. Both or neither. */
  phone: string
  phoneDisplay: string
  /** Build credit shown in the footer. */
  builderName: string
  builderUrl: string
} = {
  instagramUrl: 'https://www.instagram.com/dinosmobiletires/',
  phone: '+19547790898',
  phoneDisplay: '(954) 779-0898',
  builderName: 'SYVN',
  builderUrl: 'https://github.com/zendiii',
}
