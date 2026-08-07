/*
 * Rotating photo backdrop for the landing hero.
 *
 * The panel is clipped to `clip-speed` — the raked hexagon taken from the
 * "DINO'S" badge — so the photography reads as part of the brand mark rather
 * than a rectangle behind text.
 *
 * Photos crossfade rather than slide: the headline sits directly on top, and
 * horizontal movement under live text is hard to read past. A scrim keeps the
 * white display type legible over bright Florida daylight shots.
 */
import { useEffect, useState } from 'react'
import { HERO_PHOTOS } from '../data/photos'

/** How long each photo holds, and how long the crossfade takes. */
const HOLD_MS = 5500
const FADE_MS = 1200

export default function HeroPhotos() {
  const [index, setIndex] = useState(0)
  /**
   * Highest index shown so far. Rotation is sequential, so this lets us mount
   * only the photos that have actually been reached — the page starts by
   * fetching one image instead of all eight.
   */
  const [maxSeen, setMaxSeen] = useState(0)

  useEffect(() => {
    // Someone who asked for less motion gets a single still image.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || HERO_PHOTOS.length < 2) return

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % HERO_PHOTOS.length)
    }, HOLD_MS)
    // Must return the cleanup itself — never the setInterval id.
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setMaxSeen((highest) => Math.max(highest, index))
  }, [index])

  return (
    <div
      className="clip-speed absolute inset-0 overflow-hidden bg-surface-card"
      // Decorative: the headline in front already carries the message.
      aria-hidden="true"
    >
      {HERO_PHOTOS.map((photo, i) =>
        i <= maxSeen ? (
          <img
            key={photo.src}
            src={photo.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: photo.position,
              opacity: i === index ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
            }}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            draggable={false}
          />
        ) : null,
      )}

      {/* Scrim: flat darkening so the display type always clears contrast... */}
      <div className="absolute inset-0 bg-surface-dark/70" />
      {/* ...plus edges fading to the page colour so the panel sits in the page. */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-dark via-transparent to-surface-dark" />
    </div>
  )
}
