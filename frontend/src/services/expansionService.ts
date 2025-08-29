/**
 * 拓店管理服务层
 * 处理所有与拓店管理相关的API调用
 */

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7900'
const API_PREFIX = '/api/v1'

// 请求工具类
class ApiClient {
  private baseUrl: string
  private prefix: string

  constructor(baseUrl: string, prefix: string) {
    this.baseUrl = baseUrl
    this.prefix = prefix
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${this.prefix}${endpoint}`
    
    // 获取认证令牌
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(response.status, data.message || '请求失败', data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // 网络错误或其他异常
      throw new ApiError(0, '网络连接失败', error)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()))
          } else {
            searchParams.append(key, value.toString())
          }
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }
    return this.request<T>(url)
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

// API错误类
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  code: number
  data: T
  message: string
  timestamp: string
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 候选点位相关类型
export interface CandidateLocation {
  id: string
  storePlanId?: string
  regionId: string
  name: string
  address: string
  detailedAddress?: string
  area?: number
  usableArea?: number
  rentPrice?: number
  rentUnit?: string
  depositAmount?: number
  transferFee?: number
  propertyFee?: number
  landlordName?: string
  landlordPhone?: string
  landlordEmail?: string
  coordinates?: string
  photos: string[]
  status: CandidateLocationStatus
  priority: Priority
  evaluationScore?: number
  evaluationComments?: string
  evaluationCriteria?: EvaluationCriteria
  expectedSignDate?: string
  discoveredAt: string
  discoveredById: string
  discoveredByName?: string
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface EvaluationCriteria {
  location?: number
  traffic?: number
  competition?: number
  cost?: number
  potential?: number
}

export type CandidateLocationStatus = 
  | 'PENDING' 
  | 'EVALUATING' 
  | 'FOLLOWING' 
  | 'NEGOTIATING' 
  | 'CONTRACTED' 
  | 'REJECTED' 
  | 'SUSPENDED'

export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'

// 跟进记录相关类型
export interface FollowUpRecord {
  id: string
  candidateLocationId: string
  candidateLocationName?: string
  assigneeId: string
  assigneeName?: string
  type: FollowUpType
  status: FollowUpStatus
  title: string
  content: string
  result?: string
  nextFollowUpDate?: string
  actualFollowUpDate?: string
  duration?: number
  cost?: number
  importance: Priority
  attachments: string[]
  location?: string
  participants: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  createdById: string
  createdByName?: string
}

export type FollowUpType = 
  | 'PHONE_CALL'
  | 'SITE_VISIT' 
  | 'NEGOTIATION'
  | 'EMAIL'
  | 'MEETING'
  | 'DOCUMENTATION'
  | 'OTHER'

export type FollowUpStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE'

// 查询参数接口
export interface CandidateLocationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  storePlanId?: string
  regionId?: string
  status?: CandidateLocationStatus
  priority?: Priority
  minArea?: number
  maxArea?: number
  minRent?: number
  maxRent?: number
  minScore?: number
  maxScore?: number
  discoveryDateStart?: string
  discoveryDateEnd?: string
  keyword?: string
  tags?: string[]
}

export interface FollowUpRecordQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  candidateLocationId?: string
  assigneeId?: string
  type?: FollowUpType
  status?: FollowUpStatus
  importance?: Priority
  startDate?: string
  endDate?: string
  nextFollowUpDateStart?: string
  nextFollowUpDateEnd?: string
  keyword?: string
}

// 创建API客户端实例
const apiClient = new ApiClient(API_BASE_URL, API_PREFIX)

// 拓店管理服务类
export class ExpansionService {
  // ===============================
  // 候选点位管理
  // ===============================

  // 获取候选点位列表
  async getCandidateLocationList(query?: CandidateLocationQuery): Promise<PaginatedResponse<CandidateLocation>> {
    const response = await apiClient.get<PaginatedResponse<CandidateLocation>>(
      '/expansion/candidate-locations',
      query
    )
    return response.data
  }

  // 获取候选点位详情
  async getCandidateLocationById(id: string): Promise<CandidateLocation> {
    const response = await apiClient.get<CandidateLocation>(`/expansion/candidate-locations/${id}`)
    return response.data
  }

  // 创建候选点位
  async createCandidateLocation(data: Partial<CandidateLocation>): Promise<CandidateLocation> {
    const response = await apiClient.post<CandidateLocation>('/expansion/candidate-locations', data)
    return response.data
  }

  // 更新候选点位
  async updateCandidateLocation(id: string, data: Partial<CandidateLocation>): Promise<CandidateLocation> {
    const response = await apiClient.put<CandidateLocation>(`/expansion/candidate-locations/${id}`, data)
    return response.data
  }

  // 删除候选点位
  async deleteCandidateLocation(id: string): Promise<void> {
    await apiClient.delete(`/expansion/candidate-locations/${id}`)
  }

  // 变更候选点位状态
  async changeCandidateLocationStatus(
    id: string, 
    status: CandidateLocationStatus, 
    reason?: string, 
    comments?: string
  ): Promise<CandidateLocation> {
    const response = await apiClient.post<CandidateLocation>(
      `/expansion/candidate-locations/${id}/status`,
      { status, reason, comments }
    )
    return response.data
  }

  // 更新候选点位评分
  async updateCandidateLocationScore(
    id: string,
    evaluationScore: number,
    evaluationComments?: string,
    evaluationCriteria?: EvaluationCriteria
  ): Promise<CandidateLocation> {
    const response = await apiClient.post<CandidateLocation>(
      `/expansion/candidate-locations/${id}/score`,
      { evaluationScore, evaluationComments, evaluationCriteria }
    )
    return response.data
  }

  // 批量操作候选点位
  async batchOperationCandidateLocations(
    ids: string[],
    action: string,
    actionData?: any
  ): Promise<{ successCount: number; failedCount: number; errors: any[] }> {
    const response = await apiClient.post<{ successCount: number; failedCount: number; errors: any[] }>(
      '/expansion/candidate-locations/batch',
      { ids, action, actionData }
    )
    return response.data
  }

  // 快速操作
  async startFollowing(id: string): Promise<CandidateLocation> {
    const response = await apiClient.post<CandidateLocation>(`/expansion/candidate-locations/${id}/start-following`)
    return response.data
  }

  async startNegotiation(id: string): Promise<CandidateLocation> {
    const response = await apiClient.post<CandidateLocation>(`/expansion/candidate-locations/${id}/start-negotiation`)
    return response.data
  }

  async signContract(id: string, reason?: string, comments?: string): Promise<CandidateLocation> {
    const response = await apiClient.post<CandidateLocation>(
      `/expansion/candidate-locations/${id}/sign-contract`,
      { reason, comments }
    )
    return response.data
  }

  // ===============================
  // 跟进记录管理
  // ===============================

  // 获取跟进记录列表
  async getFollowUpRecordList(query?: FollowUpRecordQuery): Promise<PaginatedResponse<FollowUpRecord>> {
    const response = await apiClient.get<PaginatedResponse<FollowUpRecord>>(
      '/expansion/follow-up-records',
      query
    )
    return response.data
  }

  // 获取候选点位的跟进时间线
  async getCandidateLocationTimeline(
    id: string, 
    page = 1, 
    limit = 100
  ): Promise<PaginatedResponse<FollowUpRecord>> {
    const response = await apiClient.get<PaginatedResponse<FollowUpRecord>>(
      `/expansion/candidate-locations/${id}/timeline`,
      { page, limit }
    )
    return response.data
  }

  // 创建跟进记录
  async createFollowUpRecord(data: Partial<FollowUpRecord>): Promise<FollowUpRecord> {
    const response = await apiClient.post<FollowUpRecord>('/expansion/follow-up-records', data)
    return response.data
  }

  // 获取跟进记录详情
  async getFollowUpRecordById(id: string): Promise<FollowUpRecord> {
    const response = await apiClient.get<FollowUpRecord>(`/expansion/follow-up-records/${id}`)
    return response.data
  }

  // 更新跟进记录
  async updateFollowUpRecord(id: string, data: Partial<FollowUpRecord>): Promise<FollowUpRecord> {
    const response = await apiClient.put<FollowUpRecord>(`/expansion/follow-up-records/${id}`, data)
    return response.data
  }

  // 删除跟进记录
  async deleteFollowUpRecord(id: string): Promise<void> {
    await apiClient.delete(`/expansion/follow-up-records/${id}`)
  }

  // 完成跟进记录
  async completeFollowUpRecord(
    id: string,
    result?: string,
    duration?: number,
    cost?: number,
    attachments?: string[]
  ): Promise<FollowUpRecord> {
    const response = await apiClient.post<FollowUpRecord>(
      `/expansion/follow-up-records/${id}/complete`,
      { result, duration, cost, attachments }
    )
    return response.data
  }

  // 获取我的待办任务
  async getMyTasks(page = 1, limit = 50): Promise<PaginatedResponse<FollowUpRecord>> {
    const response = await apiClient.get<PaginatedResponse<FollowUpRecord>>(
      '/expansion/expansion/my-tasks',
      { page, limit }
    )
    return response.data
  }

  // ===============================
  // 地图数据服务
  // ===============================

  // 获取地图数据
  async getMapData(query?: {
    regionId?: string
    zoom?: number
    bounds?: {
      northeast: { latitude: number; longitude: number }
      southwest: { latitude: number; longitude: number }
    }
  }): Promise<{
    locations: (CandidateLocation & { coordinates: { latitude: number; longitude: number } })[]
    clusters: Array<{
      coordinates: { latitude: number; longitude: number }
      count: number
      bounds: any
    }>
  }> {
    const response = await apiClient.get('/expansion/expansion/map-data', query)
    return response.data
  }

  // ===============================
  // 统计分析服务
  // ===============================

  // 获取拓店统计数据
  async getExpansionStatistics(query?: {
    regionIds?: string[]
    storePlanIds?: string[]
    dateRange?: {
      start: string
      end: string
    }
    groupBy?: 'region' | 'status' | 'priority' | 'month'
  }): Promise<{
    summary: {
      totalLocations: number
      activeFollowUps: number
      completedContracts: number
      averageScore: number
    }
    distributions: Array<{
      name: string
      value: number
      percentage: number
    }>
    trends: Array<{
      date: string
      discovered: number
      signed: number
      rejected: number
    }>
  }> {
    const response = await apiClient.get('/expansion/expansion/statistics', query)
    return response.data
  }

  // 获取跟进统计数据
  async getFollowUpStatistics(query?: {
    regionIds?: string[]
    storePlanIds?: string[]
    dateRange?: {
      start: string
      end: string
    }
    groupBy?: 'region' | 'status' | 'priority' | 'month'
  }): Promise<{
    summary: {
      totalFollowUps: number
      completedFollowUps: number
      overdueFollowUps: number
      averageDuration: number
    }
    distributions: Array<{
      name: string
      value: number
      percentage: number
    }>
    trends: Array<{
      date: string
      created: number
      completed: number
      overdue: number
    }>
  }> {
    const response = await apiClient.get('/expansion/expansion/follow-up-statistics', query)
    return response.data
  }

  // 获取拓店进度数据
  async getExpansionProgress(): Promise<{
    overall: {
      planProgress: number
      discoveryProgress: number
      contractProgress: number
    }
    byRegion: Array<{
      regionId: string
      regionName: string
      planned: number
      discovered: number
      signed: number
      progress: number
    }>
    conversion: {
      discoveryToFollowUp: number
      followUpToNegotiation: number
      negotiationToContract: number
      overallConversion: number
    }
  }> {
    const response = await apiClient.get('/expansion/expansion/progress')
    return response.data
  }

  // 获取仪表板数据
  async getExpansionDashboard(): Promise<{
    summary: {
      totalLocations: number
      activeFollowUps: number
      overdueFollowUps: number
      completedContracts: number
    }
    recentActivities: Array<{
      id: string
      type: string
      title: string
      timestamp: string
      user: string
    }>
    upcomingTasks: Array<{
      id: string
      title: string
      dueDate: string
      priority: Priority
      assignee: string
    }>
    performanceMetrics: {
      thisMonth: {
        discovered: number
        signed: number
        conversion: number
      }
      lastMonth: {
        discovered: number
        signed: number
        conversion: number
      }
    }
  }> {
    const response = await apiClient.get('/expansion/expansion/dashboard')
    return response.data
  }

  // ===============================
  // 数据导出服务
  // ===============================

  // 导出候选点位数据
  async exportCandidateLocationData(options: {
    format: 'xlsx' | 'csv'
    columns?: string[]
    includeFollowUpRecords?: boolean
    filters?: CandidateLocationQuery
  }): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/expansion/expansion/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new ApiError(response.status, '导出失败')
    }

    return response.blob()
  }
}

// 创建服务实例
export const expansionService = new ExpansionService()

// 导出默认实例
export default expansionService