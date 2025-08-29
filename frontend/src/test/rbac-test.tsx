/**
 * RBAC权限系统测试
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'
import { themeConfig } from '../styles/theme'

// 创建测试根节点
const container = document.createElement('div')
container.id = 'test-root'
document.body.appendChild(container)

// 配置React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false
    }
  }
})

// 测试应用
const TestApp: React.FC = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN} theme={themeConfig}>
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

// 渲染应用
const root = createRoot(container)
root.render(<TestApp />)

console.log('RBAC权限系统测试已启动')
console.log('测试账号: admin / 123456')
console.log('访问地址: http://localhost:5173')

// 导出测试工具
export { TestApp, queryClient }
