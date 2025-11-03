/**
 * PlanPublishModal 组件单元测试
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PlanPublishModal from '../PlanPublishModal'

describe('PlanPublishModal', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()
  const planName = '2024年华东区开店计划'

  it('应该正确渲染弹窗标题和内容', () => {
    render(
      <PlanPublishModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('发布计划')).toBeInTheDocument()
    expect(screen.getByText(planName, { exact: false })).toBeInTheDocument()
    expect(screen.getByText('发布后计划将进入执行状态，无法再修改计划内容')).toBeInTheDocument()
  })

  it('应该显示发布后的说明信息', () => {
    render(
      <PlanPublishModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('计划状态将变更为"已发布"')).toBeInTheDocument()
    expect(screen.getByText('计划将开始执行，系统将跟踪执行进度')).toBeInTheDocument()
    expect(screen.getByText('无法再修改计划的基本信息和区域计划')).toBeInTheDocument()
  })

  it('点击确认按钮应该调用 onConfirm 回调', async () => {
    render(
      <PlanPublishModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const confirmButton = screen.getByText('确认发布')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })
  })

  it('点击取消按钮应该调用 onCancel 回调', async () => {
    render(
      <PlanPublishModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  it('loading 状态下确认按钮应该显示加载状态', () => {
    render(
      <PlanPublishModal
        visible={true}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={true}
      />
    )

    const confirmButton = screen.getByText('确认发布')
    expect(confirmButton.closest('button')).toHaveClass('arco-btn-loading')
  })

  it('visible 为 false 时不应该显示弹窗', () => {
    const { container } = render(
      <PlanPublishModal
        visible={false}
        planName={planName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(container.querySelector('.arco-modal-wrapper')).not.toBeInTheDocument()
  })
})
