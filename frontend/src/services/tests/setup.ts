// 测试环境设置
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { mockHandlers } from '../mock/handlers'
import { queryClient } from '../query/config'
import '@testing-library/jest-dom'

// 创建MSW服务器用于测试
export const server = setupServer()

// 在所有测试之前启动服务器
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

// 每个测试后重置处理器到初始状态
afterEach(() => {
  server.resetHandlers()
  queryClient.clear()
})

// 在所有测试之后关闭服务器
afterAll(() => {
  server.close()
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:7000',
    origin: 'http://localhost:7000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
})

// Mock fetch for tests
global.fetch = vi.fn()

// Mock antd DatePicker components that cause dayjs issues
vi.mock('antd', async () => {
  const originalAntd = await vi.importActual<typeof import('antd')>('antd')
  const React = await vi.importActual<typeof import('react')>('react')
  
  return {
    ...originalAntd,
    DatePicker: {
      ...originalAntd.DatePicker,
      RangePicker: vi.fn(() => React.createElement('div', { 'data-testid': 'mock-range-picker' }, 'Mock Range Picker'))
    }
  }
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock React Query hooks
vi.mock('@/services/query/hooks/useStorePlan', () => ({
  useStorePlan: () => ({
    data: null,
    error: null,
    loading: false,
    refetch: vi.fn()
  }),
  useStorePlanStats: () => ({
    data: {
      totalCount: 100,
      completedCount: 60,
      inProgressCount: 30,
      pendingCount: 10,
      totalBudget: 10000000,
      usedBudget: 6000000,
    },
    error: null,
    loading: false,
    refetch: vi.fn()
  }),
  useStorePlanProgress: () => ({
    data: [
      { quarter: 'Q1', planned: 25, completed: 20 },
      { quarter: 'Q2', planned: 30, completed: 25 },
      { quarter: 'Q3', planned: 25, completed: 15 },
      { quarter: 'Q4', planned: 20, completed: 0 },
    ],
    error: null,
    loading: false,
    refetch: vi.fn()
  })
}))

// Setup global test utilities
export const mockLocalStorage = {
  getItem: window.localStorage.getItem as any,
  setItem: window.localStorage.setItem as any,
  removeItem: window.localStorage.removeItem as any,
  clear: window.localStorage.clear as any
}

export const resetMocks = () => {
  vi.clearAllMocks()
  queryClient.clear()
}
