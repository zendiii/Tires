/*
 * Light/dark theme.
 *
 * The source of truth is the `data-theme` attribute on <html>: the CSS tokens
 * read it (src/index.css) and so does this module. It's first set by the inline
 * script in index.html, before any CSS or React loads, so the very first paint
 * is already in the right theme — no flash of dark for a light-mode visitor.
 * After that, only setTheme() changes it.
 *
 * The default follows the visitor's OS setting. Picking a theme stores an
 * override; picking the one the OS already wants clears it again, so a single
 * toggle can always get someone back to "follow my system".
 */
export type Theme = 'light' | 'dark'

/** Must match the key read by the inline script in index.html. */
const STORAGE_KEY = 'dinos-tires.theme'
const LIGHT_QUERY = '(prefers-color-scheme: light)'

const listeners = new Set<() => void>()

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function systemTheme(): Theme {
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark'
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null // storage blocked (private browsing, strict privacy settings)
  }
}

function apply(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  // Mobile browsers tint their toolbar with theme-color. Read it back from the
  // CSS token so the page color is defined in one place, not two.
  const surface = getComputedStyle(root).getPropertyValue('--surface').trim()
  if (surface) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface)
  listeners.forEach((listener) => listener())
}

export function setTheme(theme: Theme): void {
  try {
    if (theme === systemTheme()) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Can't persist — still switch for this visit.
  }
  apply(theme)
}

/**
 * Subscription for React's useSyncExternalStore. Also follows OS changes live
 * (e.g. macOS switching to dark at sunset), but only while the visitor hasn't
 * picked a theme of their own.
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const media = window.matchMedia(LIGHT_QUERY)
  const onSystemChange = () => {
    if (storedTheme() === null) apply(systemTheme())
  }
  media.addEventListener('change', onSystemChange)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
  }
}
