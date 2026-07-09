/*
 * Stylized SVG tire illustration — the placeholder for real product
 * photography. Drawing it (instead of using a stock photo) keeps every card
 * visually consistent and ships zero image bytes.
 */
export default function TireGraphic({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Tire">
      {/* tread */}
      <circle cx="60" cy="60" r="54" fill="#1c1c1c" />
      {/* tread blocks */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * 2 * Math.PI
        const x1 = 60 + Math.cos(angle) * 46
        const y1 = 60 + Math.sin(angle) * 46
        const x2 = 60 + Math.cos(angle) * 54
        const y2 = 60 + Math.sin(angle) * 54
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0a0a0a" strokeWidth="3" />
        )
      })}
      {/* sidewall */}
      <circle cx="60" cy="60" r="44" fill="#242424" />
      {/* rim */}
      <circle cx="60" cy="60" r="28" fill="#3f3f3f" />
      <circle cx="60" cy="60" r="26" fill="#525252" />
      {/* spokes */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * 2 * Math.PI - Math.PI / 2
        const x2 = 60 + Math.cos(angle) * 22
        const y2 = 60 + Math.sin(angle) * 22
        return (
          <line key={i} x1="60" y1="60" x2={x2} y2={y2} stroke="#2e2e2e" strokeWidth="7" strokeLinecap="round" />
        )
      })}
      {/* hub */}
      <circle cx="60" cy="60" r="8" fill="#737373" />
    </svg>
  )
}
