export const AQI_COLORS: Record<string, string> = {
  good: '#22c55e',
  moderate: '#eab308',
  unhealthySensitive: '#f97316',
  unhealthy: '#ef4444',
  veryUnhealthy: '#a855f7',
  hazardous: '#7c3aed',
}

export const AQI_BREAKPOINTS = [
  { max: 50, color: '#22c55e', label: 'Good' },
  { max: 100, color: '#eab308', label: 'Moderate' },
  { max: 150, color: '#f97316', label: 'Unhealthy for Sensitive' },
  { max: 200, color: '#ef4444', label: 'Unhealthy' },
  { max: 300, color: '#a855f7', label: 'Very Unhealthy' },
  { max: Infinity, color: '#7c3aed', label: 'Hazardous' },
]

export const STORAGE_KEY = 'anti-pollution-routes-data'
export const SETTINGS_KEY = 'anti-pollution-routes-settings'
export const ONBOARDING_KEY = 'anti-pollution-routes-onboarding-done'
