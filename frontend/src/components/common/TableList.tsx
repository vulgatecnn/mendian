/**
 * 表格列表组件 - 统一的表格界面
 */

import React from 'react'
import { Table, Card, Space, Typography, Grid } from 'antd'
import type { TableProps, CardProps } from 'antd'

const { Text } = Typography
const { useBreakpoint } = Grid

interface TableListProps extends Omit<TableProps<any>, 'title'> {
  /** 卡片属性 */
  cardProps?: CardProps
  /** 表格标题 */
  title?: React.ReactNode
  /** 表格额外操作区域 */
  extra?: React.ReactNode
  /** 是否显示卡片包装 */
  showCard?: boolean
  /** 是否显示序号列 */
  showIndex?: boolean
  /** 序号列配置 */
  indexColumnProps?: any
}

const TableList: React.FC<TableListProps> = ({
  cardProps = {},
  title,
  extra,
  showCard = true,
  showIndex = false,
  indexColumnProps = {},
  columns = [],
  ...tableProps
}) => {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  // 序号列配置
  const indexColumn = showIndex
    ? {
        title: '序号',
        key: 'index',
        width: 60,
        fixed: 'left' as const,
        render: (_: any, __: any, index: number) => {
          const { current = 1, pageSize = 10 } = tableProps.pagination || {}
          return (current - 1) * pageSize + index + 1
        },
        ...indexColumnProps
      }
    : null

  // 合并列配置
  const finalColumns = indexColumn ? [indexColumn, ...columns] : columns

  // 表格头部
  const TableHeader = (title || extra) && (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: 16
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            flex: 1,
            minWidth: 0
          }}
        >
          {title}
        </div>
      )}
      
      {extra && (
        <div
          style={{
            flexShrink: 0,
            width: isMobile && title ? '100%' : 'auto'
          }}
        >
          {extra}
        </div>
      )}
    </div>
  )

  // 默认分页配置
  const defaultPagination = {
    showSizeChanger: true,
    showQuickJumper: !isMobile,
    showTotal: (total: number, range: [number, number]) =>
      `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50', '100'],
    ...tableProps.pagination
  }

  // 表格配置
  const tableConfig: TableProps<any> = {
    size: isMobile ? 'small' : 'middle',
    scroll: { x: 'max-content' },
    pagination: tableProps.pagination === false ? false : defaultPagination,
    ...tableProps,
    columns: finalColumns
  }

  // 移动端优化
  if (isMobile) {
    tableConfig.size = 'small'
    // 移动端隐藏一些不重要的列
    tableConfig.columns = finalColumns.map((col: any) => ({
      ...col,
      width: col.width || 120
    }))
  }

  const TableComponent = (
    <div>
      {TableHeader}
      <Table {...tableConfig} />
    </div>
  )

  if (!showCard) {
    return TableComponent
  }

  return (
    <Card
      bordered={false}
      style={{
        boxShadow: isMobile
          ? 'none'
          : '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)'
      }}
      bodyStyle={{
        padding: isMobile ? 12 : 24
      }}
      {...cardProps}
    >
      {TableComponent}
    </Card>
  )
}

// 表格操作按钮组件
interface TableActionsProps {
  /** 操作按钮配置 */
  actions: Array<{
    key: string
    label: string
    type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
    danger?: boolean
    disabled?: boolean
    loading?: boolean
    onClick?: (record?: any) => void
  }>
  /** 当前记录数据 */
  record?: any
  /** 最大显示数量 */
  maxCount?: number
}

export const TableActions: React.FC<TableActionsProps> = ({
  actions,
  record,
  maxCount = 3
}) => {
  const visibleActions = actions.slice(0, maxCount)
  const hiddenActions = actions.slice(maxCount)

  if (actions.length <= maxCount) {
    return (
      <Space size="small">
        {visibleActions.map((action) => (
          <Typography.Link
            key={action.key}
            disabled={action.disabled ?? false}
            onClick={() => action.onClick?.(record)}
            style={{
              color: action.danger ? '#ff4d4f' : undefined
            }}
          >
            {action.label}
          </Typography.Link>
        ))}
      </Space>
    )
  }

  // 如果操作太多，显示更多菜单
  return (
    <Space size="small">
      {visibleActions.map((action) => (
        <Typography.Link
          key={action.key}
          disabled={action.disabled ?? false}
          onClick={() => action.onClick?.(record)}
          style={{
            color: action.danger ? '#ff4d4f' : undefined
          }}
        >
          {action.label}
        </Typography.Link>
      ))}
      {hiddenActions.length > 0 && <Text type="secondary">更多</Text>}
    </Space>
  )
}

export default TableList