import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AQI_BREAKPOINTS } from '../lib/constants'

export function AQILegend() {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="aqi-legend">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="map-control-btn"
        style={{
          marginBottom: expanded ? '0.5rem' : 0,
          fontSize: '0.78rem',
          padding: '0.4rem 0.7rem',
        }}
        aria-label={expanded ? 'Collapse AQI legend' : 'Expand AQI legend'}
      >
        🎨 {expanded ? 'Hide' : 'AQI'} Legend
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="aqi-legend-card"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {AQI_BREAKPOINTS.map((bp, i) => {
                const prevMax = i > 0 ? AQI_BREAKPOINTS[i - 1].max + 1 : 0
                const rangeLabel = bp.max === Infinity ? `${prevMax}+` : `${prevMax}–${bp.max}`
                return (
                  <div
                    key={bp.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        background: bp.color,
                        flexShrink: 0,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <span style={{ color: 'var(--text-muted)', minWidth: '2.5rem' }}>{rangeLabel}</span>
                    <span>{bp.label}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
