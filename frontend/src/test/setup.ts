/**
 * 测试环境配置文件
 */
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock window.matchMedia (Arco Design 需要)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as any

// 每个测试后自动清理
afterEach(() => {
  cleanup()
})
