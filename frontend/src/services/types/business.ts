// 业务实体类型定义
import type { GeoLocation, ApprovalHistory } from './api'

// 开店计划相关类型
export interface StorePlan {
  id: string
  name: string
  description?: string
  type: 'direct' | 'franchise' | 'joint_venture' // 直营、加盟、合资
  status: 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  region: Region
  targetOpenDate: string
  actualOpenDate?: string
  budget: number
  actualCost?: number
  progress: number
  milestones: StorePlanMilestone[]
  attachments: Attachment[]
  approvalFlowId?: string
  approvalHistory: ApprovalHistory[]
  createdBy: string
  createdByName: string
  updatedBy: string
  updatedByName: string
  createdAt: string
  updatedAt: string
}

export interface StorePlanMilestone {
  id: string
  name: string
  description?: string
  targetDate: string
  actualDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  responsible: string
  responsibleName: string
}

export interface StorePlanQueryParams {
  page?: number
  pageSize?: number
  name?: string
  type?: StorePlan['type']
  status?: StorePlan['status']
  priority?: StorePlan['priority']
  regionId?: string
  startDate?: string
  endDate?: string
  createdBy?: string
  keyword?: string
}

export type CreateStorePlanDto = Omit<
  StorePlan,
  | 'id'
  | 'progress'
  | 'approvalHistory'
  | 'createdAt'
  | 'updatedAt'
  | 'createdByName'
  | 'updatedByName'
>
export type UpdateStorePlanDto = Partial<
  Pick<StorePlan, 'name' | 'description' | 'targetOpenDate' | 'budget' | 'priority'>
> & {
  updatedBy: string
  updatedByName: string
}

// 拓店管理相关类型
export interface CandidateLocation {
  id: string
  name: string
  address: string
  location?: GeoLocation
  coordinates?: { lat: number; lng: number }
  businessCircle?: string // 商圈
  area?: number // 面积(平方米)
  rent?: number // 月租金
  rentPrice?: number // 兼容字段
  transferFee?: number // 转让费
  deposit?: number // 押金
  propertyType: 'STREET_SHOP' | 'MALL_SHOP' | 'OFFICE_BUILDING' | 'RESIDENTIAL' | 'STANDALONE'
  floorLevel?: number // 楼层
  hasElevator?: boolean
  parkingSpaces?: number
  nearbyCompetitors?: CompetitorInfo[]
  traffic?: TrafficInfo
  demographics?: DemographicsInfo
  photos?: string[]
  videos?: string[]
  status: 'DISCOVERED' | 'INVESTIGATING' | 'NEGOTIATING' | 'APPROVED' | 'REJECTED' | 'SIGNED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  score?: number // 评分
  followUps?: FollowUpRecord[]
  businessConditions?: BusinessCondition[]
  evaluation?: LocationEvaluation
  discoveredBy?: string
  discoveredByName?: string
  notes?: string
  createdAt: string
  updatedAt: string
  
  // 统计字段
  _count?: {
    followUpRecords?: number
    businessConditions?: number
  }
}

export interface CandidateLocationQueryParams {
  page?: number
  pageSize?: number
  name?: string
  status?: CandidateLocation['status']
  priority?: CandidateLocation['priority']
  businessCircle?: string
  propertyType?: CandidateLocation['propertyType']
  minArea?: number
  maxArea?: number
  minRent?: number
  maxRent?: number
  minScore?: number
  maxScore?: number
  regionId?: string
  discoveredBy?: string
  keyword?: string
}

export interface CompetitorInfo {
  name: string
  brand: string
  distance: number // 距离(米)
  businessType: string
  estimatedRevenue?: number
}

export interface TrafficInfo {
  dailyFootTraffic: number
  peakHours: string[]
  publicTransport: string[]
  accessibility: 'excellent' | 'good' | 'average' | 'poor'
}

export interface DemographicsInfo {
  populationDensity: number
  averageIncome: number
  ageGroups: Record<string, number>
  consumptionLevel: 'high' | 'medium' | 'low'
}

