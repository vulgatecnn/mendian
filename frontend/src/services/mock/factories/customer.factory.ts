/**
 * 客户Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { 
  Customer, 
  CustomerContactInfo, 
  CustomerBusinessInfo,
  CustomerContract,
} from '../../types/business'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 客户分类
const CUSTOMER_CATEGORIES = [
  'franchisee', // 加盟商
  'partner', // 合作伙伴
  'supplier', // 供应商
  'other', // 其他
] as const

// 合同类型
const CONTRACT_TYPES = [
  'franchise', // 加盟合同
  'cooperation', // 合作合同
  'supply', // 供应合同
  'service', // 服务合同
  'other', // 其他
] as const

export function createMockCustomerContactInfo(): CustomerContactInfo {
  return {
    contact: faker.name.fullName(),
    phone: `1${faker.datatype.number({ min: 3000000000, max: 9999999999 })}`,
    email: faker.datatype.boolean(0.7) ? faker.internet.email() : undefined,
    wechat: faker.datatype.boolean(0.8) ? `wx_${faker.datatype.number({ min: 100000, max: 999999 })}` : undefined,
    address: faker.datatype.boolean(0.9) ? faker.address.streetAddress() + ', ' + faker.address.city() : undefined,
    idNumber: faker.datatype.boolean(0.5) 
      ? `${faker.datatype.number({ min: 100000, max: 999999 })}${faker.date.birthdate().getFullYear()}${faker.datatype.number({ min: 1000, max: 9999 })}`
      : undefined,
  }
}

export function createMockCustomerBusinessInfo(): CustomerBusinessInfo {
  return {
    companyName: faker.company.name() + '有限公司',
    businessLicense: `91${faker.datatype.number({ min: 1000000000000000, max: 9999999999999999 })}`,
    taxNumber: `91${faker.datatype.number({ min: 1000000000000000, max: 9999999999999999 })}`,
    legalPerson: faker.name.fullName(),
    registeredAddress: faker.address.streetAddress() + ', ' + faker.address.city() + ', ' + faker.address.state(),
    businessScope: faker.helpers.arrayElements([
      '餐饮服务', '食品销售', '商业零售', '企业管理', '商务咨询',
      '市场营销', '技术服务', '物业管理', '供应链管理', '品牌运营'
    ], { min: 2, max: 5 }),
  }
}

export function createMockCustomerContract(customerId: string): CustomerContract {
  const signDate = faker.date.past(3)
  const startDate = faker.date.soon(30, signDate)
  const endDate = faker.datatype.boolean(0.8) 
    ? faker.date.future(3, startDate) 
    : undefined
  
  return {
    id: faker.datatype.uuid(),
    name: faker.company.buzzPhrase() + '合同',
    type: faker.helpers.arrayElement(CONTRACT_TYPES),
    signDate: signDate.toISOString().split('T')[0],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate?.toISOString().split('T')[0],
    amount: faker.datatype.boolean(0.7) 
      ? faker.datatype.number({ min: 100000, max: 5000000 }) 
      : undefined,
    status: faker.helpers.weightedArrayElement([
      { weight: 60, value: 'active' as const },
      { weight: 20, value: 'draft' as const },
      { weight: 15, value: 'expired' as const },
      { weight: 5, value: 'terminated' as const },
    ]),
    fileUrl: faker.internet.url(),
  }
}

export function createMockCustomer(options: FactoryOptions = {}): Customer {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options

  faker.setLocale(locale!)

  const id = faker.datatype.uuid()
  const type = faker.helpers.weightedArrayElement([
    { weight: 30, value: 'individual' as const },
    { weight: 70, value: 'company' as const },
  ])
  const category = faker.helpers.arrayElement(CUSTOMER_CATEGORIES)

  let name: string
  if (type === 'individual') {
    name = faker.name.fullName()
  } else {
    // 根据分类生成相应的公司名称
    const suffixes = {
      franchisee: ['餐饮有限公司', '食品有限公司', '商贸有限公司'],
      partner: ['科技有限公司', '发展有限公司', '集团有限公司'],
      supplier: ['供应链有限公司', '贸易有限公司', '实业有限公司'],
      other: ['有限公司', '企业管理有限公司', '投资有限公司'],
    }
    const companySuffixes = suffixes[category]
    name = faker.company.name() + faker.helpers.arrayElement(companySuffixes)
  }

  const createdBy = faker.datatype.uuid()

  // 生成合同（0-3个）
  const contractCount = faker.datatype.number({ min: 0, max: 3 })
  const contracts: CustomerContract[] = []
  for (let i = 0; i < contractCount; i++) {
    contracts.push(createMockCustomerContract(id))
  }

  // 生成关联门店ID（对于加盟商）
  const storeCount = category === 'franchisee' 
    ? faker.datatype.number({ min: 1, max: 5 })
    : faker.datatype.number({ min: 0, max: 2 })
  const stores: string[] = []
  for (let i = 0; i < storeCount; i++) {
    stores.push(faker.datatype.uuid())
  }

  return {
    id,
    code: `CU${faker.datatype.number({ min: 100000, max: 999999 })}`,
    name,
    type,
    category,
    contactInfo: createMockCustomerContactInfo(),
    businessInfo: type === 'company' ? createMockCustomerBusinessInfo() : undefined,
    stores,
    contracts,
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: 'active' as const },
      { weight: 20, value: 'potential' as const },
      { weight: 10, value: 'inactive' as const },
    ]),
    tags: faker.helpers.arrayElements([
      '重要客户', '长期合作', '优质加盟商', '战略伙伴',
      '潜在客户', '新客户', '大客户', 'VIP客户'
    ], { min: 0, max: 3 }),
    notes: faker.datatype.boolean(0.4) ? faker.lorem.paragraph() : undefined,
    createdBy,
    createdByName: faker.name.fullName(),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockCustomers(options: FactoryOptions = {}): Customer[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options

  const customers: Customer[] = []

  // 创建一些知名加盟商
  const knownFranchisees = [
    { name: '张三餐饮管理有限公司', category: 'franchisee' as const },
    { name: '李四食品连锁有限公司', category: 'franchisee' as const },
    { name: '王五餐饮发展有限公司', category: 'franchisee' as const },
  ]

  knownFranchisees.forEach(template => {
    if (customers.length < count!) {
      const customer = createMockCustomer(options)
      customer.name = template.name
      customer.category = template.category
      customer.type = 'company'
      customer.status = 'active'
      customer.stores = [faker.datatype.uuid(), faker.datatype.uuid()] // 2个门店
      customer.tags = ['重要客户', '优质加盟商', '长期合作']
      
      // 添加加盟合同
      const franchiseContract: CustomerContract = {
        id: faker.datatype.uuid(),
        name: '加盟合作协议',
        type: 'franchise',
        signDate: faker.date.past(2).toISOString().split('T')[0],
        startDate: faker.date.past(2).toISOString().split('T')[0],
        endDate: faker.date.future(3).toISOString().split('T')[0],
        amount: faker.datatype.number({ min: 500000, max: 2000000 }),
        status: 'active',
        fileUrl: faker.internet.url(),
      }
      customer.contracts = [franchiseContract]
      
      customers.push(customer)
    }
  })

  // 创建一些合作伙伴
  const partners = [
    { name: '美团外卖', category: 'partner' as const },
    { name: '饿了么', category: 'partner' as const },
  ]

  partners.forEach(template => {
    if (customers.length < count!) {
      const customer = createMockCustomer(options)
      customer.name = template.name
      customer.category = template.category
      customer.type = 'company'
      customer.status = 'active'
      customer.tags = ['战略伙伴', '重要客户']
      customers.push(customer)
    }
  })

  // 生成其余客户
  const remainingCount = Math.max(0, count! - customers.length)
  for (let i = 0; i < remainingCount; i++) {
    customers.push(createMockCustomer(options))
  }

  return customers
}

// 根据分类获取客户
export function getCustomersByCategory(category: Customer['category'], options: FactoryOptions = {}): Customer[] {
  return createMockCustomers(options).filter(customer => customer.category === category)
}

// 获取加盟商
export function getFranchisees(options: FactoryOptions = {}): Customer[] {
  return getCustomersByCategory('franchisee', options)
}

// 获取合作伙伴
export function getPartners(options: FactoryOptions = {}): Customer[] {
  return getCustomersByCategory('partner', options)
}

// 获取活跃客户
export function getActiveCustomers(options: FactoryOptions = {}): Customer[] {
  return createMockCustomers(options).filter(customer => customer.status === 'active')
}

// 生成客户统计数据
export function generateCustomerStats(customers: Customer[]) {
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const potentialCustomers = customers.filter(c => c.status === 'potential').length
  
  const customersByCategory = CUSTOMER_CATEGORIES.map(category => ({
    category,
    count: customers.filter(c => c.category === category).length
  }))
  
  const customersByType = [
    { type: 'individual', count: customers.filter(c => c.type === 'individual').length },
    { type: 'company', count: customers.filter(c => c.type === 'company').length },
  ]
  
  const totalStores = customers.reduce((sum, customer) => sum + customer.stores.length, 0)
  const totalContracts = customers.reduce((sum, customer) => sum + customer.contracts.length, 0)
  const activeContracts = customers.reduce((sum, customer) => {
    return sum + customer.contracts.filter(contract => contract.status === 'active').length
  }, 0)
  
  return {
    totalCustomers,
    activeCustomers,
    potentialCustomers,
    customersByCategory,
    customersByType,
    totalStores,
    totalContracts,
    activeContracts,
  }
}