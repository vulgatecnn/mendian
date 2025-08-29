import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { StorePlanApiService } from '@/services/api/storePlan'
import type { StorePlan, StorePlanQueryParams, CreateStorePlanDto, UpdateStorePlanDto, StatsResponse } from '@/services/types'
import { message } from 'antd'

interface StorePlanState {
  // 数据状态
  storePlans: StorePlan[]
  currentStorePlan: StorePlan | null
  stats: {
    total: StatsResponse
    byStatus: Record<StorePlan['status'], number>
    byType: Record<StorePlan['type'], number>
    byRegion: Record<string, number>
    timeline: Array<{
      date: string
      planned: number
      completed: number
    }>
  } | null
  
  // UI状态
  isLoading: boolean
  isStatsLoading: boolean
  isSubmitting: boolean
  error: string | null
  selectedIds: string[]
  
  // 筛选和分页
  queryParams: StorePlanQueryParams
  pagination: {
    current: number
    pageSize: number
    total: number
  }

  // Actions
  setLoading: (loading: boolean) => void
  setStatsLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  setSelectedIds: (ids: string[]) => void
  setQueryParams: (params: StorePlanQueryParams) => void
  setPagination: (pagination: Partial<StorePlanState['pagination']>) => void
  
  // API Actions
  fetchStorePlans: (params?: StorePlanQueryParams) => Promise<void>
  fetchStorePlan: (id: string) => Promise<void>
  fetchStats: () => Promise<void>
  createStorePlan: (data: CreateStorePlanDto) => Promise<StorePlan | null>
  updateStorePlan: (id: string, data: UpdateStorePlanDto) => Promise<StorePlan | null>
  deleteStorePlan: (id: string) => Promise<boolean>
  batchDeleteStorePlans: (ids: string[]) => Promise<boolean>
  cloneStorePlan: (id: string, data?: { name: string; description?: string; targetOpenDate?: string }) => Promise<StorePlan | null>
  submitForApproval: (id: string, data?: { comment?: string; urgency?: 'normal' | 'urgent' }) => Promise<boolean>
  withdrawApproval: (id: string, reason?: string) => Promise<boolean>
  updateProgress: (id: string, progress: number, notes?: string) => Promise<boolean>
  
  // Utility Actions
  resetStore: () => void
  resetError: () => void
  selectAll: () => void
  clearSelection: () => void
}

const initialState = {
  storePlans: [],
  currentStorePlan: null,
  stats: null,
  isLoading: false,
  isStatsLoading: false,
  isSubmitting: false,
  error: null,
  selectedIds: [],
  queryParams: {
    page: 1,
    pageSize: 10
  },
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  }
}

