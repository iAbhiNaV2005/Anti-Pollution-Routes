import { useState } from 'react'
import { motion } from 'framer-motion'
import { nanoid } from 'nanoid'
import { searchAddress } from '../lib/geocode'
import { computeRoute } from '../lib/routing'
import type { Route, Location } from '../lib/types'

interface AddRouteModalProps {
  onClose: () => void
  onAdd: (route: Route) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  fontSize: '0.88rem',
}

const resultBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '0.55rem 0.75rem',
  marginTop: '0.25rem',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  transition: 'background 0.15s',
}

export function AddRouteModal({ onClose, onAdd }: AddRouteModalProps) {
  const [name, setName] = useState('')
  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  const [originResults, setOriginResults] = useState<{ lat: number; lng: number; displayName: string }[]>([])
  const [destResults, setDestResults] = useState<{ lat: number; lng: number; displayName: string }[]>([])
  const [origin, setOrigin] = useState<Location | null>(null)
  const [destination, setDestination] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)

  const searchOrigin = async () => {
    if (!originQuery.trim()) return
    setLoading(true)
    const r = await searchAddress(originQuery)
    setOriginResults(r)
    setLoading(false)
  }

  const searchDest = async () => {
    if (!destQuery.trim()) return
    setLoading(true)
    const r = await searchAddress(destQuery)
    setDestResults(r)
    setLoading(false)
  }

  const submit = async () => {
    if (!origin || !destination) return
    setLoading(true)
    const result = await computeRoute(origin, destination)
    const route: Route = {
      id: nanoid(),
      name: name || `${origin.label} → ${destination.label}`,
      origin,
      destination,
      polyline: result.coordinates,
      schedule: [],
      lastAQI: undefined,
    }
    onAdd(route)
    setLoading(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          borderRadius: '20px',
          padding: '1.75rem',
          maxWidth: '420px',
          width: '100%',
        }}
      >
        <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1.15rem' }}>
          🗺️ Add Route
        </h3>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <span style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
            Route name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Home → Work"
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <span style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
            Origin
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={originQuery}
              onChange={(e) => {
                setOriginQuery(e.target.value)
                setOriginResults([])
              }}
              onKeyDown={(e) => e.key === 'Enter' && searchOrigin()}
              placeholder="Search address"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={searchOrigin}
              disabled={loading}
              style={{
                padding: '0.5rem 0.9rem',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              Search
            </button>
          </div>
          {originResults.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOrigin({ lat: r.lat, lng: r.lng, label: r.displayName.slice(0, 50) })
                setOriginQuery(r.displayName.slice(0, 80))
                setOriginResults([])
              }}
              style={resultBtnStyle}
            >
              📍 {r.displayName}
            </button>
          ))}
        </label>

        <label style={{ display: 'block', marginBottom: '1.25rem' }}>
          <span style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
            Destination
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={destQuery}
              onChange={(e) => {
                setDestQuery(e.target.value)
                setDestResults([])
              }}
              onKeyDown={(e) => e.key === 'Enter' && searchDest()}
              placeholder="Search address"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={searchDest}
              disabled={loading}
              style={{
                padding: '0.5rem 0.9rem',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              Search
            </button>
          </div>
          {destResults.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDestination({ lat: r.lat, lng: r.lng, label: r.displayName.slice(0, 50) })
                setDestQuery(r.displayName.slice(0, 80))
                setDestResults([])
              }}
              style={resultBtnStyle}
            >
              📍 {r.displayName}
            </button>
          ))}
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!origin || !destination || loading}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              boxShadow: '0 2px 8px var(--accent-glow)',
            }}
          >
            {loading ? 'Computing…' : 'Add Route'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
