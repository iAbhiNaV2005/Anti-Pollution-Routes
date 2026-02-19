import { getAQIForRoute } from './aqi'
import type { Route } from './types'

let pollInterval: ReturnType<typeof setInterval> | null = null
let onInAppAlert: ((msg: string, route: Route) => void) | null = null

export function setInAppAlertHandler(handler: (msg: string, route: Route) => void | null): void {
  onInAppAlert = handler
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  return await Notification.requestPermission()
}

export function startPolling(
  routes: Route[],
  threshold: number,
  intervalMinutes: number
): void {
  stopPolling()
  const ms = intervalMinutes * 60 * 1000

  const check = async () => {
    if (document.hidden) return
    for (const route of routes) {
      try {
        const aqi = await getAQIForRoute(route)
        if (aqi != null && aqi <= threshold) {
          const msg = `AQI on "${route.name}" is ${aqi} (≤ ${threshold}). Good time to travel!`
          if (Notification.permission === 'granted') {
            new Notification('Anti Pollution Routes', { body: msg })
          }
          onInAppAlert?.(msg, route)
        }
      } catch {
        // ignore
      }
    }
  }

  pollInterval = setInterval(check, ms)
  void check()
}

export function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}
