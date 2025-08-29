// 基础数据相关的React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { BasicDataApiService } from '../../api/basicData'

export function useRegions(params?: any) {
  return useQuery({
    queryKey: queryKeys.basicData.regions.list(params),
    queryFn: () => BasicDataApiService.getRegions(params),
    staleTime: 10 * 60 * 1000 // 地区数据变化不频繁，可以缓存更长时间
  })
}

export function useRegionTree(rootId?: string) {
  return useQuery({
    queryKey: queryKeys.basicData.regions.tree(rootId),
    queryFn: () => BasicDataApiService.getRegionTree(rootId),
    staleTime: 15 * 60 * 1000
  })
}

export function useSuppliers(params?: any) {
  return useQuery({
    queryKey: queryKeys.basicData.suppliers.list(params),
    queryFn: () => BasicDataApiService.getSuppliers(params),
    keepPreviousData: true
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: queryKeys.basicData.suppliers.detail(id),
    queryFn: () => BasicDataApiService.getSupplier(id),
    enabled: !!id
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: BasicDataApiService.createSupplier,
    onSuccess: () => {
      message.success('供应商创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.basicData.suppliers.lists() })
    }
  })
}

export function useOrganizations(params?: any) {
  return useQuery({
    queryKey: queryKeys.basicData.organizations.list(params),
    queryFn: () => BasicDataApiService.getOrganizations(params),
    staleTime: 10 * 60 * 1000
  })
}

export function useOrganizationTree() {
  return useQuery({
    queryKey: queryKeys.basicData.organizations.tree(),
    queryFn: BasicDataApiService.getOrganizationTree,
    staleTime: 15 * 60 * 1000
  })
}

export function useCustomers(params?: any) {
  return useQuery({
    queryKey: queryKeys.basicData.customers.list(params),
    queryFn: () => BasicDataApiService.getCustomers(params),
    keepPreviousData: true
  })
}

export function useDictionary(category?: string) {
  return useQuery({
    queryKey: queryKeys.basicData.dictionary(category),
    queryFn: () => BasicDataApiService.getDictionary(category),
    staleTime: 30 * 60 * 1000 // 数据字典缓存30分钟
  })
}
