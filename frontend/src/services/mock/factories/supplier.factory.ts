/**
 * 供应商Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { 
  Supplier, 
  SupplierContactInfo, 
  SupplierBusinessInfo, 
  SupplierCooperationInfo,
  SupplierQualification,
  SupplierContract,
  SupplierEvaluation,
} from '../../types/business'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 供应商分类
const SUPPLIER_CATEGORIES = [
  'equipment', // 设备
  'decoration', // 装修
  'material', // 材料
  'service', // 服务
  'other', // 其他
] as const

// 供应商名称模板
const SUPPLIER_NAME_TEMPLATES = {
  equipment: ['科技有限公司', '设备有限公司', '机械有限公司', '电器有限公司'],
  decoration: ['装饰工程有限公司', '设计有限公司', '装修有限公司', '建筑装饰公司'],
  material: ['建材有限公司', '材料有限公司', '贸易有限公司', '供应链有限公司'],
  service: ['服务有限公司', '咨询有限公司', '管理有限公司', '技术服务公司'],
  other: ['有限公司', '贸易公司', '实业有限公司', '发展有限公司'],
}

// 常见的供应商资质
const QUALIFICATION_TYPES = [
  { type: 'business_license', name: '营业执照' },
  { type: 'tax_registration', name: '税务登记证' },
  { type: 'organization_code', name: '组织机构代码证' },
  { type: 'safety_production', name: '安全生产许可证' },
  { type: 'quality_certification', name: '质量认证证书' },
  { type: 'environmental', name: '环保资质证书' },
  { type: 'construction', name: '建筑资质证书' },
  { type: 'food_permit', name: '食品经营许可证' },
]

export function createMockSupplierContactInfo(): SupplierContactInfo {
  return {
    contact: faker.name.fullName(),
    phone: `${faker.datatype.number({ min: 20, max: 29 })}${faker.datatype.number({ min: 10000000, max: 99999999 })}`,
    mobile: `1${faker.datatype.number({ min: 3000000000, max: 9999999999 })}`,
    email: faker.internet.email(),
    wechat: faker.datatype.boolean(0.6) ? `wx_${faker.datatype.number({ min: 100000, max: 999999 })}` : undefined,
    address: faker.address.streetAddress() + ', ' + faker.address.city() + ', ' + faker.address.state(),
    website: faker.datatype.boolean(0.3) ? faker.internet.url() : undefined,
  }
}

export function createMockSupplierBusinessInfo(): SupplierBusinessInfo {
  const hasLicense = faker.datatype.boolean(0.8)
  
  return {
    businessLicense: hasLicense ? `91${faker.datatype.number({ min: 1000000000000000, max: 9999999999999999 })}` : undefined,
    taxNumber: hasLicense ? `91${faker.datatype.number({ min: 1000000000000000, max: 9999999999999999 })}` : undefined,
    legalPerson: hasLicense ? faker.name.fullName() : undefined,
    registeredCapital: hasLicense ? faker.datatype.number({ min: 100000, max: 50000000 }) : undefined,
    registrationDate: hasLicense ? faker.date.past(10).toISOString().split('T')[0] : undefined,
    businessScope: hasLicense ? faker.helpers.arrayElements([
      '建材销售', '装饰材料', '设备租赁', '工程施工', '技术服务',
      '商务咨询', '设计服务', '维修服务', '培训服务', '物流配送'
    ], { min: 2, max: 5 }) : undefined,
    bankAccount: hasLicense ? {
      bankName: faker.helpers.arrayElement(['工商银行', '建设银行', '农业银行', '中国银行', '招商银行']),
      accountNumber: faker.datatype.number({ min: 1000000000000000, max: 9999999999999999 }).toString(),
      accountName: faker.company.name(),
    } : undefined,
  }
}

export function createMockSupplierCooperationInfo(): SupplierCooperationInfo {
  return {
    cooperationStartDate: faker.datatype.boolean(0.7) 
      ? faker.date.past(3).toISOString().split('T')[0] 
      : undefined,
    paymentTerms: faker.helpers.arrayElement(['cash', 'monthly', 'quarterly', 'custom']),
    creditRating: faker.helpers.weightedArrayElement([
      { weight: 30, value: 'A' as const },
      { weight: 40, value: 'B' as const },
      { weight: 25, value: 'C' as const },
      { weight: 5, value: 'D' as const },
    ]),
    serviceRating: faker.helpers.arrayElement([1, 2, 3, 4, 5] as const),
  }
}

export function createMockSupplierQualification(supplierId: string): SupplierQualification {
  const qualType = faker.helpers.arrayElement(QUALIFICATION_TYPES)
  const issueDate = faker.date.past(5)
  const expiryDate = faker.datatype.boolean(0.7) 
    ? faker.date.future(3, issueDate) 
    : undefined
  
  return {
    id: faker.datatype.uuid(),
    type: qualType.type,
    name: qualType.name,
    number: faker.datatype.string({ length: 18, casing: 'upper', alpha: true, numeric: true }),
    issueDate: issueDate.toISOString().split('T')[0],
    expiryDate: expiryDate?.toISOString().split('T')[0],
    issuer: faker.helpers.arrayElement(['工商局', '税务局', '质监局', '安监局', '环保局', '建委']),
    fileUrl: faker.internet.url(),
    status: expiryDate && expiryDate < new Date() ? 'expired' : 
             faker.helpers.weightedArrayElement([
               { weight: 85, value: 'valid' as const },
               { weight: 10, value: 'pending' as const },
               { weight: 5, value: 'expired' as const },
             ])
  }
}

export function createMockSupplierContract(supplierId: string): SupplierContract {
  const signDate = faker.date.past(2)
  const startDate = faker.date.soon(30, signDate)
  const endDate = faker.date.future(2, startDate)
  
  return {
    id: faker.datatype.uuid(),
    name: faker.company.buzzPhrase() + '合同',
    type: faker.helpers.arrayElement(['采购合同', '服务合同', '框架合同', '维护合同']),
    signDate: signDate.toISOString().split('T')[0],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    amount: faker.datatype.number({ min: 50000, max: 2000000 }),
    status: faker.helpers.weightedArrayElement([
      { weight: 60, value: 'active' as const },
      { weight: 20, value: 'draft' as const },
      { weight: 15, value: 'expired' as const },
      { weight: 5, value: 'terminated' as const },
    ]),
    fileUrl: faker.internet.url(),
  }
}

export function createMockSupplierEvaluation(supplierId: string): SupplierEvaluation {
  const qualityScore = faker.datatype.number({ min: 60, max: 100 })
  const serviceScore = faker.datatype.number({ min: 60, max: 100 })
  const deliveryScore = faker.datatype.number({ min: 60, max: 100 })
  const priceScore = faker.datatype.number({ min: 60, max: 100 })
  
  return {
    id: faker.datatype.uuid(),
    evaluator: faker.datatype.uuid(),
    evaluatorName: faker.name.fullName(),
    period: `${faker.date.past(1).getFullYear()}年第${faker.datatype.number({ min: 1, max: 4 })}季度`,
    qualityScore,
    serviceScore,
    deliveryScore,
    priceScore,
    overallScore: Math.round((qualityScore + serviceScore + deliveryScore + priceScore) / 4),
    comments: faker.datatype.boolean(0.6) ? faker.lorem.sentences(2) : undefined,
    evaluatedAt: faker.date.recent(90).toISOString(),
  }
}

export function createMockSupplier(options: FactoryOptions = {}): Supplier {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options

  faker.setLocale(locale!)

  const id = faker.datatype.uuid()
  const category = faker.helpers.arrayElement(SUPPLIER_CATEGORIES)
  const type = faker.helpers.weightedArrayElement([
    { weight: 20, value: 'individual' as const },
    { weight: 80, value: 'company' as const },
  ])

  // 根据分类生成相应的公司名称
  const nameTemplates = SUPPLIER_NAME_TEMPLATES[category]
  const companyName = type === 'company' 
    ? faker.company.name() + faker.helpers.arrayElement(nameTemplates)
    : faker.name.fullName()

  const createdBy = faker.datatype.uuid()
  const updatedBy = faker.datatype.boolean(0.7) ? createdBy : faker.datatype.uuid()

  // 生成资质（1-4个）
  const qualificationCount = faker.datatype.number({ min: 1, max: 4 })
  const qualifications: SupplierQualification[] = []
  for (let i = 0; i < qualificationCount; i++) {
    qualifications.push(createMockSupplierQualification(id))
  }

  // 生成合同（0-3个）
  const contractCount = faker.datatype.number({ min: 0, max: 3 })
  const contracts: SupplierContract[] = []
  for (let i = 0; i < contractCount; i++) {
    contracts.push(createMockSupplierContract(id))
  }

  // 生成评价（0-2个）
  const evaluationCount = faker.datatype.number({ min: 0, max: 2 })
  const evaluations: SupplierEvaluation[] = []
  for (let i = 0; i < evaluationCount; i++) {
    evaluations.push(createMockSupplierEvaluation(id))
  }

  return {
    id,
    code: `SP${faker.datatype.number({ min: 100000, max: 999999 })}`,
    name: companyName,
    shortName: faker.datatype.boolean(0.4) 
      ? companyName.substring(0, Math.min(companyName.length, 10)) 
      : undefined,
    category,
    type,
    contactInfo: createMockSupplierContactInfo(),
    businessInfo: createMockSupplierBusinessInfo(),
    cooperationInfo: createMockSupplierCooperationInfo(),
    qualifications,
    contracts,
    evaluations,
    status: faker.helpers.weightedArrayElement([
      { weight: 80, value: 'active' as const },
      { weight: 15, value: 'inactive' as const },
      { weight: 5, value: 'blacklisted' as const },
    ]),
    tags: faker.helpers.arrayElements([
      '优质供应商', '战略合作', '长期合作', '价格优势', 
      '服务优良', '交付及时', '质量可靠', '新供应商'
    ], { min: 0, max: 3 }),
    notes: faker.datatype.boolean(0.3) ? faker.lorem.paragraph() : undefined,
    createdBy,
    createdByName: faker.name.fullName(),
    updatedBy,
    updatedByName: faker.name.fullName(),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockSuppliers(options: FactoryOptions = {}): Supplier[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options

  const suppliers: Supplier[] = []

  // 创建一些知名供应商
  const knownSuppliers = [
    { name: '万科装饰工程有限公司', category: 'decoration' as const },
    { name: '海尔厨房设备有限公司', category: 'equipment' as const },
    { name: '立邦涂料有限公司', category: 'material' as const },
    { name: '德勤咨询服务有限公司', category: 'service' as const },
  ]

  knownSuppliers.forEach(template => {
    if (suppliers.length < count!) {
      const supplier = createMockSupplier(options)
      supplier.name = template.name
      supplier.category = template.category
      supplier.status = 'active'
      supplier.cooperationInfo.creditRating = 'A'
      supplier.cooperationInfo.serviceRating = faker.helpers.arrayElement([4, 5])
      supplier.tags = ['优质供应商', '战略合作', '长期合作']
      suppliers.push(supplier)
    }
  })

  // 生成其余供应商
  const remainingCount = Math.max(0, count! - suppliers.length)
  for (let i = 0; i < remainingCount; i++) {
    suppliers.push(createMockSupplier(options))
  }

  return suppliers
}

// 根据分类获取供应商
export function getSuppliersByCategory(category: Supplier['category'], options: FactoryOptions = {}): Supplier[] {
  return createMockSuppliers(options).filter(supplier => supplier.category === category)
}

// 获取优质供应商
export function getQualitySuppliers(options: FactoryOptions = {}): Supplier[] {
  return createMockSuppliers(options).filter(supplier => 
    supplier.status === 'active' && 
    supplier.cooperationInfo.creditRating === 'A' &&
    supplier.cooperationInfo.serviceRating >= 4
  )
}

// 生成供应商统计数据
export function generateSupplierStats(suppliers: Supplier[]) {
  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length
  
  const suppliersByCategory = SUPPLIER_CATEGORIES.map(category => ({
    category,
    count: suppliers.filter(s => s.category === category).length
  }))
  
  const qualificationExpiring = suppliers.reduce((count, supplier) => {
    const expiringQuals = supplier.qualifications.filter(qual => {
      if (!qual.expiryDate) return false
      const expiryDate = new Date(qual.expiryDate)
      const now = new Date()
      const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      return expiryDate <= threeMonthsFromNow && expiryDate > now
    })
    return count + expiringQuals.length
  }, 0)
  
  const averageRating = suppliers.reduce((sum, supplier) => sum + supplier.cooperationInfo.serviceRating, 0) / totalSuppliers
  
  return {
    totalSuppliers,
    activeSuppliers,
    suppliersByCategory,
    qualificationExpiring,
    averageRating: Math.round(averageRating * 10) / 10,
  }
}