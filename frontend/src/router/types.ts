/**
 * 路由相关类型定义
 */

import { ComponentType, LazyExoticComponent } from 'react'
import type { RouteObject } from 'react-router-dom'
import type { PermissionMode } from '../types/permission'

/**
 * 路由元数据
 */
export interface RouteMeta {
  /** 路由标题 */
  title?: string
  /** 路由描述 */
  description?: string
  /** 所需权限 */
  permissions?: string[]
  /** 权限检查模式 */
  permissionMode?: PermissionMode
  /** 是否需要认证 */
  requireAuth?: boolean
  /** 是否隐藏面包屑 */
  hideBreadcrumb?: boolean
  /** 面包屑标题 */
  breadcrumbTitle?: string
  /** 图标 */
  icon?: string
  /** 排序 */
  sort?: number
  /** 是否在菜单中隐藏 */
  hideInMenu?: boolean
  /** 是否在标签页中隐藏 */
  hideInTab?: boolean
  /** 父路由路径 */
  parentPath?: string
  /** 外链地址 */
  externalLink?: string
  /** 是否在新窗口打开 */
  target?: '_blank' | '_self'
}

/**
 * 扩展路由配置
 */
export interface AppRouteObject extends Omit<RouteObject, 'children'> {
  /** 路由元数据 */
  meta?: RouteMeta
  /** 子路由 */
  children?: AppRouteObject[]
  /** 组件 */
  component?: ComponentType<any> | LazyExoticComponent<ComponentType<any>>
}

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  /** 标题 */
  title: string
  /** 路径 */
  path?: string
  /** 图标 */
  icon?: string
  /** 是否可点击 */
  clickable?: boolean
}

/**
 * 菜单项
 */
export interface MenuItem {
  /** 唯一键 */
  key: string
  /** 标题 */
  title: string
  /** 路径 */
  path?: string
  /** 图标 */
  icon?: string
  /** 子菜单 */
  children?: MenuItem[]
  /** 所需权限 */
  permissions?: string[]
  /** 是否禁用 */
  disabled?: boolean
  /** 外链地址 */
  externalLink?: string
  /** 是否在新窗口打开 */
  target?: '_blank' | '_self'
}

/**
 * 路由配置选项
 */
export interface RouteConfig {
  /** 路由列表 */
  routes: AppRouteObject[]
  /** 默认重定向路径 */
  defaultRedirect?: string
  /** 登录页路径 */
  loginPath?: string
  /** 无权限页路径 */
  unauthorizedPath?: string
  /** 404页路径 */
  notFoundPath?: string
}
