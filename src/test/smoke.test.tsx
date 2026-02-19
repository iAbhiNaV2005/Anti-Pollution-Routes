import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouteList } from '../components/RouteList'
import { loadRoutes } from '../lib/storage'
import { getAQIColor } from '../lib/aqi'

describe('Smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads demo routes from storage', async () => {
    const routes = await loadRoutes()
    expect(routes).toBeDefined()
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
    const first = routes[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('origin')
    expect(first).toHaveProperty('destination')
    expect(first).toHaveProperty('polyline')
  })

  it('renders RouteList with demo routes', async () => {
    const routes = await loadRoutes()
    render(
      <RouteList
        routes={routes}
        selectedRouteId={null}
        onSelectRoute={() => {}}
        onAddRoute={() => {}}
      />
    )
    expect(screen.getByText(/Saved routes/i)).toBeInTheDocument()
    expect(screen.getByText(/Add route/i)).toBeInTheDocument()
    if (routes.length > 0) {
      expect(screen.getByText(routes[0].name)).toBeInTheDocument()
    }
  })

  it('getAQIColor returns valid hex for AQI values', () => {
    expect(getAQIColor(25)).toMatch(/^#[0-9a-f]{6}$/i)
    expect(getAQIColor(85)).toMatch(/^#[0-9a-f]{6}$/i)
    expect(getAQIColor(150)).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
