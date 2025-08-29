import { httpClient } from '../http'
import { buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse,
  UploadResponse,
  ExportResponse,
  ImportResponse,
  SystemConfigResponse,
  OperationLog,
  NotificationMessage,
  HealthCheckResponse
} from '../types'

/**
 * 系统管理API服务
 */
export class SystemApiService {
  // ==================== 系统配置 ====================

  /**
   * 获取系统配置
   */
  static async getSystemConfig(): Promise<BaseResponse<SystemConfigResponse>> {
    return httpClient.get<SystemConfigResponse>('/system/config')
  }

  /**
   * 更新系统配置
   */
  static async updateSystemConfig(
    data: Partial<SystemConfigResponse>
  ): Promise<BaseResponse<SystemConfigResponse>> {
    return httpClient.put<SystemConfigResponse>('/system/config', data)
  }

  /**
   * 获取系统信息
   */
  static async getSystemInfo(): Promise<
    BaseResponse<{
      version: string
      buildTime: string
      environment: string
      uptime: number
      memoryUsage: {
        total: number
        used: number
        free: number
      }
      diskUsage: {
        total: number
        used: number
        free: number
      }
    }>
  > {
    return httpClient.get<{
      version: string
      buildTime: string
      environment: string
      uptime: number
      memoryUsage: {
        total: number
        used: number
        free: number
      }
      diskUsage: {
        total: number
        used: number
        free: number
      }
    }>('/system/info')
  }

  /**
   * 健康检查
   */
  static async healthCheck(): Promise<BaseResponse<HealthCheckResponse>> {
    return httpClient.get<HealthCheckResponse>('/system/health')
  }

  // ==================== 文件管理 ====================

  /**
   * 上传文件
   */
  static async uploadFile(file: File, category?: string): Promise<BaseResponse<UploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    if (category) {
      formData.append('category', category)
    }

    return httpClient.upload<UploadResponse>('/files/upload', formData)
  }

  /**
   * 批量上传文件
   */
  static async uploadFiles(
    files: File[],
    category?: string
  ): Promise<BaseResponse<UploadResponse[]>> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    if (category) {
      formData.append('category', category)
    }

    return httpClient.upload<UploadResponse[]>('/files/batch-upload', formData)
  }

  /**
   * 删除文件
   */
  static async deleteFile(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/files/${id}`)
  }

  /**
   * 获取文件列表
   */
  static async getFiles(params?: {
    page?: number
    pageSize?: number
    category?: string
    keyword?: string
  }): Promise<PaginationResponse<UploadResponse>> {
    return httpClient.get<UploadResponse[]>(buildUrl('/files', undefined, params))
  }

  // ==================== 日志管理 ====================

  /**
   * 获取操作日志
   */
  static async getOperationLogs(params?: {
    page?: number
    pageSize?: number
    userId?: string
    action?: string
    resource?: string
    startDate?: string
    endDate?: string
  }): Promise<PaginationResponse<OperationLog>> {
    return httpClient.get<OperationLog[]>(buildUrl('/system/logs/operations', undefined, params))
  }

  /**
   * 获取系统日志
   */
  static async getSystemLogs(params?: {
    page?: number
    pageSize?: number
    level?: 'error' | 'warn' | 'info' | 'debug'
    startDate?: string
    endDate?: string
  }): Promise<
    PaginationResponse<{
      id: string
      level: string
      message: string
      timestamp: string
      metadata?: Record<string, any>
    }>
  > {
    return httpClient.get<
      Array<{
        id: string
        level: string
        message: string
        timestamp: string
        metadata?: Record<string, any>
      }>
    >(buildUrl('/system/logs/system', undefined, params))
  }

  /**
   * 清理日志
   */
  static async clearLogs(
    type: 'operation' | 'system',
    beforeDate?: string
  ): Promise<
    BaseResponse<{
      deletedCount: number
    }>
  > {
    return httpClient.post<{
      deletedCount: number
    }>(`/system/logs/${type}/clear`, { beforeDate })
  }

  // ==================== 通知管理 ====================

  /**
   * 获取通知列表
   */
  static async getNotifications(params?: {
    page?: number
    pageSize?: number
    read?: boolean
    type?: NotificationMessage['type']
  }): Promise<PaginationResponse<NotificationMessage>> {
    return httpClient.get<NotificationMessage[]>(
      buildUrl('/system/notifications', undefined, params)
    )
  }

  /**
   * 标记通知为已读
   */
  static async markNotificationAsRead(id: string): Promise<BaseResponse<null>> {
    return httpClient.patch<null>(`/system/notifications/${id}/read`)
  }

  /**
   * 批量标记已读
   */
  static async markAllAsRead(): Promise<BaseResponse<null>> {
    return httpClient.patch<null>('/system/notifications/read-all')
  }

  /**
   * 删除通知
   */
  static async deleteNotification(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/system/notifications/${id}`)
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(): Promise<
    BaseResponse<{
      count: number
    }>
  > {
    return httpClient.get<{
      count: number
    }>('/system/notifications/unread-count')
  }

  // ==================== 数据管理 ====================

  /**
   * 数据备份
   */
  static async backupData(options?: {
    tables?: string[]
    format?: 'sql' | 'json'
    compress?: boolean
  }): Promise<
    BaseResponse<{
      backupId: string
      filename: string
      size: number
      createdAt: string
    }>
  > {
    return httpClient.post<{
      backupId: string
      filename: string
      size: number
      createdAt: string
    }>('/system/backup', options, {
      timeout: 300000 // 5分钟超时
    })
  }

  /**
   * 数据还原
   */
  static async restoreData(backupId: string): Promise<
    BaseResponse<{
      taskId: string
    }>
  > {
    return httpClient.post<{
      taskId: string
    }>(
      `/system/restore/${backupId}`,
      {},
      {
        timeout: 300000
      }
    )
  }

  /**
   * 获取备份列表
   */
  static async getBackups(): Promise<
    BaseResponse<
      Array<{
        id: string
        filename: string
        size: number
        createdAt: string
        status: 'completed' | 'failed' | 'in_progress'
      }>
    >
  > {
    return httpClient.get<
      Array<{
        id: string
        filename: string
        size: number
        createdAt: string
        status: 'completed' | 'failed' | 'in_progress'
      }>
    >('/system/backups')
  }

  /**
   * 删除备份
   */
  static async deleteBackup(backupId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/system/backups/${backupId}`)
  }

  // ==================== 缓存管理 ====================

  /**
   * 清理缓存
   */
  static async clearCache(type?: 'all' | 'api' | 'static' | 'session'): Promise<
    BaseResponse<{
      clearedItems: number
      freedMemory: number
    }>
  > {
    return httpClient.post<{
      clearedItems: number
      freedMemory: number
    }>('/system/cache/clear', { type })
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats(): Promise<
    BaseResponse<{
      totalItems: number
      totalMemory: number
      hitRate: number
      categories: Record<
        string,
        {
          items: number
          memory: number
        }
      >
    }>
  > {
    return httpClient.get<{
      totalItems: number
      totalMemory: number
      hitRate: number
      categories: Record<
        string,
        {
          items: number
          memory: number
        }
      >
    }>('/system/cache/stats')
  }
}