export interface LocationEvaluation {
  overallScore: number // 总分(1-10)
  locationScore: number
  trafficScore: number
  competitionScore: number
  rentabilityScore: number
  notes?: string
  evaluatedBy: string
  evaluatedByName: string
  evaluatedAt: string
}

export interface FollowUpRecord {
  id: string
  candidateLocationId: string
  candidateLocationName?: string
  type: 'CALL' | 'VISIT' | 'MEETING' | 'NEGOTIATION' | 'OTHER'
  content: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  nextAction?: string
  nextActionDate?: string
  responsible?: string
  responsibleName?: string
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  result?: string
  completedAt?: string
  attachments?: string[]
  createdBy?: string
  createdByName?: string
  createdAt: string
  updatedAt?: string
}

export interface BusinessCondition {
  id: string
  candidateLocationId: string
  type: 'RENT' | 'TRANSFER' | 'DECORATION' | 'OTHER'
  description: string
  amount: number
  negotiable: boolean
  status: 'PROPOSED' | 'NEGOTIATING' | 'AGREED' | 'REJECTED'
  notes?: string
  createdBy?: string
  createdByName?: string
  updatedBy?: string
  updatedByName?: string
  createdAt: string
  updatedAt: string
}

// 开店筹备相关类型
export interface PreparationProject {
  id: string
  storePlanId: string
  storePlanName: string
  candidateLocationId: string
  locationName: string
  projectManager: string
  projectManagerName: string
  status: 'planning' | 'designing' | 'constructing' | 'decorating' | 'accepting' | 'completed'
  startDate: string
  targetCompletionDate: string
  actualCompletionDate?: string
  budget: number
  actualCost?: number
  phases: ProjectPhase[]
  vendors: ProjectVendor[]
  documents: ProjectDocument[]
  createdAt: string
  updatedAt: string
}

export interface ProjectPhase {
  id: string
  name: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  startDate: string
  endDate: string
  actualEndDate?: string
  responsible: string
  responsibleName: string
  tasks: ProjectTask[]
}

export interface ProjectTask {
  id: string
  name: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  assigneeName: string
  dueDate: string
  completedAt?: string
  attachments: Attachment[]
}

export interface ProjectVendor {
  id: string
  name: string
  contact: string
  phone: string
  email?: string
  category: 'construction' | 'decoration' | 'equipment' | 'other'
  contractAmount: number
  status: 'potential' | 'contacted' | 'quoted' | 'contracted' | 'completed'
}

export interface ProjectDocument {
  id: string
  name: string
  type: 'contract' | 'permit' | 'drawing' | 'photo' | 'report' | 'other'
  url: string
  uploadedBy: string
  uploadedByName: string
  uploadedAt: string
}

// 门店档案相关类型
export interface Store {
  id: string
  code: string // 门店编码
  name: string
  brand: string
  type: 'direct' | 'franchise' | 'joint_venture'
  status: 'planning' | 'preparing' | 'operating' | 'renovating' | 'closed'
  address: string
  location: GeoLocation
  area: number
  seatingCapacity?: number
  region: Region
  manager: StoreManager
  contactInfo: StoreContactInfo
  businessInfo: StoreBusinessInfo
  certificates: StoreCertificate[]
  equipment: StoreEquipment[]
  documents: StoreDocument[]
  operationHistory: OperationRecord[]
  createdAt: string
  updatedAt: string
}

export interface StoreManager {
  id: string
  name: string
  phone: string
  email?: string
  hireDate: string
  experience: number // 工作经验(年)
  certifications: string[]
}

