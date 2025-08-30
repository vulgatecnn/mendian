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

  // 现代化移动端卡片渲染
  const defaultMobileCardRender = (record: T, index: number) => {
    const titleColumn = keyColumns[0] as any
    const title = titleColumn 
      ? typeof titleColumn.render === 'function'
        ? titleColumn.render(record[titleColumn.dataIndex as string], record, index)
        : record[titleColumn.dataIndex as string]
      : `Item ${index + 1}`

    // 获取状态信息（如果存在）
    const statusColumn = columns.find(col => {
      const colAny = col as any
      return col.key === 'status' || colAny.dataIndex === 'status'
    }) as any
    const status = statusColumn ? record[statusColumn.dataIndex as string] : null

    // 获取优先级信息（如果存在）
    const priorityColumn = columns.find(col => {
      const colAny = col as any
      return col.key === 'priority' || colAny.dataIndex === 'priority'
    }) as any
    const priority = priorityColumn ? record[priorityColumn.dataIndex as string] : null

    return (
      <div className={`modern-list-item interactive-card mobile-card-enter touch-feedback-light`}>
        <div className="list-item-content">
          {/* 卡片头部 */}
          <div className="list-item-header">
            <h4 className="list-item-title">{title}</h4>
            <div style={{ display: 'flex', gap: 'var(--spacing-mobile-xs)', alignItems: 'center' }}>
              {priority === 'urgent' && (
                <span className="modern-status-tag urgent" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  紧急
                </span>
              )}
              {status && (
                <span className={`modern-status-tag ${status.toLowerCase()}`}>
                  {statusColumn?.render?.(status, record, index) || status}
                </span>
              )}
            </div>
          </div>

          {/* 主要字段信息 */}
          <div className="list-item-description">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 'var(--spacing-mobile-sm)',
              marginBottom: 'var(--spacing-mobile-sm)'
            }}>
              {columns
                .filter(col => {
                  const colAny = col as any
                  return col !== titleColumn && 
                         col !== statusColumn && 
                         col !== priorityColumn &&
                         colAny.dataIndex !== 'action' &&
                         !colAny.hideOnMobile
                })
                .slice(0, 4) // 显示前4个字段
                .map(col => {
                  const colAny = col as any
                  const value = record[colAny.dataIndex as string]
                  const displayValue = typeof colAny.render === 'function'
                    ? colAny.render(value, record, index)
                    : value

                  return (
                    <div key={col.key || colAny.dataIndex as string} style={{
                      background: 'rgba(248, 249, 251, 0.6)',
                      padding: 'var(--spacing-mobile-xs) var(--spacing-mobile-sm)',
                      borderRadius: 'var(--border-radius-mobile-sm)',
                      border: '1px solid var(--border-tertiary)'
                    }}>
                      <div style={{ 
                        fontSize: 'var(--font-size-mobile-xs)', 
                        color: 'var(--text-tertiary)',
                        marginBottom: '2px',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {colAny.title}
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-mobile-sm)',
                        color: 'var(--text-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {displayValue || '-'}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* 元数据信息 */}
          <div className="list-item-meta">
            {/* 创建时间 */}
            {record.createdAt && (
              <div className="meta-item">
                <span>📅</span>
                <span>{new Date(record.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            
            {/* 更新时间 */}
            {record.updatedAt && (
              <div className="meta-item">
                <span>⏰</span>
                <span>{new Date(record.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* 操作区域 */}
        {mobileActions && (
          <div className="list-item-actions">
            {mobileActions(record, index)}
          </div>
        )}
      </div>
    )
  }

  // 现代化移动端列表项渲染（紧凑模式）
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

    // 获取状态和优先级信息
    const statusColumn = columns.find(col => {
      const colAny = col as any
      return col.key === 'status' || colAny.dataIndex === 'status'
    }) as any
    const status = statusColumn ? record[statusColumn.dataIndex as string] : null

    return (
      <div className="modern-list-item touch-feedback-light mobile-fade-in-up">
        <div className="list-item-content">
          {/* 紧凑头部 */}
          <div className="list-item-header">
            <h4 className="list-item-title" style={{ fontSize: 'var(--font-size-mobile-sm)' }}>
              {title}
            </h4>
            <div style={{ display: 'flex', gap: 'var(--spacing-mobile-xs)', alignItems: 'center' }}>
              {status && (
                <span className={`modern-status-tag ${status.toLowerCase()}`} style={{ 
                  fontSize: '9px', 
                  padding: '1px 4px' 
                }}>
                  {statusColumn?.render?.(status, record, index) || status}
                </span>
              )}
              <div style={{ fontSize: 'var(--font-size-mobile-xs)', color: 'var(--text-tertiary)' }}>
                #{index + 1}
              </div>
            </div>
          </div>

          {/* 关键信息概览 */}
          <div className="list-item-description">
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-mobile-md)',
              flexWrap: 'wrap',
              marginBottom: 'var(--spacing-mobile-xs)'
            }}>
              {columns
                .filter(col => {
                  const colAny = col as any
                  return col !== titleColumn && 
                         col !== statusColumn &&
                         colAny.dataIndex !== 'action' &&
                         !colAny.hideOnMobile
                })
                .slice(0, 2) // 紧凑模式只显示2个关键字段
                .map(col => {
                  const colAny = col as any
                  const value = record[colAny.dataIndex as string]
                  const displayValue = typeof colAny.render === 'function'
                    ? colAny.render(value, record, index)
                    : value

                  return (
                    <div key={col.key || colAny.dataIndex as string} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-mobile-xs)',
                      fontSize: 'var(--font-size-mobile-xs)',
                      color: 'var(--text-secondary)'
                    }}>
                      <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        {colAny.title}:
                      </span>
                      <span>{displayValue || '-'}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* 展开的详细信息 */}
          <Collapse ghost size="small" className="mobile-details-collapse">
            <Collapse.Panel 
              header={<span style={{ fontSize: 'var(--font-size-mobile-xs)', color: 'var(--text-tertiary)' }}>查看详情</span>} 
              key="details"
              showArrow={true}
            >
              <div style={{ 
                display: 'grid', 
                gap: 'var(--spacing-mobile-xs)',
                paddingTop: 'var(--spacing-mobile-xs)'
              }}>
                {columns
                  .filter(col => {
                    const colAny = col as any
                    return col !== titleColumn && 
                           col !== statusColumn &&
                           colAny.dataIndex !== 'action' &&
                           !colAny.hideOnMobile
                  })
                  .slice(2) // 显示其余字段
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
                        padding: 'var(--spacing-mobile-xs) 0',
                        borderBottom: '1px solid var(--border-tertiary)',
                        fontSize: 'var(--font-size-mobile-xs)'
                      }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                          {colAny.title}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {displayValue || '-'}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </Collapse.Panel>
          </Collapse>
        </div>

        {/* 操作区域 */}
        {actions && (
          <div className="list-item-actions" style={{ padding: 'var(--spacing-mobile-xs) var(--spacing-mobile-md)' }}>
            <div className="action-btn" style={{ 
              display: 'flex', 
              justifyContent: 'center',
              fontSize: 'var(--font-size-mobile-xs)'
            }}>
              {actions}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 移动端渲染
  if (shouldUseMobileLayout) {
    if (mobileCardLayout) {
      // 现代化卡片网格布局
      return (
        <div className={classNames('modern-mobile-grid', className)}>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: cardsPerRow === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap: 'var(--spacing-mobile-sm)',
              padding: 'var(--spacing-mobile-sm)'
            }}
          >
            {(dataSource || []).map((record, index) => (
              <div 
                key={record.key || index}
                className="mobile-slide-in-right"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                {mobileCardRender 
                  ? mobileCardRender(record, index)
                  : defaultMobileCardRender(record, index)
                }
              </div>
            ))}
          </div>
          
          {/* 移动端分页 */}
          {mobilePagination && tableProps.pagination && (
            <div style={{ 
              padding: 'var(--spacing-mobile-md)',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: 'var(--border-radius-mobile-2xl)',
                padding: 'var(--spacing-mobile-xs)',
                boxShadow: 'var(--shadow-mobile-sm)',
                display: 'flex',
                gap: 'var(--spacing-mobile-xs)',
                alignItems: 'center'
              }}>
                <button 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--color-primary-500)',
                    color: 'white',
                    fontSize: 'var(--font-size-mobile-sm)'
                  }}
                >
                  ←
                </button>
                <span style={{ 
                  fontSize: 'var(--font-size-mobile-sm)',
                  color: 'var(--text-secondary)',
                  padding: '0 var(--spacing-mobile-sm)'
                }}>
                  1 / 10
                </span>
                <button 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--color-primary-500)',
                    color: 'white',
                    fontSize: 'var(--font-size-mobile-sm)'
                  }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )
    } else {
      // 现代化列表布局
      return (
        <div className={classNames('modern-mobile-list', className)}>
          <div style={{ padding: 'var(--spacing-mobile-sm)' }}>
            {(dataSource || []).map((record, index) => (
              <div 
                key={record.key || index}
                className="mobile-fade-in-up"
                style={{ 
                  animationDelay: `${index * 30}ms`,
                  animationFillMode: 'both'
                }}
              >
                {mobileItemRender 
                  ? mobileItemRender(record, index)
                  : defaultMobileItemRender(record, index)
                }
              </div>
            ))}
          </div>

          {/* 现代化分页控件 */}
          {mobilePagination && tableProps.pagination && (
            <div style={{
              position: 'sticky',
              bottom: 0,
              background: 'var(--mobile-nav-bg)',
              backdropFilter: 'var(--mobile-nav-backdrop)',
              padding: 'var(--spacing-mobile-sm)',
              borderTop: '1px solid var(--border-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ 
                fontSize: 'var(--font-size-mobile-xs)',
                color: 'var(--text-tertiary)'
              }}>
                共 {tableProps.pagination.total || 0} 条
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-mobile-xs)' }}>
                <button className="modern-pagination-btn">上一页</button>
                <button className="modern-pagination-btn">下一页</button>
              </div>
            </div>
          )}
        </div>
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