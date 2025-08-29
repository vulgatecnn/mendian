import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse,
  StorePlan,
  StorePlanQueryParams,
  CreateStorePlanDto,
  UpdateStorePlanDto,
  BatchOperationParams,
  ExportResponse,
  ImportResponse,
  ApprovalActionParams,
  StatsResponse
} from '../types'

/**
 * 开店计划管理API服务
 */
export class StorePlanApiService {
  /**
   * 获取开店计划列表
   */
  static async getStorePlans(
    params?: StorePlanQueryParams
  ): Promise<PaginationResponse<StorePlan>> {
    return httpClient.get<StorePlan[]>(buildUrl(API_PATHS.STORE_PLAN.LIST, undefined, params))
  }

  /**
   * 获取开店计划详情
   */
  static async getStorePlan(id: string): Promise<BaseResponse<StorePlan>> {
    return httpClient.get<StorePlan>(buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id }))
  }

  /**
   * 创建开店计划
   */
  static async createStorePlan(data: CreateStorePlanDto): Promise<BaseResponse<StorePlan>> {
    return httpClient.post<StorePlan>(API_PATHS.STORE_PLAN.CREATE, data, {
      timeout: 15000 // 创建操作超时时间稍长
    })
  }

  /**
   * 更新开店计划
   */
  static async updateStorePlan(
    id: string,
    data: UpdateStorePlanDto
  ): Promise<BaseResponse<StorePlan>> {
    return httpClient.put<StorePlan>(buildUrl(API_PATHS.STORE_PLAN.UPDATE, { id }), data)
  }

  /**
   * 删除开店计划
   */
  static async deleteStorePlan(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.STORE_PLAN.DELETE, { id }))
  }

  /**
   * 批量操作开店计划
   */
  static async batchOperation(params: BatchOperationParams): Promise<
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
    }>(API_PATHS.STORE_PLAN.BATCH_DELETE, params, {
      timeout: 30000 // 批量操作超时时间更长
    })
  }

  /**
   * 提交审批
   */
  static async submitForApproval(
    id: string,
    data?: {
      comment?: string
      urgency?: 'normal' | 'urgent'
      approvers?: string[]
    }
  ): Promise<
    BaseResponse<{
      approvalFlowId: string
    }>
  > {
    return httpClient.post<{
      approvalFlowId: string
    }>(`${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/submit`, data)
  }

  /**
   * 撤回审批
   */
  static async withdrawApproval(id: string, reason?: string): Promise<BaseResponse<null>> {
    return httpClient.post<null>(`${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/withdraw`, {
      reason
    })
  }

  /**
   * 审批开店计划
   */
  static async approveStorePlan(
    id: string,
    params: ApprovalActionParams
  ): Promise<BaseResponse<null>> {
    return httpClient.post<null>(buildUrl(API_PATHS.STORE_PLAN.APPROVE, { id }), params)
  }

  /**
   * 拒绝开店计划
   */
  static async rejectStorePlan(
    id: string,
    params: ApprovalActionParams
  ): Promise<BaseResponse<null>> {
    return httpClient.post<null>(buildUrl(API_PATHS.STORE_PLAN.REJECT, { id }), params)
  }

  /**
   * 获取审批历史
   */
  static async getApprovalHistory(id: string): Promise<
    BaseResponse<
      Array<{
        id: string
        nodeId: string
        nodeName: string
        approverId: string
        approverName: string
        action: 'approve' | 'reject' | 'transfer' | 'add_sign'
        comment?: string
        processedAt: string
      }>
    >
  > {
    return httpClient.get<
      Array<{
        id: string
        nodeId: string
        nodeName: string
        approverId: string
        approverName: string
        action: 'approve' | 'reject' | 'transfer' | 'add_sign'
        comment?: string
        processedAt: string
      }>
    >(`${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/approval-history`)
  }

  /**
   * 导出开店计划
   */
  static async exportStorePlans(params?: {
    ids?: string[]
    format?: 'xlsx' | 'csv'
    template?: 'standard' | 'simple' | 'detailed'
    filters?: StorePlanQueryParams
  }): Promise<BaseResponse<ExportResponse>> {
    return httpClient.post<ExportResponse>(API_PATHS.STORE_PLAN.EXPORT, params, {
      timeout: 60000 // 导出操作超时时间更长
    })
  }

  /**
   * 导入开店计划
   */
  static async importStorePlans(
    file: File,
    options?: {
      mode?: 'create' | 'update' | 'upsert'
      skipErrors?: boolean
      template?: string
    }
  ): Promise<BaseResponse<ImportResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    return httpClient.upload<ImportResponse>(API_PATHS.STORE_PLAN.IMPORT, formData, {
      timeout: 120000 // 导入操作超时时间很长
    })
  }

  /**
   * 获取导入模板
   */
  static async getImportTemplate(template?: 'standard' | 'simple' | 'detailed'): Promise<void> {
    await httpClient.download(
      buildUrl('/store-plans/import/template', undefined, { template }),
      `开店计划导入模板_${template || 'standard'}.xlsx`
    )
  }

  /**
   * 获取导入结果
   */
  static async getImportResult(importId: string): Promise<BaseResponse<ImportResponse>> {
    return httpClient.get<ImportResponse>(`/store-plans/import/${importId}/result`)
  }

  /**
   * 复制开店计划
   */
  static async cloneStorePlan(
    id: string,
    data?: {
      name: string
      description?: string
      targetOpenDate?: string
    }
  ): Promise<BaseResponse<StorePlan>> {
    return httpClient.post<StorePlan>(
      `${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/clone`,
      data
    )
  }

  /**
   * 更新进度
   */
  static async updateProgress(
    id: string,
    data: {
      progress: number
      milestoneId?: string
      notes?: string
      attachments?: string[]
    }
  ): Promise<BaseResponse<StorePlan>> {
    return httpClient.patch<StorePlan>(
      `${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/progress`,
      data
    )
  }

  /**
   * 添加里程碑
   */
  static async addMilestone(
    id: string,
    data: {
      name: string
      description?: string
      targetDate: string
      responsible: string
    }
  ): Promise<
    BaseResponse<{
      id: string
      name: string
      description?: string
      targetDate: string
      responsible: string
      responsibleName: string
      status: 'pending' | 'in_progress' | 'completed' | 'delayed'
    }>
  > {
    return httpClient.post<{
      id: string
      name: string
      description?: string
      targetDate: string
      responsible: string
      responsibleName: string
      status: 'pending' | 'in_progress' | 'completed' | 'delayed'
    }>(`${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/milestones`, data)
  }

  /**
   * 更新里程碑
   */
  static async updateMilestone(
    id: string,
    milestoneId: string,
    data: {
      name?: string
      description?: string
      targetDate?: string
      actualDate?: string
      status?: 'pending' | 'in_progress' | 'completed' | 'delayed'
      responsible?: string
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.patch<null>(
      `${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/milestones/${milestoneId}`,
      data
    )
  }

  /**
   * 删除里程碑
   */
  static async deleteMilestone(id: string, milestoneId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(
      `${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/milestones/${milestoneId}`
    )
  }

  /**
   * 上传附件
   */
  static async uploadAttachment(
    id: string,
    file: File,
    category?: string
  ): Promise<
    BaseResponse<{
      id: string
      name: string
      url: string
      size: number
      category?: string
    }>
  > {
    const formData = new FormData()
    formData.append('file', file)
    if (category) {
      formData.append('category', category)
    }

    return httpClient.upload<{
      id: string
      name: string
      url: string
      size: number
      category?: string
    }>(`${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/attachments`, formData)
  }

  /**
   * 删除附件
   */
  static async deleteAttachment(id: string, attachmentId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(
      `${buildUrl(API_PATHS.STORE_PLAN.DETAIL, { id })}/attachments/${attachmentId}`
    )
  }

  /**
   * 获取统计数据
   */
  static async getStats(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    regionId?: string
    type?: StorePlan['type']
    startDate?: string
    endDate?: string
  }): Promise<
    BaseResponse<{
      total: StatsResponse
      byStatus: Record<StorePlan['status'], number>
      byType: Record<StorePlan['type'], number>
      byRegion: Record<string, number>
      timeline: Array<{
        date: string
        planned: number
        completed: number
      }>
    }>
  > {
    return httpClient.get<{
      total: StatsResponse
      byStatus: Record<StorePlan['status'], number>
      byType: Record<StorePlan['type'], number>
      byRegion: Record<string, number>
      timeline: Array<{
        date: string
        planned: number
        completed: number
      }>
    }>(buildUrl('/store-plans/stats', undefined, params))
  }

  /**
   * 获取相关数据选项
   */
  static async getOptions(): Promise<
    BaseResponse<{
      regions: Array<{ id: string; name: string; code: string }>
      types: Array<{ value: StorePlan['type']; label: string }>
      statuses: Array<{ value: StorePlan['status']; label: string }>
      priorities: Array<{ value: StorePlan['priority']; label: string }>
      users: Array<{ id: string; name: string; department: string }>
    }>
  > {
    return httpClient.get<{
      regions: Array<{ id: string; name: string; code: string }>
      types: Array<{ value: StorePlan['type']; label: string }>
      statuses: Array<{ value: StorePlan['status']; label: string }>
      priorities: Array<{ value: StorePlan['priority']; label: string }>
      users: Array<{ id: string; name: string; department: string }>
    }>('/store-plans/options')
  }

  /**
   * 获取推荐候选点位
   */
  static async getRecommendedLocations(
    id: string,
    params?: {
      regionId?: string
      maxDistance?: number
      budgetRange?: [number, number]
      excludeIds?: string[]
    }
  ): Promise<
    BaseResponse<
      Array<{
        id: string
        name: string
        address: string
        distance?: number
        matchScore: number
        reasons: string[]
      }>
    >
  > {
    return httpClient.get<
      Array<{
        id: string
        name: string
        address: string
        distance?: number
        matchScore: number
        reasons: string[]
      }>
    >(buildUrl(`${API_PATHS.STORE_PLAN.DETAIL}/recommendations`, { id }, params))
  }
}
