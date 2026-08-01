/*
 * Booking page — the site's primary conversion path while tire e-commerce is
 * gated. Wraps Housecall Pro's online booking.
 *
 * The booking URL is account-specific and lives in src/config/site.ts. Until
 * it's filled in, this page shows the service information plus a contact
 * fallback rather than a dead button — a broken CTA is worse than none.
 */
import { Link } from 'react-router-dom'
import { BOOKING_CONFIGURED, BOOKING_DIRECT_URL, SITE } from '../config/site'
import BookButton from '../components/BookButton'

const STEPS = [
  ['Pick a time', 'Choose a slot that works — mornings, afternoons, or weekends.'],
  ['Tell us where', 'Your driveway, your office lot, or our shop. We bring the equipment.'],
  ['We handle the rest', 'Mount, balance, torque to spec, and haul away your old tires.'],
]

const SERVICES = [
  ['Mobile Installation', 'We come to you — no waiting room, no lost afternoon.'],
  ['In-Shop Installation', "Drop by Dino's and we'll get you back on the road."],
  ['Flat Repair & Rotation', 'Quick service on the spot, wherever you are.'],
  ['TPMS Service', 'Sensor reset and replacement handled with the install.'],
]

function BookingPanel() {
  if (!BOOKING_CONFIGURED) {
    return (
      <div className="border border-edge bg-surface-card p-8 text-center">
        <h2 className="font-display text-2xl">Booking is being connected</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-400">
          Online scheduling is coming online shortly. In the meantime, reach out
          and we'll get you on the calendar.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          {SITE.phone && (
            <a href={`tel:${SITE.phone}`} className="skew-brand bg-brand px-7 py-3 hover:bg-brand-hover">
              <span className="skew-fix block font-display text-sm text-white">
                Call {SITE.phoneDisplay}
              </span>
            </a>
          )}
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="skew-brand border border-edge px-7 py-3 transition-colors hover:border-brand"
          >
            <span className="skew-fix block font-display text-sm">Message us on Instagram</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-edge bg-surface-card p-10 text-center">
      <p className="mx-auto mb-7 max-w-sm text-neutral-400">
        Pick a time that works and tell us where to meet you — it takes about a
        minute.
      </p>
      <BookButton className="skew-brand inline-block bg-brand px-10 py-4 text-lg text-white transition-colors hover:bg-brand-hover">
        Book Online
      </BookButton>
      <p className="mt-5 text-xs text-neutral-600">
        Trouble with the booking window?{' '}
        <a
          href={BOOKING_DIRECT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-400 underline hover:text-brand"
        >
          Open it in a new tab
        </a>
      </p>
    </div>
  )
}

export default function Book() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="text-center">
        <p className="font-display text-xs tracking-widest text-brand">Schedule Service</p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">
          Book your <span className="text-brand">install</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-neutral-400">
          Mobile installation at your home or office, or in-shop service —
          pick a time and we'll take it from there.
        </p>
      </header>

      <div className="mt-14">
        <BookingPanel />
      </div>

      <section className="mt-20">
        <div className="mb-8 flex items-center gap-3">
          <span className="skew-brand h-6 w-1.5 bg-brand" />
          <h2 className="font-display text-2xl">How it works</h2>
        </div>
        <ol className="grid gap-8 sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <span className="font-display text-4xl text-brand">0{i + 1}</span>
              <h3 className="mt-2 font-display text-lg">{title}</h3>
              <p className="mt-1.5 text-sm text-neutral-400">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <div className="mb-8 flex items-center gap-3">
          <span className="skew-brand h-6 w-1.5 bg-brand" />
          <h2 className="font-display text-2xl">What we do</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {SERVICES.map(([title, body]) => (
            <div key={title} className="border border-edge bg-surface-card p-6">
              <h3 className="font-display text-lg">{title}</h3>
              <p className="mt-1.5 text-sm text-neutral-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-16 text-center text-sm text-neutral-500">
        Already know what you need?{' '}
        <Link to="/shop/vehicle" className="font-display text-brand hover:underline">
          Browse tires for your vehicle
        </Link>
      </p>
    </div>
  )
}
