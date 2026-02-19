import { AnimatePresence } from 'framer-motion'
import { RouteCard } from './RouteCard'
import type { Route } from '../lib/types'

interface RouteListProps {
  routes: Route[]
  selectedRouteId: string | null
  onSelectRoute: (id: string | null) => void
  onAddRoute: () => void
  onAddFromSchedule?: () => void
}

export function RouteList({
  routes,
  selectedRouteId,
  onSelectRoute,
  onAddRoute,
  onAddFromSchedule,
}: RouteListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.25rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
          📍 My Routes
        </h3>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {routes.length} route{routes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {routes.length === 0 && (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: '2rem 1rem',
          }}
        >
          No routes yet. Add one to get started!
        </p>
      )}

      <AnimatePresence mode="popLayout">
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            isSelected={route.id === selectedRouteId}
            onClick={() => onSelectRoute(selectedRouteId === route.id ? null : route.id)}
          />
        ))}
      </AnimatePresence>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '0.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={onAddRoute}
          aria-label="Add new route"
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: '0 2px 8px var(--accent-glow)',
          }}
        >
          + Add Route
        </button>
        {onAddFromSchedule && (
          <button
            type="button"
            onClick={onAddFromSchedule}
            style={{
              padding: '0.6rem',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}
          >
            📅 Add from schedule
          </button>
        )}
      </div>
    </div>
  )
}
