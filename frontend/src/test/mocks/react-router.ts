import { vi } from 'vitest'
import type { NavigateFunction, Location } from 'react-router-dom'

// React Router Mock实现
export const routerMocks = {
  // useNavigate hook mock
  useNavigate: vi.fn((): NavigateFunction => {
    const navigate = vi.fn((to: any, options?: any) => {
      console.log('Navigate called:', { to, options })
      // 可以在这里触发路由变化的副作用
      if (typeof to === 'string') {
        window.history.pushState({}, '', to)
      } else if (typeof to === 'number') {
        if (to === -1) {
          window.history.back()
        } else if (to === 1) {
          window.history.forward()
        }
      }
    })
    
    // 添加navigate的额外方法
    Object.assign(navigate, {
      replace: vi.fn(),
      go: vi.fn(),
    })
    
    return navigate
  }),

  // useLocation hook mock
  useLocation: vi.fn((): Location => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  })),

  // useParams hook mock
  useParams: vi.fn(() => ({})),

  // useSearchParams hook mock (React Router v6)
  useSearchParams: vi.fn(() => [
    new URLSearchParams(),
    vi.fn()
  ]),

  // useMatch hook mock
  useMatch: vi.fn(() => null),

  // useMatches hook mock
  useMatches: vi.fn(() => []),

  // Navigate component mock
  Navigate: vi.fn(({ to, replace, state }) => {
    // 立即执行导航
    setTimeout(() => {
      if (replace) {
        window.history.replaceState(state, '', to)
      } else {
        window.history.pushState(state, '', to)
      }
    }, 0)
    return null
  }),

  // Link component mock
  Link: vi.fn(({ children, to, replace, state, ...props }) =>
    React.createElement('a', {
      href: typeof to === 'string' ? to : to.pathname,
      onClick: (e: Event) => {
        e.preventDefault()
        if (replace) {
          window.history.replaceState(state, '', to)
        } else {
          window.history.pushState(state, '', to)
        }
      },
      'data-testid': 'mock-link',
      ...props,
    }, children)
  ),

  // NavLink component mock
  NavLink: vi.fn(({ children, to, className, style, ...props }) => {
    const isActive = window.location.pathname === to
    const activeClassName = typeof className === 'function' 
      ? className({ isActive, isPending: false })
      : className
    const activeStyle = typeof style === 'function'
      ? style({ isActive, isPending: false })
      : style

    return React.createElement('a', {
      href: to,
      className: activeClassName,
      style: activeStyle,
      onClick: (e: Event) => {
        e.preventDefault()
        window.history.pushState({}, '', to)
      },
      'data-testid': 'mock-nav-link',
      'data-active': isActive,
      ...props,
    }, children)
  }),

  // Outlet component mock
  Outlet: vi.fn(({ context }) => 
    React.createElement('div', {
      'data-testid': 'mock-outlet',
      'data-context': context,
    }, 'Outlet Content')
  ),

  // Router component mock
  BrowserRouter: vi.fn(({ children }) =>
    React.createElement('div', {
      'data-testid': 'mock-browser-router',
    }, children)
  ),

  // MemoryRouter component mock
  MemoryRouter: vi.fn(({ children, initialEntries = ['/'] }) => {
    // 设置初始路由状态
    if (initialEntries.length > 0) {
      window.history.replaceState({}, '', initialEntries[0])
    }
    
    return React.createElement('div', {
      'data-testid': 'mock-memory-router',
      'data-initial-entries': JSON.stringify(initialEntries),
    }, children)
  }),

  // Routes component mock
  Routes: vi.fn(({ children }) =>
    React.createElement('div', {
      'data-testid': 'mock-routes',
    }, children)
  ),

  // Route component mock
  Route: vi.fn(({ path, element, children }) => {
    const currentPath = window.location.pathname
    const isMatch = path === currentPath || path === '*'
    
    return isMatch ? React.createElement('div', {
      'data-testid': 'mock-route',
      'data-path': path,
    }, element || children) : null
  }),
}

