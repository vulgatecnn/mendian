/**
 * 资产管理页面测试
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AssetManagement from '../AssetManagement'

// Mock API 服务
vi.mock('../../../api/operationService', () => ({
  default: {
    getAssetRecords: vi.fn().mockResolvedValue({
      data: {
        results: [],
        count: 0
      }
    }),
    getAssetStatistics: vi.fn().mockResolvedValue({
      data: {
        total_count: 0,
        total_value: 0,
        normal_count: 0,
        maintenance_count: 0,
        repair_count: 0
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

describe('AssetManagement', () => {
  it('应该正确渲染资产管理页面', async () => {
    renderWithRouter(<AssetManagement />)
    
    // 检查页面标题
    expect(screen.getByText('资产管理')).toBeInTheDocument()
    
    // 检查统计卡片
    expect(screen.getByText('资产总数')).toBeInTheDocument()
    expect(screen.getByText('资产总值')).toBeInTheDocument()
    expect(screen.getByText('正常资产')).toBeInTheDocument()
    expect(screen.getByText('维护中')).toBeInTheDocument()
    expect(screen.getByText('维修中')).toBeInTheDocument()
    
    // 检查搜索表单
    expect(screen.getByPlaceholderText('请输入资产名称')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入资产编号')).toBeInTheDocument()
    
    // 检查操作按钮
    expect(screen.getByText('新建资产')).toBeInTheDocument()
    expect(screen.getByText('导出数据')).toBeInTheDocument()
    expect(screen.getByText('刷新')).toBeInTheDocument()
  })
  
  it('应该显示搜索和重置按钮', () => {
    renderWithRouter(<AssetManagement />)
    
    expect(screen.getByText('搜索')).toBeInTheDocument()
    expect(screen.getByText('重置')).toBeInTheDocument()
  })
})