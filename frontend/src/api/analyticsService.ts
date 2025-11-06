/**
 * 数据分析 API 服务
 */
// import request from './request' // 暂时注释，使用模拟数据
import { useState, useCallback, useEffect, useRef } from 'react'

// 数据分析相关类型定义
export interface StoreMapData {
  stores: StoreLocation[]
  regions: RegionStatistics[]
  mapCenter: [number, number]
  zoomLevel: number
  lastUpdated: string
}

export interface StoreLocation {
  id: string
  name: string
  coordinates: [number, number] // 经纬度
  status: 'planned' | 'expanding' | 'preparing' | 'opened'
  region: string
  storeType: string
  openDate?: string
  address: string
  progress?: number
}

export interface RegionStatistics {
  regionId: string
  regionName: string
  totalStores: number
  statusCounts: {
    planned: number
    expanding: number
    preparing: number
    opened: number
  }
}

export interface FunnelData {
  stages: FunnelStage[]
  conversionRates: number[]
  totalCount: number
  timeRange: DateRange
  lastUpdated: string
}

export interface FunnelStage {
  name: string
  count: number
  percentage: number
  isWarning: boolean
  details?: {
    avgDuration: number
    successRate: number
  }
}

export interface PlanProgressData {
  plans: PlanProgressItem[]
  summary: {
    totalTarget: number
    totalCompleted: number
    overallProgress: number
  }
  byContributionType: ContributionTypeProgress[]
  lastUpdated: string
}

export interface PlanProgressItem {
  planId: number
  planName: string
  contributionType: string
  targetCount: number
  completedCount: number
  progressRate: number
  status: 'on_track' | 'at_risk' | 'delayed'
}

export interface ContributionTypeProgress {
  type: string
  typeName: string
  totalTarget: number
  totalCompleted: number
  progressRate: number
  planCount: number
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface DashboardOverviewData {
  storeMap: StoreMapData
  followUpFunnel: FunnelData
  planProgress: PlanProgressData
  lastUpdated: string
}

export interface DataFilters {
  dateRange?: DateRange
  regionIds?: number[]
  storeTypes?: string[]
  contributionTypes?: string[]
}

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
 * 数据分析 API 服务类
 */
export class AnalyticsService {
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
   * 获取经营大屏概览数据
   */
  static async getDashboardOverview(
    filters?: DataFilters,
    config?: Partial<CacheConfig>
  ): Promise<DashboardOverviewData> {
    const cacheConfig = { ...this.defaultCacheConfig, ...config }
    const cacheKey = this.getCacheKey('/api/analytics/dashboard/', filters)

    // 尝试从缓存获取
    const cached = this.getFromCache<DashboardOverviewData>(cacheKey, cacheConfig)
    if (cached) {
      return cached
    }

    // 模拟API调用
    const { mockDashboardOverviewData, filterMockData, simulateApiDelay } = await import('./mockAnalyticsData')
    await simulateApiDelay(800) // 模拟网络延迟
    
    const data = filters ? filterMockData(mockDashboardOverviewData, filters) : mockDashboardOverviewData
    
    // 保存到缓存
    this.saveToCache(cacheKey, data, cacheConfig)
    
    return data
  }

  /**
   * 获取开店地图数据
   */
  static async getStoreMapData(
    filters?: DataFilters,
    config?: Partial<CacheConfig>
  ): Promise<StoreMapData> {
    const cacheConfig = { ...this.defaultCacheConfig, ...config }
    const cacheKey = this.getCacheKey('/api/analytics/store-map/', filters)

    // 尝试从缓存获取
    const cached = this.getFromCache<StoreMapData>(cacheKey, cacheConfig)
    if (cached) {
      return cached
    }

    // 模拟API调用
    const { mockStoreMapData, simulateApiDelay } = await import('./mockAnalyticsData')
    await simulateApiDelay(600)
    
    // 保存到缓存
    this.saveToCache(cacheKey, mockStoreMapData, cacheConfig)
    
    return mockStoreMapData
  }

