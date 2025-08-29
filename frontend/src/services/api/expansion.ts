import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse,
  BatchOperationParams,
  GeoLocation
} from '../types'
import type {
  CandidateLocation,
  FollowUpRecord,
  BusinessCondition
} from '../types/business'

// 候选点位查询参数
export interface CandidateLocationQueryParams {
  page?: number
  pageSize?: number
  name?: string
  status?: CandidateLocation['status']
  propertyType?: CandidateLocation['propertyType']
  regionId?: string
  minArea?: number
  maxArea?: number
  minRent?: number
  maxRent?: number
  hasElevator?: boolean
  evaluationScore?: [number, number] // 评分范围
  discoveredBy?: string
  startDate?: string
  endDate?: string
  keyword?: string
}

// 跟进记录查询参数
export interface FollowUpQueryParams {
  page?: number
  pageSize?: number
  candidateLocationId?: string
  type?: FollowUpRecord['type']
  responsible?: string
  startDate?: string
  endDate?: string
  keyword?: string
}

// 商务条件查询参数
export interface BusinessConditionQueryParams {
  page?: number
  pageSize?: number
  candidateLocationId?: string
  type?: BusinessCondition['type']
  status?: BusinessCondition['status']
  minAmount?: number
  maxAmount?: number
}

/**
 * 拓店管理API服务
 */
export class ExpansionApiService {
  // ==================== 候选点位管理 ====================

  /**
   * 获取候选点位列表
   */
  static async getCandidateLocations(
    params?: CandidateLocationQueryParams
  ): Promise<PaginationResponse<CandidateLocation>> {
    return httpClient.get<CandidateLocation[]>(
      buildUrl(API_PATHS.EXPANSION.CANDIDATES, undefined, params)
    )
  }

  /**
   * 获取候选点位详情
   */
  static async getCandidateLocation(id: string): Promise<BaseResponse<CandidateLocation>> {
    return httpClient.get<CandidateLocation>(buildUrl(API_PATHS.EXPANSION.CANDIDATE_DETAIL, { id }))
  }

  /**
   * 创建候选点位
   */
  static async createCandidateLocation(data: {
    name: string
    address: string
    location: GeoLocation
    area: number
    rentPrice: number
    transferFee?: number
    deposit?: number
    propertyType: CandidateLocation['propertyType']
    floorLevel: number
    hasElevator: boolean
    parkingSpaces?: number
    photos?: string[]
    videos?: string[]
    notes?: string
  }): Promise<BaseResponse<CandidateLocation>> {
    return httpClient.post<CandidateLocation>(API_PATHS.EXPANSION.CREATE_CANDIDATE, data, {
      timeout: 15000
    })
  }

  /**
   * 更新候选点位
   */
  static async updateCandidateLocation(
    id: string,
    data: Partial<{
      name: string
      address: string
      location: GeoLocation
      area: number
      rentPrice: number
      transferFee?: number
      deposit?: number
      propertyType: CandidateLocation['propertyType']
      floorLevel: number
      hasElevator: boolean
      parkingSpaces?: number
      status: CandidateLocation['status']
      photos?: string[]
      videos?: string[]
      notes?: string
    }>
  ): Promise<BaseResponse<CandidateLocation>> {
    return httpClient.put<CandidateLocation>(
      buildUrl(API_PATHS.EXPANSION.UPDATE_CANDIDATE, { id }),
      data
    )
  }

