/**
 * 系统首页测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Home from './Home'
import HomeService from '../../api/homeService'
import MessageService from '../../api/messageService'

// Mock API services
vi.mock('../../api/homeService')
vi.mock('../../api/messageService')

describe('Home', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()

    // Mock HomeService
    vi.mocked(HomeService.getTodos).mockResolvedValue({
      count: 0,
      results: [],
    })
    vi.mocked(HomeService.getTodoStatistics).mockResolvedValue({
      total: 0,
      approval_count: 0,
      contract_reminder_count: 0,
      milestone_reminder_count: 0,
      high_priority_count: 0,
    })

    // Mock MessageService
    vi.mocked(MessageService.getMessages).mockResolvedValue({
      count: 0,
      results: [],
    })
    vi.mocked(MessageService.getUnreadCount).mockResolvedValue({
      total: 0,
      by_type: {
        approval: 0,
        reminder: 0,
        system: 0,
        notification: 0,
      },
    })
  })

  it('应该正确渲染首页', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getAllByText(/待办事项/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/消息通知/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/常用功能/).length).toBeGreaterThan(0)
    })
  })

  it('应该显示问候语', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      const greeting = screen.getByText(/好/)
      expect(greeting).toBeInTheDocument()
    })
  })

  it('应该显示待办事项统计', async () => {
    vi.mocked(HomeService.getTodoStatistics).mockResolvedValue({
      total: 10,
      approval_count: 5,
      contract_reminder_count: 3,
      milestone_reminder_count: 2,
      high_priority_count: 4,
    })

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      // 检查统计标签是否存在
      expect(screen.getByText('全部')).toBeInTheDocument()
      expect(screen.getByText('待审批')).toBeInTheDocument()
      expect(screen.getByText('合同提醒')).toBeInTheDocument()
      expect(screen.getByText('里程碑')).toBeInTheDocument()
    })
  })

  it('应该显示空状态当没有待办事项时', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('暂无待办事项')).toBeInTheDocument()
    })
  })

  it('应该显示空状态当没有消息通知时', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('暂无消息通知')).toBeInTheDocument()
    })
  })

  it('应该显示常用功能列表', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('候选点位')).toBeInTheDocument()
      expect(screen.getByText('铺位跟进')).toBeInTheDocument()
      expect(screen.getByText('工程管理')).toBeInTheDocument()
      expect(screen.getByText('门店档案')).toBeInTheDocument()
      expect(screen.getByText('待办审批')).toBeInTheDocument()
      expect(screen.getByText('基础数据')).toBeInTheDocument()
    })
  })
})
