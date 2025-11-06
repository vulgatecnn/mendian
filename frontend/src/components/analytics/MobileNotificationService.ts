/**
 * 移动端通知推送服务
 * 支持企业微信通知和浏览器通知
 */
import { Message } from '@arco-design/web-react'
import WeChatService from '../../api/wechatService'

/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

/**
 * 通知配置
 */
export interface NotificationConfig {
  title: string
  content: string
  type?: NotificationType
  url?: string
  businessType?: string
  businessId?: number
  userIds?: string[]
  departmentIds?: number[]
}

/**
 * 通知推送结果
 */
export interface NotificationResult {
  success: boolean
  message: string
  messageId?: string
}

/**
 * 移动端通知推送服务类
 */
class MobileNotificationService {
  private isWeChatEnv: boolean
  private notificationPermission: NotificationPermission = 'default'

  constructor() {
    this.isWeChatEnv = WeChatService.isWeChatEnvironment()
    this.checkNotificationPermission()
  }

  /**
   * 检查浏览器通知权限
   */
  private async checkNotificationPermission() {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission
      
      if (this.notificationPermission === 'default') {
        try {
          this.notificationPermission = await Notification.requestPermission()
        } catch (error) {
          console.error('请求通知权限失败:', error)
        }
      }
    }
  }

  /**
   * 发送企业微信通知
   */
  async sendWeChatNotification(config: NotificationConfig): Promise<NotificationResult> {
    if (!this.isWeChatEnv) {
      return {
        success: false,
        message: '当前不在企业微信环境中'
      }
    }

    try {
      const response = await fetch('/api/wechat/messages/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message_type: config.url ? 'textcard' : 'text',
          title: config.title,
          content: config.content,
          url: config.url,
          to_users: config.userIds,
          to_departments: config.departmentIds,
          business_type: config.businessType,
          business_id: config.businessId
        })
      })

      if (!response.ok) {
        throw new Error('发送企业微信通知失败')
      }

      const result = await response.json()
      
      return {
        success: true,
        message: '通知发送成功',
        messageId: result.data?.id
      }
    } catch (error) {
      console.error('发送企业微信通知失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送失败'
      }
    }
  }

  /**
   * 发送浏览器通知
   */
  async sendBrowserNotification(config: NotificationConfig): Promise<NotificationResult> {
    if (!('Notification' in window)) {
      return {
        success: false,
        message: '浏览器不支持通知功能'
      }
    }

    if (this.notificationPermission !== 'granted') {
      return {
        success: false,
        message: '未授予通知权限'
      }
    }

    try {
      const notification = new Notification(config.title, {
        body: config.content,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: config.businessType || 'default',
        requireInteraction: false,
        silent: false
      })

      // 点击通知时的处理
      if (config.url) {
        notification.onclick = () => {
          window.open(config.url, '_blank')
          notification.close()
        }
      }

      // 自动关闭通知
      setTimeout(() => {
        notification.close()
      }, 5000)

      return {
        success: true,
        message: '通知发送成功'
      }
    } catch (error) {
      console.error('发送浏览器通知失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送失败'
      }
    }
  }

  /**
   * 发送应用内消息提示
   */
  sendInAppMessage(config: NotificationConfig): NotificationResult {
    const messageType = config.type || 'info'
    
    switch (messageType) {
      case 'success':
        Message.success(config.content)
        break
      case 'warning':
        Message.warning(config.content)
        break
      case 'error':
        Message.error(config.content)
        break
      default:
        Message.info(config.content)
    }

    return {
      success: true,
      message: '消息已显示'
    }
  }

  /**
   * 智能发送通知（根据环境自动选择最佳方式）
   */
  async sendNotification(config: NotificationConfig): Promise<NotificationResult> {
    // 优先使用企业微信通知
    if (this.isWeChatEnv) {
      const result = await this.sendWeChatNotification(config)
      if (result.success) {
        return result
      }
    }

    // 其次使用浏览器通知
    if (this.notificationPermission === 'granted') {
      const result = await this.sendBrowserNotification(config)
      if (result.success) {
        return result
      }
    }

    // 最后使用应用内消息
    return this.sendInAppMessage(config)
  }

  /**
   * 批量发送通知
   */
  async sendBatchNotifications(configs: NotificationConfig[]): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []
    
    for (const config of configs) {
      const result = await this.sendNotification(config)
      results.push(result)
      
      // 避免发送过快
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  /**
   * 发送数据更新通知
   */
  async notifyDataUpdate(dataType: string, message: string): Promise<NotificationResult> {
    return this.sendNotification({
      title: '数据更新',
      content: `${dataType}: ${message}`,
      type: 'info',
      businessType: 'data_update'
    })
  }

  /**
   * 发送预警通知
   */
  async notifyWarning(title: string, content: string, url?: string): Promise<NotificationResult> {
    return this.sendNotification({
      title,
      content,
      type: 'warning',
      url,
      businessType: 'warning'
    })
  }

  /**
   * 发送错误通知
   */
  async notifyError(title: string, content: string): Promise<NotificationResult> {
    return this.sendNotification({
      title,
      content,
      type: 'error',
      businessType: 'error'
    })
  }

  /**
   * 检查是否支持通知
   */
  isNotificationSupported(): boolean {
    return this.isWeChatEnv || 
           ('Notification' in window && this.notificationPermission === 'granted')
  }

  /**
   * 获取通知权限状态
   */
  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission
  }

  /**
   * 请求通知权限
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window && this.notificationPermission === 'default') {
      try {
        this.notificationPermission = await Notification.requestPermission()
        return this.notificationPermission
      } catch (error) {
        console.error('请求通知权限失败:', error)
        return 'denied'
      }
    }
    return this.notificationPermission
  }
}

// 导出单例实例
export const mobileNotificationService = new MobileNotificationService()

export default MobileNotificationService
