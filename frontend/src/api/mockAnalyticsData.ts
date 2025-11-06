/**
 * 模拟数据分析数据
 */
import type { 
  DashboardOverviewData, 
  StoreMapData, 
  FunnelData, 
  PlanProgressData,
  DataFilters 
} from './analyticsService'

// 模拟门店地图数据
export const mockStoreMapData: StoreMapData = {
  stores: [
    {
      id: '1',
      name: '北京朝阳店',
      coordinates: [116.4074, 39.9042],
      status: 'opened',
      region: '华北区',
      storeType: '直营店',
      address: '北京市朝阳区建国路88号',
      openDate: '2024-01-15',
      progress: 100
    },
    {
      id: '2',
      name: '上海浦东店',
      coordinates: [121.4737, 31.2304],
      status: 'preparing',
      region: '华东区',
      storeType: '加盟店',
      address: '上海市浦东新区陆家嘴环路1000号',
      progress: 75
    },
    {
      id: '3',
      name: '广州天河店',
      coordinates: [113.2644, 23.1291],
      status: 'expanding',
      region: '华南区',
      storeType: '直营店',
      address: '广州市天河区天河路123号',
      progress: 45
    },
    {
      id: '4',
      name: '深圳南山店',
      coordinates: [113.9308, 22.5329],
      status: 'planned',
      region: '华南区',
      storeType: '合作店',
      address: '深圳市南山区科技园南区',
      progress: 20
    },
    {
      id: '5',
      name: '成都锦江店',
      coordinates: [104.0668, 30.5728],
      status: 'opened',
      region: '西南区',
      storeType: '加盟店',
      address: '成都市锦江区春熙路168号',
      openDate: '2024-02-20',
      progress: 100
    },
    {
      id: '6',
      name: '杭州西湖店',
      coordinates: [120.1551, 30.2741],
      status: 'preparing',
      region: '华东区',
      storeType: '直营店',
      address: '杭州市西湖区文三路259号',
      progress: 60
    }
  ],
  regions: [
    {
      regionId: '1',
      regionName: '华北区',
      totalStores: 1,
      statusCounts: { planned: 0, expanding: 0, preparing: 0, opened: 1 }
    },
    {
      regionId: '2',
      regionName: '华东区',
      totalStores: 2,
      statusCounts: { planned: 0, expanding: 0, preparing: 2, opened: 0 }
    },
    {
      regionId: '3',
      regionName: '华南区',
      totalStores: 2,
      statusCounts: { planned: 1, expanding: 1, preparing: 0, opened: 0 }
    },
    {
      regionId: '4',
      regionName: '西南区',
      totalStores: 1,
      statusCounts: { planned: 0, expanding: 0, preparing: 0, opened: 1 }
    }
  ],
  mapCenter: [113.2644, 35.8617], // 中国中心位置
  zoomLevel: 5,
  lastUpdated: new Date().toISOString()
}

// 模拟跟进漏斗数据
export const mockFunnelData: FunnelData = {
  stages: [
    {
      name: '调研',
      count: 150,
      percentage: 100,
      isWarning: false,
      details: { avgDuration: 7, successRate: 85 }
    },
    {
      name: '谈判',
      count: 120,
      percentage: 80,
      isWarning: false,
      details: { avgDuration: 14, successRate: 75 }
    },
    {
      name: '测算',
      count: 90,
      percentage: 60,
      isWarning: false,
      details: { avgDuration: 10, successRate: 70 }
    },
    {
      name: '报店',
      count: 63,
      percentage: 42,
      isWarning: true,
      details: { avgDuration: 21, successRate: 60 }
    },
    {
      name: '签约',
      count: 45,
      percentage: 30,
      isWarning: false,
      details: { avgDuration: 15, successRate: 85 }
    }
  ],
  conversionRates: [80, 75, 70, 71.4], // 各阶段转化率
  totalCount: 150,
  timeRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  lastUpdated: new Date().toISOString()
}

