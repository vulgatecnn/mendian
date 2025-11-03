/**
 * 拓店管理 API 服务
 */
import request from './request'
import { 
  CandidateLocation,
  CandidateLocationFormData,
  CandidateLocationQueryParams,
  FollowUpRecord,
  FollowUpRecordFormData,
  FollowUpRecordQueryParams,
  SurveyDataParams,
  ProfitCalculationParams,
  ContractInfoParams,
  AbandonFollowUpParams,
  ProfitFormulaConfig,
  LegalEntity,
  PaginatedResponse
} from '../types'
import { useState, useCallback } from 'react'

/**
 * 拓店管理 API 服务类
 */
export class ExpansionService {
  // 候选点位相关接口

  /**
   * 获取候选点位列表
   */
  static async getLocations(params?: CandidateLocationQueryParams): Promise<PaginatedResponse<CandidateLocation>> {
    return request.get('/expansion/locations/', { params })
  }

  /**
   * 获取候选点位详情
   */
  static async getLocationDetail(id: number): Promise<CandidateLocation> {
    return request.get(`/expansion/locations/${id}/`)
  }

  /**
   * 创建候选点位
   */
  static async createLocation(data: CandidateLocationFormData): Promise<CandidateLocation> {
    return request.post('/expansion/locations/', data)
  }

  /**
   * 更新候选点位
   */
  static async updateLocation(id: number, data: Partial<CandidateLocationFormData>): Promise<CandidateLocation> {
    return request.put(`/expansion/locations/${id}/`, data)
  }

  /**
   * 删除候选点位
   */
  static async deleteLocation(id: number): Promise<void> {
    return request.delete(`/expansion/locations/${id}/`)
  }

  // 跟进单相关接口

  /**
   * 获取跟进单列表
   */
  static async getFollowUps(params?: FollowUpRecordQueryParams): Promise<PaginatedResponse<FollowUpRecord>> {
    return request.get('/expansion/follow-ups/', { params })
  }

  /**
   * 获取跟进单详情
   */
  static async getFollowUpDetail(id: number): Promise<FollowUpRecord> {
    return request.get(`/expansion/follow-ups/${id}/`)
  }

  /**
   * 创建跟进单
   */
  static async createFollowUp(data: FollowUpRecordFormData): Promise<FollowUpRecord> {
    return request.post('/expansion/follow-ups/', data)
  }

  /**
   * 更新跟进单
   */
  static async updateFollowUp(id: number, data: Partial<FollowUpRecordFormData>): Promise<FollowUpRecord> {
    return request.put(`/expansion/follow-ups/${id}/`, data)
  }

  /**
   * 录入调研信息
   */
  static async submitSurveyData(id: number, data: SurveyDataParams): Promise<FollowUpRecord> {
    return request.post(`/expansion/follow-ups/${id}/survey/`, data)
  }

  /**
   * 执行盈利测算
   */
  static async calculateProfit(id: number, data: ProfitCalculationParams): Promise<FollowUpRecord> {
    return request.post(`/expansion/follow-ups/${id}/calculate/`, data)
  }

  /**
   * 录入签约信息
   */
  static async submitContractInfo(id: number, data: ContractInfoParams): Promise<FollowUpRecord> {
    return request.post(`/expansion/follow-ups/${id}/contract/`, data)
  }

  /**
   * 标记放弃跟进
   */
  static async abandonFollowUp(id: number, data: AbandonFollowUpParams): Promise<FollowUpRecord> {
    return request.post(`/expansion/follow-ups/${id}/abandon/`, data)
  }

  /**
   * 发起报店审批
   */
  static async submitApproval(id: number): Promise<{ approval_id: number }> {
    return request.post(`/expansion/follow-ups/${id}/submit-approval/`)
  }

  // 盈利测算公式配置

  /**
   * 获取盈利测算公式配置
   */
  static async getProfitFormulas(): Promise<ProfitFormulaConfig[]> {
    return request.get('/expansion/profit-formulas/')
  }

