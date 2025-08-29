/**
 * 开店筹备管理模块相关类型定义
 */
import { z } from 'zod';
import type {
  ConstructionProject,
  ApprovalFlow,
  ProjectProgressLog,
  Quotation,
  CandidateLocation,
  Supplier,
  User,
  ProjectStatus,
  Priority,
  ApprovalStatus,
  PaymentStatus,
  Status
} from '@prisma/client';

// ===============================
// 枚举类型定义
// ===============================

// 筹备项目状态枚举
export const PreparationStatus = {
  PLANNING: 'PLANNING',           // 规划中
  APPROVED: 'APPROVED',           // 已批准
  IN_PROGRESS: 'IN_PROGRESS',     // 进行中
  SUSPENDED: 'SUSPENDED',         // 已暂停
  COMPLETED: 'COMPLETED',         // 已完成
  CANCELLED: 'CANCELLED',         // 已取消
  OVERDUE: 'OVERDUE',             // 已逾期
} as const;

export type PreparationStatusType = typeof PreparationStatus[keyof typeof PreparationStatus];

// 工程项目状态枚举
export const EngineeringStatus = {
  PLANNED: 'PLANNED',             // 已计划
  APPROVED: 'APPROVED',           // 已批准
  IN_PROGRESS: 'IN_PROGRESS',     // 施工中
  SUSPENDED: 'SUSPENDED',         // 已暂停
  COMPLETED: 'COMPLETED',         // 已完成
  CANCELLED: 'CANCELLED',         // 已取消
  ACCEPTED: 'ACCEPTED',           // 已验收
  WARRANTY: 'WARRANTY',           // 保修期
} as const;

export type EngineeringStatusType = typeof EngineeringStatus[keyof typeof EngineeringStatus];

// 设备采购状态枚举
export const EquipmentStatus = {
  PENDING: 'PENDING',             // 待采购
  QUOTED: 'QUOTED',               // 已报价
  APPROVED: 'APPROVED',           // 已批准
  ORDERED: 'ORDERED',             // 已下单
  DELIVERED: 'DELIVERED',         // 已交付
  INSTALLED: 'INSTALLED',         // 已安装
  ACCEPTED: 'ACCEPTED',           // 已验收
  WARRANTY: 'WARRANTY',           // 保修期
  MAINTENANCE: 'MAINTENANCE',     // 维护中
} as const;

export type EquipmentStatusType = typeof EquipmentStatus[keyof typeof EquipmentStatus];

// 证照办理状态枚举
export const LicenseStatus = {
  PENDING: 'PENDING',             // 待办理
  SUBMITTED: 'SUBMITTED',         // 已提交
  UNDER_REVIEW: 'UNDER_REVIEW',   // 审核中
  APPROVED: 'APPROVED',           // 已批准
  ISSUED: 'ISSUED',               // 已发证
  REJECTED: 'REJECTED',           // 已拒绝
  EXPIRED: 'EXPIRED',             // 已过期
  RENEWED: 'RENEWED',             // 已续期
} as const;

export type LicenseStatusType = typeof LicenseStatus[keyof typeof LicenseStatus];

// 人员招聘状态枚举
export const RecruitmentStatus = {
  PLANNING: 'PLANNING',           // 规划中
  PUBLISHED: 'PUBLISHED',         // 已发布
  INTERVIEWING: 'INTERVIEWING',   // 面试中
  OFFERED: 'OFFERED',             // 已发offer
  ONBOARDED: 'ONBOARDED',         // 已入职
  CANCELLED: 'CANCELLED',         // 已取消
  COMPLETED: 'COMPLETED',         // 已完成
} as const;

export type RecruitmentStatusType = typeof RecruitmentStatus[keyof typeof RecruitmentStatus];

// 里程碑状态枚举
export const MilestoneStatus = {
  PENDING: 'PENDING',             // 待开始
  IN_PROGRESS: 'IN_PROGRESS',     // 进行中
  COMPLETED: 'COMPLETED',         // 已完成
  OVERDUE: 'OVERDUE',             // 已逾期
  CANCELLED: 'CANCELLED',         // 已取消
  BLOCKED: 'BLOCKED',             // 被阻塞
} as const;

export type MilestoneStatusType = typeof MilestoneStatus[keyof typeof MilestoneStatus];

// 工程项目类型枚举
export const ProjectType = {
  CONSTRUCTION: 'CONSTRUCTION',   // 基础建设
  DECORATION: 'DECORATION',       // 装修装饰
  EQUIPMENT: 'EQUIPMENT',         // 设备安装
  ELECTRICAL: 'ELECTRICAL',       // 电气工程
  PLUMBING: 'PLUMBING',          // 管道工程
  HVAC: 'HVAC',                  // 暖通空调
  FIRE_SAFETY: 'FIRE_SAFETY',    // 消防工程
  SECURITY: 'SECURITY',          // 安防工程
  NETWORK: 'NETWORK',            // 网络工程
  OTHER: 'OTHER',                // 其他
} as const;

export type ProjectTypeType = typeof ProjectType[keyof typeof ProjectType];

// 设备类别枚举
export const EquipmentCategory = {
  KITCHEN: 'KITCHEN',             // 厨房设备
  DINING: 'DINING',               // 餐厅设备
  COOLING: 'COOLING',             // 制冷设备
  CLEANING: 'CLEANING',           // 清洁设备
  SAFETY: 'SAFETY',               // 安全设备
  FURNITURE: 'FURNITURE',         // 家具设备
  TECHNOLOGY: 'TECHNOLOGY',       // 技术设备
  DECORATION: 'DECORATION',       // 装饰设备
  OTHER: 'OTHER',                 // 其他设备
} as const;

export type EquipmentCategoryType = typeof EquipmentCategory[keyof typeof EquipmentCategory];

// 证照类型枚举
export const LicenseType = {
  BUSINESS: 'BUSINESS',           // 营业执照
  FOOD_SERVICE: 'FOOD_SERVICE',   // 食品经营许可证
  FIRE_SAFETY: 'FIRE_SAFETY',     // 消防安全检查合格证
  HEALTH: 'HEALTH',               // 健康证
  TAX: 'TAX',                     // 税务登记证
  SIGNBOARD: 'SIGNBOARD',         // 门头招牌许可证
  ENVIRONMENTAL: 'ENVIRONMENTAL', // 环保许可证
  SPECIAL: 'SPECIAL',             // 特殊许可证
  OTHER: 'OTHER',                 // 其他证照
} as const;

export type LicenseTypeType = typeof LicenseType[keyof typeof LicenseType];

