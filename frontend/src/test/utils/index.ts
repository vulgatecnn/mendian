// 测试工具统一导出

// 核心渲染工具
export {
  render,
  renderPage,
  renderModal,
  renderForm,
  renderMobile,
  renderWithPermissions,
  renderUnauthenticated,
  createTestQueryClient,
  cleanup,
  // Re-export testing library utilities
  screen,
  fireEvent,
  waitFor,
  within,
  userEvent,
} from './renderWithProviders'

// 点击测试工具
export {
  ClickTestUtils,
  AntdClickTestUtils,
  clickTestUtils,
  antdClickTestUtils,
  testAllClicks,
  expectAllClicksWork,
} from './clickTestUtils'

// Mock工具
export {
  MockFactory,
  ApiMockUtils,
  QueryMockUtils,
  PropsMockUtils,
  StorageMockUtils,
  TimeMockUtils,
  HttpMockUtils,
  createCompleteMock,
} from './mockUtils'

// 测试助手
export {
  TestHelpers,
  testHelpers,
  waitForElement,
  waitForLoadingToComplete,
  fillForm,
  submitForm,
  searchTable,
  operateTableRow,
  openModal,
  closeModal,
  confirmModal,
} from './testHelpers'

// 通用测试配置
export const TEST_CONFIG = {
  // 默认超时时间
  DEFAULT_TIMEOUT: 3000,
  LOADING_TIMEOUT: 5000,
  NETWORK_TIMEOUT: 10000,
  
  // 默认分页配置
  DEFAULT_PAGE_SIZE: 20,
  
  // 测试用户配置
  TEST_USER: {
    id: 'test-user-1',
    name: '测试用户',
    email: 'test@example.com',
    department: '测试部门',
    roles: ['商务人员'],
    permissions: ['store:read', 'store:write', 'expansion:read', 'expansion:write'],
  },
  
  // 测试数据前缀
  TEST_DATA_PREFIX: 'TEST_',
  
  // 测试环境配置
  TEST_ENV: {
    API_BASE_URL: 'http://localhost:7900/api/v1',
    MOCK_DELAY: 100,
    ENABLE_NETWORK_ERROR_SIMULATION: false,
  },
} as const

// 通用断言助手
export const assertions = {
  // 断言元素存在且可见
  expectVisible: (selector: string) => {
    const element = document.querySelector(selector)
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
    return element
  },
  
  // 断言元素包含文本
  expectText: (selector: string, text: string) => {
    const element = document.querySelector(selector)
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent(text)
    return element
  },
  
  // 断言表格行数
  expectTableRows: (count: number) => {
    const rows = document.querySelectorAll('.ant-table-tbody tr:not(.ant-table-placeholder)')
    expect(rows).toHaveLength(count)
    return rows
  },
  
  // 断言表单字段有错误
  expectFormError: (fieldName: string, errorMessage?: string) => {
    const errorElement = document.querySelector(`[data-testid="${fieldName}-error"], .ant-form-item-explain-error`)
    expect(errorElement).toBeInTheDocument()
    
    if (errorMessage) {
      expect(errorElement).toHaveTextContent(errorMessage)
    }
    
    return errorElement
  },
  
  // 断言API调用
  expectApiCall: (mockFn: any, url: string, method: string = 'GET') => {
    expect(mockFn).toHaveBeenCalled()
    const calls = mockFn.mock.calls
    const matchingCall = calls.find((call: any) => 
      call[0]?.url?.includes(url) || call[0]?.method?.toUpperCase() === method.toUpperCase()
    )
    expect(matchingCall).toBeTruthy()
    return matchingCall
  },
}

// 测试场景生成器
export const scenarioBuilder = {
  // 创建CRUD测试场景
  createCrudScenario: (entityName: string) => ({
    list: `应该正确显示${entityName}列表`,
    create: `应该能够创建新的${entityName}`,
    update: `应该能够编辑${entityName}`,
    delete: `应该能够删除${entityName}`,
    search: `应该能够搜索${entityName}`,
    pagination: `应该支持${entityName}分页`,
    validation: `应该验证${entityName}表单字段`,
    loading: `应该正确处理${entityName}加载状态`,
    error: `应该正确处理${entityName}错误状态`,
  }),
  
  // 创建权限测试场景
  createPermissionScenario: (resource: string) => ({
    authenticated: `已认证用户应该能够访问${resource}`,
    unauthenticated: `未认证用户应该无法访问${resource}`,
    authorized: `有权限用户应该能够操作${resource}`,
    unauthorized: `无权限用户应该无法操作${resource}`,
    roleBasedAccess: `不同角色应该有不同的${resource}访问权限`,
  }),
  
  // 创建响应式测试场景
  createResponsiveScenario: (component: string) => ({
    desktop: `${component}应该在桌面端正确显示`,
    tablet: `${component}应该在平板端正确显示`,
    mobile: `${component}应该在移动端正确显示`,
    resize: `${component}应该响应窗口大小变化`,
  }),
}

// 性能测试工具
export const performanceUtils = {
  // 测量组件渲染时间
  measureRenderTime: async (renderFn: () => Promise<void>): Promise<number> => {
    const startTime = performance.now()
    await renderFn()
    const endTime = performance.now()
    return endTime - startTime
  },
  
  // 检查内存使用
  checkMemoryUsage: (componentName: string) => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    return {
      finish: () => {
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
        const memoryDiff = finalMemory - initialMemory
        
        if (memoryDiff > 1024 * 1024) { // 1MB threshold
          console.warn(`Potential memory leak in ${componentName}: ${memoryDiff} bytes`)
        }
        
        return memoryDiff
      }
    }
  },
}

// 可访问性测试工具
export const a11yUtils = {
  // 基础可访问性检查
  checkBasicA11y: (container: HTMLElement = document.body) => {
    const issues: string[] = []
    
    // 检查图片alt属性
    const imagesWithoutAlt = container.querySelectorAll('img:not([alt])')
    if (imagesWithoutAlt.length > 0) {
      issues.push(`Found ${imagesWithoutAlt.length} images without alt text`)
    }
    
    // 检查表单标签
    const unlabeledInputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby]):not([id])')
    if (unlabeledInputs.length > 0) {
      issues.push(`Found ${unlabeledInputs.length} inputs without labels`)
    }
    
    // 检查按钮可访问名称
    const buttonsWithoutNames = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby]):empty')
    if (buttonsWithoutNames.length > 0) {
      issues.push(`Found ${buttonsWithoutNames.length} buttons without accessible names`)
    }
    
    return issues
  },
  
  // 键盘导航检查
  checkKeyboardNavigation: (container: HTMLElement = document.body) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    return {
      focusableCount: focusableElements.length,
      hasTrapFocus: !!container.querySelector('[data-focus-trap]'),
      hasSkipLink: !!container.querySelector('a[href="#main"], .skip-link'),
    }
  },
}

// 错误边界测试工具
export const errorUtils = {
  // 模拟组件错误
  simulateComponentError: () => {
    const ThrowError = () => {
      throw new Error('Test error for error boundary')
    }
    return ThrowError
  },
  
  // 模拟网络错误
  simulateNetworkError: (status: number = 500, message: string = 'Network error') => {
    return Promise.reject({
      status,
      message,
      response: {
        data: { message },
        status,
      },
    })
  },
  
  // 模拟超时错误
  simulateTimeoutError: () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 0)
    })
  },
}

// 导出vitest相关
export { vi, expect, describe, it, test, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'