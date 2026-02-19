import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Route as RouteType } from '../lib/types'
import { getAQIColor, getAQILabel, generateAQIGrid } from '../lib/aqi'
import type { StationWithAQI } from '../lib/aqi'
import { AQILegend } from './AQILegend'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

/* ── Helpers ───────────────────────────────────────────── */

function getCoords(route: RouteType): [number, number][] {
  if (Array.isArray(route.polyline) && route.polyline.length > 0) {
    return route.polyline.map((p) =>
      Array.isArray(p) ? ([p[0], p[1]] as [number, number]) : [route.origin.lat, route.origin.lng],
    )
  }
  return [
    [route.origin.lat, route.origin.lng],
    [route.destination.lat, route.destination.lng],
  ]
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Sample points at roughly `intervalM` meters along the polyline */
function samplePointsAlongPolyline(
  coords: [number, number][],
  intervalM: number,
): [number, number][] {
  if (coords.length < 2) return coords

  const points: [number, number][] = [coords[0]]
  let accumulated = 0

  for (let i = 1; i < coords.length; i++) {
    const d = haversineMeters(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])
    accumulated += d

    if (accumulated >= intervalM) {
      points.push(coords[i])
      accumulated = 0
    }
  }

  const last = coords[coords.length - 1]
  if (points.length > 0 && (points[points.length - 1][0] !== last[0] || points[points.length - 1][1] !== last[1])) {
    points.push(last)
  }

  return points
}

/** Inverse-distance weighted AQI interpolation from station data */
function interpolateAQI(lat: number, lng: number, stations: StationWithAQI[]): number | null {
  if (stations.length === 0) return null

  let weightedSum = 0
  let totalWeight = 0

  for (const st of stations) {
    const sLat = st.coordinates?.latitude ?? 0
    const sLng = st.coordinates?.longitude ?? 0
    const dist = haversineMeters(lat, lng, sLat, sLng)
    const w = 1 / (dist + 100)
    weightedSum += st.aqi * w
    totalWeight += w
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
}

/**
 * Returns the AQI label interval (in meters) based on zoom.
 * Higher zoom (closer) = denser labels. Lower zoom (further) = sparser.
 */
function getRouteIntervalForZoom(zoom: number, isSelected: boolean): number {
  // At zoom 16+ show every 200m; at zoom 10 show every 5km; at zoom 8 show every 20km
  // Selected routes are ~40% denser
  const base = isSelected ? 0.6 : 1
  if (zoom >= 16) return 200 * base
  if (zoom >= 15) return 400 * base
  if (zoom >= 14) return 700 * base
  if (zoom >= 13) return 1200 * base
  if (zoom >= 12) return 2500 * base
  if (zoom >= 11) return 5000 * base
  if (zoom >= 10) return 10000 * base
  if (zoom >= 9) return 20000 * base
  return 40000 * base // very zoomed out
}

/** How large should AQI label pills be at this zoom */
function getLabelSizeForZoom(zoom: number, isSelected: boolean): { fontSize: number; height: number; minWidth: number } {
  if (zoom >= 15) return { fontSize: isSelected ? 12 : 10, height: isSelected ? 24 : 20, minWidth: isSelected ? 34 : 28 }
  if (zoom >= 13) return { fontSize: isSelected ? 11 : 9, height: isSelected ? 22 : 18, minWidth: isSelected ? 30 : 24 }
  if (zoom >= 11) return { fontSize: isSelected ? 10 : 8, height: isSelected ? 20 : 16, minWidth: isSelected ? 26 : 22 }
  return { fontSize: isSelected ? 9 : 7, height: isSelected ? 18 : 14, minWidth: isSelected ? 22 : 18 }
}

/* ── Leaflet DivIcon factories ─────────────────────────── */

function createAQILabelIcon(aqi: number, isSelected: boolean, zoom: number): L.DivIcon {
  const color = getAQIColor(aqi)
  const sz = getLabelSizeForZoom(zoom, isSelected)
  const border = isSelected ? '2px solid rgba(255,255,255,0.8)' : '1.5px solid rgba(255,255,255,0.5)'
  const shadow = isSelected ? '0 2px 8px rgba(0,0,0,0.35)' : '0 1px 4px rgba(0,0,0,0.25)'
  return L.divIcon({
    className: 'aqi-label-marker',
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      min-width:${sz.minWidth}px;height:${sz.height}px;padding:0 5px;
      border-radius:${sz.height / 2}px;
      background:${color};
      color:#fff;font-size:${sz.fontSize}px;font-weight:700;
      font-family:'Inter',system-ui,sans-serif;
      box-shadow:${shadow};
      border:${border};
      text-shadow:0 1px 2px rgba(0,0,0,0.3);
      white-space:nowrap;
    ">${aqi}</div>`,
    iconSize: [sz.minWidth, sz.height],
    iconAnchor: [sz.minWidth / 2, sz.height / 2],
  })
}

function createStationIcon(aqi: number, heatMode: boolean): L.DivIcon {
  const color = getAQIColor(aqi)
  if (heatMode) {
    const size = 56
    return L.divIcon({
      className: 'aqi-station-marker',
      html: `<div style="
        position:relative;width:${size}px;height:${size}px;
        border-radius:50%;
        background:radial-gradient(circle, ${color}99 0%, ${color}44 40%, ${color}11 70%, transparent 80%);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="
          font-size:11px;font-weight:800;color:#fff;
          text-shadow:0 1px 3px ${color}, 0 0 8px ${color};
          font-family:'Inter',system-ui,sans-serif;
        ">${aqi}</span>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }

  const size = 32
  return L.divIcon({
    className: 'aqi-station-marker station-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:11px;font-weight:700;
      font-family:'Inter',system-ui,sans-serif;
      border:2.5px solid rgba(255,255,255,0.75);
      box-shadow:0 2px 8px rgba(0,0,0,0.3), 0 0 12px ${color}44;
      cursor:pointer;
    ">${aqi}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Map-wide AQI grid dot */
function createGridAQIIcon(aqi: number): L.DivIcon {
  const color = getAQIColor(aqi)
  return L.divIcon({
    className: 'aqi-station-marker',
    html: `<div style="
      width:40px;height:40px;border-radius:50%;
      background:radial-gradient(circle, ${color}55 0%, ${color}18 50%, transparent 70%);
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:700;color:${color};
      font-family:'Inter',system-ui,sans-serif;
      text-shadow:0 0 4px rgba(0,0,0,0.4);
    ">${aqi}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

/* ── Map sub-components ────────────────────────────────── */

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 })
    }
  }, [map, center])
  return null
}

