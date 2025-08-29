// 错误处理统一导出
export {
  ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  withErrorBoundary
} from './ErrorBoundary'
export { GlobalErrorHandler, globalErrorHandler, handleError, ErrorType } from './errorHandler'
export type { ErrorHandlerConfig } from './errorHandler'

// 通知管理
export {
  NotificationManager,
  notificationManager,
  showSuccess,
  showInfo,
  showWarning,
  showError,
  showMessage,
  showModal,
  useNotification
} from '../notification/NotificationManager'
export type {
  NotificationType,
  NotificationConfig,
  MessageConfig,
  ModalConfig
} from '../notification/NotificationManager'
