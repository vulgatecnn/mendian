/**
 * 审批中心 API 服务
 */
import request from './request'
import type {
  ApprovalTemplate,
  ApprovalTemplateFormData,
  ApprovalTemplateQueryParams,
  ApprovalInstance,
  ApprovalInstanceFormData,
  ApprovalInstanceQueryParams,
  ApprovalProcessParams,
  ApprovalWithdrawParams,
  ApprovalFollowParams,
  ApprovalCommentParams,
  ApprovalComment,
  ApprovalExportParams,
  PaginatedResponse,
} from '../types'

class ApprovalService {
  // ==================== 审批模板管理 ====================

  /**
   * 获取审批模板列表
   */
  async getTemplates(params?: ApprovalTemplateQueryParams): Promise<PaginatedResponse<ApprovalTemplate>> {
    return request.get('/approval/templates/', { params })
  }

  /**
   * 获取审批模板详情
   */
  async getTemplate(id: number): Promise<ApprovalTemplate> {
    return request.get(`/approval/templates/${id}/`)
  }

  /**
   * 创建审批模板
   */
  async createTemplate(data: ApprovalTemplateFormData): Promise<ApprovalTemplate> {
    return request.post('/approval/templates/', data)
  }

  /**
   * 更新审批模板
   */
  async updateTemplate(id: number, data: Partial<ApprovalTemplateFormData>): Promise<ApprovalTemplate> {
    return request.put(`/approval/templates/${id}/`, data)
  }

  /**
   * 删除审批模板
   */
  async deleteTemplate(id: number): Promise<void> {
    return request.delete(`/approval/templates/${id}/`)
  }

  /**
   * 启用/停用审批模板
   */
  async toggleTemplateStatus(id: number, is_active: boolean): Promise<ApprovalTemplate> {
    return request.patch(`/approval/templates/${id}/`, { is_active })
  }

  // ==================== 审批实例管理 ====================

  /**
   * 获取审批实例列表
   */
  async getInstances(params?: ApprovalInstanceQueryParams): Promise<PaginatedResponse<ApprovalInstance>> {
    return request.get('/approval/instances/', { params })
  }

  /**
   * 获取待办审批列表
   */
  async getPendingInstances(params?: ApprovalInstanceQueryParams): Promise<PaginatedResponse<ApprovalInstance>> {
    return request.get('/approval/instances/pending/', { params })
  }

  /**
   * 获取已办审批列表
   */
  async getProcessedInstances(params?: ApprovalInstanceQueryParams): Promise<PaginatedResponse<ApprovalInstance>> {
    return request.get('/approval/instances/processed/', { params })
  }

  /**
   * 获取抄送审批列表
   */
  async getCCInstances(params?: ApprovalInstanceQueryParams): Promise<PaginatedResponse<ApprovalInstance>> {
    return request.get('/approval/instances/cc/', { params })
  }

  /**
   * 获取关注审批列表
   */
  async getFollowedInstances(params?: ApprovalInstanceQueryParams): Promise<PaginatedResponse<ApprovalInstance>> {
    return request.get('/approval/instances/followed/', { params })
  }

  /**
   * 获取全部审批列表
   */
  async getAllInstances(params?: ApprovalInstanceQueryParams): Promise<PaginatedResponse<ApprovalInstance>> {
    return request.get('/approval/instances/all/', { params })
  }

  /**
   * 获取审批实例详情
   */
  async getInstance(id: number): Promise<ApprovalInstance> {
    return request.get(`/approval/instances/${id}/`)
  }

  /**
   * 发起审批
   */
  async createInstance(data: ApprovalInstanceFormData): Promise<ApprovalInstance> {
    return request.post('/approval/instances/', data)
  }

  /**
   * 处理审批（通过/拒绝/转交/加签）
   */
  async processApproval(instanceId: number, data: ApprovalProcessParams): Promise<ApprovalInstance> {
    return request.post(`/approval/instances/${instanceId}/process/`, data)
  }

  /**
   * 撤销审批
   */
  async withdrawApproval(instanceId: number, data: ApprovalWithdrawParams): Promise<ApprovalInstance> {
    return request.post(`/approval/instances/${instanceId}/withdraw/`, data)
  }

  /**
   * 关注/取消关注审批
   */
  async toggleFollow(instanceId: number, data: ApprovalFollowParams): Promise<ApprovalInstance> {
    return request.post(`/approval/instances/${instanceId}/follow/`, data)
  }

  /**
   * 添加审批评论
   */
  async addComment(instanceId: number, data: ApprovalCommentParams): Promise<ApprovalComment> {
    return request.post(`/approval/instances/${instanceId}/comments/`, data)
  }

  /**
   * 获取审批评论列表
   */
  async getComments(instanceId: number): Promise<ApprovalComment[]> {
    return request.get(`/approval/instances/${instanceId}/comments/`)
  }

  // ==================== 审批台账导出 ====================

  /**
   * 导出审批台账
   */
  async exportApprovals(params: ApprovalExportParams): Promise<Blob> {
    return request.get('/approval/export/', {
      params,
      responseType: 'blob',
    })
  }

  /**
   * 下载审批台账文件
   */
  downloadApprovalExport(blob: Blob, filename: string = '审批台账.xlsx') {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export default new ApprovalService()
