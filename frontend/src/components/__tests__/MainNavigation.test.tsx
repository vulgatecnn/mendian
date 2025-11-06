/**
 * MainNavigation 组件渲染测试
 * 验证组件能够成功挂载而不抛出图标导入错误
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { MainNavigation } from '../MainNavigation'

// Mock hooks
vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    hasModuleAccess: vi.fn(() => true),
    hasPermission: vi.fn(() => true)
  })
}))

// Mock PermissionGuard
vi.mock('../PermissionGuard', () => ({
  PermissionGuard: ({ children }: any) => <>{children}</>
}))

describe('MainNavigation 组件', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    )
  }

  it('应该能够渲染而不抛出图标导入错误', () => {
    renderWithRouter(<MainNavigation />)
    
    // 验证组件成功挂载 - 检查菜单容器存在
    const menuElement = document.querySelector('.arco-menu')
    expect(menuElement).toBeTruthy()
  })

  it('应该在垂直模式下渲染', () => {
    renderWithRouter(<MainNavigation mode="vertical" />)
    
    const menuElement = document.querySelector('.arco-menu-vertical')
    expect(menuElement).toBeTruthy()
  })

  it('应该在水平模式下渲染', () => {
    renderWithRouter(<MainNavigation mode="horizontal" />)
    
    const menuElement = document.querySelector('.arco-menu-horizontal')
    expect(menuElement).toBeTruthy()
  })

  it('应该显示所有图标元素', () => {
    renderWithRouter(<MainNavigation />)
    
    // 验证菜单项存在（图标会作为菜单项的一部分渲染）
    const menuItems = document.querySelectorAll('.arco-menu-item')
    expect(menuItems.length).toBeGreaterThan(0)
  })
})
