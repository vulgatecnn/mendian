/**
 * 开店计划测试数据固件
 * 提供各种状态和场景的测试数据
 */

export const mockUsers = {
  admin: {
    id: 'user-admin-001',
    username: 'admin',
    name: '系统管理员',
    roles: ['admin'],
    permissions: ['store-plan:create', 'store-plan:update', 'store-plan:delete', 'store-plan:approve'],
  },
  planner: {
    id: 'user-planner-001',
    username: 'planner',
    name: '计划员',
    roles: ['planner'],
    permissions: ['store-plan:create', 'store-plan:update', 'store-plan:view'],
  },
  approver: {
    id: 'user-approver-001',
    username: 'approver',
    name: '审批员',
    roles: ['approver'],
    permissions: ['store-plan:approve', 'store-plan:view'],
  },
};

export const storePlanFixtures = {
  // 草稿状态计划
  draft: {
    planName: '2024年第一季度开店计划',
    planType: 'QUARTERLY',
    targetRegion: '华东区域',
    plannedStoreCount: 5,
    plannedInvestment: 500000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    status: 'DRAFT',
    description: '第一季度华东区域开店计划，重点布局上海、杭州等核心城市',
    targetMarkets: ['上海市', '杭州市', '苏州市'],
    budgetBreakdown: {
      rent: 200000,
      decoration: 150000,
      equipment: 100000,
      marketing: 50000,
    },
    milestones: [
      {
        name: '选址完成',
        targetDate: '2024-01-15',
        responsible: '拓店团队',
      },
      {
        name: '装修完成',
        targetDate: '2024-02-28',
        responsible: '工程团队',
      },
    ],
  },

  // 已提交状态计划
  submitted: {
    planName: '2024年第二季度开店计划',
    planType: 'QUARTERLY',
    targetRegion: '华南区域',
    plannedStoreCount: 3,
    plannedInvestment: 300000,
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-30'),
    status: 'SUBMITTED',
    description: '第二季度华南区域开店计划',
    targetMarkets: ['深圳市', '广州市', '东莞市'],
    budgetBreakdown: {
      rent: 120000,
      decoration: 90000,
      equipment: 60000,
      marketing: 30000,
    },
    submittedAt: new Date('2024-01-10'),
    submittedBy: 'user-planner-001',
  },

  // 已审批状态计划
  approved: {
    planName: '2024年第三季度开店计划',
    planType: 'QUARTERLY',
    targetRegion: '华北区域',
    plannedStoreCount: 4,
    plannedInvestment: 400000,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    status: 'APPROVED',
    description: '第三季度华北区域开店计划',
    targetMarkets: ['北京市', '天津市', '石家庄市'],
    budgetBreakdown: {
      rent: 160000,
      decoration: 120000,
      equipment: 80000,
      marketing: 40000,
    },
    submittedAt: new Date('2024-01-05'),
    submittedBy: 'user-planner-001',
    approvedAt: new Date('2024-01-12'),
    approvedBy: 'user-approver-001',
    approver: '审批员',
    approvalComments: '计划合理，同意执行',
  },

  // 进行中状态计划
  inProgress: {
    planName: '2024年第四季度开店计划',
    planType: 'QUARTERLY',
    targetRegion: '西南区域',
    plannedStoreCount: 6,
    plannedInvestment: 600000,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    status: 'IN_PROGRESS',
    description: '第四季度西南区域开店计划',
    targetMarkets: ['成都市', '重庆市', '昆明市'],
    budgetBreakdown: {
      rent: 240000,
      decoration: 180000,
      equipment: 120000,
      marketing: 60000,
    },
    submittedAt: new Date('2024-01-08'),
    submittedBy: 'user-planner-001',
    approvedAt: new Date('2024-01-15'),
    approvedBy: 'user-approver-001',
    approver: '审批员',
    approvalComments: '优先执行',
    startedAt: new Date('2024-01-16'),
    actualProgress: 25,
  },

  // 已完成状态计划
  completed: {
    planName: '2023年年度开店计划',
    planType: 'ANNUAL',
    targetRegion: '全国',
    plannedStoreCount: 20,
    plannedInvestment: 2000000,
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    status: 'COMPLETED',
    description: '2023年全国开店计划',
    targetMarkets: ['一线城市', '新一线城市', '重点二线城市'],
    budgetBreakdown: {
      rent: 800000,
      decoration: 600000,
      equipment: 400000,
      marketing: 200000,
    },
    submittedAt: new Date('2022-12-01'),
    submittedBy: 'user-planner-001',
    approvedAt: new Date('2022-12-05'),
    approvedBy: 'user-approver-001',
    approver: '审批员',
    approvalComments: '年度计划审批通过',
    startedAt: new Date('2023-01-01'),
    completedAt: new Date('2023-12-31'),
    actualStoreCount: 18,
    actualInvestment: 1800000,
    actualProgress: 100,
    completionRate: 90,
  },

  // 被拒绝状态计划
  rejected: {
    planName: '2024年紧急开店计划',
    planType: 'QUARTERLY',
    targetRegion: '东北区域',
    plannedStoreCount: 2,
    plannedInvestment: 200000,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-04-30'),
    status: 'REJECTED',
    description: '紧急开店计划',
    targetMarkets: ['沈阳市', '大连市'],
    budgetBreakdown: {
      rent: 80000,
      decoration: 60000,
      equipment: 40000,
      marketing: 20000,
    },
    submittedAt: new Date('2024-01-20'),
    submittedBy: 'user-planner-001',
    rejectedAt: new Date('2024-01-22'),
    rejectedBy: 'user-approver-001',
    approver: '审批员',
    rejectionReason: '当前市场条件不适合，建议延后执行',
  },
};

