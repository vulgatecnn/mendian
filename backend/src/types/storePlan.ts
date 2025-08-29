/**
 * 开店计划管理相关类型定义
 */
import { z } from 'zod';
import type { StorePlan, Region, CompanyEntity, User, CandidateLocation } from '@prisma/client';

// ===============================
// 枚举类型定义
// ===============================

// 开店计划状态枚举
export const StorePlanStatus = {
  DRAFT: 'DRAFT',           // 草稿
  SUBMITTED: 'SUBMITTED',   // 已提交
  PENDING: 'PENDING',       // 待审批
  APPROVED: 'APPROVED',     // 已批准
  REJECTED: 'REJECTED',     // 已拒绝
  IN_PROGRESS: 'IN_PROGRESS', // 执行中
  COMPLETED: 'COMPLETED',   // 已完成
  CANCELLED: 'CANCELLED',   // 已取消
} as const;

export type StorePlanStatusType = typeof StorePlanStatus[keyof typeof StorePlanStatus];

// 门店类型枚举
export const StoreTypes = {
  DIRECT: 'DIRECT',         // 直营店
  FRANCHISE: 'FRANCHISE',   // 加盟店
  FLAGSHIP: 'FLAGSHIP',     // 旗舰店
  POPUP: 'POPUP',          // 快闪店
} as const;

export type StoreTypesType = typeof StoreTypes[keyof typeof StoreTypes];

// 优先级枚举
export const PriorityLevels = {
  URGENT: 'URGENT',    // 紧急
  HIGH: 'HIGH',        // 高
  MEDIUM: 'MEDIUM',    // 中
  LOW: 'LOW',          // 低
} as const;

export type PriorityLevelType = typeof PriorityLevels[keyof typeof PriorityLevels];

// ===============================
// 基础数据类型
// ===============================

// 开店计划扩展类型（包含关联数据）
export interface StorePlanWithRelations extends StorePlan {
  region: Region;
  entity: CompanyEntity;
  createdBy: User;
  candidateLocations?: CandidateLocation[];
  _count?: {
    candidateLocations: number;
  };
}

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

// 筛选参数类型
export interface StorePlanFilters {
  year?: number;
  quarter?: number;
  regionId?: string;
  entityId?: string;
  storeType?: StoreTypesType;
  status?: StorePlanStatusType;
  priority?: PriorityLevelType;
  createdById?: string;
  budgetMin?: number;
  budgetMax?: number;
  startDate?: string;
  endDate?: string;
}

// 排序参数类型
export interface SortParams {
  sortBy: 'year' | 'quarter' | 'plannedCount' | 'completedCount' | 'budget' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

// ===============================
// 请求类型定义
// ===============================

// 创建开店计划请求
export interface CreateStorePlanRequest {
  planCode?: string;
  title: string;
  year: number;
  quarter?: number;
  regionId: string;
  entityId: string;
  storeType: StoreTypesType;
  plannedCount: number;
  budget?: number;
  actualBudget?: number;
  priority?: PriorityLevelType;
  startDate?: string;
  endDate?: string;
  description?: string;
  remark?: string;
}

// 更新开店计划请求
export interface UpdateStorePlanRequest {
  title?: string;
  quarter?: number;
  storeType?: StoreTypesType;
  plannedCount?: number;
  budget?: number;
  actualBudget?: number;
  priority?: PriorityLevelType;
  startDate?: string;
  endDate?: string;
  description?: string;
  remark?: string;
}

// 状态变更请求
export interface StatusChangeRequest {
  status: StorePlanStatusType;
  reason?: string;
  approver?: string;
  comments?: string;
}

// 查询参数请求
export interface StorePlanQueryRequest extends PaginationParams, SortParams {
  filters?: StorePlanFilters;
}

// 批量操作请求
export interface BatchOperationRequest {
  ids: string[];
  action: 'delete' | 'approve' | 'reject' | 'execute';
  reason?: string;
}

// 统计查询请求
export interface StatisticsQueryRequest {
  year?: number;
  quarter?: number;
  regionIds?: string[];
  entityIds?: string[];
  storeTypes?: StoreTypesType[];
  groupBy?: 'region' | 'entity' | 'storeType' | 'month';
}

// 导出请求
export interface ExportRequest {
  format: 'xlsx' | 'csv';
  filters?: StorePlanFilters;
  columns?: string[];
}

// ===============================
// 响应类型定义
// ===============================

// 统计数据响应
export interface StorePlanStatistics {
  totalPlans: number;
  totalPlannedStores: number;
  totalCompletedStores: number;
  totalBudget: number;
  actualBudget: number;
  completionRate: number;
  budgetUtilization: number;
  statusDistribution: Record<StorePlanStatusType, number>;
  regionDistribution: Array<{
    regionId: string;
    regionName: string;
    count: number;
    plannedStores: number;
    completedStores: number;
    budget: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    plannedCount: number;
    completedCount: number;
    budget: number;
  }>;
}

// 进度数据响应
export interface StorePlanProgress {
  overallProgress: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  };
  regionProgress: Array<{
    regionId: string;
    regionName: string;
    planned: number;
    completed: number;
    percentage: number;
    onTrack: boolean;
  }>;
  delayedPlans: Array<{
    id: string;
    title: string;
    plannedEndDate: string;
    currentDelay: number;
    reason: string;
  }>;
}

