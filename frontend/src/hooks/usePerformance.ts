/**
 * React 性能优化 Hook 集合
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 节流 Hook
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastUpdated = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdated.current >= delay) {
      setThrottledValue(value)
      lastUpdated.current = now
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value)
        lastUpdated.current = Date.now()
      }, delay - (now - lastUpdated.current))

      return () => clearTimeout(timer)
    }
  }, [value, delay])

  return throttledValue
}

/**
 * 稳定化的 callback Hook
 * 避免因为依赖变化导致的不必要重渲染
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback)
  callbackRef.current = callback

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args)
  }, []) as T
}

/**
 * 深度对比的 useMemo
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>()

  if (!ref.current || !isDeepEqual(deps, ref.current.deps)) {
    ref.current = {
      deps,
      value: factory()
    }
  }

  return ref.current.value
}

/**
 * 简单的深度对比函数
 */
function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a === null || b === null) return false
  
  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }
  
  return true
}

/**
 * 虚拟列表 Hook
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  buffer = 5
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  buffer?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = useMemo(() => {
    return Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
  }, [scrollTop, itemHeight, buffer])

  const endIndex = useMemo(() => {
    return Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + buffer
    )
  }, [scrollTop, containerHeight, itemHeight, buffer, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      index: startIndex + index,
      item,
      top: (startIndex + index) * itemHeight
    }))
  }, [items, startIndex, endIndex, itemHeight])

  const totalHeight = useMemo(() => {
    return items.length * itemHeight
  }, [items.length, itemHeight])

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex
  }
}

/**
 * 组件渲染性能监控 Hook
 */
export function useRenderTracker(componentName: string, props?: Record<string, unknown>) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef<number>(performance.now())
  
  useEffect(() => {
    renderCount.current += 1
    const now = performance.now()
    const renderTime = now - lastRenderTime.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered ${renderCount.current} times, last render took ${renderTime.toFixed(2)}ms`)
      
      if (props) {
        console.log(`[Performance] ${componentName} props:`, props)
      }
    }
    
    lastRenderTime.current = now
  })
}

/**
 * 批量状态更新 Hook
 */
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState)
  const batchedUpdates = useRef<Partial<T>[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  const batchSetState = useCallback((update: Partial<T>) => {
    batchedUpdates.current.push(update)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = { ...prevState }
        batchedUpdates.current.forEach(update => {
          newState = { ...newState, ...update }
        })
        batchedUpdates.current = []
        return newState
      })
    }, 0)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, batchSetState] as const
}

export default {
  useDebounce,
  useThrottle,
  useStableCallback,
  useDeepMemo,
  useVirtualList,
  useRenderTracker,
  useBatchedState
}