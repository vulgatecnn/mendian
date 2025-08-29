/**
 * 虚拟滚动列表组件
 * 用于优化大型列表的性能，只渲染可见区域的项目
 */
import React, { useState, useMemo, useCallback, CSSProperties } from 'react'

export interface VirtualListProps<T = any> {
  /** 数据源 */
  data: T[]
  /** 每项的高度，支持固定高度或动态计算函数 */
  itemHeight: number | ((item: T, index: number) => number)
  /** 列表容器高度 */
  height: number
  /** 渲染项的函数 */
  renderItem: (item: T, index: number) => React.ReactNode
  /** 列表项的key生成函数 */
  getItemKey: (item: T, index: number) => string | number
  /** 预渲染的额外项目数量（上下各增加多少项） */
  overscan?: number
  /** 滚动事件节流时间（毫秒） */
  throttleTime?: number
  /** 容器样式 */
  style?: CSSProperties
  /** 容器类名 */
  className?: string
  /** 空数据时显示的内容 */
  emptyRender?: () => React.ReactNode
  /** 滚动回调 */
  onScroll?: (scrollTop: number) => void
}

/**
 * 虚拟滚动列表组件
 */
export function VirtualList<T = any>({
  data,
  itemHeight,
  height,
  renderItem,
  getItemKey,
  overscan = 5,
  throttleTime = 16,
  style,
  className,
  emptyRender,
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)

  // 计算每项高度的函数
  const getItemHeightFunc = useCallback(
    (item: T, index: number) => {
      return typeof itemHeight === 'number' ? itemHeight : itemHeight(item, index)
    },
    [itemHeight]
  )

  // 计算总高度和每项的偏移位置
  const { totalHeight, itemOffsets } = useMemo(() => {
    let totalHeight = 0
    const itemOffsets: number[] = []

    for (let i = 0; i < data.length; i++) {
      itemOffsets[i] = totalHeight
      const item = data[i]
      if (item !== undefined) {
        totalHeight += getItemHeightFunc(item, i)
      }
    }

    return { totalHeight, itemOffsets }
  }, [data, getItemHeightFunc])

  // 计算可见范围
  const visibleRange = useMemo(() => {
    if (!data.length) return { start: 0, end: 0 }

    let start = 0
    let end = data.length - 1

    // 二分查找起始位置
    for (let i = 0; i < itemOffsets.length; i++) {
      const item = data[i]
      const offset = itemOffsets[i]
      if (item !== undefined && offset !== undefined && offset + getItemHeightFunc(item, i) > scrollTop) {
        start = Math.max(0, i - overscan)
        break
      }
    }

    // 查找结束位置
    const visibleHeight = height
    for (let i = start; i < data.length; i++) {
      const offset = itemOffsets[i]
      if (offset !== undefined && offset > scrollTop + visibleHeight) {
        end = Math.min(data.length - 1, i + overscan)
        break
      }
    }

    return { start, end }
  }, [data, itemOffsets, scrollTop, height, overscan, getItemHeightFunc])

  // 可见项目
  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => {
      const actualIndex = visibleRange.start + index
      return {
        item,
        index: actualIndex,
        key: getItemKey(item, actualIndex),
        top: itemOffsets[actualIndex],
        height: getItemHeightFunc(item, actualIndex)
      }
    })
  }, [data, visibleRange, getItemKey, itemOffsets, getItemHeightFunc])

  // 节流滚动处理
  const throttledScrollHandler = useCallback(
    (() => {
      let lastTime = 0
      return (event: Event) => {
        const now = Date.now()
        if (now - lastTime >= throttleTime) {
          lastTime = now
          const target = event.target as HTMLElement
          const newScrollTop = target.scrollTop
          setScrollTop(newScrollTop)
          onScroll?.(newScrollTop)
        }
      }
    })(),
    [throttleTime, onScroll]
  )

  // 绑定滚动事件
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // 使用安全的事件监听器
      node.addEventListener('scroll', throttledScrollHandler, { passive: true })
      return () => {
        node.removeEventListener('scroll', throttledScrollHandler)
      }
    }
    return undefined
  }, [throttledScrollHandler])

  // 如果数据为空
  if (!data.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        className={className}
      >
        {emptyRender ? emptyRender() : '暂无数据'}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        height,
        overflowY: 'auto',
        ...style
      }}
      className={className}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map(({ item, index, key, top, height: itemHeight }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 虚拟表格组件（基于VirtualList）
 */
interface VirtualTableProps<T = any> extends Omit<VirtualListProps<T>, 'renderItem'> {
  /** 表格列配置 */
  columns: Array<{
    key: string
    title: string
    dataIndex?: string
    render?: (value: any, record: T, index: number) => React.ReactNode
    width?: number | string
    align?: 'left' | 'center' | 'right'
  }>
  /** 行的样式 */
  rowStyle?: (record: T, index: number) => CSSProperties
  /** 行的类名 */
  rowClassName?: (record: T, index: number) => string
  /** 行点击事件 */
  onRowClick?: (record: T, index: number) => void
}

export function VirtualTable<T = any>({
  columns,
  rowStyle,
  rowClassName,
  onRowClick,
  ...virtualListProps
}: VirtualTableProps<T>) {
  const renderTableRow = useCallback((record: T, index: number) => {
    const handleRowClick = () => {
      onRowClick?.(record, index)
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          padding: '8px 0',
          cursor: onRowClick ? 'pointer' : 'default',
          ...rowStyle?.(record, index)
        }}
        className={rowClassName?.(record, index)}
        onClick={handleRowClick}
      >
        {columns.map(column => {
          const value = column.dataIndex ? (record as any)[column.dataIndex] : record
          const cellContent = column.render ? column.render(value, record, index) : value

          return (
            <div
              key={column.key}
              style={{
                flex: column.width ? `0 0 ${column.width}` : 1,
                padding: '0 8px',
                textAlign: column.align || 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {cellContent}
            </div>
          )
        })}
      </div>
    )
  }, [columns, rowStyle, rowClassName, onRowClick])

  return (
    <div>
      {/* 表头 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fafafa',
          borderBottom: '2px solid #f0f0f0',
          padding: '12px 0',
          fontWeight: 500
        }}
      >
        {columns.map(column => (
          <div
            key={column.key}
            style={{
              flex: column.width ? `0 0 ${column.width}` : 1,
              padding: '0 8px',
              textAlign: column.align || 'left'
            }}
          >
            {column.title}
          </div>
        ))}
      </div>

      {/* 虚拟滚动表格体 */}
      <VirtualList
        {...virtualListProps}
        renderItem={renderTableRow}
      />
    </div>
  )
}