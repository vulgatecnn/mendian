// 通知管理器
import React from 'react'
import { notification, message, Modal } from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'

// 通知类型
export type NotificationType = 'success' | 'info' | 'warning' | 'error'

// 通知配置
export interface NotificationConfig {
  message: string
  description?: string
  duration?: number
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  onClick?: () => void
  onClose?: () => void
  btn?: React.ReactNode
  key?: string
  className?: string
  style?: React.CSSProperties
}

// 消息配置
export interface MessageConfig {
  content: string
  duration?: number
  onClose?: () => void
  key?: string
}

// 模态框配置
export interface ModalConfig {
  title: string
  content: React.ReactNode
  onOk?: () => void | Promise<void>
  onCancel?: () => void
  okText?: string
  cancelText?: string
  width?: number
  mask?: boolean
  maskClosable?: boolean
  keyboard?: boolean
}

/**
 * 通知管理器类
 */
export class NotificationManager {
  private static instance: NotificationManager
  private notificationQueue = new Map<string, number>() // 防重复通知

  private constructor() {
    this.setupGlobalConfig()
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  /**
   * 设置全局配置
   */
  private setupGlobalConfig() {
    // 配置notification全局参数
    notification.config({
      placement: 'topRight',
      duration: 4.5,
      rtl: false
    })

    // 配置message全局参数
    message.config({
      duration: 3,
      maxCount: 5
    })
  }

  /**
   * 显示成功通知
   */
  success(config: NotificationConfig): void {
    this.showNotification('success', config)
  }

  /**
   * 显示信息通知
   */
  info(config: NotificationConfig): void {
    this.showNotification('info', config)
  }

  /**
   * 显示警告通知
   */
  warning(config: NotificationConfig): void {
    this.showNotification('warning', config)
  }

  /**
   * 显示错误通知
   */
  error(config: NotificationConfig): void {
    this.showNotification('error', config)
  }

  /**
   * 显示通知的核心方法
   */
  private showNotification(type: NotificationType, config: NotificationConfig): void {
    const key = config.key || `${type}_${config.message}`

    // 防重复显示
    if (this.notificationQueue.has(key)) {
      return
    }

    this.notificationQueue.set(key, Date.now())

    // 清理队列
    setTimeout(
      () => {
        this.notificationQueue.delete(key)
      },
      (config.duration || 4.5) * 1000
    )

    const notificationConfig = {
      ...config,
      key,
      icon: this.getNotificationIcon(type),
      onClose: () => {
        this.notificationQueue.delete(key)
        config.onClose?.()
      }
    }

    notification[type](notificationConfig)
  }

  /**
   * 获取通知图标
   */
  private getNotificationIcon(type: NotificationType): React.ReactNode {
    const iconStyle = { fontSize: '20px' }

    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />
      case 'info':
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />
      case 'warning':
        return <WarningOutlined style={{ ...iconStyle, color: '#faad14' }} />
      case 'error':
        return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />
      default:
        return null
    }
  }

  /**
   * 显示成功消息
   */
  successMessage(config: MessageConfig | string): void {
    const messageConfig = typeof config === 'string' ? { content: config } : config
    this.showMessage('success', messageConfig)
  }

  /**
   * 显示信息消息
   */
  infoMessage(config: MessageConfig | string): void {
    const messageConfig = typeof config === 'string' ? { content: config } : config
    this.showMessage('info', messageConfig)
  }

  /**
   * 显示警告消息
   */
  warningMessage(config: MessageConfig | string): void {
    const messageConfig = typeof config === 'string' ? { content: config } : config
    this.showMessage('warning', messageConfig)
  }

  /**
   * 显示错误消息
   */
  errorMessage(config: MessageConfig | string): void {
    const messageConfig = typeof config === 'string' ? { content: config } : config
    this.showMessage('error', messageConfig)
  }

  /**
   * 显示加载消息
   */
  loadingMessage(content: string, duration?: number): Promise<void> {
    return new Promise(resolve => {
      const hide = message.loading(content, duration || 0)
      if (duration) {
        setTimeout(() => {
          hide()
          resolve()
        }, duration * 1000)
      } else {
        // 返回隐藏函数，需要手动调用
        (resolve as any)(hide)
      }
    })
  }

  /**
   * 显示消息的核心方法
   */
  private showMessage(type: NotificationType, config: MessageConfig): void {
    const key = config.key || `msg_${type}_${config.content}`

    const messageConfig = {
      ...config,
      key
    }

    message[type](messageConfig)
  }

