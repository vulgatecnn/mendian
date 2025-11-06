/**
 * PlanList 组件渲染测试
 * 验证开店计划列表组件能够成功挂载而不抛出图标导入错误
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import PlanList from '../PlanList'

// Mock API services
vi.mock('../../../api', () => ({
  PlanService: {
    getPlans: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 }
    }),
    deletePlan: vi.fn().mockResolvedValue({ data: {} })
  }
}))

// Mock components
vi.mock('../../../components/PermissionGuard', () => ({
  PermissionGuard: ({ children }: any) => <div>{children}</div>
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('PlanList 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该能够渲染而不抛出图标导入错误', () => {
    const { container } = render(
      <BrowserRouter>
        <PlanList />
      </BrowserRouter>
    )
    
    // 验证组件成功挂载
    expect(screen.getByText(/开店计划/)).toBeInTheDocument()
    
    // 验证图标成功渲染（检查SVG元素）
    const icons = container.querySelectorAll('.arco-icon')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('应该显示包含图标的操作按钮', () => {
    const { container } = render(
      <BrowserRouter>
        <PlanList />
      </BrowserRouter>
    )
    
    // 验证关键按钮存在
    expect(screen.getByText('新建计划')).toBeInTheDocument()
    expect(screen.getByText('刷新')).toBeInTheDocument()
    
    // 验证按钮中的图标
    const plusIcon = container.querySelector('.arco-icon-plus')
    const refreshIcon = container.querySelector('.arco-icon-refresh')
    expect(plusIcon).toBeInTheDocument()
    expect(refreshIcon).toBeInTheDocument()
  })
})
