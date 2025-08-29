// 简化版Mock数据生成器 - 专注于基本功能
import { faker } from '@faker-js/faker'
import { MockUtils } from '../config'
import type { User, StorePlan, Region } from '../../types'

/**
 * 简化版Mock数据生成器
 */
export class SimpleMockDataGenerator {
  /**
   * 生成简单用户数据
   */
  static generateSimpleUser(): User {
    return {
      id: MockUtils.generateId(),
      username: faker.internet.username(),
      name: '测试用户',
      avatar: faker.image.avatarGitHub(),
      email: faker.internet.email(),
      phone: '13800138000',
      department: {
        id: MockUtils.generateId(),
        name: '商务部',
        code: 'BUS001',
        level: 2
      },
      roles: [
        {
          id: MockUtils.generateId(),
          code: 'business',
          name: '商务人员',
          permissions: []
        }
      ],
      permissions: ['store:plan:view', 'store:plan:create', 'store:plan:edit'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 生成简单区域数据
   */
  static generateSimpleRegion(): Region {
    return {
      id: MockUtils.generateId(),
      code: 'R001',
      name: '北京市',
      level: 2,
      parentId: undefined,
      enabled: true,
      sort: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 生成简单开店计划数据
   */
  static generateSimpleStorePlan(): StorePlan {
    return {
      id: MockUtils.generateId(),
      name: '北京万达店开店计划',
      description: '这是一个测试开店计划',
      type: 'direct',
      status: 'draft',
      priority: 'medium',
      region: this.generateSimpleRegion(),
      targetOpenDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      actualOpenDate: undefined,
      budget: 1000000,
      actualCost: undefined,
      progress: 0,
      milestones: [],
      attachments: [],
      approvalFlowId: undefined,
      approvalHistory: [],
      notes: '',
      tags: [],
      createdBy: this.generateSimpleUser(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 批量生成数据
   */
  static generateBatch<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator)
  }
}

/**
 * 简化版Mock数据存储
 */
export class SimpleMockDataStore {
  private static instance: SimpleMockDataStore
  private data: Map<string, any[]> = new Map()

  static getInstance(): SimpleMockDataStore {
    if (!this.instance) {
      this.instance = new SimpleMockDataStore()
      this.instance.initializeData()
    }
    return this.instance
  }

  private initializeData() {
    // 生成基础测试数据
    this.data.set(
      'users',
      SimpleMockDataGenerator.generateBatch(() => SimpleMockDataGenerator.generateSimpleUser(), 20)
    )
    this.data.set(
      'storePlans',
      SimpleMockDataGenerator.generateBatch(
        () => SimpleMockDataGenerator.generateSimpleStorePlan(),
        25
      )
    )
    this.data.set(
      'regions',
      SimpleMockDataGenerator.generateBatch(() => SimpleMockDataGenerator.generateSimpleRegion(), 50)
    )

    // 拓店管理数据
    this.data.set('candidateLocations', this.generateCandidateLocations(20))
    
    // 筹备管理数据
    this.data.set('preparationProjects', this.generatePreparationProjects(15))
    
    // 门店档案数据
    this.data.set('storeFiles', this.generateStoreFiles(30))
    
    // 审批中心数据
    this.data.set('approvalItems', this.generateApprovalItems(40))
    
    // 运营管理数据
    this.data.set('paymentItems', this.generatePaymentItems(35))
    this.data.set('assets', this.generateAssets(50))
    
    // 基础数据
    this.data.set('suppliers', this.generateSuppliers(25))
    this.data.set('customers', this.generateCustomers(30))
    this.data.set('organizations', this.generateOrganizations(15))
    this.data.set('businessRegions', this.generateBusinessRegions(8))
    
    console.log('✅ Mock数据初始化完成:', {
      users: this.getData('users').length,
      storePlans: this.getData('storePlans').length,
      candidateLocations: this.getData('candidateLocations').length,
      preparationProjects: this.getData('preparationProjects').length,
      storeFiles: this.getData('storeFiles').length,
      approvalItems: this.getData('approvalItems').length,
      paymentItems: this.getData('paymentItems').length,
      assets: this.getData('assets').length,
      suppliers: this.getData('suppliers').length
    })
  }

  getData(key: string): any[] {
    return this.data.get(key) || []
  }

  addData(key: string, item: any): void {
    const items = this.getData(key)
    items.push(item)
    this.data.set(key, items)
  }

  updateData(key: string, id: string, updates: any): any | null {
    const items = this.getData(key)
    const index = items.findIndex((item: any) => item.id === id)
    if (index === -1) return null

    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    items[index] = updatedItem
    return updatedItem
  }

  deleteData(key: string, id: string): boolean {
    const items = this.getData(key)
    const index = items.findIndex((item: any) => item.id === id)
    if (index === -1) return false

    items.splice(index, 1)
    return true
  }

  clearData(): void {
    this.data.clear()
    this.initializeData()
  }

  // 生成候选点位数据
  private generateCandidateLocations(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      name: `${faker.location.city()}${faker.helpers.arrayElement(['万达', '银泰', '购物中心', '商业街'])}商铺`,
      address: faker.location.streetAddress(),
      location: {
        province: faker.location.state(),
        city: faker.location.city(),
        district: faker.location.county(),
        address: faker.location.streetAddress(),
        coordinates: {
          lat: parseFloat(faker.location.latitude({ min: 22, max: 45 })),
          lng: parseFloat(faker.location.longitude({ min: 73, max: 135 }))
        }
      },
      area: Math.floor(Math.random() * 300) + 50,
      rentPrice: Math.floor(Math.random() * 30000) + 5000,
      propertyType: faker.helpers.arrayElement(['commercial', 'residential', 'mixed']),
      status: faker.helpers.arrayElement(['available', 'negotiating', 'reserved', 'signed', 'rejected']),
      discoveredBy: MockUtils.generateId(),
      discoveredByName: `发现人${index + 1}`,
      evaluation: {
        overallScore: Math.floor(Math.random() * 40) + 60,
        locationScore: Math.floor(Math.random() * 40) + 60,
        trafficScore: Math.floor(Math.random() * 40) + 60,
        competitionScore: Math.floor(Math.random() * 40) + 60,
        rentabilityScore: Math.floor(Math.random() * 40) + 60,
        evaluatedBy: MockUtils.generateId(),
        evaluatedByName: `评估人${index + 1}`,
        evaluatedAt: new Date().toISOString()
      },
      followUps: [],
      businessConditions: [],
      nearbyCompetitors: [],
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成筹备项目数据
  private generatePreparationProjects(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      name: `${faker.location.city()}店筹备项目`,
      storeId: MockUtils.generateId(),
      storeName: `好饭碗${faker.location.city()}店`,
      storeType: faker.helpers.arrayElement(['direct', 'franchise', 'joint_venture']),
      status: faker.helpers.arrayElement(['planning', 'construction', 'acceptance', 'delivered', 'delayed']),
      progress: Math.floor(Math.random() * 100),
      startDate: faker.date.past().toISOString(),
      expectedDeliveryDate: faker.date.future().toISOString(),
      actualDeliveryDate: null,
      budget: Math.floor(Math.random() * 500000) + 100000,
      actualCost: Math.floor(Math.random() * 400000) + 80000,
      milestones: [
        { name: '筹备启动', status: 'completed', completedAt: faker.date.past().toISOString(), order: 1 },
        { name: '施工许可', status: 'in_progress', completedAt: null, order: 2 },
        { name: '工程施工', status: 'pending', completedAt: null, order: 3 },
        { name: '验收确认', status: 'pending', completedAt: null, order: 4 },
        { name: '门店交付', status: 'pending', completedAt: null, order: 5 }
      ],
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成门店档案数据
  private generateStoreFiles(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      name: `好饭碗${faker.location.city()}店`,
      code: `STORE${String(index + 1).padStart(4, '0')}`,
      storeType: faker.helpers.arrayElement(['direct', 'franchise', 'joint_venture']),
      status: faker.helpers.arrayElement(['active', 'inactive', 'closed']),
      operatingStatus: faker.helpers.arrayElement(['normal', 'renovation', 'suspended', 'trial']),
      location: {
        region: faker.helpers.arrayElement(['华东区', '华南区', '华北区', '华中区', '西南区']),
        province: faker.location.state(),
        city: faker.location.city(),
        district: faker.location.county(),
        address: faker.location.streetAddress(),
        coordinates: {
          lat: parseFloat(faker.location.latitude({ min: 22, max: 45 })),
          lng: parseFloat(faker.location.longitude({ min: 73, max: 135 }))
        }
      },
      area: Math.floor(Math.random() * 300) + 80,
      seatingCapacity: Math.floor(Math.random() * 80) + 20,
      openingDate: faker.date.past().toISOString(),
      performance: {
        monthlyRevenue: Math.floor(Math.random() * 100000) + 50000,
        dailyAvgCustomers: Math.floor(Math.random() * 200) + 100,
        avgTransactionValue: Math.floor(Math.random() * 50) + 30,
        monthlyGrowthRate: ((Math.random() - 0.5) * 0.3).toFixed(2)
      },
      documents: {
        businessLicense: {
          number: `营业执照${faker.string.numeric(18)}`,
          validFrom: '2024-01-01',
          validTo: '2034-01-01',
          status: 'valid'
        },
        foodPermit: {
          number: `食品许可${faker.string.numeric(16)}`,
          validFrom: '2024-01-01',
          validTo: '2027-01-01',
          status: 'valid'
        }
      },
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成审批项目数据
  private generateApprovalItems(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      title: `${faker.helpers.arrayElement(['新店报备', '执照办理', '供应商比价', '预算审批'])} - ${faker.lorem.words(2)}`,
      code: `APPROVAL${String(index + 1).padStart(6, '0')}`,
      type: faker.helpers.arrayElement(['store_report', 'license_application', 'price_comparison', 'budget_approval']),
      status: faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'cancelled']),
      priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
      submittedAt: faker.date.past().toISOString(),
      submittedBy: MockUtils.generateId(),
      submittedByName: `申请人${index + 1}`,
      submittedByDepartment: faker.helpers.arrayElement(['运营部', '财务部', '商务部']),
      content: {
        description: faker.lorem.sentences(2),
        amount: Math.floor(Math.random() * 100000) + 10000
      },
      approvalFlow: [
        {
          id: MockUtils.generateId(),
          stepName: '部门经理审批',
          approver: MockUtils.generateId(),
          approverName: `经理${index + 1}`,
          status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
          order: 1,
          requiredApprovals: 1,
          actualApprovals: 0
        }
      ],
      attachments: [],
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成付款项数据
  private generatePaymentItems(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      code: `PAY${String(index + 1).padStart(6, '0')}`,
      title: `${faker.helpers.arrayElement(['店铺租金', '水电费', '物料采购', '维护费用'])} - ${faker.date.month()}月`,
      type: faker.helpers.arrayElement(['rent', 'utilities', 'supplies', 'maintenance']),
      status: faker.helpers.arrayElement(['pending', 'partial', 'completed', 'overdue']),
      storeId: MockUtils.generateId(),
      storeName: `好饭碗${faker.location.city()}店`,
      plannedAmount: Math.floor(Math.random() * 50000) + 5000,
      paidAmount: Math.floor(Math.random() * 30000),
      remainingAmount: Math.floor(Math.random() * 20000),
      dueDate: faker.date.future().toISOString().split('T')[0],
      description: faker.lorem.sentences(2),
      paymentRecords: [],
      createdBy: MockUtils.generateId(),
      createdByName: `创建人${index + 1}`,
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成资产数据
  private generateAssets(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      code: `ASSET${String(index + 1).padStart(5, '0')}`,
      name: faker.helpers.arrayElement(['商用冰箱', '炒菜灶具', '收银机', '餐桌椅', '监控设备']),
      category: faker.helpers.arrayElement(['equipment', 'furniture', 'electronics', 'fixtures']),
      status: faker.helpers.arrayElement(['normal', 'maintenance', 'repair', 'idle']),
      storeId: MockUtils.generateId(),
      storeName: `好饭碗${faker.location.city()}店`,
      originalValue: Math.floor(Math.random() * 100000) + 5000,
      currentValue: Math.floor(Math.random() * 80000) + 3000,
      purchaseDate: faker.date.past().toISOString().split('T')[0],
      supplier: faker.company.name(),
      warrantyPeriod: Math.floor(Math.random() * 36) + 12,
      maintenanceRecords: [],
      depreciationRecords: [],
      createdBy: MockUtils.generateId(),
      createdByName: `创建人${index + 1}`,
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成供应商数据
  private generateSuppliers(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      code: `SUP${String(index + 1).padStart(4, '0')}`,
      name: `${faker.company.name()}有限公司`,
      category: faker.helpers.arrayElement(['food', 'equipment', 'decoration', 'service']),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      contact: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress(),
      rating: Math.floor(Math.random() * 3) + 3,
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成客户数据
  private generateCustomers(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      code: `CUST${String(index + 1).padStart(4, '0')}`,
      name: faker.person.fullName(),
      type: faker.helpers.arrayElement(['individual', 'corporate', 'franchise']),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress(),
      totalOrders: Math.floor(Math.random() * 100),
      totalAmount: Math.floor(Math.random() * 500000),
      level: faker.helpers.arrayElement(['regular', 'vip', 'premium']),
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成组织架构数据
  private generateOrganizations(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      code: `ORG${String(index + 1).padStart(3, '0')}`,
      name: faker.helpers.arrayElement(['总裁办', '运营部', '财务部', '人力资源部', '商务部', '工程部', '法务部']),
      type: faker.helpers.arrayElement(['headquarters', 'branch', 'department']),
      parentId: index > 5 ? this.getData('organizations')[Math.floor(Math.random() * 5)]?.id : null,
      status: 'active',
      memberCount: Math.floor(Math.random() * 20) + 5,
      description: faker.lorem.sentence(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  // 生成业务区域数据  
  private generateBusinessRegions(count: number): any[] {
    const regionNames = ['华东区', '华南区', '华北区', '华中区', '西南区', '西北区', '东北区', '港澳台区']
    return Array.from({ length: count }, (_, index) => ({
      id: MockUtils.generateId(),
      code: `BR${String(index + 1).padStart(2, '0')}`,
      name: regionNames[index] || `区域${index + 1}`,
      status: 'active',
      manager: faker.person.fullName(),
      managerPhone: faker.phone.number(),
      description: faker.lorem.sentence(),
      storeCount: Math.floor(Math.random() * 20) + 5,
      createdAt: faker.date.past().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }
}
