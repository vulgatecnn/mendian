/**
 * 业务大区Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { 
  BusinessRegion, 
  City,
  BusinessRegionStats,
} from '../../types/business'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 预设的业务大区数据
const BUSINESS_REGIONS_DATA = [
  {
    id: 'br_001',
    name: '华北大区',
    code: 'NORTH',
    description: '覆盖华北地区的业务大区，包括北京、天津、河北等地',
    cities: [
      { name: '北京市', code: '110000', provinceId: '110000', provinceName: '北京市' },
      { name: '天津市', code: '120000', provinceId: '120000', provinceName: '天津市' },
      { name: '石家庄市', code: '130100', provinceId: '130000', provinceName: '河北省' },
      { name: '保定市', code: '130600', provinceId: '130000', provinceName: '河北省' },
      { name: '太原市', code: '140100', provinceId: '140000', provinceName: '山西省' },
    ],
  },
  {
    id: 'br_002',
    name: '华东大区',
    code: 'EAST',
    description: '覆盖华东地区的业务大区，包括上海、江苏、浙江、安徽等地',
    cities: [
      { name: '上海市', code: '310000', provinceId: '310000', provinceName: '上海市' },
      { name: '南京市', code: '320100', provinceId: '320000', provinceName: '江苏省' },
      { name: '苏州市', code: '320500', provinceId: '320000', provinceName: '江苏省' },
      { name: '杭州市', code: '330100', provinceId: '330000', provinceName: '浙江省' },
      { name: '宁波市', code: '330200', provinceId: '330000', provinceName: '浙江省' },
      { name: '合肥市', code: '340100', provinceId: '340000', provinceName: '安徽省' },
    ],
  },
  {
    id: 'br_003',
    name: '华南大区',
    code: 'SOUTH',
    description: '覆盖华南地区的业务大区，包括广东、广西等地',
    cities: [
      { name: '广州市', code: '440100', provinceId: '440000', provinceName: '广东省' },
      { name: '深圳市', code: '440300', provinceId: '440000', provinceName: '广东省' },
      { name: '珠海市', code: '440400', provinceId: '440000', provinceName: '广东省' },
      { name: '佛山市', code: '440600', provinceId: '440000', provinceName: '广东省' },
      { name: '南宁市', code: '450100', provinceId: '450000', provinceName: '广西壮族自治区' },
    ],
  },
  {
    id: 'br_004',
    name: '华中大区',
    code: 'CENTRAL',
    description: '覆盖华中地区的业务大区，包括湖北、湖南、河南等地',
    cities: [
      { name: '武汉市', code: '420100', provinceId: '420000', provinceName: '湖北省' },
      { name: '长沙市', code: '430100', provinceId: '430000', provinceName: '湖南省' },
      { name: '郑州市', code: '410100', provinceId: '410000', provinceName: '河南省' },
    ],
  },
  {
    id: 'br_005',
    name: '西南大区',
    code: 'SOUTHWEST',
    description: '覆盖西南地区的业务大区，包括四川、重庆、云南等地',
    cities: [
      { name: '成都市', code: '510100', provinceId: '510000', provinceName: '四川省' },
      { name: '重庆市', code: '500000', provinceId: '500000', provinceName: '重庆市' },
      { name: '昆明市', code: '530100', provinceId: '530000', provinceName: '云南省' },
    ],
  },
]

// 生成经理信息
function generateManager() {
  return {
    id: faker.datatype.uuid(),
    name: faker.name.fullName(),
  }
}

export function createMockCity(data?: Partial<City>): City {
  return {
    id: data?.id || faker.datatype.uuid(),
    name: data?.name || faker.address.city() + '市',
    code: data?.code || faker.datatype.number({ min: 100000, max: 999999 }).toString(),
    provinceId: data?.provinceId || faker.datatype.uuid(),
    provinceName: data?.provinceName || faker.address.state() + '省',
    businessRegionId: data?.businessRegionId,
    businessRegionName: data?.businessRegionName,
    storeCount: data?.storeCount || faker.datatype.number({ min: 0, max: 50 }),
    enabled: data?.enabled !== undefined ? data.enabled : faker.datatype.boolean(0.9),
    sort: data?.sort || faker.datatype.number({ min: 1, max: 100 }),
  }
}

export function createMockBusinessRegion(options: FactoryOptions = {}): BusinessRegion {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options

  faker.setLocale(locale!)

  const id = faker.datatype.uuid()
  const createdBy = faker.datatype.uuid()
  const updatedBy = faker.datatype.boolean(0.7) ? createdBy : faker.datatype.uuid()
  
  // 生成城市列表（3-8个城市）
  const cityCount = faker.datatype.number({ min: 3, max: 8 })
  const cities: City[] = []
  for (let i = 0; i < cityCount; i++) {
    const city = createMockCity({
      businessRegionId: id,
      businessRegionName: faker.company.name() + '大区',
    })
    cities.push(city)
  }

  const storeCount = cities.reduce((sum, city) => sum + city.storeCount, 0)

  return {
    id,
    name: faker.company.name() + '大区',
    code: faker.helpers.slugify(faker.company.name()).toUpperCase(),
    description: faker.lorem.sentences(2),
    managerId: faker.datatype.uuid(),
    managerName: faker.name.fullName(),
    cities,
    cityCount: cities.length,
    storeCount,
    status: faker.helpers.weightedArrayElement([
      { weight: 90, value: 'active' as const },
      { weight: 10, value: 'inactive' as const },
    ]),
    createdBy,
    createdByName: faker.name.fullName(),
    updatedBy,
    updatedByName: faker.name.fullName(),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockBusinessRegions(options: FactoryOptions = {}): BusinessRegion[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options

  const regions: BusinessRegion[] = []

  // 首先创建预设的业务大区
  BUSINESS_REGIONS_DATA.forEach(data => {
    if (regions.length < count!) {
      const manager = generateManager()
      const cities = data.cities.map(cityData => createMockCity({
        id: faker.datatype.uuid(),
        name: cityData.name,
        code: cityData.code,
        provinceId: cityData.provinceId,
        provinceName: cityData.provinceName,
        businessRegionId: data.id,
        businessRegionName: data.name,
        storeCount: faker.datatype.number({ min: 5, max: 30 }),
        enabled: true,
        sort: faker.datatype.number({ min: 1, max: 100 }),
      }))

      const storeCount = cities.reduce((sum, city) => sum + city.storeCount, 0)

      const region: BusinessRegion = {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        managerId: manager.id,
        managerName: manager.name,
        cities,
        cityCount: cities.length,
        storeCount,
        status: 'active',
        createdBy: 'system',
        createdByName: '系统',
        updatedBy: 'system',
        updatedByName: '系统',
        createdAt: faker.date.past(1).toISOString(),
        updatedAt: faker.date.recent(30).toISOString(),
      }

      regions.push(region)
    }
  })

  // 生成其余大区
  const remainingCount = Math.max(0, count! - regions.length)
  for (let i = 0; i < remainingCount; i++) {
    regions.push(createMockBusinessRegion(options))
  }

  return regions
}

// 根据状态获取业务大区
export function getBusinessRegionsByStatus(status: BusinessRegion['status'], options: FactoryOptions = {}): BusinessRegion[] {
  return createMockBusinessRegions(options).filter(region => region.status === status)
}

// 获取活跃的业务大区
export function getActiveBusinessRegions(options: FactoryOptions = {}): BusinessRegion[] {
  return getBusinessRegionsByStatus('active', options)
}

// 根据经理ID获取业务大区
export function getBusinessRegionsByManager(managerId: string, options: FactoryOptions = {}): BusinessRegion[] {
  return createMockBusinessRegions(options).filter(region => region.managerId === managerId)
}

// 获取指定大区的城市列表
export function getCitiesInRegion(regionId: string, options: FactoryOptions = {}): City[] {
  const regions = createMockBusinessRegions(options)
  const region = regions.find(r => r.id === regionId)
  return region ? region.cities : []
}

// 生成业务大区统计数据
export function generateBusinessRegionStats(regions: BusinessRegion[]): BusinessRegionStats {
  const totalRegions = regions.length
  const activeRegions = regions.filter(r => r.status === 'active').length
  const totalCities = regions.reduce((sum, region) => sum + region.cityCount, 0)
  const totalStores = regions.reduce((sum, region) => sum + region.storeCount, 0)

  const regionPerformance = regions.map(region => ({
    regionId: region.id,
    regionName: region.name,
    storeCount: region.storeCount,
    revenue: faker.datatype.number({ min: 1000000, max: 10000000 }), // 模拟营收
    growth: faker.datatype.number({ min: -10, max: 50, precision: 0.1 }), // 模拟增长率
  }))

  return {
    totalRegions,
    activeRegions,
    totalCities,
    totalStores,
    regionPerformance,
  }
}

// 搜索业务大区
export function searchBusinessRegions(keyword: string, options: FactoryOptions = {}): BusinessRegion[] {
  const regions = createMockBusinessRegions(options)
  return regions.filter(region => 
    region.name.includes(keyword) || 
    region.code.toLowerCase().includes(keyword.toLowerCase()) ||
    region.managerName.includes(keyword)
  )
}

// 获取大区的城市分布统计
export function getRegionCityDistribution(regionId: string, options: FactoryOptions = {}): Array<{
  provinceName: string
  cityCount: number
  storeCount: number
}> {
  const regions = createMockBusinessRegions(options)
  const region = regions.find(r => r.id === regionId)
  
  if (!region) return []

  const distribution = new Map<string, { cityCount: number, storeCount: number }>()
  
  region.cities.forEach(city => {
    const existing = distribution.get(city.provinceName) || { cityCount: 0, storeCount: 0 }
    distribution.set(city.provinceName, {
      cityCount: existing.cityCount + 1,
      storeCount: existing.storeCount + city.storeCount,
    })
  })

  return Array.from(distribution.entries()).map(([provinceName, data]) => ({
    provinceName,
    cityCount: data.cityCount,
    storeCount: data.storeCount,
  }))
}