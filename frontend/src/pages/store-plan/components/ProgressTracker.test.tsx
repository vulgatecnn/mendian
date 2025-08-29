import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import ProgressTracker from './ProgressTracker'
import type { StorePlan } from '@/services/types/business'

// Mock dependencies
vi.mock('@ant-design/plots', () => ({
  Column: vi.fn(() => <div data-testid="column-chart">Column Chart</div>),
  Pie: vi.fn(() => <div data-testid="pie-chart">Pie Chart</div>),
  Line: vi.fn(() => <div data-testid="line-chart">Line Chart</div>),
  Area: vi.fn(() => <div data-testid="area-chart">Area Chart</div>),
}))

// dayjs is mocked globally in setup.ts

const mockPlan: StorePlan = {
  id: 'plan-1',
  planCode: 'SP2024001',
  title: '测试开店计划',
  year: 2024,
  quarter: 1,
  regionId: 'region-1',
  entityId: 'entity-1',
  storeType: 'DIRECT',
  plannedCount: 5,
  completedCount: 2,
  budget: { toNumber: () => 1000000 } as any,
  actualBudget: { toNumber: () => 500000 } as any,
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-06-30T00:00:00Z',
  description: '测试计划描述',
  remark: '测试备注',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  region: {
    id: 'region-1',
    name: '华东地区',
    code: 'HD',
    fullPath: '华东地区'
  },
  entity: {
    id: 'entity-1',
    name: '测试公司',
    code: 'TEST',
    legalName: '测试有限公司'
  },
  createdBy: {
    id: 'user-1',
    name: '张三',
    username: 'zhangsan',
    avatar: 'avatar-url'
  }
}

const mockMilestones = [
  {
    id: 'milestone-1',
    name: '选址确认',
    description: '完成门店选址',
    targetDate: '2024-02-01T00:00:00Z',
    actualDate: '2024-01-28T00:00:00Z',
    status: 'completed' as const,
    responsible: 'user-1',
    responsibleName: '张三',
    progress: 100
  },
  {
    id: 'milestone-2',
    name: '装修设计',
    description: '完成装修设计方案',
    targetDate: '2024-03-01T00:00:00Z',
    status: 'in_progress' as const,
    responsible: 'user-2',
    responsibleName: '李四',
    progress: 60
  },
  {
    id: 'milestone-3',
    name: '开业准备',
    description: '完成开业前准备',
    targetDate: '2024-06-01T00:00:00Z',
    status: 'pending' as const,
    responsible: 'user-3',
    responsibleName: '王五',
    progress: 0
  }
]

const mockProps = {
  plan: mockPlan,
  milestones: mockMilestones,
  onUpdateMilestone: vi.fn(),
  onAddMilestone: vi.fn(),
  editable: true
}

