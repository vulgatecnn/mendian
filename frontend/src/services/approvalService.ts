// 审批流程服务层

import { 
  ApprovalTemplate, 
  ApprovalInstance, 
  ApprovalRecord,
  ApprovalStatistics,
  CreateApprovalRequest,
  ProcessApprovalRequest,
  ApprovalQuery,
  ApprovalEngine,
  ApprovalCondition,
  ApprovalNode
} from '../types/approval'
import { httpClient as request } from './http'

export class ApprovalService implements ApprovalEngine {
  // ==================== 模板管理 ====================
  
  async createTemplate(template: Omit<ApprovalTemplate, 'id' | 'createTime' | 'updateTime'>): Promise<ApprovalTemplate> {
    const response = await request.post('/api/v1/approval/templates', template)
    return response.data
  }

  async updateTemplate(id: string, template: Partial<ApprovalTemplate>): Promise<ApprovalTemplate> {
    const response = await request.put(`/api/v1/approval/templates/${id}`, template)
    return response.data
  }

  async deleteTemplate(id: string): Promise<void> {
    await request.delete(`/api/v1/approval/templates/${id}`)
  }

  async getTemplate(id: string): Promise<ApprovalTemplate> {
    const response = await request.get(`/api/v1/approval/templates/${id}`)
    return response.data
  }

  async listTemplates(query?: { category?: string; businessType?: string }): Promise<ApprovalTemplate[]> {
    const response = await request.get('/api/v1/approval/templates', { params: query })
    return response.data
  }

  // ==================== 流程实例管理 ====================

  async createInstance(request: CreateApprovalRequest): Promise<ApprovalInstance> {
    const response = await request.post('/api/v1/approval/instances', request)
    return response.data
  }

  async processApproval(req: ProcessApprovalRequest): Promise<ApprovalInstance> {
    const response = await request.post(`/api/v1/approval/instances/${req.instanceId}/process`, req)
    return response.data
  }

  async cancelInstance(instanceId: string, reason: string): Promise<void> {
    await request.post(`/api/v1/approval/instances/${instanceId}/cancel`, { reason })
  }

  async getInstance(instanceId: string): Promise<ApprovalInstance> {
    const response = await request.get(`/api/v1/approval/instances/${instanceId}`)
    return response.data
  }

  async listInstances(query: ApprovalQuery): Promise<{ items: ApprovalInstance[]; total: number }> {
    const response = await request.get('/api/v1/approval/instances', { params: query })
    return response.data
  }

  // ==================== 流程执行引擎 ====================

  async getNextNodes(instanceId: string, currentNodeId: string): Promise<ApprovalNode[]> {
    const response = await request.get(`/api/v1/approval/instances/${instanceId}/next-nodes`, {
      params: { currentNodeId }
    })
    return response.data
  }

  async validateConditions(instanceId: string, nodeId: string): Promise<boolean> {
    const response = await request.post(`/api/v1/approval/instances/${instanceId}/validate-conditions`, {
      nodeId
    })
    return response.data.valid
  }

  async executeNode(instanceId: string, nodeId: string): Promise<void> {
    await request.post(`/api/v1/approval/instances/${instanceId}/execute-node`, {
      nodeId
    })
  }

  // ==================== 统计分析 ====================

  async getStatistics(query?: { dateRange?: [string, string]; category?: string }): Promise<ApprovalStatistics> {
    const response = await request.get('/api/v1/approval/statistics', { params: query })
    return response.data
  }

  async getMyPendingApprovals(userId: string): Promise<ApprovalInstance[]> {
    const response = await request.get(`/api/v1/approval/users/${userId}/pending`)
    return response.data
  }

  async getMyApprovalHistory(userId: string, query?: ApprovalQuery): Promise<{ items: ApprovalRecord[]; total: number }> {
    const response = await request.get(`/api/v1/approval/users/${userId}/history`, { params: query })
    return response.data
  }

  // ==================== 高级功能 ====================

  // 批量审批
  async batchProcess(instanceIds: string[], action: 'approve' | 'reject', comment: string): Promise<void> {
    await request.post('/api/v1/approval/batch-process', {
      instanceIds,
      action,
      comment
    })
  }

  // 流程预览 - 根据表单数据预测流程路径
  async previewProcess(templateId: string, formData: Record<string, any>): Promise<ApprovalNode[]> {
    const response = await request.post(`/api/v1/approval/templates/${templateId}/preview`, {
      formData
    })
    return response.data
  }

