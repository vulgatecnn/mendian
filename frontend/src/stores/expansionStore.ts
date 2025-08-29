import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ExpansionApiService } from '@/services/api/expansion'
import type { 
  CandidateLocation, 
  FollowUpRecord, 
  BusinessCondition
} from '@/services/types/business'
import type {
  CandidateLocationQueryParams,
  FollowUpQueryParams,
  BusinessConditionQueryParams
} from '@/services/api/expansion'
import type { 
  BatchOperationParams 
} from '@/services/types'
import { message } from 'antd'

// 拓店统计数据类型
interface ExpansionStats {
  overview: {
    total: number
    discovered: number
    investigating: number
    negotiating: number
    approved: number
    rejected: number
    signed: number
  }
  byStatus: Record<CandidateLocation['status'], number>
  byPriority: Record<CandidateLocation['priority'], number>
  byPropertyType: Record<CandidateLocation['propertyType'], number>
  byRegion: Array<{
    regionId: string
    regionName: string
    count: number
    averageScore: number
    averageRent: number
  }>
  timeline: Array<{
    date: string
    discovered: number
    signed: number
    followUps: number
  }>
  performance: {
    averageScore: number
    averageRent: number
    averageArea: number
    conversionRate: number
    averageFollowUpDays: number
  }
}

// 地图数据类型
interface MapData {
  locations: Array<{
    id: string
    name: string
    address: string
    coordinates: { latitude: number; longitude: number }
    status: CandidateLocation['status']
    priority: CandidateLocation['priority']
    score?: number
    rentPrice?: number
    followUpCount: number
  }>
  clusters?: Array<{
    coordinates: { latitude: number; longitude: number }
    count: number
    averageScore?: number
  }>
  heatmap?: Array<{
    longitude: number
    latitude: number
    weight: number
    type: 'candidate' | 'competitor' | 'store'
  }>
}

// 推荐点位数据类型
interface RecommendedLocation {
  id: string
  name: string
  address: string
  rentPrice: number
  area: number
  evaluationScore: number
  matchScore: number
  reasons: string[]
  distance?: number
}

interface ExpansionState {
  // ==================== 候选点位数据 ====================
  candidateLocations: CandidateLocation[]
  currentCandidateLocation: CandidateLocation | null
  selectedLocationIds: string[]
  locationFilters: CandidateLocationQueryParams
  locationPagination: {
    current: number
    pageSize: number
    total: number
  }

  // ==================== 跟进记录数据 ====================
  followUpRecords: FollowUpRecord[]
  currentFollowUpRecord: FollowUpRecord | null
  selectedFollowUpIds: string[]
  followUpFilters: FollowUpQueryParams
  followUpPagination: {
    current: number
    pageSize: number
    total: number
  }

  // ==================== 商务条件数据 ====================
  businessConditions: BusinessCondition[]
  selectedBusinessConditionIds: string[]
  businessConditionFilters: BusinessConditionQueryParams

  // ==================== 统计和分析数据 ====================
  stats: ExpansionStats | null
  mapData: MapData | null
  recommendedLocations: RecommendedLocation[]

  // ==================== UI状态 ====================
  isLoading: boolean
  isStatsLoading: boolean
  isMapLoading: boolean
  isSubmitting: boolean
  error: string | null
  
  // 视图状态
  viewMode: 'list' | 'card' | 'map'
  showFilters: boolean
  expandedLocationIds: string[]

  // ==================== 设置器方法 ====================
  setLoading: (loading: boolean) => void
  setStatsLoading: (loading: boolean) => void
  setMapLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  setViewMode: (mode: 'list' | 'card' | 'map') => void
  setShowFilters: (show: boolean) => void
  setExpandedLocationIds: (ids: string[]) => void

  // 选择管理
  setSelectedLocationIds: (ids: string[]) => void
  setSelectedFollowUpIds: (ids: string[]) => void
  setSelectedBusinessConditionIds: (ids: string[]) => void
  clearAllSelections: () => void
  selectAllLocations: () => void
  selectAllFollowUps: () => void

