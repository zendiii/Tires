/*
 * Housecall Pro online booking widget.
 *
 * Their script (online-booking.housecallpro.com/script.js) appends a hidden
 * full-screen overlay containing an iframe of the booking app, and exposes
 * `window.HCPWidget.openModal()` to reveal it.
 *
 * Why we don't just iframe the booking URL ourselves: the booking app renders
 * nothing until it receives an `hcp:open` postMessage, which only their script
 * sends. A hand-rolled iframe shows a blank white box forever.
 *
 * `disableLazy=true` makes their overlay iframe load up front instead of on
 * first reveal. It costs one extra request per page, but the modal then opens
 * instantly — worth it when booking is the site's primary conversion path.
 */
import { BOOKING, BOOKING_CONFIGURED } from '../config/site'

declare global {
  interface Window {
    HCPWidget?: {
      openModal: () => void
      openModalWithParams: (params: Record<string, unknown>) => void
    }
  }
}

const SCRIPT_ID = 'hcp-booking-widget'

/**
 * Memoised so the script is injected exactly once. Their script warns and
 * bails if it finds an existing `.hcp-widget`, and React StrictMode runs
 * effects twice in development — so double-injection is a real hazard.
 */
let loader: Promise<void> | null = null

export function loadBookingWidget(): Promise<void> {
  if (!BOOKING_CONFIGURED) {
    return Promise.reject(new Error('Housecall Pro booking is not configured'))
  }
  if (loader) return loader

  loader = new Promise<void>((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      resolve()
      return
    }

    const params = new URLSearchParams({
      token: BOOKING.token,
      orgName: BOOKING.orgName,
      disableLazy: 'true',
    })

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://online-booking.housecallpro.com/script.js?${params}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Housecall Pro booking script failed to load'))
    document.head.appendChild(script)
  })

  return loader
}

/** Opens the booking modal. Returns false if the widget isn't available yet. */
export function openBookingModal(): boolean {
  if (typeof window.HCPWidget?.openModal !== 'function') return false
  window.HCPWidget.openModal()
  return true
}
