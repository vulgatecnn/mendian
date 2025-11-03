/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @param immediate 是否立即执行
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param wait 等待时间（毫秒）
 * @param options 选项
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;
  const { leading = true, trailing = true } = options;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    if (!previous && !leading) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}

/**
 * 请求动画帧节流
 * 用于优化滚动、resize等高频事件
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func.apply(context, args);
      rafId = null;
    });
  };
}

/**
 * 批量更新函数
 * 将多次调用合并为一次
 */
export function batchUpdate<T>(
  callback: (items: T[]) => void,
  delay: number = 100
): (item: T) => void {
  let items: T[] = [];
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (item: T) => {
    items.push(item);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      callback(items);
      items = [];
      timeout = null;
    }, delay);
  };
}

/**
 * 懒加载图片
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            image.src = src;
            observer.unobserve(image);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (placeholder) {
      img.src = placeholder;
    }

    observer.observe(img);
  } else {
    // 不支持IntersectionObserver时直接加载
    img.src = src;
  }
}

/**
 * 内存缓存
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks: Map<string, number>;

  constructor() {
    this.marks = new Map();
  }

  /**
   * 标记开始时间
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 测量并返回耗时
   */
  measure(name: string): number | null {
    const startTime = this.marks.get(name);

    if (startTime === undefined) {
      console.warn(`Performance mark "${name}" not found`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    return duration;
  }

  /**
   * 测量并记录日志
   */
  measureAndLog(name: string, threshold: number = 100): void {
    const duration = this.measure(name);

    if (duration !== null) {
      if (duration > threshold) {
        console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      }
    }
  }
}

/**
 * 创建全局性能监控实例
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * 组件渲染性能监控装饰器
 */
export function measureRender(componentName: string) {
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      componentDidMount() {
        performanceMonitor.measureAndLog(`${componentName}_mount`);
        if (super.componentDidMount) {
          super.componentDidMount();
        }
      }

      componentDidUpdate() {
        performanceMonitor.measureAndLog(`${componentName}_update`);
        if (super.componentDidUpdate) {
          super.componentDidUpdate();
        }
      }

      render() {
        performanceMonitor.mark(`${componentName}_render`);
        const result = super.render();
        performanceMonitor.measureAndLog(`${componentName}_render`, 16); // 16ms threshold for 60fps
        return result;
      }
    };
  };
}

/**
 * 检查是否支持Web Worker
 */
export function supportsWebWorker(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * 检查是否支持Service Worker
 */
export function supportsServiceWorker(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * 获取设备性能等级
 * 返回: 'high' | 'medium' | 'low'
 */
export function getDevicePerformance(): 'high' | 'medium' | 'low' {
  // 检查硬件并发数
  const cores = navigator.hardwareConcurrency || 2;

  // 检查内存（如果可用）
  const memory = (navigator as any).deviceMemory || 4;

  // 检查连接速度（如果可用）
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';

  // 综合评分
  let score = 0;

  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else score += 1;

  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;

  if (effectiveType === '4g') score += 2;
  else if (effectiveType === '3g') score += 1;

  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * 优化长列表渲染
 * 使用时间切片技术
 */
export function renderInChunks<T>(
  items: T[],
  renderItem: (item: T, index: number) => void,
  chunkSize: number = 50,
  onComplete?: () => void
): void {
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunkSize, items.length);

    for (let i = index; i < end; i++) {
      renderItem(items[i], i);
    }

    index = end;

    if (index < items.length) {
      requestIdleCallback(processChunk, { timeout: 1000 });
    } else if (onComplete) {
      onComplete();
    }
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(processChunk, { timeout: 1000 });
  } else {
    // 降级到setTimeout
    setTimeout(processChunk, 0);
  }
}

/**
 * 预加载资源
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (type === 'script') {
      const link = document.createElement('link');
      link.rel = 'preload';
      (link as any).as = 'script';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    } else if (type === 'style') {
      const link = document.createElement('link');
      link.rel = 'preload';
      (link as any).as = 'style';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    } else if (type === 'image') {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    } else if (type === 'fetch') {
      if (url) {
        fetch(url, { method: 'GET', mode: 'no-cors' })
          .then(() => resolve())
          .catch(reject);
      } else {
        reject(new Error('URL is required for fetch preload'));
      }
    }
  });
}

/**
 * 批量预加载资源
 */
export async function preloadResources(
  resources: Array<{ url: string; type: 'script' | 'style' | 'image' | 'fetch' }>
): Promise<void> {
  const promises = resources.map((resource) =>
    preloadResource(resource.url, resource.type).catch((error) => {
      console.warn(`Failed to preload ${resource.url}:`, error);
    })
  );

  await Promise.all(promises);
}
