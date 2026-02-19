import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { nanoid } from 'nanoid'
import { searchAddress } from '../lib/geocode'
import { computeRoute } from '../lib/routing'
import type { ScheduleItem, Route, Location, ScheduleSlot, DayOfWeek } from '../lib/types'

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

interface ScheduleFormProps {
  onClose: () => void
  onRoutesCreated: (routes: Route[]) => void
}

export function ScheduleForm({ onClose, onRoutesCreated }: ScheduleFormProps) {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [name, setName] = useState('')
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<{ lat: number; lng: number; displayName: string }[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [days, setDays] = useState<DayOfWeek[]>([])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [routeName, setRouteName] = useState('')
  const [loading, setLoading] = useState(false)

  const searchAddr = useCallback(async () => {
    if (!addressQuery.trim()) return
    setLoading(true)
    const results = await searchAddress(addressQuery)
    setAddressResults(results)
    setLoading(false)
  }, [addressQuery])

  const selectResult = (r: { lat: number; lng: number; displayName: string }) => {
    setSelectedLocation({ lat: r.lat, lng: r.lng, label: r.displayName.slice(0, 50) })
    setAddressResults([])
    setAddressQuery(r.displayName.slice(0, 80))
  }

  const toggleDay = (d: DayOfWeek) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  const addItem = () => {
    if (!selectedLocation || days.length === 0) return
    const item: ScheduleItem = {
      id: nanoid(),
      name,
      location: selectedLocation,
      days,
      startTime,
      endTime,
      routeName: routeName || undefined,
    }
    setItems((prev) => [...prev, item])
    setName('')
    setAddressQuery('')
    setSelectedLocation(null)
    setDays([])
    setRouteName('')
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const createRoutes = async () => {
    if (items.length < 2) {
      onRoutesCreated([])
      onClose()
      return
    }
    const routes: Route[] = []
    for (let i = 0; i < items.length - 1; i++) {
      const from = items[i]
      const to = items[i + 1]
      const result = await computeRoute(from.location, to.location)
      const schedule: ScheduleSlot[] = from.days.map((d) => ({
        day: d,
        start: from.startTime,
        end: from.endTime,
      }))
      routes.push({
        id: nanoid(),
        name: from.routeName || `${from.name} → ${to.name}`,
        origin: from.location,
        destination: to.location,
        polyline: result.coordinates,
        schedule,
        lastAQI: undefined,
        preferred: i === 0,
      })
    }
    onRoutesCreated(routes)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '1.5rem',
        maxHeight: '90vh',
        overflow: 'auto',
      }}
    >
      <h3 style={{ margin: '0 0 1rem' }}>Add schedule items</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Place name (e.g. Home, Work)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Home"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Location (search or paste address)</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value)
                setAddressResults([])
              }}
              onKeyDown={(e) => e.key === 'Enter' && searchAddr()}
              placeholder="123 Main St, City"
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
            <button
              type="button"
              onClick={searchAddr}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </div>
          {addressResults.length > 0 && (
            <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none' }}>
              {addressResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectResult(r)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {r.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Days</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {DAYS.map((d) => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={days.includes(d)}
                  onChange={() => toggleDay(d)}
                />
                {d.slice(0, 3)}
              </label>
            ))}
          </div>
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label>
            <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Start</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </label>
          <label>
            <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>End</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </label>
        </div>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Route name (optional)</span>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Home → Work"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
          />
        </label>
        <button
          type="button"
          onClick={addItem}
          disabled={!selectedLocation || days.length === 0}
          style={{
            padding: '0.6rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Add to schedule
        </button>
      </div>

      {items.length > 0 && (
        <>
          <h4 style={{ margin: '0 0 0.5rem' }}>Schedule order (routes: A→B, B→C, …)</h4>
          <ul style={{ margin: '0 0 1rem', padding: 0, listStyle: 'none' }}>
            {items.map((i) => (
              <li
                key={i.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'var(--bg)',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                }}
              >
                <span>{i.name} ({i.days.join(', ')})</span>
                <button
                  type="button"
                  onClick={() => removeItem(i.id)}
                  aria-label={`Remove ${i.name}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0.6rem 1rem',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={createRoutes}
          style={{
            padding: '0.6rem 1rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Create routes
        </button>
      </div>
    </motion.div>
  )
}
