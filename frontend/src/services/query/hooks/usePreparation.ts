// 开店筹备相关的React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { PreparationApiService } from '../../api/preparation'

/**
 * 获取筹备项目列表
 */
export function usePreparationProjects(params?: any) {
  return useQuery({
    queryKey: queryKeys.preparation.projects.list(params),
    queryFn: () => PreparationApiService.getPreparationProjects(params),
    keepPreviousData: true
  })
}

/**
 * 获取筹备项目详情
 */
export function usePreparationProject(id: string) {
  return useQuery({
    queryKey: queryKeys.preparation.projects.detail(id),
    queryFn: () => PreparationApiService.getPreparationProject(id),
    enabled: !!id
  })
}

/**
 * 创建筹备项目
 */
export function useCreatePreparationProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: PreparationApiService.createPreparationProject,
    onSuccess: () => {
      message.success('筹备项目创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.preparation.projects.lists() })
    },
    onError: (error: any) => {
      message.error(error?.message || '创建失败')
    }
  })
}

/**
 * 更新筹备项目
 */
export function useUpdatePreparationProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      PreparationApiService.updatePreparationProject(id, data),
    onSuccess: (_, { id }) => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.preparation.projects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.preparation.projects.lists() })
    },
    onError: (error: any) => {
      message.error(error?.message || '更新失败')
    }
  })
}

/**
 * 获取项目阶段
 */
export function useProjectPhases(projectId: string) {
  return useQuery({
    queryKey: queryKeys.preparation.projects.phases(projectId),
    queryFn: () => PreparationApiService.getProjectPhases(projectId),
    enabled: !!projectId
  })
}

/**
 * 获取项目任务
 */
export function useProjectTasks(params?: any) {
  return useQuery({
    queryKey: queryKeys.preparation.projects.tasks(params),
    queryFn: () => PreparationApiService.getProjectTasks(params),
    keepPreviousData: true
  })
}

/**
 * 获取筹备统计
 */
export function usePreparationStats(params?: any) {
  return useQuery({
    queryKey: queryKeys.preparation.stats(params),
    queryFn: () => PreparationApiService.getPreparationStats(params),
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取筹备选项
 */
export function usePreparationOptions() {
  return useQuery({
    queryKey: queryKeys.preparation.options(),
    queryFn: PreparationApiService.getOptions,
    staleTime: 15 * 60 * 1000
  })
}
