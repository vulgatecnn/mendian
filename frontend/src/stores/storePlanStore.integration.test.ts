/**
 * StorePlan Store 集成测试
 * 测试状态管理、API调用、数据流和错误处理
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { message } from 'antd'
import { useStorePlanStore } from './storePlanStore'
import { StorePlanApiService } from '@/services/api/storePlan'
import type { StorePlan, CreateStorePlanDto, UpdateStorePlanDto } from '@/services/types'

// Mock API服务
vi.mock('@/services/api/storePlan')
const mockStorePlanApiService = vi.mocked(StorePlanApiService)

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
]

const mockStats = {
  total: {
    count: 2,
    totalBudget: 800000,
  },
  byStatus: {
    draft: 1,
    submitted: 1,
    pending: 0,
    approved: 0,
    rejected: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  },
  byType: {
    direct: 1,
    franchise: 1,
    flagship: 0,
    popup: 0,
  },
  byRegion: {
    '华东区域': 1,
    '华南区域': 1,
  },
  timeline: [],
}

const mockCreateData: CreateStorePlanDto = {
  name: '新建开店计划',
  type: 'DIRECT',
  priority: 'medium',
  region: { id: 'region-001', name: '华东区域' },
  targetOpenDate: '2024-12-31',
  budget: 400000,
  description: '新建的开店计划',
}

const mockUpdateData: UpdateStorePlanDto = {
  name: '更新后的开店计划',
  description: '更新后的描述',
  budget: 600000,
}

describe('StorePlan Store Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset store to initial state
    const { result } = renderHook(() => useStorePlanStore())
    act(() => {
      result.current.resetStore()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初始状态测试', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useStorePlanStore())

      expect(result.current.storePlans).toEqual([])
      expect(result.current.currentStorePlan).toBeNull()
      expect(result.current.stats).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isStatsLoading).toBe(false)
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.selectedIds).toEqual([])
      expect(result.current.queryParams).toEqual({ page: 1, pageSize: 10 })
      expect(result.current.pagination).toEqual({ current: 1, pageSize: 10, total: 0 })
    })
  })

  describe('状态设置方法测试', () => {
    it('setLoading 应该正确更新加载状态', () => {
      const { result } = renderHook(() => useStorePlanStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('setError 应该正确更新错误状态', () => {
      const { result } = renderHook(() => useStorePlanStore())

      act(() => {
        result.current.setError('测试错误')
      })

      expect(result.current.error).toBe('测试错误')
    })

    it('setSelectedIds 应该正确更新选中的IDs', () => {
      const { result } = renderHook(() => useStorePlanStore())

      act(() => {
        result.current.setSelectedIds(['plan-001', 'plan-002'])
      })

      expect(result.current.selectedIds).toEqual(['plan-001', 'plan-002'])
    })

    it('setQueryParams 应该正确更新查询参数', () => {
      const { result } = renderHook(() => useStorePlanStore())

      const newParams = { page: 2, pageSize: 20, status: 'APPROVED' }

      act(() => {
        result.current.setQueryParams(newParams)
      })

      expect(result.current.queryParams).toEqual(newParams)
    })

    it('setPagination 应该正确更新分页信息', () => {
      const { result } = renderHook(() => useStorePlanStore())

      act(() => {
        result.current.setPagination({ current: 3, total: 100 })
      })

      expect(result.current.pagination).toEqual({ current: 3, pageSize: 10, total: 100 })
    })
  })

  describe('fetchStorePlans 测试', () => {
    it('成功获取计划列表时应该更新状态', async () => {
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: mockStorePlans,
        pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.fetchStorePlans()
      })

      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
      expect(result.current.storePlans).toEqual(mockStorePlans)
      expect(result.current.pagination).toEqual({ current: 1, pageSize: 10, total: 2 })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('API调用失败时应该设置错误状态', async () => {
      const errorMessage = '网络请求失败'
      mockStorePlanApiService.getStorePlans.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.fetchStorePlans()
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isLoading).toBe(false)
      expect(message.error).toHaveBeenCalledWith('获取开店计划列表失败')
    })

    it('应该正确处理加载状态', async () => {
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockStorePlanApiService.getStorePlans.mockReturnValue(slowPromise)

      const { result } = renderHook(() => useStorePlanStore())

      // 开始加载
      act(() => {
        result.current.fetchStorePlans()
      })

      expect(result.current.isLoading).toBe(true)

      // 完成加载
      act(() => {
        resolvePromise({
          success: true,
          data: mockStorePlans,
          pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
        })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('使用自定义参数调用时应该传递参数', async () => {
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 2, pageSize: 20, total: 0, totalPages: 0 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      const customParams = { page: 2, pageSize: 20, status: 'APPROVED' }

      await act(async () => {
        await result.current.fetchStorePlans(customParams)
      })

      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalledWith(customParams)
    })
  })

  describe('fetchStorePlan 测试', () => {
    it('成功获取计划详情时应该更新currentStorePlan', async () => {
      mockStorePlanApiService.getStorePlan.mockResolvedValue({
        success: true,
        data: mockStorePlans[0],
      })

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.fetchStorePlan('plan-001')
      })

      expect(mockStorePlanApiService.getStorePlan).toHaveBeenCalledWith('plan-001')
      expect(result.current.currentStorePlan).toEqual(mockStorePlans[0])
      expect(result.current.error).toBeNull()
    })

    it('API调用失败时应该设置错误状态', async () => {
      const errorMessage = '计划不存在'
      mockStorePlanApiService.getStorePlan.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.fetchStorePlan('non-existent-id')
      })

      expect(result.current.error).toBe(errorMessage)
      expect(message.error).toHaveBeenCalledWith('获取开店计划详情失败')
    })
  })

  describe('fetchStats 测试', () => {
    it('成功获取统计数据时应该更新stats', async () => {
      mockStorePlanApiService.getStats.mockResolvedValue({
        success: true,
        data: mockStats,
      })

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.fetchStats()
      })

      expect(mockStorePlanApiService.getStats).toHaveBeenCalled()
      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.isStatsLoading).toBe(false)
    })

    it('应该正确处理统计数据加载状态', async () => {
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockStorePlanApiService.getStats.mockReturnValue(slowPromise)

      const { result } = renderHook(() => useStorePlanStore())

      // 开始加载
      act(() => {
        result.current.fetchStats()
      })

      expect(result.current.isStatsLoading).toBe(true)

      // 完成加载
      act(() => {
        resolvePromise({ success: true, data: mockStats })
      })

      await waitFor(() => {
        expect(result.current.isStatsLoading).toBe(false)
      })
    })
  })

  describe('createStorePlan 测试', () => {
    it('成功创建计划时应该显示成功消息并刷新列表', async () => {
      mockStorePlanApiService.createStorePlan.mockResolvedValue({
        success: true,
        data: mockStorePlans[0],
      })
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: mockStorePlans,
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      let createdPlan: StorePlan | null = null

      await act(async () => {
        createdPlan = await result.current.createStorePlan(mockCreateData)
      })

      expect(mockStorePlanApiService.createStorePlan).toHaveBeenCalledWith(mockCreateData)
      expect(createdPlan).toEqual(mockStorePlans[0])
      expect(message.success).toHaveBeenCalledWith('开店计划创建成功')
      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalled() // 刷新列表
      expect(result.current.isSubmitting).toBe(false)
    })

    it('创建失败时应该显示错误消息', async () => {
      const errorMessage = '创建失败'
      mockStorePlanApiService.createStorePlan.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useStorePlanStore())

      let createdPlan: StorePlan | null = null

      await act(async () => {
        createdPlan = await result.current.createStorePlan(mockCreateData)
      })

      expect(createdPlan).toBeNull()
      expect(result.current.error).toBe(errorMessage)
      expect(message.error).toHaveBeenCalledWith(errorMessage)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('应该正确处理提交状态', async () => {
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockStorePlanApiService.createStorePlan.mockReturnValue(slowPromise)

      const { result } = renderHook(() => useStorePlanStore())

      // 开始创建
      act(() => {
        result.current.createStorePlan(mockCreateData)
      })

      expect(result.current.isSubmitting).toBe(true)

      // 完成创建
      act(() => {
        resolvePromise({ success: true, data: mockStorePlans[0] })
      })

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false)
      })
    })
  })

  describe('updateStorePlan 测试', () => {
    it('成功更新计划时应该更新currentStorePlan并刷新列表', async () => {
      const updatedPlan = { ...mockStorePlans[0], ...mockUpdateData }
      
      mockStorePlanApiService.updateStorePlan.mockResolvedValue({
        success: true,
        data: updatedPlan,
      })
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: [updatedPlan],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      // 设置当前计划
      act(() => {
        result.current.currentStorePlan = mockStorePlans[0]
      })

      let updateResult: StorePlan | null = null

      await act(async () => {
        updateResult = await result.current.updateStorePlan('plan-001', mockUpdateData)
      })

      expect(mockStorePlanApiService.updateStorePlan).toHaveBeenCalledWith('plan-001', mockUpdateData)
      expect(updateResult).toEqual(updatedPlan)
      expect(result.current.currentStorePlan).toEqual(updatedPlan)
      expect(message.success).toHaveBeenCalledWith('开店计划更新成功')
      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalled()
    })
  })

  describe('deleteStorePlan 测试', () => {
    it('成功删除计划时应该显示成功消息并刷新列表', async () => {
      mockStorePlanApiService.deleteStorePlan.mockResolvedValue({ success: true })
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      let deleteResult: boolean = false

      await act(async () => {
        deleteResult = await result.current.deleteStorePlan('plan-001')
      })

      expect(mockStorePlanApiService.deleteStorePlan).toHaveBeenCalledWith('plan-001')
      expect(deleteResult).toBe(true)
      expect(message.success).toHaveBeenCalledWith('删除成功')
      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalled()
    })

    it('删除失败时应该返回false并显示错误消息', async () => {
      const errorMessage = '删除失败'
      mockStorePlanApiService.deleteStorePlan.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useStorePlanStore())

      let deleteResult: boolean = true

      await act(async () => {
        deleteResult = await result.current.deleteStorePlan('plan-001')
      })

      expect(deleteResult).toBe(false)
      expect(result.current.error).toBe(errorMessage)
      expect(message.error).toHaveBeenCalledWith(errorMessage)
    })
  })

  describe('batchDeleteStorePlans 测试', () => {
    it('成功批量删除时应该显示成功消息并清空选择', async () => {
      mockStorePlanApiService.batchOperation.mockResolvedValue({
        success: true,
        data: { successCount: 2, failureCount: 0 },
      })
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      // 设置选中的计划
      act(() => {
        result.current.setSelectedIds(['plan-001', 'plan-002'])
      })

      let batchResult: boolean = false

      await act(async () => {
        batchResult = await result.current.batchDeleteStorePlans(['plan-001', 'plan-002'])
      })

      expect(mockStorePlanApiService.batchOperation).toHaveBeenCalledWith({
        operation: 'delete',
        ids: ['plan-001', 'plan-002'],
        reason: '批量删除操作',
      })
      expect(batchResult).toBe(true)
      expect(message.success).toHaveBeenCalledWith('成功删除 2 个计划')
      expect(result.current.selectedIds).toEqual([]) // 清空选择
      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalled()
    })

    it('部分删除失败时应该显示警告消息', async () => {
      mockStorePlanApiService.batchOperation.mockResolvedValue({
        success: true,
        data: { successCount: 1, failureCount: 1 },
      })
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: [mockStorePlans[0]],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.batchDeleteStorePlans(['plan-001', 'plan-002'])
      })

      expect(message.warning).toHaveBeenCalledWith('成功删除 1 个，失败 1 个')
    })
  })

  describe('cloneStorePlan 测试', () => {
    it('成功复制计划时应该返回新计划并刷新列表', async () => {
      const clonedPlan = { ...mockStorePlans[0], id: 'plan-003', name: '复制的计划' }
      
      mockStorePlanApiService.cloneStorePlan.mockResolvedValue({
        success: true,
        data: clonedPlan,
      })
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: true,
        data: [...mockStorePlans, clonedPlan],
        pagination: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
      })

      const { result } = renderHook(() => useStorePlanStore())

      const cloneData = { name: '复制的计划', description: '复制的描述' }

      let cloneResult: StorePlan | null = null

      await act(async () => {
        cloneResult = await result.current.cloneStorePlan('plan-001', cloneData)
      })

      expect(mockStorePlanApiService.cloneStorePlan).toHaveBeenCalledWith('plan-001', cloneData)
      expect(cloneResult).toEqual(clonedPlan)
      expect(message.success).toHaveBeenCalledWith('计划复制成功')
      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalled()
    })
  })

  describe('工具方法测试', () => {
    it('resetStore 应该重置所有状态', () => {
      const { result } = renderHook(() => useStorePlanStore())

      // 修改一些状态
      act(() => {
        result.current.setLoading(true)
        result.current.setError('测试错误')
        result.current.setSelectedIds(['plan-001'])
      })

      // 重置
      act(() => {
        result.current.resetStore()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.selectedIds).toEqual([])
      expect(result.current.storePlans).toEqual([])
    })

    it('resetError 应该清空错误状态', () => {
      const { result } = renderHook(() => useStorePlanStore())

      act(() => {
        result.current.setError('测试错误')
      })

      expect(result.current.error).toBe('测试错误')

      act(() => {
        result.current.resetError()
      })

      expect(result.current.error).toBeNull()
    })

    it('selectAll 应该选择所有计划', () => {
      const { result } = renderHook(() => useStorePlanStore())

      // 设置一些计划数据
      act(() => {
        result.current.storePlans = mockStorePlans
      })

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.selectedIds).toEqual(['plan-001', 'plan-002'])
    })

    it('clearSelection 应该清空选择', () => {
      const { result } = renderHook(() => useStorePlanStore())

      act(() => {
        result.current.setSelectedIds(['plan-001', 'plan-002'])
      })

      expect(result.current.selectedIds).toEqual(['plan-001', 'plan-002'])

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selectedIds).toEqual([])
    })
  })

  describe('错误处理和边界情况', () => {
    it('API返回非成功状态时应该正确处理', async () => {
      mockStorePlanApiService.getStorePlans.mockResolvedValue({
        success: false,
        error: 'API错误',
      })

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.fetchStorePlans()
      })

      // 数据不应该更新
      expect(result.current.storePlans).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('网络错误时应该正确处理', async () => {
      const networkError = new Error('Network Error')
      mockStorePlanApiService.getStorePlans.mockRejectedValue(networkError)

      const { result } = renderHook(() => useStorePlanStore())

      await act(async () => {
        await result.current.fetchStorePlans()
      })

      expect(result.current.error).toBe('Network Error')
      expect(result.current.isLoading).toBe(false)
      expect(message.error).toHaveBeenCalledWith('获取开店计划列表失败')
    })

    it('并发API调用时应该正确处理', async () => {
      mockStorePlanApiService.getStorePlans
        .mockResolvedValueOnce({
          success: true,
          data: [mockStorePlans[0]],
          pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockStorePlans,
          pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
        })

      const { result } = renderHook(() => useStorePlanStore())

      // 发起两个并发请求
      await act(async () => {
        await Promise.all([
          result.current.fetchStorePlans(),
          result.current.fetchStorePlans(),
        ])
      })

      // 应该有两次API调用
      expect(mockStorePlanApiService.getStorePlans).toHaveBeenCalledTimes(2)
      expect(result.current.storePlans).toHaveLength(2) // 最后一次调用的结果
    })
  })
});