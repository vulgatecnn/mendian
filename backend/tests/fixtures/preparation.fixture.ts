/**
 * 开店筹备管理模块测试夹具数据
 * 提供筹备项目、工程任务、设备采购、证照办理、人员招聘、里程碑跟踪的模拟数据
 */

import type {
  ConstructionProject,
  EquipmentProcurement,
  LicenseApplication,
  StaffRecruitment,
  MilestoneTracking,
  Region,
  StorePlan,
  User,
} from '@prisma/client';
import { Priority, ProjectStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  PreparationProject,
  PreparationStatusType,
  EquipmentStatusType,
  LicenseTypeType,
  RecruitmentStatusType,
  MilestoneStatusType,
} from '../../src/types/preparation';

// ===============================
// 基础测试数据
// ===============================

export const mockRegion: Region = {
  id: 'region-test-001',
  name: '上海市浦东新区',
  code: 'SH-PD',
  parentId: 'region-parent-001',
  level: 2,
  fullPath: '上海市/浦东新区',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockStorePlan: StorePlan = {
  id: 'store-plan-001',
  planCode: 'SP2024Q1-SH-PD-001',
  title: '2024年第1季度上海浦东新区直营店开店计划',
  year: 2024,
  quarter: 1,
  entityId: 'entity-test-001',
  plannedCount: 3,
  completedCount: 1,
  budget: new Decimal(3000000),
  actualBudget: new Decimal(800000),
  priority: 'HIGH',
  status: 'APPROVED',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31'),
  description: '浦东新区核心商圈开店计划',
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
  username: 'preparation_manager',
  email: 'prep@example.com',
  phone: '13900139000',
  name: '筹备经理',
  nickname: '筹备',
  avatar: null,
  gender: 'F',
  jobTitle: '开店筹备经理',
  employeeId: 'EMP002',
  departmentId: 'dept-test-001',
  directManager: null,
  hireDate: new Date('2023-01-01'),
  status: 'ACTIVE',
  lastLoginAt: new Date(),
  loginCount: 15,
  preferences: null,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ===============================
// 筹备项目测试数据
// ===============================

export const mockPreparationProject: PreparationProject = {
  id: 'prep-project-001',
  projectCode: 'PREP2024-SH-PD-001',
  storeId: null,
  storeName: '陆家嘴旗舰店',
  planningArea: 300,
  actualArea: 280,
  expectedOpenDate: new Date('2024-06-01'),
  actualOpenDate: null,
  totalBudget: 1500000,
  actualCost: 200000,
  status: 'PLANNING',
  priority: 'HIGH',
  progress: 15,
  managerId: 'user-test-001',
  constructionManagerId: 'user-test-002',
  equipmentManagerId: 'user-test-003',
  hrManagerId: 'user-test-004',
  licenseManagerId: 'user-test-005',
  description: '陆家嘴核心区域旗舰店筹备项目',
  requirements: {
    constructionRequirements: '现代简约风格装修，符合品牌VI要求',
    equipmentRequirements: '全套厨房设备、POS系统、音响设备等',
    staffRequirements: '店长1名、服务员8名、厨师4名',
    licenseRequirements: '营业执照、食品经营许可证、消防安全检查合格证'
  },
  milestones: [
    {
      name: '装修开工',
      targetDate: '2024-03-01',
      completedDate: null,
      status: 'PENDING'
    },
    {
      name: '设备安装',
      targetDate: '2024-04-15',
      completedDate: null,
      status: 'PENDING'
    },
    {
      name: '人员到位',
      targetDate: '2024-05-15',
      completedDate: null,
      status: 'PENDING'
    },
    {
      name: '证照齐全',
      targetDate: '2024-05-20',
      completedDate: null,
      status: 'PENDING'
    }
  ],
  risks: [
    {
      description: '装修进度可能受疫情影响',
      level: 'MEDIUM',
      mitigation: '提前联系多家装修公司做备选方案'
    }
  ],
  attachments: [
    'https://example.com/floor-plan.pdf',
    'https://example.com/budget-detail.xlsx'
  ],
  notes: '重点项目，需密切关注进度',
  tags: ['旗舰店', '核心区域', '重点项目'],
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-02-15'),
};

export const mockPreparationProjectList: PreparationProject[] = [
  mockPreparationProject,
  {
    ...mockPreparationProject,
    id: 'prep-project-002',
    projectCode: 'PREP2024-SH-PD-002',
    storeName: '张江科技园店',
    status: 'IN_PROGRESS',
    progress: 45,
    expectedOpenDate: new Date('2024-05-01'),
    tags: ['科技园区', '标准店'],
  },
  {
    ...mockPreparationProject,
    id: 'prep-project-003',
    projectCode: 'PREP2024-SH-PD-003',
    storeName: '世纪公园店',
    status: 'COMPLETED',
    progress: 100,
    actualOpenDate: new Date('2024-01-15'),
    tags: ['社区店', '已开业'],
  },
];

// ===============================
// 工程施工测试数据
// ===============================

export const mockConstructionProject: ConstructionProject = {
  id: 'construction-001',
  projectCode: 'CONST-001',
  projectName: '店铺装修工程',
  candidateLocationId: 'candidate-location-001',
  preparationProjectId: 'prep-project-001',
  supplierId: 'supplier-001',
  projectType: 'DECORATION',
  contractNumber: 'CONTRACT-001',
  contractAmount: new Decimal(800000),
  actualAmount: new Decimal(150000),
  plannedStartDate: new Date('2024-03-01'),
  plannedEndDate: new Date('2024-04-30'),
  actualStartDate: new Date('2024-03-01'),
  actualEndDate: null,
  status: ProjectStatus.IN_PROGRESS,
  progressPercentage: 25,
  qualityScore: null,
  description: '店铺综合装修工程',
  notes: null,
  riskLevel: Priority.MEDIUM,
  milestones: [
    {
      name: '水电改造',
      targetDate: '2024-03-10',
      completedDate: '2024-03-12',
      status: 'COMPLETED'
    },
    {
      name: '泥瓦工程',
      targetDate: '2024-03-25',
      completedDate: null,
      status: 'IN_PROGRESS'
    }
  ],
  documents: [
    'https://example.com/contract.pdf',
    'https://example.com/blueprint.pdf'
  ],
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ],
  approvalFlowId: null,
  createdAt: new Date('2024-02-25'),
  updatedAt: new Date('2024-03-20'),
};

// ===============================
// 设备采购测试数据
// ===============================

export const mockEquipmentProcurement: EquipmentProcurement = {
  id: 'equipment-001',
  preparationProjectId: 'prep-project-001',
  procurementCode: 'EQ2024-001',
  category: 'KITCHEN',
  equipmentName: '商用燃气灶',
  specifications: {
    brand: '美的',
    model: 'MG-8008',
    power: '8.8KW',
    dimensions: '800×800×300mm',
    features: ['节能环保', '智能控制', '安全防护']
  },
  quantity: 2,
  unit: '台',
  unitPrice: new Decimal(3500),
  totalPrice: new Decimal(7000),
  supplierId: 'supplier-001',
  supplierName: '厨具设备供应商',
  supplierContact: '李经理',
  supplierPhone: '13700137777',
  purchaseDate: new Date('2024-03-10'),
  expectedDeliveryDate: new Date('2024-03-20'),
  actualDeliveryDate: new Date('2024-03-22'),
  installationDate: null,
  acceptanceDate: null,
  status: 'DELIVERED',
  warrantyPeriod: 24,
  warrantyStartDate: null,
  installationRequirements: '需要燃气接入和排烟系统',
  installationNotes: null,
  qualityInspection: null,
  documents: [
    'https://example.com/equipment-specs.pdf',
    'https://example.com/purchase-order.pdf'
  ],
  photos: [
    'https://example.com/equipment-photo1.jpg'
  ],
  notes: '按时到货，质量符合要求',
  tags: ['厨房', '燃气设备'],
  createdAt: new Date('2024-03-05'),
  updatedAt: new Date('2024-03-22'),
};

// ===============================
// 证照办理测试数据
// ===============================

export const mockLicenseApplication: LicenseApplication = {
  id: 'license-001',
  preparationProjectId: 'prep-project-001',
  applicationCode: 'LIC2024-001',
  licenseType: 'BUSINESS_LICENSE',
  licenseName: '营业执照',
  issuingAuthority: '浦东新区市场监督管理局',
  applicationDate: new Date('2024-03-01'),
  actualIssueDate: null,
  expiryDate: null,
  status: 'PROCESSING',
  applicationFee: new Decimal(0),
  serviceFee: new Decimal(500),
  agentId: 'agent-001',
  agentName: '代办公司A',
  agentContact: '王代办',
  agentPhone: '13600136666',
  requirements: [
    '法人身份证复印件',
    '房屋租赁合同',
    '股东会决议',
    '公司章程'
  ],
  submittedDocuments: [
    '法人身份证复印件',
    '房屋租赁合同'
  ],
  processingSteps: [
    {
      step: '材料提交',
      status: 'COMPLETED',
      completedDate: '2024-03-01',
      notes: '材料齐全'
    },
    {
      step: '材料审核',
      status: 'IN_PROGRESS',
      completedDate: null,
      notes: '审核中'
    },
    {
      step: '现场核查',
      status: 'PENDING',
      completedDate: null,
      notes: '待安排'
    }
  ],
  followUpRecords: [
    {
      date: '2024-03-08',
      content: '电话咨询审核进度，告知材料正在审核中',
      followUpPerson: 'user-test-005'
    }
  ],
  licenseNumber: null,
  certificateUrl: null,
  notes: '首次申请，按正常流程进行',
  createdAt: new Date('2024-02-28'),
  updatedAt: new Date('2024-03-08'),
};

// ===============================
// 人员招聘测试数据
// ===============================

export const mockStaffRecruitment: StaffRecruitment = {
  id: 'recruitment-001',
  preparationProjectId: 'prep-project-001',
  positionName: '店长',
  department: '门店运营部',
  recruitmentPlan: {
    plannedCount: 1,
    urgencyLevel: 'HIGH',
    salaryRange: { min: 12000, max: 18000 },
    benefits: ['五险一金', '餐补', '交通补贴'],
    workLocation: '上海市浦东新区陆家嘴环路1000号'
  },
  jobDescription: '负责门店日常运营管理、团队建设和员工培训、销售业绩管理、客户服务质量控制',
  qualificationRequirements: '餐饮行业5年以上管理经验，良好的沟通协调能力，熟悉门店运营流程，有团队管理经验',
  publishDate: new Date('2024-03-01'),
  applicationDeadline: new Date('2024-03-31'),
  expectedOnboardDate: new Date('2024-05-01'),
  status: 'INTERVIEWING',
  publishChannels: [
    {
      platform: '智联招聘',
      url: 'https://zhilian.com/job/123456',
      cost: 2000,
      publishDate: '2024-03-01'
    },
    {
      platform: '前程无忧',
      url: 'https://51job.com/job/789012',
      cost: 1800,
      publishDate: '2024-03-02'
    }
  ],
  applicationStats: {
    totalApplications: 25,
    qualifiedApplications: 12,
    interviewInvited: 8,
    interviewed: 5,
    offerSent: 2,
    accepted: 0,
    rejected: 18
  },
  interviews: [
    {
      candidateId: 'candidate-001',
      candidateName: '张三',
      phone: '13800138001',
      email: 'zhangsan@email.com',
      resumeUrl: 'https://example.com/resume1.pdf',
      interviewDate: '2024-03-15',
      interviewer: 'user-test-001',
      interviewType: 'FACE_TO_FACE',
      score: 85,
      evaluation: '经验丰富，沟通能力强',
      result: 'PASS',
      nextStep: 'OFFER'
    }
  ],
  offers: [
    {
      candidateId: 'candidate-001',
      candidateName: '张三',
      offerDate: '2024-03-18',
      salaryOffered: 15000,
      benefits: ['五险一金', '餐补500元', '交通补贴300元'],
      startDate: '2024-05-01',
      validUntil: '2024-03-25',
      status: 'PENDING',
      response: null,
      responseDate: null
    }
  ],
  hiredCandidates: [],
  notes: '重要岗位，需要有经验的管理人员',
  tags: ['管理岗位', '核心人员'],
  createdAt: new Date('2024-02-25'),
  updatedAt: new Date('2024-03-18'),
};

// ===============================
// 里程碑跟踪测试数据
// ===============================

export const mockMilestoneTracking: MilestoneTracking = {
  id: 'milestone-001',
  preparationProjectId: 'prep-project-001',
  milestoneName: '装修开工',
  milestoneType: 'CONSTRUCTION_START',
  description: '门店装修正式开工，标志着筹备工作进入施工阶段',
  plannedDate: new Date('2024-03-01'),
  actualDate: new Date('2024-03-02'),
  status: 'COMPLETED',
  importance: 'HIGH',
  dependencies: [
    'milestone-000'
  ],
  deliverables: [
    '施工许可证',
    '施工现场照片'
  ],
  criteriaChecklist: [
    {
      criteria: '施工许可证已获得',
      status: 'COMPLETED',
      completedDate: '2024-02-28',
      completedBy: 'user-test-001'
    },
    {
      criteria: '施工队伍已进场',
      status: 'COMPLETED',
      completedDate: '2024-03-02',
      completedBy: 'user-test-002'
    },
    {
      criteria: '安全防护措施已到位',
      status: 'COMPLETED',
      completedDate: '2024-03-02',
      completedBy: 'user-test-002'
    }
  ],
  riskFactors: [
    {
      risk: '天气因素影响',
      level: 'LOW',
      mitigation: '关注天气预报，合理安排施工计划',
      status: 'MONITORING'
    }
  ],
  impact: {
    scheduleImpact: 0,
    budgetImpact: 0,
    qualityImpact: 0,
    scopeImpact: 0,
    description: '按计划完成，无负面影响'
  },
  approvals: [
    {
      approver: 'user-test-001',
      approverName: '筹备经理',
      approvedDate: '2024-03-02',
      comments: '开工顺利，符合预期'
    }
  ],
  progressUpdates: [
    {
      date: '2024-03-02',
      progress: 100,
      description: '装修队伍已进场，正式开工',
      updatedBy: 'user-test-002'
    }
  ],
  attachments: [
    'https://example.com/milestone-report.pdf',
    'https://example.com/progress-photos.zip'
  ],
  notes: '开工顺利，工程队专业负责',
  tags: ['装修', '开工', '关键节点'],
  createdAt: new Date('2024-02-20'),
  updatedAt: new Date('2024-03-02'),
};

// ===============================
// 复杂关联数据
// ===============================

export const mockPreparationProjectWithRelations = {
  ...mockPreparationProject,
  region: mockRegion,
  storePlan: mockStorePlan,
  manager: mockUser,
  constructionProjects: [mockConstructionProject],
  equipmentProcurements: [mockEquipmentProcurement],
  licenseApplications: [mockLicenseApplication],
  staffRecruitments: [mockStaffRecruitment],
  milestoneTrackings: [mockMilestoneTracking],
  _count: {
    constructionProjects: 1,
    equipmentProcurements: 1,
    licenseApplications: 1,
    staffRecruitments: 1,
    milestoneTrackings: 1,
  },
};

// ===============================
// 统计数据
// ===============================

export const mockPreparationStatistics = {
  overview: {
    totalProjects: 12,
    planningCount: 2,
    inProgressCount: 6,
    completedCount: 3,
    pausedCount: 1,
    cancelledCount: 0,
    overdueCount: 2,
  },
  statusDistribution: {
    PLANNING: 2,
    IN_PROGRESS: 6,
    COMPLETED: 3,
    PAUSED: 1,
    CANCELLED: 0,
  },
  progressDistribution: {
    '0-25': 3,
    '26-50': 4,
    '51-75': 2,
    '76-99': 2,
    '100': 3,
  },
  regionDistribution: [
    {
          regionName: '上海市浦东新区',
      projectCount: 5,
      completedCount: 2,
      avgProgress: 65,
      totalBudget: 7500000,
      actualCost: 3200000,
    },
    {
      regionId: 'region-test-002',
      regionName: '上海市黄浦区',
      projectCount: 4,
      completedCount: 1,
      avgProgress: 45,
      totalBudget: 6000000,
      actualCost: 2100000,
    },
  ],
  timelineData: [
    {
      date: '2024-01',
      newProjects: 2,
      completedProjects: 1,
      totalActive: 8,
    },
    {
      date: '2024-02',
      newProjects: 3,
      completedProjects: 0,
      totalActive: 11,
    },
    {
      date: '2024-03',
      newProjects: 1,
      completedProjects: 2,
      totalActive: 10,
    },
  ],
  budgetAnalysis: {
    totalPlannedBudget: 18000000,
    totalActualCost: 8500000,
    budgetUtilization: 47.2,
    avgCostPerProject: 708333,
    overBudgetProjects: 1,
  },
  milestoneAnalysis: {
    totalMilestones: 48,
    completedMilestones: 28,
    overdueMilestones: 3,
    upcomingMilestones: 8,
    completionRate: 58.3,
  },
};

// ===============================
// 工具函数
// ===============================

/**
 * 创建测试筹备项目数据
 */
export const createTestPreparationProject = (overrides: Partial<PreparationProject> = {}): PreparationProject => {
  return {
    ...mockPreparationProject,
    ...overrides,
    id: `test-prep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
};

/**
 * 创建测试工程项目数据
 */
export const createTestConstructionProject = (overrides: Partial<ConstructionProject> = {}): ConstructionProject => {
  return {
    ...mockConstructionProject,
    ...overrides,
    id: `test-construction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
};

/**
 * 创建测试设备采购数据
 */
export const createTestEquipmentProcurement = (overrides: Partial<EquipmentProcurement> = {}): EquipmentProcurement => {
  return {
    ...mockEquipmentProcurement,
    ...overrides,
    id: `test-equipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  const projects: PreparationProject[] = [];
  const constructions: ConstructionProject[] = [];
  const equipments: EquipmentProcurement[] = [];
  const licenses: LicenseApplication[] = [];
  const recruitments: StaffRecruitment[] = [];
  const milestones: MilestoneTracking[] = [];
  
  const statuses: PreparationStatusType[] = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'];
  const priorities: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
  const storeTypes = ['FLAGSHIP', 'STANDARD', 'COMMUNITY', 'EXPRESS'];

  for (let i = 0; i < count; i++) {
    const projectId = `test-prep-project-${i + 1}`;
    
    projects.push({
      ...mockPreparationProject,
      id: projectId,
      projectCode: `TEST-PREP-${(i + 1).toString().padStart(3, '0')}`,
      storeName: `测试门店${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)] || 'PLANNING',
      priority: priorities[Math.floor(Math.random() * priorities.length)] || Priority.MEDIUM,
      storeType: storeTypes[Math.floor(Math.random() * storeTypes.length)],
      progress: Math.floor(Math.random() * 101),
      totalBudget: Math.floor(Math.random() * 2000000 + 500000),
      actualCost: Math.floor(Math.random() * 800000 + 100000),
      expectedOpenDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
    });

    // 生成相关联的子项目数据
    constructions.push({
      ...mockConstructionProject,
      id: `test-construction-${i + 1}`,
      preparationProjectId: projectId,
    });

    equipments.push({
      ...mockEquipmentProcurement,
      id: `test-equipment-${i + 1}`,
      preparationProjectId: projectId,
    });

    licenses.push({
      ...mockLicenseApplication,
      id: `test-license-${i + 1}`,
      preparationProjectId: projectId,
    });

    recruitments.push({
      ...mockStaffRecruitment,
      id: `test-recruitment-${i + 1}`,
      preparationProjectId: projectId,
    });

    milestones.push({
      ...mockMilestoneTracking,
      id: `test-milestone-${i + 1}`,
      preparationProjectId: projectId,
    });
  }

  return { projects, constructions, equipments, licenses, recruitments, milestones };
};

export default {
  mockRegion,
  mockStorePlan,
  mockUser,
  mockPreparationProject,
  mockPreparationProjectList,
  mockConstructionProject,
  mockEquipmentProcurement,
  mockLicenseApplication,
  mockStaffRecruitment,
  mockMilestoneTracking,
  mockPreparationProjectWithRelations,
  mockPreparationStatistics,
  createTestPreparationProject,
  createTestConstructionProject,
  createTestEquipmentProcurement,
  createPaginatedTestData,
  generateRandomTestData,
};