/**
 * 门店档案管理类型定义
 * 包含Store model的CRUD操作、查询、统计等相关类型
 */
import { z } from 'zod';
import { StoreFile, StoreType, StoreFileStatus, CompanyEntity, CandidateLocation, PaymentItem, Asset } from '@prisma/client';

// ================================
// 枚举类型映射
// ================================

export type StoreTypeEnum = StoreType;
export type StoreFileStatusEnum = StoreFileStatus;

// ================================
// 基础Schema定义
// ================================

// ID参数Schema
export const idParamSchema = z.object({
  id: z.string().cuid('无效的门店ID'),
});

// 查询参数Schema
export const storeFileQuerySchema = z.object({
  // 分页参数
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  
  // 排序参数
  sortBy: z.enum(['createdAt', 'updatedAt', 'openDate', 'storeName', 'area', 'monthlyRevenue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // 筛选参数
  storeCode: z.string().optional(),
  storeName: z.string().optional(),
  storeType: z.nativeEnum(StoreType).optional(),
  status: z.nativeEnum(StoreFileStatus).optional(),
  entityId: z.string().optional(),
  candidateLocationId: z.string().optional(),
  brandName: z.string().optional(),
  address: z.string().optional(),
  
  // 日期范围筛选
  openDateFrom: z.string().datetime().optional(),
  openDateTo: z.string().datetime().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  
  // 数值范围筛选
  areaMin: z.number().min(0).optional(),
  areaMax: z.number().min(0).optional(),
  revenueMin: z.number().min(0).optional(),
  revenueMax: z.number().min(0).optional(),
  employeeMin: z.number().min(0).optional(),
  employeeMax: z.number().min(0).optional(),
  
  // 搜索关键字
  keyword: z.string().optional(),
  tags: z.string().array().optional(),
}).transform((data) => ({
  ...data,
  page: Number(data.page),
  limit: Number(data.limit),
  areaMin: data.areaMin ? Number(data.areaMin) : undefined,
  areaMax: data.areaMax ? Number(data.areaMax) : undefined,
  revenueMin: data.revenueMin ? Number(data.revenueMin) : undefined,
  revenueMax: data.revenueMax ? Number(data.revenueMax) : undefined,
  employeeMin: data.employeeMin ? Number(data.employeeMin) : undefined,
  employeeMax: data.employeeMax ? Number(data.employeeMax) : undefined,
}));

// 基础门店档案Schema（不含transform）
const baseStoreFileSchema = z.object({
  candidateLocationId: z.string().cuid().optional(),
  entityId: z.string().cuid('公司主体ID必填'),
  storeCode: z.string()
    .min(1, '门店编码不能为空')
    .max(50, '门店编码长度不能超过50字符')
    .regex(/^[A-Z0-9-_]+$/, '门店编码只能包含大写字母、数字、横线和下划线'),
  storeName: z.string()
    .min(1, '门店名称不能为空')
    .max(200, '门店名称长度不能超过200字符')
    .refine(val => !/[<>\"'&]/.test(val), '门店名称不能包含特殊字符 < > " \' &'),
  storeType: z.nativeEnum(StoreType, { 
    errorMap: () => ({ message: '门店类型无效' })
  }),
  brandName: z.string().max(100, '品牌名称长度不能超过100字符').optional(),
  address: z.string()
    .min(1, '门店地址不能为空')
    .max(500, '门店地址长度不能超过500字符')
    .refine(val => !/[<>\"'&]/.test(val), '地址不能包含特殊字符'),
  detailedAddress: z.string()
    .max(500, '详细地址长度不能超过500字符')
    .refine(val => !val || !/[<>\"'&]/.test(val), '详细地址不能包含特殊字符')
    .optional(),
  area: z.number().min(0, '面积不能为负数').optional(),
  usableArea: z.number().min(0, '使用面积不能为负数').optional(),
  floors: z.number().int().min(1, '楼层数必须为正整数').optional(),
  seatCount: z.number().int().min(1, '座位数必须为正整数').optional(),
  openDate: z.string().datetime().optional(),
  status: z.nativeEnum(StoreFileStatus).default('PREPARING'),
  businessLicense: z.string().max(100, '营业执照号长度不能超过100字符').optional(),
  licenseExpiry: z.string().datetime().optional(),
  taxId: z.string().max(50, '税号长度不能超过50字符').optional(),
  bankAccount: z.string().max(50, '银行账号长度不能超过50字符').optional(),
  bankName: z.string().max(200, '银行名称长度不能超过200字符').optional(),
  franchiseeInfo: z.record(z.any()).optional(),
  managementTeam: z.record(z.any()).optional(),
  operatingHours: z.record(z.any()).optional(),
  contactPhone: z.string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
    .optional(),
  contactEmail: z.string()
    .email('邮箱格式不正确')
    .max(100, '邮箱长度不能超过100字符')
    .optional(),
  coordinates: z.string().max(50, '坐标长度不能超过50字符').optional(),
  photos: z.record(z.any()).optional(),
  floorPlan: z.record(z.any()).optional(),
  documents: z.record(z.any()).optional(),
  equipment: z.record(z.any()).optional(),
  monthlyRevenue: z.number().min(0, '月收入不能为负数').optional(),
  monthlyRent: z.number().min(0, '月租金不能为负数').optional(),
  employeeCount: z.number().int().min(0, '员工数不能为负数').optional(),
  notes: z.string().optional(),
  tags: z.string().array().default([]),
}).refine((data) => {
  // 验证使用面积不能大于总面积
  if (data.area && data.usableArea && data.usableArea > data.area) {
    return false;
  }
  return true;
}, {
  message: '使用面积不能大于总面积',
  path: ['usableArea']
});

// 创建门店档案Schema（包含数据清理和转换）
export const createStoreFileSchema = baseStoreFileSchema.transform((data) => ({
  ...data,
  storeCode: data.storeCode.toUpperCase().trim(),
  storeName: data.storeName.trim(),
  address: data.address.trim(),
  detailedAddress: data.detailedAddress?.trim() || undefined,
}));

// 更新门店档案Schema
export const updateStoreFileSchema = baseStoreFileSchema.partial();

// 状态变更Schema
export const statusChangeSchema = z.object({
  status: z.nativeEnum(StoreFileStatus),
  reason: z.string().optional(),
  operator: z.string().optional(),
  notes: z.string().optional(),
});

// 批量操作Schema
export const batchOperationSchema = z.object({
  action: z.enum(['delete', 'updateStatus', 'updateTags', 'export']),
  ids: z.string().cuid().array().min(1, '至少选择一个门店'),
  data: z.record(z.any()).optional(), // 批量操作的数据
});

// 统计查询Schema
export const statisticsQuerySchema = z.object({
  year: z.number().int().min(2020).max(2030).optional(),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  storeType: z.nativeEnum(StoreType).optional(),
  entityId: z.string().cuid().optional(),
  status: z.nativeEnum(StoreFileStatus).optional(),
  groupBy: z.enum(['storeType', 'status', 'entity', 'month', 'quarter']).default('status'),
}).transform((data) => ({
  ...data,
  year: data.year ? Number(data.year) : undefined,
  month: data.month ? Number(data.month) : undefined,
  quarter: data.quarter ? Number(data.quarter) : undefined,
}));

// 导出数据Schema
export const exportSchema = z.object({
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  filters: storeFileQuerySchema.optional(),
  fields: z.string().array().optional(), // 要导出的字段
  includeRelations: z.boolean().default(false), // 是否包含关联数据
});

// ================================
// TypeScript类型定义
// ================================

export type IdParam = z.infer<typeof idParamSchema>;
export type StoreFileQuery = z.infer<typeof storeFileQuerySchema>;
export type CreateStoreFileData = z.infer<typeof createStoreFileSchema>;
export type UpdateStoreFileData = z.infer<typeof updateStoreFileSchema>;
export type StatusChangeData = z.infer<typeof statusChangeSchema>;
export type BatchOperationData = z.infer<typeof batchOperationSchema>;
export type StatisticsQuery = z.infer<typeof statisticsQuerySchema>;
export type ExportData = z.infer<typeof exportSchema>;

// 带关联关系的门店档案类型
export type StoreFileWithRelations = StoreFile & {
  entity: CompanyEntity;
  candidateLocation: CandidateLocation | null;
  paymentItems: PaymentItem[];
  assets: Asset[];
  _count: {
    paymentItems: number;
    assets: number;
  };
};

// 分页结果类型
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 统计数据类型
export interface StoreFileStatistics {
  totalStores: number;
  byStatus: Record<StoreFileStatus, number>;
  byStoreType: Record<StoreType, number>;
  byEntity: Array<{
    entityId: string;
    entityName: string;
    count: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    openings: number;
    closures: number;
    netGrowth: number;
  }>;
  revenueStats: {
    totalRevenue: number;
    averageRevenue: number;
    highestRevenue: number;
    lowestRevenue: number;
  };
  areaStats: {
    totalArea: number;
    averageArea: number;
    largestStore: number;
    smallestStore: number;
  };
}

// 门店档案汇总类型
export interface StoreFileSummary {
  overview: {
    total: number;
    open: number;
    preparing: number;
    closed: number;
    renovating: number;
    suspended: number;
  };
  performance: {
    totalRevenue: number;
    averageRevenue: number;
    totalArea: number;
    averageArea: number;
    totalEmployees: number;
    averageEmployees: number;
  };
  distribution: {
    byType: Record<StoreType, number>;
    byStatus: Record<StoreFileStatus, number>;
  };
  trends: {
    monthlyOpenings: Array<{
      month: string;
      count: number;
    }>;
    revenueGrowth: Array<{
      month: string;
      revenue: number;
    }>;
  };
}

// 门店档案进度类型
export interface StoreFileProgress {
  preparingStores: Array<{
    id: string;
    storeName: string;
    status: StoreFileStatus;
    daysInPreparation: number;
    completionPercentage: number;
    nextMilestone: string;
  }>;
  recentOpenings: Array<{
    id: string;
    storeName: string;
    openDate: Date;
    storeType: StoreType;
    monthlyRevenue: number | null;
  }>;
  upcomingMilestones: Array<{
    storeId: string;
    storeName: string;
    milestone: string;
    dueDate: Date;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

// 状态转换验证
export const isValidStoreStatusTransition = (
  currentStatus: StoreFileStatus,
  newStatus: StoreFileStatus
): boolean => {
  const validTransitions: Record<StoreFileStatus, StoreFileStatus[]> = {
    PREPARING: ['OPEN', 'SUSPENDED', 'CLOSED'],
    OPEN: ['RENOVATING', 'SUSPENDED', 'CLOSED'],
    RENOVATING: ['OPEN', 'SUSPENDED', 'CLOSED'],
    SUSPENDED: ['OPEN', 'RENOVATING', 'CLOSED'],
    CLOSED: ['PREPARING'], // 重新启用
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// 门店文档类型定义
export interface StoreDocument {
  id: string;
  name: string;
  type: 'LICENSE' | 'PERMIT' | 'CERTIFICATE' | 'CONTRACT' | 'OTHER';
  url: string;
  uploadDate: Date;
  expiryDate?: Date;
  size: number;
  mimeType: string;
  description?: string;
}

// 门店设备类型定义
export interface StoreEquipment {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  warrantyExpiry?: Date;
  location?: string;
  notes?: string;
}