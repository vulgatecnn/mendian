/**
 * 路由配置入口
 */

import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { routes } from './routes'
import { PrivateRoute, LazyRoute, PageLoading } from './guards'
import type { AppRouteObject } from './types'

/**
 * 转换路由配置为React Router格式
 */
const transformRoutes = (routes: AppRouteObject[]): any[] => {
  return routes.map(route => {
    const { component: Component, element, meta, children, ...rest } = route

    let routeElement = element

    // 如果有组件，包装组件
    if (Component) {
      routeElement = (
        <LazyRoute>
          <Component />
        </LazyRoute>
      )
    }

    // 如果需要权限验证，包装权限组件
    if (meta?.requireAuth || meta?.permissions?.length) {
      routeElement = (
        <PrivateRoute
          {...(meta?.permissions && { permissions: meta.permissions })}
          {...(meta?.permissionMode && { permissionMode: meta.permissionMode })}
        >
          {routeElement}
        </PrivateRoute>
      )
    }

    const transformedRoute = {
      ...rest,
      element: routeElement,
      children: children ? transformRoutes(children) : undefined
    }

    return transformedRoute
  })
}

/**
 * 创建路由实例
 */
const createAppRouter = () => {
  const transformedRoutes = transformRoutes(routes)

  return createBrowserRouter([
    ...transformedRoutes,
    // 登录页面路由(不需要权限)
    {
      path: '/login',
      lazy: () =>
        import('../pages/auth/Login').then(module => ({
          Component: module.default
        }))
    },
    // 默认重定向
    {
      path: '/',
      element: <Navigate to="/dashboard" replace />
    }
  ], {
    future: {
      v7_startTransition: true
    }
  })
}

/**
 * 路由提供者组件
 */
export const AppRouter: React.FC = () => {
  const router = createAppRouter()

  return <RouterProvider router={router} fallbackElement={<PageLoading />} />
}


/**
 * 路由工具函数
 */
export const routerUtils = {
  /**
   * 检查路由是否需要权限
   */
  isProtectedRoute: (path: string): boolean => {
    // 查找路由配置
    const findRoute = (routes: AppRouteObject[], targetPath: string): AppRouteObject | null => {
      for (const route of routes) {
        if (route.path === targetPath) {
          return route
        }
        if (route.children) {
          const found = findRoute(route.children, targetPath)
          if (found) return found
        }
      }
      return null
    }

    const route = findRoute(routes, path)
    return !!(route?.meta?.requireAuth || route?.meta?.permissions?.length)
  },

  /**
   * 获取路由权限要求
   */
  getRoutePermissions: (path: string): string[] => {
    const findRoute = (routes: AppRouteObject[], targetPath: string): AppRouteObject | null => {
      for (const route of routes) {
        if (route.path === targetPath) {
          return route
        }
        if (route.children) {
          const found = findRoute(route.children, targetPath)
          if (found) return found
        }
      }
      return null
    }

    const route = findRoute(routes, path)
    return route?.meta?.permissions || []
  },

  /**
   * 生成面包屑
   */
  generateBreadcrumb: (pathname: string): Array<{ title: string; path?: string }> => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumb: Array<{ title: string; path?: string }> = []

    let currentPath = ''

    for (const segment of pathSegments) {
      currentPath += `/${segment}`

      const findRoute = (routes: AppRouteObject[], targetPath: string): AppRouteObject | null => {
        for (const route of routes) {
          if (route.path === targetPath) {
            return route
          }
          if (route.children) {
            const found = findRoute(route.children, targetPath)
            if (found) return found
          }
        }
        return null
      }

      const route = findRoute(routes, currentPath)

      if (route && !route.meta?.hideBreadcrumb) {
        breadcrumb.push({
          title: route.meta?.breadcrumbTitle || route.meta?.title || segment,
          path: currentPath
        })
      }
    }

    return breadcrumb
  }
}

// 导出配置
export { default as routeConfig, ROUTE_CONSTANTS } from './config'

// 导出路由组件
export { PrivateRoute, LazyRoute, PageLoading, UnauthorizedPage } from './guards'

// 导出路由类型
export type { AppRouteObject, RouteMeta, BreadcrumbItem, MenuItem } from './types'

export default AppRouter
