/**
 * 经营大屏组件测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import BusinessDashboard from '../BusinessDashboard'

// Mock 统计服务
vi.mock('../../../api/statisticsService', () => ({
  useStatisticsService: () => ({
    loading: false,
    error: null,
    getDashboard: vi.fn().mockResolvedValue({
      summary: {
        total_plans: 10,
        active_plans: 5,
        completed_plans: 3,
        total_target: 100,
        total_completed: 60,
        overall_completion_rate: 60
      },
      recent_plans: [],
      region_performance: [],
      alerts: []
    }),
    refresh: vi.fn(),
    clearCache: vi.fn()
  })
}))

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

describe('经营大屏组件', () => {
  it('应该正确渲染页面标题', async () => {
    render(
      <TestWrapper>
        <BusinessDashboard />
      </TestWrapper>
    )

    expect(screen.getByText('经营大屏')).toBeInTheDocument()
    expect(screen.getByText('实时监控门店开业进度和经营数据')).toBeInTheDocument()
  })

  it('应该显示工具栏按钮', async () => {
    render(
      <TestWrapper>
        <BusinessDashboard />
      </TestWrapper>
    )

    expect(screen.getByText('刷新')).toBeInTheDocument()
    expect(screen.getByText('导出')).toBeInTheDocument()
    expect(screen.getByText('全屏')).toBeInTheDocument()
  })

  it('应该显示概览统计卡片', async () => {
    render(
      <TestWrapper>
        <BusinessDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('总计划数')).toBeInTheDocument()
      expect(screen.getByText('执行中计划')).toBeInTheDocument()
      expect(screen.getByText('目标门店数')).toBeInTheDocument()
      expect(screen.getByText('完成进度')).toBeInTheDocument()
    })
  })
})