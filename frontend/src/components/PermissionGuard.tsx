/**
 * 权限守卫组件 - 根据权限显示/隐藏内容
 */
import React, { ReactNode } from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';

interface PermissionGuardProps {
  /** 子组件 */
  children: ReactNode;
  /** 需要的权限代码 */
  permission?: string;
  /** 需要的权限代码列表（任意一个） */
  anyPermissions?: string[];
  /** 需要的权限代码列表（全部） */
  allPermissions?: string[];
  /** 无权限时显示的内容 */
  fallback?: ReactNode;
  /** 是否在无权限时显示fallback，默认为false（不显示任何内容） */
  showFallback?: boolean;
}

/**
 * 权限守卫组件
 * 根据用户权限决定是否显示子组件
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  showFallback = false,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissionContext();

  // 权限加载中时不显示内容
  if (loading) {
    return null;
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

  // 无权限时根据配置显示fallback或不显示
  return showFallback ? <>{fallback}</> : null;
};

export default PermissionGuard;