// 职位类型枚举
export const PositionType = {
  MANAGER: 'MANAGER',             // 店长/经理
  CHEF: 'CHEF',                   // 厨师
  SERVER: 'SERVER',               // 服务员
  CASHIER: 'CASHIER',             // 收银员
  CLEANER: 'CLEANER',             // 保洁员
  SECURITY: 'SECURITY',           // 保安
  MAINTENANCE: 'MAINTENANCE',     // 维修工
  SALES: 'SALES',                 // 销售员
  OTHER: 'OTHER',                 // 其他职位
} as const;

export type PositionTypeType = typeof PositionType[keyof typeof PositionType];

// ===============================
// 基础数据类型
// ===============================

// 筹备项目基础类型
export interface PreparationProject {
  id: string;
  projectCode: string;            // 筹备项目编号
  projectName: string;            // 筹备项目名称
  candidateLocationId: string;    // 候选点位ID
  storeCode?: string;             // 门店编码
  storeName?: string;             // 门店名称
  status: PreparationStatusType;  // 项目状态
  priority: Priority;             // 优先级
  plannedStartDate: Date;         // 计划开始日期
  plannedEndDate: Date;           // 计划结束日期
  actualStartDate?: Date;         // 实际开始日期
  actualEndDate?: Date;           // 实际结束日期
  budget: number;                 // 预算金额
  actualBudget?: number;          // 实际预算
  progressPercentage: number;     // 总体进度百分比(0-100)
  description?: string;           // 项目描述
  notes?: string;                 // 备注
  managerId?: string;             // 项目经理ID
  approvalFlowId?: string;        // 审批流ID
  createdAt: Date;
  updatedAt: Date;
}

// 工程任务管理类型（扩展ConstructionProject）
export interface EngineeringTask extends ConstructionProject {
  taskType: ProjectTypeType;      // 任务类型
  subTasks?: EngineeringSubTask[]; // 子任务
  qualityChecks?: QualityCheck[]; // 质量检查记录
  safetyRecords?: SafetyRecord[]; // 安全记录
  materialUsage?: MaterialUsage[]; // 材料使用记录
}

// 工程子任务类型
export interface EngineeringSubTask {
  id: string;
  parentTaskId: string;
  name: string;                   // 子任务名称
  description?: string;           // 任务描述
  status: EngineeringStatusType;  // 状态
  priority: Priority;             // 优先级
  plannedStartDate: Date;         // 计划开始日期
  plannedEndDate: Date;           // 计划结束日期
  actualStartDate?: Date;         // 实际开始日期
  actualEndDate?: Date;           // 实际结束日期
  progressPercentage: number;     // 进度百分比
  assigneeId?: string;            // 负责人ID
  budget?: number;                // 预算
  actualCost?: number;            // 实际成本
  dependencies?: string[];        // 依赖的任务ID
  attachments?: string[];         // 附件
  notes?: string;                 // 备注
}

// 质量检查记录类型
export interface QualityCheck {
  id: string;
  taskId: string;
  checkDate: Date;                // 检查日期
  checkType: string;              // 检查类型
  checkPoints: QualityCheckPoint[]; // 检查点
  overallScore: number;           // 总体评分(0-100)
  result: 'PASSED' | 'FAILED' | 'CONDITIONAL'; // 检查结果
  inspector: string;              // 检查员
  issues?: string;                // 发现问题
  correctionPlan?: string;        // 整改计划
  photos?: string[];              // 检查照片
  documents?: string[];           // 检查文档
}

// 质量检查点类型
export interface QualityCheckPoint {
  name: string;                   // 检查点名称
  standard: string;               // 检查标准
  score: number;                  // 得分(0-100)
  result: 'PASS' | 'FAIL';       // 检查结果
  notes?: string;                 // 备注
}

// 安全记录类型
export interface SafetyRecord {
  id: string;
  taskId: string;
  recordDate: Date;               // 记录日期
  type: 'INSPECTION' | 'INCIDENT' | 'TRAINING'; // 记录类型
  description: string;            // 记录描述
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // 严重程度
  involvedPersons?: string[];     // 涉及人员
  correctionActions?: string;     // 纠正措施
  followUpDate?: Date;            // 跟进日期
  status: 'OPEN' | 'CLOSED';      // 状态
  reporter: string;               // 记录人
  photos?: string[];              // 相关照片
  documents?: string[];           // 相关文档
}

// 材料使用记录类型
export interface MaterialUsage {
  id: string;
  taskId: string;
  materialName: string;           // 材料名称
  specification: string;          // 规格型号
  unit: string;                   // 单位
  plannedQuantity: number;        // 计划用量
  actualQuantity: number;         // 实际用量
  unitPrice: number;              // 单价
  totalCost: number;              // 总成本
  supplier: string;               // 供应商
  deliveryDate: Date;             // 交付日期
  acceptanceDate?: Date;          // 验收日期
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'; // 质量评级
  wastageRate?: number;           // 损耗率
  notes?: string;                 // 备注
}

// 设备采购管理类型
export interface EquipmentProcurement {
  id: string;
  procurementCode: string;        // 采购编号
  preparationProjectId: string;   // 筹备项目ID
  category: EquipmentCategoryType; // 设备类别
  equipmentName: string;          // 设备名称
  brand?: string;                 // 品牌
  model?: string;                 // 型号
  specifications: Record<string, any>; // 规格参数JSON
  quantity: number;               // 采购数量
  unitPrice?: number;             // 单价
  totalPrice?: number;            // 总价
  currency: string;               // 币种
  status: EquipmentStatusType;    // 状态
  priority: Priority;             // 优先级
  plannedDeliveryDate?: Date;     // 计划交付日期
  actualDeliveryDate?: Date;      // 实际交付日期
  installationDate?: Date;        // 安装日期
  acceptanceDate?: Date;          // 验收日期
  warrantyPeriod?: number;        // 保修期(月)
  warrantyExpiry?: Date;          // 保修到期日期
  supplier?: string;              // 供应商
  supplierContact?: string;       // 供应商联系方式
  purchaseOrder?: string;         // 采购订单号
  deliveryAddress?: string;       // 交付地址
  installationRequirements?: string; // 安装要求
  operationManual?: string[];     // 操作手册
  maintenanceSchedule?: Record<string, any>; // 维护计划JSON
  photos?: string[];              // 设备照片
  documents?: string[];           // 相关文档
  notes?: string;                 // 备注
  createdAt: Date;
  updatedAt: Date;
}

