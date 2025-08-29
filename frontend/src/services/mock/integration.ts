/**
 * Mock服务集成配置
 * 用于将Mock服务集成到应用中
 */
import { startMockService } from './index'

// 环境变量配置
export const MOCK_CONFIG = {
  enabled: process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENABLE_MOCK === 'true',
  delay: {
    min: parseInt(process.env.REACT_APP_MOCK_DELAY_MIN || '300', 10),
    max: parseInt(process.env.REACT_APP_MOCK_DELAY_MAX || '800', 10),
  },
  errorRate: parseFloat(process.env.REACT_APP_MOCK_ERROR_RATE || '0.05'),
}

/**
 * 应用启动时初始化Mock服务
 */
export async function initializeMockService(): Promise<void> {
  if (!MOCK_CONFIG.enabled) {
    console.log('Mock服务未启用，跳过初始化')
    return
  }

  try {
    console.log('🚀 正在启动Mock服务...')
    
    // 启动MSW服务
    await startMockService()
    
    // 输出配置信息
    console.log('📋 Mock服务配置:')
    console.log(`  - 网络延迟: ${MOCK_CONFIG.delay.min}-${MOCK_CONFIG.delay.max}ms`)
    console.log(`  - 错误率: ${(MOCK_CONFIG.errorRate * 100).toFixed(1)}%`)
    
    // 开发环境下的额外功能
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️  开发工具已启用:')
      console.log('  - 在控制台使用 window.resetMockData() 重置数据')
      console.log('  - 在控制台使用 window.getMockDataStats() 查看统计')
    }
    
  } catch (error) {
    console.error('❌ Mock服务初始化失败:', error)
  }
}

/**
 * React应用中的Hook集成示例
 */
export function useMockInitialization() {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        await initializeMockService()
        if (mounted) {
          setIsInitialized(true)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Mock服务启动失败')
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  return { isInitialized, error }
}

// 类型定义（如果需要在其他地方使用）
declare global {
  interface Window {
    resetMockData: () => void
    getMockDataStats: () => any
    mockWorker: any
  }
}

// React import（如果在React环境中使用）
import React from 'react'