import React, { useEffect } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AppRouter } from './router'
import { useAuthStore } from './stores/authStore'
import { usePermissionStore } from './stores/permissionStore'
import { ErrorBoundary } from './components/error'
import { tokenManager } from './services/tokenManager'
import { authService } from './services/authService'
import { logger } from './utils/logger'

// 全局样式
import './styles/index.scss'

const App: React.FC = () => {
  const { initialize } = useAuthStore()
  const { initializePermissions } = usePermissionStore()

  // 应用初始化
  useEffect(() => {
    const initApp = async () => {
      try {
        logger.initStart()
        
        // 检查Token有效性
        if (tokenManager.isTokenValid()) {
          logger.tokenValid()
          await initialize()
          
          // 初始化权限
          logger.permissionInit()
          initializePermissions()
          
          // 自动刷新Token（如果需要）
          if (authService.shouldRefreshToken()) {
            logger.tokenRefresh()
            try {
              await authService.refreshToken()
            } catch (error) {
              logger.tokenRefreshFailed(error)
            }
          }
        } else {
          logger.tokenInvalid()
        }
        
        logger.initSuccess()
      } catch (error) {
        logger.initError(error)
        
        // 初始化失败时清除可能损坏的认证数据
        tokenManager.clearTokens()
      }
    }

    initApp()
  }, [initialize, initializePermissions])

  return (
    <ErrorBoundary>
      <ConfigProvider 
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          }
        }}
      >
        <AntdApp>
          <AppRouter />
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
