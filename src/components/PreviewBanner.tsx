/*
 * Shown at the top of every shopping page while FEATURES.ecommerce is off.
 *
 * Two jobs: set the expectation that prices/stock aren't live yet, and route
 * the customer to the thing we CAN do today — book an installation.
 */
import { FEATURES } from '../config/site'
import BookButton from './BookButton'

export default function PreviewBanner() {
  if (FEATURES.ecommerce) return null

  return (
    <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-4 border border-brand/40 bg-brand/10 p-5">
      <span className="skew-brand bg-brand px-3 py-1">
        <span className="skew-fix block font-display text-xs text-white">Preview</span>
      </span>
      <p className="min-w-0 flex-1 text-sm text-neutral-300">
        Online ordering isn't live yet — pricing and availability shown here are
        placeholders while we connect our inventory feed. Book an install and
        we'll source your set and confirm real pricing.
      </p>
      <BookButton className="skew-brand shrink-0 bg-brand px-6 py-2.5 text-sm text-white transition-colors hover:bg-brand-hover">
        Schedule Service
      </BookButton>
    </div>
  )
}