  /**
   * 显示确认对话框
   */
  confirm(config: ModalConfig): void {
    Modal.confirm({
      title: config.title,
      content: config.content,
      onOk: config.onOk,
      onCancel: config.onCancel,
      okText: config.okText || '确定',
      cancelText: config.cancelText || '取消',
      width: config.width,
      mask: config.mask,
      maskClosable: config.maskClosable,
      keyboard: config.keyboard,
      icon: <ExclamationCircleOutlined />
    })
  }

  /**
   * 显示信息对话框
   */
  infoModal(config: ModalConfig): void {
    Modal.info({
      title: config.title,
      content: config.content,
      onOk: config.onOk,
      okText: config.okText || '确定',
      width: config.width,
      mask: config.mask,
      maskClosable: config.maskClosable,
      keyboard: config.keyboard
    })
  }

  /**
   * 显示成功对话框
   */
  successModal(config: ModalConfig): void {
    Modal.success({
      title: config.title,
      content: config.content,
      onOk: config.onOk,
      okText: config.okText || '确定',
      width: config.width,
      mask: config.mask,
      maskClosable: config.maskClosable,
      keyboard: config.keyboard
    })
  }

  /**
   * 显示警告对话框
   */
  warningModal(config: ModalConfig): void {
    Modal.warning({
      title: config.title,
      content: config.content,
      onOk: config.onOk,
      okText: config.okText || '确定',
      width: config.width,
      mask: config.mask,
      maskClosable: config.maskClosable,
      keyboard: config.keyboard
    })
  }

  /**
   * 显示错误对话框
   */
  errorModal(config: ModalConfig): void {
    Modal.error({
      title: config.title,
      content: config.content,
      onOk: config.onOk,
      okText: config.okText || '确定',
      width: config.width,
      mask: config.mask,
      maskClosable: config.maskClosable,
      keyboard: config.keyboard
    })
  }

  /**
   * 显示删除确认对话框
   */
  confirmDelete(config: {
    title?: string
    content?: string
    onOk: () => void | Promise<void>
    onCancel?: () => void
  }): void {
    this.confirm({
      title: config.title || '确认删除',
      content: config.content || '删除后无法恢复，确定要删除吗？',
      onOk: config.onOk,
      onCancel: config.onCancel,
      okText: '删除',
      cancelText: '取消'
    })
  }

  /**
   * 清除所有通知
   */
  clearAll(): void {
    notification.destroy()
    message.destroy()
    this.notificationQueue.clear()
  }

  /**
   * 清除指定key的通知
   */
  clear(key: string): void {
    notification.close(key)
    this.notificationQueue.delete(key)
  }
}

// 创建全局实例
export const notificationManager = NotificationManager.getInstance()

// 便捷的导出函数
export const showSuccess = (config: NotificationConfig | string) => {
  const notificationConfig = typeof config === 'string' ? { message: config } : config
  notificationManager.success(notificationConfig)
}

export const showInfo = (config: NotificationConfig | string) => {
  const notificationConfig = typeof config === 'string' ? { message: config } : config
  notificationManager.info(notificationConfig)
}

export const showWarning = (config: NotificationConfig | string) => {
  const notificationConfig = typeof config === 'string' ? { message: config } : config
  notificationManager.warning(notificationConfig)
}

export const showError = (config: NotificationConfig | string) => {
  const notificationConfig = typeof config === 'string' ? { message: config } : config
  notificationManager.error(notificationConfig)
}

export const showMessage = {
  success: (config: MessageConfig | string) => notificationManager.successMessage(config),
  info: (config: MessageConfig | string) => notificationManager.infoMessage(config),
  warning: (config: MessageConfig | string) => notificationManager.warningMessage(config),
  error: (config: MessageConfig | string) => notificationManager.errorMessage(config),
  loading: (content: string, duration?: number) =>
    notificationManager.loadingMessage(content, duration)
}

export const showModal = {
  confirm: (config: ModalConfig) => notificationManager.confirm(config),
  info: (config: ModalConfig) => notificationManager.infoModal(config),
  success: (config: ModalConfig) => notificationManager.successModal(config),
  warning: (config: ModalConfig) => notificationManager.warningModal(config),
  error: (config: ModalConfig) => notificationManager.errorModal(config),
  confirmDelete: (config: {
    title?: string
    content?: string
    onOk: () => void | Promise<void>
    onCancel?: () => void
  }) => notificationManager.confirmDelete(config)
}

// React Hook for notification
export function useNotification() {
  return {
    notification: {
      success: showSuccess,
      info: showInfo,
      warning: showWarning,
      error: showError
    },
    message: showMessage,
    modal: showModal,
    manager: notificationManager
  }
}
