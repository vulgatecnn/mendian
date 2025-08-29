// 门店档案相关的React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { StoreFilesApiService } from '../../api/storeFiles'

export function useStores(params?: any) {
  return useQuery({
    queryKey: queryKeys.storeFiles.stores.list(params),
    queryFn: () => StoreFilesApiService.getStores(params),
    keepPreviousData: true
  })
}

export function useStore(id: string) {
  return useQuery({
    queryKey: queryKeys.storeFiles.stores.detail(id),
    queryFn: () => StoreFilesApiService.getStore(id),
    enabled: !!id
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: StoreFilesApiService.createStore,
    onSuccess: () => {
      message.success('门店创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.storeFiles.stores.lists() })
    }
  })
}

export function useStoreCertificates(storeId: string) {
  return useQuery({
    queryKey: queryKeys.storeFiles.certificates(storeId),
    queryFn: () => StoreFilesApiService.getStoreCertificates(storeId),
    enabled: !!storeId
  })
}

export function useStoreEquipment(storeId: string) {
  return useQuery({
    queryKey: queryKeys.storeFiles.equipment(storeId),
    queryFn: () => StoreFilesApiService.getStoreEquipment(storeId),
    enabled: !!storeId
  })
}

export function useStoreStats() {
  return useQuery({
    queryKey: queryKeys.storeFiles.stats(),
    queryFn: StoreFilesApiService.getStoreStats,
    staleTime: 5 * 60 * 1000
  })
}
