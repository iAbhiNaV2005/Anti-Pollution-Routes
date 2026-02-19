import type { Location } from './types'

const OSRM_BASE = 'https://router.project-osrm.org'
const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car'
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY as string | undefined

export interface RouteResult {
  coordinates: [number, number][]
  distance: number
  duration: number
}

function straightLine(origin: Location, destination: Location): RouteResult {
  const coords: [number, number][] = [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
  ]
  const R = 6371
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  const duration = (distance / 30) * 3600
  return { coordinates: coords, distance, duration }
}

export async function computeRoute(
  origin: Location,
  destination: Location,
  options?: { provider?: 'osrm' | 'ors' | 'straight'; alternatives?: boolean }
): Promise<RouteResult> {
  const provider = options?.provider ?? (ORS_KEY ? 'ors' : 'osrm')

  if (provider === 'straight') {
    return straightLine(origin, destination)
  }

  if (provider === 'ors' && ORS_KEY) {
    try {
      const body = {
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
        alternative_routes: options?.alternatives ? { target_count: 2 } : undefined,
      }
      const res = await fetch(ORS_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: ORS_KEY,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('ORS failed')
      const json = await res.json()
      const route = json.routes?.[0]
      if (!route?.geometry?.coordinates) throw new Error('No geometry')
      const coordinates = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]) as [number, number][]
      return {
        coordinates,
        distance: (route.summary?.distance ?? 0) / 1000,
        duration: route.summary?.duration ?? 0,
      }
    } catch {
      return straightLine(origin, destination)
    }
  }

  try {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
    const alt = options?.alternatives ? '&alternatives=true' : ''
    const url = `${OSRM_BASE}/route/v1/driving/${coords}?geometries=geojson${alt}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('OSRM failed')
    const json = await res.json()
    const route = json.routes?.[0]
    if (!route?.geometry?.coordinates) throw new Error('No geometry')
    const coordinates = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]) as [number, number][]
    return {
      coordinates,
      distance: route.distance ? route.distance / 1000 : 0,
      duration: route.duration ?? 0,
    }
  } catch {
    return straightLine(origin, destination)
  }
}

export async function computeAlternativeRoutes(
  origin: Location,
  destination: Location
): Promise<RouteResult[]> {
  try {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
    const url = `${OSRM_BASE}/route/v1/driving/${coords}?geometries=geojson&alternatives=true`
    const res = await fetch(url)
    if (!res.ok) return [await computeRoute(origin, destination)]
    const json = await res.json()
    const routes = json.routes ?? []
    return routes.slice(0, 3).map((r: { geometry?: { coordinates: number[][] }; distance?: number; duration?: number }) => ({
      coordinates: (r.geometry?.coordinates ?? []).map((c: number[]) => [c[1], c[0]]),
      distance: r.distance ? r.distance / 1000 : 0,
      duration: r.duration ?? 0,
    }))
  } catch {
    const primary = await computeRoute(origin, destination)
    return [primary]
  }
}
