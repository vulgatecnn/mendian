/**
 * 权限保护的路由组件
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from '@arco-design/web-react';
import { IconLock } from '@arco-design/web-react/icon';
import { usePermission } from '../hooks/usePermission';

interface ProtectedRouteProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 需要的权限代码 */
  permission?: string;
  /** 需要的权限代码列表（任意一个） */
  anyPermissions?: string[];
  /** 需要的权限代码列表（全部） */
  allPermissions?: string[];
  /** 无权限时重定向的路径 */
  redirectTo?: string;
  /** 是否显示无权限页面而不是重定向 */
  showForbidden?: boolean;
}

/**
 * 权限保护的路由组件
 * 用于保护需要特定权限才能访问的路由
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  redirectTo = '/dashboard',
  showForbidden = true,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();

  // 权限加载中时显示加载状态
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        加载中...
      </div>
    );
  }

  let hasAccess = true;

  // 检查单个权限
  if (permission) {
    hasAccess = hasPermission(permission);
  }

  // 检查任意权限
  if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAccess && hasAnyPermission(anyPermissions);
  }

  // 检查所有权限
  if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAccess && hasAllPermissions(allPermissions);
  }

  // 有权限时显示子组件
  if (hasAccess) {
    return <>{children}</>;
  }

  // 无权限时的处理
  if (showForbidden) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        icon={<IconLock style={{ color: '#f53f3f' }} />}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  // 重定向到指定页面
  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;