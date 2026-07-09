/*
 * Close-up wheel/tire visualization for the shop-by-vehicle flow (goal.md:
 * focus on the wheel, not the whole car). Tire proportions are driven by the
 * actual size string — a taller sidewall or bigger rim visibly changes the
 * drawing, and CSS transitions make size switches feel smooth.
 *
 * On staggered vehicles it renders front and rear side by side.
 */
import type { Fitment } from '../types'
import { parseTireSize } from '../types'

function Wheel({ size, label }: { size: string; label: string }) {
  const parsed = parseTireSize(size)

  // Overall diameter = rim + two sidewalls. Sidewall height (mm) = width × ratio.
  // Scaled into SVG units so all sample sizes fit the 200×200 viewBox.
  const rimIn = parsed?.rimDiameter ?? 18
  const sidewallIn = parsed ? (parsed.width * parsed.aspectRatio) / 100 / 25.4 : 5
  const scale = 3.1
  const outerR = ((rimIn / 2) + sidewallIn) * scale
  const rimR = (rimIn / 2) * scale

  const transition = { transition: 'r 0.5s ease' } as const

  return (
    <figure className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="h-52 w-52 sm:h-64 sm:w-64">
        {/* tire */}
        <circle cx="100" cy="100" r={outerR} fill="#191919" style={transition} />
        <circle cx="100" cy="100" r={outerR - 2} fill="#232323" style={transition} />
        {/* rim */}
        <circle cx="100" cy="100" r={rimR} fill="#4a4a4a" style={transition} />
        <circle cx="100" cy="100" r={rimR - 2} fill="#5b5b5b" style={transition} />
        {Array.from({ length: 5 }, (_, i) => {
          const angle = (i / 5) * 2 * Math.PI - Math.PI / 2
          return (
            <line
              key={i}
              x1="100"
              y1="100"
              x2={100 + Math.cos(angle) * (rimR - 5)}
              y2={100 + Math.sin(angle) * (rimR - 5)}
              stroke="#333"
              strokeWidth="9"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )
        })}
        <circle cx="100" cy="100" r="9" fill="#8a8a8a" />
        {/* size lettering on the sidewall */}
        <text
          x="100"
          y={100 - rimR - (outerR - rimR) / 2 + 4}
          textAnchor="middle"
          fill="#a3a3a3"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
          className="transition-all duration-500"
        >
          {size}
        </text>
      </svg>
      <figcaption className="text-center">
        <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">{label}</p>
        <p className="font-mono text-sm text-white">{size}</p>
      </figcaption>
    </figure>
  )
}

export default function WheelVisualizer({ fitment, selectedSize }: {
  fitment: Fitment
  /** Currently-shopped size (OEM or an upgrade) for non-staggered vehicles. */
  selectedSize: string
}) {
  if (fitment.staggered) {
    return (
      <div className="flex flex-wrap items-end justify-center gap-8">
        <Wheel size={fitment.front} label="Front" />
        <Wheel size={fitment.rear} label="Rear" />
      </div>
    )
  }
  return <Wheel size={selectedSize} label="All four wheels" />
}