// 创建带有历史记录的mock router
export const createMockRouter = (initialEntries: string[] = ['/']) => {
  let currentIndex = 0
  let history = [...initialEntries]

  const mockHistory = {
    length: history.length,
    action: 'POP',
    location: {
      pathname: history[currentIndex],
      search: '',
      hash: '',
      state: null,
      key: 'default',
    },
    push: vi.fn((to: string, state?: any) => {
      history = history.slice(0, currentIndex + 1)
      history.push(to)
      currentIndex = history.length - 1
      mockHistory.location = {
        pathname: to,
        search: '',
        hash: '',
        state,
        key: `key-${Date.now()}`,
      }
    }),
    replace: vi.fn((to: string, state?: any) => {
      history[currentIndex] = to
      mockHistory.location = {
        pathname: to,
        search: '',
        hash: '',
        state,
        key: mockHistory.location.key,
      }
    }),
    go: vi.fn((n: number) => {
      const newIndex = currentIndex + n
      if (newIndex >= 0 && newIndex < history.length) {
        currentIndex = newIndex
        mockHistory.location.pathname = history[currentIndex]
      }
    }),
    back: vi.fn(() => mockHistory.go(-1)),
    forward: vi.fn(() => mockHistory.go(1)),
    listen: vi.fn(() => vi.fn()),
    block: vi.fn(() => vi.fn()),
  }

  return {
    history: mockHistory,
    navigate: mockHistory.push,
    location: mockHistory.location,
  }
}

// 高级路由mock工具
export class RouterMockUtils {
  private mockRouter = createMockRouter()

  // 设置当前路由
  setCurrentRoute(path: string, search: string = '', hash: string = '', state: any = null) {
    this.mockRouter.location.pathname = path
    this.mockRouter.location.search = search
    this.mockRouter.location.hash = hash
    this.mockRouter.location.state = state
    
    // 更新window location
    window.history.replaceState(state, '', path + search + hash)
  }

  // 模拟导航
  navigate(to: string, options: { replace?: boolean; state?: any } = {}) {
    if (options.replace) {
      this.mockRouter.history.replace(to, options.state)
    } else {
      this.mockRouter.history.push(to, options.state)
    }
  }

  // 获取当前位置
  getCurrentLocation() {
    return this.mockRouter.location
  }

  // 重置路由状态
  reset() {
    this.mockRouter = createMockRouter()
    window.history.replaceState({}, '', '/')
  }

  // 检查路由是否匹配
  isRouteMatch(pattern: string, path: string = this.mockRouter.location.pathname): boolean {
    if (pattern === path) return true
    if (pattern === '*') return true
    
    // 简单的路径参数匹配
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')
    
    if (patternParts.length !== pathParts.length) return false
    
    return patternParts.every((part, index) => {
      if (part.startsWith(':')) return true // 参数匹配
      return part === pathParts[index]
    })
  }

  // 提取路径参数
  extractParams(pattern: string, path: string = this.mockRouter.location.pathname): Record<string, string> {
    const params: Record<string, string> = {}
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')
    
    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1)
        params[paramName] = pathParts[index]
      }
    })
    
    return params
  }
}

// 创建单例实例
export const routerMockUtils = new RouterMockUtils()

// 设置React Router mocks
export const setupReactRouterMocks = () => {
  vi.mock('react-router-dom', () => routerMocks)
  
  // 同时mock window.location
  const mockLocation = {
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  }
  
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
    configurable: true,
  })
}

// 用于测试的路由包装器
export const RouterTestWrapper: React.FC<{ 
  children: React.ReactNode
  initialEntries?: string[]
}> = ({ children, initialEntries = ['/'] }) => {
  const router = createMockRouter(initialEntries)
  
  return React.createElement('div', {
    'data-testid': 'router-test-wrapper',
    'data-current-path': router.location.pathname,
  }, children)
}

export default routerMocks