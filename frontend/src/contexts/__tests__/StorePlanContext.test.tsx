/**
 * 门店计划状态管理测试
 */
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StorePlanProvider, useStorePlan } from '../StorePlanContext'

// 测试组件
const TestComponent = () => {
  const context = useStorePlan()
  
  if (!context) {
    return <div>Context not available</div>
  }

  const { selectedPlan, setSelectedPlan, clearSelectedPlan } = context
  
  return (
    <div>
      <div data-testid="plan-id">{selectedPlan?.id || 'none'}</div>
      <div data-testid="plan-name">{selectedPlan?.name || 'none'}</div>
      <button onClick={() => setSelectedPlan({ id: 1, name: '测试计划' })}>
        设置计划
      </button>
      <button onClick={clearSelectedPlan}>清除计划</button>
    </div>
  )
}

describe('StorePlanContext 状态管理测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确初始化状态', () => {
    render(
      <StorePlanProvider>
        <TestComponent />
      </StorePlanProvider>
    )

    expect(screen.getByTestId('plan-id')).toHaveTextContent('none')
    expect(screen.getByTestId('plan-name')).toHaveTextContent('none')
  })

  it('应该正确设置选中的计划', async () => {
    render(
      <StorePlanProvider>
        <TestComponent />
      </StorePlanProvider>
    )

    const setButton = screen.getByText('设置计划')
    await act(async () => {
      setButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('plan-id')).toHaveTextContent('1')
      expect(screen.getByTestId('plan-name')).toHaveTextContent('测试计划')
    })
  })

  it('应该正确清除选中的计划', async () => {
    render(
      <StorePlanProvider>
        <TestComponent />
      </StorePlanProvider>
    )

    // 先设置计划
    const setButton = screen.getByText('设置计划')
    await act(async () => {
      setButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('plan-id')).toHaveTextContent('1')
    })

    // 再清除计划
    const clearButton = screen.getByText('清除计划')
    await act(async () => {
      clearButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('plan-id')).toHaveTextContent('none')
      expect(screen.getByTestId('plan-name')).toHaveTextContent('none')
    })
  })
})