// 证照办理管理类型
export interface LicenseApplication {
  id: string;
  applicationCode: string;        // 申请编号
  preparationProjectId: string;   // 筹备项目ID
  licenseType: LicenseTypeType;   // 证照类型
  licenseName: string;            // 证照名称
  issuingAuthority: string;       // 发证机关
  status: LicenseStatusType;      // 状态
  priority: Priority;             // 优先级
  applicationDate?: Date;         // 申请日期
  submissionDate?: Date;          // 提交日期
  reviewStartDate?: Date;         // 审核开始日期
  approvalDate?: Date;            // 批准日期
  issuanceDate?: Date;            // 发证日期
  expiryDate?: Date;              // 有效期截止日期
  renewalDate?: Date;             // 续期日期
  licenseNumber?: string;         // 证照编号
  applicationFee?: number;        // 申请费用
  actualFee?: number;             // 实际费用
  currency: string;               // 币种
  applicant?: string;             // 申请人
  contactPerson?: string;         // 联系人
  contactPhone?: string;          // 联系电话
  applicationAddress?: string;    // 申请地址
  requiredDocuments: string[];    // 所需材料清单
  submittedDocuments?: string[];  // 已提交材料
  missingDocuments?: string[];    // 缺失材料
  rejectionReason?: string;       // 拒绝原因
  conditions?: string;            // 批准条件
  renewalReminder?: Date;         // 续期提醒日期
  attachments?: string[];         // 附件
  notes?: string;                 // 备注
  createdAt: Date;
  updatedAt: Date;
}

// 人员招聘管理类型
export interface StaffRecruitment {
  id: string;
  recruitmentCode: string;        // 招聘编号
  preparationProjectId: string;   // 筹备项目ID
  positionType: PositionTypeType; // 职位类型
  positionTitle: string;          // 职位标题
  department?: string;            // 所属部门
  plannedCount: number;           // 计划招聘人数
  recruitedCount: number;         // 已招聘人数
  onboardedCount: number;         // 已入职人数
  status: RecruitmentStatusType;  // 状态
  priority: Priority;             // 优先级
  startDate?: Date;               // 招聘开始日期
  endDate?: Date;                 // 招聘结束日期
  salaryRange?: {                 // 薪资范围
    min: number;
    max: number;
    currency: string;
  };
  workLocation?: string;          // 工作地点
  workSchedule?: string;          // 工作安排
  qualificationRequirements: string; // 资格要求
  jobDescription: string;         // 职位描述
  benefits?: string;              // 福利待遇
  recruitmentChannels?: string[]; // 招聘渠道
  recruiters?: string[];          // 招聘负责人ID
  interviewers?: string[];        // 面试官ID
  candidates?: CandidateInfo[];   // 候选人信息
  notes?: string;                 // 备注
  createdAt: Date;
  updatedAt: Date;
}

// 候选人信息类型
export interface CandidateInfo {
  id: string;
  name: string;                   // 姓名
  phone: string;                  // 电话
  email?: string;                 // 邮箱
  resumeUrl?: string;             // 简历链接
  source: string;                 // 来源渠道
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEWED' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  applicationDate: Date;          // 申请日期
  screeningScore?: number;        // 筛选评分
  interviewDate?: Date;           // 面试日期
  interviewScore?: number;        // 面试评分
  interviewNotes?: string;        // 面试备注
  offerDate?: Date;               // offer日期
  expectedSalary?: number;        // 期望薪资
  onboardDate?: Date;             // 入职日期
  rejectionReason?: string;       // 拒绝原因
  notes?: string;                 // 备注
}

// 里程碑跟踪类型
export interface MilestoneTracking {
  id: string;
  preparationProjectId: string;   // 筹备项目ID
  name: string;                   // 里程碑名称
  description?: string;           // 描述
  category: string;               // 类别
  status: MilestoneStatusType;    // 状态
  priority: Priority;             // 优先级
  plannedDate: Date;              // 计划日期
  actualDate?: Date;              // 实际日期
  dependencies?: string[];        // 依赖的里程碑ID
  relatedTasks?: string[];        // 相关任务ID
  deliverables?: string[];        // 交付物
  criteria?: string;              // 完成标准
  owner?: string;                 // 负责人ID
  stakeholders?: string[];        // 利益相关者ID
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // 风险等级
  notes?: string;                 // 备注
  createdAt: Date;
  updatedAt: Date;
}

// ===============================
// 扩展关联类型
// ===============================

// 筹备项目扩展类型（包含关联数据）
export interface PreparationProjectWithRelations extends PreparationProject {
  candidateLocation: CandidateLocation;
  engineeringTasks?: EngineeringTask[];
  equipmentProcurements?: EquipmentProcurement[];
  licenseApplications?: LicenseApplication[];
  staffRecruitments?: StaffRecruitment[];
  milestones?: MilestoneTracking[];
  approvalFlow?: ApprovalFlow;
  manager?: User;
  _count?: {
    engineeringTasks: number;
    equipmentProcurements: number;
    licenseApplications: number;
    staffRecruitments: number;
    milestones: number;
  };
}

// 工程任务扩展类型（包含关联数据）
export interface EngineeringTaskWithRelations extends EngineeringTask {
  candidateLocation: CandidateLocation;
  supplier: Supplier;
  quotations?: Quotation[];
  progressLogs?: ProjectProgressLog[];
  approvalFlow?: ApprovalFlow;
  subTasks?: EngineeringSubTask[];
  qualityChecks?: QualityCheck[];
  safetyRecords?: SafetyRecord[];
  materialUsage?: MaterialUsage[];
}

// 设备采购扩展类型（包含关联数据）
export interface EquipmentProcurementWithRelations extends EquipmentProcurement {
  preparationProject: PreparationProject;
  quotations?: Quotation[];
  installationTasks?: EngineeringTask[];
}

// 证照办理扩展类型（包含关联数据）
export interface LicenseApplicationWithRelations extends LicenseApplication {
  preparationProject: PreparationProject;
  approvalFlow?: ApprovalFlow;
  renewalApplications?: LicenseApplication[]; // 续期申请
}

// 人员招聘扩展类型（包含关联数据）
export interface StaffRecruitmentWithRelations extends Omit<StaffRecruitment, 'recruiters' | 'interviewers'> {
  preparationProject: PreparationProject;
  recruiters?: User[];
  interviewers?: User[];
  candidates?: CandidateInfo[];
}

// 里程碑跟踪扩展类型（包含关联数据）
export interface MilestoneTrackingWithRelations extends Omit<MilestoneTracking, 'owner' | 'stakeholders'> {
  preparationProject: PreparationProject;
  owner?: User;
  stakeholders?: User[];
  dependentMilestones?: MilestoneTracking[];
  dependencyMilestones?: MilestoneTracking[];
}

// ===============================
// 分页和筛选类型
// ===============================

