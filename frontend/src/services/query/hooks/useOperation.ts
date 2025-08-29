// 门店运营相关的React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { OperationApiService } from '../../api/operation'

export function usePayments(params?: any) {
  return useQuery({
    queryKey: queryKeys.operation.payments.list(params),
    queryFn: () => OperationApiService.getPayments(params),
    keepPreviousData: true
  })
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.operation.payments.detail(id),
    queryFn: () => OperationApiService.getPayment(id),
    enabled: !!id
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: OperationApiService.createPayment,
    onSuccess: () => {
      message.success('付款项创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.operation.payments.lists() })
    }
  })
}

export function useApprovePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      OperationApiService.approvePayment(id, comment),
    onSuccess: (_, { id }) => {
      message.success('审批成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.operation.payments.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.operation.payments.lists() })
    }
  })
}

export function useAssets(params?: any) {
  return useQuery({
    queryKey: queryKeys.operation.assets.list(params),
    queryFn: () => OperationApiService.getAssets(params),
    keepPreviousData: true
  })
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.operation.assets.detail(id),
    queryFn: () => OperationApiService.getAsset(id),
    enabled: !!id
  })
}
