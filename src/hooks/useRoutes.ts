import { useState, useEffect, useCallback } from 'react'
import { loadRoutes, saveRoutes } from '../lib/storage'
import type { Route } from '../lib/types'

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutes().then((r) => {
      setRoutes(r)
      setLoading(false)
    })
  }, [])

  const persist = useCallback(async (next: Route[]) => {
    setRoutes(next)
    await saveRoutes(next)
  }, [])

  const addRoute = useCallback(
    async (route: Route) => {
      await persist([...routes, route])
    },
    [routes, persist]
  )

  const updateRoute = useCallback(
    async (id: string, updates: Partial<Route>) => {
      const next = routes.map((r) => (r.id === id ? { ...r, ...updates } : r))
      await persist(next)
    },
    [routes, persist]
  )

  const removeRoute = useCallback(
    async (id: string) => {
      await persist(routes.filter((r) => r.id !== id))
    },
    [routes, persist]
  )

  return { routes, loading, addRoute, updateRoute, removeRoute, setRoutes: persist }
}
