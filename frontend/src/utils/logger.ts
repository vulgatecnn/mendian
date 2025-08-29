/**
 * 生产环境安全的日志工具
 * 在开发环境显示日志，生产环境静默
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private isDevelopment = import.meta.env.DEV
  private logLevel = import.meta.env.PROD ? LogLevel.ERROR : LogLevel.DEBUG

  private shouldLog(level: LogLevel): boolean {
    return this.isDevelopment && level <= this.logLevel
  }

  private formatMessage(level: string, message: string, ...args: any[]): void {
    if (!this.isDevelopment) return
    
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`
    
    console.log(`${prefix} ${message}`, ...args)
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.formatMessage('ERROR', `❌ ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.formatMessage('WARN', `⚠️ ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage('INFO', `ℹ️ ${message}`, ...args)
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatMessage('DEBUG', `🐛 ${message}`, ...args)
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage('SUCCESS', `✅ ${message}`, ...args)
    }
  }

  // 应用初始化专用日志方法
  initStart(): void {
    this.info('🚀 应用初始化开始...')
  }

  initSuccess(): void {
    this.success('应用初始化完成')
  }

  initError(error: any): void {
    this.error('应用初始化失败:', error)
  }

  tokenValid(): void {
    this.success('发现有效Token，初始化认证状态')
  }

  tokenInvalid(): void {
    this.info('未发现有效Token')
  }

  tokenRefresh(): void {
    this.info('🔄 Token即将过期，自动刷新')
  }

  tokenRefreshFailed(error: any): void {
    this.warn('Token自动刷新失败:', error)
  }

  permissionInit(): void {
    this.success('初始化权限系统')
  }
}

export const logger = new Logger()

// 向后兼容的简化接口
export default logger