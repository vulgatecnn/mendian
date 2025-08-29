/**
 * 开店计划Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { 
  StorePlan, 
  StorePlanMilestone,
  Region,
  Attachment,
  ApprovalHistory,
} from '../../types/business'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'
import { createMockRegion } from './region.factory'

// 开店计划类型
const STORE_TYPES = ['direct', 'franchise', 'joint_venture'] as const

// 开店计划状态
const STORE_PLAN_STATUSES = [
  'draft', 'pending', 'approved', 'in_progress', 'completed', 'cancelled'
] as const

// 优先级
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

// 里程碑类型
const MILESTONE_TYPES = [
  '选址确定', '合同签署', '设计确认', '装修开始', 
  '装修完成', '设备安装', '人员招聘', '试营业', '正式开业'
]

export function createMockAttachment(): Attachment {
  const fileTypes = [
    { ext: 'pdf', mimeType: 'application/pdf' },
    { ext: 'doc', mimeType: 'application/msword' },
    { ext: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { ext: 'jpg', mimeType: 'image/jpeg' },
    { ext: 'png', mimeType: 'image/png' },
  ]
  
  const fileType = faker.helpers.arrayElement(fileTypes)
  const fileName = faker.system.commonFileName(fileType.ext)
  
  return {
    id: faker.datatype.uuid(),
    name: fileName,
    originalName: fileName,
    url: faker.internet.url() + '/' + fileName,
    size: faker.datatype.number({ min: 1024, max: 10 * 1024 * 1024 }),
    mimeType: fileType.mimeType,
    category: faker.helpers.arrayElement(['document', 'image', 'contract', 'report']),
    uploadedBy: faker.datatype.uuid(),
    uploadedByName: faker.name.fullName(),
    uploadedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockApprovalHistory(): ApprovalHistory {
  return {
    id: faker.datatype.uuid(),
    nodeId: faker.datatype.uuid(),
    nodeName: faker.helpers.arrayElement(['初审', '复审', '终审', '总裁审批']),
    approver: faker.datatype.uuid(),
    approverName: faker.name.fullName(),
    action: faker.helpers.arrayElement(['approve', 'reject', 'transfer', 'comment']),
    comment: faker.datatype.boolean(0.7) ? faker.lorem.sentences(2) : undefined,
    processedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockStorePlanMilestone(storePlanId: string): StorePlanMilestone {
  const targetDate = faker.date.future(1)
  const actualDate = faker.datatype.boolean(0.4) ? faker.date.recent(30, targetDate) : undefined
  
  let status: StorePlanMilestone['status']
  if (actualDate && actualDate <= new Date()) {
    status = 'completed'
  } else if (targetDate < new Date()) {
    status = faker.helpers.arrayElement(['delayed', 'in_progress'])
  } else {
    status = faker.helpers.arrayElement(['pending', 'in_progress'])
  }

  return {
    id: faker.datatype.uuid(),
    name: faker.helpers.arrayElement(MILESTONE_TYPES),
    description: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : undefined,
    targetDate: targetDate.toISOString().split('T')[0],
    actualDate: actualDate?.toISOString().split('T')[0],
    status,
    responsible: faker.datatype.uuid(),
    responsibleName: faker.name.fullName(),
  }
}

export function createMockStorePlan(options: FactoryOptions = {}): StorePlan {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options

  faker.setLocale(locale!)

  const id = faker.datatype.uuid()
  const createdBy = faker.datatype.uuid()
  const updatedBy = faker.datatype.boolean(0.7) ? createdBy : faker.datatype.uuid()
  
  const type = faker.helpers.arrayElement(STORE_TYPES)
  const status = faker.helpers.arrayElement(STORE_PLAN_STATUSES)
  const priority = faker.helpers.weightedArrayElement([
    { weight: 40, value: 'medium' as const },
    { weight: 30, value: 'high' as const },
    { weight: 20, value: 'low' as const },
    { weight: 10, value: 'urgent' as const },
  ])

  // 生成店铺名称
  const storeName = generateStoreName(type)
  
  // 生成区域信息
  const region = createMockRegion({ level: 2 }) // 城市级别

  // 生成目标开业日期和实际开业日期
  const targetOpenDate = faker.date.future(1)
  const actualOpenDate = status === 'completed' 
    ? faker.date.recent(30, targetOpenDate)
    : faker.datatype.boolean(0.2) ? faker.date.recent(60) : undefined

  // 生成预算和实际成本
  const budget = faker.datatype.number({ min: 500000, max: 3000000 })
  const actualCost = status === 'completed' || status === 'in_progress'
    ? faker.datatype.number({ min: budget * 0.8, max: budget * 1.3 })
    : undefined

  // 生成进度
  const progress = generateProgress(status)

  // 生成里程碑
  const milestoneCount = faker.datatype.number({ min: 3, max: 6 })
  const milestones: StorePlanMilestone[] = []
  for (let i = 0; i < milestoneCount; i++) {
    milestones.push(createMockStorePlanMilestone(id))
  }

  // 生成附件
  const attachmentCount = faker.datatype.number({ min: 0, max: 5 })
  const attachments: Attachment[] = []
  for (let i = 0; i < attachmentCount; i++) {
    attachments.push(createMockAttachment())
  }

  // 生成审批历史
  const approvalHistoryCount = faker.datatype.number({ min: 0, max: 3 })
  const approvalHistory: ApprovalHistory[] = []
  for (let i = 0; i < approvalHistoryCount; i++) {
    approvalHistory.push(createMockApprovalHistory())
  }

  return {
    id,
    name: storeName,
    description: faker.datatype.boolean(0.7) ? faker.lorem.paragraph() : undefined,
    type,
    status,
    priority,
    region,
    targetOpenDate: targetOpenDate.toISOString().split('T')[0],
    actualOpenDate: actualOpenDate?.toISOString().split('T')[0],
    budget,
    actualCost,
    progress,
    milestones,
    attachments,
    approvalFlowId: faker.datatype.boolean(0.3) ? faker.datatype.uuid() : undefined,
    approvalHistory,
    createdBy,
    createdByName: faker.name.fullName(),
    updatedBy,
    updatedByName: faker.name.fullName(),
    createdAt: faker.date.past(1).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockStorePlans(options: FactoryOptions = {}): StorePlan[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options

  const storePlans: StorePlan[] = []

  // 创建一些典型的开店计划
  const typicalPlans = [
    { 
      name: '北京朝阳门店开店计划', 
      type: 'direct' as const, 
      status: 'in_progress' as const,
      priority: 'high' as const,
    },
    { 
      name: '上海徐家汇加盟店开店计划', 
      type: 'franchise' as const, 
      status: 'approved' as const,
      priority: 'medium' as const,
    },
    { 
      name: '广州天河合资店开店计划', 
      type: 'joint_venture' as const, 
      status: 'pending' as const,
      priority: 'high' as const,
    },
    { 
      name: '深圳南山直营店开店计划', 
      type: 'direct' as const, 
      status: 'completed' as const,
      priority: 'medium' as const,
    },
  ]

  typicalPlans.forEach(template => {
    if (storePlans.length < count!) {
      const plan = createMockStorePlan(options)
      plan.name = template.name
      plan.type = template.type
      plan.status = template.status
      plan.priority = template.priority
      
      // 根据状态调整数据
      if (template.status === 'completed') {
        plan.progress = 100
        plan.actualOpenDate = faker.date.past(0.5).toISOString().split('T')[0]
        plan.actualCost = faker.datatype.number({ 
          min: plan.budget * 0.9, 
          max: plan.budget * 1.1 
        })
      } else if (template.status === 'in_progress') {
        plan.progress = faker.datatype.number({ min: 30, max: 80 })
      }
      
      storePlans.push(plan)
    }
  })

  // 生成其余开店计划
  const remainingCount = Math.max(0, count! - storePlans.length)
  for (let i = 0; i < remainingCount; i++) {
    storePlans.push(createMockStorePlan(options))
  }

  return storePlans
}

// 根据类型生成店铺名称
function generateStoreName(type: StorePlan['type']): string {
  const cityNames = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆']
  const districtNames = ['中心', '万达', '银泰', '正大', '新天地', 'CBD', '老城', '新区', '商圈']
  
  const city = faker.helpers.arrayElement(cityNames)
  const district = faker.helpers.arrayElement(districtNames)
  
  const typeNames = {
    direct: '直营店',
    franchise: '加盟店', 
    joint_venture: '合资店'
  }
  
  return `${city}${district}好饭碗${typeNames[type]}开店计划`
}

// 根据状态生成进度
function generateProgress(status: StorePlan['status']): number {
  switch (status) {
    case 'draft':
      return 0
    case 'pending':
      return faker.datatype.number({ min: 5, max: 15 })
    case 'approved':
      return faker.datatype.number({ min: 15, max: 30 })
    case 'in_progress':
      return faker.datatype.number({ min: 30, max: 95 })
    case 'completed':
      return 100
    case 'cancelled':
      return faker.datatype.number({ min: 0, max: 50 })
    default:
      return 0
  }
}

// 根据状态获取开店计划
export function getStorePlansByStatus(status: StorePlan['status'], options: FactoryOptions = {}): StorePlan[] {
  return createMockStorePlans(options).filter(plan => plan.status === status)
}

// 根据类型获取开店计划
export function getStorePlansByType(type: StorePlan['type'], options: FactoryOptions = {}): StorePlan[] {
  return createMockStorePlans(options).filter(plan => plan.type === type)
}

// 获取进行中的开店计划
export function getActiveStorePlans(options: FactoryOptions = {}): StorePlan[] {
  return createMockStorePlans(options).filter(plan => 
    ['approved', 'in_progress'].includes(plan.status)
  )
}

// 获取延期的开店计划
export function getDelayedStorePlans(options: FactoryOptions = {}): StorePlan[] {
  const now = new Date()
  return createMockStorePlans(options).filter(plan => {
    const targetDate = new Date(plan.targetOpenDate)
    return targetDate < now && plan.status !== 'completed' && plan.status !== 'cancelled'
  })
}

// 生成开店计划统计数据
export function generateStorePlanStats(storePlans: StorePlan[]) {
  const totalPlans = storePlans.length
  const completedPlans = storePlans.filter(p => p.status === 'completed').length
  const inProgressPlans = storePlans.filter(p => p.status === 'in_progress').length
  const delayedPlans = getDelayedStorePlans({ count: storePlans.length }).length

  const plansByType = STORE_TYPES.map(type => ({
    type,
    count: storePlans.filter(p => p.type === type).length
  }))

  const plansByStatus = STORE_PLAN_STATUSES.map(status => ({
    status,
    count: storePlans.filter(p => p.status === status).length
  }))

  const totalBudget = storePlans.reduce((sum, plan) => sum + plan.budget, 0)
  const totalActualCost = storePlans.reduce((sum, plan) => sum + (plan.actualCost || 0), 0)
  
  const averageProgress = storePlans.reduce((sum, plan) => sum + plan.progress, 0) / totalPlans

  return {
    totalPlans,
    completedPlans,
    inProgressPlans,
    delayedPlans,
    plansByType,
    plansByStatus,
    totalBudget,
    totalActualCost,
    averageProgress: Math.round(averageProgress * 10) / 10,
    completionRate: Math.round((completedPlans / totalPlans) * 100 * 10) / 10,
  }
}