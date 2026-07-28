/*
 * The brand lockup.
 *
 * Uses the "OverBlack" artwork variant (red badge + white wordmark), cropped
 * to its content bounds — see src/assets/CMYK/ for the full set of originals.
 *
 * Why raster and not the source SVG: the SVGs set "MOBILE TIRES" as live text
 * in Zuume Bold, a licensed font visitors won't have installed, so the SVG
 * would silently render the wordmark in a wrong fallback face. The exported
 * PNG has the type already rasterized, so it's always correct.
 */
import horizontal from '../assets/logo-horizontal.png'
import square from '../assets/logo-square.png'

interface LogoProps {
  /** 'horizontal' for headers/footers, 'square' for hero and compact spaces. */
  variant?: 'horizontal' | 'square'
  className?: string
}

export default function Logo({ variant = 'horizontal', className = '' }: LogoProps) {
  return (
    <img
      src={variant === 'horizontal' ? horizontal : square}
      alt="Dino's Mobile Tires"
      className={className}
      // Intrinsic ratios of the cropped artwork — prevents layout shift.
      width={variant === 'horizontal' ? 1760 : 1780}
      height={variant === 'horizontal' ? 300 : 1200}
    />
  )
}
