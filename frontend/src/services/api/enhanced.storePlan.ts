/**
 * 增强版开店计划API服务
 * 支持Mock数据的开店计划API
 */
import { httpClient } from '../http'
import type { ApiResponse, ApiPaginatedResponse, PaginatedRequest } from '../types/api'
import type { 
  StorePlan, 
  StorePlanQueryParams, 
  CreateStorePlanDto, 
  UpdateStorePlanDto,
  StorePlanMilestone,
} from '../types/business'

// 开店计划统计接口
export interface StorePlanStats {
  totalPlans: number
  completedPlans: number
  inProgressPlans: number
  delayedPlans: number
  plansByType: Array<{
    type: string
    count: number
  }>
  plansByStatus: Array<{
    status: string
    count: number
  }>
  totalBudget: number
  totalActualCost: number
  averageProgress: number
  completionRate: number
}

// 审批请求接口
export interface ApproveStorePlanRequest {
  comment?: string
  approved: boolean
}

// 里程碑创建接口
export interface CreateMilestoneRequest {
  name: string
  description?: string
  targetDate: string
  responsible: string
  responsibleName: string
}

// 里程碑更新接口
export interface UpdateMilestoneRequest {
  name?: string
  description?: string
  targetDate?: string
  actualDate?: string
  status?: StorePlanMilestone['status']
  responsible?: string
  responsibleName?: string
}

// 导出响应接口
export interface ExportResponse {
  exportUrl: string
  filename: string
}

// 开店计划API服务类
export class EnhancedStorePlanService {
  /**
   * 分页查询开店计划
   */
  static async getStorePlans(params: PaginatedRequest & StorePlanQueryParams = {}): Promise<ApiPaginatedResponse<StorePlan>> {
    return httpClient.get('/store-plans', { params })
  }

  /**
   * 根据ID获取开店计划
   */
  static async getStorePlanById(id: string): Promise<ApiResponse<StorePlan>> {
    return httpClient.get(`/store-plans/${id}`)
  }

  /**
   * 创建开店计划
   */
  static async createStorePlan(data: CreateStorePlanDto): Promise<ApiResponse<StorePlan>> {
    return httpClient.post('/store-plans', data)
  }

  /**
   * 更新开店计划
   */
  static async updateStorePlan(id: string, data: UpdateStorePlanDto): Promise<ApiResponse<StorePlan>> {
    return httpClient.put(`/store-plans/${id}`, data)
  }

  /**
   * 删除开店计划
   */
  static async deleteStorePlan(id: string): Promise<ApiResponse<null>> {
    return httpClient.delete(`/store-plans/${id}`)
  }

  /**
   * 高级搜索开店计划
   */
  static async searchStorePlans(params: PaginatedRequest & StorePlanQueryParams = {}): Promise<ApiPaginatedResponse<StorePlan>> {
    return httpClient.get('/store-plans/search', { params })
  }

  /**
   * 获取开店计划统计数据
   */
  static async getStorePlanStats(params: { startDate?: string, endDate?: string } = {}): Promise<ApiResponse<StorePlanStats>> {
    return httpClient.get('/store-plans/stats', { params })
  }

  /**
   * 审批开店计划
   */
  static async approveStorePlan(id: string, data: ApproveStorePlanRequest): Promise<ApiResponse<StorePlan>> {
    return httpClient.post(`/store-plans/${id}/approve`, data)
  }

  /**
   * 添加里程碑
   */
  static async addMilestone(id: string, data: CreateMilestoneRequest): Promise<ApiResponse<StorePlanMilestone>> {
    return httpClient.post(`/store-plans/${id}/milestones`, data)
  }

  /**
   * 更新里程碑
   */
  static async updateMilestone(
    id: string, 
    milestoneId: string, 
    data: UpdateMilestoneRequest
  ): Promise<ApiResponse<StorePlanMilestone>> {
    return httpClient.put(`/store-plans/${id}/milestones/${milestoneId}`, data)
  }

  /**
   * 删除里程碑
   */
  static async deleteMilestone(id: string, milestoneId: string): Promise<ApiResponse<null>> {
    return httpClient.delete(`/store-plans/${id}/milestones/${milestoneId}`)
  }

  /**
   * 导出开店计划
   */
  static async exportStorePlans(params: StorePlanQueryParams = {}): Promise<ApiResponse<ExportResponse>> {
    return httpClient.get('/store-plans/export', { params })
  }

  /**
   * 批量操作开店计划
   */
  static async batchUpdateStorePlans(
    ids: string[], 
    updates: Partial<UpdateStorePlanDto>
  ): Promise<ApiResponse<StorePlan[]>> {
    return httpClient.post('/store-plans/batch', { ids, updates })
  }

  /**
   * 复制开店计划
   */
  static async copyStorePlan(id: string, newName: string): Promise<ApiResponse<StorePlan>> {
    return httpClient.post(`/store-plans/${id}/copy`, { newName })
  }
}

// 默认导出
export default EnhancedStorePlanService