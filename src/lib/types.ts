export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface Location {
  lat: number
  lng: number
  label: string
}

export interface ScheduleSlot {
  day: DayOfWeek
  start: string
  end: string
}

export interface Route {
  id: string
  name: string
  origin: Location
  destination: Location
  polyline: string | [number, number][]
  schedule: ScheduleSlot[]
  lastAQI?: number
  preferred?: boolean
}

export interface ScheduleItem {
  id: string
  name: string
  location: Location
  days: DayOfWeek[]
  startTime: string
  endTime: string
  routeName?: string
}

export interface AppState {
  routes: Route[]
  scheduleItems?: ScheduleItem[]
}

export interface AppSettings {
  pollingFrequencyMinutes: number
  aqiThreshold: number
  mapStyle: 'light' | 'dark'
}
