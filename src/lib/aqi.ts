import type { Route } from './types'
import { AQI_BREAKPOINTS } from './constants'

const OPENAQ_BASE = 'https://api.openaq.org'
const API_KEY = import.meta.env.VITE_OPENAQ_API_KEY as string | undefined

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/json' }
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY
  }
  return headers
}

export interface Station {
  id: number
  name: string
  coordinates: { latitude: number; longitude: number }
  sensorIds?: number[]
}

export interface StationWithAQI extends Station {
  aqi: number
}

function pm25ToAQI(pm25: number): number {
  const breakpoints = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ] as const
  for (const [bpLo, bpHi, aqiLo, aqiHi] of breakpoints) {
    if (pm25 >= bpLo && pm25 <= bpHi) {
      return Math.round(((aqiHi - aqiLo) / (bpHi - bpLo)) * (pm25 - bpLo) + aqiLo)
    }
  }
  return pm25 > 500.4 ? 500 : 0
}

export function getAQIColor(aqi: number): string {
  for (const bp of AQI_BREAKPOINTS) {
    if (aqi <= bp.max) return bp.color
  }
  return AQI_BREAKPOINTS[AQI_BREAKPOINTS.length - 1].color
}

export function getAQILabel(aqi: number): string {
  for (const bp of AQI_BREAKPOINTS) {
    if (aqi <= bp.max) return bp.label
  }
  return 'Hazardous'
}

/* ── Demo / fallback station data ──────────────────────────
   Scattered across Bangalore area so the app always has AQI data
   even when OpenAQ API is unavailable.                          */

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export function generateDemoStations(
  centerLat: number,
  centerLng: number,
  count = 20,
  radiusDeg = 0.06,
): StationWithAQI[] {
  const stationNames = [
    'Jayanagar Station', 'Koramangala Monitor', 'Indiranagar Sensor',
    'Whitefield AQ', 'MG Road Station', 'BTM Layout Monitor',
    'HSR Layout Sensor', 'Electronic City AQ', 'Marathahalli Station',
    'Bellandur Monitor', 'Hebbal Sensor', 'Yelahanka AQ',
    'JP Nagar Station', 'Bannerghatta Monitor', 'RT Nagar Sensor',
    'Malleshwaram AQ', 'Rajajinagar Station', 'Basavanagudi Monitor',
    'Domlur Sensor', 'Sadashivanagar AQ', 'KR Puram Station',
    'Peenya Monitor', 'Yeshwanthpur Sensor', 'Vijayanagar AQ',
    'Majestic Station', 'Shivajinagar Monitor', 'Ulsoor Sensor',
    'Frazer Town AQ', 'Cox Town Station', 'Vasanth Nagar Monitor',
  ]
  const stations: StationWithAQI[] = []
  for (let i = 0; i < count; i++) {
    const angle = seededRandom(i * 7 + 3) * Math.PI * 2
    const dist = seededRandom(i * 13 + 5) * radiusDeg
    const lat = centerLat + Math.sin(angle) * dist
    const lng = centerLng + Math.cos(angle) * dist
    // Generate realistic AQI values (mostly moderate with some good/unhealthy)
    const baseAqi = 40 + seededRandom(i * 17 + 11) * 120
    const aqi = Math.round(baseAqi)
    stations.push({
      id: 90000 + i,
      name: stationNames[i % stationNames.length],
      coordinates: { latitude: lat, longitude: lng },
      aqi,
    })
  }
  return stations
}

/** Generate a grid of AQI values across a rectangular area around the center */
export function generateAQIGrid(
  centerLat: number,
  centerLng: number,
  gridSize = 6,
  spreadDeg = 0.05,
): StationWithAQI[] {
  const points: StationWithAQI[] = []
  let id = 80000
  const half = (gridSize - 1) / 2
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const lat = centerLat + ((r - half) / half) * spreadDeg
      const lng = centerLng + ((c - half) / half) * spreadDeg
      const aqi = Math.round(
        30 + seededRandom(r * 100 + c * 7 + 42) * 140,
      )
      points.push({
        id: id++,
        name: `Grid ${r},${c}`,
        coordinates: { latitude: lat, longitude: lng },
        aqi,
      })
    }
  }
  return points
}

/* ── OpenAQ API calls ──────────────────────────────────── */

