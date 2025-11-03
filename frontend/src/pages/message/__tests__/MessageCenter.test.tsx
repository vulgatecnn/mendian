/**
 * 消息中心测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import MessageCenter from '../MessageCenter'
import messageService from '../../../api/messageService'

// Mock messageService
vi.mock('../../../api/messageService', () => ({
  default: {
    getMessages: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markMultipleAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteMessage: vi.fn(),
    deleteMultipleMessages: vi.fn()
  }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('MessageCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置默认的 mock 返回值
    vi.mocked(messageService.getMessages).mockResolvedValue({
      count: 2,
      results: [
        {
          id: 1,
          type: 'approval',
          title: '审批通知',
          content: '您有一条新的审批待处理',
          is_read: false,
          created_at: '2024-01-01 10:00:00'
        },
        {
          id: 2,
          type: 'system',
          title: '系统通知',
          content: '系统将于今晚进行维护',
          is_read: true,
          created_at: '2024-01-01 09:00:00'
        }
      ]
    })
    
    vi.mocked(messageService.getUnreadCount).mockResolvedValue({
      total: 1,
      by_type: {
        approval: 1,
        reminder: 0,
        system: 0,
        notification: 0
      }
    })
  })

  it('应该正确渲染消息列表', async () => {
    render(
      <BrowserRouter>
        <MessageCenter />
      </BrowserRouter>
    )

    // 等待消息加载
    await waitFor(() => {
      expect(screen.getAllByText('审批通知').length).toBeGreaterThan(0)
      expect(screen.getAllByText('系统通知').length).toBeGreaterThan(0)
    })
  })

  it('应该显示未读消息数量', async () => {
    render(
      <BrowserRouter>
        <MessageCenter />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('未读消息')).toBeInTheDocument()
    })
  })

  it('应该能够标记单个消息为已读', async () => {
    const user = userEvent.setup()
    vi.mocked(messageService.markAsRead).mockResolvedValue({
      id: 1,
      type: 'approval',
      title: '审批通知',
      content: '您有一条新的审批待处理',
      is_read: true,
      created_at: '2024-01-01 10:00:00'
    })

    render(
      <BrowserRouter>
        <MessageCenter />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('审批通知').length).toBeGreaterThan(0)
    })

    // 查找并点击"标记已读"按钮
    const markReadButtons = screen.getAllByText('标记已读')
    await user.click(markReadButtons[0])

    await waitFor(() => {
      expect(messageService.markAsRead).toHaveBeenCalledWith(1)
    })
  })

  it('应该能够搜索消息', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <MessageCenter />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('审批通知').length).toBeGreaterThan(0)
    })

    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索标题或内容')
    await user.type(searchInput, '审批')

    // 点击搜索按钮
    const searchButton = screen.getByRole('button', { name: /搜索/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(messageService.getMessages).toHaveBeenCalled()
    })
  })

  it('应该能够刷新消息列表', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <MessageCenter />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('审批通知').length).toBeGreaterThan(0)
    })

    // 点击刷新按钮
    const refreshButton = screen.getByRole('button', { name: /刷新/i })
    await user.click(refreshButton)

    await waitFor(() => {
      expect(messageService.getMessages).toHaveBeenCalledTimes(2)
      expect(messageService.getUnreadCount).toHaveBeenCalledTimes(2)
    })
  })
})
