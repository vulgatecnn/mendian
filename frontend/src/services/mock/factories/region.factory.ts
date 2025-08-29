/**
 * 行政区域Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { Region } from '../../types/business'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 预设的省份数据
const PROVINCES = [
  { id: '110000', name: '北京市', code: '110000' },
  { id: '120000', name: '天津市', code: '120000' },
  { id: '130000', name: '河北省', code: '130000' },
  { id: '140000', name: '山西省', code: '140000' },
  { id: '310000', name: '上海市', code: '310000' },
  { id: '320000', name: '江苏省', code: '320000' },
  { id: '330000', name: '浙江省', code: '330000' },
  { id: '340000', name: '安徽省', code: '340000' },
  { id: '440000', name: '广东省', code: '440000' },
  { id: '450000', name: '广西壮族自治区', code: '450000' },
  { id: '510000', name: '四川省', code: '510000' },
  { id: '500000', name: '重庆市', code: '500000' },
]

// 预设的城市数据
const CITIES: Record<string, Array<{ name: string; code: string }>> = {
  '110000': [
    { name: '北京市', code: '110100' },
  ],
  '120000': [
    { name: '天津市', code: '120100' },
  ],
  '320000': [
    { name: '南京市', code: '320100' },
    { name: '无锡市', code: '320200' },
    { name: '徐州市', code: '320300' },
    { name: '常州市', code: '320400' },
    { name: '苏州市', code: '320500' },
  ],
  '330000': [
    { name: '杭州市', code: '330100' },
    { name: '宁波市', code: '330200' },
    { name: '温州市', code: '330300' },
    { name: '嘉兴市', code: '330400' },
  ],
  '440000': [
    { name: '广州市', code: '440100' },
    { name: '深圳市', code: '440300' },
    { name: '珠海市', code: '440400' },
    { name: '汕头市', code: '440500' },
    { name: '佛山市', code: '440600' },
    { name: '韶关市', code: '440200' },
  ],
  '510000': [
    { name: '成都市', code: '510100' },
    { name: '自贡市', code: '510300' },
    { name: '攀枝花市', code: '510400' },
    { name: '泸州市', code: '510500' },
  ],
}

// 预设的区县数据
const DISTRICTS: Record<string, Array<{ name: string; code: string }>> = {
  '320100': [
    { name: '玄武区', code: '320102' },
    { name: '秦淮区', code: '320104' },
    { name: '建邺区', code: '320105' },
    { name: '鼓楼区', code: '320106' },
  ],
  '440100': [
    { name: '荔湾区', code: '440103' },
    { name: '越秀区', code: '440104' },
    { name: '海珠区', code: '440105' },
    { name: '天河区', code: '440106' },
  ],
  '440300': [
    { name: '罗湖区', code: '440303' },
    { name: '福田区', code: '440304' },
    { name: '南山区', code: '440305' },
    { name: '宝安区', code: '440306' },
  ],
}

export function createMockRegion(
  options: FactoryOptions & { level?: number; parentId?: string } = {}
): Region {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale, level = 1, parentId } = options

  faker.setLocale(locale!)

  const baseId = faker.datatype.uuid()

  let name: string
  let code: string

  // 根据层级生成对应的名称和编码
  switch (level) {
    case 1: // 省份
      const province = faker.helpers.arrayElement(PROVINCES)
      name = province.name
      code = province.code
      break
    case 2: // 城市
      if (parentId && CITIES[parentId]) {
        const city = faker.helpers.arrayElement(CITIES[parentId])
        name = city.name
        code = city.code
      } else {
        name = faker.address.city() + '市'
        code = faker.datatype.number({ min: 100000, max: 999999 }).toString()
      }
      break
    case 3: // 区县
      if (parentId && DISTRICTS[parentId]) {
        const district = faker.helpers.arrayElement(DISTRICTS[parentId])
        name = district.name
        code = district.code
      } else {
        const suffixes = ['区', '县', '市']
        name = faker.address.cityName() + faker.helpers.arrayElement(suffixes)
        code = faker.datatype.number({ min: 100000, max: 999999 }).toString()
      }
      break
    case 4: // 街道
      const streetSuffixes = ['街道', '镇', '乡']
      name = faker.address.streetName() + faker.helpers.arrayElement(streetSuffixes)
      code = faker.datatype.number({ min: 100000, max: 999999 }).toString()
      break
    default:
      name = faker.address.city()
      code = faker.datatype.number({ min: 100000, max: 999999 }).toString()
  }

  return {
    id: baseId,
    code,
    name,
    level,
    parentId,
    enabled: faker.datatype.boolean(0.9), // 90%的概率是启用状态
    sort: faker.datatype.number({ min: 1, max: 100 }),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockRegions(options: FactoryOptions = {}): Region[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options

  const regions: Region[] = []
  
  // 生成省份
  const provinces = PROVINCES.slice(0, Math.min(count, PROVINCES.length)).map(province => 
    createMockRegion({ ...options, level: 1 })
  )
  regions.push(...provinces)

  // 为每个省份生成城市
  provinces.forEach(province => {
    const cityCount = faker.datatype.number({ min: 2, max: 6 })
    for (let i = 0; i < cityCount; i++) {
      const city = createMockRegion({ 
        ...options, 
        level: 2, 
        parentId: province.id 
      })
      regions.push(city)

      // 为部分城市生成区县
      if (faker.datatype.boolean(0.3)) { // 30%的概率生成区县
        const districtCount = faker.datatype.number({ min: 2, max: 5 })
        for (let j = 0; j < districtCount; j++) {
          const district = createMockRegion({ 
            ...options, 
            level: 3, 
            parentId: city.id 
          })
          regions.push(district)
        }
      }
    }
  })

  return regions
}

// 构建层次结构
export function buildRegionTree(regions: Region[]): Region[] {
  const regionMap = new Map<string, Region>()
  
  // 创建映射并初始化children数组
  regions.forEach(region => {
    regionMap.set(region.id, { ...region, children: [] })
  })

  const rootRegions: Region[] = []

  // 构建层次结构
  regions.forEach(region => {
    const regionWithChildren = regionMap.get(region.id)!
    
    if (region.parentId) {
      const parent = regionMap.get(region.parentId)
      if (parent) {
        parent.children!.push(regionWithChildren)
      }
    } else {
      rootRegions.push(regionWithChildren)
    }
  })

  return rootRegions
}

// 获取指定省份的城市
export function getCitiesForProvince(provinceId: string, options: FactoryOptions = {}): Region[] {
  const cities = CITIES[provinceId] || []
  return cities.map(city => createMockRegion({
    ...options,
    level: 2,
    parentId: provinceId
  }))
}

// 获取指定城市的区县
export function getDistrictsForCity(cityCode: string, options: FactoryOptions = {}): Region[] {
  const districts = DISTRICTS[cityCode] || []
  return districts.map(district => createMockRegion({
    ...options,
    level: 3,
    parentId: cityCode
  }))
}