// 分页参数类型
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页结果类型
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 筹备项目筛选参数
export interface PreparationProjectFilters {
  candidateLocationId?: string;
  status?: PreparationStatusType;
  priority?: Priority;
  managerId?: string;
  plannedStartDateStart?: string;
  plannedStartDateEnd?: string;
  plannedEndDateStart?: string;
  plannedEndDateEnd?: string;
  minBudget?: number;
  maxBudget?: number;
  minProgress?: number;
  maxProgress?: number;
  keyword?: string; // 搜索关键词(项目名称、编号)
}

// 工程任务筛选参数
export interface EngineeringTaskFilters {
  preparationProjectId?: string;
  candidateLocationId?: string;
  supplierId?: string;
  taskType?: ProjectTypeType;
  status?: EngineeringStatusType;
  priority?: Priority;
  plannedStartDateStart?: string;
  plannedStartDateEnd?: string;
  plannedEndDateStart?: string;
  plannedEndDateEnd?: string;
  minBudget?: number;
  maxBudget?: number;
  minProgress?: number;
  maxProgress?: number;
  keyword?: string;
}

// 设备采购筛选参数
export interface EquipmentProcurementFilters {
  preparationProjectId?: string;
  category?: EquipmentCategoryType;
  status?: EquipmentStatusType;
  priority?: Priority;
  supplier?: string;
  plannedDeliveryDateStart?: string;
  plannedDeliveryDateEnd?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string; // 搜索关键词(设备名称、品牌、型号)
}

// 证照办理筛选参数
export interface LicenseApplicationFilters {
  preparationProjectId?: string;
  licenseType?: LicenseTypeType;
  status?: LicenseStatusType;
  priority?: Priority;
  issuingAuthority?: string;
  applicationDateStart?: string;
  applicationDateEnd?: string;
  expiryDateStart?: string;
  expiryDateEnd?: string;
  needsRenewal?: boolean; // 是否需要续期
  keyword?: string;
}

// 人员招聘筛选参数
export interface StaffRecruitmentFilters {
  preparationProjectId?: string;
  positionType?: PositionTypeType;
  status?: RecruitmentStatusType;
  priority?: Priority;
  department?: string;
  startDateStart?: string;
  startDateEnd?: string;
  endDateStart?: string;
  endDateEnd?: string;
  keyword?: string;
}

// 里程碑筛选参数
export interface MilestoneTrackingFilters {
  preparationProjectId?: string;
  category?: string;
  status?: MilestoneStatusType;
  priority?: Priority;
  ownerId?: string;
  plannedDateStart?: string;
  plannedDateEnd?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  keyword?: string;
}

// 排序参数类型
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// ===============================
// 请求类型定义
// ===============================

// 创建筹备项目请求
export interface CreatePreparationProjectRequest {
  candidateLocationId: string;
  projectName: string;
  storeCode?: string;
  storeName?: string;
  priority?: Priority;
  plannedStartDate: string;
  plannedEndDate: string;
  budget: number;
  description?: string;
  notes?: string;
  managerId?: string;
}

// 更新筹备项目请求
export interface UpdatePreparationProjectRequest {
  projectName?: string;
  storeCode?: string;
  storeName?: string;
  priority?: Priority;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget?: number;
  actualBudget?: number;
  description?: string;
  notes?: string;
  managerId?: string;
}

// 创建工程任务请求
export interface CreateEngineeringTaskRequest {
  preparationProjectId?: string;
  candidateLocationId: string;
  supplierId: string;
  taskType: ProjectTypeType;
  projectName: string;
  contractNumber?: string;
  contractAmount: number;
  plannedStartDate: string;
  plannedEndDate: string;
  description?: string;
  notes?: string;
  riskLevel?: Priority;
}

// 更新工程任务请求
export interface UpdateEngineeringTaskRequest {
  projectName?: string;
  supplierId?: string;
  taskType?: ProjectTypeType;
  contractNumber?: string;
  contractAmount?: number;
  actualAmount?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progressPercentage?: number;
  qualityScore?: number;
  description?: string;
  notes?: string;
  riskLevel?: Priority;
}

// 创建设备采购请求
export interface CreateEquipmentProcurementRequest {
  preparationProjectId: string;
  category: EquipmentCategoryType;
  equipmentName: string;
  brand?: string;
  model?: string;
  specifications?: Record<string, any>;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  currency?: string;
  priority?: Priority;
  plannedDeliveryDate?: string;
  warrantyPeriod?: number;
  supplier?: string;
  supplierContact?: string;
  deliveryAddress?: string;
  installationRequirements?: string;
  notes?: string;
}

// 更新设备采购请求
export interface UpdateEquipmentProcurementRequest {
  category?: EquipmentCategoryType;
  equipmentName?: string;
  brand?: string;
  model?: string;
  specifications?: Record<string, any>;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  priority?: Priority;
  plannedDeliveryDate?: string;
  actualDeliveryDate?: string;
  installationDate?: string;
  acceptanceDate?: string;
  warrantyPeriod?: number;
  warrantyExpiry?: string;
  supplier?: string;
  supplierContact?: string;
  purchaseOrder?: string;
  deliveryAddress?: string;
  installationRequirements?: string;
  operationManual?: string[];
  maintenanceSchedule?: Record<string, any>;
  photos?: string[];
  documents?: string[];
  notes?: string;
}

// 创建证照办理请求
export interface CreateLicenseApplicationRequest {
  preparationProjectId: string;
  licenseType: LicenseTypeType;
  licenseName: string;
  issuingAuthority: string;
  priority?: Priority;
  applicationDate?: string;
  applicationFee?: number;
  currency?: string;
  applicant?: string;
  contactPerson?: string;
  contactPhone?: string;
  applicationAddress?: string;
  requiredDocuments: string[];
  notes?: string;
}

// 更新证照办理请求
export interface UpdateLicenseApplicationRequest {
  licenseName?: string;
  issuingAuthority?: string;
  priority?: Priority;
  applicationDate?: string;
  submissionDate?: string;
  reviewStartDate?: string;
  approvalDate?: string;
  issuanceDate?: string;
  expiryDate?: string;
  renewalDate?: string;
  licenseNumber?: string;
  applicationFee?: number;
  actualFee?: number;
  applicant?: string;
  contactPerson?: string;
  contactPhone?: string;
  applicationAddress?: string;
  requiredDocuments?: string[];
  submittedDocuments?: string[];
  missingDocuments?: string[];
  rejectionReason?: string;
  conditions?: string;
  renewalReminder?: string;
  attachments?: string[];
  notes?: string;
}

// 创建人员招聘请求
export interface CreateStaffRecruitmentRequest {
  preparationProjectId: string;
  positionType: PositionTypeType;
  positionTitle: string;
  department?: string;
  plannedCount: number;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  workLocation?: string;
  workSchedule?: string;
  qualificationRequirements: string;
  jobDescription: string;
  benefits?: string;
  recruitmentChannels?: string[];
  recruiters?: string[];
  interviewers?: string[];
  notes?: string;
}

