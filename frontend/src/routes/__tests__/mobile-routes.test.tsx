/**
 * 移动端路由测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MobileRoutes, MobileExpansionRoutes, MobilePreparationRoutes, MobileApprovalRoutes } from '../mobile'

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../../contexts', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => <>{children}</>,
  PermissionProvider: ({ children }: any) => <>{children}</>,
  StorePlanProvider: ({ children }: any) => <>{children}</>,
}))

// Mock ProtectedRoute
vi.mock('../../components', () => ({
  ProtectedRoute: ({ children }: any) => <>{children}</>,
}))

// Mock mobile page components
vi.mock('../../pages/mobile', () => ({
  MobileLayout: ({ children }: any) => <div>移动端布局{children}</div>,
  MobileHome: () => <div>移动端首页</div>,
  MobileWorkbench: () => <div>移动端工作台</div>,
  MobileMessages: () => <div>移动端消息</div>,
  MobileProfile: () => <div>移动端个人中心</div>,
  MobileLocationList: () => <div>移动端候选点位</div>,
  MobileFollowUpList: () => <div>移动端跟进单列表</div>,
  MobileFollowUpDetail: () => <div>移动端跟进单详情</div>,
  MobileConstructionAcceptance: () => <div>移动端工程验收</div>,
  MobileApprovalList: () => <div>移动端审批列表</div>,
  MobileApprovalDetail: () => <div>移动端审批详情</div>,
  MobileAnalytics: () => <div>移动端数据分析</div>,
  WeChatLogin: () => <div>企业微信登录</div>,
}))

describe('移动端路由测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
  })

  describe('移动端基础路由', () => {
    it('应该渲染移动端首页路由 /mobile/home', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <Routes>
            <Route path="/mobile/*" element={<MobileRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端首页')).toBeInTheDocument()
      })
    })

    it('应该渲染移动端工作台路由 /mobile/workbench', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/workbench']}>
          <Routes>
            <Route path="/mobile/*" element={<MobileRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端工作台')).toBeInTheDocument()
      })
    })

    it('应该渲染移动端消息路由 /mobile/messages', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/messages']}>
          <Routes>
            <Route path="/mobile/*" element={<MobileRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端消息')).toBeInTheDocument()
      })
    })

    it('应该渲染移动端个人中心路由 /mobile/profile', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/profile']}>
          <Routes>
            <Route path="/mobile/*" element={<MobileRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端个人中心')).toBeInTheDocument()
      })
    })
  })

  describe('移动端拓店管理路由', () => {
    it('应该渲染候选点位列表路由', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/expansion/locations']}>
          <Routes>
            <Route path="/mobile/expansion/*" element={<MobileExpansionRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端候选点位')).toBeInTheDocument()
      })
    })

    it('应该渲染跟进单列表路由', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/expansion/follow-ups']}>
          <Routes>
            <Route path="/mobile/expansion/*" element={<MobileExpansionRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端跟进单列表')).toBeInTheDocument()
      })
    })

    it('应该渲染跟进单详情路由', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/expansion/follow-ups/1']}>
          <Routes>
            <Route path="/mobile/expansion/*" element={<MobileExpansionRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端跟进单详情')).toBeInTheDocument()
      })
    })
  })

  describe('移动端开店筹备路由', () => {
    it('应该渲染工程验收路由', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/preparation/construction/1/acceptance']}>
          <Routes>
            <Route path="/mobile/preparation/*" element={<MobilePreparationRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端工程验收')).toBeInTheDocument()
      })
    })
  })

  describe('移动端审批中心路由', () => {
    it('应该渲染审批列表路由', async () => {
      render(
        <MemoryRouter initialEntries={['/mobile/approval']}>
          <Routes>
            <Route path="/mobile/approval/*" element={<MobileApprovalRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('移动端审批列表')).toBeInTheDocument()
      })
    })
  })

  describe('企业微信登录', () => {
    it('应该渲染企业微信登录入口', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/mobile/wechat-login']}>
          <Routes>
            <Route path="/mobile/*" element={<MobileRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('企业微信登录')).toBeInTheDocument()
      })
    })
  })

  describe('移动端路由可访问性', () => {
    it('所有移动端路由应该可访问', async () => {
      const routes = [
        '/mobile/home',
        '/mobile/workbench',
        '/mobile/messages',
        '/mobile/profile',
      ]

      for (const route of routes) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/mobile/*" element={<MobileRoutes />} />
            </Routes>
          </MemoryRouter>
        )

        await waitFor(() => {
          expect(document.body.textContent).toBeTruthy()
        })

        unmount()
      }
    })
  })
})
