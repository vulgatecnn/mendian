/**
 * 测试辅助工具函数
 */
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

/**
 * 带路由的渲染函数
 */
export function renderWithRouter(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  })
}

/**
 * Mock usePermission hook
 */
export function mockUsePermission(overrides?: any) {
  return {
    hasModuleAccess: vi.fn(() => true),
    hasPermission: vi.fn(() => true),
    ...overrides,
  }
}

/**
 * Mock useNavigate hook
 */
export function mockUseNavigate() {
  return vi.fn()
}

/**
 * 等待异步操作完成
 */
export function waitForAsync(ms: number = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
