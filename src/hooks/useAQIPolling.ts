import { useEffect, useRef } from 'react'
import { startPolling, stopPolling } from '../lib/notifications'
import type { Route } from '../lib/types'

export function useAQIPolling(
  routes: Route[],
  threshold: number,
  intervalMinutes: number,
  enabled: boolean
) {
  const onAlertRef = useRef<((msg: string, route: Route) => void) | null>(null)

  useEffect(() => {
    if (!enabled || routes.length === 0) {
      stopPolling()
      return
    }
    startPolling(routes, threshold, intervalMinutes)
    return () => stopPolling()
  }, [routes, threshold, intervalMinutes, enabled])

  return {
    setOnAlert: (fn: ((msg: string, route: Route) => void) | null) => {
      onAlertRef.current = fn
    },
  }
}
