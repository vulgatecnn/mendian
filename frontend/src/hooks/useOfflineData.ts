/**
 * 离线数据管理 Hook
 * 结合网络状态和缓存管理，提供离线数据访问能力
 */
import { useState, useEffect, useCallback } from 'react'
import { Message } from '@arco-design/web-react'
import { offlineCache, CACHE_STORES, CACHE_EXPIRY } from '../utils/offlineCache'
import { useNetworkStatus } from './useNetworkStatus'

/**
 * Hook 选项
 */
interface UseOfflineDataOptions<T> {
  storeName: string
  cacheKey: string
  fetchFn: () => Promise<T>
  expiresIn?: number
  autoFetch?: boolean
  onError?: (error: Error) => void
}

/**
 * 离线数据管理 Hook
 */
export function useOfflineData<T>(options: UseOfflineDataOptions<T>) {
  const {
    storeName,
    cacheKey,
    fetchFn,
    expiresIn = CACHE_EXPIRY.MEDIUM,
    autoFetch = true,
    onError
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const { isOnline, isOffline } = useNetworkStatus({ showNotification: false })

  /**
   * 从缓存加载数据
   */
  const loadFromCache = useCallback(async () => {
    try {
      const cachedData = await offlineCache.get<T>(storeName, cacheKey)
      if (cachedData) {
        setData(cachedData)
        setFromCache(true)
        return true
      }
      return false
    } catch (error) {
      console.error('从缓存加载数据失败:', error)
      return false
    }
  }, [storeName, cacheKey])

  /**
   * 从网络获取数据
   */
  const fetchFromNetwork = useCallback(async () => {
    if (!isOnline) {
      Message.warning('网络未连接，使用缓存数据')
      return false
    }

    setLoading(true)
    try {
      const freshData = await fetchFn()
      setData(freshData)
      setFromCache(false)

      // 保存到缓存
      await offlineCache.set(storeName, cacheKey, freshData, expiresIn)
      
      return true
    } catch (error) {
      console.error('从网络获取数据失败:', error)
      onError?.(error as Error)
      
      // 网络请求失败，尝试使用缓存
      const hasCachedData = await loadFromCache()
      if (hasCachedData) {
        Message.info('网络请求失败，已加载缓存数据')
      } else {
        Message.error('加载数据失败')
      }
      
      return false
    } finally {
      setLoading(false)
    }
  }, [isOnline, fetchFn, storeName, cacheKey, expiresIn, loadFromCache, onError])

  /**
   * 刷新数据
   */
  const refresh = useCallback(async (forceNetwork = false) => {
    if (forceNetwork || isOnline) {
      return await fetchFromNetwork()
    } else {
      return await loadFromCache()
    }
  }, [isOnline, fetchFromNetwork, loadFromCache])

  /**
   * 清除缓存
   */
  const clearCache = useCallback(async () => {
    try {
      await offlineCache.delete(storeName, cacheKey)
      Message.success('缓存已清除')
    } catch (error) {
      console.error('清除缓存失败:', error)
      Message.error('清除缓存失败')
    }
  }, [storeName, cacheKey])

  /**
   * 初始化数据加载
   */
  useEffect(() => {
    if (!autoFetch) return

    const initData = async () => {
      // 先尝试从缓存加载
      const hasCachedData = await loadFromCache()

      // 如果在线，尝试从网络获取最新数据
      if (isOnline) {
        await fetchFromNetwork()
      } else if (!hasCachedData) {
        Message.warning('网络未连接且无缓存数据')
      }
    }

    initData()
  }, [autoFetch, isOnline, loadFromCache, fetchFromNetwork])

  /**
   * 网络状态变化时的处理
   */
  useEffect(() => {
    // 从离线恢复到在线时，自动刷新数据
    if (isOnline && data && fromCache) {
      fetchFromNetwork()
    }
  }, [isOnline, data, fromCache, fetchFromNetwork])

  return {
    data,
    loading,
    fromCache,
    isOffline,
    refresh,
    clearCache
  }
}

/**
 * 计划列表离线数据 Hook
 */
export function useOfflinePlans() {
  return useOfflineData({
    storeName: CACHE_STORES.PLANS,
    cacheKey: 'plan_list',
    fetchFn: async () => {
      const { PlanService } = await import('../api/planService')
      return PlanService.getPlans({ page_size: 50 })
    },
    expiresIn: CACHE_EXPIRY.MEDIUM
  })
}

/**
 * 计划详情离线数据 Hook
 */
export function useOfflinePlanDetail(planId: number) {
  return useOfflineData({
    storeName: CACHE_STORES.PLANS,
    cacheKey: `plan_detail_${planId}`,
    fetchFn: async () => {
      const { PlanService } = await import('../api/planService')
      return PlanService.getPlanDetail(planId)
    },
    expiresIn: CACHE_EXPIRY.SHORT
  })
}

/**
 * 经营区域离线数据 Hook
 */
export function useOfflineRegions() {
  return useOfflineData({
    storeName: CACHE_STORES.REGIONS,
    cacheKey: 'regions',
    fetchFn: async () => {
      const { PlanService } = await import('../api/planService')
      return PlanService.getRegions()
    },
    expiresIn: CACHE_EXPIRY.LONG
  })
}

/**
 * 门店类型离线数据 Hook
 */
export function useOfflineStoreTypes() {
  return useOfflineData({
    storeName: CACHE_STORES.STORE_TYPES,
    cacheKey: 'store_types',
    fetchFn: async () => {
      const { PlanService } = await import('../api/planService')
      return PlanService.getStoreTypes()
    },
    expiresIn: CACHE_EXPIRY.LONG
  })
}

export default useOfflineData
