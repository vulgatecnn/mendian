/**
 * 认证和权限控制组件导出
 */

// 使用统一的权限组件
export { PermissionButton, PermissionWrapper } from '../permission'
export { withPermission, usePermissionWrapper, BASIC_DATA_PERMISSIONS } from '../permission'
export { default as RoleGuard } from './RoleGuard'

export type { PermissionButtonProps, PermissionWrapperProps } from '../permission'
export type { RoleGuardProps } from './RoleGuard'