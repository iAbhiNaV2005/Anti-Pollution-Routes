import localforage from 'localforage'
import type { Route, AppState, AppSettings } from './types'
import { STORAGE_KEY, SETTINGS_KEY } from './constants'

const store = localforage.createInstance({
  name: 'anti-pollution-routes',
  storeName: 'data',
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
})

const DEMO_ROUTE: Route = {
  id: 'route-1',
  name: 'Home → Work',
  origin: { lat: 12.9716, lng: 77.5946, label: 'Home' },
  destination: { lat: 12.9822, lng: 77.5775, label: 'Office' },
  polyline: [
    [12.9716, 77.5946],
    [12.973, 77.592],
    [12.976, 77.588],
    [12.979, 77.582],
    [12.9822, 77.5775],
  ],
  schedule: [
    { day: 'monday', start: '08:00', end: '09:00' },
    { day: 'tuesday', start: '08:00', end: '09:00' },
    { day: 'wednesday', start: '08:00', end: '09:00' },
    { day: 'thursday', start: '08:00', end: '09:00' },
    { day: 'friday', start: '08:00', end: '09:00' },
  ],
  lastAQI: 85,
  preferred: true,
}

const DEFAULT_SETTINGS: AppSettings = {
  pollingFrequencyMinutes: 15,
  aqiThreshold: 50,
  mapStyle: 'light',
}

export async function loadRoutes(): Promise<Route[]> {
  const data = await store.getItem<AppState>(STORAGE_KEY)
  if (!data?.routes?.length) {
    return [DEMO_ROUTE]
  }
  return data.routes
}

export async function saveRoutes(routes: Route[]): Promise<void> {
  const existing = await store.getItem<AppState>(STORAGE_KEY)
  await store.setItem<AppState>(STORAGE_KEY, {
    ...existing,
    routes,
  })
}

export async function loadSettings(): Promise<AppSettings> {
  const s = await store.getItem<AppSettings>(SETTINGS_KEY)
  return s ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await store.setItem(SETTINGS_KEY, settings)
}

export { DEMO_ROUTE }