  // 筛选和分页
  setLocationFilters: (filters: CandidateLocationQueryParams) => void
  setLocationPagination: (pagination: Partial<ExpansionState['locationPagination']>) => void
  setFollowUpFilters: (filters: FollowUpQueryParams) => void
  setFollowUpPagination: (pagination: Partial<ExpansionState['followUpPagination']>) => void
  setBusinessConditionFilters: (filters: BusinessConditionQueryParams) => void

  // ==================== 候选点位API方法 ====================
  fetchCandidateLocations: (params?: CandidateLocationQueryParams) => Promise<void>
  fetchCandidateLocation: (id: string) => Promise<void>
  createCandidateLocation: (data: any) => Promise<CandidateLocation | null>
  updateCandidateLocation: (id: string, data: any) => Promise<CandidateLocation | null>
  deleteCandidateLocation: (id: string) => Promise<boolean>
  batchDeleteCandidateLocations: (ids: string[]) => Promise<boolean>
  batchUpdateCandidateLocations: (params: BatchOperationParams) => Promise<boolean>
  
  // 点位状态管理
  updateLocationStatus: (id: string, status: CandidateLocation['status'], reason?: string) => Promise<boolean>
  updateLocationPriority: (id: string, priority: CandidateLocation['priority']) => Promise<boolean>
  updateLocationScore: (id: string, score: number, comments?: string) => Promise<boolean>

  // 文件管理
  uploadLocationPhotos: (id: string, files: File[]) => Promise<boolean>
  deleteLocationPhoto: (id: string, photoId: string) => Promise<boolean>
  uploadLocationVideos: (id: string, files: File[]) => Promise<boolean>
  deleteLocationVideo: (id: string, videoId: string) => Promise<boolean>

  // ==================== 跟进记录API方法 ====================
  fetchFollowUpRecords: (params?: FollowUpQueryParams) => Promise<void>
  fetchCandidateFollowUps: (candidateId: string, params?: any) => Promise<void>
  createFollowUpRecord: (data: any) => Promise<FollowUpRecord | null>
  updateFollowUpRecord: (id: string, data: any) => Promise<FollowUpRecord | null>
  deleteFollowUpRecord: (id: string) => Promise<boolean>
  completeFollowUp: (id: string, result: string) => Promise<boolean>

  // ==================== 商务条件API方法 ====================
  fetchBusinessConditions: (params?: BusinessConditionQueryParams) => Promise<void>
  fetchCandidateBusinessConditions: (candidateId: string) => Promise<void>
  createBusinessCondition: (data: any) => Promise<BusinessCondition | null>
  updateBusinessCondition: (id: string, data: any) => Promise<BusinessCondition | null>
  deleteBusinessCondition: (id: string) => Promise<boolean>

  // ==================== 地图和位置服务 ====================
  fetchMapData: (params?: any) => Promise<void>
  fetchNearbyLocations: (params: { longitude: number; latitude: number; radius: number }) => Promise<void>
  geocodeAddress: (address: string) => Promise<any>
  reverseGeocode: (longitude: number, latitude: number) => Promise<any>

  // ==================== 统计和分析 ====================
  fetchStats: (params?: any) => Promise<void>
  fetchRecommendedLocations: (params?: any) => Promise<void>

  // ==================== 工具方法 ====================
  resetStore: () => void
  resetError: () => void
  refreshCurrentData: () => Promise<void>
}

const initialState = {
  // 候选点位数据
  candidateLocations: [],
  currentCandidateLocation: null,
  selectedLocationIds: [],
  locationFilters: { page: 1, pageSize: 20 },
  locationPagination: { current: 1, pageSize: 20, total: 0 },

  // 跟进记录数据
  followUpRecords: [],
  currentFollowUpRecord: null,
  selectedFollowUpIds: [],
  followUpFilters: { page: 1, pageSize: 20 },
  followUpPagination: { current: 1, pageSize: 20, total: 0 },

  // 商务条件数据
  businessConditions: [],
  selectedBusinessConditionIds: [],
  businessConditionFilters: { page: 1, pageSize: 20 },

  // 统计和分析数据
  stats: null,
  mapData: null,
  recommendedLocations: [],

  // UI状态
  isLoading: false,
  isStatsLoading: false,
  isMapLoading: false,
  isSubmitting: false,
  error: null,
  viewMode: 'list' as const,
  showFilters: false,
  expandedLocationIds: [],
}