export const useStorePlanStore = create<StorePlanState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setLoading: (loading) => set({ isLoading: loading }),
      setStatsLoading: (loading) => set({ isStatsLoading: loading }),
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
      setError: (error) => set({ error }),
      setSelectedIds: (ids) => set({ selectedIds: ids }),
      setQueryParams: (params) => set({ queryParams: params }),
      setPagination: (pagination) => set((state) => ({ 
        pagination: { ...state.pagination, ...pagination } 
      })),

      // API Actions
      fetchStorePlans: async (params) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const finalParams = params || get().queryParams
          const response = await StorePlanApiService.getStorePlans(finalParams)
          
          if (response.success && response.data) {
            set({
              storePlans: response.data,
              pagination: {
                current: response.pagination?.page || 1,
                pageSize: response.pagination?.pageSize || 10,
                total: response.pagination?.total || 0
              }
            })
          }
        } catch (error: any) {
          setError(error?.message || '获取开店计划列表失败')
          message.error('获取开店计划列表失败')
        } finally {
          setLoading(false)
        }
      },

      fetchStorePlan: async (id) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.getStorePlan(id)
          
          if (response.success && response.data) {
            set({ currentStorePlan: response.data })
          }
        } catch (error: any) {
          setError(error?.message || '获取开店计划详情失败')
          message.error('获取开店计划详情失败')
        } finally {
          setLoading(false)
        }
      },

      fetchStats: async () => {
        const { setStatsLoading, setError } = get()
        setStatsLoading(true)
        
        try {
          const response = await StorePlanApiService.getStats()
          
          if (response.success && response.data) {
            set({ stats: response.data })
          }
        } catch (error: any) {
          setError(error?.message || '获取统计数据失败')
        } finally {
          setStatsLoading(false)
        }
      },

      createStorePlan: async (data) => {
        const { setSubmitting, setError, fetchStorePlans } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.createStorePlan(data)
          
          if (response.success && response.data) {
            message.success('开店计划创建成功')
            await fetchStorePlans() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '创建开店计划失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      updateStorePlan: async (id, data) => {
        const { setSubmitting, setError, fetchStorePlans, currentStorePlan } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.updateStorePlan(id, data)
          
          if (response.success && response.data) {
            message.success('开店计划更新成功')
            
            // 更新当前计划数据
            if (currentStorePlan?.id === id) {
              set({ currentStorePlan: response.data })
            }
            
            await fetchStorePlans() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '更新开店计划失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      deleteStorePlan: async (id) => {
        const { setSubmitting, setError, fetchStorePlans } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.deleteStorePlan(id)
          
          if (response.success) {
            message.success('删除成功')
            await fetchStorePlans() // 刷新列表
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

      batchDeleteStorePlans: async (ids) => {
        const { setSubmitting, setError, fetchStorePlans, clearSelection } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.batchOperation({
            action: 'delete',
            ids,
            reason: '批量删除操作'
          })
          
          if (response.success && response.data) {
            const { successCount, failureCount } = response.data
            if (failureCount > 0) {
              message.warning(`成功删除 ${successCount} 个，失败 ${failureCount} 个`)
            } else {
              message.success(`成功删除 ${successCount} 个计划`)
            }
            clearSelection()
            await fetchStorePlans() // 刷新列表
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

      cloneStorePlan: async (id, data) => {
        const { setSubmitting, setError, fetchStorePlans } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.cloneStorePlan(id, data)
          
          if (response.success && response.data) {
            message.success('计划复制成功')
            await fetchStorePlans() // 刷新列表
            return response.data
          }
          return null
        } catch (error: any) {
          const errorMsg = error?.message || '复制计划失败'
          setError(errorMsg)
          message.error(errorMsg)
          return null
        } finally {
          setSubmitting(false)
        }
      },

      submitForApproval: async (id, data) => {
        const { setSubmitting, setError, fetchStorePlans, fetchStorePlan } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.submitForApproval(id, data)
          
          if (response.success) {
            message.success('提交审批成功')
            await Promise.all([
              fetchStorePlans(),
              fetchStorePlan(id) // 更新详情数据
            ])
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '提交审批失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      withdrawApproval: async (id, reason) => {
        const { setSubmitting, setError, fetchStorePlans, fetchStorePlan } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.withdrawApproval(id, reason)
          
          if (response.success) {
            message.success('撤回审批成功')
            await Promise.all([
              fetchStorePlans(),
              fetchStorePlan(id) // 更新详情数据
            ])
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '撤回审批失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      updateProgress: async (id, progress, notes) => {
        const { setSubmitting, setError, fetchStorePlans, fetchStorePlan } = get()
        setSubmitting(true)
        setError(null)
        
        try {
          const response = await StorePlanApiService.updateProgress(id, {
            progress,
            notes: notes || undefined
          })
          
          if (response.success) {
            message.success('进度更新成功')
            await Promise.all([
              fetchStorePlans(),
              fetchStorePlan(id) // 更新详情数据
            ])
            return true
          }
          return false
        } catch (error: any) {
          const errorMsg = error?.message || '进度更新失败'
          setError(errorMsg)
          message.error(errorMsg)
          return false
        } finally {
          setSubmitting(false)
        }
      },

      // Utility Actions
      resetStore: () => set(initialState),
      resetError: () => set({ error: null }),
      
      selectAll: () => {
        const { storePlans } = get()
        set({ selectedIds: storePlans.map(plan => plan.id) })
      },
      
      clearSelection: () => set({ selectedIds: [] })
    }),
    {
      name: 'storePlan-store',
      partialize: (state: StorePlanState) => ({
        queryParams: state.queryParams,
        pagination: state.pagination
      })
    }
  )
)