/**
 * 拓店管理模块相关类型定义
 */
import { z } from 'zod';
import type { 
  CandidateLocation, 
  FollowUpRecord, 
  Region, 
  StorePlan, 
  User,
  CandidateStatus,
  Priority,
  FollowUpType
} from '@prisma/client';

// ===============================
// 枚举类型定义
// ===============================

// 候选点位状态枚举
export const CandidateLocationStatus = {
  PENDING: 'PENDING',           // 待评估
  EVALUATING: 'EVALUATING',     // 评估中
  FOLLOWING: 'FOLLOWING',       // 跟进中
  NEGOTIATING: 'NEGOTIATING',   // 商务谈判
  CONTRACTED: 'CONTRACTED',     // 已签约
  REJECTED: 'REJECTED',         // 已拒绝
  SUSPENDED: 'SUSPENDED',       // 暂停
} as const;

export type CandidateLocationStatusType = typeof CandidateLocationStatus[keyof typeof CandidateLocationStatus];

// 跟进类型枚举
export const FollowUpTypes = {
  PHONE_CALL: 'PHONE_CALL',         // 电话跟进
  SITE_VISIT: 'SITE_VISIT',         // 实地考察
  NEGOTIATION: 'NEGOTIATION',       // 商务谈判
  EMAIL: 'EMAIL',                   // 邮件沟通
  MEETING: 'MEETING',               // 会议讨论
  DOCUMENTATION: 'DOCUMENTATION',   // 资料收集
  OTHER: 'OTHER',                   // 其他
} as const;

export type FollowUpTypesType = typeof FollowUpTypes[keyof typeof FollowUpTypes];

// 优先级枚举
export const PriorityLevels = {
  URGENT: 'URGENT',    // 紧急
  HIGH: 'HIGH',        // 高
  MEDIUM: 'MEDIUM',    // 中
  LOW: 'LOW',          // 低
} as const;

export type PriorityLevelType = typeof PriorityLevels[keyof typeof PriorityLevels];

// 租金类型枚举
export const RentTypes = {
  MONTHLY: 'MONTHLY',   // 月租
  YEARLY: 'YEARLY',     // 年租
  SQUARE_METER_MONTHLY: 'SQUARE_METER_MONTHLY', // 每平米月租
  SQUARE_METER_DAILY: 'SQUARE_METER_DAILY',     // 每平米日租
} as const;

export type RentTypesType = typeof RentTypes[keyof typeof RentTypes];

// 跟进状态枚举
export const FollowUpStatus = {
  PENDING: 'PENDING',         // 待跟进
  IN_PROGRESS: 'IN_PROGRESS', // 跟进中
  COMPLETED: 'COMPLETED',     // 已完成
  CANCELLED: 'CANCELLED',     // 已取消
  OVERDUE: 'OVERDUE',         // 已逾期
} as const;

export type FollowUpStatusType = typeof FollowUpStatus[keyof typeof FollowUpStatus];

// 地理位置坐标类型
export interface Coordinates {
  latitude: number;   // 纬度
  longitude: number;  // 经度
}

// 地址信息类型
export interface AddressInfo {
  province: string;       // 省份
  city: string;          // 城市
  district: string;      // 区县
  street?: string;       // 街道
  detailAddress: string; // 详细地址
  coordinates?: Coordinates; // 经纬度
}

// 中介信息类型
export interface IntermediaryInfo {
  name: string;           // 中介名称
  contactPerson: string;  // 联系人
  phone: string;          // 联系电话
  email?: string;         // 邮箱
  commission?: number;    // 佣金比例
  notes?: string;         // 备注
}

// 交通信息类型
export interface TrafficInfo {
  nearbySubway?: {
    line: string;         // 地铁线路
    station: string;      // 地铁站点
    distance: number;     // 距离(米)
  }[];
  nearbyBus?: {
    route: string;        // 公交线路
    station: string;      // 公交站点
    distance: number;     // 距离(米)
  }[];
  parking?: {
    available: boolean;   // 是否有停车位
    spaces?: number;      // 停车位数量
    fee?: number;         // 停车费(元/小时)
  };
  accessibility: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'; // 交通便利性
}

// 竞争对手信息类型
export interface CompetitorInfo {
  name: string;           // 竞争对手名称
  type: string;          // 业态类型
  distance: number;      // 距离(米)
  businessLevel: 'HIGH' | 'MEDIUM' | 'LOW'; // 生意状况
  priceLevel: 'HIGH' | 'MEDIUM' | 'LOW';    // 价格水平
  notes?: string;        // 备注
}

