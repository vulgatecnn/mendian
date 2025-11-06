/**
 * 基础数据服务 Hook
 */
import { useState, useEffect } from 'react'
import type { BusinessRegion, StoreType } from '../types'

// 模拟基础数据
const mockRegions: BusinessRegion[] = [
  { id: 1, name: '华北区', code: 'HB', description: '华北区域', is_active: true, created_at: '', updated_at: '' },
  { id: 2, name: '华东区', code: 'HD', description: '华东区域', is_active: true, created_at: '', updated_at: '' },
  { id: 3, name: '华南区', code: 'HN', description: '华南区域', is_active: true, created_at: '', updated_at: '' },
  { id: 4, name: '华中区', code: 'HZ', description: '华中区域', is_active: true, created_at: '', updated_at: '' },
  { id: 5, name: '西南区', code: 'XN', description: '西南区域', is_active: true, created_at: '', updated_at: '' },
  { id: 6, name: '西北区', code: 'XB', description: '西北区域', is_active: true, created_at: '', updated_at: '' },
]

const mockStoreTypes: StoreType[] = [
  { id: 1, name: '直营店', code: 'direct', description: '直营门店', is_active: true, created_at: '', updated_at: '' },
  { id: 2, name: '加盟店', code: 'franchise', description: '加盟门店', is_active: true, created_at: '', updated_at: '' },
  { id: 3, name: '合作店', code: 'joint', description: '合作门店', is_active: true, created_at: '', updated_at: '' },
]

export function useBaseDataService() {
  const [regions, setRegions] = useState<BusinessRegion[]>([])
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // 模拟异步加载
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setRegions(mockRegions)
        setStoreTypes(mockStoreTypes)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return {
    regions,
    storeTypes,
    loading,
    error
  }
}