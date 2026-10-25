/*
 * Button that flips between the light and dark themes.
 *
 * The icon shows the theme you'd switch TO (sun while dark, moon while light),
 * and the accessible label says so in words, so it's never ambiguous.
 *
 * Two looks: a compact icon button for the header, and a labelled one for the
 * footer. Phones get the footer one — the header has no width to spare there,
 * and squeezing in another button crushes the logo.
 */
import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribe } from '../services/theme'
import { MoonIcon, SunIcon } from './icons'

interface ThemeToggleProps {
  /** Show "Light theme"/"Dark theme" text beside the icon. */
  labelled?: boolean
  /** Visibility/placement only, e.g. responsive `hidden md:inline-block`. */
  className?: string
}

export default function ThemeToggle({ labelled = false, className = '' }: ThemeToggleProps) {
  // Theme state lives on <html>, not in React — this hook re-renders the
  // button whenever it changes, whoever changed it.
  const theme = useSyncExternalStore(subscribe, getTheme)
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} theme`
  const Icon = theme === 'dark' ? SunIcon : MoonIcon

  if (labelled) {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={label}
        className={`items-center gap-2 text-ink-subtle transition-colors hover:text-brand-ink ${className}`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-display text-xs">{next} theme</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`skew-brand border border-edge p-2 text-ink-muted transition-colors hover:border-brand hover:text-ink ${className}`}
    >
      <span className="skew-fix block">
        <Icon className="h-5 w-5" />
      </span>
    </button>
  )
}