// ===============================
// 基础数据类型
// ===============================

// 候选点位扩展类型（包含关联数据）
export interface CandidateLocationWithRelations extends CandidateLocation {
  region: Region;
  storePlan?: StorePlan;
  followUpRecords?: FollowUpRecord[];
  _count?: {
    followUpRecords: number;
  };
}

// 跟进记录扩展类型（包含关联数据）
export interface FollowUpRecordWithRelations extends FollowUpRecord {
  candidateLocation: CandidateLocation;
  assignee: User;
  createdBy: User;
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
export interface CandidateLocationFilters {
  storePlanId?: string;
  regionId?: string;
  status?: CandidateLocationStatusType;
  priority?: PriorityLevelType;
  minArea?: number;
  maxArea?: number;
  minRent?: number;
  maxRent?: number;
  minScore?: number;
  maxScore?: number;
  discoveryDateStart?: string;
  discoveryDateEnd?: string;
  tags?: string[];
  keyword?: string; // 搜索关键词(名称、地址)
}

// 跟进记录筛选参数类型
export interface FollowUpRecordFilters {
  candidateLocationId?: string;
  assigneeId?: string;
  type?: FollowUpTypesType;
  status?: FollowUpStatusType;
  importance?: PriorityLevelType;
  startDate?: string;
  endDate?: string;
  nextFollowUpDateStart?: string;
  nextFollowUpDateEnd?: string;
  keyword?: string; // 搜索关键词(标题、内容)
}

// 排序参数类型
export interface SortParams {
  sortBy: 'discoveryDate' | 'evaluationScore' | 'rentPrice' | 'area' | 'priority' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

// 跟进记录排序参数类型
export interface FollowUpSortParams {
  sortBy: 'createdAt' | 'nextFollowUpDate' | 'actualFollowUpDate' | 'importance' | 'status' | 'type';
  sortOrder: 'asc' | 'desc';
}

// ===============================
// 请求类型定义
// ===============================

// 创建候选点位请求
export interface CreateCandidateLocationRequest {
  storePlanId?: string;
  regionId: string;
  name: string;
  address: string;
  detailedAddress?: string;
  area?: number;
  usableArea?: number;
  rentPrice?: number;
  rentUnit?: string;
  depositAmount?: number;
  transferFee?: number;
  propertyFee?: number;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  intermediaryInfo?: IntermediaryInfo;
  coordinates?: string;
  photos?: string[];
  floorPlan?: string[];
  trafficInfo?: TrafficInfo;
  competitorInfo?: CompetitorInfo[];
  priority?: PriorityLevelType;
  expectedSignDate?: string;
  notes?: string;
  tags?: string[];
}

// 更新候选点位请求
export interface UpdateCandidateLocationRequest {
  storePlanId?: string;
  name?: string;
  address?: string;
  detailedAddress?: string;
  area?: number;
  usableArea?: number;
  rentPrice?: number;
  rentUnit?: string;
  depositAmount?: number;
  transferFee?: number;
  propertyFee?: number;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  intermediaryInfo?: IntermediaryInfo;
  coordinates?: string;
  photos?: string[];
  floorPlan?: string[];
  trafficInfo?: TrafficInfo;
  competitorInfo?: CompetitorInfo[];
  priority?: PriorityLevelType;
  expectedSignDate?: string;
  notes?: string;
  tags?: string[];
}

// 状态变更请求
export interface StatusChangeRequest {
  status: CandidateLocationStatusType;
  reason?: string;
  comments?: string;
}

// 评分更新请求
export interface ScoreUpdateRequest {
  evaluationScore: number; // 0-10
  evaluationComments?: string;
  evaluationCriteria?: {
    location: number;      // 位置评分
    traffic: number;       // 交通评分
    competition: number;   // 竞争评分
    cost: number;         // 成本评分
    potential: number;    // 潜力评分
  };
}

// 创建跟进记录请求
export interface CreateFollowUpRecordRequest {
  candidateLocationId: string;
  assigneeId: string;
  type: FollowUpTypesType;
  title: string;
  content: string;
  result?: string;
  nextFollowUpDate?: string;
  actualFollowUpDate?: string;
  duration?: number;
  cost?: number;
  importance?: PriorityLevelType;
  attachments?: string[];
  location?: string;
  participants?: string[];
  tags?: string[];
}

// 更新跟进记录请求
export interface UpdateFollowUpRecordRequest {
  title?: string;
  content?: string;
  result?: string;
  nextFollowUpDate?: string;
  actualFollowUpDate?: string;
  duration?: number;
  cost?: number;
  importance?: PriorityLevelType;
  status?: FollowUpStatusType;
  attachments?: string[];
  location?: string;
  participants?: string[];
  tags?: string[];
}

// 查询参数请求
export interface CandidateLocationQueryRequest extends PaginationParams, SortParams {
  filters?: CandidateLocationFilters;
}

// 跟进记录查询参数请求
export interface FollowUpRecordQueryRequest extends PaginationParams, FollowUpSortParams {
  filters?: FollowUpRecordFilters;
}

// 批量操作请求
export interface BatchOperationRequest {
  ids: string[];
  action: 'delete' | 'changeStatus' | 'changePriority' | 'assignFollowUp';
  actionData?: {
    status?: CandidateLocationStatusType;
    priority?: PriorityLevelType;
    assigneeId?: string;
    reason?: string;
  };
}

// 地图查询请求
export interface MapQueryRequest {
  regionId?: string;
  bounds?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
  zoom?: number;
  filters?: CandidateLocationFilters;
}

// 统计查询请求
export interface StatisticsQueryRequest {
  regionIds?: string[];
  storePlanIds?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  groupBy?: 'region' | 'status' | 'priority' | 'month';
}

// 导出请求
export interface ExportRequest {
  format: 'xlsx' | 'csv';
  filters?: CandidateLocationFilters;
  columns?: string[];
  includeFollowUpRecords?: boolean;
}

// ===============================
// 响应类型定义
// ===============================

// 地图数据响应
export interface MapDataResponse {
  locations: Array<{
    id: string;
    name: string;
    address: string;
    coordinates: Coordinates;
    status: CandidateLocationStatusType;
    priority: PriorityLevelType;
    rentPrice?: number;
    evaluationScore?: number;
    followUpCount: number;
    storePlanTitle?: string;
  }>;
  clusters?: Array<{
    coordinates: Coordinates;
    count: number;
    avgScore?: number;
  }>;
  bounds?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

// 统计数据响应
export interface ExpansionStatistics {
  overview: {
    totalLocations: number;
    pendingCount: number;
    followingCount: number;
    negotiatingCount: number;
    contractedCount: number;
    rejectedCount: number;
  };
  statusDistribution: Record<CandidateLocationStatusType, number>;
  priorityDistribution: Record<PriorityLevelType, number>;
  regionDistribution: Array<{
    regionId: string;
    regionName: string;
    count: number;
    avgScore: number;
    avgRent: number;
  }>;
  trendData: Array<{
    date: string;
    newLocations: number;
    contractedLocations: number;
    followUpCount: number;
  }>;
  performanceMetrics: {
    avgEvaluationScore: number;
    avgRentPrice: number;
    avgFollowUpDays: number;
    contractConversionRate: number; // 签约转化率
  };
}

// 跟进统计响应
export interface FollowUpStatistics {
  overview: {
    totalRecords: number;
    pendingCount: number;
    completedCount: number;
    overdueCount: number;
    todayCount: number;
    weekCount: number;
  };
  typeDistribution: Record<FollowUpTypesType, number>;
  assigneeDistribution: Array<{
    assigneeId: string;
    assigneeName: string;
    totalCount: number;
    completedCount: number;
    pendingCount: number;
    completionRate: number;
  }>;
  activityTimeline: Array<{
    date: string;
    count: number;
    completedCount: number;
  }>;
}

// 进度跟踪响应
export interface ExpansionProgress {
  storePlanProgress: Array<{
    storePlanId: string;
    storePlanTitle: string;
    totalLocations: number;
    contractedLocations: number;
    followingLocations: number;
    completionRate: number;
    avgEvaluationScore: number;
  }>;
  regionProgress: Array<{
    regionId: string;
    regionName: string;
    totalLocations: number;
    contractedCount: number;
    completionRate: number;
    avgScore: number;
  }>;
  upcomingTasks: Array<{
    type: 'followUp' | 'evaluation' | 'negotiation';
    locationId: string;
    locationName: string;
    dueDate: string;
    assigneeName: string;
    priority: PriorityLevelType;
  }>;
}

// 仪表板数据响应
export interface ExpansionDashboard {
  kpis: {
    totalCandidates: number;
    thisMonthNew: number;
    contractedThisMonth: number;
    avgEvaluationScore: number;
    avgRentPrice: number;
    contractConversionRate: number;
  };
  charts: {
    statusTrend: Array<{
      date: string;
      pending: number;
      following: number;
      negotiating: number;
      contracted: number;
    }>;
    regionDistribution: Array<{
      regionName: string;
      count: number;
      percentage: number;
    }>;
    priorityDistribution: Array<{
      priority: PriorityLevelType;
      count: number;
      percentage: number;
    }>;
  };
  alerts: Array<{
    type: 'overdue' | 'highPriority' | 'lowScore';
    message: string;
    locationId?: string;
    locationName?: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

// ===============================
// Zod 验证Schema定义
// ===============================

// 基础验证规则
const positiveNumber = z.number().positive('必须为正数');
const nonNegativeNumber = z.number().nonnegative('不能为负数');
const cuidString = z.string().cuid('无效的ID格式');
const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// 中介信息验证
const intermediaryInfoSchema = z.object({
  name: z.string().min(1, '中介名称不能为空').max(100, '中介名称不超过100个字符'),
  contactPerson: z.string().min(1, '联系人不能为空').max(50, '联系人不超过50个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  email: z.string().email('请输入有效的邮箱地址').optional(),
  commission: z.number().min(0).max(100, '佣金比例不能超过100%').optional(),
  notes: z.string().max(500, '备注不超过500个字符').optional(),
}).optional();

// 创建候选点位验证
export const createCandidateLocationSchema = z.object({
  storePlanId: cuidString.optional(),
  regionId: cuidString,
  name: z.string()
    .min(2, '点位名称至少2个字符')
    .max(200, '点位名称不超过200个字符'),
  address: z.string()
    .min(5, '地址至少5个字符')
    .max(500, '地址不超过500个字符'),
  detailedAddress: z.string()
    .max(500, '详细地址不超过500个字符')
    .optional(),
  area: positiveNumber.max(100000, '面积不能超过100000平方米').optional(),
  usableArea: positiveNumber.max(100000, '可用面积不能超过100000平方米').optional(),
  rentPrice: nonNegativeNumber.max(1000000, '租金不能超过1000000元').optional(),
  rentUnit: z.string().max(50, '租金单位不超过50个字符').optional(),
  depositAmount: nonNegativeNumber.max(10000000, '押金不能超过10000000元').optional(),
  transferFee: nonNegativeNumber.max(10000000, '转让费不能超过10000000元').optional(),
  propertyFee: nonNegativeNumber.max(100000, '物业费不能超过100000元').optional(),
  landlordName: z.string().max(50, '房东姓名不超过50个字符').optional(),
  landlordPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码').optional(),
  landlordEmail: z.string().email('请输入有效的邮箱地址').optional(),
  intermediaryInfo: intermediaryInfoSchema,
  coordinates: z.string().max(50, '坐标格式不正确').optional(),
  photos: z.array(z.string().url('照片URL格式不正确')).optional(),
  floorPlan: z.array(z.string().url('户型图URL格式不正确')).optional(),
  trafficInfo: z.any().optional(), // JSON类型，具体验证在业务层
  competitorInfo: z.any().optional(), // JSON类型，具体验证在业务层
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW'], {
    errorMap: () => ({ message: '无效的优先级' }),
  }).default('MEDIUM'),
  expectedSignDate: z.string()
    .datetime('无效的预计签约日期格式')
    .optional(),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
  tags: z.array(z.string().max(20, '标签长度不超过20个字符')).max(10, '标签数量不超过10个').optional(),
});

// 更新候选点位验证
export const updateCandidateLocationSchema = z.object({
  storePlanId: cuidString.optional(),
  name: z.string()
    .min(2, '点位名称至少2个字符')
    .max(200, '点位名称不超过200个字符')
    .optional(),
  address: z.string()
    .min(5, '地址至少5个字符')
    .max(500, '地址不超过500个字符')
    .optional(),
  detailedAddress: z.string()
    .max(500, '详细地址不超过500个字符')
    .optional(),
  area: positiveNumber.max(100000, '面积不能超过100000平方米').optional(),
  usableArea: positiveNumber.max(100000, '可用面积不能超过100000平方米').optional(),
  rentPrice: nonNegativeNumber.max(1000000, '租金不能超过1000000元').optional(),
  rentUnit: z.string().max(50, '租金单位不超过50个字符').optional(),
  depositAmount: nonNegativeNumber.max(10000000, '押金不能超过10000000元').optional(),
  transferFee: nonNegativeNumber.max(10000000, '转让费不能超过10000000元').optional(),
  propertyFee: nonNegativeNumber.max(100000, '物业费不能超过100000元').optional(),
  landlordName: z.string().max(50, '房东姓名不超过50个字符').optional(),
  landlordPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码').optional(),
  landlordEmail: z.string().email('请输入有效的邮箱地址').optional(),
  intermediaryInfo: intermediaryInfoSchema,
  coordinates: z.string().max(50, '坐标格式不正确').optional(),
  photos: z.array(z.string().url('照片URL格式不正确')).optional(),
  floorPlan: z.array(z.string().url('户型图URL格式不正确')).optional(),
  trafficInfo: z.any().optional(), // JSON类型，具体验证在业务层
  competitorInfo: z.any().optional(), // JSON类型，具体验证在业务层
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW'], {
    errorMap: () => ({ message: '无效的优先级' }),
  }).optional(),
  expectedSignDate: z.string()
    .datetime('无效的预计签约日期格式')
    .optional(),
  notes: z.string()
    .max(2000, '备注不超过2000个字符')
    .optional(),
  tags: z.array(z.string().max(20, '标签长度不超过20个字符')).max(10, '标签数量不超过10个').optional(),
});

// 状态变更验证
export const statusChangeSchema = z.object({
  status: z.enum(['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED']),
  reason: z.string()
    .max(500, '变更原因不超过500个字符')
    .optional(),
  comments: z.string()
    .max(1000, '备注不超过1000个字符')
    .optional(),
});

// 评分更新验证
export const scoreUpdateSchema = z.object({
  evaluationScore: z.number()
    .min(0, '评分不能低于0')
    .max(10, '评分不能高于10'),
  evaluationComments: z.string()
    .max(1000, '评价意见不超过1000个字符')
    .optional(),
  evaluationCriteria: z.object({
    location: z.number().min(0).max(10),
    traffic: z.number().min(0).max(10),
    competition: z.number().min(0).max(10),
    cost: z.number().min(0).max(10),
    potential: z.number().min(0).max(10),
  }).optional(),
});

// 创建跟进记录验证
export const createFollowUpRecordSchema = z.object({
  candidateLocationId: cuidString,
  assigneeId: cuidString,
  type: z.enum(['PHONE_CALL', 'SITE_VISIT', 'NEGOTIATION', 'EMAIL', 'MEETING', 'DOCUMENTATION', 'OTHER'], {
    errorMap: () => ({ message: '无效的跟进类型' }),
  }),
  title: z.string()
    .min(2, '跟进主题至少2个字符')
    .max(200, '跟进主题不超过200个字符'),
  content: z.string()
    .min(5, '跟进内容至少5个字符')
    .max(5000, '跟进内容不超过5000个字符'),
  result: z.string()
    .max(2000, '跟进结果不超过2000个字符')
    .optional(),
  nextFollowUpDate: z.string()
    .datetime('无效的下次跟进日期格式')
    .optional(),
  actualFollowUpDate: z.string()
    .datetime('无效的实际跟进日期格式')
    .optional(),
  duration: z.number()
    .int('跟进时长必须为整数')
    .min(0, '跟进时长不能为负数')
    .max(1440, '跟进时长不能超过1440分钟')
    .optional(),
  cost: nonNegativeNumber
    .max(100000, '跟进成本不能超过100000元')
    .optional(),
  importance: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW'], {
    errorMap: () => ({ message: '无效的重要性级别' }),
  }).default('MEDIUM'),
  attachments: z.array(z.string().url('附件URL格式不正确')).optional(),
  location: z.string()
    .max(200, '跟进地点不超过200个字符')
    .optional(),
  participants: z.array(cuidString).max(20, '参与人员不超过20个').optional(),
  tags: z.array(z.string().max(20, '标签长度不超过20个字符')).max(10, '标签数量不超过10个').optional(),
});

