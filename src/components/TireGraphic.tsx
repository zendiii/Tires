/*
 * 
 */
export default function TireGraphic({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Tire">
      {/* tread */}
      <circle cx="60" cy="60" r="54" fill="#161313" />
      {/* tread blocks */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * 2 * Math.PI
        return (
          <line
            key={i}
            x1={60 + Math.cos(angle) * 46}
            y1={60 + Math.sin(angle) * 46}
            x2={60 + Math.cos(angle) * 54}
            y2={60 + Math.sin(angle) * 54}
            stroke="#0b0a0a"
            strokeWidth="3"
          />
        )
      })}
      {/* sidewall */}
      <circle cx="60" cy="60" r="44" fill="#201d1d" />
      {/* rim */}
      <circle cx="60" cy="60" r="28" fill="#3d3838" />
      <circle cx="60" cy="60" r="26" fill="#524b4b" />
      {/* spokes */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * 2 * Math.PI - Math.PI / 2
        return (
          <line
            key={i}
            x1="60"
            y1="60"
            x2={60 + Math.cos(angle) * 22}
            y2={60 + Math.sin(angle) * 22}
            stroke="#2b2727"
            strokeWidth="7"
            strokeLinecap="round"
          />
        )
      })}
      {/* hub — brand accent */}
      <circle cx="60" cy="60" r="8" fill="#e24233" />
    </svg>
  )
}