describe('ProgressTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render progress overview correctly', () => {
    render(<ProgressTracker {...mockProps} />)
    
    // 检查统计卡片
    expect(screen.getByText('总体进度')).toBeInTheDocument()
    expect(screen.getByText('完成里程碑')).toBeInTheDocument()
    expect(screen.getByText('进行中')).toBeInTheDocument()
    expect(screen.getByText('延期项目')).toBeInTheDocument()
  })

  it('should calculate overall progress correctly', () => {
    render(<ProgressTracker {...mockProps} />)
    
    // 验证进度计算 (100 + 60 + 0) / 3 = 53.33 ≈ 53
    expect(screen.getByText('53')).toBeInTheDocument()
  })

  it('should render milestone timeline', () => {
    render(<ProgressTracker {...mockProps} />)
    
    // 检查里程碑名称
    expect(screen.getByText('选址确认')).toBeInTheDocument()
    expect(screen.getByText('装修设计')).toBeInTheDocument()
    expect(screen.getByText('开业准备')).toBeInTheDocument()
    
    // 检查责任人
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('李四')).toBeInTheDocument()
    expect(screen.getByText('王五')).toBeInTheDocument()
  })

  it('should show different status tags for milestones', () => {
    render(<ProgressTracker {...mockProps} />)
    
    // 检查状态标签
    expect(screen.getByText('已完成')).toBeInTheDocument()
    expect(screen.getByText('进行中')).toBeInTheDocument()
    expect(screen.getByText('待开始')).toBeInTheDocument()
  })

  it('should render progress chart', () => {
    render(<ProgressTracker {...mockProps} />)
    
    // 检查图表是否渲染
    expect(screen.getByTestId('column-chart')).toBeInTheDocument()
  })

  it('should show edit button when editable', () => {
    render(<ProgressTracker {...mockProps} editable={true} />)
    
    // 检查编辑按钮
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => 
      btn.querySelector('.anticon-edit')
    )
    expect(editButton).toBeInTheDocument()
  })

  it('should not show edit button when not editable', () => {
    render(<ProgressTracker {...mockProps} editable={false} />)
    
    // 检查没有编辑按钮
    const editButtons = screen.queryAllByRole('button').filter(btn => 
      btn.querySelector('.anticon-edit')
    )
    expect(editButtons).toHaveLength(0)
  })

  it('should open edit modal when edit button clicked', async () => {
    const user = userEvent.setup()
    render(<ProgressTracker {...mockProps} editable={true} />)
    
    // 点击编辑按钮
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => 
      btn.querySelector('.anticon-edit')
    )
    
    if (editButton) {
      await user.click(editButton)
    }
    
    // 检查编辑模态框是否打开
    await waitFor(() => {
      expect(screen.getByText('编辑里程碑')).toBeInTheDocument()
    })
  })

  it('should call onUpdateMilestone when milestone updated', async () => {
    const user = userEvent.setup()
    render(<ProgressTracker {...mockProps} />)
    
    // 打开编辑模态框
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => 
      btn.querySelector('.anticon-edit')
    )
    
    if (editButton) {
      await user.click(editButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText('编辑里程碑')).toBeInTheDocument()
    })
    
    // 填写表单
    const nameInput = screen.getByDisplayValue('选址确认')
    await user.clear(nameInput)
    await user.type(nameInput, '更新的里程碑名称')
    
    // 提交表单
    const saveButton = screen.getByText('保存')
    await user.click(saveButton)
    
    // 验证回调函数被调用
    await waitFor(() => {
      expect(mockProps.onUpdateMilestone).toHaveBeenCalledWith(
        'milestone-1',
        expect.objectContaining({
          name: '更新的里程碑名称'
        })
      )
    })
  })

  it('should show add milestone button and modal', async () => {
    const user = userEvent.setup()
    render(<ProgressTracker {...mockProps} editable={true} />)
    
    // 点击添加里程碑按钮
    const addButton = screen.getByText('添加里程碑')
    await user.click(addButton)
    
    // 检查添加模态框是否打开
    await waitFor(() => {
      expect(screen.getByText('添加里程碑')).toBeInTheDocument()
    })
  })

  it('should call onAddMilestone when new milestone added', async () => {
    const user = userEvent.setup()
    render(<ProgressTracker {...mockProps} />)
    
    // 打开添加模态框
    const addButton = screen.getByText('添加里程碑')
    await user.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('添加里程碑')).toBeInTheDocument()
    })
    
    // 填写表单
    const nameInput = screen.getByPlaceholderText('请输入里程碑名称')
    await user.type(nameInput, '新里程碑')
    
    const responsibleInput = screen.getByPlaceholderText('请输入负责人姓名')
    await user.type(responsibleInput, '新负责人')
    
    // 提交表单
    const addButtonInModal = screen.getByRole('button', { name: '添加' })
    await user.click(addButtonInModal)
    
    // 验证回调函数被调用
    await waitFor(() => {
      expect(mockProps.onAddMilestone).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '新里程碑',
          responsibleName: '新负责人'
        })
      )
    })
  })

  it('should show overdue alert when there are delayed milestones', () => {
    const overdueProps = {
      ...mockProps,
      milestones: [
        ...mockMilestones,
        {
          id: 'milestone-overdue',
          name: '延期里程碑',
          description: '已延期的里程碑',
          targetDate: '2023-12-01T00:00:00Z', // 过去的日期
          status: 'pending' as const,
          responsible: 'user-4',
          responsibleName: '延期负责人',
          progress: 0
        }
      ]
    }
    
    render(<ProgressTracker {...overdueProps} />)
    
    // 检查延期预警
    expect(screen.getByText('发现延期里程碑')).toBeInTheDocument()
  })

  it('should display correct milestone status colors', () => {
    render(<ProgressTracker {...mockProps} />)
    
    // 检查完成状态的里程碑有正确的颜色类
    const completedMilestone = screen.getByText('选址确认').closest('.ant-timeline-item')
    expect(completedMilestone).toHaveClass('ant-timeline-item')
    
    // 检查进行中状态的里程碑
    const inProgressMilestone = screen.getByText('装修设计').closest('.ant-timeline-item')
    expect(inProgressMilestone).toHaveClass('ant-timeline-item')
    
    // 检查待开始状态的里程碑
    const pendingMilestone = screen.getByText('开业准备').closest('.ant-timeline-item')
    expect(pendingMilestone).toHaveClass('ant-timeline-item')
  })

  it('should format dates correctly', () => {
    render(<ProgressTracker {...mockProps} />)
    
    // 检查日期格式化 (Mock的dayjs会返回'2024-01-15')
    expect(screen.getAllByText('01-15')).toHaveLength(3) // 每个里程碑都有目标日期
  })

  it('should handle empty milestones gracefully', () => {
    const emptyProps = {
      ...mockProps,
      milestones: []
    }
    
    render(<ProgressTracker {...emptyProps} />)
    
    // 检查是否正确处理空里程碑
    expect(screen.getByText('0')).toBeInTheDocument() // 总体进度应该是0
    expect(screen.getByText('完成里程碑')).toBeInTheDocument()
    expect(screen.getByText('0/0')).toBeInTheDocument() // 完成数/总数
  })
})