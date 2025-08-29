/**
 * 应用全局状态管理
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AppConfig {
  /** 应用主题 */
  theme: 'light' | 'dark'
  /** 语言设置 */
  locale: 'zh-CN' | 'en-US'
  /** 侧边栏折叠状态 */
  sidebarCollapsed: boolean
  /** 页面尺寸设置 */
  pageSize: number
  /** 表格密度 */
  tableDensity: 'default' | 'middle' | 'small'
  /** 是否显示页面header */
  showPageHeader: boolean
  /** 是否显示面包屑 */
  showBreadcrumb: boolean
}

interface AppState {
  /** 应用配置 */
  config: AppConfig
  /** 当前页面路径 */
  currentPath: string
  /** 页面加载状态 */
  pageLoading: boolean
  /** 全局错误信息 */
  globalError: string | null
  /** 通知数量 */
  notificationCount: number
}

interface AppStore extends AppState {
  /** 更新配置 */
  updateConfig: (config: Partial<AppConfig>) => void
  /** 设置当前路径 */
  setCurrentPath: (path: string) => void
  /** 设置页面加载状态 */
  setPageLoading: (loading: boolean) => void
  /** 设置全局错误 */
  setGlobalError: (error: string | null) => void
  /** 清除全局错误 */
  clearGlobalError: () => void
  /** 设置通知数量 */
  setNotificationCount: (count: number) => void
  /** 重置应用状态 */
  resetApp: () => void
}

const defaultConfig: AppConfig = {
  theme: 'light',
  locale: 'zh-CN',
  sidebarCollapsed: false,
  pageSize: 20,
  tableDensity: 'default',
  showPageHeader: true,
  showBreadcrumb: true
}

const defaultState: AppState = {
  config: defaultConfig,
  currentPath: '',
  pageLoading: false,
  globalError: null,
  notificationCount: 0
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...defaultState,

      updateConfig: (newConfig: Partial<AppConfig>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }))
      },

      setCurrentPath: (path: string) => {
        set({ currentPath: path })
      },

      setPageLoading: (loading: boolean) => {
        set({ pageLoading: loading })
      },

      setGlobalError: (error: string | null) => {
        set({ globalError: error })
      },

      clearGlobalError: () => {
        set({ globalError: null })
      },

      setNotificationCount: (count: number) => {
        set({ notificationCount: count })
      },

      resetApp: () => {
        set(defaultState)
      }
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        config: state.config
      })
    }
  )
)

// 便捷的hooks
export const useAppConfig = () => {
  const { config, updateConfig } = useAppStore()
  return { config, updateConfig }
}

export const usePageLoading = () => {
  const { pageLoading, setPageLoading } = useAppStore()
  return { pageLoading, setPageLoading }
}

export const useGlobalError = () => {
  const { globalError, setGlobalError, clearGlobalError } = useAppStore()
  return { globalError, setGlobalError, clearGlobalError }
}

export const useNotification = () => {
  const { notificationCount, setNotificationCount } = useAppStore()
  return { notificationCount, setNotificationCount }
}