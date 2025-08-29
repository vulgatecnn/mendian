// 错误边界组件
import React, { ErrorInfo } from 'react'
import { Result, Button, Typography } from 'antd'
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons'

const { Paragraph, Text } = Typography

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo: ErrorInfo; retry: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * 错误边界组件
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新state以便下次渲染显示降级UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    this.setState({
      error,
      errorInfo
    })

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 发送错误报告到监控服务
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // 这里可以集成错误监控服务，如Sentry、Bugsnag等
    console.error('Error caught by ErrorBoundary:', {
      error: error.toString(),
      stack: error.stack,
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // 可以发送到后端错误收集API
    // fetch('/api/v1/system/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message: error.message,
    //     stack: error.stack,
    //     componentStack: errorInfo.componentStack,
    //     url: window.location.href,
    //     userAgent: navigator.userAgent,
    //     timestamp: new Date().toISOString(),
    //   }),
    // }).catch(console.error)
  }

  private retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private goHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback组件，使用它
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            retry={this.retry}
          />
        )
      }

      // 默认错误UI
      return (
        <div style={{ padding: '50px' }}>
          <Result
            status="error"
            title="页面出现了一些问题"
            subTitle="抱歉，页面出现了错误。您可以尝试重新加载或返回首页。"
            extra={[
              <Button type="primary" key="retry" icon={<ReloadOutlined />} onClick={this.retry}>
                重新加载
              </Button>,
              <Button key="home" icon={<HomeOutlined />} onClick={this.goHome}>
                返回首页
              </Button>
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="desc" style={{ textAlign: 'left' }}>
                <Paragraph>
                  <Text strong style={{ fontSize: 16 }}>
                    错误详情：
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text type="danger">{this.state.error.toString()}</Text>
                </Paragraph>
                {this.state.error.stack && (
                  <Paragraph>
                    <Text strong>堆栈信息：</Text>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: '10px',
                        overflow: 'auto',
                        fontSize: '12px',
                        marginTop: '10px'
                      }}
                    >
                      {this.state.error.stack}
                    </pre>
                  </Paragraph>
                )}
                {this.state.errorInfo && (
                  <Paragraph>
                    <Text strong>组件堆栈：</Text>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: '10px',
                        overflow: 'auto',
                        fontSize: '12px',
                        marginTop: '10px'
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Paragraph>
                )}
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * 页面级错误边界
 */
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 页面级错误，可以进行特殊处理
        console.error('Page Error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * 组件级错误边界（更轻量）
 */
export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            background: '#fafafa'
          }}
        >
          <Text type="secondary">组件加载失败</Text>
          <br />
          <Button size="small" type="link" onClick={retry}>
            重试
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              {error.message}
            </div>
          )}
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
