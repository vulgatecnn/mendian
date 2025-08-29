// 全局错误处理器
import { message, notification } from 'antd'
import { AxiosError } from 'axios'
import type { ApiError } from '../types'

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  HTTP_ERROR = 'HTTP_ERROR',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误处理配置
export interface ErrorHandlerConfig {
  showMessage: boolean
  showNotification: boolean
  logError: boolean
  reportError: boolean
}

// 默认错误处理配置
const defaultConfig: ErrorHandlerConfig = {
  showMessage: true,
  showNotification: false,
  logError: true,
  reportError: false
}

/**
 * 错误处理器类
 */
export class GlobalErrorHandler {
  private config: ErrorHandlerConfig
  private errorQueue = new Set<string>() // 防止相同错误重复提示

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.initialize()
  }

  /**
   * 初始化全局错误监听
   */
  private initialize() {
    // 监听全局JavaScript错误
    window.addEventListener('error', event => {
      this.handleGlobalError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    })

    // 监听Promise rejection错误
    window.addEventListener('unhandledrejection', event => {
      this.handlePromiseRejection(event.reason)
      event.preventDefault() // 防止控制台输出
    })

    // 监听React错误（通过自定义事件）
    window.addEventListener('react-error', (event: any) => {
      this.handleReactError(event.detail.error, event.detail.errorInfo)
    })
  }

  /**
   * 处理全局JavaScript错误
   */
  private handleGlobalError(errorEvent: {
    message: string
    filename?: string
    lineno?: number
    colno?: number
    error?: Error
  }) {
    const errorInfo = {
      type: ErrorType.UNKNOWN_ERROR,
      message: errorEvent.message,
      stack: errorEvent.error?.stack,
      filename: errorEvent.filename,
      lineno: errorEvent.lineno,
      colno: errorEvent.colno
    }

    this.processError(errorInfo)
  }

  /**
   * 处理Promise Rejection错误
   */
  private handlePromiseRejection(reason: any) {
    let errorInfo: any

    if (reason instanceof Error) {
      errorInfo = {
        type: ErrorType.UNKNOWN_ERROR,
        message: reason.message,
        stack: reason.stack
      }
    } else if (typeof reason === 'string') {
      errorInfo = {
        type: ErrorType.UNKNOWN_ERROR,
        message: reason
      }
    } else {
      errorInfo = {
        type: ErrorType.UNKNOWN_ERROR,
        message: 'Unhandled promise rejection',
        details: reason
      }
    }

    this.processError(errorInfo)
  }

  /**
   * 处理React错误
   */
  private handleReactError(error: Error, errorInfo: any) {
    const errorDetail = {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    }

    this.processError(errorDetail)
  }

  /**
   * 处理HTTP错误（主要用于API请求）
   */
  handleHttpError(error: AxiosError): ErrorType {
    let errorType = ErrorType.HTTP_ERROR
    let errorMessage = '请求失败'

    if (!error.response) {
      // 网络错误
      errorType = ErrorType.NETWORK_ERROR
      errorMessage = '网络连接失败，请检查网络设置'
    } else if (error.code === 'ECONNABORTED') {
      // 超时错误
      errorType = ErrorType.TIMEOUT_ERROR
      errorMessage = '请求超时，请稍后重试'
    } else {
      const { status, data } = error.response

      switch (status) {
        case 400:
          errorType = ErrorType.VALIDATION_ERROR
          errorMessage = (data as any)?.message || '请求参数错误'
          break
        case 401:
          errorType = ErrorType.AUTHENTICATION_ERROR
          errorMessage = '登录已过期，请重新登录'
          this.handleAuthenticationError()
          break
        case 403:
          errorType = ErrorType.PERMISSION_ERROR
          errorMessage = '没有操作权限'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 422:
          errorType = ErrorType.VALIDATION_ERROR
          errorMessage = '数据验证失败'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 502:
          errorMessage = '网关错误'
          break
        case 503:
          errorMessage = '服务暂时不可用'
          break
        default:
          errorMessage = (data as any)?.message || `请求失败 (${status})`
      }
    }

    const errorInfo = {
      type: errorType,
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    }

    this.processError(errorInfo)
    return errorType
  }

  /**
   * 处理业务错误
   */
  handleBusinessError(error: ApiError): ErrorType {
    const errorInfo = {
      type: ErrorType.BUSINESS_ERROR,
      message: error.message,
      code: error.code,
      status: error.status
    }

    this.processError(errorInfo)
    return ErrorType.BUSINESS_ERROR
  }

  /**
   * 处理认证错误
   */
  private handleAuthenticationError() {
    // 清除本地存储的认证信息
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')

    // 显示登录过期提示
    notification.warning({
      message: '登录已过期',
      description: '您的登录已过期，请重新登录',
      duration: 3,
      onClose: () => {
        // 跳转到登录页
        window.location.href = '/login'
      }
    })
  }

  /**
   * 处理错误的核心方法
   */
  private processError(errorInfo: any) {
    // 生成错误唯一标识，防止重复提示
    const errorKey = this.generateErrorKey(errorInfo)

    if (this.errorQueue.has(errorKey)) {
      return // 相同错误正在处理中，跳过
    }

    this.errorQueue.add(errorKey)

    // 延迟清理，防止短时间内重复提示
    setTimeout(() => {
      this.errorQueue.delete(errorKey)
    }, 3000)

    // 记录错误
    if (this.config.logError) {
      console.error('Global Error:', errorInfo)
    }

    // 显示用户提示
    if (this.config.showMessage && this.shouldShowMessage(errorInfo.type)) {
      this.showErrorMessage(errorInfo)
    }

    if (this.config.showNotification && this.shouldShowNotification(errorInfo.type)) {
      this.showErrorNotification(errorInfo)
    }

    // 上报错误
    if (this.config.reportError) {
      this.reportError(errorInfo)
    }
  }

  /**
   * 生成错误唯一标识
   */
  private generateErrorKey(errorInfo: any): string {
    return `${errorInfo.type}_${errorInfo.message}_${errorInfo.status || ''}`
  }

  /**
   * 判断是否显示消息提示
   */
  private shouldShowMessage(errorType: ErrorType): boolean {
    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return false // 认证错误使用notification
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
      case ErrorType.BUSINESS_ERROR:
      case ErrorType.VALIDATION_ERROR:
        return true
      default:
        return false
    }
  }

  /**
   * 判断是否显示通知
   */
  private shouldShowNotification(errorType: ErrorType): boolean {
    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.PERMISSION_ERROR:
        return true
      default:
        return false
    }
  }

  /**
   * 显示错误消息
   */
  private showErrorMessage(errorInfo: any) {
    const messageType = this.getMessageType(errorInfo.type)

    message[messageType]({
      content: errorInfo.message,
      duration: 4,
      key: errorInfo.type // 使用key防止相同类型错误重复显示
    })
  }

  /**
   * 显示错误通知
   */
  private showErrorNotification(errorInfo: any) {
    const notificationType = this.getNotificationType(errorInfo.type)

    notification[notificationType]({
      message: this.getErrorTitle(errorInfo.type),
      description: errorInfo.message,
      duration: 5,
      placement: 'topRight'
    })
  }

  /**
   * 获取消息类型
   */
  private getMessageType(errorType: ErrorType): 'error' | 'warning' | 'info' {
    switch (errorType) {
      case ErrorType.VALIDATION_ERROR:
        return 'warning'
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        return 'error'
      default:
        return 'error'
    }
  }

  /**
   * 获取通知类型
   */
  private getNotificationType(errorType: ErrorType): 'error' | 'warning' | 'info' {
    switch (errorType) {
      case ErrorType.PERMISSION_ERROR:
        return 'warning'
      case ErrorType.AUTHENTICATION_ERROR:
        return 'warning'
      default:
        return 'error'
    }
  }

  /**
   * 获取错误标题
   */
  private getErrorTitle(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return '网络错误'
      case ErrorType.TIMEOUT_ERROR:
        return '请求超时'
      case ErrorType.AUTHENTICATION_ERROR:
        return '身份验证失败'
      case ErrorType.PERMISSION_ERROR:
        return '权限不足'
      case ErrorType.VALIDATION_ERROR:
        return '数据验证失败'
      case ErrorType.BUSINESS_ERROR:
        return '业务处理失败'
      default:
        return '系统错误'
    }
  }

  /**
   * 上报错误到服务端
   */
  private async reportError(errorInfo: any) {
    try {
      const errorReport = {
        ...errorInfo,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId()
      }

      // 发送到错误收集API
      fetch('/api/v1/system/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      }).catch(console.error)
    } catch (error) {
      console.error('Failed to report error:', error)
    }
  }

  /**
   * 获取当前用户ID（用于错误追踪）
   */
  private getCurrentUserId(): string | null {
    try {
      // 从localStorage或其他地方获取用户信息
      const userInfo = localStorage.getItem('user_info')
      return userInfo ? JSON.parse(userInfo).id : null
    } catch {
      return null
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ErrorHandlerConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * 手动处理错误
   */
  handleError(error: any, config?: Partial<ErrorHandlerConfig>) {
    const originalConfig = this.config

    if (config) {
      this.config = { ...this.config, ...config }
    }

    if (error instanceof AxiosError) {
      this.handleHttpError(error)
    } else if (error instanceof Error) {
      this.processError({
        type: ErrorType.UNKNOWN_ERROR,
        message: error.message,
        stack: error.stack
      })
    } else {
      this.processError({
        type: ErrorType.UNKNOWN_ERROR,
        message: String(error)
      })
    }

    // 恢复原配置
    this.config = originalConfig
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new GlobalErrorHandler()

// 便捷的错误处理函数
export const handleError = (error: any, config?: Partial<ErrorHandlerConfig>) => {
  globalErrorHandler.handleError(error, config)
}

// 导出错误类型，方便外部使用
export { ErrorType }
