/**
 * 通用类型定义
 */

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PaginationParams {
  page?: number
  page_size?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// 部门相关类型
export interface Department {
  id: number
  name: string
  wechat_dept_id: number
  parent: number | null
  order: number
  created_at: string
  updated_at: string
  children?: Department[]
}

// 部门同步响应
export interface DepartmentSyncResponse {
  success: boolean
  message: string
  synced_count: number
  updated_count: number
  errors?: string[]
}

// 用户相关类型
export interface User {
  id: number
  username: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  wechat_user_id: string
  department: number | null
  department_info?: {
    id: number
    name: string
    wechat_dept_id: number
    parent: number | null
    parent_name: string | null
    order: number
  }
  department_name?: string
  position: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  role_list?: Role[]
  date_joined: string
  last_login: string | null
  created_at: string
  updated_at: string
}

// 角色相关类型
export interface Role {
  id: number
  name: string
  description: string
  is_active: boolean
  permission_list?: Permission[]
  member_count?: number
  created_at: string
  updated_at: string
}

// 权限相关类型
export interface Permission {
  id: number
  code: string
  name: string
  module: string
  description: string
  created_at: string
}

// 用户同步响应
export interface UserSyncResponse {
  code: number
  message: string
  data: {
    total: number
    created: number
    updated: number
    failed: number
  }
}

// 用户状态切换响应
export interface UserToggleStatusResponse {
  code: number
  message: string
  data: {
    id: number
    username: string
    is_active: boolean
  }
}

// 角色分配响应
export interface RoleAssignResponse {
  code: number
  message: string
  data: {
    id: number
    username: string
    roles: Array<{
      id: number
      name: string
    }>
  }
}

// 审计日志相关类型
export interface AuditLog {
  id: number
  user: number | null
  user_info: {
    id: number
    username: string
    full_name: string
    phone: string
    department: number | null
    department_name: string | null
    position: string
    is_active: boolean
  } | null
  username: string
  user_full_name: string
  action: string
  target_type: string
  target_id: number
  details: Record<string, any>
  ip_address: string
  created_at: string
}

// 审计日志查询参数
export interface AuditLogQueryParams extends PaginationParams {
  user_id?: number
  username?: string
  action?: string
  target_type?: string
  start_time?: string
  end_time?: string
}

// 操作类型常量
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ENABLE: 'enable',
  DISABLE: 'disable',
  ASSIGN: 'assign',
  ASSIGN_PERMISSIONS: 'assign_permissions',
  ADD_MEMBERS: 'add_members',
  SYNC: 'sync'
} as const

// 对象类型常量
export const AUDIT_TARGET_TYPES = {
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  DEPARTMENT: 'department'
} as const

// 开店计划相关类型

// 计划类型
export type PlanType = 'annual' | 'quarterly'

// 计划状态
export type PlanStatus = 'draft' | 'published' | 'executing' | 'completed' | 'cancelled'

