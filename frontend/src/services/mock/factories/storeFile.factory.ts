/**
 * 门店档案工厂函数
 */
import { faker } from '@faker-js/faker'

interface StoreFile {
  id: string
  name: string
  code: string
  storeType: 'direct' | 'franchise' | 'joint_venture'
  status: 'active' | 'inactive' | 'closed'
  operatingStatus: 'normal' | 'renovation' | 'suspended' | 'trial'
  location: {
    region: string
    province: string
    city: string
    district: string
    address: string
    coordinates: { lat: number; lng: number }
  }
  area: number
  seatingCapacity: number
  openingDate: string
  manager: {
    id: string
    name: string
    phone: string
    email: string
  }
  owner: {
    type: 'company' | 'individual'
    name: string
    contact: string
    phone: string
    email?: string
  }
  documents: {
    businessLicense: {
      number: string
      validFrom: string
      validTo: string
      status: 'valid' | 'expired' | 'expiring'
      fileUrl: string | null
    }
    foodPermit: {
      number: string
      validFrom: string
      validTo: string
      status: 'valid' | 'expired' | 'expiring'
      fileUrl: string | null
    }
    firePermit: {
      number: string
      validFrom: string
      validTo: string
      status: 'valid' | 'expired' | 'expiring'
      fileUrl: string | null
    }
  }
  performance: {
    monthlyRevenue: number
    dailyAvgCustomers: number
    avgTransactionValue: number
    monthlyGrowthRate: string
    lastMonthRevenue: number
  }
  facilities: {
    kitchen: boolean
    airConditioning: boolean
    wifi: boolean
    parking: boolean
    delivery: boolean
  }
  staffCount: number
  rentInfo: {
    monthlyRent: number
    leaseStart: string
    leaseEnd: string
    deposit: number
  }
  createdAt: string
  updatedAt: string
}

const storeTypes = ['direct', 'franchise', 'joint_venture']
const statuses = ['active', 'inactive', 'closed']
const operatingStatuses = ['normal', 'renovation', 'suspended', 'trial']
const regions = ['华东区', '华南区', '华北区', '华中区', '西南区', '西北区', '东北区']

export function createMockStoreFiles(config: { count: number }): StoreFile[] {
  return Array.from({ length: config.count }, (_, index) => {
    const openingDate = faker.date.between({ 
      from: new Date('2020-01-01'), 
      to: new Date('2024-06-01') 
    })
    
    const monthlyRevenue = Math.floor(Math.random() * 150000) + 50000
    const lastMonthRevenue = monthlyRevenue + Math.floor(Math.random() * 20000) - 10000
    const dailyAvgCustomers = Math.floor(Math.random() * 200) + 100
    const avgTransactionValue = Math.floor(monthlyRevenue / dailyAvgCustomers / 30)
    
    const leaseStart = faker.date.between({ 
      from: new Date('2020-01-01'), 
      to: new Date('2024-01-01') 
    })
    const leaseEnd = new Date(leaseStart.getTime() + (3 + Math.random() * 7) * 365 * 24 * 60 * 60 * 1000)
    
    const businessLicenseValidTo = new Date(Date.now() + (Math.random() * 10 + 1) * 365 * 24 * 60 * 60 * 1000)
    const foodPermitValidTo = new Date(Date.now() + (Math.random() * 3 + 1) * 365 * 24 * 60 * 60 * 1000)
    const firePermitValidTo = new Date(Date.now() + (Math.random() * 5 + 1) * 365 * 24 * 60 * 60 * 1000)
    
    const getDocumentStatus = (validTo: Date) => {
      const now = new Date()
      const diffDays = (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays < 0) return 'expired'
      if (diffDays < 30) return 'expiring'
      return 'valid'
    }

    return {
      id: faker.string.uuid(),
      name: `好饭碗${faker.location.city()}${faker.helpers.arrayElement(['旗舰店', '社区店', '标准店', '购物中心店'])}`,
      code: `STORE${String(index + 1).padStart(4, '0')}`,
      storeType: faker.helpers.arrayElement(storeTypes),
      status: faker.helpers.arrayElement(statuses),
      operatingStatus: faker.helpers.arrayElement(operatingStatuses),
      location: {
        region: faker.helpers.arrayElement(regions),
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
      openingDate: openingDate.toISOString(),
      manager: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email()
      },
      owner: {
        type: faker.helpers.arrayElement(['company', 'individual']),
        name: faker.helpers.arrayElement(['company', 'individual']) === 'company' ? 
              faker.company.name() : faker.person.fullName(),
        contact: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email()
      },
      documents: {
        businessLicense: {
          number: `营业执照${faker.string.numeric(18)}`,
          validFrom: '2024-01-01',
          validTo: businessLicenseValidTo.toISOString().split('T')[0],
          status: getDocumentStatus(businessLicenseValidTo),
          fileUrl: null
        },
        foodPermit: {
          number: `食品许可${faker.string.numeric(16)}`,
          validFrom: '2024-01-01',
          validTo: foodPermitValidTo.toISOString().split('T')[0],
          status: getDocumentStatus(foodPermitValidTo),
          fileUrl: null
        },
        firePermit: {
          number: `消防许可${faker.string.numeric(14)}`,
          validFrom: '2024-01-01',
          validTo: firePermitValidTo.toISOString().split('T')[0],
          status: getDocumentStatus(firePermitValidTo),
          fileUrl: null
        }
      },
      performance: {
        monthlyRevenue,
        dailyAvgCustomers,
        avgTransactionValue,
        monthlyGrowthRate: ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1),
        lastMonthRevenue
      },
      facilities: {
        kitchen: true,
        airConditioning: faker.datatype.boolean(0.9),
        wifi: faker.datatype.boolean(0.95),
        parking: faker.datatype.boolean(0.7),
        delivery: faker.datatype.boolean(0.8)
      },
      staffCount: Math.floor(Math.random() * 20) + 5,
      rentInfo: {
        monthlyRent: Math.floor(Math.random() * 20000) + 5000,
        leaseStart: leaseStart.toISOString().split('T')[0],
        leaseEnd: leaseEnd.toISOString().split('T')[0],
        deposit: Math.floor(Math.random() * 50000) + 15000
      },
      createdAt: openingDate.toISOString(),
      updatedAt: faker.date.between({ from: openingDate, to: new Date() }).toISOString()
    }
  })
}