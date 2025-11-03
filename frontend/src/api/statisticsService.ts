/**
 * 统计分析 API 服务
 */
import request from './request'
import { 
  DashboardData,
  AnalysisReport,
  ReportQueryParams
} from '../types'
import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * 缓存配置
 */
interface CacheConfig {
  enabled: boolean
  ttl: number // 缓存有效期（毫秒）
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * 统计分析 API 服务类
 */
export class StatisticsService {
  // 缓存存储
  private static cache = new Map<string, CacheEntry<any>>()
  
  // 默认缓存配置
  private static defaultCacheConfig: CacheConfig = {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5分钟
  }

  /**
   * 生成缓存键
   */
  private static getCacheKey(endpoint: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramStr}`
  }

  /**
   * 从缓存获取数据
   */
  private static getFromCache<T>(key: string, config: CacheConfig): T | null {
    if (!config.enabled) {
      return null
    }

    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > config.ttl) {
      // 缓存过期，删除
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * 保存数据到缓存
   */
  private static saveToCache<T>(key: string, data: T, config: CacheConfig): void {
    if (!config.enabled) {
      return
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 清除缓存
   */
  static clearCache(pattern?: string): void {
    if (pattern) {
      // 清除匹配模式的缓存
      const keys = Array.from(this.cache.keys())
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      })
    } else {
      // 清除所有缓存
      this.cache.clear()
    }
  }

  /**
   * 获取仪表板数据
   */
  static async getDashboard(config?: Partial<CacheConfig>): Promise<DashboardData> {
    const cacheConfig = { ...this.defaultCacheConfig, ...config }
    const cacheKey = this.getCacheKey('/store-planning/dashboard/')

    // 尝试从缓存获取
    const cached = this.getFromCache<DashboardData>(cacheKey, cacheConfig)
    if (cached) {
      return cached
    }

    // 从服务器获取
    const data: DashboardData = await request.get('/store-planning/dashboard/')
    
    // 保存到缓存
    this.saveToCache(cacheKey, data, cacheConfig)
    
    return data
  }

  /**
   * 获取分析报表
   */
  static async getReport(
    params?: ReportQueryParams,
    config?: Partial<CacheConfig>
  ): Promise<AnalysisReport> {
    const cacheConfig = { ...this.defaultCacheConfig, ...config }
    const cacheKey = this.getCacheKey('/store-planning/reports/', params)

    // 尝试从缓存获取
    const cached = this.getFromCache<AnalysisReport>(cacheKey, cacheConfig)
    if (cached) {
      return cached
    }

    // 从服务器获取
    const data: AnalysisReport = await request.get('/store-planning/reports/', { params })
    
    // 保存到缓存
    this.saveToCache(cacheKey, data, cacheConfig)
    
    return data
  }

  /**
   * 导出报表为 Excel
   */
  static async exportReport(params?: ReportQueryParams): Promise<Blob> {
    return request.get('/store-planning/reports/export/', {
      params,
      responseType: 'blob'
    })
  }
}

/**
 * 统计分析 Hook - 提供 loading 状态管理和自动刷新
 */
export interface UseStatisticsServiceOptions {
  autoRefresh?: boolean // 是否自动刷新
  refreshInterval?: number // 刷新间隔（毫秒）
  cacheEnabled?: boolean // 是否启用缓存
  cacheTTL?: number // 缓存有效期（毫秒）
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function useStatisticsService(options?: UseStatisticsServiceOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    autoRefresh = false,
    refreshInterval = 60000, // 默认1分钟
    cacheEnabled = true,
    cacheTTL = 5 * 60 * 1000, // 默认5分钟
    onSuccess,
    onError
  } = options || {}

  /**
   * 包装 API 调用，自动管理 loading 状态
   */
  const wrapApiCall = useCallback(
    async <T,>(
      apiCall: () => Promise<T>
    ): Promise<T | null> => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await apiCall()
        onSuccess?.(result)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [onSuccess, onError]
  )

  /**
   * 获取仪表板数据
   */
  const getDashboard = useCallback(
    () => {
      return wrapApiCall(() => 
        StatisticsService.getDashboard({ 
          enabled: cacheEnabled, 
          ttl: cacheTTL 
        })
      )
    },
    [wrapApiCall, cacheEnabled, cacheTTL]
  )

  /**
   * 获取分析报表
   */
  const getReport = useCallback(
    (params?: ReportQueryParams) => {
      return wrapApiCall(() => 
        StatisticsService.getReport(params, { 
          enabled: cacheEnabled, 
          ttl: cacheTTL 
        })
      )
    },
    [wrapApiCall, cacheEnabled, cacheTTL]
  )

  /**
   * 导出报表
   */
  const exportReport = useCallback(
    (params?: ReportQueryParams) => {
      return wrapApiCall(() => StatisticsService.exportReport(params))
    },
    [wrapApiCall]
  )

  /**
   * 刷新数据（清除缓存）
   */
  const refresh = useCallback(() => {
    StatisticsService.clearCache()
  }, [])

  /**
   * 清除特定缓存
   */
  const clearCache = useCallback((pattern?: string) => {
    StatisticsService.clearCache(pattern)
  }, [])

  /**
   * 设置自动刷新
   */
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        refresh()
      }, refreshInterval)

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current)
        }
      }
    }
  }, [autoRefresh, refreshInterval, refresh])

  return {
    loading,
    error,
    getDashboard,
    getReport,
    exportReport,
    refresh,
    clearCache
  }
}

export default StatisticsService
