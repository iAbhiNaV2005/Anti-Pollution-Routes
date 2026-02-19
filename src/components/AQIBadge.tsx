import { getAQIColor } from '../lib/aqi'
import { AQI_BREAKPOINTS } from '../lib/constants'

interface AQIBadgeProps {
  aqi: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function getAQILabel(aqi: number): string {
  for (const bp of AQI_BREAKPOINTS) {
    if (aqi <= bp.max) return bp.label
  }
  return 'Hazardous'
}

export function AQIBadge({ aqi, size = 'md', showLabel }: AQIBadgeProps) {
  const color = getAQIColor(aqi)
  const sizes = { sm: '0.7rem', md: '0.85rem', lg: '1rem' }
  const paddings = { sm: '0.1em 0.35em', md: '0.2em 0.5em', lg: '0.25em 0.6em' }
  const isUnhealthy = aqi > 150
  const label = getAQILabel(aqi)
  const shouldShowLabel = showLabel ?? (size !== 'sm')

  return (
    <span
      role="status"
      aria-label={`AQI: ${aqi} — ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3em',
        padding: paddings[size],
        fontSize: sizes[size],
        fontWeight: 700,
        color: '#fff',
        backgroundColor: color,
        borderRadius: '8px',
        boxShadow: `0 2px 6px ${color}44`,
        animation: isUnhealthy ? 'aqi-badge-pulse 2s ease-in-out infinite' : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {aqi}
      {shouldShowLabel && (
        <span style={{ fontWeight: 500, opacity: 0.9, fontSize: '0.85em' }}>
          {label.length > 12 ? label.split(' ')[0] : label}
        </span>
      )}
    </span>
  )
}