// 汇总信息响应
export interface StorePlanSummary {
  currentYear: {
    planned: number;
    completed: number;
    budget: number;
    progress: number;
  };
  currentQuarter: {
    planned: number;
    completed: number;
    budget: number;
    progress: number;
  };
  topRegions: Array<{
    regionId: string;
    regionName: string;
    plannedCount: number;
    completedCount: number;
    completionRate: number;
  }>;
  recentActivities: Array<{
    id: string;
    title: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
}

// ===============================
// Zod 验证Schema定义
// ===============================

// 基础验证规则
const positiveNumber = z.number().positive('必须为正数');
const nonNegativeNumber = z.number().nonnegative('不能为负数');
const cuidString = z.string().cuid('无效的ID格式');

// 创建开店计划验证
export const createStorePlanSchema = z.object({
  planCode: z.string()
    .max(50, '计划编号不超过50个字符')
    .optional(),
  title: z.string()
    .min(2, '计划标题至少2个字符')
    .max(200, '计划标题不超过200个字符'),
  year: z.number()
    .int('年份必须为整数')
    .min(2020, '年份不能早于2020年')
    .max(2030, '年份不能晚于2030年'),
  quarter: z.number()
    .int('季度必须为整数')
    .min(1, '季度必须为1-4')
    .max(4, '季度必须为1-4')
    .optional()
    .nullable(),
  regionId: cuidString,
  entityId: cuidString,
  storeType: z.enum(['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'], {
    errorMap: () => ({ message: '无效的门店类型' }),
  }),
  plannedCount: positiveNumber.int('计划数量必须为正整数'),
  budget: nonNegativeNumber.optional(),
  actualBudget: nonNegativeNumber.optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW'], {
    errorMap: () => ({ message: '无效的优先级' }),
  }).default('MEDIUM'),
  startDate: z.string()
    .datetime('无效的开始日期格式')
    .optional(),
  endDate: z.string()
    .datetime('无效的结束日期格式')
    .optional(),
  description: z.string()
    .max(1000, '描述不超过1000个字符')
    .optional(),
  remark: z.string()
    .max(1000, '备注不超过1000个字符')
    .optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: '开始日期不能晚于结束日期',
  path: ['endDate'],
});

// 更新开店计划验证
export const updateStorePlanSchema = z.object({
  title: z.string()
    .min(2, '计划标题至少2个字符')
    .max(200, '计划标题不超过200个字符')
    .optional(),
  quarter: z.number()
    .int('季度必须为整数')
    .min(1, '季度必须为1-4')
    .max(4, '季度必须为1-4')
    .optional()
    .nullable(),
  storeType: z.enum(['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'], {
    errorMap: () => ({ message: '无效的门店类型' }),
  }).optional(),
  plannedCount: positiveNumber.int('计划数量必须为正整数').optional(),
  budget: nonNegativeNumber.optional(),
  actualBudget: nonNegativeNumber.optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW'], {
    errorMap: () => ({ message: '无效的优先级' }),
  }).optional(),
  startDate: z.string()
    .datetime('无效的开始日期格式')
    .optional(),
  endDate: z.string()
    .datetime('无效的结束日期格式')
    .optional(),
  description: z.string()
    .max(1000, '描述不超过1000个字符')
    .optional(),
  remark: z.string()
    .max(1000, '备注不超过1000个字符')
    .optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: '开始日期不能晚于结束日期',
  path: ['endDate'],
});

