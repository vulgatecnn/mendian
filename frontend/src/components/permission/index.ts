/**
 * 统一权限组件系统
 * 整合所有权限相关组件和功能
 */

export { default as PermissionWrapper } from './PermissionWrapper'
export { default as PermissionButton } from './PermissionButton'
export { withPermission } from './PermissionWrapper'
export { usePermissionWrapper } from './PermissionWrapper'
export { BASIC_DATA_PERMISSIONS } from './constants'
export type { PermissionWrapperProps, PermissionButtonProps } from './types'