  /**
   * 更新盈利测算公式配置
   */
  static async updateProfitFormula(data: Partial<ProfitFormulaConfig>): Promise<ProfitFormulaConfig> {
    return request.put('/expansion/profit-formulas/', data)
  }

  // 基础数据接口

  /**
   * 获取法人主体列表
   */
  static async getLegalEntities(): Promise<LegalEntity[]> {
    return request.get('/base-data/legal-entities/')
  }
}

/**
 * 拓店管理 Hook - 提供 loading 状态管理
 */
export interface UseExpansionServiceOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function useExpansionService() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 包装 API 调用，自动管理 loading 状态
   */
  const wrapApiCall = useCallback(
    async <T,>(
      apiCall: () => Promise<T>,
      options?: UseExpansionServiceOptions
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

  // 候选点位相关方法
  const getLocations = useCallback(
    (params?: CandidateLocationQueryParams, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.getLocations(params), options)
    },
    [wrapApiCall]
  )

  const getLocationDetail = useCallback(
    (id: number, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.getLocationDetail(id), options)
    },
    [wrapApiCall]
  )

  const createLocation = useCallback(
    (data: CandidateLocationFormData, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.createLocation(data), options)
    },
    [wrapApiCall]
  )

  const updateLocation = useCallback(
    (id: number, data: Partial<CandidateLocationFormData>, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.updateLocation(id, data), options)
    },
    [wrapApiCall]
  )

  const deleteLocation = useCallback(
    (id: number, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.deleteLocation(id), options)
    },
    [wrapApiCall]
  )

  // 跟进单相关方法
  const getFollowUps = useCallback(
    (params?: FollowUpRecordQueryParams, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.getFollowUps(params), options)
    },
    [wrapApiCall]
  )

  const getFollowUpDetail = useCallback(
    (id: number, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.getFollowUpDetail(id), options)
    },
    [wrapApiCall]
  )

  const createFollowUp = useCallback(
    (data: FollowUpRecordFormData, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.createFollowUp(data), options)
    },
    [wrapApiCall]
  )

  const updateFollowUp = useCallback(
    (id: number, data: Partial<FollowUpRecordFormData>, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.updateFollowUp(id, data), options)
    },
    [wrapApiCall]
  )

  const submitSurveyData = useCallback(
    (id: number, data: SurveyDataParams, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.submitSurveyData(id, data), options)
    },
    [wrapApiCall]
  )

  const calculateProfit = useCallback(
    (id: number, data: ProfitCalculationParams, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.calculateProfit(id, data), options)
    },
    [wrapApiCall]
  )

  const submitContractInfo = useCallback(
    (id: number, data: ContractInfoParams, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.submitContractInfo(id, data), options)
    },
    [wrapApiCall]
  )

  const abandonFollowUp = useCallback(
    (id: number, data: AbandonFollowUpParams, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.abandonFollowUp(id, data), options)
    },
    [wrapApiCall]
  )

  const submitApproval = useCallback(
    (id: number, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.submitApproval(id), options)
    },
    [wrapApiCall]
  )

  // 盈利测算公式配置
  const getProfitFormulas = useCallback(
    (options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.getProfitFormulas(), options)
    },
    [wrapApiCall]
  )

  const updateProfitFormula = useCallback(
    (data: Partial<ProfitFormulaConfig>, options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.updateProfitFormula(data), options)
    },
    [wrapApiCall]
  )

  // 基础数据
  const getLegalEntities = useCallback(
    (options?: UseExpansionServiceOptions) => {
      return wrapApiCall(() => ExpansionService.getLegalEntities(), options)
    },
    [wrapApiCall]
  )

  return {
    loading,
    error,
    // 候选点位
    getLocations,
    getLocationDetail,
    createLocation,
    updateLocation,
    deleteLocation,
    // 跟进单
    getFollowUps,
    getFollowUpDetail,
    createFollowUp,
    updateFollowUp,
    submitSurveyData,
    calculateProfit,
    submitContractInfo,
    abandonFollowUp,
    submitApproval,
    // 盈利测算公式
    getProfitFormulas,
    updateProfitFormula,
    // 基础数据
    getLegalEntities
  }
}

export default ExpansionService