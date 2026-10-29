/*
 * Landing-page section: where the mobile service goes, on a Google map.
 *
 * The dotted boundary is drawn by Google, not by us — it's the service area
 * set on the Google Business Profile, rendered the same way it appears on the
 * listing. That's why this is a plain iframe with no API key: only the Maps
 * JavaScript API (key + billing account) could draw a custom shape, and we
 * don't need one while Google draws ours, always in sync with the profile.
 */
import { SERVICE_AREA, SITE } from '../config/site'
import BookButton from './BookButton'

/**
 * Google's embed URL for the listing — the same /maps/embed?pb=… format that
 * Google Maps → Share → Embed a map produces. `pb` is Google's own encoding:
 * `!4s` is the listing's CID, `!6i` the zoom, `!1s` the language. Zoom is
 * required (Google rejects the request without it). If the map ever stops
 * rendering, regenerate an embed from that Share dialog.
 */
function embedUrl(zoom: number): string {
  return `https://www.google.com/maps/embed?pb=!1m4!3m2!1m1!4s${SERVICE_AREA.placeCid}!6i${zoom}!3m1!1sen!5m1!1sen`
}

const MAP_TITLE = "Map of Dino's Mobile Tires' service area"

export default function ServiceArea() {
  const { cities } = SERVICE_AREA
  const first = cities[0]
  const last = cities[cities.length - 1]

  return (
    <section className="mt-24 grid w-full max-w-5xl animate-enter items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-14">
      <div className="text-center md:text-left">
        <p className="font-display text-xs tracking-widest text-brand-ink">Service Area</p>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl">
          {first}
          <br />
          <span className="text-brand-ink">to {last}.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-ink-muted md:mx-0">
          Anywhere inside the dotted line, we come to you — your driveway, your
          office lot, wherever the car is parked.
        </p>

        <ul
          aria-label="Cities we serve"
          className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 md:justify-start"
        >
          {cities.map((city) => (
            <li key={city} className="flex items-center gap-2 font-display text-sm text-ink-soft">
              <span aria-hidden="true" className="skew-brand h-3 w-1 bg-brand" />
              {city}
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 md:justify-start">
          <BookButton className="skew-brand bg-brand px-7 py-3 text-sm text-white transition-colors hover:bg-brand-hover">
            Schedule Service
          </BookButton>
          {SITE.phone && (
            <a
              href={`tel:${SITE.phone}`}
              className="text-sm text-ink-subtle transition-colors hover:text-brand-ink"
            >
              Not sure you're covered?{' '}
              <span className="font-display text-ink-soft">{SITE.phoneDisplay}</span>
            </a>
          )}
        </div>
      </div>

      {/*
        One frame per breakpoint. The area is tall and narrow: a phone-sized
        frame needs zoom 9 to show all of it, while the taller desktop frame
        fits zoom 10. `loading="lazy"` is what keeps this to ONE download —
        a lazy iframe hidden by display:none is never fetched. (The visible
        one still loads with the page: browsers start lazy frames a screen or
        two early, and this section sits that close to the top.)
      */}
      <div className="h-[420px] border border-edge bg-surface-card md:h-[760px]">
        <iframe
          src={embedUrl(9)}
          title={MAP_TITLE}
          loading="lazy"
          allowFullScreen
          className="h-full w-full md:hidden"
        />
        <iframe
          src={embedUrl(10)}
          title={MAP_TITLE}
          loading="lazy"
          allowFullScreen
          className="hidden h-full w-full md:block"
        />
      </div>
    </section>
  )
}
