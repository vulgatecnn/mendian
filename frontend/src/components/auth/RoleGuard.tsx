/**
 * 角色守卫组件
 */

import React from 'react'
import { Result } from 'antd'
import { usePermission } from '../../hooks/usePermission'
import { UserRoleCode } from '../../constants/roles'

export interface RoleGuardProps {
  /** 子组件 */
  children: React.ReactNode
  /** 所需角色 */
  roles: UserRoleCode | UserRoleCode[]
  /** 角色检查模式 */
  mode?: 'any' | 'all'
  /** 无权限时显示的内容 */
  fallback?: React.ReactNode
  /** 无权限时的提示标题 */
  noRoleTitle?: string
  /** 无权限时的提示内容 */
  noRoleSubtitle?: string
}

/**
 * 角色守卫组件
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  mode = 'any',
  fallback,
  noRoleTitle = '角色权限不足',
  noRoleSubtitle = '您的角色无权访问此内容'
}) => {
  const { hasRole, roles: userRoles } = usePermission()

  // 检查角色权限
  const hasRequiredRole = React.useMemo(() => {
    if (!roles) return true

    const requiredRoles = Array.isArray(roles) ? roles : [roles]
    
    if (mode === 'all') {
      return requiredRoles.every(role => hasRole(role))
    } else {
      return requiredRoles.some(role => hasRole(role))
    }
  }, [roles, mode, hasRole])

  // 无权限时显示fallback或默认提示
  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>
    }

    const requiredRoleNames = Array.isArray(roles) 
      ? roles.map(role => role).join(', ')
      : roles

    const userRoleNames = userRoles?.map(role => role.name).join(', ') || '无'

    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Result
          status="403"
          title={noRoleTitle}
          subTitle={
            <div>
              <div>{noRoleSubtitle}</div>
              <div style={{ marginTop: 8, fontSize: 14, color: '#999' }}>
                需要角色: {requiredRoleNames}
              </div>
              <div style={{ fontSize: 14, color: '#999' }}>
                当前角色: {userRoleNames}
              </div>
            </div>
          }
        />
      </div>
    )
  }

  // 有权限时渲染子组件
  return <>{children}</>
}

export default RoleGuard