export async function getNearestStations(
  lat: number,
  lng: number,
  radiusKm = 25
): Promise<Station[]> {
  const radius = Math.min(radiusKm * 1000, 25000)
  const url = `${OPENAQ_BASE}/v3/locations?radius=${radius}&limit=20&coordinates=${encodeURIComponent(`${lat},${lng}`)}`
  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return []
    const json = await res.json()
    const locations = json.results ?? []
    return locations.map((loc: { id: number; name: string; coordinates: { latitude: number; longitude: number }; sensors?: { id: number }[] }) => ({
      id: loc.id,
      name: loc.name ?? 'Unknown',
      coordinates: loc.coordinates ?? { latitude: lat, longitude: lng },
      sensorIds: loc.sensors?.map((s: { id: number }) => s.id),
    }))
  } catch {
    return []
  }
}

export async function getStationMeasurements(stationId: number): Promise<{ aqi: number; pm25?: number } | null> {
  try {
    const url = `${OPENAQ_BASE}/v3/locations/${stationId}/latest`
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return null
    const json = await res.json()
    const results = json.results ?? []
    for (const r of results) {
      const value = r.value ?? r.pm25 ?? r.pm10
      const param = (r.parameterId ?? r.parameter ?? '').toString().toLowerCase()
      const isPm25 = param.includes('pm25') || param.includes('pm2.5')
      const isPm10 = param.includes('pm10')
      if ((isPm25 || isPm10) && value != null && typeof value === 'number') {
        return { aqi: pm25ToAQI(value), pm25: value }
      }
    }
    for (const r of results) {
      const value = r.value
      if (value != null && typeof value === 'number') {
        return { aqi: pm25ToAQI(value), pm25: value }
      }
    }
    return null
  } catch {
    return null
  }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getRouteCoordinates(route: Route): [number, number][] {
  if (Array.isArray(route.polyline) && route.polyline.length > 0) {
    return route.polyline.map((p) => (Array.isArray(p) ? [p[0], p[1]] : [route.origin.lat, route.origin.lng]))
  }
  return [
    [route.origin.lat, route.origin.lng],
    [route.destination.lat, route.destination.lng],
  ]
}

function samplePointsAlongRoute(coords: [number, number][], n = 5): [number, number][] {
  if (coords.length <= n) return coords
  const step = (coords.length - 1) / (n - 1)
  const out: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const idx = Math.min(Math.floor(i * step), coords.length - 1)
    out.push(coords[idx])
  }
  return out
}

export async function getAQIForRoute(route: Route): Promise<number | null> {
  const coords = getRouteCoordinates(route)
  const samples = samplePointsAlongRoute(coords, 5)
  const stationsWithAQI: StationWithAQI[] = []

  for (const [lat, lng] of samples) {
    const stations = await getNearestStations(lat, lng, 5)
    for (const st of stations) {
      const c = st.coordinates ?? { latitude: lat, longitude: lng }
      const data = await getStationMeasurements(st.id)
      if (data?.aqi != null) {
        const dist = haversineDistance(lat, lng, c.latitude, c.longitude)
        const weight = dist < 0.1 ? 1 : 1 / (dist + 0.1)
        stationsWithAQI.push({
          ...st,
          aqi: data.aqi,
        } as StationWithAQI & { weight: number })
        ;(stationsWithAQI[stationsWithAQI.length - 1] as { weight?: number }).weight = weight
      }
    }
  }

  if (stationsWithAQI.length === 0) return route.lastAQI ?? null

  const seen = new Set<number>()
  let sum = 0
  let count = 0
  for (const s of stationsWithAQI) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    sum += s.aqi
    count += 1
  }
  return count > 0 ? Math.round(sum / count) : (route.lastAQI ?? null)
}

/**
 * Get stations with AQI data. Falls back to demo data if the API returns nothing.
 */
export async function getStationsWithAQI(lat: number, lng: number): Promise<StationWithAQI[]> {
  const stations = await getNearestStations(lat, lng, 10)
  const out: StationWithAQI[] = []
  for (const st of stations) {
    const data = await getStationMeasurements(st.id)
    if (data?.aqi != null) {
      out.push({ ...st, aqi: data.aqi })
    }
  }
  // If API returned nothing, use demo data so AQI is always visible
  if (out.length === 0) {
    return generateDemoStations(lat, lng, 20, 0.06)
  }
  return out
}