// 经营区域
export interface BusinessRegion {
  id: number
  name: string
  code: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 门店类型
export interface StoreType {
  id: number
  name: string
  code: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 区域计划
export interface RegionalPlan {
  id?: number
  region_id: number
  region?: BusinessRegion
  store_type_id: number
  store_type?: StoreType
  target_count: number
  completed_count?: number
  completion_rate?: number
  contribution_rate: number
  budget_amount: number
}

// 开店计划
export interface StorePlan {
  id: number
  name: string
  plan_type: PlanType
  status: PlanStatus
  start_date: string
  end_date: string
  description: string
  total_target_count: number
  total_completed_count: number
  total_budget_amount: number
  created_by: number
  created_by_info?: {
    id: number
    username: string
    full_name: string
  }
  created_at: string
  updated_at: string
  published_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  regional_plans: RegionalPlan[]
  overall_progress?: {
    total_target: number
    total_completed: number
    completion_rate: number
  }
}

// 创建/更新计划的请求参数
export interface StorePlanFormData {
  name: string
  plan_type: PlanType
  start_date: string
  end_date: string
  description?: string
  regional_plans: Array<{
    region_id: number
    store_type_id: number
    target_count: number
    contribution_rate: number
    budget_amount: number
  }>
}

// 计划查询参数
export interface StorePlanQueryParams extends PaginationParams {
  name?: string
  plan_type?: PlanType
  status?: PlanStatus
  start_date?: string
  end_date?: string
  region_id?: number
  ordering?: string
}

// 计划取消参数
export interface PlanCancelParams {
  cancel_reason: string
}

// 计划执行进度
export interface PlanProgress {
  plan_id: number
  plan_name: string
  total_target: number
  total_completed: number
  completion_rate: number
  regional_progress: Array<{
    region_id: number
    region_name: string
    store_type_id: number
    store_type_name: string
    target_count: number
    completed_count: number
    completion_rate: number
  }>
}

// 计划统计数据
export interface PlanStatistics {
  plan_id: number
  plan_name: string
  by_region: Array<{
    region_id: number
    region_name: string
    target_count: number
    completed_count: number
    completion_rate: number
    budget_amount: number
  }>
  by_store_type: Array<{
    store_type_id: number
    store_type_name: string
    target_count: number
    completed_count: number
    completion_rate: number
  }>
  alerts: Array<{
    type: string
    message: string
    severity: 'low' | 'medium' | 'high'
  }>
}

// 仪表板数据
export interface DashboardData {
  summary: {
    total_plans: number
    active_plans: number
    completed_plans: number
    total_target: number
    total_completed: number
    overall_completion_rate: number
  }
  recent_plans: Array<{
    id: number
    name: string
    status: PlanStatus
    completion_rate: number
    start_date: string
    end_date: string
  }>
  completion_trend: Array<{
    date: string
    target: number
    completed: number
    completion_rate: number
  }>
  region_performance: Array<{
    region_id: number
    region_name: string
    total_target: number
    total_completed: number
    completion_rate: number
    plan_count: number
  }>
  alerts: Array<{
    plan_id: number
    plan_name: string
    type: string
    message: string
    severity: 'low' | 'medium' | 'high'
    created_at: string
  }>
}

// 分析报表查询参数
export interface ReportQueryParams {
  start_date?: string
  end_date?: string
  region_id?: number
  store_type_id?: number
  plan_type?: PlanType
  status?: PlanStatus
}

// 分析报表数据
export interface AnalysisReport {
  period: {
    start_date: string
    end_date: string
  }
  overview: {
    total_plans: number
    total_target: number
    total_completed: number
    completion_rate: number
    total_budget: number
  }
  by_region: Array<{
    region_id: number
    region_name: string
    plan_count: number
    target_count: number
    completed_count: number
    completion_rate: number
    budget_amount: number
  }>
  by_store_type: Array<{
    store_type_id: number
    store_type_name: string
    plan_count: number
    target_count: number
    completed_count: number
    completion_rate: number
  }>
  by_month: Array<{
    month: string
    target_count: number
    completed_count: number
    completion_rate: number
  }>
  top_performers: Array<{
    region_id: number
    region_name: string
    completion_rate: number
    completed_count: number
  }>
  underperformers: Array<{
    region_id: number
    region_name: string
    completion_rate: number
    gap: number
  }>
}

// 导入结果
export interface ImportResult {
  success: boolean
  message: string
  total: number
  created: number
  updated: number
  failed: number
  errors: Array<{
    row: number
    field?: string
    message: string
  }>
}

// 导出参数
export interface ExportParams {
  plan_ids?: number[]
  start_date?: string
  end_date?: string
  region_id?: number
  store_type_id?: number
  status?: PlanStatus
}

// 文件上传进度
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// 拓店管理相关类型

// 候选点位状态
export type LocationStatus = 'available' | 'following' | 'signed' | 'abandoned'

// 候选点位
export interface CandidateLocation {
  id: number
  name: string
  province: string
  city: string
  district: string
  address: string
  area: number
  rent: number
  business_region_id: number
  business_region?: BusinessRegion
  status: LocationStatus
  created_by: number
  created_by_info?: {
    id: number
    username: string
    full_name: string
  }
  created_at: string
  updated_at: string
}

// 候选点位表单数据
export interface CandidateLocationFormData {
  name: string
  province: string
  city: string
  district: string
  address: string
  area: number
  rent: number
  business_region_id: number
}

// 候选点位查询参数
export interface CandidateLocationQueryParams extends PaginationParams {
  name?: string
  address?: string
  province?: string
  city?: string
  district?: string
  business_region_id?: number
  status?: LocationStatus
  ordering?: string
}

// 跟进单状态
export type FollowUpStatus = 'investigating' | 'calculating' | 'approving' | 'signed' | 'abandoned'

// 跟进单优先级
export type FollowUpPriority = 'low' | 'medium' | 'high' | 'urgent'

// 盈利测算
export interface ProfitCalculation {
  id: number
  rent_cost: number
  decoration_cost: number
  equipment_cost: number
  other_cost: number
  daily_sales: number
  monthly_sales: number
  total_investment: number
  roi: number
  payback_period: number
  contribution_rate: number
  formula_version: string
  calculation_params: Record<string, any>
  calculated_at: string
}

// 铺位跟进单
export interface FollowUpRecord {
  id: number
  record_no: string
  location_id: number
  location?: CandidateLocation
  status: FollowUpStatus
  priority: FollowUpPriority
  survey_data?: Record<string, any>
  survey_date?: string
  business_terms?: Record<string, any>
  profit_calculation?: ProfitCalculation
  contract_info?: Record<string, any>
  contract_date?: string
  contract_reminders: Array<{
    type: string
    date: string
    message: string
  }>
  legal_entity_id?: number
  legal_entity?: {
    id: number
    name: string
    code: string
  }
  is_abandoned: boolean
  abandon_reason?: string
  created_by: number
  created_by_info?: {
    id: number
    username: string
    full_name: string
  }
  created_at: string
  updated_at: string
}

// 跟进单表单数据
export interface FollowUpRecordFormData {
  location_id: number
  priority: FollowUpPriority
  survey_data?: Record<string, any>
  business_terms?: Record<string, any>
  contract_info?: Record<string, any>
  legal_entity_id?: number
}

// 跟进单查询参数
export interface FollowUpRecordQueryParams extends PaginationParams {
  record_no?: string
  location_name?: string
  status?: FollowUpStatus
  priority?: FollowUpPriority
  business_region_id?: number
  created_by?: number
  start_date?: string
  end_date?: string
  ordering?: string
}

// 调研信息录入参数
export interface SurveyDataParams {
  survey_data: Record<string, any>
  survey_date: string
}

// 盈利测算参数
export interface ProfitCalculationParams {
  business_terms: Record<string, any>
  sales_forecast: Record<string, any>
}

// 签约信息参数
export interface ContractInfoParams {
  contract_info: Record<string, any>
  contract_date: string
  legal_entity_id: number
  contract_reminders?: Array<{
    type: string
    date: string
    message: string
  }>
}

// 放弃跟进参数
export interface AbandonFollowUpParams {
  abandon_reason: string
}

// 盈利测算公式配置
export interface ProfitFormulaConfig {
  version: string
  params: {
    cost_rate: number
    expense_rate: number
    tax_rate: number
    [key: string]: number
  }
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 法人主体
export interface LegalEntity {
  id: number
  name: string
  code: string
  registration_number: string
  legal_representative: string
  registered_capital: number
  business_scope: string
  address: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 开店筹备相关类型

// 工程单状态
export type ConstructionStatus = 'planning' | 'in_progress' | 'acceptance' | 'rectification' | 'completed' | 'cancelled'

// 里程碑状态
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed'

// 验收结果
export type AcceptanceResult = 'passed' | 'failed' | 'conditional'

// 整改项状态
export type RectificationStatus = 'pending' | 'in_progress' | 'completed'

// 供应商
export interface Supplier {
  id: number
  name: string
  code: string
  type: string
  contact_person: string
  contact_phone: string
  contact_email?: string
  cooperation_status: 'active' | 'inactive'
  created_at: string
}

// 工程里程碑
export interface Milestone {
  id: number
  construction_order_id: number
  name: string
  planned_date: string
  actual_date?: string
  status: MilestoneStatus
  reminder_sent: boolean
  description?: string
  created_at: string
  updated_at: string
}

// 整改项
export interface RectificationItem {
  id?: number
  description: string
  responsible_person: string
  responsible_person_id?: number
  status: RectificationStatus
  deadline?: string
  completed_at?: string
  photos?: string[]
  remarks?: string
}

// 工程单
export interface ConstructionOrder {
  id: number
  order_no: string
  store_name: string
  follow_up_record_id: number
  follow_up_record?: FollowUpRecord
  design_files: Array<{
    name: string
    url: string
    type: string
    size: number
    uploaded_at: string
  }>
  construction_start_date?: string
  construction_end_date?: string
  actual_end_date?: string
  supplier_id?: number
  supplier?: Supplier
  status: ConstructionStatus
  acceptance_date?: string
  acceptance_result?: AcceptanceResult
  rectification_items: RectificationItem[]
  milestones: Milestone[]
  created_by: number
  created_by_info?: {
    id: number
    username: string
    full_name: string
  }
  created_at: string
  updated_at: string
}

// 工程单表单数据
export interface ConstructionOrderFormData {
  store_name: string
  follow_up_record_id: number
  supplier_id?: number
  construction_start_date?: string
  construction_end_date?: string
  design_files?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
}

// 工程单查询参数
export interface ConstructionOrderQueryParams extends PaginationParams {
  order_no?: string
  store_name?: string
  status?: ConstructionStatus
  supplier_id?: number
  start_date?: string
  end_date?: string
  created_by?: number
  ordering?: string
}

// 里程碑表单数据
export interface MilestoneFormData {
  name: string
  planned_date: string
  description?: string
}

// 验收操作参数
export interface AcceptanceParams {
  acceptance_date: string
  acceptance_result: AcceptanceResult
  rectification_items?: RectificationItem[]
  remarks?: string
  photos?: string[]
}

// 整改项标记参数
export interface RectificationMarkParams {
  item_id: number
  status: RectificationStatus
  completed_at?: string
  remarks?: string
}

// 交付清单状态
export type DeliveryStatus = 'preparing' | 'in_progress' | 'completed'

// 交付项
export interface DeliveryItem {
  id?: number
  name: string
  category: string
  quantity: number
  unit: string
  is_completed: boolean
  completed_at?: string
  remarks?: string
}

// 交付文档
export interface DeliveryDocument {
  id?: number
  name: string
  category: string
  url: string
  type: string
  size: number
  uploaded_at: string
  remarks?: string
}

// 交付清单
export interface DeliveryChecklist {
  id: number
  checklist_no: string
  construction_order_id: number
  construction_order?: ConstructionOrder
  store_name: string
  delivery_items: DeliveryItem[]
  documents: DeliveryDocument[]
  status: DeliveryStatus
  delivery_date?: string
  created_by: number
  created_by_info?: {
    id: number
    username: string
    full_name: string
  }
  created_at: string
  updated_at: string
}

// 交付清单表单数据
export interface DeliveryChecklistFormData {
  construction_order_id: number
  store_name: string
  delivery_items?: DeliveryItem[]
  documents?: DeliveryDocument[]
}

// 交付清单查询参数
export interface DeliveryChecklistQueryParams extends PaginationParams {
  checklist_no?: string
  store_name?: string
  status?: DeliveryStatus
  construction_order_id?: number
  start_date?: string
  end_date?: string
  ordering?: string
}

// 门店档案相关类型

// 门店状态
export type StoreStatus = 'preparing' | 'opening' | 'operating' | 'closed' | 'cancelled'

// 门店类型
export type StoreTypeCode = 'direct' | 'franchise' | 'joint'

// 经营模式
export type OperationMode = 'self_operated' | 'franchised' | 'joint_venture'

// 门店档案
export interface StoreProfile {
  id: number
  store_code: string
  store_name: string
  province: string
  city: string
  district: string
  address: string
  business_region_id: number
  business_region?: BusinessRegion
  store_type: StoreTypeCode
  operation_mode: OperationMode
  follow_up_record_id?: number
  follow_up_record?: FollowUpRecord
  construction_order_id?: number
  construction_order?: ConstructionOrder
  status: StoreStatus
  opening_date?: string
  closing_date?: string
  store_manager_id?: number
  store_manager?: {
    id: number
    username: string
    full_name: string
  }
  business_manager_id?: number
  business_manager?: {
    id: number
    username: string
    full_name: string
  }
  created_by: number
  created_by_info?: {
    id: number
    username: string
    full_name: string
  }
  created_at: string
  updated_at: string
}

// 门店档案表单数据
export interface StoreProfileFormData {
  store_code: string
  store_name: string
  province: string
  city: string
  district: string
  address: string
  business_region_id: number
  store_type: StoreTypeCode
  operation_mode: OperationMode
  follow_up_record_id?: number
  construction_order_id?: number
  opening_date?: string
  store_manager_id?: number
  business_manager_id?: number
}

// 门店档案查询参数
export interface StoreProfileQueryParams extends PaginationParams {
  store_code?: string
  store_name?: string
  province?: string
  city?: string
  district?: string
  business_region_id?: number
  store_type?: StoreTypeCode
  operation_mode?: OperationMode
  status?: StoreStatus
  store_manager_id?: number
  business_manager_id?: number
  start_date?: string
  end_date?: string
  ordering?: string
}

// 门店完整档案信息
export interface StoreFullInfo {
  basic_info: StoreProfile
  follow_up_info?: {
    business_terms: Record<string, any>
    contract_info: Record<string, any>
    profit_calculation?: ProfitCalculation
    legal_entity?: LegalEntity
  }
  construction_info?: {
    design_files: Array<{
      name: string
      url: string
      type: string
      size: number
      uploaded_at: string
    }>
    construction_timeline: {
      start_date?: string
      end_date?: string
      actual_end_date?: string
    }
    milestones: Milestone[]
    delivery_checklist?: DeliveryChecklist
  }
}

// 门店状态变更参数
export interface StoreStatusChangeParams {
  status: StoreStatus
  reason?: string
  effective_date?: string
}

// 审批中心相关类型

// 审批状态
export type ApprovalStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn'

// 审批节点状态
export type ApprovalNodeStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'transferred' | 'countersigned'

// 审批节点类型
export type ApprovalNodeType = 'approval' | 'cc' | 'condition'

// 审批结果
export type ApprovalResult = 'approved' | 'rejected' | 'transferred' | 'countersigned'

// 审批人配置类型
export type ApproverConfigType = 'fixed_users' | 'role' | 'department_manager' | 'initiator_manager'

// 审批模板
export interface ApprovalTemplate {
  id: number
  template_code: string
  template_name: string
  description: string
  form_schema: Record<string, any>
  flow_config: {
    nodes: ApprovalFlowNode[]
  }
  is_active: boolean
  created_by: number
  created_by_info?: {
    id: number
    username: string
    full_name: string
  }
  created_at: string
  updated_at: string
}

// 审批流程节点配置
export interface ApprovalFlowNode {
  name: string
  type: ApprovalNodeType
  approvers: {
    type: ApproverConfigType
    user_ids?: number[]
    role_code?: string
  }
  cc_users?: {
    type: ApproverConfigType
    user_ids?: number[]
    role_code?: string
  }
  condition?: string
}

// 审批实例
export interface ApprovalInstance {
  id: number
  instance_no: string
  template_id: number
  template?: ApprovalTemplate
  title: string
  form_data: Record<string, any>
  business_type: string
  business_id: number
  status: ApprovalStatus
  current_node_id?: number
  current_node?: ApprovalNode
  initiator_id: number
  initiator?: {
    id: number
    username: string
    full_name: string
    department_name?: string
  }
  initiated_at: string
  completed_at?: string
  final_result?: ApprovalResult
  nodes: ApprovalNode[]
  follows?: ApprovalFollow[]
  comments?: ApprovalComment[]
  created_at: string
  updated_at: string
}

// 审批节点
export interface ApprovalNode {
  id: number
  instance_id: number
  node_name: string
  node_type: ApprovalNodeType
  sequence: number
  approvers: User[]
  status: ApprovalNodeStatus
  approval_result?: ApprovalResult
  approval_comment?: string
  approved_by_id?: number
  approved_by?: {
    id: number
    username: string
    full_name: string
  }
  approved_at?: string
  cc_users: User[]
  created_at: string
  updated_at: string
}

// 审批关注
export interface ApprovalFollow {
  id: number
  instance_id: number
  user_id: number
  user?: {
    id: number
    username: string
    full_name: string
  }
  followed_at: string
}

// 审批评论
export interface ApprovalComment {
  id: number
  instance_id: number
  user_id: number
  user?: {
    id: number
    username: string
    full_name: string
  }
  content: string
  created_at: string
}

// 审批模板表单数据
export interface ApprovalTemplateFormData {
  template_code: string
  template_name: string
  description: string
  form_schema: Record<string, any>
  flow_config: {
    nodes: ApprovalFlowNode[]
  }
  is_active?: boolean
}

// 审批模板查询参数
export interface ApprovalTemplateQueryParams extends PaginationParams {
  template_code?: string
  template_name?: string
  is_active?: boolean
  ordering?: string
}

// 审批实例表单数据
export interface ApprovalInstanceFormData {
  template_id: number
  title: string
  form_data: Record<string, any>
  business_type: string
  business_id: number
}

// 审批实例查询参数
export interface ApprovalInstanceQueryParams extends PaginationParams {
  instance_no?: string
  title?: string
  template_id?: number
  business_type?: string
  status?: ApprovalStatus
  initiator_id?: number
  start_date?: string
  end_date?: string
  ordering?: string
}

// 审批处理参数
export interface ApprovalProcessParams {
  node_id: number
  action: 'approve' | 'reject' | 'transfer' | 'countersign'
  comment?: string
  transfer_to_user_id?: number
  countersign_user_ids?: number[]
}

// 审批撤销参数
export interface ApprovalWithdrawParams {
  reason: string
}

// 审批关注参数
export interface ApprovalFollowParams {
  follow: boolean
}

// 审批评论参数
export interface ApprovalCommentParams {
  content: string
}

// 审批台账导出参数
export interface ApprovalExportParams {
  template_id?: number
  start_date?: string
  end_date?: string
  status?: ApprovalStatus
}

// 基础数据管理相关类型

// 业务大区表单数据
export interface BusinessRegionFormData {
  name: string
  code: string
  description?: string
  provinces: string[]
  manager_id?: number
}

// 业务大区查询参数
export interface BusinessRegionQueryParams extends PaginationParams {
  name?: string
  code?: string
  is_active?: boolean
  ordering?: string
}

// 供应商表单数据
export interface SupplierFormData {
  name: string
  code: string
  type: string
  contact_person: string
  contact_phone: string
  contact_email?: string
  address?: string
  business_scope?: string
  cooperation_status?: 'active' | 'inactive'
}

// 供应商查询参数
export interface SupplierQueryParams extends PaginationParams {
  name?: string
  code?: string
  type?: string
  cooperation_status?: 'active' | 'inactive'
  ordering?: string
}

// 法人主体表单数据
export interface LegalEntityFormData {
  name: string
  code: string
  registration_number: string
  legal_representative: string
  registered_capital: number
  business_scope: string
  address: string
  status?: 'active' | 'inactive'
}

// 法人主体查询参数
export interface LegalEntityQueryParams extends PaginationParams {
  name?: string
  code?: string
  registration_number?: string
  status?: 'active' | 'inactive'
  ordering?: string
}

// 客户
export interface Customer {
  id: number
  name: string
  code: string
  contact_person: string
  contact_phone: string
  contact_email?: string
  address?: string
  cooperation_status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 客户表单数据
export interface CustomerFormData {
  name: string
  code: string
  contact_person: string
  contact_phone: string
  contact_email?: string
  address?: string
  cooperation_status?: 'active' | 'inactive'
}

// 客户查询参数
export interface CustomerQueryParams extends PaginationParams {
  name?: string
  code?: string
  cooperation_status?: 'active' | 'inactive'
  ordering?: string
}

// 商务预算
export interface Budget {
  id: number
  name: string
  code: string
  year: number
  amount: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 商务预算表单数据
export interface BudgetFormData {
  name: string
  code: string
  year: number
  amount: number
  description?: string
  is_active?: boolean
}

// 商务预算查询参数
export interface BudgetQueryParams extends PaginationParams {
  name?: string
  code?: string
  year?: number
  is_active?: boolean
  ordering?: string
}
