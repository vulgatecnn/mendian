import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import App from './App'
import { themeConfig } from './styles/theme'
import './styles/index.scss'
import { initMobileOptimization } from './utils/device'

// 设置dayjs中文
dayjs.locale('zh-cn')

// 初始化移动端优化
initMobileOptimization()

// 配置React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000, // 10分钟
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
})

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
// 触发测试服务器部署 - 2025年08月30日  9:31:35