export interface StoreContactInfo {
  phone: string
  email?: string
  wechat?: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

export interface StoreBusinessInfo {
  businessLicense: string
  taxNumber: string
  legalPerson: string
  registeredCapital: number
  registrationDate: string
  businessScope: string[]
  operatingHours: {
    [day: string]: {
      open: string
      close: string
      isOpen: boolean
    }
  }
}

export interface StoreCertificate {
  id: string
  type: 'business_license' | 'food_permit' | 'tax_registration' | 'fire_permit' | 'other'
  name: string
  number: string
  issueDate: string
  expiryDate?: string
  issuer: string
  url: string
  status: 'valid' | 'expired' | 'pending' | 'suspended'
}

export interface StoreEquipment {
  id: string
  category: 'kitchen' | 'dining' | 'cleaning' | 'office' | 'other'
  name: string
  model?: string
  brand?: string
  serialNumber?: string
  purchaseDate: string
  purchasePrice: number
  warranty?: {
    startDate: string
    endDate: string
    supplier: string
  }
  status: 'normal' | 'maintenance' | 'retired' | 'damaged'
  location: string
  notes?: string
}

export interface StoreDocument {
  id: string
  category: 'contract' | 'certificate' | 'permit' | 'photo' | 'report' | 'manual' | 'other'
  name: string
  description?: string
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedByName: string
  uploadedAt: string
  tags: string[]
}

export interface OperationRecord {
  id: string
  storeId: string
  type: 'open' | 'close' | 'renovate' | 'transfer' | 'inspection' | 'incident' | 'other'
  title: string
  description: string
  date: string
  responsible: string
  responsibleName: string
  impact?: 'none' | 'low' | 'medium' | 'high'
  attachments: Attachment[]
  createdAt: string
}

// 门店运营相关类型
export interface PaymentItem {
  id: string
  storeId: string
  storeName: string
  category: 'rent' | 'utilities' | 'staff' | 'supplies' | 'maintenance' | 'marketing' | 'other'
  subcategory?: string
  description: string
  amount: number
  dueDate: string
  paymentDate?: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod?: 'cash' | 'bank_transfer' | 'check' | 'online'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedByName?: string
  approvedAt?: string
  receipts: string[]
  notes?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface StoreAsset {
  id: string
  storeId: string
  storeName: string
  category: 'equipment' | 'furniture' | 'decoration' | 'inventory' | 'intangible' | 'other'
  name: string
  description?: string
  model?: string
  serialNumber?: string
  purchaseDate: string
  purchasePrice: number
  currentValue: number
  depreciationRate: number
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  location: string
  responsible: string
  responsibleName: string
  maintenanceRecords: MaintenanceRecord[]
  photos: string[]
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  assetId: string
  type: 'routine' | 'repair' | 'replacement' | 'upgrade'
  description: string
  cost: number
  vendor?: string
  performedBy: string
  performedByName: string
  performedAt: string
  nextMaintenanceDate?: string
  notes?: string
}

// 审批中心相关类型
export interface ApprovalFlow {
  id: string
  title: string
  type: 'store_plan' | 'expense' | 'contract' | 'leave' | 'purchase' | 'other'
  businessId?: string // 关联的业务数据ID
  applicant: string
  applicantName: string
  department: string
  departmentName: string
  templateId: string
  templateName: string
  formData: Record<string, any>
  currentNode: ApprovalNode
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'transferred'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  nodes: ApprovalNode[]
  history: ApprovalHistory[]
  attachments: Attachment[]
  deadlineDate?: string
  approvedAt?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ApprovalNode {
  id: string
  name: string
  type: 'user' | 'role' | 'department'
  approvers: ApprovalUser[]
  approvalType: 'any' | 'all' | 'majority' // 任意一人、全部、过半数
  sequence: number
  status: 'pending' | 'approved' | 'rejected' | 'transferred' | 'skipped'
  timeLimit?: number // 时限(小时)
  autoApprove?: boolean // 超时自动同意
  conditions?: ApprovalCondition[]
}

export interface ApprovalUser {
  id: string
  name: string
  avatar?: string
  status: 'pending' | 'approved' | 'rejected' | 'transferred'
  comment?: string
  processedAt?: string
}

export interface ApprovalCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin'
  value: any
}

export interface ApprovalTemplate {
  id: string
  name: string
  category: string
  description?: string
  formSchema: FormSchema
  flowConfig: FlowConfig
  enabled: boolean
  version: number
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface FormSchema {
  fields: FormField[]
  layout: FormLayout
  validation: FormValidation
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'file' | 'image'
  required: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  rules?: ValidationRule[]
  dependencies?: FieldDependency[]
}

export interface FormLayout {
  columns: number
  sections: Array<{
    title: string
    fields: string[]
  }>
}

export interface FormValidation {
  rules: ValidationRule[]
  customValidator?: string
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface FieldDependency {
  field: string
  condition: ApprovalCondition
  action: 'show' | 'hide' | 'require' | 'disable'
}

export interface FlowConfig {
  nodes: ApprovalNodeConfig[]
  conditions: FlowCondition[]
}

export interface ApprovalNodeConfig {
  id: string
  name: string
  type: 'user' | 'role' | 'department'
  approvers: string[]
  approvalType: 'any' | 'all' | 'majority'
  timeLimit?: number
  autoApprove?: boolean
  conditions?: ApprovalCondition[]
}

export interface FlowCondition {
  condition: ApprovalCondition
  targetNodeId: string
  action: 'skip' | 'jump' | 'end'
}

// 基础数据相关类型
export interface Region {
  id: string
  code: string
  name: string
  level: number // 1-省, 2-市, 3-区县, 4-街道
  parentId?: string
  children?: Region[]
  enabled: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  shortName?: string
  category: 'equipment' | 'decoration' | 'material' | 'service' | 'other'
  type: 'individual' | 'company'
  contactInfo: SupplierContactInfo
  businessInfo: SupplierBusinessInfo
  cooperationInfo: SupplierCooperationInfo
  qualifications: SupplierQualification[]
  contracts: SupplierContract[]
  evaluations: SupplierEvaluation[]
  status: 'active' | 'inactive' | 'blacklisted'
  tags: string[]
  notes?: string
  createdBy: string
  createdByName: string
  updatedBy: string
  updatedByName: string
  createdAt: string
  updatedAt: string
}

export interface SupplierContactInfo {
  contact: string
  phone: string
  mobile?: string
  email?: string
  wechat?: string
  address: string
  website?: string
}

export interface SupplierBusinessInfo {
  businessLicense?: string
  taxNumber?: string
  legalPerson?: string
  registeredCapital?: number
  registrationDate?: string
  businessScope?: string[]
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
}

export interface SupplierCooperationInfo {
  cooperationStartDate?: string
  paymentTerms: 'cash' | 'monthly' | 'quarterly' | 'custom' // 付款条件：现金、月结、季结、自定义
  creditRating: 'A' | 'B' | 'C' | 'D' // 信用等级
  serviceRating: 1 | 2 | 3 | 4 | 5 // 服务评分 1-5星
}

export interface SupplierQualification {
  id: string
  type: string
  name: string
  number: string
  issueDate: string
  expiryDate?: string
  issuer: string
  fileUrl: string
  status: 'valid' | 'expired' | 'pending'
}

export interface SupplierContract {
  id: string
  name: string
  type: string
  signDate: string
  startDate: string
  endDate: string
  amount: number
  status: 'draft' | 'active' | 'expired' | 'terminated'
  fileUrl: string
}

export interface SupplierEvaluation {
  id: string
  evaluator: string
  evaluatorName: string
  period: string // 评估期间
  qualityScore: number
  serviceScore: number
  deliveryScore: number
  priceScore: number
  overallScore: number
  comments?: string
  evaluatedAt: string
}

export interface SupplierQueryParams {
  page?: number
  pageSize?: number
  name?: string
  code?: string
  category?: Supplier['category']
  type?: Supplier['type']
  status?: Supplier['status']
  creditRating?: SupplierCooperationInfo['creditRating']
  keyword?: string
}

export type CreateSupplierDto = Omit<
  Supplier,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'createdByName'
  | 'updatedByName'
  | 'qualifications'
  | 'contracts'
  | 'evaluations'
>

export type UpdateSupplierDto = Partial<
  Pick<
    Supplier,
    | 'name'
    | 'shortName'
    | 'category'
    | 'type'
    | 'contactInfo'
    | 'businessInfo'
    | 'cooperationInfo'
    | 'status'
    | 'tags'
    | 'notes'
  >
> & {
  updatedBy: string
  updatedByName: string
}

export interface SupplierStats {
  totalSuppliers: number
  activeSuppliers: number
  suppliersByCategory: Array<{
    category: string
    count: number
  }>
  qualificationExpiring: number
  averageRating: number
}

export interface Organization {
  id: string
  code: string
  name: string
  shortName?: string
  type: 'company' | 'department' | 'team' | 'branch'
  level: number
  parentId?: string
  children?: Organization[]
  manager?: {
    id: string
    name: string
  }
  contactInfo: {
    phone?: string
    email?: string
    address?: string
  }
  enabled: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  code: string
  name: string
  type: 'individual' | 'company'
  category: 'franchisee' | 'partner' | 'supplier' | 'other'
  contactInfo: CustomerContactInfo
  businessInfo?: CustomerBusinessInfo
  stores: string[] // 关联的门店ID
  contracts: CustomerContract[]
  status: 'active' | 'inactive' | 'potential'
  tags: string[]
  notes?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface CustomerContactInfo {
  contact: string
  phone: string
  email?: string
  wechat?: string
  address?: string
  idNumber?: string // 身份证号(个人)
}

export interface CustomerBusinessInfo {
  companyName: string
  businessLicense: string
  taxNumber: string
  legalPerson: string
  registeredAddress: string
  businessScope: string[]
}

export interface CustomerContract {
  id: string
  name: string
  type: 'franchise' | 'cooperation' | 'supply' | 'service' | 'other'
  signDate: string
  startDate: string
  endDate?: string
  amount?: number
  status: 'draft' | 'active' | 'expired' | 'terminated'
  fileUrl: string
}

// 业务大区相关类型
export interface BusinessRegion {
  id: string
  name: string
  code: string
  description?: string
  managerId: string
  managerName: string
  cities: City[]
  cityCount: number
  storeCount: number
  status: 'active' | 'inactive'
  createdBy: string
  createdByName: string
  updatedBy: string
  updatedByName: string
  createdAt: string
  updatedAt: string
}

export interface City {
  id: string
  name: string
  code: string
  provinceId: string
  provinceName: string
  businessRegionId?: string
  businessRegionName?: string
  storeCount: number
  enabled: boolean
  sort: number
}

export interface BusinessRegionStats {
  totalRegions: number
  activeRegions: number
  totalCities: number
  totalStores: number
  regionPerformance: Array<{
    regionId: string
    regionName: string
    storeCount: number
    revenue?: number
    growth?: number
  }>
}

export interface BusinessRegionQueryParams {
  page?: number
  pageSize?: number
  name?: string
  code?: string
  status?: BusinessRegion['status']
  managerId?: string
  keyword?: string
}

export type CreateBusinessRegionDto = Omit<
  BusinessRegion,
  | 'id'
  | 'cities'
  | 'cityCount'
  | 'storeCount'
  | 'createdAt'
  | 'updatedAt'
  | 'createdByName'
  | 'updatedByName'
>

export type UpdateBusinessRegionDto = Partial<
  Pick<BusinessRegion, 'name' | 'description' | 'managerId' | 'managerName' | 'status'>
> & {
  updatedBy: string
  updatedByName: string
}

export interface CityTransferDto {
  cityIds: string[]
  fromRegionId?: string
  toRegionId: string
}

// 通用附件类型
export interface Attachment {
  id: string
  name: string
  originalName: string
  url: string
  size: number
  mimeType: string
  category?: string
  uploadedBy: string
  uploadedByName: string
  uploadedAt: string
}
