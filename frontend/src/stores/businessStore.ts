/**
 * 业务数据状态管理
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 业务数据类型定义
interface BusinessRegion {
  id: string
  name: string
  code: string
  parentId?: string
  level: number
  children?: BusinessRegion[]
}

interface StoreType {
  id: string
  name: string
  code: string
  description?: string
}

interface Supplier {
  id: string
  name: string
  code: string
  type: string
  contactPerson?: string
  contactPhone?: string
  status: 'active' | 'inactive'
}

interface BusinessData {
  /** 业务大区数据 */
  regions: BusinessRegion[]
  /** 门店类型数据 */
  storeTypes: StoreType[]
  /** 供应商数据 */
  suppliers: Supplier[]
  /** 数据最后更新时间 */
  lastUpdated: number
}

interface BusinessStore extends BusinessData {
  /** 获取区域列表 */
  getRegions: () => BusinessRegion[]
  /** 根据ID获取区域 */
  getRegionById: (id: string) => BusinessRegion | undefined
  /** 获取区域树形结构 */
  getRegionTree: () => BusinessRegion[]
  /** 设置区域数据 */
  setRegions: (regions: BusinessRegion[]) => void

  /** 获取门店类型列表 */
  getStoreTypes: () => StoreType[]
  /** 根据ID获取门店类型 */
  getStoreTypeById: (id: string) => StoreType | undefined
  /** 设置门店类型数据 */
  setStoreTypes: (storeTypes: StoreType[]) => void

  /** 获取供应商列表 */
  getSuppliers: () => Supplier[]
  /** 根据类型获取供应商 */
  getSuppliersByType: (type: string) => Supplier[]
  /** 设置供应商数据 */
  setSuppliers: (suppliers: Supplier[]) => void

  /** 刷新所有基础数据 */
  refreshAllData: () => Promise<void>
  /** 检查数据是否需要刷新 */
  isDataStale: () => boolean
}

// 模拟数据
const mockRegions: BusinessRegion[] = [
  {
    id: '1',
    name: '华东大区',
    code: 'HD',
    level: 1,
    children: [
      { id: '11', name: '上海', code: 'SH', parentId: '1', level: 2 },
      { id: '12', name: '江苏', code: 'JS', parentId: '1', level: 2 },
      { id: '13', name: '浙江', code: 'ZJ', parentId: '1', level: 2 }
    ]
  },
  {
    id: '2',
    name: '华南大区',
    code: 'HN',
    level: 1,
    children: [
      { id: '21', name: '广东', code: 'GD', parentId: '2', level: 2 },
      { id: '22', name: '广西', code: 'GX', parentId: '2', level: 2 }
    ]
  }
]

const mockStoreTypes: StoreType[] = [
  { id: '1', name: '旗舰店', code: 'FLAGSHIP', description: '品牌旗舰门店' },
  { id: '2', name: '标准店', code: 'STANDARD', description: '标准化门店' },
  { id: '3', name: '社区店', code: 'COMMUNITY', description: '社区便民店' }
]

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: '装修供应商A',
    code: 'DECO_A',
    type: 'decoration',
    contactPerson: '张经理',
    contactPhone: '13800138001',
    status: 'active'
  },
  {
    id: '2',
    name: '设备供应商B',
    code: 'EQUIP_B',
    type: 'equipment',
    contactPerson: '李经理',
    contactPhone: '13800138002',
    status: 'active'
  }
]

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      regions: [],
      storeTypes: [],
      suppliers: [],
      lastUpdated: 0,

      // 区域相关方法
      getRegions: () => get().regions,

      getRegionById: (id: string) => {
        const findRegion = (regions: BusinessRegion[]): BusinessRegion | undefined => {
          for (const region of regions) {
            if (region.id === id) return region
            if (region.children) {
              const found = findRegion(region.children)
              if (found) return found
            }
          }
          return undefined
        }
        return findRegion(get().regions)
      },

      getRegionTree: () => get().regions,

      setRegions: (regions: BusinessRegion[]) => {
        set({ regions, lastUpdated: Date.now() })
      },

      // 门店类型相关方法
      getStoreTypes: () => get().storeTypes,

      getStoreTypeById: (id: string) => {
        return get().storeTypes.find(type => type.id === id)
      },

      setStoreTypes: (storeTypes: StoreType[]) => {
        set({ storeTypes, lastUpdated: Date.now() })
      },

      // 供应商相关方法
      getSuppliers: () => get().suppliers,

      getSuppliersByType: (type: string) => {
        return get().suppliers.filter(supplier => supplier.type === type)
      },

      setSuppliers: (suppliers: Supplier[]) => {
        set({ suppliers, lastUpdated: Date.now() })
      },

      // 数据刷新方法
      refreshAllData: async () => {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))

        set({
          regions: mockRegions,
          storeTypes: mockStoreTypes,
          suppliers: mockSuppliers,
          lastUpdated: Date.now()
        })
      },

      // 检查数据是否过期（超过5分钟）
      isDataStale: () => {
        const { lastUpdated } = get()
        return Date.now() - lastUpdated > 5 * 60 * 1000
      }
    }),
    {
      name: 'business-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        regions: state.regions,
        storeTypes: state.storeTypes,
        suppliers: state.suppliers,
        lastUpdated: state.lastUpdated
      })
    }
  )
)

// 便捷hooks
export const useRegions = () => {
  const { regions, getRegions, getRegionById, getRegionTree, setRegions } = useBusinessStore()
  return { regions, getRegions, getRegionById, getRegionTree, setRegions }
}

export const useStoreTypes = () => {
  const { storeTypes, getStoreTypes, getStoreTypeById, setStoreTypes } = useBusinessStore()
  return { storeTypes, getStoreTypes, getStoreTypeById, setStoreTypes }
}

export const useSuppliers = () => {
  const { suppliers, getSuppliers, getSuppliersByType, setSuppliers } = useBusinessStore()
  return { suppliers, getSuppliers, getSuppliersByType, setSuppliers }
}