// 审批流程相关类型定义

export interface ApprovalUser {
  id: string
  name: string
  position: string
  department: string
  avatar?: string
}

export interface ApprovalNode {
  id: string
  name: string
  type: 'approval' | 'condition' | 'start' | 'end'
  nodeConfig: {
    approvers: ApprovalUser[]
    approvalType: 'single' | 'all' | 'majority' // 单人审批、全员审批、多数决
    timeLimit?: number // 超时时间(小时)
    allowReject: boolean // 是否允许拒绝
    allowTransfer: boolean // 是否允许转交
    allowAddSign: boolean // 是否允许加签
    autoApproval?: boolean // 是否自动审批
    conditions?: ApprovalCondition[] // 条件节点的条件
  }
  position: {
    x: number
    y: number
  }
  connections: string[] // 连接的下游节点ID
}

export interface ApprovalCondition {
  field: string
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'
  value: any
  logic?: 'and' | 'or'
}

export interface ApprovalTemplate {
  id: string
  name: string
  category: string
  description: string
  businessType: 'store_application' | 'license_approval' | 'price_comparison' | 
                'contract_approval' | 'budget_approval' | 'personnel_approval' | 'other'
  isActive: boolean
  nodes: ApprovalNode[]
  formConfig: ApprovalFormConfig
  createTime: string
  updateTime: string
  creator: string
}

export interface ApprovalFormConfig {
  fields: ApprovalFormField[]
  layout: 'vertical' | 'horizontal' | 'grid'
  sections?: ApprovalFormSection[]
}

export interface ApprovalFormField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'upload' | 'cascader'
  required: boolean
  placeholder?: string
  options?: { label: string; value: any }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  dependency?: {
    field: string
    value: any
    visible?: boolean
    required?: boolean
  }
}

