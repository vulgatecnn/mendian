/**
 * 虚拟滚动列表组件
 * 用于优化大列表的渲染性能
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './VirtualList.css';

interface VirtualListProps<T> {
  // 数据源
  data: T[];
  // 每项的高度（固定高度）
  itemHeight: number;
  // 容器高度
  containerHeight: number;
  // 渲染每一项的函数
  renderItem: (item: T, index: number) => React.ReactNode;
  // 缓冲区大小（在可见区域外渲染的项数）
  overscan?: number;
  // 唯一键提取函数
  getItemKey?: (item: T, index: number) => string | number;
  // 加载更多回调
  onLoadMore?: () => void;
  // 是否正在加载
  loading?: boolean;
  // 空状态渲染
  emptyRender?: () => React.ReactNode;
}

function VirtualList<T>({
  data,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  getItemKey,
  onLoadMore,
  loading = false,
  emptyRender,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggered = useRef(false);

  // 计算总高度
  const totalHeight = useMemo(() => {
    return data.length * itemHeight;
  }, [data.length, itemHeight]);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = start + visibleCount;

    // 添加缓冲区
    const bufferedStart = Math.max(0, start - overscan);
    const bufferedEnd = Math.min(data.length, end + overscan);

    return {
      start: bufferedStart,
      end: bufferedEnd,
      offsetY: bufferedStart * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, data.length, overscan]);

  // 获取可见项
  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange.start, visibleRange.end]);

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // 检查是否需要加载更多
    if (onLoadMore && !loading && !loadMoreTriggered.current) {
      const scrollBottom = target.scrollTop + target.clientHeight;
      const threshold = totalHeight * 0.8; // 滚动到80%时触发加载

      if (scrollBottom >= threshold) {
        loadMoreTriggered.current = true;
        onLoadMore();
      }
    }
  }, [onLoadMore, loading, totalHeight]);

  // 重置加载更多标志
  useEffect(() => {
    if (!loading) {
      loadMoreTriggered.current = false;
    }
  }, [loading]);

  // 空状态
  if (data.length === 0 && !loading) {
    return (
      <div className="virtual-list-empty" style={{ height: containerHeight }}>
        {emptyRender ? emptyRender() : <div>暂无数据</div>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="virtual-list-container"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div
        className="virtual-list-phantom"
        style={{ height: totalHeight }}
      >
        <div
          className="virtual-list-content"
          style={{ transform: `translateY(${visibleRange.offsetY}px)` }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            const key = getItemKey
              ? getItemKey(item, actualIndex)
              : actualIndex;

            return (
              <div
                key={key}
                className="virtual-list-item"
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
      {loading && (
        <div className="virtual-list-loading">
          <div className="loading-spinner">加载中...</div>
        </div>
      )}
    </div>
  );
}

export default VirtualList;
