/**
 * 开店计划管理 API 服务
 */
import request from './request'
import { 
  StorePlan,
  StorePlanFormData,
  StorePlanQueryParams,
  PlanCancelParams,
  PlanProgress,
  PlanStatistics,
  PaginatedResponse,
  BusinessRegion,
  StoreType
} from '../types'
import { useState, useCallback } from 'react'

/**
 * 计划管理 API 服务类
 */
export class PlanService {
  /**
   * 获取计划列表
   */
  static async getPlans(params?: StorePlanQueryParams): Promise<PaginatedResponse<StorePlan>> {
    return request.get('/store-planning/plans/', { params })
  }

  /**
   * 获取计划详情
   */
  static async getPlanDetail(id: number): Promise<StorePlan> {
    return request.get(`/store-planning/plans/${id}/`)
  }

  /**
   * 创建计划
   */
  static async createPlan(data: StorePlanFormData): Promise<StorePlan> {
    return request.post('/store-planning/plans/', data)
  }

  /**
   * 更新计划
   */
  static async updatePlan(id: number, data: Partial<StorePlanFormData>): Promise<StorePlan> {
    return request.put(`/store-planning/plans/${id}/`, data)
  }

  /**
   * 删除计划
   */
  static async deletePlan(id: number): Promise<void> {
    return request.delete(`/store-planning/plans/${id}/`)
  }

  /**
   * 发布计划
   */
  static async publishPlan(id: number): Promise<StorePlan> {
    return request.post(`/store-planning/plans/${id}/publish/`)
  }

  /**
   * 取消计划
   */
  static async cancelPlan(id: number, params: PlanCancelParams): Promise<StorePlan> {
    return request.post(`/store-planning/plans/${id}/cancel/`, params)
  }

  /**
   * 获取计划执行进度
   */
  static async getPlanProgress(id: number): Promise<PlanProgress> {
    return request.get(`/store-planning/plans/${id}/progress/`)
  }

  /**
   * 获取计划统计数据
   */
  static async getPlanStatistics(id: number): Promise<PlanStatistics> {
    return request.get(`/store-planning/plans/${id}/statistics/`)
  }

  /**
   * 获取经营区域列表
   */
  static async getRegions(): Promise<BusinessRegion[]> {
    return request.get('/store-planning/regions/')
  }

  /**
   * 获取门店类型列表
   */
  static async getStoreTypes(): Promise<StoreType[]> {
    return request.get('/store-planning/store-types/')
  }
}

/**
 * 计划管理 Hook - 提供 loading 状态管理
 */
export interface UsePlanServiceOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function usePlanService() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 包装 API 调用，自动管理 loading 状态
   */
  const wrapApiCall = useCallback(
    async <T,>(
      apiCall: () => Promise<T>,
      options?: UsePlanServiceOptions
    ): Promise<T | null> => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await apiCall()
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        options?.onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * 获取计划列表
   */
  const getPlans = useCallback(
    (params?: StorePlanQueryParams, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.getPlans(params), options)
    },
    [wrapApiCall]
  )

  /**
   * 获取计划详情
   */
  const getPlanDetail = useCallback(
    (id: number, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.getPlanDetail(id), options)
    },
    [wrapApiCall]
  )

  /**
   * 创建计划
   */
  const createPlan = useCallback(
    (data: StorePlanFormData, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.createPlan(data), options)
    },
    [wrapApiCall]
  )

  /**
   * 更新计划
   */
  const updatePlan = useCallback(
    (id: number, data: Partial<StorePlanFormData>, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.updatePlan(id, data), options)
    },
    [wrapApiCall]
  )

  /**
   * 删除计划
   */
  const deletePlan = useCallback(
    (id: number, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.deletePlan(id), options)
    },
    [wrapApiCall]
  )

  /**
   * 发布计划
   */
  const publishPlan = useCallback(
    (id: number, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.publishPlan(id), options)
    },
    [wrapApiCall]
  )

  /**
   * 取消计划
   */
  const cancelPlan = useCallback(
    (id: number, params: PlanCancelParams, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.cancelPlan(id, params), options)
    },
    [wrapApiCall]
  )

  /**
   * 获取计划执行进度
   */
  const getPlanProgress = useCallback(
    (id: number, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.getPlanProgress(id), options)
    },
    [wrapApiCall]
  )

  /**
   * 获取计划统计数据
   */
  const getPlanStatistics = useCallback(
    (id: number, options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.getPlanStatistics(id), options)
    },
    [wrapApiCall]
  )

  /**
   * 获取经营区域列表
   */
  const getRegions = useCallback(
    (options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.getRegions(), options)
    },
    [wrapApiCall]
  )

  /**
   * 获取门店类型列表
   */
  const getStoreTypes = useCallback(
    (options?: UsePlanServiceOptions) => {
      return wrapApiCall(() => PlanService.getStoreTypes(), options)
    },
    [wrapApiCall]
  )

  return {
    loading,
    error,
    getPlans,
    getPlanDetail,
    createPlan,
    updatePlan,
    deletePlan,
    publishPlan,
    cancelPlan,
    getPlanProgress,
    getPlanStatistics,
    getRegions,
    getStoreTypes
  }
}

export default PlanService