// 查询参数验证
export const storePlanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['year', 'quarter', 'plannedCount', 'completedCount', 'budget', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // 筛选参数
  year: z.coerce.number().int().min(2020).max(2030).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  regionId: cuidString.optional(),
  entityId: cuidString.optional(),
  storeType: z.enum(['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  createdById: cuidString.optional(),
  budgetMin: nonNegativeNumber.optional(),
  budgetMax: nonNegativeNumber.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// 状态变更验证
export const statusChangeSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  reason: z.string()
    .max(500, '变更原因不超过500个字符')
    .optional(),
  approver: z.string()
    .max(50, '审批人不超过50个字符')
    .optional(),
  comments: z.string()
    .max(1000, '审批意见不超过1000个字符')
    .optional(),
});

// 批量操作验证
export const batchOperationSchema = z.object({
  ids: z.array(cuidString).min(1, '至少选择一项进行操作'),
  action: z.enum(['delete', 'approve', 'reject', 'execute']),
  reason: z.string()
    .max(500, '操作原因不超过500个字符')
    .optional(),
});

// 统计查询验证
export const statisticsQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2030).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  regionIds: z.array(cuidString).optional(),
  entityIds: z.array(cuidString).optional(),
  storeTypes: z.array(z.enum(['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'])).optional(),
  groupBy: z.enum(['region', 'entity', 'storeType', 'month']).optional(),
});

// 导出验证
export const exportSchema = z.object({
  format: z.enum(['xlsx', 'csv']),
  filters: z.object({
    year: z.coerce.number().int().min(2020).max(2030).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    regionId: cuidString.optional(),
    entityId: cuidString.optional(),
    storeType: z.enum(['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP']).optional(),
    status: z.enum(['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  }).optional(),
  columns: z.array(z.string()).optional(),
});

// ID参数验证
export const idParamSchema = z.object({
  id: cuidString,
});

// ===============================
// 类型推断导出
// ===============================

export type CreateStorePlanData = z.infer<typeof createStorePlanSchema>;
export type UpdateStorePlanData = z.infer<typeof updateStorePlanSchema>;
export type StorePlanQuery = z.infer<typeof storePlanQuerySchema>;
export type StatusChangeData = z.infer<typeof statusChangeSchema>;
export type BatchOperationData = z.infer<typeof batchOperationSchema>;
export type StatisticsQuery = z.infer<typeof statisticsQuerySchema>;
export type ExportData = z.infer<typeof exportSchema>;
export type IdParam = z.infer<typeof idParamSchema>;

// ===============================
// 状态转换规则定义
// ===============================

// 状态转换映射表
export const statusTransitions: Record<StorePlanStatusType, StorePlanStatusType[]> = {
  [StorePlanStatus.DRAFT]: [StorePlanStatus.SUBMITTED, StorePlanStatus.CANCELLED],
  [StorePlanStatus.SUBMITTED]: [StorePlanStatus.PENDING, StorePlanStatus.CANCELLED],
  [StorePlanStatus.PENDING]: [StorePlanStatus.APPROVED, StorePlanStatus.REJECTED],
  [StorePlanStatus.APPROVED]: [StorePlanStatus.IN_PROGRESS, StorePlanStatus.CANCELLED],
  [StorePlanStatus.REJECTED]: [StorePlanStatus.DRAFT],
  [StorePlanStatus.IN_PROGRESS]: [StorePlanStatus.COMPLETED, StorePlanStatus.CANCELLED],
  [StorePlanStatus.COMPLETED]: [], // 完成状态不能再变更
  [StorePlanStatus.CANCELLED]: [StorePlanStatus.DRAFT], // 已取消可重新开始
};

// 验证状态转换是否合法
export const isValidStatusTransition = (
  currentStatus: StorePlanStatusType,
  targetStatus: StorePlanStatusType
): boolean => {
  return statusTransitions[currentStatus]?.includes(targetStatus) || false;
};

// 获取可用的下一状态
export const getAvailableStatuses = (
  currentStatus: StorePlanStatusType
): StorePlanStatusType[] => {
  return statusTransitions[currentStatus] || [];
};