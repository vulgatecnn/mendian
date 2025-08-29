/**
 * 错误边界组件
 */

import React from 'react'
import { Result, Button, Card, Typography, Collapse } from 'antd'
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons'

const { Text } = Typography
const { Panel } = Collapse

interface ErrorInfo {
  componentStack: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

interface ErrorBoundaryProps {
  /** 子组件 */
  children: React.ReactNode
  /** 自定义错误页面 */
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => React.ReactNode
  /** 错误回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * 错误边界组件
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorId: this.generateErrorId()
    }
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 捕获错误
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * 错误信息处理
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 调用错误回调
    this.props.onError?.(error, errorInfo)

    // 可以在这里上报错误到监控系统
    // this.reportError(error, errorInfo)
  }

  /**
   * 重试操作
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: this.generateErrorId()
    })
  }

  /**
   * 返回首页
   */
  private handleGoHome = () => {
    window.location.href = '/'
  }

  /**
   * 刷新页面
   */
  private handleRefresh = () => {
    window.location.reload()
  }

  /**
   * 报告错误详情
   */
  private reportError = () => {
    if (this.state.error && this.state.errorInfo) {
      // 这里可以集成错误报告服务
      console.log('Report error:', {
        error: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo.componentStack,
        errorId: this.state.errorId
      })
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // 如果提供了自定义错误页面
      if (fallback) {
        return fallback(error, errorInfo!, this.handleRetry)
      }

      // 默认错误页面
      return (
        <div style={{ padding: '40px 20px', minHeight: '60vh' }}>
          <Result
            status="error"
            icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
            title="页面出现错误"
            subTitle="抱歉，页面发生了意外错误，请尝试刷新页面或联系技术支持"
            extra={[
              <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={this.handleRetry}>
                重试
              </Button>,
              <Button key="refresh" icon={<ReloadOutlined />} onClick={this.handleRefresh}>
                刷新页面
              </Button>,
              <Button key="home" icon={<HomeOutlined />} onClick={this.handleGoHome}>
                返回首页
              </Button>
            ]}
          >
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <Card size="small" style={{ marginTop: 16, textAlign: 'left' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>错误ID: </Text>
                  <Text code>{errorId}</Text>
                </div>
                
                <Collapse ghost>
                  <Panel header="错误详情" key="error-details">
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>错误信息:</Text>
                      <div style={{ marginTop: 4, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                        <Text code>{error.message}</Text>
                      </div>
                    </div>

                    {error.stack && (
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>错误堆栈:</Text>
                        <div style={{ 
                          marginTop: 4, 
                          padding: 8, 
                          background: '#fafafa', 
                          borderRadius: 4,
                          maxHeight: 200,
                          overflow: 'auto'
                        }}>
                          <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                            {error.stack}
                          </pre>
                        </div>
                      </div>
                    )}

                    {errorInfo?.componentStack && (
                      <div>
                        <Text strong>组件堆栈:</Text>
                        <div style={{ 
                          marginTop: 4, 
                          padding: 8, 
                          background: '#fafafa', 
                          borderRadius: 4,
                          maxHeight: 200,
                          overflow: 'auto'
                        }}>
                          <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Button size="small" onClick={this.reportError}>
                        报告错误
                      </Button>
                    </div>
                  </Panel>
                </Collapse>
              </Card>
            </div>
          </Result>
        </div>
      )
    }

    return children
  }
}

/**
 * 函数式错误边界Hook
 */
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Error handled:', error, errorInfo)
    
    // 可以在这里集成错误报告服务
    // reportError(error, errorInfo)
  }, [])
}

/**
 * 错误边界HOC
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: {
    fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => React.ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
  }
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <ErrorBoundary {...errorBoundaryConfig}>
        <Component {...props} ref={ref} />
      </ErrorBoundary>
    )
  })

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary