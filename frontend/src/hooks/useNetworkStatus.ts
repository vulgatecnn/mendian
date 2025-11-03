/**
 * 网络状态检测 Hook
 * 监听网络连接状态变化
 */
import { useState, useEffect, useCallback } from 'react'
import { Message } from '@arco-design/web-react'

/**
 * 网络状态类型
 */
export type NetworkStatus = 'online' | 'offline' | 'slow'

/**
 * 网络信息
 */
export interface NetworkInfo {
  status: NetworkStatus
  effectiveType?: string // 网络类型：'slow-2g', '2g', '3g', '4g'
  downlink?: number      // 下行速度（Mbps）
  rtt?: number           // 往返时间（ms）
  saveData?: boolean     // 是否启用省流量模式
}

/**
 * Hook 选项
 */
interface UseNetworkStatusOptions {
  showNotification?: boolean  // 是否显示网络状态通知
  slowThreshold?: number      // 慢速网络阈值（ms）
}

/**
 * 网络状态检测 Hook
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}) {
  const {
    showNotification = true,
    slowThreshold = 1000
  } = options

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    status: navigator.onLine ? 'online' : 'offline'
  })

  /**
   * 获取网络连接信息
   */
  const getNetworkInfo = useCallback((): NetworkInfo => {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection

    const info: NetworkInfo = {
      status: navigator.onLine ? 'online' : 'offline'
    }

    if (connection) {
      info.effectiveType = connection.effectiveType
      info.downlink = connection.downlink
      info.rtt = connection.rtt
      info.saveData = connection.saveData

      // 判断是否为慢速网络
      if (connection.rtt && connection.rtt > slowThreshold) {
        info.status = 'slow'
      }
    }

    return info
  }, [slowThreshold])

  /**
   * 更新网络状态
   */
  const updateNetworkStatus = useCallback(() => {
    const newInfo = getNetworkInfo()
    setNetworkInfo(prevInfo => {
      // 状态变化时显示通知
      if (showNotification && prevInfo.status !== newInfo.status) {
        switch (newInfo.status) {
          case 'online':
            Message.success('网络已连接')
            break
          case 'offline':
            Message.warning('网络已断开，将使用离线缓存')
            break
          case 'slow':
            Message.info('网络较慢，建议切换到更好的网络环境')
            break
        }
      }

      return newInfo
    })
  }, [getNetworkInfo, showNotification])

  /**
   * 在线事件处理
   */
  const handleOnline = useCallback(() => {
    updateNetworkStatus()
  }, [updateNetworkStatus])

  /**
   * 离线事件处理
   */
  const handleOffline = useCallback(() => {
    updateNetworkStatus()
  }, [updateNetworkStatus])

  /**
   * 网络变化事件处理
   */
  const handleConnectionChange = useCallback(() => {
    updateNetworkStatus()
  }, [updateNetworkStatus])

  /**
   * 监听网络状态变化
   */
  useEffect(() => {
    // 初始化网络状态
    updateNetworkStatus()

    // 监听在线/离线事件
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 监听网络连接变化
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // 清理事件监听
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [handleOnline, handleOffline, handleConnectionChange, updateNetworkStatus])

  /**
   * 检查是否在线
   */
  const isOnline = networkInfo.status === 'online' || networkInfo.status === 'slow'

  /**
   * 检查是否离线
   */
  const isOffline = networkInfo.status === 'offline'

  /**
   * 检查是否慢速网络
   */
  const isSlow = networkInfo.status === 'slow'

  /**
   * 获取网络类型描述
   */
  const getNetworkTypeText = useCallback(() => {
    switch (networkInfo.effectiveType) {
      case 'slow-2g':
        return '2G（慢速）'
      case '2g':
        return '2G'
      case '3g':
        return '3G'
      case '4g':
        return '4G'
      default:
        return '未知'
    }
  }, [networkInfo.effectiveType])

  return {
    networkInfo,
    isOnline,
    isOffline,
    isSlow,
    getNetworkTypeText,
    updateNetworkStatus
  }
}

export default useNetworkStatus