/** Hook that tracks the current zoom level reactively */
function useZoom(): number {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  })

  return zoom
}

/** Component that renders zoom-adaptive AQI labels along routes */
function ZoomAdaptiveRouteLabels({
  routes,
  stations,
  selectedRouteId,
}: {
  routes: RouteType[]
  stations: StationWithAQI[]
  selectedRouteId: string | null
}) {
  const zoom = useZoom()

  const labels = useMemo(() => {
    if (stations.length === 0) return []
    const out: { key: string; pos: [number, number]; aqi: number; isSelected: boolean }[] = []

    for (const route of routes) {
      const coords = getCoords(route)
      const isSelected = route.id === selectedRouteId
      const interval = getRouteIntervalForZoom(zoom, isSelected)
      const points = samplePointsAlongPolyline(coords, interval)

      points.forEach((pt, i) => {
        const aqi = interpolateAQI(pt[0], pt[1], stations)
        if (aqi != null) {
          out.push({ key: `${route.id}-${zoom}-${i}`, pos: pt, aqi, isSelected })
        }
      })
    }

    return out
  }, [routes, stations, selectedRouteId, zoom])

  return (
    <>
      {labels.map((label) => {
        const icon = createAQILabelIcon(label.aqi, label.isSelected, zoom)
        return (
          <Marker key={label.key} position={label.pos} icon={icon} interactive={false} />
        )
      })}
    </>
  )
}

/** Component that renders the map-wide AQI grid, adapting to zoom */
function ZoomAdaptiveAQIGrid({
  centerLat,
  centerLng,
}: {
  centerLat: number
  centerLng: number
}) {
  const zoom = useZoom()

  // At higher zoom: smaller area, more detail; at lower zoom: wider area, sparser
  const gridConfig = useMemo(() => {
    // ~10km spacing means ~0.09 degrees between points
    // At zoom 8 cover ~200km; at zoom 14 cover ~20km
    if (zoom >= 14) return { gridSize: 8, spreadDeg: 0.05 }   // ~10km area, dense
    if (zoom >= 13) return { gridSize: 8, spreadDeg: 0.08 }   // ~18km area
    if (zoom >= 12) return { gridSize: 8, spreadDeg: 0.14 }   // ~30km area
    if (zoom >= 11) return { gridSize: 8, spreadDeg: 0.25 }   // ~55km area
    if (zoom >= 10) return { gridSize: 8, spreadDeg: 0.45 }   // ~100km area
    if (zoom >= 9) return { gridSize: 7, spreadDeg: 0.8 }     // ~180km area
    return { gridSize: 6, spreadDeg: 1.5 }                     // ~330km area
  }, [zoom])

  const gridPoints = useMemo(
    () => generateAQIGrid(centerLat, centerLng, gridConfig.gridSize, gridConfig.spreadDeg),
    [centerLat, centerLng, gridConfig.gridSize, gridConfig.spreadDeg],
  )

  return (
    <>
      {gridPoints.map((gp) => {
        const lat = gp.coordinates.latitude
        const lng = gp.coordinates.longitude
        const icon = createGridAQIIcon(gp.aqi)
        return <Marker key={`grid-${zoom}-${gp.id}`} position={[lat, lng]} icon={icon} interactive={false} />
      })}
    </>
  )
}

