/**
 * 开店计划列表页面集成测试
 * 测试页面渲染、用户交互、状态管理和API集成
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { message } from 'antd'
import StorePlanList from './StorePlanList'
import { useStorePlanStore } from '@/stores/storePlanStore'
import type { StorePlan } from '@/services/types'

// Mock导航
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock message组件
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd')
  return {
    ...antd,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
    },
  }
})

// Mock Excel导出
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({ '!cols': [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

// Mock dayjs
vi.mock('dayjs', () => {
  const mockDayjs = vi.fn(() => ({
    format: vi.fn((format) => {
      if (format === 'YYYY-MM-DD') return '2024-01-01'
      if (format === 'MM-DD HH:mm') return '01-01 12:00'
      if (format === 'YYYY-MM-DD HH:mm') return '2024-01-01 12:00'
      if (format === 'YYYYMMDD_HHmm') return '20240101_1200'
      return '2024-01-01'
    }),
    add: vi.fn(() => ({
      toISOString: vi.fn(() => '2024-01-31T12:00:00.000Z')
    }))
  }))
  mockDayjs.extend = vi.fn()
  return { default: mockDayjs }
})

// 测试数据
const mockStorePlans: StorePlan[] = [
  {
    id: 'plan-001',
    name: '2024年第一季度开店计划',
    type: 'DIRECT',
    status: 'DRAFT',
    priority: 'high',
    progress: 25,
    region: { id: 'region-001', name: '华东区域' },
    targetOpenDate: '2024-03-31',
    budget: 500000,
    createdByName: '计划员张三',
    createdAt: '2024-01-01T12:00:00.000Z',
    description: '第一季度华东区域开店计划',
  },
  {
    id: 'plan-002',
    name: '2024年第二季度开店计划',
    type: 'FRANCHISE',
    status: 'SUBMITTED',
    priority: 'medium',
    progress: 10,
    region: { id: 'region-002', name: '华南区域' },
    targetOpenDate: '2024-06-30',
    budget: 300000,
    createdByName: '计划员李四',
    createdAt: '2024-01-05T12:00:00.000Z',
    description: '第二季度华南区域开店计划',
  },
  {
    id: 'plan-003',
    name: '2024年第三季度开店计划',
    type: 'FLAGSHIP',
    status: 'APPROVED',
    priority: 'urgent',
    progress: 75,
    region: { id: 'region-003', name: '华北区域' },
    targetOpenDate: '2024-09-30',
    budget: 800000,
    createdByName: '计划员王五',
    createdAt: '2024-01-10T12:00:00.000Z',
    description: '第三季度华北区域旗舰店计划',
  },
]

const mockStats = {
  total: {
    count: 3,
    totalBudget: 1600000,
  },
  byStatus: {
    draft: 1,
    submitted: 1,
    pending: 0,
    approved: 1,
    rejected: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  },
  byType: {
    direct: 1,
    franchise: 1,
    flagship: 1,
    popup: 0,
  },
  byRegion: {
    '华东区域': 1,
    '华南区域': 1,
    '华北区域': 1,
  },
  timeline: [],
}

// Mock store的初始实现
const createMockStore = () => {
  const mockStore = {
    storePlans: mockStorePlans,
    stats: mockStats,
    selectedIds: [],
    queryParams: { page: 1, pageSize: 10 },
    pagination: { current: 1, pageSize: 10, total: 3 },
    isLoading: false,
    isStatsLoading: false,
    fetchStorePlans: vi.fn(),
    fetchStats: vi.fn(),
    batchDeleteStorePlans: vi.fn(),
    cloneStorePlan: vi.fn(),
    deleteStorePlan: vi.fn(),
    setSelectedIds: vi.fn(),
    setQueryParams: vi.fn(),
    clearSelection: vi.fn(),
  }
  
  // Mock store的实现
  vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)
  
  return mockStore
}

// 渲染组件的辅助函数
const renderStorePlanList = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StorePlanList />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('StorePlanList Integration Tests', () => {
  let mockStore: ReturnType<typeof createMockStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    mockStore = createMockStore()
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('页面初始渲染', () => {
    it('应该正确渲染页面标题和描述', () => {
      renderStorePlanList()

      expect(screen.getByText('开店计划管理')).toBeInTheDocument()
      expect(screen.getByText(/管理门店开店计划/)).toBeInTheDocument()
    })

    it('应该渲染工具栏按钮', () => {
      renderStorePlanList()

      expect(screen.getByRole('button', { name: /统计分析/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /刷新/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /导出/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /导入/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /新建计划/ })).toBeInTheDocument()
    })

    it('应该渲染统计卡片', () => {
      renderStorePlanList()

      expect(screen.getByText('总计划数')).toBeInTheDocument()
      expect(screen.getByText('进行中')).toBeInTheDocument()
      expect(screen.getByText('已完成')).toBeInTheDocument()
      expect(screen.getByText('总预算(万)')).toBeInTheDocument()
    })

    it('应该正确显示统计数据', () => {
      renderStorePlanList()

      expect(screen.getByText('3')).toBeInTheDocument() // 总计划数
      expect(screen.getByText('160.0')).toBeInTheDocument() // 总预算(万)
    })
  })

  describe('数据加载和显示', () => {
    it('初始化时应该调用数据获取方法', () => {
      renderStorePlanList()

      expect(mockStore.fetchStorePlans).toHaveBeenCalled()
      expect(mockStore.fetchStats).toHaveBeenCalled()
    })

    it('应该正确显示计划列表数据', () => {
      renderStorePlanList()

      // 验证表格中的数据
      expect(screen.getByText('2024年第一季度开店计划')).toBeInTheDocument()
      expect(screen.getByText('2024年第二季度开店计划')).toBeInTheDocument()
      expect(screen.getByText('2024年第三季度开店计划')).toBeInTheDocument()

      // 验证状态标签
      expect(screen.getByText('草稿')).toBeInTheDocument()
      expect(screen.getByText('已提交')).toBeInTheDocument()
      expect(screen.getByText('已批准')).toBeInTheDocument()

      // 验证类型标签
      expect(screen.getByText('直营')).toBeInTheDocument()
      expect(screen.getByText('加盟')).toBeInTheDocument()
      expect(screen.getByText('旗舰店')).toBeInTheDocument()
    })

    it('应该正确显示加载状态', () => {
      mockStore.isLoading = true
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      // 验证加载状态在表格中显示
      expect(document.querySelector('.ant-spin')).toBeInTheDocument()
    })

    it('应该正确显示统计数据加载状态', () => {
      mockStore.isStatsLoading = true
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      // 验证统计卡片中的加载状态
      expect(document.querySelectorAll('.ant-statistic-content .ant-spin')).toHaveLength(4)
    })
  })

  describe('用户交互功能', () => {
    it('点击新建计划应该导航到创建页面', async () => {
      renderStorePlanList()

      const createButton = screen.getByRole('button', { name: /新建计划/ })
      await user.click(createButton)

      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/create')
    })

    it('点击查看按钮应该导航到详情页面', async () => {
      renderStorePlanList()

      const viewButtons = screen.getAllByRole('button', { name: /查看/ })
      await user.click(viewButtons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/plan-001')
    })

    it('点击计划名称应该导航到详情页面', async () => {
      renderStorePlanList()

      const planNameLink = screen.getByText('2024年第一季度开店计划')
      await user.click(planNameLink)

      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/plan-001')
    })

    it('点击统计分析应该导航到统计页面', async () => {
      renderStorePlanList()

      const statsButton = screen.getByRole('button', { name: /统计分析/ })
      await user.click(statsButton)

      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/statistics')
    })

    it('点击刷新按钮应该重新获取数据', async () => {
      renderStorePlanList()

      const refreshButton = screen.getByRole('button', { name: /刷新/ })
      await user.click(refreshButton)

      expect(mockStore.fetchStorePlans).toHaveBeenCalledTimes(2) // 初始化1次 + 点击1次
      expect(mockStore.fetchStats).toHaveBeenCalledTimes(2)
    })
  })

  describe('表格操作功能', () => {
    it('应该支持行选择功能', async () => {
      renderStorePlanList()

      const checkboxes = screen.getAllByRole('checkbox')
      // 第一个是全选checkbox，第二个开始是行选择
      await user.click(checkboxes[1])

      expect(mockStore.setSelectedIds).toHaveBeenCalledWith(['plan-001'])
    })

    it('选择行后应该显示批量操作栏', () => {
      mockStore.selectedIds = ['plan-001']
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      expect(screen.getByText('已选择 1 项')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /批量删除/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /取消选择/ })).toBeInTheDocument()
    })

    it('点击取消选择应该清空选择', async () => {
      mockStore.selectedIds = ['plan-001']
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      const cancelButton = screen.getByRole('button', { name: /取消选择/ })
      await user.click(cancelButton)

      expect(mockStore.clearSelection).toHaveBeenCalled()
    })

    it('应该支持分页功能', async () => {
      renderStorePlanList()

      // 查找分页组件
      const pagination = document.querySelector('.ant-pagination')
      expect(pagination).toBeInTheDocument()

      // 验证分页信息显示
      expect(screen.getByText(/第 1-3 条\/总共 3 条/)).toBeInTheDocument()
    })
  })

  describe('下拉菜单操作', () => {
    it('点击更多按钮应该显示操作菜单', async () => {
      renderStorePlanList()

      // 获取第一行的更多按钮
      const moreButtons = screen.getAllByLabelText('more')
      await user.click(moreButtons[0])

      await waitFor(() => {
        expect(screen.getByText('查看详情')).toBeInTheDocument()
        expect(screen.getByText('编辑')).toBeInTheDocument()
        expect(screen.getByText('复制')).toBeInTheDocument()
        expect(screen.getByText('删除')).toBeInTheDocument()
      })
    })

    it('点击编辑菜单项应该导航到编辑页面', async () => {
      renderStorePlanList()

      const moreButtons = screen.getAllByLabelText('more')
      await user.click(moreButtons[0])

      await waitFor(() => {
        const editMenuItem = screen.getByText('编辑')
        user.click(editMenuItem)
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/store-plan/plan-001/edit')
      })
    })

    it('点击复制菜单项应该复制计划', async () => {
      mockStore.cloneStorePlan.mockResolvedValue(mockStorePlans[0])

      renderStorePlanList()

      const moreButtons = screen.getAllByLabelText('more')
      await user.click(moreButtons[0])

      await waitFor(() => {
        const cloneMenuItem = screen.getByText('复制')
        user.click(cloneMenuItem)
      })

      await waitFor(() => {
        expect(mockStore.cloneStorePlan).toHaveBeenCalledWith('plan-001', expect.objectContaining({
          name: '2024年第一季度开店计划 - 副本',
          description: '第一季度华东区域开店计划',
          targetOpenDate: '2024-01-31T12:00:00.000Z'
        }))
        expect(message.success).toHaveBeenCalledWith('计划复制成功')
      })
    })
  })

  describe('删除操作', () => {
    it('删除草稿状态计划应该显示确认对话框', async () => {
      renderStorePlanList()

      const moreButtons = screen.getAllByLabelText('more')
      await user.click(moreButtons[0]) // 第一个计划是草稿状态

      await waitFor(() => {
        const deleteMenuItem = screen.getByText('删除')
        user.click(deleteMenuItem)
      })

      await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument()
        expect(screen.getByText('确定要删除这个开店计划吗？删除后无法恢复。')).toBeInTheDocument()
      })
    })

    it('尝试删除非草稿状态计划应该显示警告', async () => {
      renderStorePlanList()

      const moreButtons = screen.getAllByLabelText('more')
      await user.click(moreButtons[1]) // 第二个计划是已提交状态

      await waitFor(() => {
        const deleteMenuItem = screen.getByText('删除')
        expect(deleteMenuItem.parentElement).toHaveClass('ant-dropdown-menu-item-disabled')
      })
    })

    it('批量删除应该显示确认对话框', async () => {
      mockStore.selectedIds = ['plan-001']
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      const batchDeleteButton = screen.getByRole('button', { name: /批量删除/ })
      await user.click(batchDeleteButton)

      await waitFor(() => {
        expect(screen.getByText('批量删除确认')).toBeInTheDocument()
        expect(screen.getByText('确定要删除选中的 1 个计划吗？')).toBeInTheDocument()
      })
    })

    it('批量删除包含非草稿状态计划时应该显示警告', async () => {
      mockStore.selectedIds = ['plan-001', 'plan-002'] // 包含已提交状态的计划
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      const batchDeleteButton = screen.getByRole('button', { name: /批量删除/ })
      await user.click(batchDeleteButton)

      await waitFor(() => {
        expect(message.warning).toHaveBeenCalledWith('选中的项目中包含非草稿状态的计划，只有草稿状态可以删除')
      })
    })
  })

  describe('导出功能', () => {
    it('点击导出按钮应该开始导出Excel', async () => {
      // Mock动态导入
      const mockXLSX = {
        utils: {
          book_new: vi.fn(() => ({})),
          json_to_sheet: vi.fn(() => ({ '!cols': [] })),
          book_append_sheet: vi.fn(),
        },
        writeFile: vi.fn(),
      }
      
      vi.doMock('xlsx', () => mockXLSX)

      renderStorePlanList()

      const exportButton = screen.getByRole('button', { name: /导出/ })
      await user.click(exportButton)

      await waitFor(() => {
        expect(message.loading).toHaveBeenCalledWith({ content: '正在导出数据...', key: 'export' })
      })

      // 验证Excel相关方法被调用
      await waitFor(() => {
        expect(mockXLSX.utils.book_new).toHaveBeenCalled()
        expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalled()
        expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalled()
        expect(mockXLSX.writeFile).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith({ content: '成功导出 3 条记录', key: 'export' })
      })
    })

    it('导出失败时应该显示错误信息', async () => {
      // Mock导入失败
      vi.doMock('xlsx', () => Promise.reject(new Error('Import failed')))

      renderStorePlanList()

      const exportButton = screen.getByRole('button', { name: /导出/ })
      await user.click(exportButton)

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith({ content: '导出失败，请重试', key: 'export' })
      })
    })
  })

  describe('导入功能', () => {
    it('点击导入按钮应该显示开发中提示', async () => {
      renderStorePlanList()

      const importButton = screen.getByRole('button', { name: /导入/ })
      await user.click(importButton)

      expect(message.info).toHaveBeenCalledWith('导入功能开发中')
    })
  })

  describe('状态显示一致性测试', () => {
    it('应该正确映射和显示所有状态', () => {
      const allStatusPlans: StorePlan[] = [
        { ...mockStorePlans[0], id: 'draft', status: 'DRAFT' },
        { ...mockStorePlans[0], id: 'submitted', status: 'SUBMITTED' },
        { ...mockStorePlans[0], id: 'approved', status: 'APPROVED' },
        { ...mockStorePlans[0], id: 'rejected', status: 'REJECTED' },
        { ...mockStorePlans[0], id: 'in-progress', status: 'IN_PROGRESS' },
        { ...mockStorePlans[0], id: 'completed', status: 'COMPLETED' },
      ]

      mockStore.storePlans = allStatusPlans
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      // 验证所有状态都能正确显示
      expect(screen.getByText('草稿')).toBeInTheDocument()
      expect(screen.getByText('已提交')).toBeInTheDocument() 
      expect(screen.getByText('已批准')).toBeInTheDocument()
      expect(screen.getByText('已拒绝')).toBeInTheDocument()
      expect(screen.getByText('进行中')).toBeInTheDocument()
      expect(screen.getByText('已完成')).toBeInTheDocument()
    })

    it('应该为紧急优先级显示徽章', () => {
      const urgentPlan = { ...mockStorePlans[0], priority: 'urgent' }
      mockStore.storePlans = [urgentPlan]
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      expect(screen.getByText('紧急')).toBeInTheDocument()
      expect(document.querySelector('.ant-badge')).toBeInTheDocument()
    })

    it('进度条应该正确显示不同进度值', () => {
      renderStorePlanList()

      // 验证不同进度值的显示
      const progressBars = document.querySelectorAll('.ant-progress-bg')
      expect(progressBars).toHaveLength(3) // 三个计划的进度条
    })
  })

  describe('错误处理', () => {
    it('当store中有错误时应该正确处理', () => {
      mockStore.error = '网络请求失败'
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      // 组件应该能正常渲染，不会因为错误而崩溃
      expect(screen.getByText('开店计划管理')).toBeInTheDocument()
    })

    it('当没有数据时应该正确显示空状态', () => {
      mockStore.storePlans = []
      mockStore.stats = { ...mockStats, total: { count: 0, totalBudget: 0 } }
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      // 验证空状态显示
      expect(screen.getByText('0')).toBeInTheDocument() // 总计划数为0
    })
  })

  describe('响应式和性能', () => {
    it('表格应该支持横向滚动', () => {
      renderStorePlanList()

      const table = document.querySelector('.ant-table-body')
      expect(table).toBeInTheDocument()
      
      // 验证表格有滚动配置
      const tableWrapper = document.querySelector('.ant-table-container')
      expect(tableWrapper).toBeInTheDocument()
    })

    it('大数据量时分页应该正确工作', () => {
      mockStore.pagination = { current: 5, pageSize: 20, total: 1000 }
      vi.mocked(useStorePlanStore).mockReturnValue(mockStore as any)

      renderStorePlanList()

      // 验证分页显示大数据量信息
      expect(screen.getByText(/总共 1000 条/)).toBeInTheDocument()
    })
  })
});