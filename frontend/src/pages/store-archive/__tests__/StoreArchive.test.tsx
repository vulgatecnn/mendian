/**
 * 门店档案页面测试
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import StoreList from '../StoreList'
import StoreForm from '../StoreForm'
import StoreDetail from '../StoreDetail'

// Mock API 服务
vi.mock('../../../api/archiveService', () => ({
  getStoreProfiles: vi.fn().mockResolvedValue({
    data: {
      results: [],
      count: 0
    }
  }),
  getStoreProfile: vi.fn().mockResolvedValue({
    data: {
      id: 1,
      store_code: 'TEST001',
      store_name: '测试门店',
      status: 'operating'
    }
  }),
  getStoreFullInfo: vi.fn().mockResolvedValue({
    data: {
      basic_info: {
        id: 1,
        store_code: 'TEST001',
        store_name: '测试门店',
        status: 'operating'
      }
    }
  })
}))

vi.mock('../../../api/baseDataService', () => ({
  default: {
    getBusinessRegions: vi.fn().mockResolvedValue({
      results: []
    })
  }
}))

vi.mock('../../../api/userService', () => ({
  UserService: {
    getUsers: vi.fn().mockResolvedValue({
      results: []
    })
  }
}))

vi.mock('../../../api/expansionService', () => ({
  ExpansionService: {
    getFollowUps: vi.fn().mockResolvedValue({
      results: []
    })
  }
}))

vi.mock('../../../api/preparationService', () => ({
  PreparationService: {
    getConstructionOrders: vi.fn().mockResolvedValue({
      results: []
    })
  }
}))

// Mock React Router
const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('门店档案页面', () => {
  it('门店列表页面应该正确渲染', async () => {
    render(
      <MockRouter>
        <StoreList />
      </MockRouter>
    )

    expect(screen.getByText('门店档案')).toBeInTheDocument()
    expect(screen.getByText('档案列表')).toBeInTheDocument()
    expect(screen.getByText('新建门店档案')).toBeInTheDocument()
  })

  it('门店表单页面应该正确渲染', async () => {
    render(
      <MockRouter>
        <StoreForm />
      </MockRouter>
    )

    expect(screen.getByText('新建门店档案')).toBeInTheDocument()
    expect(screen.getByText('基本信息')).toBeInTheDocument()
    expect(screen.getByText('地址信息')).toBeInTheDocument()
    expect(screen.getByText('负责人信息')).toBeInTheDocument()
  })
})