// 模拟计划进度数据
export const mockPlanProgressData: PlanProgressData = {
  plans: [
    {
      planId: 1,
      planName: '2024年华北区扩张计划',
      contributionType: 'high',
      targetCount: 50,
      completedCount: 42,
      progressRate: 84,
      status: 'on_track'
    },
    {
      planId: 2,
      planName: '2024年华东区发展计划',
      contributionType: 'high',
      targetCount: 80,
      completedCount: 55,
      progressRate: 68.75,
      status: 'at_risk'
    },
    {
      planId: 3,
      planName: '2024年华南区布局计划',
      contributionType: 'medium',
      targetCount: 60,
      completedCount: 35,
      progressRate: 58.33,
      status: 'delayed'
    },
    {
      planId: 4,
      planName: '2024年西南区试点计划',
      contributionType: 'strategic',
      targetCount: 20,
      completedCount: 18,
      progressRate: 90,
      status: 'on_track'
    },
    {
      planId: 5,
      planName: '2024年西北区开拓计划',
      contributionType: 'low',
      targetCount: 30,
      completedCount: 12,
      progressRate: 40,
      status: 'delayed'
    }
  ],
  summary: {
    totalTarget: 240,
    totalCompleted: 162,
    overallProgress: 67.5
  },
  byContributionType: [
    {
      type: 'high',
      typeName: '高贡献率',
      totalTarget: 130,
      totalCompleted: 97,
      progressRate: 74.6,
      planCount: 2
    },
    {
      type: 'medium',
      typeName: '中贡献率',
      totalTarget: 60,
      totalCompleted: 35,
      progressRate: 58.3,
      planCount: 1
    },
    {
      type: 'strategic',
      typeName: '战略性',
      totalTarget: 20,
      totalCompleted: 18,
      progressRate: 90,
      planCount: 1
    },
    {
      type: 'low',
      typeName: '低贡献率',
      totalTarget: 30,
      totalCompleted: 12,
      progressRate: 40,
      planCount: 1
    }
  ],
  lastUpdated: new Date().toISOString()
}

// 模拟完整的仪表板数据
export const mockDashboardOverviewData: DashboardOverviewData = {
  storeMap: mockStoreMapData,
  followUpFunnel: mockFunnelData,
  planProgress: mockPlanProgressData,
  lastUpdated: new Date().toISOString()
}

/**
 * 模拟API延迟
 */
export const simulateApiDelay = (ms: number = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 根据筛选条件过滤数据
 */
export const filterMockData = (data: DashboardOverviewData, filters: DataFilters): DashboardOverviewData => {
  let filteredData = { ...data }

  // 如果有区域筛选
  if (filters.regionIds && filters.regionIds.length > 0) {
    const regionNames = filters.regionIds.map(id => {
      const regionMap: Record<number, string> = {
        1: '华北区',
        2: '华东区',
        3: '华南区',
        4: '华中区',
        5: '西南区',
        6: '西北区'
      }
      return regionMap[id]
    }).filter(Boolean)

    // 过滤门店数据
    filteredData.storeMap = {
      ...filteredData.storeMap,
      stores: filteredData.storeMap.stores.filter(store => 
        regionNames.includes(store.region)
      ),
      regions: filteredData.storeMap.regions.filter(region => 
        regionNames.includes(region.regionName)
      )
    }
  }

  // 如果有门店类型筛选
  if (filters.storeTypes && filters.storeTypes.length > 0) {
    filteredData.storeMap = {
      ...filteredData.storeMap,
      stores: filteredData.storeMap.stores.filter(store => 
        filters.storeTypes!.includes(store.storeType)
      )
    }
  }

  // 如果有贡献率类型筛选
  if (filters.contributionTypes && filters.contributionTypes.length > 0) {
    filteredData.planProgress = {
      ...filteredData.planProgress,
      plans: filteredData.planProgress.plans.filter(plan => 
        filters.contributionTypes!.includes(plan.contributionType)
      ),
      byContributionType: filteredData.planProgress.byContributionType.filter(type => 
        filters.contributionTypes!.includes(type.type)
      )
    }

    // 重新计算汇总数据
    const filteredPlans = filteredData.planProgress.plans
    const totalTarget = filteredPlans.reduce((sum, plan) => sum + plan.targetCount, 0)
    const totalCompleted = filteredPlans.reduce((sum, plan) => sum + plan.completedCount, 0)
    
    filteredData.planProgress.summary = {
      totalTarget,
      totalCompleted,
      overallProgress: totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0
    }
  }

  return filteredData
}