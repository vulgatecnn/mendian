/**
 * 菜单配置Hook
 */

import React from 'react'
import { usePermissionStore } from '../stores/permissionStore'
import { useAuthStore } from '../stores/authStore'
import { routes, filterRoutesByPermission } from '../router/routes'
import type { AppRouteObject } from '../router/types'

/**
 * 获取可访问的路由
 */
export const useAccessibleRoutes = () => {
  const { permissions } = usePermissionStore()
  const { isAuthenticated } = useAuthStore()

  // 根据用户权限过滤路由
  const accessibleRoutes = React.useMemo(() => {
    if (!isAuthenticated) {
      return []
    }

    return filterRoutesByPermission(routes, permissions)
  }, [permissions, isAuthenticated])

  return accessibleRoutes
}

/**
 * 获取菜单配置
 */
export const useMenuConfig = () => {
  const { isAuthenticated } = useAuthStore()
  const { permissions } = usePermissionStore()
  
  const menuItems = React.useMemo(() => {
    // 开发环境或权限未加载完成时，显示所有主菜单项
    const isDevelopment = process.env.NODE_ENV === 'development'
    const showAllMenus = isDevelopment || !isAuthenticated || permissions.length === 0
    
    const generateMenuItems = (routes: AppRouteObject[], parentPath = ''): any[] => {
      return routes
        .filter(route => {
          const { hideInMenu, permissions: requiredPermissions } = route.meta || {}
          
          // 隐藏在菜单中的路由不显示
          if (hideInMenu) return false
          
          // 开发环境或权限未初始化时显示所有菜单
          if (showAllMenus) return true
          
          // 生产环境检查权限
          if (requiredPermissions && requiredPermissions.length > 0) {
            return requiredPermissions.some(permission => permissions.includes(permission))
          }
          
          return true
        })
        .sort((a, b) => {
          const sortA = a.meta?.sort || 999
          const sortB = b.meta?.sort || 999
          return sortA - sortB
        })
        .map(route => {
          const { path, meta } = route
          const fullPath = parentPath + (path || '')

          const item: any = {
            key: fullPath,
            label: meta?.title || path,
            icon: meta?.icon
          }

          if (route.children) {
            const childItems = generateMenuItems(route.children, fullPath + '/')
            if (childItems.length > 0) {
              item.children = childItems
            }
          } else if (path) {
            item.path = fullPath
          }

          return item
        })
    }

    return generateMenuItems(routes.find(route => route.path === '/')?.children || [])
  }, [permissions, isAuthenticated])

  return menuItems
}