// 更新人员招聘请求
export interface UpdateStaffRecruitmentRequest {
  positionTitle?: string;
  department?: string;
  plannedCount?: number;
  recruitedCount?: number;
  onboardedCount?: number;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  workLocation?: string;
  workSchedule?: string;
  qualificationRequirements?: string;
  jobDescription?: string;
  benefits?: string;
  recruitmentChannels?: string[];
  recruiters?: string[];
  interviewers?: string[];
  notes?: string;
}

// 创建里程碑请求
export interface CreateMilestoneTrackingRequest {
  preparationProjectId: string;
  name: string;
  description?: string;
  category: string;
  priority?: Priority;
  plannedDate: string;
  dependencies?: string[];
  relatedTasks?: string[];
  deliverables?: string[];
  criteria?: string;
  owner?: string;
  stakeholders?: string[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

// 更新里程碑请求
export interface UpdateMilestoneTrackingRequest {
  name?: string;
  description?: string;
  category?: string;
  priority?: Priority;
  plannedDate?: string;
  actualDate?: string;
  dependencies?: string[];
  relatedTasks?: string[];
  deliverables?: string[];
  criteria?: string;
  owner?: string;
  stakeholders?: string[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

// 状态变更请求
export interface StatusChangeRequest {
  status: string;
  reason?: string;
  comments?: string;
}

// 进度更新请求
export interface ProgressUpdateRequest {
  progressPercentage: number; // 0-100
  notes?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  actualBudget?: number;
}

// 批量操作请求
export interface BatchOperationRequest {
  ids: string[];
  action: 'delete' | 'changeStatus' | 'changePriority' | 'assignManager';
  actionData?: {
    status?: string;
    priority?: Priority;
    managerId?: string;
    reason?: string;
  };
}

// ===============================
// 响应类型定义
// ===============================

// 仪表板数据响应
export interface PreparationDashboard {
  kpis: {
    totalProjects: number;
    inProgressProjects: number;
    completedProjects: number;
    overdueProjects: number;
    totalBudget: number;
    actualBudget: number;
    avgProgress: number;
    onTimeDeliveryRate: number;
  };
  charts: {
    statusDistribution: Array<{
      status: PreparationStatusType;
      count: number;
      percentage: number;
    }>;
    progressTrend: Array<{
      date: string;
      planned: number;
      actual: number;
    }>;
    budgetAnalysis: Array<{
      category: string;
      planned: number;
      actual: number;
    }>;
    milestoneProgress: Array<{
      milestone: string;
      completed: number;
      total: number;
      percentage: number;
    }>;
  };
  alerts: Array<{
    type: 'overdue' | 'budget' | 'quality' | 'safety';
    message: string;
    projectId?: string;
    projectName?: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

// 工程任务统计响应
export interface EngineeringStatistics {
  overview: {
    totalTasks: number;
    plannedTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    suspendedTasks: number;
    cancelledTasks: number;
  };
  statusDistribution: Record<EngineeringStatusType, number>;
  typeDistribution: Record<ProjectTypeType, number>;
  progressMetrics: {
    avgProgress: number;
    onTimeCompletionRate: number;
    qualityScore: number;
    budgetVariance: number;
  };
  riskAnalysis: Array<{
    riskLevel: Priority;
    count: number;
    percentage: number;
  }>;
}

// 设备采购统计响应
export interface EquipmentStatistics {
  overview: {
    totalEquipment: number;
    pendingCount: number;
    orderedCount: number;
    deliveredCount: number;
    installedCount: number;
    acceptedCount: number;
  };
  categoryDistribution: Record<EquipmentCategoryType, number>;
  statusDistribution: Record<EquipmentStatusType, number>;
  budgetAnalysis: {
    totalBudget: number;
    actualCost: number;
    variance: number;
    avgUnitPrice: number;
  };
  deliveryMetrics: {
    onTimeDeliveryRate: number;
    avgDeliveryDays: number;
    overdueCount: number;
  };
}

// 证照办理统计响应
export interface LicenseStatistics {
  overview: {
    totalApplications: number;
    pendingCount: number;
    underReviewCount: number;
    approvedCount: number;
    issuedCount: number;
    rejectedCount: number;
  };
  typeDistribution: Record<LicenseTypeType, number>;
  statusDistribution: Record<LicenseStatusType, number>;
  timingMetrics: {
    avgProcessingDays: number;
    onTimeApprovalRate: number;
    expiringCount: number; // 即将到期的证照数量
    expiredCount: number;  // 已过期的证照数量
  };
}

// 人员招聘统计响应
export interface RecruitmentStatistics {
  overview: {
    totalPositions: number;
    plannedRecruitment: number;
    actualRecruitment: number;
    onboardedCount: number;
    recruitmentRate: number; // 招聘完成率
    onboardingRate: number;  // 入职率
  };
  positionDistribution: Record<PositionTypeType, number>;
  statusDistribution: Record<RecruitmentStatusType, number>;
  channelEffectiveness: Array<{
    channel: string;
    applications: number;
    hires: number;
    conversionRate: number;
  }>;
  timeMetrics: {
    avgTimeToHire: number;  // 平均招聘周期(天)
    avgTimeToOnboard: number; // 平均入职周期(天)
  };
}

// 里程碑跟踪统计响应
export interface MilestoneStatistics {
  overview: {
    totalMilestones: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    overdueCount: number;
    blockedCount: number;
  };
  categoryDistribution: Record<string, number>;
  statusDistribution: Record<MilestoneStatusType, number>;
  completionMetrics: {
    onTimeCompletionRate: number;
    avgCompletionDays: number;
    criticalPathDelay: number; // 关键路径延误天数
  };
}

// 进度跟踪响应
export interface PreparationProgress {
  projectProgress: Array<{
    projectId: string;
    projectName: string;
    status: PreparationStatusType;
    progressPercentage: number;
    plannedEndDate: string;
    actualEndDate?: string;
    daysRemaining: number;
    isOnTrack: boolean;
  }>;
  taskProgress: Array<{
    taskType: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
  }>;
  upcomingDeadlines: Array<{
    type: 'project' | 'task' | 'milestone' | 'license';
    id: string;
    name: string;
    deadline: string;
    daysUntilDeadline: number;
    priority: Priority;
    status: string;
  }>;
}

// ===============================
// Zod 验证Schema定义
// ===============================

// 基础验证规则
const positiveNumber = z.number().positive('必须为正数');
const nonNegativeNumber = z.number().nonnegative('不能为负数');
const cuidString = z.string().cuid('无效的ID格式');
const progressPercentage = z.number().int().min(0, '进度不能小于0%').max(100, '进度不能大于100%');

// 筹备项目验证
export const createPreparationProjectSchema = z.object({
  candidateLocationId: cuidString,
  projectName: z.string()
    .min(2, '项目名称至少2个字符')
    .max(200, '项目名称不超过200个字符'),
  storeCode: z.string()
    .max(50, '门店编码不超过50个字符')
    .optional(),
  storeName: z.string()
    .max(200, '门店名称不超过200个字符')
    .optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  plannedStartDate: z.string().datetime('无效的计划开始日期格式'),
  plannedEndDate: z.string().datetime('无效的计划结束日期格式'),
  budget: positiveNumber.max(100000000, '预算不能超过1亿元'),
  description: z.string()
    .max(2000, '项目描述不超过2000个字符')
    .optional(),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
  managerId: cuidString.optional(),
});

export const updatePreparationProjectSchema = createPreparationProjectSchema.partial().omit({
  candidateLocationId: true,
});

// 工程任务验证
export const createEngineeringTaskSchema = z.object({
  preparationProjectId: cuidString.optional(),
  candidateLocationId: cuidString,
  supplierId: cuidString,
  taskType: z.enum(['CONSTRUCTION', 'DECORATION', 'EQUIPMENT', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'FIRE_SAFETY', 'SECURITY', 'NETWORK', 'OTHER']),
  projectName: z.string()
    .min(2, '项目名称至少2个字符')
    .max(200, '项目名称不超过200个字符'),
  contractNumber: z.string()
    .max(100, '合同编号不超过100个字符')
    .optional(),
  contractAmount: positiveNumber.max(100000000, '合同金额不能超过1亿元'),
  plannedStartDate: z.string().datetime('无效的计划开始日期格式'),
  plannedEndDate: z.string().datetime('无效的计划结束日期格式'),
  description: z.string()
    .max(2000, '项目描述不超过2000个字符')
    .optional(),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
  riskLevel: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
});

export const updateEngineeringTaskSchema = createEngineeringTaskSchema.partial().omit({
  preparationProjectId: true,
  candidateLocationId: true,
}).extend({
  actualAmount: positiveNumber.max(100000000, '实际金额不能超过1亿元').optional(),
  actualStartDate: z.string().datetime('无效的实际开始日期格式').optional(),
  actualEndDate: z.string().datetime('无效的实际结束日期格式').optional(),
  progressPercentage: progressPercentage.optional(),
  qualityScore: z.number().min(0).max(10, '质量评分不能超过10分').optional(),
});

// 设备采购验证
export const createEquipmentProcurementSchema = z.object({
  preparationProjectId: cuidString,
  category: z.enum(['KITCHEN', 'DINING', 'COOLING', 'CLEANING', 'SAFETY', 'FURNITURE', 'TECHNOLOGY', 'DECORATION', 'OTHER']),
  equipmentName: z.string()
    .min(2, '设备名称至少2个字符')
    .max(200, '设备名称不超过200个字符'),
  brand: z.string()
    .max(100, '品牌不超过100个字符')
    .optional(),
  model: z.string()
    .max(100, '型号不超过100个字符')
    .optional(),
  specifications: z.record(z.any()).optional(),
  quantity: positiveNumber.int('数量必须为整数').max(10000, '数量不能超过10000'),
  unitPrice: nonNegativeNumber.max(1000000, '单价不能超过100万元').optional(),
  totalPrice: nonNegativeNumber.max(100000000, '总价不能超过1亿元').optional(),
  currency: z.string().max(10, '币种不超过10个字符').default('CNY'),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  plannedDeliveryDate: z.string().datetime('无效的计划交付日期格式').optional(),
  warrantyPeriod: nonNegativeNumber.int('保修期必须为整数').max(120, '保修期不能超过120个月').optional(),
  supplier: z.string()
    .max(200, '供应商不超过200个字符')
    .optional(),
  supplierContact: z.string()
    .max(200, '供应商联系方式不超过200个字符')
    .optional(),
  deliveryAddress: z.string()
    .max(500, '交付地址不超过500个字符')
    .optional(),
  installationRequirements: z.string()
    .max(2000, '安装要求不超过2000个字符')
    .optional(),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
});

export const updateEquipmentProcurementSchema = createEquipmentProcurementSchema.partial().omit({
  preparationProjectId: true,
}).extend({
  actualDeliveryDate: z.string().datetime('无效的实际交付日期格式').optional(),
  installationDate: z.string().datetime('无效的安装日期格式').optional(),
  acceptanceDate: z.string().datetime('无效的验收日期格式').optional(),
  warrantyExpiry: z.string().datetime('无效的保修到期日期格式').optional(),
  purchaseOrder: z.string()
    .max(100, '采购订单号不超过100个字符')
    .optional(),
  operationManual: z.array(z.string().url('操作手册URL格式不正确')).optional(),
  maintenanceSchedule: z.record(z.any()).optional(),
  photos: z.array(z.string().url('照片URL格式不正确')).optional(),
  documents: z.array(z.string().url('文档URL格式不正确')).optional(),
});

// 证照办理验证
export const createLicenseApplicationSchema = z.object({
  preparationProjectId: cuidString,
  licenseType: z.enum(['BUSINESS', 'FOOD_SERVICE', 'FIRE_SAFETY', 'HEALTH', 'TAX', 'SIGNBOARD', 'ENVIRONMENTAL', 'SPECIAL', 'OTHER']),
  licenseName: z.string()
    .min(2, '证照名称至少2个字符')
    .max(200, '证照名称不超过200个字符'),
  issuingAuthority: z.string()
    .min(2, '发证机关至少2个字符')
    .max(200, '发证机关不超过200个字符'),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  applicationDate: z.string().datetime('无效的申请日期格式').optional(),
  applicationFee: nonNegativeNumber.max(1000000, '申请费用不能超过100万元').optional(),
  currency: z.string().max(10, '币种不超过10个字符').default('CNY'),
  applicant: z.string()
    .max(100, '申请人不超过100个字符')
    .optional(),
  contactPerson: z.string()
    .max(50, '联系人不超过50个字符')
    .optional(),
  contactPhone: z.string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional(),
  applicationAddress: z.string()
    .max(500, '申请地址不超过500个字符')
    .optional(),
  requiredDocuments: z.array(z.string().max(200, '材料名称不超过200个字符')),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
});

export const updateLicenseApplicationSchema = createLicenseApplicationSchema.partial().omit({
  preparationProjectId: true,
}).extend({
  submissionDate: z.string().datetime('无效的提交日期格式').optional(),
  reviewStartDate: z.string().datetime('无效的审核开始日期格式').optional(),
  approvalDate: z.string().datetime('无效的批准日期格式').optional(),
  issuanceDate: z.string().datetime('无效的发证日期格式').optional(),
  expiryDate: z.string().datetime('无效的有效期截止日期格式').optional(),
  renewalDate: z.string().datetime('无效的续期日期格式').optional(),
  licenseNumber: z.string()
    .max(100, '证照编号不超过100个字符')
    .optional(),
  actualFee: nonNegativeNumber.max(1000000, '实际费用不能超过100万元').optional(),
  submittedDocuments: z.array(z.string().max(200, '材料名称不超过200个字符')).optional(),
  missingDocuments: z.array(z.string().max(200, '材料名称不超过200个字符')).optional(),
  rejectionReason: z.string()
    .max(1000, '拒绝原因不超过1000个字符')
    .optional(),
  conditions: z.string()
    .max(1000, '批准条件不超过1000个字符')
    .optional(),
  renewalReminder: z.string().datetime('无效的续期提醒日期格式').optional(),
  attachments: z.array(z.string().url('附件URL格式不正确')).optional(),
});

// 人员招聘验证
export const createStaffRecruitmentSchema = z.object({
  preparationProjectId: cuidString,
  positionType: z.enum(['MANAGER', 'CHEF', 'SERVER', 'CASHIER', 'CLEANER', 'SECURITY', 'MAINTENANCE', 'SALES', 'OTHER']),
  positionTitle: z.string()
    .min(2, '职位标题至少2个字符')
    .max(200, '职位标题不超过200个字符'),
  department: z.string()
    .max(100, '所属部门不超过100个字符')
    .optional(),
  plannedCount: positiveNumber.int('计划招聘人数必须为正整数').max(1000, '计划招聘人数不能超过1000'),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  startDate: z.string().datetime('无效的招聘开始日期格式').optional(),
  endDate: z.string().datetime('无效的招聘结束日期格式').optional(),
  salaryRange: z.object({
    min: positiveNumber.max(1000000, '最低薪资不能超过100万元'),
    max: positiveNumber.max(1000000, '最高薪资不能超过100万元'),
    currency: z.string().max(10, '币种不超过10个字符').default('CNY'),
  }).optional(),
  workLocation: z.string()
    .max(200, '工作地点不超过200个字符')
    .optional(),
  workSchedule: z.string()
    .max(500, '工作安排不超过500个字符')
    .optional(),
  qualificationRequirements: z.string()
    .min(10, '资格要求至少10个字符')
    .max(2000, '资格要求不超过2000个字符'),
  jobDescription: z.string()
    .min(20, '职位描述至少20个字符')
    .max(5000, '职位描述不超过5000个字符'),
  benefits: z.string()
    .max(2000, '福利待遇不超过2000个字符')
    .optional(),
  recruitmentChannels: z.array(z.string().max(100, '招聘渠道不超过100个字符')).optional(),
  recruiters: z.array(cuidString).optional(),
  interviewers: z.array(cuidString).optional(),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
});

export const updateStaffRecruitmentSchema = createStaffRecruitmentSchema.partial().omit({
  preparationProjectId: true,
}).extend({
  recruitedCount: nonNegativeNumber.int('已招聘人数必须为非负整数').optional(),
  onboardedCount: nonNegativeNumber.int('已入职人数必须为非负整数').optional(),
});

// 里程碑跟踪验证
export const createMilestoneTrackingSchema = z.object({
  preparationProjectId: cuidString,
  name: z.string()
    .min(2, '里程碑名称至少2个字符')
    .max(200, '里程碑名称不超过200个字符'),
  description: z.string()
    .max(2000, '描述不超过2000个字符')
    .optional(),
  category: z.string()
    .min(2, '类别至少2个字符')
    .max(50, '类别不超过50个字符'),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  plannedDate: z.string().datetime('无效的计划日期格式'),
  dependencies: z.array(cuidString).optional(),
  relatedTasks: z.array(cuidString).optional(),
  deliverables: z.array(z.string().max(200, '交付物描述不超过200个字符')).optional(),
  criteria: z.string()
    .max(1000, '完成标准不超过1000个字符')
    .optional(),
  owner: cuidString.optional(),
  stakeholders: z.array(cuidString).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
});

export const updateMilestoneTrackingSchema = createMilestoneTrackingSchema.partial().omit({
  preparationProjectId: true,
}).extend({
  actualDate: z.string().datetime('无效的实际日期格式').optional(),
});

// 状态变更验证
export const statusChangeSchema = z.object({
  status: z.string().min(1, '状态不能为空'),
  reason: z.string()
    .max(500, '变更原因不超过500个字符')
    .optional(),
  comments: z.string()
    .max(1000, '备注不超过1000个字符')
    .optional(),
});

// 进度更新验证
export const progressUpdateSchema = z.object({
  progressPercentage: progressPercentage,
  notes: z.string()
    .max(1000, '备注不超过1000个字符')
    .optional(),
  actualStartDate: z.string().datetime('无效的实际开始日期格式').optional(),
  actualEndDate: z.string().datetime('无效的实际结束日期格式').optional(),
  actualBudget: nonNegativeNumber.max(100000000, '实际预算不能超过1亿元').optional(),
});

// 查询参数验证
export const preparationProjectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'projectName', 'status', 'priority', 'plannedStartDate', 'plannedEndDate', 'budget', 'progressPercentage'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // 筛选参数
  candidateLocationId: cuidString.optional(),
  status: z.enum(['PLANNING', 'APPROVED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  managerId: cuidString.optional(),
  plannedStartDateStart: z.string().datetime().optional(),
  plannedStartDateEnd: z.string().datetime().optional(),
  plannedEndDateStart: z.string().datetime().optional(),
  plannedEndDateEnd: z.string().datetime().optional(),
  minBudget: nonNegativeNumber.optional(),
  maxBudget: nonNegativeNumber.optional(),
  minProgress: z.number().min(0).max(100).optional(),
  maxProgress: z.number().min(0).max(100).optional(),
  keyword: z.string().max(100, '搜索关键词不超过100个字符').optional(),
});

// 批量操作验证
export const batchOperationSchema = z.object({
  ids: z.array(cuidString).min(1, '至少选择一项进行操作'),
  action: z.enum(['delete', 'changeStatus', 'changePriority', 'assignManager']),
  actionData: z.object({
    status: z.string().optional(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    managerId: cuidString.optional(),
    reason: z.string().max(500, '操作原因不超过500个字符').optional(),
  }).optional(),
});

// ID参数验证
export const idParamSchema = z.object({
  id: cuidString,
});

// ===============================
// 类型推断导出
// ===============================

export type CreatePreparationProjectData = z.infer<typeof createPreparationProjectSchema>;
export type UpdatePreparationProjectData = z.infer<typeof updatePreparationProjectSchema>;
export type CreateEngineeringTaskData = z.infer<typeof createEngineeringTaskSchema>;
export type UpdateEngineeringTaskData = z.infer<typeof updateEngineeringTaskSchema>;
export type CreateEquipmentProcurementData = z.infer<typeof createEquipmentProcurementSchema>;
export type UpdateEquipmentProcurementData = z.infer<typeof updateEquipmentProcurementSchema>;
export type CreateLicenseApplicationData = z.infer<typeof createLicenseApplicationSchema>;
export type UpdateLicenseApplicationData = z.infer<typeof updateLicenseApplicationSchema>;
export type CreateStaffRecruitmentData = z.infer<typeof createStaffRecruitmentSchema>;
export type UpdateStaffRecruitmentData = z.infer<typeof updateStaffRecruitmentSchema>;
export type CreateMilestoneTrackingData = z.infer<typeof createMilestoneTrackingSchema>;
export type UpdateMilestoneTrackingData = z.infer<typeof updateMilestoneTrackingSchema>;
export type StatusChangeData = z.infer<typeof statusChangeSchema>;
export type ProgressUpdateData = z.infer<typeof progressUpdateSchema>;
export type PreparationProjectQuery = z.infer<typeof preparationProjectQuerySchema>;
export type BatchOperationData = z.infer<typeof batchOperationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;

// ===============================
// 状态转换规则定义
// ===============================

// 筹备项目状态转换映射表
export const preparationStatusTransitions: Record<PreparationStatusType, PreparationStatusType[]> = {
  [PreparationStatus.PLANNING]: [
    PreparationStatus.APPROVED,
    PreparationStatus.CANCELLED
  ],
  [PreparationStatus.APPROVED]: [
    PreparationStatus.IN_PROGRESS,
    PreparationStatus.SUSPENDED,
    PreparationStatus.CANCELLED
  ],
  [PreparationStatus.IN_PROGRESS]: [
    PreparationStatus.COMPLETED,
    PreparationStatus.SUSPENDED,
    PreparationStatus.OVERDUE,
    PreparationStatus.CANCELLED
  ],
  [PreparationStatus.SUSPENDED]: [
    PreparationStatus.IN_PROGRESS,
    PreparationStatus.CANCELLED
  ],
  [PreparationStatus.COMPLETED]: [], // 已完成无法变更
  [PreparationStatus.CANCELLED]: [
    PreparationStatus.PLANNING // 已取消可重新开始
  ],
  [PreparationStatus.OVERDUE]: [
    PreparationStatus.IN_PROGRESS,
    PreparationStatus.COMPLETED,
    PreparationStatus.CANCELLED
  ],
};

// 工程任务状态转换映射表
export const engineeringStatusTransitions: Record<EngineeringStatusType, EngineeringStatusType[]> = {
  [EngineeringStatus.PLANNED]: [
    EngineeringStatus.APPROVED,
    EngineeringStatus.CANCELLED
  ],
  [EngineeringStatus.APPROVED]: [
    EngineeringStatus.IN_PROGRESS,
    EngineeringStatus.SUSPENDED,
    EngineeringStatus.CANCELLED
  ],
  [EngineeringStatus.IN_PROGRESS]: [
    EngineeringStatus.COMPLETED,
    EngineeringStatus.SUSPENDED,
    EngineeringStatus.CANCELLED
  ],
  [EngineeringStatus.SUSPENDED]: [
    EngineeringStatus.IN_PROGRESS,
    EngineeringStatus.CANCELLED
  ],
  [EngineeringStatus.COMPLETED]: [
    EngineeringStatus.ACCEPTED,
    EngineeringStatus.WARRANTY
  ],
  [EngineeringStatus.CANCELLED]: [
    EngineeringStatus.PLANNED // 可重新规划
  ],
  [EngineeringStatus.ACCEPTED]: [
    EngineeringStatus.WARRANTY
  ],
  [EngineeringStatus.WARRANTY]: [], // 保修期无法变更
};

// 验证状态转换是否合法
export const isValidPreparationStatusTransition = (
  currentStatus: PreparationStatusType,
  targetStatus: PreparationStatusType
): boolean => {
  return preparationStatusTransitions[currentStatus]?.includes(targetStatus) || false;
};

export const isValidEngineeringStatusTransition = (
  currentStatus: EngineeringStatusType,
  targetStatus: EngineeringStatusType
): boolean => {
  return engineeringStatusTransitions[currentStatus]?.includes(targetStatus) || false;
};

// 获取可用的下一状态
export const getAvailablePreparationStatuses = (
  currentStatus: PreparationStatusType
): PreparationStatusType[] => {
  return preparationStatusTransitions[currentStatus] || [];
};

export const getAvailableEngineeringStatuses = (
  currentStatus: EngineeringStatusType
): EngineeringStatusType[] => {
  return engineeringStatusTransitions[currentStatus] || [];
};

// ===============================
// 业务规则常量
// ===============================

// 优先级颜色映射
export const PRIORITY_COLORS = {
  URGENT: '#ff4d4f',    // 红色
  HIGH: '#fa8c16',      // 橙色
  MEDIUM: '#1890ff',    // 蓝色
  LOW: '#52c41a',       // 绿色
} as const;

// 筹备项目状态颜色映射
export const PREPARATION_STATUS_COLORS = {
  PLANNING: '#d9d9d9',        // 灰色
  APPROVED: '#1890ff',        // 蓝色
  IN_PROGRESS: '#faad14',     // 黄色
  SUSPENDED: '#722ed1',       // 紫色
  COMPLETED: '#52c41a',       // 绿色
  CANCELLED: '#ff4d4f',       // 红色
  OVERDUE: '#f50',            // 深红色
} as const;

// 工程任务状态颜色映射
export const ENGINEERING_STATUS_COLORS = {
  PLANNED: '#d9d9d9',         // 灰色
  APPROVED: '#1890ff',        // 蓝色
  IN_PROGRESS: '#faad14',     // 黄色
  SUSPENDED: '#722ed1',       // 紫色
  COMPLETED: '#52c41a',       // 绿色
  CANCELLED: '#ff4d4f',       // 红色
  ACCEPTED: '#389e0d',        // 深绿色
  WARRANTY: '#13c2c2',        // 青色
} as const;

// 默认分页配置
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// 文件上传限制
export const FILE_UPLOAD_LIMITS = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  maxFiles: 50,
} as const;

// 进度更新间隔(天)
export const PROGRESS_UPDATE_INTERVAL = 1;

// 里程碑提前提醒天数
export const MILESTONE_REMINDER_DAYS = 3;

// 证照到期提醒天数
export const LICENSE_EXPIRY_REMINDER_DAYS = 30;