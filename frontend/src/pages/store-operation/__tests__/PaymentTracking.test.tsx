/**
 * 付款追踪页面测试
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PaymentTracking from '../PaymentTracking'

// Mock API 服务
vi.mock('../../../api/operationService', () => ({
  default: {
    getPaymentRecords: vi.fn().mockResolvedValue({
      data: {
        results: [],
        count: 0
      }
    }),
    getPaymentStatistics: vi.fn().mockResolvedValue({
      data: {
        total_amount: 0,
        pending_amount: 0,
        paid_amount: 0,
        overdue_count: 0
      }
    })
  }
}))

// Mock 认证上下文
vi.mock('../../../contexts', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, username: 'test' }
  })
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('PaymentTracking', () => {
  it('应该正确渲染付款追踪页面', async () => {
    renderWithRouter(<PaymentTracking />)
    
    // 检查页面标题
    expect(screen.getByText('付款追踪')).toBeInTheDocument()
    
    // 检查统计卡片
    expect(screen.getByText('总付款金额')).toBeInTheDocument()
    expect(screen.getByText('待付款金额')).toBeInTheDocument()
    expect(screen.getByText('已付款金额')).toBeInTheDocument()
    expect(screen.getByText('逾期笔数')).toBeInTheDocument()
    
    // 检查搜索表单
    expect(screen.getByPlaceholderText('请输入门店名称')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入门店编码')).toBeInTheDocument()
    
    // 检查操作按钮
    expect(screen.getByText('新建付款记录')).toBeInTheDocument()
    expect(screen.getByText('导出数据')).toBeInTheDocument()
    expect(screen.getByText('刷新')).toBeInTheDocument()
  })
  
  it('应该显示搜索和重置按钮', () => {
    renderWithRouter(<PaymentTracking />)
    
    expect(screen.getByText('搜索')).toBeInTheDocument()
    expect(screen.getByText('重置')).toBeInTheDocument()
  })
})