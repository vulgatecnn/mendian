/**
 * 懒加载组件
 * 用于实现组件的按需加载和代码分割
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { Spin } from '@arco-design/web-react';
import './LazyLoad.css';

interface LazyLoadProps {
  // 懒加载的组件
  component: LazyExoticComponent<ComponentType<any>>;
  // 加载时的占位组件
  fallback?: React.ReactNode;
  // 错误边界
  errorFallback?: React.ReactNode;
  // 传递给组件的props
  [key: string]: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * 错误边界组件
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoad Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="lazy-load-error">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-message">组件加载失败</div>
              <div className="error-detail">
                {this.state.error?.message || '未知错误'}
              </div>
              <button
                className="error-retry"
                onClick={() => window.location.reload()}
              >
                重新加载
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * 默认加载占位组件
 */
const DefaultFallback: React.FC = () => (
  <div className="lazy-load-fallback">
    <Spin size={32} />
    <div className="loading-text">加载中...</div>
  </div>
);

/**
 * 懒加载组件
 */
const LazyLoad: React.FC<LazyLoadProps> = (props) => {
  const { component: Component, fallback, errorFallback, ...restProps } = props;
  
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || <DefaultFallback />}>
        <Component {...restProps} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * 创建懒加载组件的工厂函数
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <LazyLoad component={LazyComponent} fallback={fallback} />
  );
}

/**
 * 预加载组件
 */
export function preloadComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>
): void {
  // 触发组件的预加载
  importFunc().catch((error) => {
    console.error('Preload component error:', error);
  });
}

export default LazyLoad;