  // 流程监控 - 获取实时流程状态
  async getProcessMonitor(instanceId: string): Promise<{
    currentNode: ApprovalNode
    progress: number
    timeElapsed: number
    estimatedRemaining: number
    bottlenecks: string[]
  }> {
    const response = await request.get(`/api/v1/approval/instances/${instanceId}/monitor`)
    return response.data
  }

  // 模板验证 - 验证模板配置的正确性
  async validateTemplate(template: ApprovalTemplate): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const response = await request.post('/api/v1/approval/templates/validate', template)
    return response.data
  }

  // 流程克隆 - 基于现有实例创建新实例
  async cloneInstance(sourceInstanceId: string, modifications?: Partial<CreateApprovalRequest>): Promise<ApprovalInstance> {
    const response = await request.post(`/api/v1/approval/instances/${sourceInstanceId}/clone`, modifications)
    return response.data
  }

  // 权限检查
  async checkUserPermissions(userId: string, instanceId: string): Promise<{
    canApprove: boolean
    canReject: boolean
    canTransfer: boolean
    canAddSign: boolean
    canView: boolean
    canCancel: boolean
  }> {
    const response = await request.get(`/api/v1/approval/instances/${instanceId}/permissions`, {
      params: { userId }
    })
    return response.data
  }
}

// 单例模式
export const approvalService = new ApprovalService()

// 审批流程状态机
export class ApprovalStateMachine {
  private static transitions: Record<string, string[]> = {
    'pending': ['approved', 'rejected', 'cancelled', 'timeout'],
    'approved': [],
    'rejected': [],
    'cancelled': [],
    'timeout': ['pending'] // 超时后可以重新审批
  }

  static canTransition(from: string, to: string): boolean {
    return this.transitions[from]?.includes(to) || false
  }

  static getValidTransitions(currentStatus: string): string[] {
    return this.transitions[currentStatus] || []
  }
}

// 审批条件引擎
export class ApprovalConditionEngine {
  static evaluate(formData: Record<string, any>, conditions: ApprovalCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true

    let result = true
    let currentLogic = 'and'

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(formData, condition.field)
      const conditionResult = this.evaluateCondition(fieldValue, condition)

      if (currentLogic === 'and') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }

      currentLogic = condition.logic || 'and'
    }

    return result
  }

  private static getFieldValue(formData: Record<string, any>, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], formData)
  }

  private static evaluateCondition(value: any, condition: ApprovalCondition): boolean {
    const { operator, value: conditionValue } = condition

    switch (operator) {
      case 'eq':
        return value === conditionValue
      case 'gt':
        return Number(value) > Number(conditionValue)
      case 'gte':
        return Number(value) >= Number(conditionValue)
      case 'lt':
        return Number(value) < Number(conditionValue)
      case 'lte':
        return Number(value) <= Number(conditionValue)
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(value)
      case 'contains':
        return String(value).includes(String(conditionValue))
      default:
        return false
    }
  }
}

// 审批时效计算器
export class ApprovalTimeCalculator {
  // 计算预期完成时间
  static calculateEstimatedDuration(template: ApprovalTemplate): number {
    let totalTime = 0
    
    for (const node of template.nodes) {
      if (node.type === 'approval' && node.nodeConfig.timeLimit) {
        totalTime += node.nodeConfig.timeLimit
      }
    }
    
    return totalTime || 24 // 默认24小时
  }

  // 计算实际耗时
  static calculateActualDuration(instance: ApprovalInstance, records: ApprovalRecord[]): number {
    if (records.length === 0) return 0

    const startTime = new Date(instance.createTime)
    const endTime = records.some(r => r.result !== 'pending') 
      ? new Date(records.filter(r => r.result !== 'pending').pop()!.createTime)
      : new Date()

    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)) // 小时
  }

  // 检查是否超时
  static isTimeout(instance: ApprovalInstance): boolean {
    if (!instance.deadline) return false
    return new Date() > new Date(instance.deadline)
  }

  // 计算剩余时间
  static getRemainingTime(instance: ApprovalInstance): number {
    if (!instance.deadline) return -1
    
    const remaining = new Date(instance.deadline).getTime() - new Date().getTime()
    return Math.max(0, Math.round(remaining / (1000 * 60 * 60))) // 小时
  }
}

// Re-export types for convenience (already imported above)
// export { ApprovalCondition, ApprovalNode } from '../types/approval'