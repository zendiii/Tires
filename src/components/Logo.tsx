/*
 * The brand lockup.
 *
 * Two artwork variants, both cropped to identical bounds from the originals in
 * src/assets/CMYK/ so they're interchangeable without layout shift:
 *   - "OverBlack" — red badge + WHITE wordmark, for dark backgrounds
 *   - "Full"      — red badge + BLACK wordmark, for light backgrounds
 *
 * Both are rendered and CSS shows the one that matches the nearest
 * `data-theme` (the show-in-* utilities in src/index.css). Doing it in CSS
 * rather than React means the logo always agrees with the colors around it —
 * including inside a nested scope like the always-dark landing hero — with no
 * theme state to pass down. The hidden image is display:none, so screen
 * readers announce only the visible one.
 *
 * Why raster and not the source SVG: the SVGs set "MOBILE TIRES" as live text
 * in Zuume Bold, a licensed font visitors won't have installed, so the SVG
 * would silently render the wordmark in a wrong fallback face. The exported
 * PNG has the type already rasterized, so it's always correct.
 */
import horizontalOnDark from '../assets/logo-horizontal.png'
import horizontalOnLight from '../assets/logo-horizontal-on-light.png'
import squareOnDark from '../assets/logo-square.png'
import squareOnLight from '../assets/logo-square-on-light.png'

interface LogoProps {
  /** 'horizontal' for headers/footers, 'square' for hero and compact spaces. */
  variant?: 'horizontal' | 'square'
  /** Sizing/opacity only — display utilities would fight the theme swap. */
  className?: string
}

export default function Logo({ variant = 'horizontal', className = '' }: LogoProps) {
  const horizontal = variant === 'horizontal'
  // Intrinsic ratios of the cropped artwork — prevents layout shift.
  const size = horizontal ? { width: 1760, height: 300 } : { width: 1780, height: 1200 }

  return (
    <>
      <img
        src={horizontal ? horizontalOnDark : squareOnDark}
        alt="Dino's Mobile Tires"
        className={`show-in-dark ${className}`}
        {...size}
      />
      <img
        src={horizontal ? horizontalOnLight : squareOnLight}
        alt="Dino's Mobile Tires"
        className={`show-in-light ${className}`}
        {...size}
      />
    </>
  )
}