// 更新跟进记录验证
export const updateFollowUpRecordSchema = z.object({
  title: z.string()
    .min(2, '跟进主题至少2个字符')
    .max(200, '跟进主题不超过200个字符')
    .optional(),
  content: z.string()
    .min(5, '跟进内容至少5个字符')
    .max(5000, '跟进内容不超过5000个字符')
    .optional(),
  result: z.string()
    .max(2000, '跟进结果不超过2000个字符')
    .optional(),
  nextFollowUpDate: z.string()
    .datetime('无效的下次跟进日期格式')
    .optional(),
  actualFollowUpDate: z.string()
    .datetime('无效的实际跟进日期格式')
    .optional(),
  duration: z.number()
    .int('跟进时长必须为整数')
    .min(0, '跟进时长不能为负数')
    .max(1440, '跟进时长不能超过1440分钟')
    .optional(),
  cost: nonNegativeNumber
    .max(100000, '跟进成本不能超过100000元')
    .optional(),
  importance: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW'], {
    errorMap: () => ({ message: '无效的重要性级别' }),
  }).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'], {
    errorMap: () => ({ message: '无效的跟进状态' }),
  }).optional(),
  attachments: z.array(z.string().url('附件URL格式不正确')).optional(),
  location: z.string()
    .max(200, '跟进地点不超过200个字符')
    .optional(),
  participants: z.array(cuidString).max(20, '参与人员不超过20个').optional(),
  tags: z.array(z.string().max(20, '标签长度不超过20个字符')).max(10, '标签数量不超过10个').optional(),
});