  /**
   * 删除候选点位
   */
  static async deleteCandidateLocation(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.EXPANSION.DELETE_CANDIDATE, { id }))
  }

  /**
   * 批量操作候选点位
   */
  static async batchOperationCandidates(params: BatchOperationParams): Promise<
    BaseResponse<{
      successCount: number
      failureCount: number
      errors?: Array<{ id: string; message: string }>
    }>
  > {
    return httpClient.post<{
      successCount: number
      failureCount: number
      errors?: Array<{ id: string; message: string }>
    }>('/expansion/candidates/batch', params, {
      timeout: 30000
    })
  }

  /**
   * 上传点位照片
   */
  static async uploadPhotos(
    id: string,
    files: File[]
  ): Promise<
    BaseResponse<{
      photos: Array<{
        id: string
        url: string
        originalName: string
      }>
    }>
  > {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`photos`, file)
    })

    return httpClient.upload<{
      photos: Array<{
        id: string
        url: string
        originalName: string
      }>
    }>(`${buildUrl(API_PATHS.EXPANSION.CANDIDATE_DETAIL, { id })}/photos`, formData)
  }

  /**
   * 删除点位照片
   */
  static async deletePhoto(id: string, photoId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(
      `${buildUrl(API_PATHS.EXPANSION.CANDIDATE_DETAIL, { id })}/photos/${photoId}`
    )
  }

  /**
   * 上传点位视频
   */
  static async uploadVideos(
    id: string,
    files: File[]
  ): Promise<
    BaseResponse<{
      videos: Array<{
        id: string
        url: string
        originalName: string
        duration?: number
      }>
    }>
  > {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`videos`, file)
    })

    return httpClient.upload<{
      videos: Array<{
        id: string
        url: string
        originalName: string
        duration?: number
      }>
    }>(`${buildUrl(API_PATHS.EXPANSION.CANDIDATE_DETAIL, { id })}/videos`, formData, {
      timeout: 120000 // 视频上传超时时间更长
    })
  }

  /**
   * 删除点位视频
   */
  static async deleteVideo(id: string, videoId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(
      `${buildUrl(API_PATHS.EXPANSION.CANDIDATE_DETAIL, { id })}/videos/${videoId}`
    )
  }

  // ==================== 跟进记录管理 ====================

  /**
   * 获取跟进记录列表
   */
  static async getFollowUps(
    params?: FollowUpQueryParams
  ): Promise<PaginationResponse<FollowUpRecord>> {
    return httpClient.get<FollowUpRecord[]>(
      buildUrl(API_PATHS.EXPANSION.FOLLOW_UPS, undefined, params)
    )
  }

  /**
   * 创建跟进记录
   */
  static async createFollowUp(data: {
    candidateLocationId: string
    type: FollowUpRecord['type']
    content: string
    nextAction?: string
    nextActionDate?: string
    attachments?: string[]
  }): Promise<BaseResponse<FollowUpRecord>> {
    return httpClient.post<FollowUpRecord>(API_PATHS.EXPANSION.CREATE_FOLLOW_UP, data)
  }

  /**
   * 更新跟进记录
   */
  static async updateFollowUp(
    id: string,
    data: {
      type?: FollowUpRecord['type']
      content?: string
      nextAction?: string
      nextActionDate?: string
      attachments?: string[]
    }
  ): Promise<BaseResponse<FollowUpRecord>> {
    return httpClient.put<FollowUpRecord>(
      buildUrl(API_PATHS.EXPANSION.UPDATE_FOLLOW_UP, { id }),
      data
    )
  }

  /**
   * 删除跟进记录
   */
  static async deleteFollowUp(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/expansion/follow-ups/${id}`)
  }

  /**
   * 获取点位的跟进记录
   */
  static async getCandidateFollowUps(
    candidateId: string,
    params?: {
      page?: number
      pageSize?: number
      type?: FollowUpRecord['type']
    }
  ): Promise<PaginationResponse<FollowUpRecord>> {
    return httpClient.get<FollowUpRecord[]>(
      buildUrl(`/expansion/candidates/${candidateId}/follow-ups`, undefined, params)
    )
  }

  // ==================== 商务条件管理 ====================

  /**
   * 获取商务条件列表
   */
  static async getBusinessConditions(
    params?: BusinessConditionQueryParams
  ): Promise<PaginationResponse<BusinessCondition>> {
    return httpClient.get<BusinessCondition[]>(
      buildUrl(API_PATHS.EXPANSION.BUSINESS_CONDITIONS, undefined, params)
    )
  }

  /**
   * 创建商务条件
   */
  static async createBusinessCondition(data: {
    candidateLocationId: string
    type: BusinessCondition['type']
    description: string
    amount: number
    negotiable: boolean
    notes?: string
  }): Promise<BaseResponse<BusinessCondition>> {
    return httpClient.post<BusinessCondition>('/expansion/business-conditions', data)
  }

  /**
   * 更新商务条件
   */
  static async updateBusinessCondition(
    id: string,
    data: {
      description?: string
      amount?: number
      negotiable?: boolean
      status?: BusinessCondition['status']
      notes?: string
    }
  ): Promise<BaseResponse<BusinessCondition>> {
    return httpClient.put<BusinessCondition>(`/expansion/business-conditions/${id}`, data)
  }

  /**
   * 删除商务条件
   */
  static async deleteBusinessCondition(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/expansion/business-conditions/${id}`)
  }

  /**
   * 获取点位的商务条件
   */
  static async getCandidateBusinessConditions(
    candidateId: string
  ): Promise<BaseResponse<BusinessCondition[]>> {
    return httpClient.get<BusinessCondition[]>(
      `/expansion/candidates/${candidateId}/business-conditions`
    )
  }

  // ==================== 竞品分析 ====================

  /**
   * 添加竞品信息
   */
  static async addCompetitor(
    candidateId: string,
    data: {
      name: string
      brand: string
      distance: number
      businessType: string
      estimatedRevenue?: number
      notes?: string
    }
  ): Promise<
    BaseResponse<{
      id: string
      name: string
      brand: string
      distance: number
      businessType: string
      estimatedRevenue?: number
    }>
  > {
    return httpClient.post<{
      id: string
      name: string
      brand: string
      distance: number
      businessType: string
      estimatedRevenue?: number
    }>(`/expansion/candidates/${candidateId}/competitors`, data)
  }

  /**
   * 更新竞品信息
   */
  static async updateCompetitor(
    candidateId: string,
    competitorId: string,
    data: {
      name?: string
      brand?: string
      distance?: number
      businessType?: string
      estimatedRevenue?: number
      notes?: string
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.put<null>(
      `/expansion/candidates/${candidateId}/competitors/${competitorId}`,
      data
    )
  }

  /**
   * 删除竞品信息
   */
  static async deleteCompetitor(
    candidateId: string,
    competitorId: string
  ): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(
      `/expansion/candidates/${candidateId}/competitors/${competitorId}`
    )
  }

  // ==================== 点位评估 ====================

  /**
   * 创建/更新点位评估
   */
  static async evaluateLocation(
    candidateId: string,
    data: {
      overallScore: number
      locationScore: number
      trafficScore: number
      competitionScore: number
      rentabilityScore: number
      notes?: string
    }
  ): Promise<
    BaseResponse<{
      overallScore: number
      locationScore: number
      trafficScore: number
      competitionScore: number
      rentabilityScore: number
      notes?: string
      evaluatedBy: string
      evaluatedByName: string
      evaluatedAt: string
    }>
  > {
    return httpClient.post<{
      overallScore: number
      locationScore: number
      trafficScore: number
      competitionScore: number
      rentabilityScore: number
      notes?: string
      evaluatedBy: string
      evaluatedByName: string
      evaluatedAt: string
    }>(`/expansion/candidates/${candidateId}/evaluation`, data)
  }

  /**
   * 获取评估历史
   */
  static async getEvaluationHistory(candidateId: string): Promise<
    BaseResponse<
      Array<{
        id: string
        overallScore: number
        locationScore: number
        trafficScore: number
        competitionScore: number
        rentabilityScore: number
        notes?: string
        evaluatedBy: string
        evaluatedByName: string
        evaluatedAt: string
      }>
    >
  > {
    return httpClient.get<
      Array<{
        id: string
        overallScore: number
        locationScore: number
        trafficScore: number
        competitionScore: number
        rentabilityScore: number
        notes?: string
        evaluatedBy: string
        evaluatedByName: string
        evaluatedAt: string
      }>
    >(`/expansion/candidates/${candidateId}/evaluation/history`)
  }

  // ==================== 地图和位置服务 ====================

  /**
   * 获取附近的候选点位
   */
  static async getNearbyLocations(params: {
    longitude: number
    latitude: number
    radius: number // 半径(米)
    limit?: number
    excludeIds?: string[]
  }): Promise<
    BaseResponse<
      Array<{
        id: string
        name: string
        address: string
        location: GeoLocation
        distance: number
        status: CandidateLocation['status']
      }>
    >
  > {
    return httpClient.get<
      Array<{
        id: string
        name: string
        address: string
        location: GeoLocation
        distance: number
        status: CandidateLocation['status']
      }>
    >(buildUrl('/expansion/candidates/nearby', undefined, params))
  }

  /**
   * 地址解析为坐标
   */
  static async geocodeAddress(address: string): Promise<BaseResponse<GeoLocation>> {
    return httpClient.get<GeoLocation>(buildUrl('/expansion/geocode', undefined, { address }))
  }

  /**
   * 坐标解析为地址
   */
  static async reverseGeocode(
    longitude: number,
    latitude: number
  ): Promise<BaseResponse<GeoLocation>> {
    return httpClient.get<GeoLocation>(
      buildUrl('/expansion/reverse-geocode', undefined, { longitude, latitude })
    )
  }

  // ==================== 统计和分析 ====================

  /**
   * 获取拓店统计
   */
  static async getExpansionStats(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    regionId?: string
    discoveredBy?: string
    startDate?: string
    endDate?: string
  }): Promise<
    BaseResponse<{
      total: number
      byStatus: Record<CandidateLocation['status'], number>
      byPropertyType: Record<CandidateLocation['propertyType'], number>
      byRegion: Record<string, number>
      timeline: Array<{
        date: string
        discovered: number
        signed: number
      }>
      averageRent: number
      averageArea: number
      averageEvaluationScore: number
    }>
  > {
    return httpClient.get<{
      total: number
      byStatus: Record<CandidateLocation['status'], number>
      byPropertyType: Record<CandidateLocation['propertyType'], number>
      byRegion: Record<string, number>
      timeline: Array<{
        date: string
        discovered: number
        signed: number
      }>
      averageRent: number
      averageArea: number
      averageEvaluationScore: number
    }>(buildUrl('/expansion/stats', undefined, params))
  }

  /**
   * 获取热力图数据
   */
  static async getHeatmapData(params: {
    regionId?: string
    bounds: {
      northeast: { lng: number; lat: number }
      southwest: { lng: number; lat: number }
    }
    zoom: number
  }): Promise<
    BaseResponse<
      Array<{
        longitude: number
        latitude: number
        weight: number
        type: 'candidate' | 'competitor' | 'store'
      }>
    >
  > {
    return httpClient.post<
      Array<{
        longitude: number
        latitude: number
        weight: number
        type: 'candidate' | 'competitor' | 'store'
      }>
    >('/expansion/heatmap', params)
  }

  // ==================== 数据选项 ====================

  /**
   * 获取相关数据选项
   */
  static async getOptions(): Promise<
    BaseResponse<{
      regions: Array<{ id: string; name: string; code: string }>
      propertyTypes: Array<{ value: CandidateLocation['propertyType']; label: string }>
      statuses: Array<{ value: CandidateLocation['status']; label: string }>
      followUpTypes: Array<{ value: FollowUpRecord['type']; label: string }>
      businessConditionTypes: Array<{ value: BusinessCondition['type']; label: string }>
      businessConditionStatuses: Array<{ value: BusinessCondition['status']; label: string }>
      users: Array<{ id: string; name: string; department: string }>
    }>
  > {
    return httpClient.get<{
      regions: Array<{ id: string; name: string; code: string }>
      propertyTypes: Array<{ value: CandidateLocation['propertyType']; label: string }>
      statuses: Array<{ value: CandidateLocation['status']; label: string }>
      followUpTypes: Array<{ value: FollowUpRecord['type']; label: string }>
      businessConditionTypes: Array<{ value: BusinessCondition['type']; label: string }>
      businessConditionStatuses: Array<{ value: BusinessCondition['status']; label: string }>
      users: Array<{ id: string; name: string; department: string }>
    }>('/expansion/options')
  }

  /**
   * 获取推荐点位
   */
  static async getRecommendedLocations(params: {
    storePlanId?: string
    regionId?: string
    budgetRange?: [number, number]
    areaRange?: [number, number]
    propertyType?: CandidateLocation['propertyType']
    hasElevator?: boolean
    maxDistance?: number // 距离现有门店的最大距离
    minScore?: number // 最低评分
  }): Promise<
    BaseResponse<
      Array<{
        id: string
        name: string
        address: string
        rentPrice: number
        area: number
        evaluationScore: number
        matchScore: number
        reasons: string[]
        distance?: number // 距离目标区域中心的距离
      }>
    >
  > {
    return httpClient.get<
      Array<{
        id: string
        name: string
        address: string
        rentPrice: number
        area: number
        evaluationScore: number
        matchScore: number
        reasons: string[]
        distance?: number
      }>
    >(buildUrl('/expansion/recommendations', undefined, params))
  }
}
