/**
 * 路由守卫组件
 */

import React, { Suspense, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin, Result, Button } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { usePermission } from '../hooks/usePermission'
import { authService } from '../services/authService'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  permissions?: string[]
  permissionMode?: 'all' | 'any'
}

/**
 * 路由守卫组件
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  permissions = [],
  permissionMode = 'any'
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const { checkPermission } = usePermission()
  const location = useLocation()

  // 自动刷新Token
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isAuthenticated) {
      // 每5分钟检查一次Token状态
      interval = setInterval(async () => {
        try {
          await authService.autoRefreshTokenIfNeeded()
        } catch (error) {
          console.error('Auto refresh token failed:', error)
          // Token刷新失败，跳转登录页
          window.location.href = '/login'
        }
      }, 5 * 60 * 1000) // 5分钟
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isAuthenticated])

  // 认证检查
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 加载状态
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <Spin size="large" tip="系统加载中..." />
      </div>
    )
  }

  // 权限检查
  if (permissions.length > 0) {
    const permissionResult = checkPermission(permissions, permissionMode)

    if (!permissionResult.hasPermission) {
      return (
        <UnauthorizedPage
          missingPermissions={permissionResult.missingPermissions}
          requiredPermissions={permissionResult.requiredPermissions}
        />
      )
    }
  }

  return <>{children}</>
}

/**
 * 私有路由组件
 */
export const PrivateRoute: React.FC<{
  children: React.ReactNode
  permissions?: string[]
  permissionMode?: 'all' | 'any'
}> = ({ children, permissions, permissionMode }) => {
  return (
    <RouteGuard
      requireAuth={true}
      {...(permissions && { permissions })}
      {...(permissionMode && { permissionMode })}
    >
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </RouteGuard>
  )
}

/**
 * 权限路由组件
 */
export const PermissionRoute: React.FC<{
  children: React.ReactNode
  permissions: string[]
  mode?: 'all' | 'any'
  fallback?: React.ReactNode
}> = ({ children, permissions, mode = 'any', fallback }) => {
  const { checkPermission } = usePermission()

  const permissionResult = checkPermission(permissions, mode)

  if (!permissionResult.hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <UnauthorizedPage
        missingPermissions={permissionResult.missingPermissions}
        requiredPermissions={permissionResult.requiredPermissions}
      />
    )
  }

  return <>{children}</>
}

/**
 * 懒加载路由组件
 */
export const LazyRoute: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>
}

/**
 * 页面加载组件
 */
export const PageLoading: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        minHeight: '200px'
      }}
    >
      <Spin size="large" tip="页面加载中..." />
    </div>
  )
}

/**
 * 无权限页面组件
 */
export const UnauthorizedPage: React.FC<{
  missingPermissions?: string[]
  requiredPermissions?: string[]
}> = ({ missingPermissions, requiredPermissions }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: '400px'
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={
          <div>
            {missingPermissions && missingPermissions.length > 0 && (
              <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
                缺少权限: {missingPermissions.join(', ')}
              </div>
            )}
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          </div>
        }
      />
    </div>
  )
}

/**
 * 路由权限HOC
 */
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permissions: string[],
  mode: 'all' | 'any' = 'any'
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const componentProps = { ...props } as P & { ref?: any }
    if (ref) {
      componentProps.ref = ref
    }
    return (
      <PermissionRoute permissions={permissions} mode={mode}>
        <Component {...componentProps} />
      </PermissionRoute>
    )
  })
}

/**
 * 路由认证HOC
 */
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return React.forwardRef<any, P>((props, ref) => {
    const componentProps = { ...props } as P & { ref?: any }
    if (ref) {
      componentProps.ref = ref
    }
    return (
      <PrivateRoute>
        <Component {...componentProps} />
      </PrivateRoute>
    )
  })
}