// 查询参数验证
export const candidateLocationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['discoveryDate', 'evaluationScore', 'rentPrice', 'area', 'priority', 'status', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // 筛选参数
  storePlanId: cuidString.optional(),
  regionId: cuidString.optional(),
  status: z.enum(['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  minArea: nonNegativeNumber.optional(),
  maxArea: nonNegativeNumber.optional(),
  minRent: nonNegativeNumber.optional(),
  maxRent: nonNegativeNumber.optional(),
  minScore: z.number().min(0).max(10).optional(),
  maxScore: z.number().min(0).max(10).optional(),
  discoveryDateStart: z.string().datetime().optional(),
  discoveryDateEnd: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  keyword: z.string().max(100, '搜索关键词不超过100个字符').optional(),
});

// 跟进记录查询参数验证
export const followUpRecordQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'nextFollowUpDate', 'actualFollowUpDate', 'importance', 'status', 'type'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // 筛选参数
  candidateLocationId: cuidString.optional(),
  assigneeId: cuidString.optional(),
  type: z.enum(['PHONE_CALL', 'SITE_VISIT', 'NEGOTIATION', 'EMAIL', 'MEETING', 'DOCUMENTATION', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
  importance: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  nextFollowUpDateStart: z.string().datetime().optional(),
  nextFollowUpDateEnd: z.string().datetime().optional(),
  keyword: z.string().max(100, '搜索关键词不超过100个字符').optional(),
});

// 批量操作验证
export const batchOperationSchema = z.object({
  ids: z.array(cuidString).min(1, '至少选择一项进行操作'),
  action: z.enum(['delete', 'changeStatus', 'changePriority', 'assignFollowUp']),
  actionData: z.object({
    status: z.enum(['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED']).optional(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    assigneeId: cuidString.optional(),
    reason: z.string().max(500, '操作原因不超过500个字符').optional(),
  }).optional(),
});

// 地图查询验证
export const mapQuerySchema = z.object({
  regionId: cuidString.optional(),
  bounds: z.object({
    northeast: coordinatesSchema,
    southwest: coordinatesSchema,
  }).optional(),
  zoom: z.number().int().min(1).max(20).optional(),
  // filters会通过candidateLocationQuerySchema验证
});

// 统计查询验证
export const statisticsQuerySchema = z.object({
  regionIds: z.array(cuidString).optional(),
  storePlanIds: z.array(cuidString).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  groupBy: z.enum(['region', 'status', 'priority', 'month']).optional(),
});

// 导出验证
export const exportSchema = z.object({
  format: z.enum(['xlsx', 'csv']),
  // filters会通过candidateLocationQuerySchema验证
  columns: z.array(z.string()).optional(),
  includeFollowUpRecords: z.boolean().default(false),
});

// ID参数验证
export const idParamSchema = z.object({
  id: cuidString,
});

// ===============================
// 类型推断导出
// ===============================

export type CreateCandidateLocationData = z.infer<typeof createCandidateLocationSchema>;
export type UpdateCandidateLocationData = z.infer<typeof updateCandidateLocationSchema>;
export type StatusChangeData = z.infer<typeof statusChangeSchema>;
export type ScoreUpdateData = z.infer<typeof scoreUpdateSchema>;
export type CreateFollowUpRecordData = z.infer<typeof createFollowUpRecordSchema>;
export type UpdateFollowUpRecordData = z.infer<typeof updateFollowUpRecordSchema>;
export type CandidateLocationQuery = z.infer<typeof candidateLocationQuerySchema>;
export type FollowUpRecordQuery = z.infer<typeof followUpRecordQuerySchema>;
export type BatchOperationData = z.infer<typeof batchOperationSchema>;
export type MapQuery = z.infer<typeof mapQuerySchema>;
export type StatisticsQuery = z.infer<typeof statisticsQuerySchema>;
export type ExportData = z.infer<typeof exportSchema>;
export type IdParam = z.infer<typeof idParamSchema>;

// ===============================
// 状态转换规则定义
// ===============================

// 状态转换映射表
export const statusTransitions: Record<CandidateLocationStatusType, CandidateLocationStatusType[]> = {
  [CandidateLocationStatus.PENDING]: [
    CandidateLocationStatus.EVALUATING,
    CandidateLocationStatus.FOLLOWING,
    CandidateLocationStatus.REJECTED,
    CandidateLocationStatus.SUSPENDED
  ],
  [CandidateLocationStatus.EVALUATING]: [
    CandidateLocationStatus.FOLLOWING,
    CandidateLocationStatus.REJECTED,
    CandidateLocationStatus.SUSPENDED
  ],
  [CandidateLocationStatus.FOLLOWING]: [
    CandidateLocationStatus.NEGOTIATING,
    CandidateLocationStatus.REJECTED,
    CandidateLocationStatus.SUSPENDED
  ],
  [CandidateLocationStatus.NEGOTIATING]: [
    CandidateLocationStatus.CONTRACTED,
    CandidateLocationStatus.FOLLOWING,
    CandidateLocationStatus.REJECTED,
    CandidateLocationStatus.SUSPENDED
  ],
  [CandidateLocationStatus.CONTRACTED]: [
    CandidateLocationStatus.SUSPENDED // 已签约只能暂停
  ],
  [CandidateLocationStatus.REJECTED]: [
    CandidateLocationStatus.PENDING // 已拒绝可重新开始
  ],
  [CandidateLocationStatus.SUSPENDED]: [
    CandidateLocationStatus.FOLLOWING,
    CandidateLocationStatus.REJECTED
  ],
};

// 验证状态转换是否合法
export const isValidStatusTransition = (
  currentStatus: CandidateLocationStatusType,
  targetStatus: CandidateLocationStatusType
): boolean => {
  return statusTransitions[currentStatus]?.includes(targetStatus) || false;
};

// 获取可用的下一状态
export const getAvailableStatuses = (
  currentStatus: CandidateLocationStatusType
): CandidateLocationStatusType[] => {
  return statusTransitions[currentStatus] || [];
};

// ===============================
// 业务规则常量
// ===============================

// 评分权重配置
export const EVALUATION_WEIGHTS = {
  location: 0.3,      // 位置权重 30%
  traffic: 0.2,       // 交通权重 20%
  competition: 0.2,   // 竞争权重 20%
  cost: 0.15,         // 成本权重 15%
  potential: 0.15,    // 潜力权重 15%
} as const;

// 优先级颜色映射
export const PRIORITY_COLORS = {
  URGENT: '#ff4d4f',    // 红色
  HIGH: '#fa8c16',      // 橙色
  MEDIUM: '#1890ff',    // 蓝色
  LOW: '#52c41a',       // 绿色
} as const;

// 状态颜色映射
export const STATUS_COLORS = {
  PENDING: '#d9d9d9',        // 灰色
  EVALUATING: '#1890ff',     // 蓝色
  FOLLOWING: '#faad14',      // 黄色
  NEGOTIATING: '#fa8c16',    // 橙色
  CONTRACTED: '#52c41a',     // 绿色
  REJECTED: '#ff4d4f',       // 红色
  SUSPENDED: '#722ed1',      // 紫色
} as const;

// 默认分页配置
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// 文件上传限制
export const FILE_UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxFiles: 20,
} as const;