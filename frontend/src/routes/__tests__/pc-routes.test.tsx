/**
 * PC端路由测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PCRoutes } from '../pc'

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

// Mock all page components
vi.mock('../../pages/home/Home', () => ({
  default: () => <div>首页</div>,
}))

vi.mock('../../pages/auth', () => ({
  Login: () => <div>登录页</div>,
  Profile: () => <div>个人中心</div>,
}))

vi.mock('../../pages/system', () => ({
  DepartmentManagement: () => <div>部门管理</div>,
  UserManagement: () => <div>用户管理</div>,
  RoleManagement: () => <div>角色管理</div>,
  AuditLogManagement: () => <div>审计日志</div>,
}))

vi.mock('../../pages/store-planning', () => ({
  PlanList: () => <div>计划列表</div>,
  PlanForm: () => <div>计划表单</div>,
  PlanDetail: () => <div>计划详情</div>,
  Dashboard: () => <div>计划仪表板</div>,
  AnalysisReport: () => <div>分析报表</div>,
  PlanImport: () => <div>数据导入</div>,
  PlanExport: () => <div>数据导出</div>,
  TemplateManagement: () => <div>模板管理</div>,
}))

vi.mock('../../pages/store-expansion', () => ({
  LocationList: () => <div>候选点位</div>,
  FollowUpList: () => <div>跟进单列表</div>,
  FollowUpDetail: () => <div>跟进单详情</div>,
  ProfitFormulaConfig: () => <div>盈利测算配置</div>,
}))

vi.mock('../../pages/store-preparation', () => ({
  ConstructionList: () => <div>施工列表</div>,
  ConstructionDetail: () => <div>施工详情</div>,
  DeliveryList: () => <div>交付列表</div>,
  DeliveryDetail: () => <div>交付详情</div>,
  AcceptanceManagement: () => <div>验收管理</div>,
  MilestoneManagement: () => <div>里程碑管理</div>,
}))

vi.mock('../../pages/store-archive', () => ({
  StoreList: () => <div>门店档案列表</div>,
  StoreDetail: () => <div>门店档案详情</div>,
  StoreForm: () => <div>门店档案表单</div>,
}))

vi.mock('../../pages/approval', () => ({
  ApprovalPending: () => <div>待办审批</div>,
  ApprovalProcessed: () => <div>已办审批</div>,
  ApprovalCC: () => <div>抄送我的</div>,
  ApprovalFollowed: () => <div>我关注的</div>,
  ApprovalInitiated: () => <div>我发起的</div>,
  ApprovalAll: () => <div>全部审批</div>,
  ApprovalDetail: () => <div>审批详情</div>,
  ApprovalTemplateList: () => <div>审批模板列表</div>,
  ApprovalTemplateForm: () => <div>审批模板表单</div>,
}))

vi.mock('../../pages/base-data', () => ({
  BusinessRegionManagement: () => <div>业务大区管理</div>,
  SupplierManagement: () => <div>供应商管理</div>,
  LegalEntityManagement: () => <div>法人主体管理</div>,
  CustomerManagement: () => <div>客户管理</div>,
  BudgetManagement: () => <div>预算管理</div>,
}))

vi.mock('../../pages/message', () => ({
  MessageCenter: () => <div>消息中心</div>,
}))

vi.mock('../../pages/business-dashboard', () => ({
  BusinessDashboard: () => <div>经营大屏</div>,
  DataReports: () => <div>数据报表</div>,
}))

vi.mock('../../pages/store-operation', () => ({
  PaymentTracking: () => <div>付款追踪</div>,
  AssetManagement: () => <div>资产管理</div>,
}))

describe('PC端路由测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('登录和首页路由', () => {
    it('应该渲染登录页路由 /pc/login', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/pc/login']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('登录页')).toBeInTheDocument()
      })
    })

    it('应该渲染首页路由 /pc', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/pc']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('首页')).toBeInTheDocument()
      })
    })

    it('应该渲染个人中心路由 /pc/profile', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/pc/profile']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('个人中心')).toBeInTheDocument()
      })
    })

    it('应该渲染消息中心路由 /pc/messages', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/pc/messages']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('消息中心')).toBeInTheDocument()
      })
    })
  })

  describe('系统管理路由', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
    })

    it('应该渲染部门管理路由 /pc/system/departments', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/system/departments']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('部门管理')).toBeInTheDocument()
      })
    })

    it('应该渲染用户管理路由 /pc/system/users', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/system/users']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('用户管理')).toBeInTheDocument()
      })
    })

    it('应该渲染角色管理路由 /pc/system/roles', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/system/roles']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('角色管理')).toBeInTheDocument()
      })
    })

    it('应该渲染审计日志路由 /pc/system/audit-logs', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/system/audit-logs']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('审计日志')).toBeInTheDocument()
      })
    })
  })

  describe('门店计划路由', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
    })

    it('应该渲染计划列表路由 /pc/store-planning/plans', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/store-planning/plans']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('计划列表')).toBeInTheDocument()
      })
    })

    it('应该渲染计划仪表板路由 /pc/store-planning/dashboard', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/store-planning/dashboard']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('计划仪表板')).toBeInTheDocument()
      })
    })
  })

  describe('拓店管理路由', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
    })

    it('应该渲染候选点位路由 /pc/store-expansion/locations', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/store-expansion/locations']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('候选点位')).toBeInTheDocument()
      })
    })

    it('应该渲染跟进单列表路由 /pc/store-expansion/follow-ups', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/store-expansion/follow-ups']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('跟进单列表')).toBeInTheDocument()
      })
    })
  })

  describe('施工管理路由', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
    })

    it('应该渲染施工列表路由 /pc/store-preparation/construction', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/store-preparation/construction']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('施工列表')).toBeInTheDocument()
      })
    })

    it('应该渲染交付列表路由 /pc/store-preparation/delivery', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/store-preparation/delivery']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('交付列表')).toBeInTheDocument()
      })
    })
  })

  describe('审批中心路由', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
    })

    it('应该渲染待办审批路由 /pc/approval/pending', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/approval/pending']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('待办审批')).toBeInTheDocument()
      })
    })

    it('应该渲染已办审批路由 /pc/approval/processed', async () => {
      render(
        <MemoryRouter initialEntries={['/pc/approval/processed']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('已办审批')).toBeInTheDocument()
      })
    })
  })

  describe('404页面处理', () => {
    it('应该渲染404页面', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/pc/non-existent-route']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('页面未找到')).toBeInTheDocument()
      })
    })
  })

  describe('路由守卫', () => {
    it('未登录时应该重定向到登录页', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/pc']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('登录页')).toBeInTheDocument()
      })
    })

    it('已登录时访问登录页应该重定向到首页', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })

      render(
        <MemoryRouter initialEntries={['/pc/login']}>
          <Routes>
            <Route path="/pc/*" element={<PCRoutes />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('首页')).toBeInTheDocument()
      })
    })
  })
})
