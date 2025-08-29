/**
 * 增强版开店计划相关React Query hooks
 */
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  keepPreviousData 
} from '@tanstack/react-query'
import { message } from 'antd'
import { EnhancedStorePlanService } from '../../api/enhanced.storePlan'
import type { 
  StorePlan, 
  StorePlanQueryParams, 
  CreateStorePlanDto, 
  UpdateStorePlanDto,
} from '../../types/business'
import type { PaginatedRequest } from '../../types/api'
import type {
  ApproveStorePlanRequest,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  StorePlanStats,
} from '../../api/enhanced.storePlan'

// Query Keys
export const STORE_PLAN_QUERY_KEYS = {
  all: ['storePlans'],
  lists: () => [...STORE_PLAN_QUERY_KEYS.all, 'list'],
  list: (filters: any) => [...STORE_PLAN_QUERY_KEYS.lists(), filters],
  details: () => [...STORE_PLAN_QUERY_KEYS.all, 'detail'],
  detail: (id: string) => [...STORE_PLAN_QUERY_KEYS.details(), id],
  stats: (filters: any) => [...STORE_PLAN_QUERY_KEYS.all, 'stats', filters],
  search: (params: any) => [...STORE_PLAN_QUERY_KEYS.all, 'search', params],
} as const

/**
 * 获取开店计划列表Hook
 */
export function useStorePlans(params: PaginatedRequest & StorePlanQueryParams = {}) {
  return useQuery({
    queryKey: STORE_PLAN_QUERY_KEYS.list(params),
    queryFn: async () => {
      const response = await EnhancedStorePlanService.getStorePlans(params)
      if (response.success) {
        return response
      }
      throw new Error(response.message || '获取开店计划失败')
    },
    placeholderData: keepPreviousData, // 保持上一次数据，避免加载时闪烁
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  })
}

/**
 * 无限滚动开店计划Hook
 */
export function useInfiniteStorePlans(params: StorePlanQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: ['storePlans', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await EnhancedStorePlanService.getStorePlans({
        ...params,
        page: pageParam,
        pageSize: 10,
      })
      if (response.success) {
        return response
      }
      throw new Error(response.message || '获取开店计划失败')
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined
      const { current, totalPages } = lastPage.pagination
      return current < totalPages ? current + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取单个开店计划Hook
 */
export function useStorePlan(id: string, enabled = true) {
  return useQuery({
    queryKey: STORE_PLAN_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await EnhancedStorePlanService.getStorePlanById(id)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取开店计划详情失败')
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * 搜索开店计划Hook
 */
export function useSearchStorePlans(params: PaginatedRequest & StorePlanQueryParams = {}) {
  return useQuery({
    queryKey: STORE_PLAN_QUERY_KEYS.search(params),
    queryFn: async () => {
      const response = await EnhancedStorePlanService.searchStorePlans(params)
      if (response.success) {
        return response
      }
      throw new Error(response.message || '搜索失败')
    },
    enabled: false, // 手动触发
    staleTime: 2 * 60 * 1000, // 搜索结果2分钟过期
  })
}

/**
 * 获取开店计划统计Hook
 */
export function useStorePlanStats(params: { startDate?: string, endDate?: string } = {}) {
  return useQuery({
    queryKey: STORE_PLAN_QUERY_KEYS.stats(params),
    queryFn: async () => {
      const response = await EnhancedStorePlanService.getStorePlanStats(params)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取统计数据失败')
    },
    staleTime: 10 * 60 * 1000, // 统计数据10分钟过期
    gcTime: 20 * 60 * 1000,
  })
}

/**
 * 创建开店计划Hook
 */
export function useCreateStorePlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateStorePlanDto) => EnhancedStorePlanService.createStorePlan(data),
    onSuccess: (response) => {
      if (response.success) {
        // 刷新列表缓存
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.lists() })
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.stats({}) })
        
        message.success(response.message || '开店计划创建成功')
      } else {
        message.error(response.message || '创建失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '创建失败，请重试')
    },
  })
}

/**
 * 更新开店计划Hook
 */
