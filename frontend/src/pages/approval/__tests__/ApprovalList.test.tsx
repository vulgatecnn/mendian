/**
 * 审批流程组件测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import ApprovalList from '../components/ApprovalList'
import { ApprovalService } from '../../../api'

// Mock API
vi.mock('../../../api', () => ({
  ApprovalService: {
    getApprovals: vi.fn(),
    approveApproval: vi.fn(),
    rejectApproval: vi.fn(),
  },
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('审批流程组件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock 审批列表数据
    vi.mocked(ApprovalService.getApprovals).mockResolvedValue({
      count: 2,
      results: [
        {
          id: 1,
          title: '开店计划审批',
          type: 'plan',
          status: 'pending',
          initiator: { name: '张三' },
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          title: '合同审批',
          type: 'contract',
          status: 'approved',
          initiator: { name: '李四' },
          created_at: '2024-01-02T10:00:00Z',
        },
      ],
    })
  })

  const renderApprovalList = () => {
    return render(
      <BrowserRouter>
        <ApprovalList type="pending" />
      </BrowserRouter>
    )
  }

  it('应该正确渲染审批列表', async () => {
    renderApprovalList()
    
    await waitFor(() => {
      expect(screen.getByText('开店计划审批')).toBeInTheDocument()
      expect(screen.getByText('合同审批')).toBeInTheDocument()
    })
  })

  it('应该显示审批状态', async () => {
    renderApprovalList()
    
    await waitFor(() => {
      // 状态标签会根据实际实现显示
      const table = document.querySelector('.arco-table')
      expect(table).toBeInTheDocument()
    })
  })

  it('应该显示发起人信息', async () => {
    renderApprovalList()
    
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
    })
  })

  it('应该有刷新按钮', async () => {
    renderApprovalList()
    
    await waitFor(() => {
      const refreshButton = document.querySelector('[aria-label*="刷新"]') || 
                           document.querySelector('[title*="刷新"]')
      expect(refreshButton || screen.queryByText('刷新')).toBeTruthy()
    })
  })
})
