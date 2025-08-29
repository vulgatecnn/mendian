import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StorePlanDashboard from './Dashboard'

// Mock dependencies
vi.mock('@ant-design/plots', () => ({
  Column: vi.fn(({ data, config }) => (
    <div data-testid="column-chart" data-config={JSON.stringify(config)}>
      Column Chart with {data?.length || 0} items
    </div>
  )),
  Pie: vi.fn(({ data }) => (
    <div data-testid="pie-chart">
      Pie Chart with {data?.length || 0} items
    </div>
  )),
  Line: vi.fn(({ data }) => (
    <div data-testid="line-chart">
      Line Chart with {data?.length || 0} items
    </div>
  )),
  Area: vi.fn(({ data }) => (
    <div data-testid="area-chart">
      Area Chart with {data?.length || 0} items
    </div>
  )),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/services/query/hooks/useStorePlan', () => ({
  useStorePlan: {
    useStatistics: vi.fn(() => ({
      data: {
        totalPlans: 50,
        totalPlannedStores: 120,
        totalCompletedStores: 80,
        totalBudget: 10000000,
        actualBudget: 6000000,
        completionRate: 66.7,
        budgetUtilization: 60,
        statusDistribution: {
          DRAFT: 5,
          SUBMITTED: 8,
          PENDING: 6,
          APPROVED: 10,
          REJECTED: 3,
          IN_PROGRESS: 12,
          COMPLETED: 6,
          CANCELLED: 0
        },
        regionDistribution: [
          {
            regionId: 'region-1',
            regionName: '华东地区',
            count: 15,
            plannedStores: 40,
            completedStores: 25,
            budget: 3000000
          },
          {
            regionId: 'region-2',
            regionName: '华南地区',
            count: 12,
            plannedStores: 35,
            completedStores: 20,
            budget: 2500000
          }
        ],
        monthlyTrend: [
          { month: '2024-01', plannedCount: 8, completedCount: 5, budget: 800000 },
          { month: '2024-02', plannedCount: 10, completedCount: 8, budget: 1000000 },
          { month: '2024-03', plannedCount: 12, completedCount: 10, budget: 1200000 }
        ]
      },
      isLoading: false
    })),
    useProgress: vi.fn(() => ({
      data: {
        overallProgress: {
          total: 50,
          completed: 6,
          inProgress: 12,
          pending: 19,
          percentage: 12
        },
        regionProgress: [
          {
            regionId: 'region-1',
            regionName: '华东地区',
            planned: 40,
            completed: 25,
            percentage: 62.5,
            onTrack: true
          }
        ],
        delayedPlans: [
          {
            id: 'plan-1',
            title: '延期计划',
            plannedEndDate: '2024-01-15T00:00:00Z',
            currentDelay: 5,
            reason: '资源不足'
          }
        ]
      },
      isLoading: false
    })),
    useSummary: vi.fn(() => ({
      data: {
        currentYear: {
          planned: 120,
          completed: 80,
          budget: 10000000,
          progress: 66.7
        },
        currentQuarter: {
          planned: 30,
          completed: 20,
          budget: 2500000,
          progress: 66.7
        },
        topRegions: [
          {
            regionId: 'region-1',
            regionName: '华东地区',
            plannedCount: 40,
            completedCount: 25,
            completionRate: 62.5
          }
        ],
        recentActivities: [
          {
            id: 'activity-1',
            title: '测试计划',
            action: '更新',
            timestamp: '2024-01-15T10:00:00Z',
            user: '张三'
          }
        ]
      },
      isLoading: false
    }))
  }
}))

vi.mock('dayjs', () => {
  const mockDayjs = vi.fn((date) => ({
    startOf: vi.fn(() => mockDayjs('2024-01-01')),
    endOf: vi.fn(() => mockDayjs('2024-12-31')),
    year: vi.fn(() => 2024),
    format: vi.fn(() => '2024-01-15'),
    fromNow: vi.fn(() => '2 hours ago'),
  }))
  return { default: mockDayjs }
})

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const renderWithWrapper = (component: React.ReactElement) => {
  return render(<TestWrapper>{component}</TestWrapper>)
}

