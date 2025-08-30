// 统一导出所有Mock工具
import { vi } from 'vitest'
import React from 'react'

// Import functions for local use
import { setupAntdMocks } from './antd'
import { setupReactRouterMocks } from './react-router'
import { setupReactQueryMocks } from './react-query'

// Antd组件Mock
export {
  antdMocks,
  setupAntdMocks,
} from './antd'

// React Router Mock
export {
  routerMocks,
  routerMockUtils,
  RouterMockUtils,
  createMockRouter,
  setupReactRouterMocks,
  RouterTestWrapper,
} from './react-router'

// React Query Mock
export {
  reactQueryMocks,
  QueryMockUtils,
  BusinessQueryMocks,
  AdvancedQueryMocks,
  advancedQueryMocks,
  setupReactQueryMocks,
  createTestQueryClient,
} from './react-query'

// 全局Mock设置函数
export const setupAllMocks = () => {
  setupAntdMocks()
  setupReactRouterMocks()
  setupReactQueryMocks()
  
  // 设置其他全局Mock
  setupGlobalMocks()
}

// 全局环境Mock
export const setupGlobalMocks = () => {
  // Mock window.matchMedia
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

  // Mock getComputedStyle
  global.getComputedStyle = vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
    fontSize: '14px',
    lineHeight: '1.5',
    fontFamily: 'Arial, sans-serif',
  })) as any

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  })

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  })

  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2)',
      language: 'zh-CN',
      languages: ['zh-CN', 'zh', 'en'],
      platform: 'Win32',
      cookieEnabled: true,
      onLine: true,
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
        readText: vi.fn(() => Promise.resolve('')),
      },
    },
    writable: true,
    configurable: true,
  })

  // Mock fetch
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    })
  ) as any

  // Mock URL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()

  // Mock File和FileReader
  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onload: vi.fn(),
    onerror: vi.fn(),
    result: null,
  }))

  // Mock crypto
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      }),
      randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
    },
    writable: true,
    configurable: true,
  })

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16)
    return 1
  })
  global.cancelAnimationFrame = vi.fn()

  // Mock performance
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      timing: {
        navigationStart: Date.now(),
        domContentLoadedEventEnd: Date.now() + 100,
        loadEventEnd: Date.now() + 200,
      },
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
      getEntriesByType: vi.fn(() => []),
      mark: vi.fn(),
      measure: vi.fn(),
    },
    writable: true,
    configurable: true,
  })
}

// 常用的第三方库Mock
export const setupThirdPartyMocks = () => {
  // Mock dayjs
  vi.mock('dayjs', () => {
    const mockDayjs = vi.fn((date) => ({
      format: vi.fn(() => '2024-01-01'),
      toDate: vi.fn(() => new Date('2024-01-01')),
      valueOf: vi.fn(() => new Date('2024-01-01').valueOf()),
      toISOString: vi.fn(() => '2024-01-01T00:00:00.000Z'),
      startOf: vi.fn(() => mockDayjs('2024-01-01')),
      endOf: vi.fn(() => mockDayjs('2024-12-31')),
      year: vi.fn(() => 2024),
      month: vi.fn(() => 0),
      date: vi.fn(() => 1),
      fromNow: vi.fn(() => '1 day ago'),
      diff: vi.fn(() => 1),
      isBefore: vi.fn(() => false),
      isAfter: vi.fn(() => true),
      isSame: vi.fn(() => true),
      add: vi.fn(() => mockDayjs('2024-01-02')),
      subtract: vi.fn(() => mockDayjs('2023-12-31')),
      locale: vi.fn(() => mockDayjs(date)),
    }))
    
    mockDayjs.extend = vi.fn()
    mockDayjs.locale = vi.fn()
    
    return { default: mockDayjs }
  })

  // Mock lodash-es
  vi.mock('lodash-es', () => ({
    debounce: vi.fn((fn) => fn),
    throttle: vi.fn((fn) => fn),
    isEmpty: vi.fn(() => false),
    isEqual: vi.fn(() => true),
    cloneDeep: vi.fn((obj) => JSON.parse(JSON.stringify(obj))),
    merge: vi.fn((target, source) => ({ ...target, ...source })),
    pick: vi.fn((obj, keys) => {
      const result: any = {}
      keys.forEach((key: string) => {
        if (key in obj) result[key] = obj[key]
      })
      return result
    }),
    omit: vi.fn((obj, keys) => {
      const result = { ...obj }
      keys.forEach((key: string) => delete result[key])
      return result
    }),
  }))

  // Mock axios
  vi.mock('axios', () => ({
    default: {
      get: vi.fn(() => Promise.resolve({ data: {} })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      put: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
      patch: vi.fn(() => Promise.resolve({ data: {} })),
      request: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
      defaults: {
        baseURL: '',
        headers: {},
        timeout: 5000,
      },
      create: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ data: {} })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        put: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
        patch: vi.fn(() => Promise.resolve({ data: {} })),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      })),
    },
  }))

  // Mock chart libraries
  vi.mock('@ant-design/plots', () => ({
    Column: vi.fn(({ data, config }) => 
      React.createElement('div', { 
        'data-testid': 'column-chart',
        'data-config': JSON.stringify(config),
      }, `Column Chart with ${data?.length || 0} items`)
    ),
    Pie: vi.fn(({ data }) => 
      React.createElement('div', { 
        'data-testid': 'pie-chart',
      }, `Pie Chart with ${data?.length || 0} items`)
    ),
    Line: vi.fn(({ data }) => 
      React.createElement('div', { 
        'data-testid': 'line-chart',
      }, `Line Chart with ${data?.length || 0} items`)
    ),
    Area: vi.fn(({ data }) => 
      React.createElement('div', { 
        'data-testid': 'area-chart',
      }, `Area Chart with ${data?.length || 0} items`)
    ),
    Bar: vi.fn(({ data }) => 
      React.createElement('div', { 
        'data-testid': 'bar-chart',
      }, `Bar Chart with ${data?.length || 0} items`)
    ),
  }))

  // Mock file processing libraries
  vi.mock('xlsx', () => ({
    read: vi.fn(() => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } })),
    write: vi.fn(() => new ArrayBuffer(0)),
    utils: {
      sheet_to_json: vi.fn(() => []),
      json_to_sheet: vi.fn(() => ({})),
      book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
      book_append_sheet: vi.fn(),
    },
  }))

  // Mock crypto libraries
  vi.mock('js-md5', () => ({
    default: vi.fn(() => 'mock-md5-hash'),
  }))

  vi.mock('js-sha1', () => ({
    default: vi.fn(() => 'mock-sha1-hash'),
  }))

  // Mock JWT decode
  vi.mock('jwt-decode', () => ({
    default: vi.fn(() => ({
      sub: 'user123',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })),
  }))

  // Mock user agent parser
  vi.mock('ua-parser-js', () => ({
    default: vi.fn().mockImplementation(() => ({
      getResult: () => ({
        ua: 'Mozilla/5.0...',
        browser: { name: 'Chrome', version: '120.0.0' },
        engine: { name: 'Blink', version: '120.0.0' },
        os: { name: 'Windows', version: '10' },
        device: { vendor: undefined, model: undefined, type: undefined },
        cpu: { architecture: 'amd64' },
      }),
    })),
  }))
}

// 清理所有Mock
export const cleanupAllMocks = () => {
  vi.clearAllMocks()
  vi.resetAllMocks()
}

// 重置所有Mock
export const resetAllMocks = () => {
  vi.restoreAllMocks()
  setupAllMocks()
}

// 导出常用的vi函数
export { vi } from 'vitest'