export const useExpansionStore = create<ExpansionState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ==================== 设置器方法 ====================
      setLoading: (loading) => set({ isLoading: loading }),
      setStatsLoading: (loading) => set({ isStatsLoading: loading }),
      setMapLoading: (loading) => set({ isMapLoading: loading }),
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
      setError: (error) => set({ error }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setShowFilters: (show) => set({ showFilters: show }),
      setExpandedLocationIds: (ids) => set({ expandedLocationIds: ids }),

      // 选择管理
      setSelectedLocationIds: (ids) => set({ selectedLocationIds: ids }),
      setSelectedFollowUpIds: (ids) => set({ selectedFollowUpIds: ids }),
      setSelectedBusinessConditionIds: (ids) => set({ selectedBusinessConditionIds: ids }),
      clearAllSelections: () => set({ 
        selectedLocationIds: [], 
        selectedFollowUpIds: [], 
        selectedBusinessConditionIds: [] 
      }),
      selectAllLocations: () => {
        const { candidateLocations } = get()
        set({ selectedLocationIds: candidateLocations.map(loc => loc.id) })
      },
      selectAllFollowUps: () => {
        const { followUpRecords } = get()
        set({ selectedFollowUpIds: followUpRecords.map(record => record.id) })
      },

      // 筛选和分页
      setLocationFilters: (filters) => set({ locationFilters: filters }),
      setLocationPagination: (pagination) => set(state => ({ 
        locationPagination: { ...state.locationPagination, ...pagination } 
      })),
      setFollowUpFilters: (filters) => set({ followUpFilters: filters }),
      setFollowUpPagination: (pagination) => set(state => ({ 
        followUpPagination: { ...state.followUpPagination, ...pagination } 
      })),
      setBusinessConditionFilters: (filters) => set({ businessConditionFilters: filters }),

      // ==================== 候选点位API方法 ====================
      fetchCandidateLocations: async (params) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const finalParams = params || get().locationFilters
          const response = await ExpansionApiService.getCandidateLocations(finalParams)
          
          if (response.success && response.data) {
            set({
              candidateLocations: response.data,
              locationPagination: {
                current: response.pagination?.page || 1,
                pageSize: response.pagination?.pageSize || 20,
                total: response.pagination?.total || 0
              }
            })
          }
        } catch (error: any) {
          setError(error?.message || '获取候选点位列表失败')
          message.error('获取候选点位列表失败')
        } finally {
          setLoading(false)
        }
      },

      fetchCandidateLocation: async (id) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.getCandidateLocation(id)
          
          if (response.success && response.data) {
            set({ currentCandidateLocation: response.data })
          }
        } catch (error: any) {
          setError(error?.message || '获取候选点位详情失败')
          message.error('获取候选点位详情失败')
        } finally {
          setLoading(false)
        }
      },

      createCandidateLocation: async (data) => {
        const { setSubmitting, setError, fetchCandidateLocations } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.createCandidateLocation(data)
          
          if (response.success && response.data) {
            message.success('候选点位创建成功')
            await fetchCandidateLocations() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '创建候选点位失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      updateCandidateLocation: async (id, data) => {
        const { setSubmitting, setError, fetchCandidateLocations, currentCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.updateCandidateLocation(id, data)
          
          if (response.success && response.data) {
            message.success('候选点位更新成功')
            
            // 更新当前详情数据
            if (currentCandidateLocation?.id === id) {
              set({ currentCandidateLocation: response.data })
            }
            
            await fetchCandidateLocations() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '更新候选点位失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      deleteCandidateLocation: async (id) => {
        const { setSubmitting, setError, fetchCandidateLocations } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.deleteCandidateLocation(id)
          
          if (response.success) {
            message.success('删除成功')
            await fetchCandidateLocations() // 刷新列表
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '删除失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      batchDeleteCandidateLocations: async (ids) => {
        const { setSubmitting, setError, fetchCandidateLocations, clearAllSelections } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.batchOperationCandidates({
            action: 'delete',
            ids,
            reason: '批量删除操作'
          })
          
          if (response.success && response.data) {
            const { successCount, failureCount } = response.data
            if (failureCount > 0) {
              message.warning(`成功删除 ${successCount} 个，失败 ${failureCount} 个`)
            } else {
              message.success(`成功删除 ${successCount} 个候选点位`)
            }
            clearAllSelections()
            await fetchCandidateLocations() // 刷新列表
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '批量删除失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      batchUpdateCandidateLocations: async (params) => {
        const { setSubmitting, setError, fetchCandidateLocations, clearAllSelections } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.batchOperationCandidates(params)
          
          if (response.success && response.data) {
            const { successCount, failureCount } = response.data
            if (failureCount > 0) {
              message.warning(`成功处理 ${successCount} 个，失败 ${failureCount} 个`)
            } else {
              message.success(`成功处理 ${successCount} 个候选点位`)
            }
            clearAllSelections()
            await fetchCandidateLocations() // 刷新列表
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '批量操作失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      updateLocationStatus: async (id, status, reason) => {
        const { setSubmitting, setError, fetchCandidateLocations, fetchCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.updateCandidateLocation(id, { 
            status, 
            statusReason: reason 
          })
          
          if (response.success) {
            message.success('状态更新成功')
            await Promise.all([
              fetchCandidateLocations(),
              fetchCandidateLocation(id) // 更新详情数据
            ])
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '状态更新失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      updateLocationPriority: async (id, priority) => {
        const { setSubmitting, setError, fetchCandidateLocations, fetchCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.updateCandidateLocation(id, { priority })
          
          if (response.success) {
            message.success('优先级更新成功')
            await Promise.all([
              fetchCandidateLocations(),
              fetchCandidateLocation(id) // 更新详情数据
            ])
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '优先级更新失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      updateLocationScore: async (id, score, comments) => {
        const { setSubmitting, setError, fetchCandidateLocations, fetchCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.evaluateLocation(id, {
            overallScore: score,
            locationScore: score,
            trafficScore: score,
            competitionScore: score,
            rentabilityScore: score,
            notes: comments
          })
          
          if (response.success) {
            message.success('评分更新成功')
            await Promise.all([
              fetchCandidateLocations(),
              fetchCandidateLocation(id) // 更新详情数据
            ])
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '评分更新失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      uploadLocationPhotos: async (id, files) => {
        const { setSubmitting, setError, fetchCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.uploadPhotos(id, files)
          
          if (response.success) {
            message.success(`成功上传 ${files.length} 张照片`)
            await fetchCandidateLocation(id) // 刷新详情数据
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '照片上传失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      deleteLocationPhoto: async (id, photoId) => {
        const { setSubmitting, setError, fetchCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.deletePhoto(id, photoId)
          
          if (response.success) {
            message.success('照片删除成功')
            await fetchCandidateLocation(id) // 刷新详情数据
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '照片删除失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      uploadLocationVideos: async (id, files) => {
        const { setSubmitting, setError, fetchCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.uploadVideos(id, files)
          
          if (response.success) {
            message.success(`成功上传 ${files.length} 个视频`)
            await fetchCandidateLocation(id) // 刷新详情数据
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '视频上传失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      deleteLocationVideo: async (id, videoId) => {
        const { setSubmitting, setError, fetchCandidateLocation } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.deleteVideo(id, videoId)
          
          if (response.success) {
            message.success('视频删除成功')
            await fetchCandidateLocation(id) // 刷新详情数据
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '视频删除失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      // ==================== 跟进记录API方法 ====================
      fetchFollowUpRecords: async (params) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const finalParams = params || get().followUpFilters
          const response = await ExpansionApiService.getFollowUps(finalParams)
          
          if (response.success && response.data) {
            set({
              followUpRecords: response.data,
              followUpPagination: {
                current: response.pagination?.page || 1,
                pageSize: response.pagination?.pageSize || 20,
                total: response.pagination?.total || 0
              }
            })
          }
        } catch (error: any) {
          setError(error?.message || '获取跟进记录失败')
          message.error('获取跟进记录失败')
        } finally {
          setLoading(false)
        }
      },

      fetchCandidateFollowUps: async (candidateId, params) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.getCandidateFollowUps(candidateId, params)
          
          if (response.success && response.data) {
            set({ followUpRecords: response.data })
          }
        } catch (error: any) {
          setError(error?.message || '获取跟进记录失败')
          message.error('获取跟进记录失败')
        } finally {
          setLoading(false)
        }
      },

      createFollowUpRecord: async (data) => {
        const { setSubmitting, setError, fetchFollowUpRecords } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.createFollowUp(data)
          
          if (response.success && response.data) {
            message.success('跟进记录创建成功')
            await fetchFollowUpRecords() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '创建跟进记录失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      updateFollowUpRecord: async (id, data) => {
        const { setSubmitting, setError, fetchFollowUpRecords } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.updateFollowUp(id, data)
          
          if (response.success && response.data) {
            message.success('跟进记录更新成功')
            await fetchFollowUpRecords() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '更新跟进记录失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      deleteFollowUpRecord: async (id) => {
        const { setSubmitting, setError, fetchFollowUpRecords } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.deleteFollowUp(id)
          
          if (response.success) {
            message.success('跟进记录删除成功')
            await fetchFollowUpRecords() // 刷新列表
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '删除跟进记录失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      completeFollowUp: async (id, result) => {
        const { setSubmitting, setError, fetchFollowUpRecords } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.updateFollowUp(id, {
            status: 'COMPLETED',
            result,
            completedAt: new Date().toISOString()
          })
          
          if (response.success) {
            message.success('跟进记录已完成')
            await fetchFollowUpRecords() // 刷新列表
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '完成跟进记录失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      // ==================== 商务条件API方法 ====================
      fetchBusinessConditions: async (params) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const finalParams = params || get().businessConditionFilters
          const response = await ExpansionApiService.getBusinessConditions(finalParams)
          
          if (response.success && response.data) {
            set({ businessConditions: response.data })
          }
        } catch (error: any) {
          setError(error?.message || '获取商务条件失败')
          message.error('获取商务条件失败')
        } finally {
          setLoading(false)
        }
      },

      fetchCandidateBusinessConditions: async (candidateId) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.getCandidateBusinessConditions(candidateId)
          
          if (response.success && response.data) {
            set({ businessConditions: response.data })
          }
        } catch (error: any) {
          setError(error?.message || '获取商务条件失败')
          message.error('获取商务条件失败')
        } finally {
          setLoading(false)
        }
      },

      createBusinessCondition: async (data) => {
        const { setSubmitting, setError, fetchBusinessConditions } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.createBusinessCondition(data)
          
          if (response.success && response.data) {
            message.success('商务条件创建成功')
            await fetchBusinessConditions() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '创建商务条件失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      updateBusinessCondition: async (id, data) => {
        const { setSubmitting, setError, fetchBusinessConditions } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.updateBusinessCondition(id, data)
          
          if (response.success && response.data) {
            message.success('商务条件更新成功')
            await fetchBusinessConditions() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '更新商务条件失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      deleteBusinessCondition: async (id) => {
        const { setSubmitting, setError, fetchBusinessConditions } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.deleteBusinessCondition(id)
          
          if (response.success) {
            message.success('商务条件删除成功')
            await fetchBusinessConditions() // 刷新列表
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '删除商务条件失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      // ==================== 地图和位置服务 ====================
      fetchMapData: async (params) => {
        const { setMapLoading, setError } = get()
        setMapLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.getNearbyLocations(params || {
            longitude: 116.404,
            latitude: 39.915,
            radius: 10000,
            limit: 100
          })
          
          if (response.success && response.data) {
            const mapData: MapData = {
              locations: response.data.map(item => ({
                id: item.id,
                name: item.name,
                address: item.address,
                coordinates: item.location,
                status: item.status,
                priority: 'MEDIUM' as any, // 临时处理
                score: 0, // 临时处理
                rentPrice: 0, // 临时处理
                followUpCount: 0 // 临时处理
              }))
            }
            set({ mapData })
          }
        } catch (error: any) {
          setError(error?.message || '获取地图数据失败')
          message.error('获取地图数据失败')
        } finally {
          setMapLoading(false)
        }
      },

      fetchNearbyLocations: async (params) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.getNearbyLocations(params)
          
          if (response.success && response.data) {
            // 更新候选点位列表
            set({ candidateLocations: response.data as any })
          }
        } catch (error: any) {
          setError(error?.message || '获取附近点位失败')
          message.error('获取附近点位失败')
        } finally {
          setLoading(false)
        }
      },

      geocodeAddress: async (address) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.geocodeAddress(address)
          
          if (response.success && response.data) {
            return response.data
          }
          return null
        } catch (error: any) {
          setError(error?.message || '地址解析失败')
          message.error('地址解析失败')
          return null
        } finally {
          setLoading(false)
        }
      },

      reverseGeocode: async (longitude, latitude) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.reverseGeocode(longitude, latitude)
          
          if (response.success && response.data) {
            return response.data
          }
          return null
        } catch (error: any) {
          setError(error?.message || '坐标解析失败')
          message.error('坐标解析失败')
          return null
        } finally {
          setLoading(false)
        }
      },

      // ==================== 统计和分析 ====================
      fetchStats: async (params) => {
        const { setStatsLoading, setError } = get()
        setStatsLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.getExpansionStats(params)
          
          if (response.success && response.data) {
            // 转换统计数据格式
            const stats: ExpansionStats = {
              overview: {
                total: response.data.total,
                discovered: response.data.byStatus.DISCOVERED || 0,
                investigating: response.data.byStatus.INVESTIGATING || 0,
                negotiating: response.data.byStatus.NEGOTIATING || 0,
                approved: response.data.byStatus.APPROVED || 0,
                rejected: response.data.byStatus.REJECTED || 0,
                signed: response.data.byStatus.SIGNED || 0
              },
              byStatus: response.data.byStatus,
              byPriority: {
                LOW: 0,
                MEDIUM: 0,
                HIGH: 0,
                URGENT: 0
              },
              byPropertyType: response.data.byPropertyType,
              byRegion: Object.entries(response.data.byRegion).map(([regionId, count]) => ({
                regionId,
                regionName: regionId, // 临时处理
                count: count as number,
                averageScore: 0, // 临时处理
                averageRent: 0 // 临时处理
              })),
              timeline: response.data.timeline.map(item => ({
                date: item.date,
                discovered: item.discovered,
                signed: item.signed,
                followUps: 0 // 临时处理
              })),
              performance: {
                averageScore: response.data.averageEvaluationScore,
                averageRent: response.data.averageRent,
                averageArea: response.data.averageArea,
                conversionRate: 0, // 临时处理
                averageFollowUpDays: 0 // 临时处理
              }
            }
            set({ stats })
          }
        } catch (error: any) {
          setError(error?.message || '获取统计数据失败')
          message.error('获取统计数据失败')
        } finally {
          setStatsLoading(false)
        }
      },

      fetchRecommendedLocations: async (params) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await ExpansionApiService.getRecommendedLocations(params || {})
          
          if (response.success && response.data) {
            set({ recommendedLocations: response.data })
          }
        } catch (error: any) {
          setError(error?.message || '获取推荐点位失败')
          message.error('获取推荐点位失败')
        } finally {
          setLoading(false)
        }
      },

      // ==================== 工具方法 ====================
      resetStore: () => set(initialState),
      resetError: () => set({ error: null }),
      
      refreshCurrentData: async () => {
        const { fetchCandidateLocations, fetchStats } = get()
        await Promise.all([
          fetchCandidateLocations(),
          fetchStats()
        ])
      },
    }),
    {
      name: 'expansion-store',
      partialize: (state: ExpansionState) => ({
        locationFilters: state.locationFilters,
        locationPagination: state.locationPagination,
        followUpFilters: state.followUpFilters,
        followUpPagination: state.followUpPagination,
        viewMode: state.viewMode,
        showFilters: state.showFilters
      })
    }
  )
)