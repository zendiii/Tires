/*
 *
 */
import { useEffect, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BOOKING_CONFIGURED, BOOKING_DIRECT_URL } from '../config/site'
import { loadBookingWidget, openBookingModal } from '../services/booking'

interface BookButtonProps {
  /** Styles for the outer element — callers own the look. */
  className?: string
  /** Button label. Wrapped in the counter-skew span so it sits upright. */
  children: ReactNode
}

export default function BookButton({ className = '', children }: BookButtonProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadBookingWidget()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        // Leave `ready` false — the link fallback below still books.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const label = <span className="skew-fix block font-display">{children}</span>

  // Nothing configured yet: send people to /book, which explains how to reach us.
  if (!BOOKING_CONFIGURED) {
    return (
      <Link to="/book" className={className}>
        {label}
      </Link>
    )
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab, download) behave normally.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    if (!ready) return
    if (openBookingModal()) event.preventDefault()
  }

  return (
    <a
      href={BOOKING_DIRECT_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {label}
    </a>
  )
}
