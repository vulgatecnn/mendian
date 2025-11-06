/**
 * 移动端通知 Hook
 * 提供便捷的通知推送功能
 */
import { useState, useEffect, useCallback } from 'react'
import { 
  mobileNotificationService, 
  NotificationConfig, 
  NotificationResult 
} from '../components/analytics/MobileNotificationService'

/**
 * Hook 选项
 */
interface UseMobileNotificationOptions {
  autoRequestPermission?: boolean // 是否自动请求通知权限
  enableDataUpdateNotification?: boolean // 是否启用数据更新通知
}

/**
 * 移动端通知 Hook
 */
export function useMobileNotification(options: UseMobileNotificationOptions = {}) {
  const {
    autoRequestPermission = false,
    enableDataUpdateNotification = true
  } = options

  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  /**
   * 初始化通知服务
   */
  useEffect(() => {
    const init = async () => {
      setIsSupported(mobileNotificationService.isNotificationSupported())
      setPermission(mobileNotificationService.getNotificationPermission())

      // 自动请求权限
      if (autoRequestPermission && permission === 'default') {
        const newPermission = await mobileNotificationService.requestNotificationPermission()
        setPermission(newPermission)
        setIsSupported(mobileNotificationService.isNotificationSupported())
      }
    }

    init()
  }, [autoRequestPermission, permission])

  /**
   * 发送通知
   */
  const sendNotification = useCallback(async (
    config: NotificationConfig
  ): Promise<NotificationResult> => {
    return await mobileNotificationService.sendNotification(config)
  }, [])

  /**
   * 发送数据更新通知
   */
  const notifyDataUpdate = useCallback(async (
    dataType: string,
    message: string
  ): Promise<NotificationResult> => {
    if (!enableDataUpdateNotification) {
      return { success: false, message: '数据更新通知已禁用' }
    }
    return await mobileNotificationService.notifyDataUpdate(dataType, message)
  }, [enableDataUpdateNotification])

  /**
   * 发送预警通知
   */
  const notifyWarning = useCallback(async (
    title: string,
    content: string,
    url?: string
  ): Promise<NotificationResult> => {
    return await mobileNotificationService.notifyWarning(title, content, url)
  }, [])

  /**
   * 发送错误通知
   */
  const notifyError = useCallback(async (
    title: string,
    content: string
  ): Promise<NotificationResult> => {
    return await mobileNotificationService.notifyError(title, content)
  }, [])

  /**
   * 批量发送通知
   */
  const sendBatchNotifications = useCallback(async (
    configs: NotificationConfig[]
  ): Promise<NotificationResult[]> => {
    return await mobileNotificationService.sendBatchNotifications(configs)
  }, [])

  /**
   * 请求通知权限
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const newPermission = await mobileNotificationService.requestNotificationPermission()
    setPermission(newPermission)
    setIsSupported(mobileNotificationService.isNotificationSupported())
    return newPermission
  }, [])

  return {
    isSupported,
    permission,
    sendNotification,
    notifyDataUpdate,
    notifyWarning,
    notifyError,
    sendBatchNotifications,
    requestPermission
  }
}

export default useMobileNotification
