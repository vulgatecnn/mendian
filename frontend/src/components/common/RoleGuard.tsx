/**
 * 角色守卫组件 - 基于角色的内容保护
 */

import React from 'react'
import { Result, Button } from 'antd'
import { useRolePermission } from '../../hooks/usePermission'

interface RoleGuardProps {
  /** 所需角色列表 */
  roles: string[]
  /** 角色检查模式 */
  mode?: 'all' | 'any'
  /** 子组件 */
  children: React.ReactNode
  /** 无权限时的替代内容 */
  fallback?: React.ReactNode
  /** 无权限时是否完全隐藏 */
  hideWhenNoPermission?: boolean
}

/**
 * 角色守卫组件
 * 根据用户角色控制内容的访问
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  mode = 'any',
  children,
  fallback,
  hideWhenNoPermission = false
}) => {
  const { hasAnyRole, hasRole } = useRolePermission()

  const hasRequiredRole = mode === 'all' ? roles.every(role => hasRole(role)) : hasAnyRole(roles)

  if (hasRequiredRole) {
    return <>{children}</>
  }

  if (hideWhenNoPermission) {
    return null
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px'
      }}
    >
      <Result
        status="403"
        title="角色权限不足"
        subTitle={`需要以下角色之一: ${roles.join(', ')}`}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    </div>
  )
}

export default RoleGuard
