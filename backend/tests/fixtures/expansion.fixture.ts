/**
 * 拓店管理模块测试夹具数据
 * 提供候选点位和跟进记录的模拟数据
 */

import type { 
  CandidateLocation,
  FollowUpRecord,
  Region,
  StorePlan,
  User,
} from '@prisma/client';
import { CandidateStatus, Priority, FollowUpType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ===============================
// 基础测试数据
// ===============================

export const mockRegion: Region = {
  id: 'region-test-001',
  name: '北京市海淀区',
  code: 'BJ-HD',
  parentId: 'region-parent-001',
  level: 2,
  fullPath: '北京市/海淀区',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockStorePlan: StorePlan = {
  id: 'store-plan-001',
  planCode: 'SP2024Q1-BJ-HD-001',
  title: '2024年第1季度北京海淀区直营店开店计划',
  year: 2024,
  quarter: 1,
  regionId: 'region-test-001',
  entityId: 'entity-test-001',
  storeType: 'DIRECT',
  plannedCount: 5,
  completedCount: 1,
  budget: new Decimal(5000000),
  actualBudget: new Decimal(1200000),
  priority: 'HIGH',
  status: 'APPROVED',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31'),
  description: '海淀区重点商圈开店计划',
  remark: null,
  approvalFlowId: null,
  createdById: 'user-test-001',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockUser: User = {
  id: 'user-test-001',
  wechatId: 'wechat-test-001',
  wechatUnionId: null,
  username: 'test_user',
  email: 'test@example.com',
  phone: '13800138000',
  name: '测试用户',
  nickname: '测试',
  avatar: null,
  gender: 'M',
  jobTitle: '拓展经理',
  employeeId: 'EMP001',
  departmentId: 'dept-test-001',
  directManager: null,
  hireDate: new Date('2023-01-01'),
  status: 'ACTIVE',
  lastLoginAt: new Date(),
  loginCount: 10,
  preferences: null,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ===============================
// 候选点位测试数据
// ===============================

export const mockCandidateLocation: CandidateLocation = {
  id: 'candidate-location-001',
  locationCode: 'CLBJ-HD-20240101-001',
  storePlanId: 'store-plan-001',
  regionId: 'region-test-001',
  name: '中关村大厦商业点位',
  address: '北京市海淀区中关村大街1号',
  detailedAddress: '中关村大厦1层A区',
  area: new Decimal(200),
  usableArea: new Decimal(180),
  rentPrice: new Decimal(25000),
  rentUnit: '元/月',
  depositAmount: new Decimal(75000),
  transferFee: new Decimal(0),
  propertyFee: new Decimal(5000),
  landlordName: '张三',
  landlordPhone: '13800138001',
  landlordEmail: 'zhangsan@example.com',
  intermediaryInfo: {
    name: '中原地产',
    contactPerson: '李四',
    phone: '13800138002',
    commission: 1.5,
    notes: '专业可靠'
  },
  coordinates: '116.331398,39.961204',
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ],
  floorPlan: [
    'https://example.com/floorplan.jpg'
  ],
  trafficInfo: {
    nearbySubway: [
      {
        line: '4号线',
        station: '中关村',
        distance: 200
      }
    ],
    nearbyBus: [
      {
        route: '332',
        station: '中关村南',
        distance: 100
      }
    ],
    parking: {
      available: true,
      spaces: 50,
      fee: 10
    },
    accessibility: 'EXCELLENT'
  },
  competitorInfo: [
    {
      name: '麦当劳',
      type: '快餐',
      distance: 300,
      businessLevel: 'HIGH',
      priceLevel: 'MEDIUM',
      notes: '人流量大'
    }
  ],
  evaluationScore: new Decimal(8.5),
  status: 'FOLLOWING',
  priority: 'HIGH',
  discoveryDate: new Date('2024-01-15'),
  expectedSignDate: new Date('2024-02-15'),
  notes: '位置优越，人流量大，适合开设旗舰店',
  tags: ['核心商圈', '高人流', '地铁口'],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
};

export const mockCandidateLocationList: CandidateLocation[] = [
  mockCandidateLocation,
  {
    ...mockCandidateLocation,
    id: 'candidate-location-002',
    locationCode: 'CLBJ-HD-20240102-002',
    name: '五道口购物中心',
    address: '北京市海淀区五道口购物中心',
    status: 'NEGOTIATING',
    priority: 'MEDIUM',
    evaluationScore: 7.8,
    discoveryDate: new Date('2024-01-16'),
    tags: ['购物中心', '年轻客群'],
  },
  {
    ...mockCandidateLocation,
    id: 'candidate-location-003',
    locationCode: 'CLBJ-HD-20240103-003',
    name: '西二旗地铁站商铺',
    address: '北京市海淀区西二旗地铁站B出口',
    status: 'PENDING',
    priority: 'LOW',
    evaluationScore: 6.2,
    discoveryDate: new Date('2024-01-17'),
    tags: ['地铁站', '写字楼'],
  },
];

// ===============================
// 跟进记录测试数据
// ===============================

export const mockFollowUpRecord: FollowUpRecord = {
  id: 'follow-up-001',
  candidateLocationId: 'candidate-location-001',
  assigneeId: 'user-test-001',
  createdById: 'user-test-001',
  type: 'SITE_VISIT',
  title: '实地考察中关村大厦点位',
  content: '今天前往中关村大厦进行实地考察，查看了具体的铺位位置和周边环境。该点位位于大厦一层临街位置，展示面积充足，人流量较大。',
  result: '点位条件良好，建议进入商务谈判阶段',
  nextFollowUpDate: new Date('2024-01-25'),
  actualFollowUpDate: new Date('2024-01-20'),
  duration: 120,
  cost: new Decimal(200),
  status: 'COMPLETED',
  importance: 'HIGH',
  attachments: [
    'https://example.com/site-photo1.jpg',
    'https://example.com/site-photo2.jpg'
  ],
  location: '中关村大厦',
  participants: ['user-test-001', 'user-test-002'],
  tags: ['实地考察', '首次访问'],
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-01-20'),
};

export const mockFollowUpRecordList: FollowUpRecord[] = [
  mockFollowUpRecord,
  {
    ...mockFollowUpRecord,
    id: 'follow-up-002',
    type: 'PHONE_CALL',
    title: '电话沟通租金条件',
    content: '与房东电话沟通租金和其他商务条件',
    result: '房东可接受月租24000元，押金可商量',
    status: 'COMPLETED',
    nextFollowUpDate: new Date('2024-01-22'),
    actualFollowUpDate: new Date('2024-01-21'),
    duration: 30,
    cost: 0,
    tags: ['电话沟通', '商务条件'],
  },
  {
    ...mockFollowUpRecord,
    id: 'follow-up-003',
    type: 'NEGOTIATION',
    title: '商务条件谈判',
    content: '与房东面对面谈判具体的租赁条件',
    result: null,
    status: 'PENDING',
    nextFollowUpDate: new Date('2024-01-30'),
    actualFollowUpDate: null,
    duration: null,
    cost: null,
    tags: ['商务谈判', '待进行'],
  },
];

// ===============================
// 复杂关联数据
// ===============================

export const mockCandidateLocationWithRelations = {
  ...mockCandidateLocation,
  region: mockRegion,
  storePlan: mockStorePlan,
  followUpRecords: mockFollowUpRecordList,
  _count: {
    followUpRecords: 3,
  },
};

export const mockFollowUpRecordWithRelations = {
  ...mockFollowUpRecord,
  candidateLocation: mockCandidateLocation,
  assignee: mockUser,
  createdBy: mockUser,
};

// ===============================
// 统计数据
// ===============================

export const mockExpansionStatistics = {
  overview: {
    totalLocations: 15,
    pendingCount: 3,
    followingCount: 6,
    negotiatingCount: 4,
    contractedCount: 2,
    rejectedCount: 0,
  },
  statusDistribution: {
    PENDING: 3,
    EVALUATING: 0,
    FOLLOWING: 6,
    NEGOTIATING: 4,
    CONTRACTED: 2,
    REJECTED: 0,
    SUSPENDED: 0,
  },
  priorityDistribution: {
    URGENT: 2,
    HIGH: 5,
    MEDIUM: 6,
    LOW: 2,
  },
  regionDistribution: [
    {
      regionId: 'region-test-001',
      regionName: '北京市海淀区',
      count: 8,
      avgScore: 7.5,
      avgRent: 22000,
    },
    {
      regionId: 'region-test-002',
      regionName: '北京市朝阳区',
      count: 7,
      avgScore: 7.8,
      avgRent: 26000,
    },
  ],
  trendData: [
    {
      date: '2024-01-15',
      newLocations: 2,
      contractedLocations: 0,
      followUpCount: 4,
    },
    {
      date: '2024-01-16',
      newLocations: 3,
      contractedLocations: 1,
      followUpCount: 6,
    },
  ],
  performanceMetrics: {
    avgEvaluationScore: 7.6,
    avgRentPrice: 24000,
    avgFollowUpDays: 12,
    contractConversionRate: 13.3,
  },
};

export const mockFollowUpStatistics = {
  overview: {
    totalRecords: 45,
    pendingCount: 8,
    completedCount: 32,
    overdueCount: 3,
    todayCount: 2,
    weekCount: 12,
  },
  typeDistribution: {
    PHONE_CALL: 12,
    SITE_VISIT: 15,
    NEGOTIATION: 8,
    EMAIL: 3,
    MEETING: 5,
    DOCUMENTATION: 2,
    OTHER: 0,
  },
  assigneeDistribution: [
    {
      assigneeId: 'user-test-001',
      assigneeName: '测试用户',
      totalCount: 20,
      completedCount: 18,
      pendingCount: 2,
      completionRate: 90,
    },
    {
      assigneeId: 'user-test-002',
      assigneeName: '用户二',
      totalCount: 25,
      completedCount: 14,
      pendingCount: 6,
      completionRate: 56,
    },
  ],
  activityTimeline: [
    {
      date: '2024-01-20',
      count: 5,
      completedCount: 4,
    },
    {
      date: '2024-01-21',
      count: 3,
      completedCount: 3,
    },
  ],
};

export const mockMapDataResponse = {
  locations: [
    {
      id: 'candidate-location-001',
      name: '中关村大厦商业点位',
      address: '北京市海淀区中关村大街1号',
      coordinates: { latitude: 39.961204, longitude: 116.331398 },
      status: 'FOLLOWING' as CandidateStatus,
      priority: 'HIGH' as Priority,
      rentPrice: new Decimal(25000),
      evaluationScore: new Decimal(8.5),
      followUpCount: 3,
      storePlanTitle: '2024年第1季度北京海淀区直营店开店计划',
    },
    {
      id: 'candidate-location-002',
      name: '五道口购物中心',
      address: '北京市海淀区五道口购物中心',
      coordinates: { latitude: 39.990276, longitude: 116.356117 },
      status: 'NEGOTIATING' as CandidateStatus,
      priority: 'MEDIUM' as Priority,
      rentPrice: 22000,
      evaluationScore: 7.8,
      followUpCount: 2,
      storePlanTitle: '2024年第1季度北京海淀区直营店开店计划',
    },
  ],
  bounds: {
    northeast: { latitude: 40.000000, longitude: 116.400000 },
    southwest: { latitude: 39.900000, longitude: 116.300000 },
  },
};

// ===============================
// 错误测试数据
// ===============================

export const invalidCandidateLocationData = {
  regionId: '', // 无效：必需字段为空
  name: 'A', // 无效：名称太短
  address: '123', // 无效：地址太短
  area: -10, // 无效：面积为负数
  rentPrice: new Decimal(2000000), // 无效：租金超出限制
  landlordPhone: '123456789', // 无效：手机号格式错误
  landlordEmail: 'invalid-email', // 无效：邮箱格式错误
  evaluationScore: new Decimal(15), // 无效：评分超出范围
  tags: Array(15).fill('tag'), // 无效：标签数量超限
};

export const invalidFollowUpRecordData = {
  candidateLocationId: '', // 无效：必需字段为空
  assigneeId: '', // 无效：必需字段为空
  type: 'INVALID_TYPE', // 无效：类型不存在
  title: 'A', // 无效：标题太短
  content: '123', // 无效：内容太短
  duration: 2000, // 无效：时长超出限制
  cost: new Decimal(200000), // 无效：成本超出限制
  participants: Array(25).fill('user-id'), // 无效：参与人员超限
};

// ===============================
// 工具函数
// ===============================

/**
 * 创建测试候选点位数据
 */
export const createTestCandidateLocation = (overrides: Partial<CandidateLocation> = {}): CandidateLocation => {
  return {
    ...mockCandidateLocation,
    ...overrides,
    id: `test-location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
};

/**
 * 创建测试跟进记录数据
 */
export const createTestFollowUpRecord = (overrides: Partial<FollowUpRecord> = {}): FollowUpRecord => {
  return {
    ...mockFollowUpRecord,
    ...overrides,
    id: `test-followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
};

/**
 * 创建分页测试数据
 */
export const createPaginatedTestData = <T>(items: T[], page: number = 1, limit: number = 20) => {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * 生成随机测试数据
 */
export const generateRandomTestData = (count: number) => {
  const locations: CandidateLocation[] = [];
  const followUps: FollowUpRecord[] = [];
  
  const statuses: CandidateStatus[] = ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'];
  const priorities: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
  const followUpTypes: FollowUpType[] = ['PHONE_CALL', 'SITE_VISIT', 'NEGOTIATION', 'EMAIL', 'MEETING', 'DOCUMENTATION', 'OTHER'];

  for (let i = 0; i < count; i++) {
    const locationId = `test-location-${i + 1}`;
    
    locations.push({
      ...mockCandidateLocation,
      id: locationId,
      locationCode: `TEST-${(i + 1).toString().padStart(3, '0')}`,
      name: `测试点位${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)] || CandidateStatus.PENDING,
      priority: priorities[Math.floor(Math.random() * priorities.length)] || Priority.MEDIUM,
      evaluationScore: new Decimal(Math.round((Math.random() * 10 + 1) * 10) / 10), // 1.0-10.0
      rentPrice: new Decimal(Math.floor(Math.random() * 50000 + 10000)), // 10000-60000
      area: new Decimal(Math.floor(Math.random() * 300 + 50)), // 50-350
      discoveryDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 过去30天内
    });

    // 每个点位生成1-5个跟进记录
    const followUpCount = Math.floor(Math.random() * 5) + 1;
    for (let j = 0; j < followUpCount; j++) {
      followUps.push({
        ...mockFollowUpRecord,
        id: `test-followup-${i + 1}-${j + 1}`,
        candidateLocationId: locationId,
        type: followUpTypes[Math.floor(Math.random() * followUpTypes.length)] || FollowUpType.PHONE_CALL,
        title: `跟进记录${j + 1}`,
        status: Math.random() > 0.3 ? 'COMPLETED' : 'PENDING',
        importance: priorities[Math.floor(Math.random() * priorities.length)] || Priority.MEDIUM,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000), // 过去20天内
      });
    }
  }

  return { locations, followUps };
};

export default {
  mockRegion,
  mockStorePlan,
  mockUser,
  mockCandidateLocation,
  mockCandidateLocationList,
  mockFollowUpRecord,
  mockFollowUpRecordList,
  mockCandidateLocationWithRelations,
  mockFollowUpRecordWithRelations,
  mockExpansionStatistics,
  mockFollowUpStatistics,
  mockMapDataResponse,
  invalidCandidateLocationData,
  invalidFollowUpRecordData,
  createTestCandidateLocation,
  createTestFollowUpRecord,
  createPaginatedTestData,
  generateRandomTestData,
};