/**
 * PlanCancelModal 组件单元测试
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlanCancelModal from '../PlanCancelModal'

describe('PlanCancelModal', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()
  const planName = '2024年华东区开店计划'

  it('应该正确渲染弹窗标题和内容', () => {
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('取消计划')).toBeInTheDocument()
    expect(screen.getByText(planName, { exact: false })).toBeInTheDocument()
    expect(screen.getByText('取消后计划将无法恢复执行，请谨慎操作')).toBeInTheDocument()
  })

  it('应该显示取消原因输入框', () => {
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('取消原因')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请详细说明取消计划的原因')).toBeInTheDocument()
  })

  it('未填写取消原因时点击确认应该显示验证错误', async () => {
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const confirmButton = screen.getByText('确认取消')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('请输入取消原因')).toBeInTheDocument()
    })

    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  it('取消原因少于5个字符时应该显示验证错误', async () => {
    const user = userEvent.setup()
    
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByPlaceholderText('请详细说明取消计划的原因')
    await user.type(textarea, '短')

    const confirmButton = screen.getByText('确认取消')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('取消原因至少需要5个字符')).toBeInTheDocument()
    })

    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  it('填写有效的取消原因后点击确认应该调用 onConfirm', async () => {
    const user = userEvent.setup()
    const cancelReason = '由于市场环境变化，暂停本季度开店计划'
    
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByPlaceholderText('请详细说明取消计划的原因')
    await user.type(textarea, cancelReason)

    const confirmButton = screen.getByText('确认取消')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(cancelReason)
    })
  })

  it('点击返回按钮应该调用 onCancel 回调', async () => {
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('返回')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  it('应该显示取消后的说明信息', () => {
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('计划状态将变更为"已取消"')).toBeInTheDocument()
    expect(screen.getByText('计划将停止执行，不再跟踪进度')).toBeInTheDocument()
    expect(screen.getByText('取消原因将被记录到计划中')).toBeInTheDocument()
  })

  it('loading 状态下确认按钮应该显示加载状态', () => {
    render(
      <PlanCancelModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={true}
      />
    )

    const confirmButton = screen.getByText('确认取消')
    expect(confirmButton.closest('button')).toHaveClass('arco-btn-loading')
  })
})
