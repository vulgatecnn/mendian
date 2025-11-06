/**
 * 数据统计卡片组件测试
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, Statistic } from '@arco-design/web-react'

describe('数据统计卡片组件', () => {
  it('应该正确渲染统计卡片', () => {
    render(
      <Card>
        <Statistic title="总门店数" value={100} />
      </Card>
    )
    
    expect(screen.getByText('总门店数')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('应该支持不同的数值格式', () => {
    render(
      <Card>
        <Statistic title="增长率" value={12.5} suffix="%" precision={1} />
      </Card>
    )
    
    expect(screen.getByText('增长率')).toBeInTheDocument()
    expect(screen.getByText(/12\.5/)).toBeInTheDocument()
  })

  it('应该支持前缀和后缀', () => {
    render(
      <Card>
        <Statistic title="总收入" value={1000000} prefix="¥" />
      </Card>
    )
    
    expect(screen.getByText('总收入')).toBeInTheDocument()
    expect(screen.getByText(/1000000/)).toBeInTheDocument()
  })

  it('应该支持加载状态', () => {
    const { container } = render(
      <Card loading>
        <Statistic title="加载中" value={0} />
      </Card>
    )
    
    expect(container.querySelector('.arco-card-loading')).toBeInTheDocument()
  })
})
