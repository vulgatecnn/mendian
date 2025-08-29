/**
 * 自适应表格组件
 */

import React, { useMemo } from 'react'
import { Table, Card, List, Space, Collapse } from 'antd'
import type { TableProps, ColumnsType } from 'antd/es/table'
import { useMobile, useBreakpoint } from '../../hooks/useDevice'
import classNames from 'classnames'

const { Panel } = Collapse

interface AdaptiveTableProps<T = any> extends Omit<TableProps<T>, 'columns'> {
  /** 表格列定义 */
  columns: ColumnsType<T>
  /** 移动端卡片渲染函数 */
  mobileCardRender?: (record: T, index: number) => React.ReactNode
  /** 移动端列表项渲染函数 */
  mobileItemRender?: (record: T, index: number) => React.ReactNode
  /** 移动端是否使用卡片布局 */
  mobileCardLayout?: boolean
  /** 移动端每行显示的卡片数量 */
  cardsPerRow?: number
  /** 移动端是否显示分页 */
  mobilePagination?: boolean
  /** 移动端操作按钮 */
  mobileActions?: (record: T, index: number) => React.ReactNode
  /** 强制使用移动端布局 */
  forceMobile?: boolean
}

export function AdaptiveTable<T extends Record<string, any>>({
  columns,
  dataSource,
  mobileCardRender,
  mobileItemRender,
  mobileCardLayout = false,
  cardsPerRow = 1,
  mobilePagination = true,
  mobileActions,
  forceMobile = false,
  className,
  ...tableProps
}: AdaptiveTableProps<T>) {
  const isMobile = useMobile()
  const { xs, sm } = useBreakpoint()
  const shouldUseMobileLayout = forceMobile || isMobile || xs

  // 提取关键列用于移动端显示
  const keyColumns = useMemo(() => {
    return columns.filter(col => {
      const columnType = col as any
      return col.key === 'title' || 
        col.key === 'name' || 
        columnType.dataIndex === 'title' || 
        columnType.dataIndex === 'name' ||
        columnType.primary
    })
  }, [columns])

  // 默认移动端卡片渲染
  const defaultMobileCardRender = (record: T, index: number) => {
    const titleColumn = keyColumns[0] as any
    const title = titleColumn 
      ? typeof titleColumn.render === 'function'
        ? titleColumn.render(record[titleColumn.dataIndex as string], record, index)
        : record[titleColumn.dataIndex as string]
      : `Item ${index + 1}`

    return (
      <Card
        size="small"
        className="adaptive-table-mobile-card"
        actions={mobileActions ? [mobileActions(record, index)] : []}
      >
        <Card.Meta
          title={title}
          description={
            <Space direction="vertical" size="small">
              {columns
                .filter(col => {
                  const colAny = col as any
                  return col !== titleColumn && colAny.dataIndex !== 'action'
                })
                .slice(0, 3) // 只显示前3个字段
                .map(col => {
                  const colAny = col as any
                  const value = record[colAny.dataIndex as string]
                  const displayValue = typeof colAny.render === 'function'
                    ? colAny.render(value, record, index)
                    : value

                  return (
                    <div key={col.key || colAny.dataIndex as string}>
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        {colAny.title}:
                      </span>
                      <span style={{ marginLeft: '8px' }}>
                        {displayValue}
                      </span>
                    </div>
                  )
                })}
            </Space>
          }
        />
      </Card>
    )
  }

  // 默认移动端列表项渲染
  const defaultMobileItemRender = (record: T, index: number) => {
    const titleColumn = keyColumns[0] as any
    const title = titleColumn 
      ? typeof titleColumn.render === 'function'
        ? titleColumn.render(record[titleColumn.dataIndex as string], record, index)
        : record[titleColumn.dataIndex as string]
      : `Item ${index + 1}`

    const actionColumn = columns.find(col => {
      const colAny = col as any
      return col.key === 'action' || colAny.dataIndex === 'action'
    }) as any
    const actions = actionColumn?.render?.(null, record, index)

    return (
      <List.Item
        className="adaptive-table-mobile-item"
        actions={actions ? [actions] : []}
      >
        <List.Item.Meta
          title={title}
          description={
            <Collapse ghost>
              <Panel header="详细信息" key="details" showArrow={false}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {columns
                    .filter(col => {
                      const colAny = col as any
                      return col !== titleColumn && col.key !== 'action' && colAny.dataIndex !== 'action'
                    })
                    .map(col => {
                      const colAny = col as any
                      const value = record[colAny.dataIndex as string]
                      const displayValue = typeof colAny.render === 'function'
                        ? colAny.render(value, record, index)
                        : value

                      return (
                        <div key={col.key || colAny.dataIndex as string} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '4px 0',
                          borderBottom: '1px solid #f5f5f5'
                        }}>
                          <span style={{ color: '#666', fontSize: '14px', fontWeight: 500 }}>
                            {colAny.title}
                          </span>
                          <span>
                            {displayValue}
                          </span>
                        </div>
                      )
                    })}
                </Space>
              </Panel>
            </Collapse>
          }
        />
      </List.Item>
    )
  }

  // 移动端渲染
  if (shouldUseMobileLayout) {
    if (mobileCardLayout) {
      // 卡片网格布局
      return (
        <div 
          className={classNames(
            'adaptive-table-mobile-grid',
            `adaptive-table-mobile-grid--${cardsPerRow}`,
            className
          )}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)`,
            gap: '12px'
          }}
        >
          {(dataSource || []).map((record, index) => (
            <div key={record.key || index}>
              {mobileCardRender 
                ? mobileCardRender(record, index)
                : defaultMobileCardRender(record, index)
              }
            </div>
          ))}
        </div>
      )
    } else {
      // 列表布局
      return (
        <List
          className={classNames('adaptive-table-mobile-list', className)}
          dataSource={dataSource}
          pagination={mobilePagination ? {
            ...tableProps.pagination,
            simple: true,
            showSizeChanger: false
          } : false}
          renderItem={(record, index) => 
            mobileItemRender 
              ? mobileItemRender(record, index)
              : defaultMobileItemRender(record, index)
          }
        />
      )
    }
  }

  // 桌面端表格渲染
  const adaptiveColumns = useMemo(() => {
    if (sm && !isMobile) {
      // 平板端，隐藏部分列
      return columns.filter(col => 
        (col as any).hideOnTablet !== true
      )
    }
    return columns
  }, [columns, sm, isMobile])

  return (
    <Table
      {...tableProps}
      columns={adaptiveColumns}
      dataSource={dataSource}
      className={classNames('adaptive-table', className)}
      scroll={{
        x: shouldUseMobileLayout ? undefined : 'max-content',
        ...tableProps.scroll
      }}
    />
  )
}

export default AdaptiveTable