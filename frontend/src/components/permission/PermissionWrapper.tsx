/**
 * 统一权限包装组件
 * 整合所有权限检查功能和显示逻辑
 */

import React from 'react'
import { Result, Spin, Button, Space } from 'antd'
import { LockOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/hooks/useAuth'
import type { PermissionWrapperProps, PermissionMode } from './types'

/**
 * 权限包装组件
 */
const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  permissions,
  mode = 'any',
  fallback,
  loading,
  noPermissionTitle = '访问受限',
  noPermissionSubtitle = '您没有权限访问此内容',
  showMissingPermissions = true,
  showFeedback = true,
  customCheck
}) => {
  const { checkPermission, loading: permissionLoading } = usePermission()
  const { user, isAuthenticated } = useAuth()

  // 权限检查逻辑
  const permissionResult = React.useMemo(() => {
    // 自定义权限检查
    if (customCheck) {
      return {
        hasPermission: customCheck(),
        missingPermissions: [],
        requiredPermissions: [],
        userPermissions: []
      }
    }

    // 未登录
    if (!isAuthenticated || !user) {
      return {
        hasPermission: false,
        missingPermissions: [],
        requiredPermissions: [],
        userPermissions: []
      }
    }

    // 超级管理员直接通过
    if (user.roles?.some(role => role.code === 'SUPER_ADMIN')) {
      return {
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: [],
        userPermissions: []
      }
    }

    // 无权限要求时直接通过
    if (!permissions) {
      return {
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: [],
        userPermissions: []
      }
    }

    // 执行权限检查
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
    return checkPermission(permissionArray, mode)
  }, [permissions, mode, checkPermission, customCheck, isAuthenticated, user])

  // 加载状态
  if (permissionLoading) {
    return loading || (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Spin tip="权限检查中..." />
      </div>
    )
  }

  // 有权限时渲染子组件
  if (permissionResult.hasPermission) {
    return <>{children}</>
  }

  // 无权限时的处理
  if (fallback) {
    return <>{fallback}</>
  }

  // 显示权限提示
  if (showFeedback) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Result
          status="403"
          title={noPermissionTitle}
          icon={<LockOutlined />}
          subTitle={
            <div>
              <div>{noPermissionSubtitle}</div>
              {showMissingPermissions && permissionResult.missingPermissions.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 14, color: '#999' }}>
                  缺少权限: {permissionResult.missingPermissions.join(', ')}
                </div>
              )}
              {permissions && (
                <div style={{ marginTop: 8 }}>
                  <Space direction="vertical">
                    <div>
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                      <span style={{ marginLeft: 8 }}>
                        需要权限：{Array.isArray(permissions) ? permissions.join(', ') : permissions}
                      </span>
                    </div>
                    <Button type="primary" onClick={() => window.history.back()}>
                      返回上一页
                    </Button>
                  </Space>
                </div>
              )}
            </div>
          }
        />
      </div>
    )
  }

  // 静默处理，不渲染任何内容
  return null
}

/**
 * 权限高阶组件
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissions: string | string[],
  options?: Omit<PermissionWrapperProps, 'children' | 'permissions'>
) {
  return function PermissionComponent(props: P) {
    return (
      <PermissionWrapper permissions={permissions} {...options}>
        <Component {...props} />
      </PermissionWrapper>
    )
  }
}

/**
 * 权限Hook
 */
export function usePermissionWrapper(
  permissions: string | string[],
  mode: PermissionMode = 'any'
) {
  const { checkPermission } = usePermission()
  const { user, isAuthenticated } = useAuth()

  const permissionResult = React.useMemo(() => {
    if (!isAuthenticated || !user) {
      return { hasAccess: false, missingPermissions: [] }
    }

    if (user.roles?.some(role => role.code === 'SUPER_ADMIN')) {
      return { hasAccess: true, missingPermissions: [] }
    }

    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
    const result = checkPermission(permissionArray, mode)
    
    return {
      hasAccess: result.hasPermission,
      missingPermissions: result.missingPermissions
    }
  }, [permissions, mode, checkPermission, isAuthenticated, user])

  return {
    hasAccess: permissionResult.hasAccess,
    missingPermissions: permissionResult.missingPermissions,
    user,
    isAuthenticated
  }
}

export default PermissionWrapper