  /**
   * 获取跟进漏斗数据
   */
  static async getFollowUpFunnelData(
    filters?: DataFilters,
    config?: Partial<CacheConfig>
  ): Promise<FunnelData> {
    const cacheConfig = { ...this.defaultCacheConfig, ...config }
    const cacheKey = this.getCacheKey('/api/analytics/follow-up-funnel/', filters)

    // 尝试从缓存获取
    const cached = this.getFromCache<FunnelData>(cacheKey, cacheConfig)
    if (cached) {
      return cached
    }

    // 模拟API调用
    const { mockFunnelData, simulateApiDelay } = await import('./mockAnalyticsData')
    await simulateApiDelay(700)
    
    // 保存到缓存
    this.saveToCache(cacheKey, mockFunnelData, cacheConfig)
    
    return mockFunnelData
  }

  /**
   * 获取计划完成进度数据
   */
  static async getPlanProgressData(
    filters?: DataFilters,
    config?: Partial<CacheConfig>
  ): Promise<PlanProgressData> {
    const cacheConfig = { ...this.defaultCacheConfig, ...config }
    const cacheKey = this.getCacheKey('/api/analytics/plan-progress/', filters)

    // 尝试从缓存获取
    const cached = this.getFromCache<PlanProgressData>(cacheKey, cacheConfig)
    if (cached) {
      return cached
    }

    // 模拟API调用
    const { mockPlanProgressData, simulateApiDelay } = await import('./mockAnalyticsData')
    await simulateApiDelay(650)
    
    // 保存到缓存
    this.saveToCache(cacheKey, mockPlanProgressData, cacheConfig)
    
    return mockPlanProgressData
  }
}

/**
 * 数据分析 Hook - 提供 loading 状态管理和自动刷新
 */
export interface UseAnalyticsServiceOptions {
  autoRefresh?: boolean // 是否自动刷新
  refreshInterval?: number // 刷新间隔（毫秒）
  cacheEnabled?: boolean // 是否启用缓存
  cacheTTL?: number // 缓存有效期（毫秒）
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function useAnalyticsService(options?: UseAnalyticsServiceOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    autoRefresh = false,
    refreshInterval = 300000, // 默认5分钟
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
   * 获取经营大屏概览数据
   */
  const getDashboardOverview = useCallback(
    (filters?: DataFilters) => {
      return wrapApiCall(() => 
        AnalyticsService.getDashboardOverview(filters, { 
          enabled: cacheEnabled, 
          ttl: cacheTTL 
        })
      )
    },
    [wrapApiCall, cacheEnabled, cacheTTL]
  )

  /**
   * 获取开店地图数据
   */
  const getStoreMapData = useCallback(
    (filters?: DataFilters) => {
      return wrapApiCall(() => 
        AnalyticsService.getStoreMapData(filters, { 
          enabled: cacheEnabled, 
          ttl: cacheTTL 
        })
      )
    },
    [wrapApiCall, cacheEnabled, cacheTTL]
  )

  /**
   * 获取跟进漏斗数据
   */
  const getFollowUpFunnelData = useCallback(
    (filters?: DataFilters) => {
      return wrapApiCall(() => 
        AnalyticsService.getFollowUpFunnelData(filters, { 
          enabled: cacheEnabled, 
          ttl: cacheTTL 
        })
      )
    },
    [wrapApiCall, cacheEnabled, cacheTTL]
  )

  /**
   * 获取计划完成进度数据
   */
  const getPlanProgressData = useCallback(
    (filters?: DataFilters) => {
      return wrapApiCall(() => 
        AnalyticsService.getPlanProgressData(filters, { 
          enabled: cacheEnabled, 
          ttl: cacheTTL 
        })
      )
    },
    [wrapApiCall, cacheEnabled, cacheTTL]
  )

  /**
   * 刷新数据（清除缓存）
   */
  const refresh = useCallback(() => {
    AnalyticsService.clearCache()
  }, [])

  /**
   * 清除特定缓存
   */
  const clearCache = useCallback((pattern?: string) => {
    AnalyticsService.clearCache(pattern)
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
    getDashboardOverview,
    getStoreMapData,
    getFollowUpFunnelData,
    getPlanProgressData,
    refresh,
    clearCache
  }
}

export default AnalyticsService