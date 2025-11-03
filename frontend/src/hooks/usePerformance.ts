/**
 * 性能优化相关的React Hooks
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { debounce, throttle, rafThrottle, MemoryCache } from '../utils/performance';

/**
 * 使用防抖
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () =>
      debounce(
        (...args: any[]) => callbackRef.current(...args),
        delay
      ) as (...args: Parameters<T>) => void,
    [delay, ...deps]
  );
}

/**
 * 使用节流
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () =>
      throttle(
        (...args: any[]) => callbackRef.current(...args),
        delay
      ) as (...args: Parameters<T>) => void,
    [delay, ...deps]
  );
}

/**
 * 使用RAF节流
 */
export function useRafThrottle<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () =>
      rafThrottle((...args: any[]) => callbackRef.current(...args)) as (...args: Parameters<T>) => void,
    deps
  );
}

/**
 * 使用内存缓存
 */
export function useMemoryCache<T>(maxSize: number = 100): MemoryCache<T> {
  const cacheRef = useRef<MemoryCache<T>>();

  if (!cacheRef.current) {
    cacheRef.current = new MemoryCache<T>(maxSize);
  }

  useEffect(() => {
    return () => {
      cacheRef.current?.clear();
    };
  }, []);

  return cacheRef.current;
}

/**
 * 使用虚拟滚动
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = start + visibleCount;

    const bufferedStart = Math.max(0, start - overscan);
    const bufferedEnd = Math.min(items.length, end + overscan);

    return {
      start: bufferedStart,
      end: bufferedEnd,
      offsetY: bufferedStart * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    visibleRange,
    totalHeight: items.length * itemHeight,
    handleScroll,
  };
}

/**
 * 使用懒加载
 */
export function useLazyLoad(
  ref: React.RefObject<HTMLElement>,
  onIntersect: () => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect();
          }
        });
      },
      {
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, onIntersect, options]);
}

/**
 * 使用无限滚动
 */
export function useInfiniteScroll(
  loadMore: () => void | Promise<void>,
  hasMore: boolean,
  threshold: number = 0.8
) {
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || loadingRef.current) return;

      const target = e.currentTarget;
      const scrollBottom = target.scrollTop + target.clientHeight;
      const scrollHeight = target.scrollHeight;

      if (scrollBottom >= scrollHeight * threshold) {
        loadingRef.current = true;
        setLoading(true);

        try {
          await loadMore();
        } finally {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [hasMore, loadMore, threshold]
  );

  return {
    loading,
    handleScroll: useRafThrottle(handleScroll),
  };
}

/**
 * 使用性能监控
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef<number>();

  useEffect(() => {
    mountTime.current = performance.now();

    return () => {
      if (mountTime.current) {
        const duration = performance.now() - mountTime.current;
        console.log(
          `[Performance] ${componentName} was mounted for ${duration.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[Performance] ${componentName} rendered ${renderCount.current} times`);
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * 使用批量更新
 */
export function useBatchUpdate<T>(
  callback: (items: T[]) => void,
  delay: number = 100
): (item: T) => void {
  const itemsRef = useRef<T[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const addItem = useCallback(
    (item: T) => {
      itemsRef.current.push(item);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(itemsRef.current);
        itemsRef.current = [];
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return addItem;
}

/**
 * 使用防抖值
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 使用节流值
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * 使用媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * 使用窗口大小
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const throttledResize = throttle(handleResize, 200);

    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('resize', throttledResize);
    };
  }, []);

  return size;
}

/**
 * 使用可见性
 */
export function useVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * 使用在线状态
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
