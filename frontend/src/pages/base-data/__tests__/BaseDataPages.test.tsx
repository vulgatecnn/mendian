/**
 * 基础数据管理页面测试
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import BusinessRegionManagement from '../BusinessRegionManagement'
import SupplierManagement from '../SupplierManagement'
import LegalEntityManagement from '../LegalEntityManagement'
import CustomerManagement from '../CustomerManagement'
import BudgetManagement from '../BudgetManagement'

// Mock API 服务
vi.mock('../../../api/baseDataService', () => ({
  default: {
    getBusinessRegions: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getSuppliers: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getLegalEntities: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getCustomers: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getBudgets: vi.fn().mockResolvedValue({ results: [], count: 0 }),
  }
}))

// Mock 权限 Hook
vi.mock('../../../hooks/usePermission', () => ({
  usePermission: () => ({
    hasModuleAccess: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  })
}))

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('基础数据管理页面', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('业务大区管理页面', () => {
    it('应该正确渲染页面标题和新建按钮', async () => {
      render(
        <TestWrapper>
          <BusinessRegionManagement />
        </TestWrapper>
      )

      expect(screen.getByText('业务大区管理')).toBeInTheDocument()
      expect(screen.getByText('新建大区')).toBeInTheDocument()
    })

    it('应该显示表格列标题', async () => {
      render(
        <TestWrapper>
          <BusinessRegionManagement />
        </TestWrapper>
      )

      expect(screen.getByText('大区名称')).toBeInTheDocument()
      expect(screen.getByText('大区编码')).toBeInTheDocument()
      expect(screen.getByText('状态')).toBeInTheDocument()
    })
  })

  describe('供应商管理页面', () => {
    it('应该正确渲染页面标题和新建按钮', async () => {
      render(
        <TestWrapper>
          <SupplierManagement />
        </TestWrapper>
      )

      expect(screen.getByText('供应商管理')).toBeInTheDocument()
      expect(screen.getByText('新建供应商')).toBeInTheDocument()
    })

    it('应该显示搜索表单', async () => {
      render(
        <TestWrapper>
          <SupplierManagement />
        </TestWrapper>
      )

      expect(screen.getByPlaceholderText('供应商名称')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('供应商类型')).toBeInTheDocument()
    })
  })

  describe('法人主体管理页面', () => {
    it('应该正确渲染页面标题和新建按钮', async () => {
      render(
        <TestWrapper>
          <LegalEntityManagement />
        </TestWrapper>
      )

      expect(screen.getByText('法人主体管理')).toBeInTheDocument()
      expect(screen.getByText('新建主体')).toBeInTheDocument()
    })

    it('应该显示表格列标题', async () => {
      render(
        <TestWrapper>
          <LegalEntityManagement />
        </TestWrapper>
      )

      expect(screen.getByText('主体名称')).toBeInTheDocument()
      expect(screen.getByText('统一社会信用代码')).toBeInTheDocument()
      expect(screen.getByText('法定代表人')).toBeInTheDocument()
    })
  })

  describe('客户管理页面', () => {
    it('应该正确渲染页面标题和新建按钮', async () => {
      render(
        <TestWrapper>
          <CustomerManagement />
        </TestWrapper>
      )

      expect(screen.getByText('客户管理')).toBeInTheDocument()
      expect(screen.getByText('新建客户')).toBeInTheDocument()
    })

    it('应该显示表格列标题', async () => {
      render(
        <TestWrapper>
          <CustomerManagement />
        </TestWrapper>
      )

      // 使用更具体的选择器来避免重复文本问题
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(screen.getByText('联系人')).toBeInTheDocument()
      expect(screen.getAllByText('合作状态')).toHaveLength(3) // 搜索表单中的placeholder、value和表格标题
    })
  })

  describe('商务预算管理页面', () => {
    it('应该正确渲染页面标题和新建按钮', async () => {
      render(
        <TestWrapper>
          <BudgetManagement />
        </TestWrapper>
      )

      expect(screen.getByText('商务预算管理')).toBeInTheDocument()
      expect(screen.getByText('新建预算')).toBeInTheDocument()
    })

    it('应该显示表格列标题', async () => {
      render(
        <TestWrapper>
          <BudgetManagement />
        </TestWrapper>
      )

      // 使用更具体的选择器来避免重复文本问题
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(screen.getByText('预算金额(万元)')).toBeInTheDocument()
      expect(screen.getAllByText('年份')).toHaveLength(3) // 搜索表单中的placeholder、value和表格标题
    })
  })
})