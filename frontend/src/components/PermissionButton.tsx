/**
 * 权限控制的按钮组件
 */
import React from 'react';
import { Button, ButtonProps, Tooltip } from '@arco-design/web-react';
import { usePermission } from '../hooks/usePermission';

interface PermissionButtonProps extends ButtonProps {
  /** 需要的权限代码 */
  permission?: string;
  /** 需要的权限代码列表（任意一个） */
  anyPermissions?: string[];
  /** 需要的权限代码列表（全部） */
  allPermissions?: string[];
  /** 无权限时的提示文本 */
  noPermissionTooltip?: string;
  /** 无权限时是否隐藏按钮 */
  hideWhenNoPermission?: boolean;
}

/**
 * 权限控制的按钮组件
 * 根据用户权限决定按钮的显示和可用状态
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  noPermissionTooltip = '您没有权限执行此操作',
  hideWhenNoPermission = false,
  children,
  disabled,
  ...buttonProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();

  // 权限加载中时禁用按钮
  if (loading) {
    return (
      <Button {...buttonProps} disabled loading>
        {children}
      </Button>
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

  // 有权限时显示正常按钮
  if (hasAccess) {
    return (
      <Button {...buttonProps} disabled={disabled}>
        {children}
      </Button>
    );
  }

  // 无权限时隐藏按钮
  if (hideWhenNoPermission) {
    return null;
  }

  // 无权限时显示禁用的按钮并添加提示
  return (
    <Tooltip content={noPermissionTooltip}>
      <Button {...buttonProps} disabled>
        {children}
      </Button>
    </Tooltip>
  );
};

export default PermissionButton;