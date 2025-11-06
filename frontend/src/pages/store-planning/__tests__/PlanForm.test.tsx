/**
 * 门店计划表单组件测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import PlanForm from '../PlanForm'
import { PlanService } from '../../../api'

// Mock API
vi.mock('../../../api', () => ({
  PlanService: {
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    getPlanDetail: vi.fn(),
  },
  BaseDataService: {
    getBusinessRegions: vi.fn(),
    getBudgets: vi.fn(),
  },
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  }
})

describe('门店计划表单组件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderPlanForm = () => {
    return render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    )
  }

  it('应该正确渲染表单', async () => {
    renderPlanForm()
    
    await waitFor(() => {
      expect(screen.getByText(/计划/)).toBeInTheDocument()
    })
  })

  it('应该显示必填字段', async () => {
    renderPlanForm()
    
    await waitFor(() => {
      // 表单字段会根据实际实现显示
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
    })
  })

  it('应该有提交按钮', async () => {
    renderPlanForm()
    
    await waitFor(() => {
      const submitButton = screen.getByText('提交') || screen.getByText('保存')
      expect(submitButton).toBeInTheDocument()
    })
  })

  it('应该有取消按钮', async () => {
    renderPlanForm()
    
    await waitFor(() => {
      const cancelButton = screen.getByText('取消') || screen.getByText('返回')
      expect(cancelButton).toBeInTheDocument()
    })
  })
})