export function useUpdateStorePlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateStorePlanDto }) => 
      EnhancedStorePlanService.updateStorePlan(id, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // 更新详情缓存
        queryClient.setQueryData(
          STORE_PLAN_QUERY_KEYS.detail(variables.id), 
          response.data
        )
        
        // 刷新列表缓存
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.lists() })
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.stats({}) })
        
        message.success(response.message || '更新成功')
      } else {
        message.error(response.message || '更新失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '更新失败，请重试')
    },
  })
}

/**
 * 删除开店计划Hook
 */
export function useDeleteStorePlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => EnhancedStorePlanService.deleteStorePlan(id),
    onSuccess: (response, id) => {
      if (response.success) {
        // 删除详情缓存
        queryClient.removeQueries({ queryKey: STORE_PLAN_QUERY_KEYS.detail(id) })
        
        // 刷新列表缓存
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.lists() })
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.stats({}) })
        
        message.success(response.message || '删除成功')
      } else {
        message.error(response.message || '删除失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '删除失败，请重试')
    },
  })
}

/**
 * 审批开店计划Hook
 */
export function useApproveStorePlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: ApproveStorePlanRequest }) => 
      EnhancedStorePlanService.approveStorePlan(id, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // 更新详情缓存
        queryClient.setQueryData(
          STORE_PLAN_QUERY_KEYS.detail(variables.id), 
          response.data
        )
        
        // 刷新相关查询
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.lists() })
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.stats({}) })
        
        message.success(response.message || '审批成功')
      } else {
        message.error(response.message || '审批失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '审批失败，请重试')
    },
  })
}

/**
 * 添加里程碑Hook
 */
export function useAddMilestone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: CreateMilestoneRequest }) => 
      EnhancedStorePlanService.addMilestone(id, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // 刷新开店计划详情
        queryClient.invalidateQueries({ 
          queryKey: STORE_PLAN_QUERY_KEYS.detail(variables.id) 
        })
        
        message.success(response.message || '里程碑添加成功')
      } else {
        message.error(response.message || '添加失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '添加失败，请重试')
    },
  })
}

/**
 * 更新里程碑Hook
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      milestoneId, 
      data 
    }: { 
      id: string, 
      milestoneId: string, 
      data: UpdateMilestoneRequest 
    }) => EnhancedStorePlanService.updateMilestone(id, milestoneId, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // 刷新开店计划详情
        queryClient.invalidateQueries({ 
          queryKey: STORE_PLAN_QUERY_KEYS.detail(variables.id) 
        })
        
        message.success(response.message || '里程碑更新成功')
      } else {
        message.error(response.message || '更新失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '更新失败，请重试')
    },
  })
}

/**
 * 导出开店计划Hook
 */
export function useExportStorePlans() {
  return useMutation({
    mutationFn: (params: StorePlanQueryParams = {}) => 
      EnhancedStorePlanService.exportStorePlans(params),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // 下载文件
        const { exportUrl, filename } = response.data
        const link = document.createElement('a')
        link.href = exportUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        message.success(response.message || '导出成功')
      } else {
        message.error(response.message || '导出失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '导出失败，请重试')
    },
  })
}

/**
 * 批量操作Hook
 */
export function useBatchUpdateStorePlans() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[], updates: Partial<UpdateStorePlanDto> }) => 
      EnhancedStorePlanService.batchUpdateStorePlans(ids, updates),
    onSuccess: (response) => {
      if (response.success) {
        // 刷新所有相关查询
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.all })
        
        message.success(response.message || '批量操作成功')
      } else {
        message.error(response.message || '批量操作失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '批量操作失败，请重试')
    },
  })
}

/**
 * 复制开店计划Hook
 */
export function useCopyStorePlan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, newName }: { id: string, newName: string }) => 
      EnhancedStorePlanService.copyStorePlan(id, newName),
    onSuccess: (response) => {
      if (response.success) {
        // 刷新列表
        queryClient.invalidateQueries({ queryKey: STORE_PLAN_QUERY_KEYS.lists() })
        
        message.success(response.message || '复制成功')
      } else {
        message.error(response.message || '复制失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '复制失败，请重试')
    },
  })
}