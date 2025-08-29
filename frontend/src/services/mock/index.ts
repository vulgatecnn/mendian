/**
 * Mock服务主入口
 * 配置和启动MSW Mock服务
 */
import { setupWorker } from 'msw'
import { authHandlers } from './handlers/auth.handler'
import { storePlanHandlers } from './handlers/storePlan.handler'
import { preparationHandlers } from './handlers/preparation'
import { storeFilesHandlers } from './handlers/storeFiles'
import { approvalHandlers } from './handlers/approval'
import { basicDataHandlers } from './handlers/basicData'
import { operationHandlers } from './handlers/operation'
import { ExpansionMockHandler } from './handlers/expansion'

// 开发环境配置
const isDevelopment = process.env.NODE_ENV === 'development'
const ENABLE_MOCK = process.env.REACT_APP_ENABLE_MOCK === 'true' || isDevelopment

// 初始化拓店处理器
const expansionHandler = new ExpansionMockHandler()

// 合并所有处理器
export const handlers = [
  ...authHandlers,
  ...storePlanHandlers,
  ...expansionHandler.getHandlers(),
  ...preparationHandlers,
  ...storeFilesHandlers,
  ...approvalHandlers,
  ...basicDataHandlers,
  ...operationHandlers,
]

// 创建Service Worker
export const worker = setupWorker(...handlers)

// 启动Mock服务
export async function startMockService() {
  if (!ENABLE_MOCK) {
    console.log('Mock服务未启用')
    return
  }

  try {
    await worker.start({
      onUnhandledRequest: 'bypass', // 未处理的请求直接通过
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })
    
    console.log('🚀 Mock服务启动成功')
    console.log('📊 Mock数据统计:', await import('./mockData').then(m => m.getMockDataStats()))
    
    // 开发环境下添加调试信息
    if (isDevelopment) {
      console.log('🔧 开发模式下的Mock功能:')
      console.log('  - 网络延迟模拟: 300-800ms')
      console.log('  - 错误率模拟: 2-5%')
      console.log('  - 数据重置: window.resetMockData()')
      console.log('  - 数据统计: window.getMockDataStats()')
      
      // 暴露调试功能到全局
      if (typeof window !== 'undefined') {
        (window as any).resetMockData = (await import('./mockData')).resetMockData
        ;(window as any).getMockDataStats = (await import('./mockData')).getMockDataStats
        ;(window as any).mockWorker = worker
      }
    }
    
  } catch (error) {
    console.error('❌ Mock服务启动失败:', error)
  }
}

// 停止Mock服务
export function stopMockService() {
  worker.stop()
  console.log('🛑 Mock服务已停止')
}

// 重置处理器
export function resetHandlers(newHandlers?: typeof handlers) {
  worker.resetHandlers(...(newHandlers || handlers))
  console.log('🔄 Mock处理器已重置')
}

// 动态添加处理器
export function useHandler(...newHandlers: typeof handlers) {
  worker.use(...newHandlers)
}

// 运行时控制
export const mockService = {
  start: startMockService,
  stop: stopMockService,
  reset: resetHandlers,
  use: useHandler,
  worker,
  handlers,
  isEnabled: ENABLE_MOCK,
}

// 兼容旧版本API
export const initMockService = startMockService
export const isMockEnabled = () => ENABLE_MOCK

// 默认导出
export default mockService

// 开发环境自动启动（可选）
if (ENABLE_MOCK && typeof window !== 'undefined') {
  // 等待DOM加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMockService)
  } else {
    startMockService()
  }
}
