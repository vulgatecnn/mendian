// 系统管理相关的React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { SystemApiService } from '../../api/system'

export function useSystemConfig() {
  return useQuery({
    queryKey: queryKeys.system.config(),
    queryFn: SystemApiService.getSystemConfig,
    staleTime: 15 * 60 * 1000 // 系统配置缓存15分钟
  })
}

export function useSystemInfo() {
  return useQuery({
    queryKey: queryKeys.system.info(),
    queryFn: SystemApiService.getSystemInfo,
    staleTime: 2 * 60 * 1000 // 系统信息缓存2分钟
  })
}

export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: SystemApiService.healthCheck,
    staleTime: 30 * 1000, // 健康检查缓存30秒
    refetchInterval: 60 * 1000 // 每分钟自动检查一次
  })
}

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ file, category }: { file: File; category?: string }) =>
      SystemApiService.uploadFile(file, category),
    onSuccess: () => {
      message.success('文件上传成功')
    },
    onError: (error: any) => {
      message.error(error?.message || '文件上传失败')
    }
  })
}

export function useFiles(params?: any) {
  return useQuery({
    queryKey: queryKeys.system.files(params),
    queryFn: () => SystemApiService.getFiles(params),
    keepPreviousData: true
  })
}

export function useOperationLogs(params?: any) {
  return useQuery({
    queryKey: queryKeys.system.logs.operations(params),
    queryFn: () => SystemApiService.getOperationLogs(params),
    keepPreviousData: true
  })
}

export function useSystemLogs(params?: any) {
  return useQuery({
    queryKey: queryKeys.system.logs.system(params),
    queryFn: () => SystemApiService.getSystemLogs(params),
    keepPreviousData: true
  })
}

export function useNotifications(params?: any) {
  return useQuery({
    queryKey: queryKeys.system.notifications(params),
    queryFn: () => SystemApiService.getNotifications(params),
    keepPreviousData: true
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.system.unreadCount(),
    queryFn: SystemApiService.getUnreadCount,
    staleTime: 30 * 1000, // 30秒缓存
    refetchInterval: 60 * 1000 // 每分钟自动更新
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: SystemApiService.markNotificationAsRead,
    onSuccess: () => {
      // 刷新通知列表和未读数量
      queryClient.invalidateQueries({ queryKey: queryKeys.system.notifications() })
      queryClient.invalidateQueries({ queryKey: queryKeys.system.unreadCount() })
    }
  })
}

export function useBackupData() {
  return useMutation({
    mutationFn: SystemApiService.backupData,
    onSuccess: () => {
      message.success('数据备份已开始')
    },
    onError: (error: any) => {
      message.error(error?.message || '数据备份失败')
    }
  })
}

export function useBackups() {
  return useQuery({
    queryKey: queryKeys.system.backups(),
    queryFn: SystemApiService.getBackups
  })
}

export function useClearCache() {
  return useMutation({
    mutationFn: SystemApiService.clearCache,
    onSuccess: data => {
      message.success(
        `缓存清理成功，释放内存 ${(data.data.freedMemory / 1024 / 1024).toFixed(2)} MB`
      )
    },
    onError: (error: any) => {
      message.error(error?.message || '缓存清理失败')
    }
  })
}

export function useCacheStats() {
  return useQuery({
    queryKey: queryKeys.system.cacheStats(),
    queryFn: SystemApiService.getCacheStats,
    staleTime: 60 * 1000 // 1分钟缓存
  })
}
