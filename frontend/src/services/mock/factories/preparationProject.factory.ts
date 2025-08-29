/**
 * 筹备项目工厂函数
 */
import { faker } from '@faker-js/faker'

interface PreparationProject {
  id: string
  name: string
  storeId: string
  storeName: string
  storeType: 'direct' | 'franchise' | 'joint_venture'
  status: 'planning' | 'construction' | 'acceptance' | 'delivered' | 'delayed'
  progress: number
  startDate: string
  expectedDeliveryDate: string
  actualDeliveryDate: string | null
  budget: number
  actualCost: number
  location: {
    province: string
    city: string
    district: string
    address: string
    coordinates: { lat: number; lng: number }
  }
  manager: {
    id: string
    name: string
    phone: string
    department: string
  }
  milestones: Array<{
    name: string
    status: 'pending' | 'in_progress' | 'completed' | 'delayed'
    completedAt: string | null
    order: number
  }>
  contractors: Array<{
    type: string
    name: string
    contact: string
    phone: string
    contractAmount: number
  }>
  createdAt: string
  updatedAt: string
}

const storeTypes = ['direct', 'franchise', 'joint_venture']
const statuses = ['planning', 'construction', 'acceptance', 'delivered', 'delayed']
const milestoneNames = ['筹备启动', '施工许可', '工程施工', '验收确认', '门店交付']
const contractorTypes = ['主体施工', '装修工程', '设备安装', '水电安装']

export function createMockPreparationProjects(config: { count: number }): PreparationProject[] {
  return Array.from({ length: config.count }, (_, index) => {
    const status = faker.helpers.arrayElement(statuses)
    const startDate = faker.date.between({ 
      from: new Date('2024-01-01'), 
      to: new Date('2024-06-01') 
    })
    const expectedDelivery = new Date(startDate.getTime() + (60 + Math.random() * 60) * 24 * 60 * 60 * 1000)
    const progress = status === 'delivered' ? 100 : 
                    status === 'planning' ? Math.floor(Math.random() * 20) :
                    status === 'construction' ? Math.floor(Math.random() * 60) + 20 :
                    status === 'acceptance' ? Math.floor(Math.random() * 20) + 80 :
                    Math.floor(Math.random() * 80) + 10

    const milestones = milestoneNames.map((name, idx) => ({
      name,
      status: idx === 0 ? 'completed' :
              progress > (idx * 20) ? 'completed' :
              progress > ((idx - 1) * 20) ? 'in_progress' : 'pending',
      completedAt: idx === 0 || progress > (idx * 20) ? 
                   faker.date.between({ from: startDate, to: new Date() }).toISOString() : 
                   null,
      order: idx + 1
    }))

    const budget = Math.floor(Math.random() * 500000) + 100000
    
    return {
      id: faker.string.uuid(),
      name: `${faker.location.city()}${faker.helpers.arrayElement(['旗舰店', '社区店', '标准店'])}`,
      storeId: faker.string.uuid(),
      storeName: `好饭碗${faker.location.city()}店`,
      storeType: faker.helpers.arrayElement(storeTypes),
      status,
      progress,
      startDate: startDate.toISOString(),
      expectedDeliveryDate: expectedDelivery.toISOString(),
      actualDeliveryDate: status === 'delivered' ? 
                          faker.date.between({ from: expectedDelivery, to: new Date() }).toISOString() : 
                          null,
      budget,
      actualCost: status === 'delivered' ? 
                  budget + Math.floor(Math.random() * 50000) - 25000 : 
                  Math.floor((progress / 100) * budget),
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
      manager: {
        id: faker.string.uuid(),
        name: faker.person.fullName({ sex: 'male' }),
        phone: faker.phone.number(),
        department: faker.helpers.arrayElement(['工程部', '运营部', '拓展部'])
      },
      milestones,
      contractors: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () => ({
        type: faker.helpers.arrayElement(contractorTypes),
        name: `${faker.company.name()}建设有限公司`,
        contact: faker.person.fullName(),
        phone: faker.phone.number(),
        contractAmount: Math.floor(Math.random() * 200000) + 50000
      })),
      createdAt: startDate.toISOString(),
      updatedAt: faker.date.between({ from: startDate, to: new Date() }).toISOString()
    }
  })
}