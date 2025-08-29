/**
 * 清理钩子 - 防止内存泄漏
 */
import { useEffect, useRef } from 'react'

/**
 * 用于管理组件卸载时的清理操作
 */
export function useCleanup() {
  const cleanupFunctions = useRef<Array<() => void>>([])
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set())
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set())
  const abortControllers = useRef<Set<AbortController>>(new Set())

  // 添加清理函数
  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup)
  }

  // 安全的setTimeout，组件卸载时自动清理
  const safeSetTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      callback()
      timeouts.current.delete(timeoutId)
    }, delay)
    
    timeouts.current.add(timeoutId)
    return timeoutId
  }

  // 安全的setInterval，组件卸载时自动清理
  const safeSetInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
    const intervalId = setInterval(callback, delay)
    intervals.current.add(intervalId)
    return intervalId
  }

  // 创建可取消的AbortController
  const createAbortController = (): AbortController => {
    const controller = new AbortController()
    abortControllers.current.add(controller)
    return controller
  }

  // 手动清理指定的timeout
  const clearSafeTimeout = (timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId)
    timeouts.current.delete(timeoutId)
  }

  // 手动清理指定的interval
  const clearSafeInterval = (intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId)
    intervals.current.delete(intervalId)
  }

  // 组件卸载时执行所有清理操作
  useEffect(() => {
    return () => {
      // 清理所有定时器
      timeouts.current.forEach(clearTimeout)
      intervals.current.forEach(clearInterval)
      
      // 取消所有请求
      abortControllers.current.forEach(controller => {
        if (!controller.signal.aborted) {
          controller.abort()
        }
      })
      
      // 执行自定义清理函数
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.warn('Cleanup function error:', error)
        }
      })
      
      // 清空所有引用
      cleanupFunctions.current = []
      timeouts.current.clear()
      intervals.current.clear()
      abortControllers.current.clear()
    }
  }, [])

  return {
    addCleanup,
    safeSetTimeout,
    safeSetInterval,
    clearSafeTimeout,
    clearSafeInterval,
    createAbortController
  }
}

/**
 * 防抖Hook，组件卸载时自动清理
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const { safeSetTimeout, clearSafeTimeout } = useCleanup()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearSafeTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = safeSetTimeout(() => {
      callback(...args)
      timeoutRef.current = null
    }, delay)
  }) as T

  return debouncedCallback
}

/**
 * 节流Hook，组件卸载时自动清理
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const { safeSetTimeout } = useCleanup()
  const lastCallTime = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledCallback = ((...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastCallTime.current >= delay) {
      // 立即执行
      lastCallTime.current = now
      callback(...args)
    } else if (!timeoutRef.current) {
      // 延迟执行
      const remainingTime = delay - (now - lastCallTime.current)
      timeoutRef.current = safeSetTimeout(() => {
        lastCallTime.current = Date.now()
        callback(...args)
        timeoutRef.current = null
      }, remainingTime)
    }
  }) as T

  return throttledCallback
}

/**
 * 安全的事件监听器Hook
 */
export function useSafeEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  target: Window | Document | Element = window,
  options?: boolean | AddEventListenerOptions
) {
  const { addCleanup } = useCleanup()
  const savedHandler = useRef(handler)

  // 保存最新的handler引用
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    // 创建事件处理函数
    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[K])
    }

    // 添加事件监听器
    target.addEventListener(event, eventListener, options)

    // 注册清理函数
    addCleanup(() => {
      target.removeEventListener(event, eventListener, options)
    })
  }, [event, target, options, addCleanup])
}

/**
 * 安全的Intersection Observer Hook
 */
export function useSafeIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const { addCleanup } = useCleanup()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const savedCallback = useRef(callback)

  // 保存最新的callback引用
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    // 创建观察器
    observerRef.current = new IntersectionObserver(
      (entries, observer) => savedCallback.current(entries, observer),
      options
    )

    // 注册清理函数
    addCleanup(() => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    })
  }, [options, addCleanup])

  const observe = (element: Element) => {
    if (observerRef.current) {
      observerRef.current.observe(element)
    }
  }

  const unobserve = (element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element)
    }
  }

  const disconnect = () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }

  return { observe, unobserve, disconnect }
}