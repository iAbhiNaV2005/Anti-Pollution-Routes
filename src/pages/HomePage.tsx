import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapView } from '../components/MapView'
import { RouteList } from '../components/RouteList'
import { OnboardingModal } from '../components/OnboardingModal'
import { ScheduleForm } from '../components/ScheduleForm'
import { AddRouteModal } from '../components/AddRouteModal'
import { SettingsPanel } from '../components/SettingsPanel'
import { useRoutes } from '../hooks/useRoutes'
import { loadSettings } from '../lib/storage'
import { setInAppAlertHandler, requestPermission, startPolling, stopPolling } from '../lib/notifications'
import { getStationsWithAQI, getAQIColor } from '../lib/aqi'
import type { StationWithAQI } from '../lib/aqi'
import { computeAlternativeRoutes } from '../lib/routing'
import { getAQIForRoute } from '../lib/aqi'
import type { Route } from '../lib/types'
import { ONBOARDING_KEY } from '../lib/constants'

export function HomePage() {
  const { routes, loading, addRoute, setRoutes } = useRoutes()
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false)
  const [addRouteOpen, setAddRouteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aqiOverlayMode, setAqiOverlayMode] = useState<'heat' | 'stations'>('stations')
  const [stations, setStations] = useState<StationWithAQI[]>([])
  const [bestRouteCoords, setBestRouteCoords] = useState<[number, number][] | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [alertToast, setAlertToast] = useState<{ msg: string; route: Route } | null>(null)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) setOnboardingOpen(true)
  }, [])

  useEffect(() => {
    setInAppAlertHandler((msg, route) => setAlertToast({ msg, route }))
  }, [])

  useEffect(() => {
    requestPermission().then(() => {})
    loadSettings().then((s) => {
      if (routes.length > 0 && s.aqiThreshold > 0) {
        startPolling(routes, s.aqiThreshold, s.pollingFrequencyMinutes)
      }
    })
    return () => stopPolling()
  }, [routes])

  useEffect(() => {
    if (routes.length === 0) return
    const center = routes[0].origin
    getStationsWithAQI(center.lat, center.lng).then(setStations)
  }, [routes])

  const handleRoutesCreated = useCallback(
    (newRoutes: Route[]) => {
      if (newRoutes.length > 0) {
        setRoutes([...routes, ...newRoutes])
      }
      setScheduleFormOpen(false)
      localStorage.setItem(ONBOARDING_KEY, '1')
    },
    [routes, setRoutes],
  )

  const suggestBestRoute = useCallback(async () => {
    const r = routes.find((x) => x.id === selectedRouteId) ?? routes[0]
    if (!r) return
    setSuggestLoading(true)
    try {
      const alts = await computeAlternativeRoutes(r.origin, r.destination)
      const withAqi: { coords: [number, number][]; aqi: number }[] = []
      for (const alt of alts) {
        const fakeRoute: Route = { ...r, polyline: alt.coordinates }
        const aqi = await getAQIForRoute(fakeRoute)
        withAqi.push({ coords: alt.coordinates, aqi: aqi ?? 999 })
      }
      const best = withAqi.reduce((a, b) => (a.aqi < b.aqi ? a : b))
      setBestRouteCoords(best.coords)
    } catch {
      setBestRouteCoords(null)
    }
    setSuggestLoading(false)
  }, [routes, selectedRouteId])

  // Compute average AQI dynamically from loaded station data
  const avgAQI =
    stations.length > 0
      ? Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length)
      : null

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <header
        style={{
          padding: '1.1rem 1.25rem',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg) 60%, var(--bg-card) 100%)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              margin: 0,
              fontSize: 'clamp(1.25rem, 3.5vw, 1.65rem)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-amber) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ WebkitTextFillColor: 'initial' }}>🌿</span>
            Anti Pollution Routes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              margin: '0.15rem 0 0',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}
          >
            Discover cleaner commute paths
          </motion.p>
        </div>

        {avgAQI != null && avgAQI > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: getAQIColor(avgAQI),
                boxShadow: `0 0 6px ${getAQIColor(avgAQI)}88`,
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Avg AQI: {avgAQI}</span>
          </motion.div>
        )}
      </header>

      {/* ── Main Layout ────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: mapFullscreen ? '1fr' : 'minmax(260px, 320px) 1fr',
          gridTemplateRows: '1fr',
          minHeight: mapFullscreen ? '100vh' : 'calc(100vh - 100px)',
          gap: 0,
        }}
      >
        {/* Sidebar */}
        {!mapFullscreen && (
          <motion.aside
            className="sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              padding: '1rem',
              overflowY: 'auto',
              borderRight: '1px solid var(--border)',
              background: 'var(--sidebar-bg)',
            }}
          >
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-muted)',
                }}
              >
                Loading…
              </div>
            ) : (
              <RouteList
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                onAddRoute={() => setAddRouteOpen(true)}
                onAddFromSchedule={() => setScheduleFormOpen(true)}
              />
            )}
          </motion.aside>
        )}

        {/* Map area */}
        <motion.section
          layout
          style={{
            position: 'relative',
            height: mapFullscreen ? '100vh' : '100%',
            minHeight: 300,
          }}
        >
          <MapView
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            aqiOverlayMode={aqiOverlayMode}
            stations={stations}
            bestRouteCoords={bestRouteCoords}
          />

          {/* Map controls – top right */}
          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              zIndex: 1000,
            }}
          >
            <button
              type="button"
              className="map-control-btn"
              onClick={() => setAqiOverlayMode((m) => (m === 'heat' ? 'stations' : 'heat'))}
            >
              {aqiOverlayMode === 'heat' ? '📡' : '🔥'}{' '}
              {aqiOverlayMode === 'heat' ? 'Stations' : 'Heat map'}
            </button>
            <button
              type="button"
              className="map-control-btn primary"
              onClick={suggestBestRoute}
              disabled={suggestLoading || routes.length === 0}
            >
              {suggestLoading ? '⏳ Computing…' : '✨ Best route'}
            </button>
            <button
              type="button"
              className="map-control-btn"
              onClick={() => setMapFullscreen((f) => !f)}
              aria-label={mapFullscreen ? 'Exit fullscreen' : 'Map fullscreen'}
            >
              {mapFullscreen ? '🔙 Exit' : '🗺️ Fullscreen'}
            </button>
          </div>

          {/* Settings button – bottom right */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              right: '1rem',
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              zIndex: 1000,
            }}
          >
            ⚙️
          </button>
        </motion.section>
      </main>

      {/* ── Modals ─────────────────────────────────────── */}
      <OnboardingModal
        open={onboardingOpen}
        onClose={() => {
          setOnboardingOpen(false)
          localStorage.setItem(ONBOARDING_KEY, '1')
        }}
        onAddSchedule={() => {
          setOnboardingOpen(false)
          setScheduleFormOpen(true)
        }}
      />

      <AnimatePresence>
        {scheduleFormOpen && (
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
              zIndex: 1001,
              padding: '1rem',
            }}
            onClick={() => setScheduleFormOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ScheduleForm
                onClose={() => setScheduleFormOpen(false)}
                onRoutesCreated={handleRoutesCreated}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addRouteOpen && (
          <AddRouteModal
            onClose={() => setAddRouteOpen(false)}
            onAdd={(r) => {
              addRoute(r)
              setAddRouteOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onDeleteRoutes={() => {
              setRoutes([])
              setSettingsOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Alert Toast ────────────────────────────────── */}
      <AnimatePresence>
        {alertToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '0.85rem 1.25rem',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)',
              borderLeft: `4px solid ${alertToast.route.lastAQI != null ? getAQIColor(alertToast.route.lastAQI) : 'var(--accent)'}`,
              boxShadow: 'var(--shadow-lg)',
              maxWidth: '90%',
              zIndex: 2000,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
            onClick={() => setAlertToast(null)}
          >
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 500 }}>{alertToast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
