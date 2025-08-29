// 审批中心相关的React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { ApprovalApiService } from '../../api/approval'

export function useApprovalFlows(params?: any) {
  return useQuery({
    queryKey: queryKeys.approval.flows.list(params),
    queryFn: () => ApprovalApiService.getApprovalFlows(params),
    keepPreviousData: true
  })
}

export function useApprovalFlow(id: string) {
  return useQuery({
    queryKey: queryKeys.approval.flows.detail(id),
    queryFn: () => ApprovalApiService.getApprovalFlow(id),
    enabled: !!id
  })
}

export function useCreateApprovalFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ApprovalApiService.createApprovalFlow,
    onSuccess: () => {
      message.success('审批流程创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.approval.flows.lists() })
    }
  })
}

export function useApproveFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: any }) =>
      ApprovalApiService.approveFlow(id, params),
    onSuccess: (_, { id }) => {
      message.success('审批操作成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.approval.flows.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.approval.flows.lists() })
    }
  })
}

export function useApprovalTemplates(params?: any) {
  return useQuery({
    queryKey: queryKeys.approval.templates.list(params),
    queryFn: () => ApprovalApiService.getApprovalTemplates(params)
  })
}

export function useMyApprovalTasks(params?: any) {
  return useQuery({
    queryKey: queryKeys.approval.myTasks(params),
    queryFn: () => ApprovalApiService.getMyTasks(params),
    keepPreviousData: true
  })
}

export function useMyApprovalApplications(params?: any) {
  return useQuery({
    queryKey: queryKeys.approval.myApplications(params),
    queryFn: () => ApprovalApiService.getMyApplications(params),
    keepPreviousData: true
  })
}

export function useApprovalStats() {
  return useQuery({
    queryKey: queryKeys.approval.stats(),
    queryFn: ApprovalApiService.getApprovalStats,
    staleTime: 5 * 60 * 1000
  })
}
