import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse,
  ApprovalFlow,
  ApprovalTemplate,
  ApprovalActionParams
} from '../types'

/**
 * 审批中心API服务
 */
export class ApprovalApiService {
  // ==================== 审批流程管理 ====================

  /**
   * 获取审批流程列表
   */
  static async getApprovalFlows(params?: {
    page?: number
    pageSize?: number
    type?: ApprovalFlow['type']
    status?: ApprovalFlow['status']
    applicant?: string
    department?: string
    priority?: ApprovalFlow['priority']
    startDate?: string
    endDate?: string
  }): Promise<PaginationResponse<ApprovalFlow>> {
    return httpClient.get<PaginationResponse<ApprovalFlow>>(
      buildUrl(API_PATHS.APPROVAL.FLOWS, undefined, params)
    )
  }

  /**
   * 获取审批流程详情
   */
  static async getApprovalFlow(id: string): Promise<BaseResponse<ApprovalFlow>> {
    return httpClient.get<ApprovalFlow>(buildUrl(API_PATHS.APPROVAL.FLOW_DETAIL, { id }))
  }

  /**
   * 创建审批流程
   */
  static async createApprovalFlow(data: {
    title: string
    type: ApprovalFlow['type']
    businessId?: string
    templateId: string
    formData: Record<string, any>
    priority?: ApprovalFlow['priority']
    deadlineDate?: string
  }): Promise<BaseResponse<ApprovalFlow>> {
    return httpClient.post<ApprovalFlow>(API_PATHS.APPROVAL.CREATE_FLOW, data)
  }

  /**
   * 审批流程
   */
  static async approveFlow(
    id: string,
    params: ApprovalActionParams
  ): Promise<BaseResponse<ApprovalFlow>> {
    return httpClient.post<ApprovalFlow>(buildUrl(API_PATHS.APPROVAL.APPROVE, { id }), params)
  }

  /**
   * 拒绝流程
   */
  static async rejectFlow(
    id: string,
    params: ApprovalActionParams
  ): Promise<BaseResponse<ApprovalFlow>> {
    return httpClient.post<ApprovalFlow>(buildUrl(API_PATHS.APPROVAL.REJECT, { id }), params)
  }

  /**
   * 转交流程
   */
  static async transferFlow(
    id: string,
    params: ApprovalActionParams
  ): Promise<BaseResponse<ApprovalFlow>> {
    return httpClient.post<ApprovalFlow>(buildUrl(API_PATHS.APPROVAL.TRANSFER, { id }), params)
  }

  /**
   * 撤回流程
   */
  static async withdrawFlow(id: string, reason?: string): Promise<BaseResponse<ApprovalFlow>> {
    return httpClient.post<ApprovalFlow>(
      `${buildUrl(API_PATHS.APPROVAL.FLOW_DETAIL, { id })}/withdraw`,
      { reason }
    )
  }

  // ==================== 审批模板管理 ====================

  /**
   * 获取审批模板列表
   */
  static async getApprovalTemplates(params?: {
    category?: string
    enabled?: boolean
  }): Promise<BaseResponse<ApprovalTemplate[]>> {
    return httpClient.get<ApprovalTemplate[]>(
      buildUrl(API_PATHS.APPROVAL.TEMPLATES, undefined, params)
    )
  }

  /**
   * 获取审批模板详情
   */
  static async getApprovalTemplate(id: string): Promise<BaseResponse<ApprovalTemplate>> {
    return httpClient.get<ApprovalTemplate>(buildUrl(API_PATHS.APPROVAL.TEMPLATE_DETAIL, { id }))
  }

  /**
   * 创建审批模板
   */
  static async createApprovalTemplate(
    data: Omit<ApprovalTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): Promise<BaseResponse<ApprovalTemplate>> {
    return httpClient.post<ApprovalTemplate>(API_PATHS.APPROVAL.CREATE_TEMPLATE, data)
  }

  /**
   * 更新审批模板
   */
  static async updateApprovalTemplate(
    id: string,
    data: Partial<ApprovalTemplate>
  ): Promise<BaseResponse<ApprovalTemplate>> {
    return httpClient.put<ApprovalTemplate>(
      buildUrl(API_PATHS.APPROVAL.UPDATE_TEMPLATE, { id }),
      data
    )
  }

  /**
   * 删除审批模板
   */
  static async deleteApprovalTemplate(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`${API_PATHS.APPROVAL.TEMPLATES}/${id}`)
  }

  /**
   * 启用/禁用模板
   */
  static async toggleTemplate(
    id: string,
    enabled: boolean
  ): Promise<BaseResponse<ApprovalTemplate>> {
    return httpClient.patch<ApprovalTemplate>(`${API_PATHS.APPROVAL.TEMPLATES}/${id}/toggle`, {
      enabled
    })
  }

  /**
   * 获取我的审批任务
   */
  static async getMyTasks(params?: {
    page?: number
    pageSize?: number
    status?: 'pending' | 'processed'
    type?: ApprovalFlow['type']
    priority?: ApprovalFlow['priority']
  }): Promise<PaginationResponse<ApprovalFlow>> {
    return httpClient.get<PaginationResponse<ApprovalFlow>>(
      buildUrl('/approval/my-tasks', undefined, params)
    )
  }

  /**
   * 获取我发起的审批
   */
  static async getMyApplications(params?: {
    page?: number
    pageSize?: number
    status?: ApprovalFlow['status']
    type?: ApprovalFlow['type']
  }): Promise<PaginationResponse<ApprovalFlow>> {
    return httpClient.get<PaginationResponse<ApprovalFlow>>(
      buildUrl('/approval/my-applications', undefined, params)
    )
  }

  /**
   * 获取审批统计
   */
  static async getApprovalStats(): Promise<
    BaseResponse<{
      pendingCount: number
      processedToday: number
      averageProcessTime: number
      byStatus: Record<ApprovalFlow['status'], number>
      byType: Record<ApprovalFlow['type'], number>
    }>
  > {
    return httpClient.get<{
      pendingCount: number
      processedToday: number
      averageProcessTime: number
      byStatus: Record<ApprovalFlow['status'], number>
      byType: Record<ApprovalFlow['type'], number>
    }>('/approval/stats')
  }
}
