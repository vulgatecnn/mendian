/**
 * E2E测试数据辅助函数
 */

export const testUsers = {
  admin: {
    username: 'admin',
    password: 'admin123',
  },
  approver: {
    username: 'approver',
    password: 'approver123',
  },
  planner: {
    username: 'planner',
    password: 'planner123',
  },
};

export const testPlanData = {
  name: `测试开店计划-${Date.now()}`,
  plan_type: 'annual',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  description: '这是一个E2E测试创建的开店计划',
  regional_plans: [
    {
      region_id: 1,
      store_type_id: 1,
      target_count: 10,
      contribution_rate: 15.5,
      budget_amount: 1000000,
    },
  ],
};

export const testLocationData = {
  name: `测试候选位置-${Date.now()}`,
  address: '测试地址123号',
  area: 200,
  rent: 10000,
  status: 'evaluating',
};

export const testConstructionData = {
  name: `测试施工项目-${Date.now()}`,
  start_date: '2024-06-01',
  end_date: '2024-08-31',
  budget: 500000,
};

export const testStoreData = {
  name: `测试门店-${Date.now()}`,
  code: `STORE-${Date.now()}`,
  address: '测试门店地址456号',
  status: 'preparing',
};