export const createStorePlanData = {
  valid: {
    planName: '测试开店计划',
    planType: 'QUARTERLY',
    targetRegion: '测试区域',
    plannedStoreCount: 3,
    plannedInvestment: 300000,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    description: '这是一个测试用的开店计划',
    targetMarkets: ['测试城市A', '测试城市B'],
    budgetBreakdown: {
      rent: 120000,
      decoration: 90000,
      equipment: 60000,
      marketing: 30000,
    },
  },
  invalid: {
    empty: {},
    missingRequired: {
      planName: '缺少必需字段的计划',
      // 缺少 planType, targetRegion 等必需字段
    },
    invalidDates: {
      planName: '日期无效的计划',
      planType: 'QUARTERLY',
      targetRegion: '测试区域',
      plannedStoreCount: 3,
      plannedInvestment: 300000,
      startDate: new Date('2024-08-31'),  // 开始日期晚于结束日期
      endDate: new Date('2024-06-01'),
      description: '日期配置错误的计划',
    },
    negativeBudget: {
      planName: '预算为负的计划',
      planType: 'QUARTERLY',
      targetRegion: '测试区域',
      plannedStoreCount: 3,
      plannedInvestment: -100000,  // 负数预算
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      description: '预算为负数的无效计划',
    },
  },
};

export const updateStorePlanData = {
  valid: {
    planName: '更新后的开店计划',
    description: '这是更新后的计划描述',
    plannedStoreCount: 5,
    plannedInvestment: 500000,
    targetMarkets: ['更新城市A', '更新城市B', '更新城市C'],
  },
  partial: {
    description: '仅更新描述',
  },
};

export const batchOperationData = {
  validDelete: {
    action: 'DELETE',
    ids: ['plan-001', 'plan-002', 'plan-003'],
  },
  validUpdateStatus: {
    action: 'UPDATE_STATUS',
    ids: ['plan-001', 'plan-002'],
    data: {
      status: 'SUBMITTED',
    },
  },
  invalid: {
    emptyIds: {
      action: 'DELETE',
      ids: [],
    },
    invalidAction: {
      action: 'INVALID_ACTION',
      ids: ['plan-001'],
    },
  },
};

export const queryParameters = {
  pagination: {
    page: 1,
    limit: 10,
  },
  filters: {
    status: 'DRAFT',
    planType: 'QUARTERLY',
    targetRegion: '华东区域',
  },
  sorting: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  combined: {
    page: 2,
    limit: 5,
    status: 'APPROVED',
    planType: 'ANNUAL',
    sortBy: 'plannedInvestment',
    sortOrder: 'asc',
  },
};

export const exportData = {
  valid: {
    format: 'EXCEL',
    filters: {
      status: 'APPROVED',
    },
    columns: ['planName', 'targetRegion', 'plannedStoreCount', 'plannedInvestment', 'status'],
  },
  allData: {
    format: 'EXCEL',
    filters: {},
    columns: ['planName', 'targetRegion', 'plannedStoreCount', 'plannedInvestment', 'status', 'createdAt'],
  },
};

// 辅助函数：创建测试数据库记录
export const createTestStorePlan = (fixture: any, overrides: any = {}) => ({
  id: `test-plan-${Date.now()}`,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: mockUsers.planner.id,
  ...fixture,
  ...overrides,
});

// 辅助函数：生成多个测试计划
export const generateMultipleStorePlans = (count: number, baseFixture: any = storePlanFixtures.draft) => {
  return Array.from({ length: count }, (_, index) => 
    createTestStorePlan(baseFixture, {
      planName: `${baseFixture.planName} - ${index + 1}`,
      id: `test-plan-${index + 1}`,
    })
  );
};