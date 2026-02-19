import { motion } from 'framer-motion'
import { AQIBadge } from './AQIBadge'
import { getAQIColor } from '../lib/aqi'
import type { Route } from '../lib/types'

interface RouteCardProps {
  route: Route
  isSelected: boolean
  onClick: () => void
}

export function RouteCard({ route, isSelected, onClick }: RouteCardProps) {
  const aqiColor = route.lastAQI != null ? getAQIColor(route.lastAQI) : 'var(--border)'
  const scheduleDays = route.schedule
    .map((s) => s.day.slice(0, 3).charAt(0).toUpperCase() + s.day.slice(1, 3))
    .filter((v, i, a) => a.indexOf(v) === i)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ scale: 1.015, boxShadow: `0 4px 16px ${aqiColor}33` }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        padding: '0.85rem 1rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        boxShadow: isSelected ? `0 0 0 2px var(--accent), var(--shadow-md)` : 'var(--shadow)',
        cursor: 'pointer',
        borderLeft: `3.5px solid ${aqiColor}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '0.92rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {route.name}
          </h4>
          <p
            style={{
              margin: '0.2rem 0 0',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {route.origin.label} → {route.destination.label}
          </p>
        </div>
        {route.lastAQI != null && <AQIBadge aqi={route.lastAQI} size="sm" />}
      </div>

      {/* Schedule day pills */}
      {scheduleDays.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '0.3rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {scheduleDays.map((d) => (
            <span
              key={d}
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  )
}
