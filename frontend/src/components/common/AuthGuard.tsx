/**
 * 认证守卫组件 - 用于保护需要登录的内容
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../../hooks/useAuth'

interface AuthGuardProps {
  /** 子组件 */
  children: React.ReactNode
  /** 登录页路径 */
  loginPath?: string
  /** 加载组件 */
  loading?: React.ReactNode
}

/**
 * 认证守卫组件
 * 检查用户登录状态，未登录时重定向到登录页
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  loginPath = '/login',
  loading
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // 显示加载状态
  if (isLoading) {
    return (
      loading || (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}
        >
          <Spin size="large" tip="验证登录状态..." />
        </div>
      )
    )
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // 已登录，渲染子组件
  return <>{children}</>
}

export default AuthGuard
