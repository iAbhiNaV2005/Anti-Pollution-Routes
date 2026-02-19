const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

let lastRequest = 0
const MIN_INTERVAL_MS = 1100

async function rateLimit(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequest
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed))
  }
  lastRequest = Date.now()
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  await rateLimit()
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AntiPollutionRoutes/1.0' },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : []).map((item: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name ?? '',
    }))
  } catch {
    return []
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  await rateLimit()
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AntiPollutionRoutes/1.0' },
    })
    if (!res.ok) return null
    const item = await res.json()
    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    }
  } catch {
    return null
  }
}