describe('StorePlanDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard title and description', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('开店计划执行看板')).toBeInTheDocument()
    expect(screen.getByText('实时监控开店计划执行情况，掌握各地区开店进度')).toBeInTheDocument()
  })

  it('should render filter controls', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('时间范围:')).toBeInTheDocument()
    expect(screen.getByText('地区:')).toBeInTheDocument()
    expect(screen.getByText('门店类型:')).toBeInTheDocument()
  })

  it('should render overview statistics cards', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    // 检查统计卡片
    expect(screen.getByText('本年计划数')).toBeInTheDocument()
    expect(screen.getByText('完成率')).toBeInTheDocument()
    expect(screen.getByText('投资预算')).toBeInTheDocument()
    expect(screen.getByText('平均耗时')).toBeInTheDocument()
    
    // 检查数值
    expect(screen.getByText('120')).toBeInTheDocument() // 本年计划数
    expect(screen.getByText('66.7')).toBeInTheDocument() // 完成率
  })

  it('should render status distribution pie chart', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('计划状态分布')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('should render region completion column chart', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('各地区完成情况')).toBeInTheDocument()
    expect(screen.getByTestId('column-chart')).toBeInTheDocument()
  })

  it('should render monthly trend line chart', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('月度开店趋势')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('should render progress tracking table', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('地区进度跟踪')).toBeInTheDocument()
    expect(screen.getByText('华东地区')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument() // 计划门店数
    expect(screen.getByText('25')).toBeInTheDocument() // 已完成数
  })

  it('should render recent activities', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('最近活动')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('更新')).toBeInTheDocument()
    expect(screen.getByText('测试计划')).toBeInTheDocument()
  })

  it('should show delayed plans alert', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    expect(screen.getByText('发现 1 个延期计划')).toBeInTheDocument()
    expect(screen.getByText('延期计划')).toBeInTheDocument()
  })

  it('should handle filter changes', async () => {
    const user = userEvent.setup()
    renderWithWrapper(<StorePlanDashboard />)
    
    // 测试地区筛选
    const regionSelect = screen.getByText('选择地区').closest('.ant-select')
    if (regionSelect) {
      await user.click(regionSelect)
      // 在实际实现中，这里会有具体的选项
    }
    
    // 测试门店类型筛选
    const storeTypeSelect = screen.getByText('选择类型').closest('.ant-select')
    if (storeTypeSelect) {
      await user.click(storeTypeSelect)
    }
  })

  it('should handle time range picker changes', async () => {
    const user = userEvent.setup()
    renderWithWrapper(<StorePlanDashboard />)
    
    // 查找时间范围选择器
    const rangePicker = screen.getByText('时间范围:').nextElementSibling
    expect(rangePicker).toBeInTheDocument()
  })

  it('should calculate growth rates correctly', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    // 检查增长率标签（基于mock数据的计算）
    const growthTags = screen.getAllByText(/\d+\.\d+%/)
    expect(growthTags.length).toBeGreaterThan(0)
  })

  it('should show different colors for completion rates', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    // 检查完成率的颜色样式
    const completionRateCard = screen.getByText('完成率').closest('.ant-card')
    expect(completionRateCard).toBeInTheDocument()
  })

  it('should handle loading states', () => {
    // Mock loading state
    const mockUseStatistics = vi.fn(() => ({
      data: undefined,
      isLoading: true
    }))
    
    vi.mocked(require('@/services/query/hooks/useStorePlan').useStorePlan.useStatistics)
      .mockImplementation(mockUseStatistics)
    
    renderWithWrapper(<StorePlanDashboard />)
    
    // 检查loading状态
    expect(screen.getAllByText('0')).toHaveLength(4) // 默认值应该是0
  })

  it('should format budget values correctly', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    // 检查预算格式化 (10000000 / 10000 = 1000万)
    expect(screen.getByText('1000.0')).toBeInTheDocument()
  })

  it('should handle empty data gracefully', () => {
    // Mock empty data
    const mockUseStatistics = vi.fn(() => ({
      data: {
        totalPlans: 0,
        totalPlannedStores: 0,
        totalCompletedStores: 0,
        totalBudget: 0,
        actualBudget: 0,
        completionRate: 0,
        budgetUtilization: 0,
        statusDistribution: {},
        regionDistribution: [],
        monthlyTrend: []
      },
      isLoading: false
    }))
    
    vi.mocked(require('@/services/query/hooks/useStorePlan').useStorePlan.useStatistics)
      .mockImplementation(mockUseStatistics)
    
    renderWithWrapper(<StorePlanDashboard />)
    
    // 检查空数据处理
    expect(screen.getAllByText('0')).toHaveLength(4) // 统计卡片都应该显示0
  })

  it('should render chart tooltips correctly', () => {
    renderWithWrapper(<StorePlanDashboard />)
    
    // 检查图表是否正确传递了数据
    const pieChart = screen.getByTestId('pie-chart')
    expect(pieChart).toHaveTextContent('8 items') // statusDistribution有8个状态
    
    const columnChart = screen.getByTestId('column-chart')
    expect(columnChart).toHaveTextContent('4 items') // 2个地区 * 2个类型 = 4个数据点
  })

  it('should handle navigation correctly', async () => {
    const user = userEvent.setup()
    renderWithWrapper(<StorePlanDashboard />)
    
    // 点击查看详情按钮
    const detailButtons = screen.getAllByText('查看详情')
    if (detailButtons.length > 0) {
      await user.click(detailButtons[0])
      // 在实际实现中，这会触发导航
    }
  })
})