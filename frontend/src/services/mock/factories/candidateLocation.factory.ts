/**
 * 候选点位Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { 
  CandidateLocation, 
  CompetitorInfo, 
  TrafficInfo, 
  DemographicsInfo, 
  LocationEvaluation,
  BusinessCondition,
  FollowUpRecord,
} from '../../types/business'
import type { GeoLocation } from '../../types/api'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

const PROPERTY_TYPES = ['commercial', 'residential', 'mixed'] as const
const LOCATION_STATUSES = ['available', 'negotiating', 'reserved', 'signed', 'rejected'] as const

export function createMockGeoLocation(): GeoLocation {
  return {
    latitude: faker.address.latitude(39.9, 40.1, 6), // 北京地区
    longitude: faker.address.longitude(116.3, 116.5, 6),
  }
}

export function createMockCompetitorInfo(): CompetitorInfo {
  const brands = ['麦当劳', '肯德基', '星巴克', '海底捞', '西贝', '外婆家', '呷哺呷哺', '真功夫']
  
  return {
    name: faker.helpers.arrayElement(brands) + faker.address.streetName() + '店',
    brand: faker.helpers.arrayElement(brands),
    distance: faker.datatype.number({ min: 50, max: 2000 }),
    businessType: faker.helpers.arrayElement(['快餐', '正餐', '饮品', '火锅', '小吃']),
    estimatedRevenue: faker.datatype.boolean(0.6) ? faker.datatype.number({ min: 500000, max: 3000000 }) : undefined,
  }
}

export function createMockTrafficInfo(): TrafficInfo {
  return {
    dailyFootTraffic: faker.datatype.number({ min: 1000, max: 50000 }),
    peakHours: faker.helpers.arrayElements(['09:00-10:00', '12:00-13:00', '18:00-20:00', '21:00-22:00'], { min: 2, max: 4 }),
    publicTransport: faker.helpers.arrayElements(['地铁1号线', '公交15路', '公交28路', '地铁2号线', '公交快线'], { min: 1, max: 3 }),
    accessibility: faker.helpers.weightedArrayElement([
      { weight: 20, value: 'excellent' as const },
      { weight: 40, value: 'good' as const },
      { weight: 30, value: 'average' as const },
      { weight: 10, value: 'poor' as const },
    ]),
  }
}

export function createMockDemographicsInfo(): DemographicsInfo {
  return {
    populationDensity: faker.datatype.number({ min: 5000, max: 20000 }),
    averageIncome: faker.datatype.number({ min: 8000, max: 25000 }),
    ageGroups: {
      '18-25': faker.datatype.number({ min: 15, max: 30 }),
      '26-35': faker.datatype.number({ min: 25, max: 40 }),
      '36-45': faker.datatype.number({ min: 20, max: 35 }),
      '46-60': faker.datatype.number({ min: 10, max: 25 }),
      '60+': faker.datatype.number({ min: 5, max: 15 }),
    },
    consumptionLevel: faker.helpers.weightedArrayElement([
      { weight: 30, value: 'high' as const },
      { weight: 50, value: 'medium' as const },
      { weight: 20, value: 'low' as const },
    ]),
  }
}

export function createMockLocationEvaluation(candidateLocationId: string): LocationEvaluation {
  const locationScore = faker.datatype.number({ min: 6, max: 10 })
  const trafficScore = faker.datatype.number({ min: 6, max: 10 })
  const competitionScore = faker.datatype.number({ min: 5, max: 9 })
  const rentabilityScore = faker.datatype.number({ min: 5, max: 9 })
  const overallScore = Math.round((locationScore + trafficScore + competitionScore + rentabilityScore) / 4 * 10) / 10

  return {
    overallScore,
    locationScore,
    trafficScore,
    competitionScore,
    rentabilityScore,
    notes: faker.datatype.boolean(0.7) ? faker.lorem.sentences(2) : undefined,
    evaluatedBy: faker.datatype.uuid(),
    evaluatedByName: faker.name.fullName(),
    evaluatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockFollowUpRecord(candidateLocationId: string): FollowUpRecord {
  return {
    id: faker.datatype.uuid(),
    candidateLocationId,
    type: faker.helpers.arrayElement(['call', 'visit', 'meeting', 'negotiation', 'other']),
    content: faker.lorem.sentences(3),
    nextAction: faker.datatype.boolean(0.7) ? faker.lorem.sentence() : undefined,
    nextActionDate: faker.datatype.boolean(0.7) ? faker.date.future(0.1).toISOString().split('T')[0] : undefined,
    responsible: faker.datatype.uuid(),
    responsibleName: faker.name.fullName(),
    createdAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockBusinessCondition(candidateLocationId: string): BusinessCondition {
  return {
    id: faker.datatype.uuid(),
    candidateLocationId,
    type: faker.helpers.arrayElement(['rent', 'transfer', 'decoration', 'other']),
    description: faker.lorem.sentence(),
    amount: faker.datatype.number({ min: 50000, max: 500000 }),
    negotiable: faker.datatype.boolean(0.6),
    status: faker.helpers.arrayElement(['proposed', 'negotiating', 'agreed', 'rejected']),
    notes: faker.datatype.boolean(0.4) ? faker.lorem.sentence() : undefined,
    createdAt: faker.date.recent(60).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockCandidateLocation(options: FactoryOptions = {}): CandidateLocation {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options
  faker.setLocale(locale!)

  const id = faker.datatype.uuid()
  
  // 生成地址和位置信息
  const address = faker.address.streetAddress() + ', ' + faker.address.city()
  const location = createMockGeoLocation()
  
  // 生成基础信息
  const area = faker.datatype.number({ min: 80, max: 500 })
  const rentPrice = faker.datatype.number({ min: 8000, max: 30000 })
  const transferFee = faker.datatype.boolean(0.6) ? faker.datatype.number({ min: 50000, max: 300000 }) : undefined
  const deposit = faker.datatype.number({ min: rentPrice * 2, max: rentPrice * 6 })
  const floorLevel = faker.datatype.number({ min: 1, max: 10 })
  
  // 生成竞争对手信息
  const competitorCount = faker.datatype.number({ min: 2, max: 8 })
  const nearbyCompetitors: CompetitorInfo[] = []
  for (let i = 0; i < competitorCount; i++) {
    nearbyCompetitors.push(createMockCompetitorInfo())
  }
  
  // 生成照片和视频
  const photoCount = faker.datatype.number({ min: 3, max: 10 })
  const photos: string[] = []
  for (let i = 0; i < photoCount; i++) {
    photos.push(faker.image.business(800, 600, true))
  }
  
  const videoCount = faker.datatype.number({ min: 0, max: 3 })
  const videos: string[] = []
  for (let i = 0; i < videoCount; i++) {
    videos.push(faker.internet.url() + '/video' + (i + 1) + '.mp4')
  }
  
  // 生成跟进记录
  const followUpCount = faker.datatype.number({ min: 1, max: 5 })
  const followUps: FollowUpRecord[] = []
  for (let i = 0; i < followUpCount; i++) {
    followUps.push(createMockFollowUpRecord(id))
  }
  
  // 生成商务条件
  const businessConditionCount = faker.datatype.number({ min: 2, max: 6 })
  const businessConditions: BusinessCondition[] = []
  for (let i = 0; i < businessConditionCount; i++) {
    businessConditions.push(createMockBusinessCondition(id))
  }

  return {
    id,
    name: faker.company.name() + '商铺',
    address,
    location,
    area,
    rentPrice,
    transferFee,
    deposit,
    propertyType: faker.helpers.arrayElement(PROPERTY_TYPES),
    floorLevel,
    hasElevator: faker.datatype.boolean(floorLevel > 3 ? 0.8 : 0.3),
    parkingSpaces: faker.datatype.boolean(0.4) ? faker.datatype.number({ min: 10, max: 100 }) : undefined,
    nearbyCompetitors,
    traffic: createMockTrafficInfo(),
    demographics: createMockDemographicsInfo(),
    photos,
    videos,
    status: faker.helpers.weightedArrayElement([
      { weight: 30, value: 'available' as const },
      { weight: 25, value: 'negotiating' as const },
      { weight: 20, value: 'reserved' as const },
      { weight: 15, value: 'signed' as const },
      { weight: 10, value: 'rejected' as const },
    ]),
    followUps,
    businessConditions,
    evaluation: createMockLocationEvaluation(id),
    discoveredBy: faker.datatype.uuid(),
    discoveredByName: faker.name.fullName(),
    createdAt: faker.date.past(0.5).toISOString(),
    updatedAt: faker.date.recent(7).toISOString(),
  }
}

export function createMockCandidateLocations(options: FactoryOptions = {}): CandidateLocation[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options
  
  const locations: CandidateLocation[] = []
  
  for (let i = 0; i < count!; i++) {
    locations.push(createMockCandidateLocation(options))
  }
  
  return locations
}

// 根据状态获取候选点位
export function getCandidateLocationsByStatus(status: CandidateLocation['status'], options: FactoryOptions = {}): CandidateLocation[] {
  return createMockCandidateLocations(options).filter(location => location.status === status)
}

// 获取可用的候选点位
export function getAvailableLocations(options: FactoryOptions = {}): CandidateLocation[] {
  return getCandidateLocationsByStatus('available', options)
}

// 获取正在谈判的候选点位
export function getNegotiatingLocations(options: FactoryOptions = {}): CandidateLocation[] {
  return getCandidateLocationsByStatus('negotiating', options)
}

// 根据评分获取优质点位
export function getHighQualityLocations(options: FactoryOptions = {}): CandidateLocation[] {
  return createMockCandidateLocations(options).filter(location => location.evaluation.overallScore >= 8)
}