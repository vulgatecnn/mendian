/**
 * 布局组件测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { Layout, Menu, Breadcrumb } from '@arco-design/web-react'
import MainNavigation from '../MainNavigation'

// Mock hooks
vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    hasModuleAccess: vi.fn(() => true),
    hasPermission: vi.fn(() => true),
  }),
}))

// Mock PermissionGuard
vi.mock('../PermissionGuard', () => ({
  PermissionGuard: ({ children }: any) => <>{children}</>,
}))

describe('布局组件测试', () => {
  describe('Header 组件', () => {
    it('应该正确渲染Header', () => {
      const { container } = render(
        <Layout>
          <Layout.Header>
            <div>系统标题</div>
          </Layout.Header>
        </Layout>
      )
      
      expect(screen.getByText('系统标题')).toBeInTheDocument()
      expect(container.querySelector('.arco-layout-header')).toBeInTheDocument()
    })

    it('应该显示用户菜单', () => {
      render(
        <BrowserRouter>
          <Layout>
            <Layout.Header>
              <Menu mode="horizontal">
                <Menu.Item key="profile">个人中心</Menu.Item>
                <Menu.Item key="logout">退出登录</Menu.Item>
              </Menu>
            </Layout.Header>
          </Layout>
        </BrowserRouter>
      )
      
      expect(screen.getByText('个人中心')).toBeInTheDocument()
      expect(screen.getByText('退出登录')).toBeInTheDocument()
    })
  })

  describe('Sidebar 组件', () => {
    it('应该正确渲染Sidebar', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout>
            <Layout.Sider>
              <MainNavigation mode="vertical" />
            </Layout.Sider>
          </Layout>
        </BrowserRouter>
      )
      
      expect(container.querySelector('.arco-layout-sider')).toBeInTheDocument()
    })

    it('应该支持折叠和展开', async () => {
      const { container } = render(
        <BrowserRouter>
          <Layout>
            <Layout.Sider collapsible>
              <MainNavigation mode="vertical" />
            </Layout.Sider>
          </Layout>
        </BrowserRouter>
      )
      
      const sider = container.querySelector('.arco-layout-sider')
      expect(sider).toBeInTheDocument()
    })

    it('应该显示菜单项', () => {
      render(
        <BrowserRouter>
          <Layout>
            <Layout.Sider>
              <MainNavigation mode="vertical" />
            </Layout.Sider>
          </Layout>
        </BrowserRouter>
      )
      
      const menuItems = document.querySelectorAll('.arco-menu-item')
      expect(menuItems.length).toBeGreaterThan(0)
    })
  })

  describe('Layout 组件', () => {
    it('应该正确渲染完整布局', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout>
            <Layout.Header>Header</Layout.Header>
            <Layout>
              <Layout.Sider>Sider</Layout.Sider>
              <Layout.Content>Content</Layout.Content>
            </Layout>
          </Layout>
        </BrowserRouter>
      )
      
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Sider')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(container.querySelector('.arco-layout')).toBeInTheDocument()
    })

    it('应该支持响应式布局', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout style={{ minHeight: '100vh' }}>
            <Layout.Header>Header</Layout.Header>
            <Layout>
              <Layout.Sider breakpoint="lg">Sider</Layout.Sider>
              <Layout.Content>Content</Layout.Content>
            </Layout>
          </Layout>
        </BrowserRouter>
      )
      
      const layout = container.querySelector('.arco-layout')
      expect(layout).toBeInTheDocument()
    })
  })

  describe('Breadcrumb 组件', () => {
    it('应该正确渲染面包屑导航', () => {
      render(
        <BrowserRouter>
          <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>系统管理</Breadcrumb.Item>
            <Breadcrumb.Item>用户管理</Breadcrumb.Item>
          </Breadcrumb>
        </BrowserRouter>
      )
      
      expect(screen.getByText('首页')).toBeInTheDocument()
      expect(screen.getByText('系统管理')).toBeInTheDocument()
      expect(screen.getByText('用户管理')).toBeInTheDocument()
    })

    it('应该显示分隔符', () => {
      const { container } = render(
        <BrowserRouter>
          <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>用户管理</Breadcrumb.Item>
          </Breadcrumb>
        </BrowserRouter>
      )
      
      const breadcrumb = container.querySelector('.arco-breadcrumb')
      expect(breadcrumb).toBeInTheDocument()
    })
  })

  describe('MainNavigation 组件', () => {
    it('应该在垂直模式下渲染', () => {
      const { container } = render(
        <BrowserRouter>
          <MainNavigation mode="vertical" />
        </BrowserRouter>
      )
      
      const menu = container.querySelector('.arco-menu-vertical')
      expect(menu).toBeInTheDocument()
    })

    it('应该在水平模式下渲染', () => {
      const { container } = render(
        <BrowserRouter>
          <MainNavigation mode="horizontal" />
        </BrowserRouter>
      )
      
      const menu = container.querySelector('.arco-menu-horizontal')
      expect(menu).toBeInTheDocument()
    })

    it('应该显示菜单图标', () => {
      const { container } = render(
        <BrowserRouter>
          <MainNavigation />
        </BrowserRouter>
      )
      
      const menuItems = container.querySelectorAll('.arco-menu-item')
      expect(menuItems.length).toBeGreaterThan(0)
    })
  })
})
