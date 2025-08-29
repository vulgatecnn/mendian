/**
 * 路由系统配置
 */

import { RouteConfig } from './types'
import { routes } from './routes'

/**
 * 路由系统配置
 */
export const routeConfig: RouteConfig = {
  routes,
  defaultRedirect: '/dashboard',
  loginPath: '/login',
  unauthorizedPath: '/403',
  notFoundPath: '/404'
}

/**
 * 路由系统常量
 */
export const ROUTE_CONSTANTS = {
  // 公共路径
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  
  // 业务路径
  STORE_PLAN: '/store-plan',
  EXPANSION: '/expansion', 
  PREPARATION: '/preparation',
  STORE_FILES: '/store-files',
  OPERATION: '/operation',
  APPROVAL: '/approval',
  BASIC_DATA: '/basic-data',
  
  // 错误页面
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/403',
  SERVER_ERROR: '/500'
} as const

/**
 * 菜单配置
 */
export const MENU_CONFIG = {
  // 默认展开的菜单键
  defaultOpenKeys: ['/dashboard'],
  // 默认选中的菜单键
  defaultSelectedKeys: ['/dashboard'],
  // 菜单主题
  theme: 'dark' as const,
  // 菜单模式
  mode: 'inline' as const,
  // 是否可收起
  collapsible: true,
  // 收起时的宽度
  collapsedWidth: 80,
  // 展开时的宽度
  width: 256
}

/**
 * 面包屑配置
 */
export const BREADCRUMB_CONFIG = {
  // 是否显示首页
  showHome: true,
  // 首页标题
  homeTitle: '首页',
  // 首页路径
  homePath: '/dashboard',
  // 分隔符
  separator: '/',
  // 最大显示项数
  maxItems: 6
}

/**
 * 权限配置
 */
export const PERMISSION_CONFIG = {
  // 默认权限模式
  defaultMode: 'any' as const,
  // 是否启用权限缓存
  enableCache: true,
  // 缓存时间（毫秒）
  cacheTime: 30 * 60 * 1000, // 30分钟
  // 是否显示权限调试信息
  debug: process.env.NODE_ENV === 'development'
}

/**
 * 布局配置
 */
export const LAYOUT_CONFIG = {
  // 头部高度
  headerHeight: 64,
  // 侧边栏宽度
  siderWidth: 256,
  // 侧边栏收起宽度
  siderCollapsedWidth: 80,
  // 内容区域边距
  contentMargin: 24,
  // 移动端断点
  mobileBreakpoint: 'md' as const,
  // 是否固定头部
  fixedHeader: true,
  // 是否固定侧边栏
  fixedSider: true
}

/**
 * 错误处理配置
 */
export const ERROR_CONFIG = {
  // 是否启用错误边界
  enableErrorBoundary: true,
  // 是否自动报告错误
  autoReport: false,
  // 错误报告接口
  reportUrl: '/api/errors/report',
  // 是否显示错误详情
  showErrorDetails: process.env.NODE_ENV === 'development',
  // 重试次数
  maxRetries: 3,
  // 重试间隔（毫秒）
  retryInterval: 1000
}

export default {
  routeConfig,
  ROUTE_CONSTANTS,
  MENU_CONFIG,
  BREADCRUMB_CONFIG,
  PERMISSION_CONFIG,
  LAYOUT_CONFIG,
  ERROR_CONFIG
}