/* ── Main component ────────────────────────────────────── */

interface MapViewProps {
  routes: RouteType[]
  selectedRouteId: string | null
  onSelectRoute: (id: string | null) => void
  aqiOverlayMode: 'heat' | 'stations'
  stations: StationWithAQI[]
  bestRouteCoords: [number, number][] | null
}

export function MapView({
  routes,
  selectedRouteId,
  onSelectRoute,
  aqiOverlayMode,
  stations,
  bestRouteCoords,
}: MapViewProps) {
  const selectedRoute = routes.find((x) => x.id === selectedRouteId) ?? null
  const selectedCoords = selectedRoute ? getCoords(selectedRoute) : null

  const flyCenter: [number, number] | null = selectedCoords
    ? selectedCoords[Math.floor(selectedCoords.length / 2)]
    : null

  const mapCenter = routes.length > 0 ? routes[0].origin : { lat: 12.9716, lng: 77.5946 }

  return (
    <div className="map-view" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo center={flyCenter} />

        {/* ── Map-wide AQI grid (always visible) ─────── */}
        <ZoomAdaptiveAQIGrid centerLat={mapCenter.lat} centerLng={mapCenter.lng} />

        {/* ── AQI station markers ────────────────────── */}
        {stations.map((s) => {
          const lat = s.coordinates?.latitude ?? 0
          const lng = s.coordinates?.longitude ?? 0
          const icon = createStationIcon(s.aqi, aqiOverlayMode === 'heat')
          return (
            <Marker key={s.id} position={[lat, lng]} icon={icon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                  <br />
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 4,
                      padding: '3px 10px',
                      borderRadius: 8,
                      background: getAQIColor(s.aqi),
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    AQI {s.aqi}
                  </span>
                  <br />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'inline-block' }}>
                    {getAQILabel(s.aqi)}
                  </span>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* ── Suggested best route ────────────────────── */}
        {bestRouteCoords && bestRouteCoords.length > 1 && (
          <Polyline
            positions={bestRouteCoords}
            pathOptions={{
              color: '#22c55e',
              weight: 6,
              opacity: 0.9,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* ── All route polylines ────────────────────── */}
        {routes.map((route) => {
          const coords = getCoords(route)
          const color = route.lastAQI != null ? getAQIColor(route.lastAQI) : '#6b7280'
          const isSelected = route.id === selectedRouteId

          return (
            <div key={route.id}>
              {isSelected && (
                <Polyline
                  positions={coords}
                  pathOptions={{
                    color,
                    weight: 14,
                    opacity: 0.2,
                    className: 'route-polyline',
                  }}
                />
              )}
              <Polyline
                positions={coords}
                pathOptions={{
                  color,
                  weight: isSelected ? 5 : 3.5,
                  opacity: isSelected ? 1 : 0.75,
                  className: 'route-polyline',
                }}
                eventHandlers={{
                  click: () => onSelectRoute(route.id),
                }}
              />
              <Marker
                position={[route.origin.lat, route.origin.lng]}
                eventHandlers={{ click: () => onSelectRoute(route.id) }}
              >
                <Popup>
                  <strong>{route.origin.label}</strong>{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Start)</span>
                </Popup>
              </Marker>
              <Marker
                position={[route.destination.lat, route.destination.lng]}
                eventHandlers={{ click: () => onSelectRoute(route.id) }}
              >
                <Popup>
                  <strong>{route.destination.label}</strong>{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(End)</span>
                </Popup>
              </Marker>
            </div>
          )
        })}

        {/* ── Zoom-adaptive AQI labels along ALL routes ── */}
        <ZoomAdaptiveRouteLabels
          routes={routes}
          stations={stations}
          selectedRouteId={selectedRouteId}
        />
      </MapContainer>

      {/* AQI Legend overlay */}
      <AQILegend />
    </div>
  )
}
