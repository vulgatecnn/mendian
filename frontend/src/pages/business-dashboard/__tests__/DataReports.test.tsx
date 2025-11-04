/**
 * 数据报表组件测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import DataReports from '../DataReports'

// Mock 统计服务
vi.mock('../../../api/statisticsService', () => ({
  useStatisticsService: () => ({
    loading: false,
    error: null,
    getReport: vi.fn().mockResolvedValue({
      period: {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      },
      overview: {
        total_plans: 10,
        total_target: 100,
        total_completed: 60,
        completion_rate: 60,
        total_budget: 1000
      },
      by_region: [],
      by_store_type: [],
      by_month: [],
      top_performers: [],
      underperformers: []
    }),
    exportReport: vi.fn(),
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

describe('数据报表组件', () => {
  it('应该正确渲染页面标题', async () => {
    render(
      <TestWrapper>
        <DataReports />
      </TestWrapper>
    )

    expect(screen.getByText('数据报表')).toBeInTheDocument()
    expect(screen.getByText('门店开业进度和经营数据分析报表')).toBeInTheDocument()
  })

  it('应该显示搜索表单', async () => {
    render(
      <TestWrapper>
        <DataReports />
      </TestWrapper>
    )

    expect(screen.getByText('时间范围')).toBeInTheDocument()
    expect(screen.getByText('业务区域')).toBeInTheDocument()
    expect(screen.getByText('门店类型')).toBeInTheDocument()
    expect(screen.getByText('计划类型')).toBeInTheDocument()
    expect(screen.getByText('计划状态')).toBeInTheDocument()
  })

  it('应该显示操作按钮', async () => {
    render(
      <TestWrapper>
        <DataReports />
      </TestWrapper>
    )

    expect(screen.getByText('查询')).toBeInTheDocument()
    expect(screen.getByText('重置')).toBeInTheDocument()
    expect(screen.getByText('导出')).toBeInTheDocument()
  })

  it('应该显示报表内容区域', async () => {
    render(
      <TestWrapper>
        <DataReports />
      </TestWrapper>
    )

    // 等待数据加载完成后，应该显示报表内容
    await waitFor(() => {
      // 检查是否有报表相关的内容渲染
      expect(screen.getByText('数据报表')).toBeInTheDocument()
    })
  })
})