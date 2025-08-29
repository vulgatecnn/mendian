// 开店计划相关的React Query Hooks
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { StorePlanApiService } from '../../api/storePlan'
import type {
  StorePlan,
  StorePlanQueryParams,
  CreateStorePlanDto,
  UpdateStorePlanDto,
  ApprovalActionParams
} from '../../types'

/**
 * 获取开店计划列表
 */
export function useStorePlans(params?: StorePlanQueryParams) {
  return useQuery({
    queryKey: queryKeys.storePlan.list(params),
    queryFn: () => StorePlanApiService.getStorePlans(params),
    keepPreviousData: true
  })
}

/**
 * 获取开店计划列表（无限滚动）
 */
export function useInfiniteStorePlans(params?: Omit<StorePlanQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.storePlan.list(params),
    queryFn: ({ pageParam = 1 }) =>
      StorePlanApiService.getStorePlans({ ...params, page: pageParam }),
    getNextPageParam: lastPage => {
      const { pagination } = lastPage
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined
    },
    keepPreviousData: true
  })
}

/**
 * 获取开店计划详情
 */
export function useStorePlan(id: string) {
  return useQuery({
    queryKey: queryKeys.storePlan.detail(id),
    queryFn: () => StorePlanApiService.getStorePlan(id),
    enabled: !!id
  })
}

/**
 * 创建开店计划
 */
export function useCreateStorePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: StorePlanApiService.createStorePlan,
    onSuccess: data => {
      message.success('开店计划创建成功')

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })

      // 缓存新创建的详情
      queryClient.setQueryData(queryKeys.storePlan.detail(data.data.id), data)
    },
    onError: (error: any) => {
      console.error('创建开店计划失败:', error)
      message.error(error?.message || '创建失败')
    }
  })
}

/**
 * 更新开店计划
 */
export function useUpdateStorePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStorePlanDto }) =>
      StorePlanApiService.updateStorePlan(id, data),
    onSuccess: (response, { id }) => {
      message.success('开店计划更新成功')

      // 更新详情缓存
      queryClient.setQueryData(queryKeys.storePlan.detail(id), response)

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })
    },
    onError: (error: any) => {
      console.error('更新开店计划失败:', error)
      message.error(error?.message || '更新失败')
    }
  })
}

/**
 * 删除开店计划
 */
export function useDeleteStorePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: StorePlanApiService.deleteStorePlan,
    onSuccess: (_, id) => {
      message.success('开店计划删除成功')

      // 移除详情缓存
      queryClient.removeQueries({
        queryKey: queryKeys.storePlan.detail(id)
      })

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })
    },
    onError: (error: any) => {
      console.error('删除开店计划失败:', error)
      message.error(error?.message || '删除失败')
    }
  })
}

/**
 * 批量操作开店计划
 */
export function useBatchStorePlans() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: StorePlanApiService.batchOperation,
    onSuccess: data => {
      message.success(
        `批量操作完成，成功${data.data.successCount}条，失败${data.data.failureCount}条`
      )

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })
    },
    onError: (error: any) => {
      console.error('批量操作失败:', error)
      message.error(error?.message || '批量操作失败')
    }
  })
}

/**
 * 提交审批
 */
export function useSubmitStorePlanForApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data?: { comment?: string; urgency?: 'normal' | 'urgent'; approvers?: string[] }
    }) => StorePlanApiService.submitForApproval(id, data),
    onSuccess: (_, { id }) => {
      message.success('已提交审批')

      // 刷新详情
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.detail(id)
      })

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })
    },
    onError: (error: any) => {
      console.error('提交审批失败:', error)
      message.error(error?.message || '提交审批失败')
    }
  })
}

/**
 * 审批开店计划
 */
export function useApproveStorePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: ApprovalActionParams }) =>
      StorePlanApiService.approveStorePlan(id, params),
    onSuccess: (_, { id }) => {
      message.success('审批操作成功')

      // 刷新详情
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.detail(id)
      })

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })

      // 刷新审批历史
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.approvalHistory(id)
      })
    },
    onError: (error: any) => {
      console.error('审批操作失败:', error)
      message.error(error?.message || '审批操作失败')
    }
  })
}

/**
 * 获取审批历史
 */
export function useStorePlanApprovalHistory(id: string) {
  return useQuery({
    queryKey: queryKeys.storePlan.approvalHistory(id),
    queryFn: () => StorePlanApiService.getApprovalHistory(id),
    enabled: !!id
  })
}

/**
 * 导出开店计划
 */
export function useExportStorePlans() {
  return useMutation({
    mutationFn: StorePlanApiService.exportStorePlans,
    onSuccess: data => {
      message.success('导出任务已创建，请稍后下载')

      // 可以在这里处理下载逻辑
      console.log('导出文件信息:', data.data)
    },
    onError: (error: any) => {
      console.error('导出失败:', error)
      message.error(error?.message || '导出失败')
    }
  })
}

/**
 * 导入开店计划
 */
export function useImportStorePlans() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      options
    }: {
      file: File
      options?: { mode?: 'create' | 'update' | 'upsert'; skipErrors?: boolean; template?: string }
    }) => StorePlanApiService.importStorePlans(file, options),
    onSuccess: data => {
      const { totalRecords, successRecords, failedRecords } = data.data
      message.success(
        `导入完成！总计${totalRecords}条，成功${successRecords}条，失败${failedRecords}条`
      )

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })
    },
    onError: (error: any) => {
      console.error('导入失败:', error)
      message.error(error?.message || '导入失败')
    }
  })
}

/**
 * 复制开店计划
 */
export function useCloneStorePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data?: { name: string; description?: string; targetOpenDate?: string }
    }) => StorePlanApiService.cloneStorePlan(id, data),
    onSuccess: response => {
      message.success('开店计划复制成功')

      // 刷新列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.storePlan.lists()
      })

      // 缓存新复制的详情
      queryClient.setQueryData(queryKeys.storePlan.detail(response.data.id), response)
    },
    onError: (error: any) => {
      console.error('复制开店计划失败:', error)
      message.error(error?.message || '复制失败')
    }
  })
}

/**
 * 获取开店计划统计
 */
export function useStorePlanStats(params?: {
  period?: 'week' | 'month' | 'quarter' | 'year'
  regionId?: string
  type?: StorePlan['type']
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: queryKeys.storePlan.stats(params),
    queryFn: () => StorePlanApiService.getStats(params),
    staleTime: 5 * 60 * 1000 // 5分钟内不重新获取
  })
}

/**
 * 获取开店计划选项数据
 */
export function useStorePlanOptions() {
  return useQuery({
    queryKey: queryKeys.storePlan.options(),
    queryFn: StorePlanApiService.getOptions,
    staleTime: 15 * 60 * 1000 // 15分钟内不重新获取
  })
}

/**
 * 获取推荐候选点位
 */
export function useStorePlanRecommendations(
  id: string,
  params?: {
    regionId?: string
    maxDistance?: number
    budgetRange?: [number, number]
    excludeIds?: string[]
  }
) {
  return useQuery({
    queryKey: queryKeys.storePlan.recommendations(id, params),
    queryFn: () => StorePlanApiService.getRecommendedLocations(id, params),
    enabled: !!id,
    staleTime: 10 * 60 * 1000
  })
}
