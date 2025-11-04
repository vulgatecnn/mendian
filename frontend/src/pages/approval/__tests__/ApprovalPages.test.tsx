/**
 * 审批中心页面测试
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock API 服务
vi.mock('../../../api/approvalService', () => ({
  default: {
    getPendingInstances: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getProcessedInstances: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getCCInstances: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getFollowedInstances: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getInitiatedInstances: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getAllInstances: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getTemplates: vi.fn().mockResolvedValue({ results: [], count: 0 }),
  }
}))

// Mock 权限组件
vi.mock('../../../components/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock 权限 Hook
vi.mock('../../../hooks/usePermission', () => ({
  usePermission: () => ({
    hasPermission: vi.fn().mockReturnValue(true),
    hasModuleAccess: vi.fn().mockReturnValue(true)
  })
}))

import ApprovalPending from '../ApprovalPending'
import ApprovalProcessed from '../ApprovalProcessed'
import ApprovalCC from '../ApprovalCC'
import ApprovalFollowed from '../ApprovalFollowed'
import ApprovalInitiated from '../ApprovalInitiated'
import ApprovalAll from '../ApprovalAll'
import ApprovalTemplateList from '../ApprovalTemplateList'

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('审批中心页面', () => {
  test('待办审批页面应该正常渲染', () => {
    renderWithRouter(<ApprovalPending />)
    expect(screen.getByText('待办审批')).toBeInTheDocument()
  })

  test('已办审批页面应该正常渲染', () => {
    renderWithRouter(<ApprovalProcessed />)
    expect(screen.getByText('已办审批')).toBeInTheDocument()
  })

  test('抄送我的页面应该正常渲染', () => {
    renderWithRouter(<ApprovalCC />)
    expect(screen.getByText('抄送审批')).toBeInTheDocument()
  })

  test('我关注的页面应该正常渲染', () => {
    renderWithRouter(<ApprovalFollowed />)
    expect(screen.getByText('关注审批')).toBeInTheDocument()
  })

  test('我发起的页面应该正常渲染', () => {
    renderWithRouter(<ApprovalInitiated />)
    expect(screen.getByText('我发起的审批')).toBeInTheDocument()
  })

  test('全部审批页面应该正常渲染', () => {
    renderWithRouter(<ApprovalAll />)
    expect(screen.getByText('全部审批')).toBeInTheDocument()
  })

  test('审批模板管理页面应该正常渲染', () => {
    renderWithRouter(<ApprovalTemplateList />)
    expect(screen.getByText('审批模板管理')).toBeInTheDocument()
  })
})