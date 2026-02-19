import { useState, useCallback } from 'react'
import type { ScheduleItem } from '../lib/types'

export function useSchedule(initial: ScheduleItem[] = []) {
  const [items, setItems] = useState<ScheduleItem[]>(initial)

  const addItem = useCallback((item: ScheduleItem) => {
    setItems((prev) => [...prev, item])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<ScheduleItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return { items, setItems, addItem, removeItem, updateItem, clear }
}