export interface ApprovalFormSection {
  id: string
  title: string
  description?: string
  fields: string[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface ApprovalInstance {
  id: string
  instanceCode: string
  templateId: string
  templateName: string
  title: string
  category: string
  businessType: string
  applicant: ApprovalUser
  currentNode: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'timeout'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  formData: Record<string, any>
  attachments?: string[]
  createTime: string
  updateTime: string
  deadline?: string
  
  // 流程执行信息
  executionPath: string[] // 已执行的节点路径
  currentApprovers: ApprovalUser[] // 当前待审批人
  nextApprovers?: ApprovalUser[] // 下一步审批人
  
  // 统计信息
  totalNodes: number
  completedNodes: number
  estimatedDuration: number // 预计耗时(小时)
  actualDuration?: number // 实际耗时(小时)
}

export interface ApprovalRecord {
  id: string
  instanceId: string
  nodeId: string
  nodeName: string
  approver: ApprovalUser
  action: 'approve' | 'reject' | 'transfer' | 'add_sign' | 'cancel'
  result: 'approved' | 'rejected' | 'pending'
  comment: string
  attachments?: string[]
  createTime: string
  
  // 特殊操作信息
  transferTo?: ApprovalUser // 转交给谁
  addSignUsers?: ApprovalUser[] // 加签的用户
  deadline?: string // 处理期限
}

export interface ApprovalStatistics {
  totalInstances: number
  pendingInstances: number
  approvedInstances: number
  rejectedInstances: number
  avgDuration: number // 平均处理时长
  onTimeRate: number // 按时完成率
  
  // 按类型统计
  byCategory: Record<string, {
    total: number
    pending: number
    approved: number
    rejected: number
    avgDuration: number
  }>
  
  // 按用户统计
  byApprover: Record<string, {
    total: number
    pending: number
    approved: number
    rejected: number
    avgResponseTime: number
  }>
}

// API请求类型
export interface CreateApprovalRequest {
  templateId: string
  title: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  formData: Record<string, any>
  attachments?: string[]
  deadline?: string
}

export interface ProcessApprovalRequest {
  instanceId: string
  nodeId: string
  action: 'approve' | 'reject' | 'transfer' | 'add_sign'
  comment: string
  attachments?: string[]
  transferTo?: string // 转交用户ID
  addSignUsers?: string[] // 加签用户ID列表
}

export interface ApprovalQuery {
  status?: string
  category?: string
  businessType?: string
  applicant?: string
  approver?: string
  dateRange?: [string, string]
  keyword?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 审批流程引擎接口
export interface ApprovalEngine {
  // 模板管理
  createTemplate(template: Omit<ApprovalTemplate, 'id' | 'createTime' | 'updateTime'>): Promise<ApprovalTemplate>
  updateTemplate(id: string, template: Partial<ApprovalTemplate>): Promise<ApprovalTemplate>
  deleteTemplate(id: string): Promise<void>
  getTemplate(id: string): Promise<ApprovalTemplate>
  listTemplates(query?: { category?: string; businessType?: string }): Promise<ApprovalTemplate[]>
  
  // 流程实例管理
  createInstance(request: CreateApprovalRequest): Promise<ApprovalInstance>
  processApproval(request: ProcessApprovalRequest): Promise<ApprovalInstance>
  cancelInstance(instanceId: string, reason: string): Promise<void>
  getInstance(instanceId: string): Promise<ApprovalInstance>
  listInstances(query: ApprovalQuery): Promise<{ items: ApprovalInstance[]; total: number }>
  
  // 流程执行
  getNextNodes(instanceId: string, currentNodeId: string): Promise<ApprovalNode[]>
  validateConditions(instanceId: string, nodeId: string): Promise<boolean>
  executeNode(instanceId: string, nodeId: string): Promise<void>
  
  // 统计分析
  getStatistics(query?: { dateRange?: [string, string]; category?: string }): Promise<ApprovalStatistics>
  getMyPendingApprovals(userId: string): Promise<ApprovalInstance[]>
  getMyApprovalHistory(userId: string, query?: ApprovalQuery): Promise<{ items: ApprovalRecord[]; total: number }>
}

// 前端状态管理
export interface ApprovalState {
  // 模板相关
  templates: ApprovalTemplate[]
  currentTemplate: ApprovalTemplate | null
  templateLoading: boolean
  
  // 实例相关  
  instances: ApprovalInstance[]
  currentInstance: ApprovalInstance | null
  instanceLoading: boolean
  instanceTotal: number
  
  // 审批记录
  records: ApprovalRecord[]
  recordLoading: boolean
  recordTotal: number
  
  // 统计数据
  statistics: ApprovalStatistics | null
  statisticsLoading: boolean
  
  // 待办事项
  pendingApprovals: ApprovalInstance[]
  pendingCount: number
  
  // UI状态
  selectedInstanceIds: string[]
  filterOptions: ApprovalQuery
}

export interface ApprovalActions {
  // 模板操作
  fetchTemplates(): Promise<void>
  createTemplate(template: Omit<ApprovalTemplate, 'id' | 'createTime' | 'updateTime'>): Promise<void>
  updateTemplate(id: string, template: Partial<ApprovalTemplate>): Promise<void>
  deleteTemplate(id: string): Promise<void>
  
  // 实例操作
  fetchInstances(query?: ApprovalQuery): Promise<void>
  createInstance(request: CreateApprovalRequest): Promise<void>
  processApproval(request: ProcessApprovalRequest): Promise<void>
  cancelInstance(instanceId: string, reason: string): Promise<void>
  
  // 统计操作
  fetchStatistics(query?: { dateRange?: [string, string]; category?: string }): Promise<void>
  fetchPendingApprovals(): Promise<void>
  fetchApprovalHistory(query?: ApprovalQuery): Promise<void>
  
  // UI操作
  setSelectedInstanceIds(ids: string[]): void
  setFilterOptions(options: ApprovalQuery): void
  resetState(): void
}