/**
 * 付款项工厂函数
 */
import { faker } from '@faker-js/faker'

interface PaymentItem {
  id: string
  code: string
  title: string
  type: 'rent' | 'utilities' | 'supplies' | 'maintenance' | 'insurance' | 'tax' | 'other'
  status: 'pending' | 'partial' | 'completed' | 'overdue'
  storeId: string
  storeName: string
  plannedAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string
  paymentMethod?: string
  description: string
  paymentRecords: Array<{
    id: string
    amount: number
    paymentMethod: string
    paymentDate: string
    remark: string
    receipt: string | null
    operator: string
    operatorName: string
  }>
  vendor?: {
    name: string
    contact: string
    phone: string
    bankAccount?: string
  }
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

interface Asset {
  id: string
  code: string
  name: string
  category: 'equipment' | 'furniture' | 'electronics' | 'fixtures' | 'vehicles' | 'other'
  status: 'normal' | 'maintenance' | 'repair' | 'idle' | 'scrapped'
  storeId: string
  storeName: string
  originalValue: number
  currentValue: number
  purchaseDate: string
  supplier: string
  warrantyPeriod: number
  warrantyExpiry: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  location: string
  responsible: string
  responsibleName: string
  maintenanceRecords: Array<{
    id: string
    type: 'preventive' | 'corrective' | 'emergency' | 'upgrade'
    description: string
    cost: number
    maintainer: string
    maintenanceDate: string
    nextMaintenanceDate?: string
    createdBy: string
    createdByName: string
    createdAt: string
  }>
  depreciationRecords: Array<{
    id: string
    period: string
    depreciationAmount: number
    remainingValue: number
    createdAt: string
  }>
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

const paymentTypes = ['rent', 'utilities', 'supplies', 'maintenance', 'insurance', 'tax', 'other']
const paymentStatuses = ['pending', 'partial', 'completed', 'overdue']
const paymentMethods = ['bank_transfer', 'cash', 'check', 'online_payment', 'other']

const assetCategories = ['equipment', 'furniture', 'electronics', 'fixtures', 'vehicles', 'other']
const assetStatuses = ['normal', 'maintenance', 'repair', 'idle', 'scrapped']
const maintenanceTypes = ['preventive', 'corrective', 'emergency', 'upgrade']

export function createMockPaymentItems(config: { count: number }): PaymentItem[] {
  return Array.from({ length: config.count }, (_, index) => {
    const type = faker.helpers.arrayElement(paymentTypes)
    const status = faker.helpers.arrayElement(paymentStatuses)
    const plannedAmount = Math.floor(Math.random() * 50000) + 5000
    const paidAmount = status === 'completed' ? plannedAmount :
                      status === 'partial' ? Math.floor(plannedAmount * (0.3 + Math.random() * 0.6)) :
                      0
    const remainingAmount = plannedAmount - paidAmount

    const dueDate = faker.date.between({ 
      from: new Date('2024-08-01'), 
      to: new Date('2024-12-31') 
    })
    const isOverdue = status === 'overdue' || (status === 'pending' && dueDate < new Date())

    const paymentRecords = status !== 'pending' ? Array.from({ 
      length: status === 'partial' ? faker.number.int({ min: 1, max: 2 }) :
              status === 'completed' ? faker.number.int({ min: 1, max: 3 }) : 0 
    }, () => ({
      id: faker.string.uuid(),
      amount: Math.floor(paidAmount / (status === 'completed' ? faker.number.int({ min: 1, max: 3 }) : 1)),
      paymentMethod: faker.helpers.arrayElement(paymentMethods),
      paymentDate: faker.date.between({ 
        from: new Date('2024-06-01'), 
        to: new Date() 
      }).toISOString(),
      remark: faker.lorem.sentence(),
      receipt: Math.random() > 0.3 ? faker.internet.url() : null,
      operator: faker.string.uuid(),
      operatorName: faker.person.fullName()
    })) : []

    return {
      id: faker.string.uuid(),
      code: `PAY${String(index + 1).padStart(6, '0')}`,
      title: `${type === 'rent' ? '店铺租金' :
              type === 'utilities' ? '水电费' :
              type === 'supplies' ? '物料采购' :
              type === 'maintenance' ? '维护费用' :
              type === 'insurance' ? '保险费' :
              type === 'tax' ? '税费' : '其他费用'} - ${faker.date.month()}月`,
      type,
      status: isOverdue ? 'overdue' : status,
      storeId: faker.string.uuid(),
      storeName: `好饭碗${faker.location.city()}店`,
      plannedAmount,
      paidAmount,
      remainingAmount,
      dueDate: dueDate.toISOString().split('T')[0],
      description: faker.lorem.sentences(2),
      paymentRecords,
      vendor: Math.random() > 0.3 ? {
        name: faker.company.name(),
        contact: faker.person.fullName(),
        phone: faker.phone.number(),
        bankAccount: Math.random() > 0.5 ? faker.finance.accountNumber() : undefined
      } : undefined,
      createdBy: faker.string.uuid(),
      createdByName: faker.person.fullName(),
      createdAt: faker.date.between({ 
        from: new Date('2024-01-01'), 
        to: dueDate 
      }).toISOString(),
      updatedAt: faker.date.between({ 
        from: new Date('2024-01-01'), 
        to: new Date() 
      }).toISOString()
    }
  })
}

export function createMockAssets(config: { count: number }): Asset[] {
  return Array.from({ length: config.count }, (_, index) => {
    const category = faker.helpers.arrayElement(assetCategories)
    const status = faker.helpers.arrayElement(assetStatuses)
    const purchaseDate = faker.date.between({ 
      from: new Date('2020-01-01'), 
      to: new Date('2024-06-01') 
    })
    const originalValue = Math.floor(Math.random() * 100000) + 5000
    const yearsUsed = (new Date().getTime() - purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
    const depreciationRate = Math.min(yearsUsed * 0.15, 0.8) // 年折旧率15%，最高80%
    const currentValue = Math.floor(originalValue * (1 - depreciationRate))
    
    const warrantyPeriod = faker.number.int({ min: 12, max: 60 }) // 12-60个月
    const warrantyExpiry = new Date(purchaseDate.getTime() + warrantyPeriod * 30 * 24 * 60 * 60 * 1000)
    
    const lastMaintenance = faker.date.between({ 
      from: purchaseDate, 
      to: new Date() 
    })
    const nextMaintenance = new Date(lastMaintenance.getTime() + (30 + Math.random() * 180) * 24 * 60 * 60 * 1000)

    const assetNames = {
      equipment: ['商用冰箱', '炒菜灶具', '蒸饭柜', '切菜机', '和面机'],
      furniture: ['餐桌', '椅子', '收银台', '储物柜', '展示架'],
      electronics: ['收银机', '音响设备', '监控摄像头', '路由器', '电视机'],
      fixtures: ['照明灯具', '排风扇', '水龙头', '门锁', '装饰画'],
      vehicles: ['送餐车', '采购车', '清洁车'],
      other: ['消防器材', '清洁用具', '办公用品', '安全设备']
    }

    return {
      id: faker.string.uuid(),
      code: `ASSET${String(index + 1).padStart(5, '0')}`,
      name: faker.helpers.arrayElement(assetNames[category] || assetNames.other),
      category,
      status,
      storeId: faker.string.uuid(),
      storeName: `好饭碗${faker.location.city()}店`,
      originalValue,
      currentValue,
      purchaseDate: purchaseDate.toISOString().split('T')[0],
      supplier: faker.company.name(),
      warrantyPeriod,
      warrantyExpiry: warrantyExpiry.toISOString().split('T')[0],
      lastMaintenanceDate: lastMaintenance.toISOString().split('T')[0],
      nextMaintenanceDate: nextMaintenance.toISOString().split('T')[0],
      location: faker.helpers.arrayElement(['厨房', '餐厅', '收银台', '办公室', '仓库', '外场']),
      responsible: faker.string.uuid(),
      responsibleName: faker.person.fullName(),
      maintenanceRecords: Array.from({ 
        length: faker.number.int({ min: 0, max: 5 }) 
      }, () => {
        const maintenanceDate = faker.date.between({ from: purchaseDate, to: new Date() })
        return {
          id: faker.string.uuid(),
          type: faker.helpers.arrayElement(maintenanceTypes),
          description: faker.lorem.sentences(2),
          cost: Math.floor(Math.random() * 5000) + 100,
          maintainer: faker.company.name(),
          maintenanceDate: maintenanceDate.toISOString().split('T')[0],
          nextMaintenanceDate: Math.random() > 0.5 ? 
                             new Date(maintenanceDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                             undefined,
          createdBy: faker.string.uuid(),
          createdByName: faker.person.fullName(),
          createdAt: maintenanceDate.toISOString()
        }
      }),
      depreciationRecords: Array.from({ 
        length: Math.floor(yearsUsed) + 1 
      }, (_, yearIndex) => {
        const year = new Date(purchaseDate.getFullYear() + yearIndex, 11, 31)
        const yearDepreciation = originalValue * 0.15
        return {
          id: faker.string.uuid(),
          period: `${year.getFullYear()}年`,
          depreciationAmount: yearDepreciation,
          remainingValue: originalValue - (yearDepreciation * (yearIndex + 1)),
          createdAt: year.toISOString()
        }
      }),
      createdBy: faker.string.uuid(),
      createdByName: faker.person.fullName(),
      createdAt: purchaseDate.toISOString(),
      updatedAt: faker.date.between({ from: purchaseDate, to: new Date() }).toISOString()
    }
  })
}