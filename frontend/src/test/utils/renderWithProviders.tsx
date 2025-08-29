import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { vi } from 'vitest'
import type { ReactElement } from 'react'

// 扩展的渲染选项
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // React Query 选项
  queryClient?: QueryClient
  
  // 路由选项
  initialEntries?: string[]
  useMemoryRouter?: boolean
  
  // Antd 配置选项
  antdConfig?: React.ComponentProps<typeof ConfigProvider>
  
  // 自定义wrapper
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
  
  // 认证状态模拟
  authState?: {
    isAuthenticated?: boolean
    user?: any
    permissions?: string[]
    roles?: string[]
  }
  
  // 业务store状态
  initialStoreState?: {
    storePlan?: any
    expansion?: any
    preparation?: any
    auth?: any
  }
}

// 创建测试用QueryClient
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// 认证Provider Mock
const MockAuthProvider: React.FC<{ 
  children: React.ReactNode
  authState?: ExtendedRenderOptions['authState']
}> = ({ children, authState }) => {
  // 这里可以根据需要mock认证状态
  const mockAuthContext = {
    isAuthenticated: authState?.isAuthenticated ?? true,
    user: authState?.user ?? {
      id: 'test-user-1',
      name: '测试用户',
      email: 'test@example.com',
      department: '测试部门'
    },
    permissions: authState?.permissions ?? ['store:read', 'store:write'],
    roles: authState?.roles ?? ['商务人员'],
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: vi.fn().mockReturnValue(true),
    hasRole: vi.fn().mockReturnValue(true),
  }

  // 在实际项目中，这里应该使用真实的AuthProvider
  // 现在只是将context值传递给children
  return <>{children}</>
}

// 组合所有Provider的Wrapper组件
const AllTheProviders: React.FC<{
  children: React.ReactNode
  options: ExtendedRenderOptions
}> = ({ children, options }) => {
  const queryClient = options.queryClient || createTestQueryClient()
  
  const RouterComponent = options.useMemoryRouter ? MemoryRouter : BrowserRouter
  const routerProps = options.useMemoryRouter ? 
    { initialEntries: options.initialEntries || ['/'] } : {}

  return (
    <QueryClientProvider client={queryClient}>
      <RouterComponent {...routerProps}>
        <ConfigProvider 
          locale={zhCN}
          {...options.antdConfig}
        >
          <MockAuthProvider authState={options.authState}>
            {children}
          </MockAuthProvider>
        </ConfigProvider>
      </RouterComponent>
    </QueryClientProvider>
  )
}

// 主渲染函数
const customRender = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  const { wrapper, ...renderOptions } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const WrappedChildren = wrapper ? (
      React.createElement(wrapper, { children }, children)
    ) : children

    return (
      <AllTheProviders options={options}>
        {WrappedChildren}
      </AllTheProviders>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// 专门用于页面组件的渲染函数
export const renderPage = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  return customRender(ui, {
    useMemoryRouter: true,
    initialEntries: ['/'],
    ...options,
  })
}

// 专门用于模态框的渲染函数
export const renderModal = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  // 模态框通常需要特殊的DOM结构
  const modalRoot = document.createElement('div')
  modalRoot.setAttribute('id', 'modal-root')
  document.body.appendChild(modalRoot)

  const result = customRender(ui, {
    container: modalRoot,
    ...options,
  })

  // 清理函数
  const originalUnmount = result.unmount
  result.unmount = () => {
    originalUnmount()
    document.body.removeChild(modalRoot)
  }

  return result
}

// 用于表单组件的渲染函数
export const renderForm = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  return customRender(ui, {
    antdConfig: {
      form: {
        validateMessages: {
          required: '${label}是必填项',
        },
      },
    },
    ...options,
  })
}

// 用于移动端组件的渲染函数
export const renderMobile = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  // 设置移动端视口
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  })

  // 触发resize事件
  window.dispatchEvent(new Event('resize'))

  return customRender(ui, options)
}

// 用于需要特定权限的组件渲染
export const renderWithPermissions = (
  ui: ReactElement,
  permissions: string[] = [],
  roles: string[] = [],
  options: ExtendedRenderOptions = {}
) => {
  return customRender(ui, {
    authState: {
      isAuthenticated: true,
      permissions,
      roles,
    },
    ...options,
  })
}

// 用于未认证状态的组件渲染
export const renderUnauthenticated = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  return customRender(ui, {
    authState: {
      isAuthenticated: false,
      user: null,
      permissions: [],
      roles: [],
    },
    ...options,
  })
}

// 导出所有渲染函数
export {
  customRender as render,
}

// 重新导出 @testing-library/react 的所有内容（除了render）
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// 便捷的清理函数
export const cleanup = () => {
  // 清理QueryClient缓存
  const queryClient = createTestQueryClient()
  queryClient.clear()
  
  // 清理localStorage
  window.localStorage.clear()
  
  // 重置window大小
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  })
}