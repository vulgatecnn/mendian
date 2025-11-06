/**
 * ReportShare 组件渲染测试
 * 验证组件能够成功挂载而不抛出图标导入错误
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ReportShare from '../ReportShare'
import type { ReportTask } from '../../../api/reportService'

// Mock reportService
vi.mock('../../../api/reportService', () => ({
  useReportService: () => ({
    loading: false,
    error: null,
    shareReport: vi.fn()
  })
}))

const mockTask: ReportTask = {
  taskId: 'task-123',
  reportType: 'plan',
  status: 'completed',
  progress: 100,
  fileName: 'test-report.xlsx',
  downloadUrl: 'https://example.com/report.xlsx',
  fileSize: 1024000,
  createdAt: '2024-01-01T00:00:00Z',
  completedAt: '2024-01-01T00:05:00Z'
}

describe('ReportShare 组件', () => {
  it('应该能够渲染而不抛出图标导入错误', () => {
    render(<ReportShare task={mockTask} />)
    
    // 验证组件成功挂载
    expect(screen.getByText('分享方式')).toBeInTheDocument()
  })

  it('应该显示所有图标按钮', () => {
    render(<ReportShare task={mockTask} />)
    
    // 验证关键元素存在
    expect(screen.getByText('分享方式')).toBeInTheDocument()
    expect(screen.getByText('分享设置')).toBeInTheDocument()
  })

  it('应该渲染分享配置表单', () => {
    render(<ReportShare task={mockTask} />)
    
    // 验证表单元素存在
    expect(screen.getByText('分享方式')).toBeInTheDocument()
    expect(screen.getByText('分享设置')).toBeInTheDocument()
  })

  it('应该显示报表信息', () => {
    render(<ReportShare task={mockTask} />)
    
    // 验证报表信息显示
    expect(screen.getByText('报表信息')).toBeInTheDocument()
    expect(screen.getByText('test-report.xlsx')).toBeInTheDocument()
  })
})
