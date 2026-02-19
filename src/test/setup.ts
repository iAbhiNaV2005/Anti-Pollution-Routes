import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

const mockStore: Record<string, unknown> = {}

vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: vi.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
      setItem: vi.fn((key: string, value: unknown) => {
        mockStore[key] = value
        return Promise.resolve()
      }),
    }),
  },
}))
