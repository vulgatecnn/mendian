// 拓店管理相关的React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { ExpansionApiService } from '../../api/expansion'
import type { CandidateLocation } from '../../types'

/**
 * 获取候选点位列表
 */
export function useCandidateLocations(params?: any) {
  return useQuery({
    queryKey: queryKeys.expansion.candidates.list(params),
    queryFn: () => ExpansionApiService.getCandidateLocations(params),
    keepPreviousData: true
  })
}

/**
 * 获取候选点位详情
 */
export function useCandidateLocation(id: string) {
  return useQuery({
    queryKey: queryKeys.expansion.candidates.detail(id),
    queryFn: () => ExpansionApiService.getCandidateLocation(id),
    enabled: !!id
  })
}

/**
 * 创建候选点位
 */
export function useCreateCandidateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ExpansionApiService.createCandidateLocation,
    onSuccess: () => {
      message.success('候选点位创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.expansion.candidates.lists() })
    },
    onError: (error: any) => {
      message.error(error?.message || '创建失败')
    }
  })
}

/**
 * 更新候选点位
 */
export function useUpdateCandidateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ExpansionApiService.updateCandidateLocation(id, data),
    onSuccess: (_, { id }) => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.expansion.candidates.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.expansion.candidates.lists() })
    },
    onError: (error: any) => {
      message.error(error?.message || '更新失败')
    }
  })
}

/**
 * 删除候选点位
 */
export function useDeleteCandidateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ExpansionApiService.deleteCandidateLocation,
    onSuccess: (_, id) => {
      message.success('删除成功')
      queryClient.removeQueries({ queryKey: queryKeys.expansion.candidates.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.expansion.candidates.lists() })
    },
    onError: (error: any) => {
      message.error(error?.message || '删除失败')
    }
  })
}

/**
 * 获取拓店统计
 */
export function useExpansionStats(params?: any) {
  return useQuery({
    queryKey: queryKeys.expansion.stats(params),
    queryFn: () => ExpansionApiService.getExpansionStats(params),
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取拓店选项
 */
export function useExpansionOptions() {
  return useQuery({
    queryKey: queryKeys.expansion.options(),
    queryFn: ExpansionApiService.getOptions,
    staleTime: 15 * 60 * 1000
  })
}
