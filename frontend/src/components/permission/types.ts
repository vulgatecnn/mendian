/**
 * 权限组件类型定义
 */
import React from 'react'
import type { ButtonProps } from 'antd'

export type PermissionMode = 'any' | 'all' | 'strict' | 'loose'

export interface PermissionWrapperProps {
  /** 子组件 */
  children: React.ReactNode
  /** 所需权限 */
  permissions?: string | string[]
  /** 权限检查模式 */
  mode?: PermissionMode
  /** 无权限时显示的内容 */
  fallback?: React.ReactNode
  /** 加载中显示的内容 */
  loading?: React.ReactNode
  /** 无权限时的提示标题 */
  noPermissionTitle?: string
  /** 无权限时的提示内容 */
  noPermissionSubtitle?: string
  /** 是否显示缺失的权限信息 */
  showMissingPermissions?: boolean
  /** 是否显示权限提示 */
  showFeedback?: boolean
  /** 自定义权限检查逻辑 */
  customCheck?: () => boolean
}

export interface PermissionButtonProps extends Omit<ButtonProps, 'disabled'> {
  /** 所需权限 */
  permissions?: string | string[]
  /** 权限检查模式 */
  mode?: PermissionMode
  /** 无权限时的提示文本 */
  noPermissionTooltip?: string
  /** 是否在无权限时隐藏按钮 */
  hideWhenNoPermission?: boolean
  /** 自定义权限检查逻辑 */
  customCheck?: () => boolean
}