/**
 * ReportGenerator 组件渲染测试
 * 验证组件能够成功挂载而不抛出图标导入错误
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ReportGenerator from '../ReportGenerator'
import type { FilterOptions } from '../../../api/reportService'

// Mock reportService
vi.mock('../../../api/reportService', () => ({
  useReportService: () => ({
    loading: false,
    error: null,
    tasks: [],
    generateReport: vi.fn(),
    getReportStatus: vi.fn(),
    getReportPreview: vi.fn(),
    downloadReport: vi.fn(),
    shareReport: vi.fn(),
    getUserReportTasks: vi.fn(),
    deleteReportTask: vi.fn()
  })
}))

// Mock 子组件
vi.mock('../ReportFilters', () => ({
  default: ({ filters, onFiltersChange }: any) => (
    <div data-testid="report-filters">Report Filters</div>
  )
}))

vi.mock('../ReportPreview', () => ({
  default: ({ config, onClose }: any) => (
    <div data-testid="report-preview">Report Preview</div>
  )
}))

vi.mock('../ReportShare', () => ({
  default: ({ task, onClose }: any) => (
    <div data-testid="report-share">Report Share</div>
  )
}))

const mockFilterOptions: FilterOptions = {
  regions: [
    { value: 1, label: '华北区' },
    { value: 2, label: '华东区' }
  ],
  storeTypes: [
    { value: 'direct', label: '直营店' },
    { value: 'franchise', label: '加盟店' }
  ],
  statuses: [
    { value: 'planned', label: '计划中' },
    { value: 'opened', label: '已开业' }
  ]
}

describe('ReportGenerator 组件', () => {
  it('应该能够渲染而不抛出图标导入错误', () => {
    render(<ReportGenerator filterOptions={mockFilterOptions} />)
    
    // 验证组件成功挂载
    expect(screen.getByText('报表配置')).toBeInTheDocument()
  })

  it('应该显示所有操作按钮的图标', () => {
    render(<ReportGenerator filterOptions={mockFilterOptions} />)
    
    // 验证关键按钮存在
    expect(screen.getByText('生成报表')).toBeInTheDocument()
    expect(screen.getByText('预览报表')).toBeInTheDocument()
    expect(screen.getByText('查看任务')).toBeInTheDocument()
  })

  it('应该渲染报表类型选择器', () => {
    render(<ReportGenerator filterOptions={mockFilterOptions} />)
    
    // 验证报表类型字段存在
    expect(screen.getByText('报表类型')).toBeInTheDocument()
  })

  it('应该渲染导出格式选项', () => {
    render(<ReportGenerator filterOptions={mockFilterOptions} />)
    
    // 验证导出格式选项存在
    expect(screen.getByText('导出格式')).toBeInTheDocument()
    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument()
    expect(screen.getByText('PDF (.pdf)')).toBeInTheDocument()
  })

  it('应该渲染报表选项复选框', () => {
    render(<ReportGenerator filterOptions={mockFilterOptions} />)
    
    // 验证报表选项存在
    expect(screen.getByText('包含图表')).toBeInTheDocument()
    expect(screen.getByText('包含汇总统计')).toBeInTheDocument()
  })

  it('应该渲染数据筛选组件', () => {
    render(<ReportGenerator filterOptions={mockFilterOptions} />)
    
    // 验证筛选组件已渲染
    expect(screen.getByTestId('report-filters')).toBeInTheDocument()
  })
})
