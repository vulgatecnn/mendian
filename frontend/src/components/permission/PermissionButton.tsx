/**
 * 统一权限按钮组件
 * 根据权限控制按钮的显示和禁用状态
 */

import React from 'react'
import { Button, Tooltip } from 'antd'
import { usePermissionWrapper } from './PermissionWrapper'
import type { PermissionButtonProps } from './types'

const PermissionButton: React.FC<PermissionButtonProps> = ({
  permissions,
  mode = 'any',
  noPermissionTooltip = '您没有权限执行此操作',
  hideWhenNoPermission = false,
  customCheck,
  onNoPermission,
  children,
  ...buttonProps
}) => {
  // 使用自定义权限检查
  const hasCustomPermission = React.useMemo(() => {
    return customCheck ? customCheck() : null
  }, [customCheck])

  // 使用权限检查hook（仅在没有自定义检查时使用）
  const { hasAccess } = usePermissionWrapper(
    permissions || [],
    mode
  )

  // 最终权限结果
  const hasPermission = hasCustomPermission !== null ? hasCustomPermission : hasAccess

  // 无权限且需要隐藏时，不渲染按钮
  if (!hasPermission && hideWhenNoPermission) {
    return null
  }

  // 无权限时显示禁用按钮和提示
  if (!hasPermission) {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onNoPermission?.()
    }

    return (
      <Tooltip title={noPermissionTooltip}>
        <Button
          {...buttonProps}
          disabled={true}
          onClick={onNoPermission ? handleClick : undefined}
        >
          {children}
        </Button>
      </Tooltip>
    )
  }

  // 有权限时正常显示按钮
  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  )
}

export default PermissionButton