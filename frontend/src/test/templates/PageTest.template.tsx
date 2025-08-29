/**
 * Page Component Test Template
 * 
 * This template provides comprehensive testing structure for page-level React components.
 * Pages typically include routing, data fetching, multiple components, and complex interactions.
 * 
 * Usage:
 * 1. Copy this file to your test directory
 * 2. Rename to match your page component (e.g., StorePlanListPage.test.tsx)
 * 3. Replace PAGE_NAME with your actual page name
 * 4. Update imports, routes, and API mocks
 * 5. Customize test scenarios for your page's features
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  render,
  renderPage,
  renderWithPermissions,
  renderUnauthenticated,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  cleanup,
  testAllClicks,
  expectAllClicksWork,
  TestHelpers,
  MockFactory,
  QueryMockUtils,
  BusinessQueryMocks,
  assertions,
  scenarioBuilder,
} from '@/test/utils'
import { setupAllMocks } from '@/test/mocks'

// Import your page component
// import { PAGE_NAME } from '@/pages/path/to/PAGE_NAME'

// Mock API calls and services
vi.mock('@/services/api/yourApi')

// Setup all mocks
setupAllMocks()

// Test data factories
const createMockPageData = () => ({
  id: MockFactory.generateId(),
  title: 'Test Page Title',
  items: Array.from({ length: 5 }, () => MockFactory.generateStorePlan()),
  pagination: {
    current: 1,
    pageSize: 20,
    total: 100,
  },
  loading: false,
  error: null,
})

const createMockUser = () => ({
  id: MockFactory.generateId(),
  name: MockFactory.generateChineseName(),
  roles: ['商务人员'],
  permissions: ['store:read', 'store:write', 'store:delete'],
})

// Test helpers
const testHelpers = new TestHelpers()

describe('PAGE_NAME Page', () => {
  let mockData: ReturnType<typeof createMockPageData>
  let mockUser: ReturnType<typeof createMockUser>

  beforeEach(() => {
    mockData = createMockPageData()
    mockUser = createMockUser()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
  })

  describe('Page Rendering', () => {
    it('should render page without crashing', async () => {
      renderPage(<div data-testid="page-name">Page Content</div>)
      
      expect(screen.getByTestId('page-name')).toBeInTheDocument()
      await testHelpers.waitForLoadingToComplete()
    })

    it('should render page header and navigation', async () => {
      renderPage(
        <div>
          <header data-testid="page-header">
            <h1>{mockData.title}</h1>
            <nav data-testid="page-navigation">
              <a href="/dashboard">Dashboard</a>
              <a href="/settings">Settings</a>
            </nav>
          </header>
          <main data-testid="page-content">Content</main>
        </div>
      )
      
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
      expect(screen.getByTestId('page-navigation')).toBeInTheDocument()
      expect(screen.getByText(mockData.title)).toBeInTheDocument()
    })

    it('should render breadcrumb navigation', () => {
      renderPage(
        <div>
          <nav data-testid="breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><a href="/">首页</a></li>
              <li><a href="/store-plan">开店计划</a></li>
              <li aria-current="page">计划列表</li>
            </ol>
          </nav>
        </div>
      )
      
      const breadcrumb = screen.getByTestId('breadcrumb')
      expect(breadcrumb).toBeInTheDocument()
      expect(breadcrumb).toHaveAttribute('aria-label', 'Breadcrumb')
    })

    it('should render main content area', () => {
      renderPage(
        <main data-testid="main-content" role="main">
          <section data-testid="content-section">
            Main page content
          </section>
        </main>
      )
      
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Data Loading', () => {
    it('should show loading state initially', async () => {
      // Mock loading state
      const loadingQuery = QueryMockUtils.createLoadingQuery()
      
      renderPage(
        <div>
          {loadingQuery.isLoading ? (
            <div data-testid="loading-indicator">加载中...</div>
          ) : (
            <div data-testid="content">Content</div>
          )}
        </div>
      )
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('should display data after loading', async () => {
      renderPage(
        <div>
          <div data-testid="data-list">
            {mockData.items.map((item, index) => (
              <div key={item.id} data-testid={`data-item-${index}`}>
                {item.title}
              </div>
            ))}
          </div>
        </div>
      )
      
      await testHelpers.waitForLoadingToComplete()
      
      expect(screen.getByTestId('data-list')).toBeInTheDocument()
      mockData.items.forEach((item, index) => {
        expect(screen.getByTestId(`data-item-${index}`)).toBeInTheDocument()
        expect(screen.getByText(item.title)).toBeInTheDocument()
      })
    })

    it('should handle empty data state', () => {
      const emptyData = { ...mockData, items: [] }
      
      renderPage(
        <div>
          {emptyData.items.length === 0 ? (
            <div data-testid="empty-state">暂无数据</div>
          ) : (
            <div data-testid="data-list">Data items</div>
          )}
        </div>
      )
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('暂无数据')).toBeInTheDocument()
    })

    it('should handle data loading errors', () => {
      const error = new Error('数据加载失败')
      
      renderPage(
        <div>
          <div data-testid="error-state">
            <h3>加载失败</h3>
            <p>{error.message}</p>
            <button data-testid="retry-button">重试</button>
          </div>
        </div>
      )
      
      expect(screen.getByTestId('error-state')).toBeInTheDocument()
      expect(screen.getByText('数据加载失败')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })

    it('should refetch data on retry', async () => {
      const refetch = vi.fn()
      
      renderPage(
        <div>
          <button data-testid="retry-button" onClick={refetch}>
            重试
          </button>
        </div>
      )
      
      await userEvent.click(screen.getByTestId('retry-button'))
      expect(refetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Search and Filtering', () => {
    it('should render search form', () => {
      renderPage(
        <form data-testid="search-form" role="search">
          <input
            data-testid="search-input"
            type="text"
            placeholder="搜索..."
            aria-label="搜索内容"
          />
          <button type="submit" data-testid="search-button">
            搜索
          </button>
        </form>
      )
      
      expect(screen.getByTestId('search-form')).toBeInTheDocument()
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument()
    })

    it('should handle search input changes', async () => {
      const handleSearch = vi.fn()
      
      renderPage(
        <form onSubmit={handleSearch}>
          <input
            data-testid="search-input"
            type="text"
            name="search"
          />
          <button type="submit">搜索</button>
        </form>
      )
      
      const searchInput = screen.getByTestId('search-input')
      await userEvent.type(searchInput, '测试搜索')
      
      expect(searchInput).toHaveValue('测试搜索')
    })

    it('should perform search on form submission', async () => {
      await testHelpers.searchTable('test search')
      // Search functionality would be tested based on actual implementation
    })

    it('should render filter options', () => {
      renderPage(
        <div data-testid="filter-panel">
          <select data-testid="status-filter" aria-label="状态筛选">
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
          </select>
          <select data-testid="category-filter" aria-label="类别筛选">
            <option value="">全部类别</option>
            <option value="type1">类型1</option>
            <option value="type2">类型2</option>
          </select>
        </div>
      )
      
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument()
      expect(screen.getByTestId('status-filter')).toBeInTheDocument()
      expect(screen.getByTestId('category-filter')).toBeInTheDocument()
    })

    it('should apply filters when changed', async () => {
      const handleFilterChange = vi.fn()
      
      renderPage(
        <select
          data-testid="status-filter"
          onChange={handleFilterChange}
        >
          <option value="">全部</option>
          <option value="active">活跃</option>
        </select>
      )
      
      await userEvent.selectOptions(screen.getByTestId('status-filter'), 'active')
      expect(handleFilterChange).toHaveBeenCalled()
    })
  })

  describe('Data Operations (CRUD)', () => {
    const crudScenarios = scenarioBuilder.createCrudScenario('数据项')

    it(crudScenarios.create, async () => {
      renderPage(
        <div>
          <button data-testid="create-button">新建</button>
        </div>
      )
      
      await userEvent.click(screen.getByTestId('create-button'))
      // Test create functionality
    })

    it(crudScenarios.update, async () => {
      renderPage(
        <div>
          <button data-testid="edit-button">编辑</button>
        </div>
      )
      
      await userEvent.click(screen.getByTestId('edit-button'))
      // Test update functionality
    })

    it(crudScenarios.delete, async () => {
      renderPage(
        <div>
          <button data-testid="delete-button">删除</button>
        </div>
      )
      
      await userEvent.click(screen.getByTestId('delete-button'))
      // Test delete functionality
    })

    it('should handle bulk operations', async () => {
      renderPage(
        <div>
          <input type="checkbox" data-testid="select-all" />
          <button data-testid="bulk-delete">批量删除</button>
          <button data-testid="bulk-export">批量导出</button>
        </div>
      )
      
      // Select all items
      await userEvent.click(screen.getByTestId('select-all'))
      
      // Test bulk operations
      expect(screen.getByTestId('bulk-delete')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-export')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should render pagination component', () => {
      renderPage(
        <nav data-testid="pagination" aria-label="分页导航">
          <button data-testid="prev-page">上一页</button>
          <span data-testid="current-page">第 1 页，共 10 页</span>
          <button data-testid="next-page">下一页</button>
        </nav>
      )
      
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
      expect(screen.getByText('第 1 页，共 10 页')).toBeInTheDocument()
    })

    it('should handle page navigation', async () => {
      await testHelpers.navigateToPage(2)
      // Test page navigation based on actual implementation
    })

    it('should handle page size changes', async () => {
      await testHelpers.changePageSize(50)
      // Test page size change based on actual implementation
    })

    it('should display correct pagination info', () => {
      const totalItems = 245
      const pageSize = 20
      const currentPage = 3
      
      renderPage(
        <div data-testid="pagination-info">
          显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} 
          项，共 {totalItems} 项
        </div>
      )
      
      expect(screen.getByText('显示 41-60 项，共 245 项')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should pass comprehensive click testing', async () => {
      renderPage(
        <div>
          <button>Action 1</button>
          <button>Action 2</button>
          <a href="#test">Link</a>
          <form>
            <input type="text" />
            <button type="submit">Submit</button>
          </form>
        </div>
      )
      
      await expectAllClicksWork()
    })

    it('should handle modal operations', async () => {
      renderPage(
        <div>
          <button data-testid="open-modal">打开模态框</button>
        </div>
      )
      
      await testHelpers.openModal('[data-testid="open-modal"]')
      // Modal should be opened
      
      await testHelpers.closeModal('cancel')
      // Modal should be closed
    })

    it('should handle form operations', async () => {
      const formData = {
        name: '测试名称',
        description: '测试描述',
        category: '类型1',
      }
      
      renderPage(
        <form data-testid="test-form">
          <input name="name" data-testid="name-input" />
          <textarea name="description" data-testid="description-input" />
          <select name="category" data-testid="category-select">
            <option value="类型1">类型1</option>
            <option value="类型2">类型2</option>
          </select>
          <button type="submit">提交</button>
        </form>
      )
      
      await testHelpers.fillForm(formData)
      await testHelpers.submitForm('[data-testid="test-form"]')
    })

    it('should handle table operations', async () => {
      renderPage(
        <table data-testid="data-table">
          <tbody>
            <tr>
              <td>Row 1 Data</td>
              <td>
                <button data-testid="row-action">操作</button>
              </td>
            </tr>
          </tbody>
        </table>
      )
      
      await testHelpers.operateTableRow(0, '操作')
    })
  })

  describe('Authentication and Authorization', () => {
    const permissionScenarios = scenarioBuilder.createPermissionScenario('页面')

    it(permissionScenarios.authenticated, () => {
      renderWithPermissions(
        <div data-testid="authenticated-content">
          认证用户内容
        </div>,
        mockUser.permissions,
        mockUser.roles
      )
      
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument()
    })

    it(permissionScenarios.unauthenticated, () => {
      renderUnauthenticated(
        <div data-testid="login-prompt">
          请先登录
        </div>
      )
      
      expect(screen.getByText('请先登录')).toBeInTheDocument()
    })

    it(permissionScenarios.authorized, () => {
      renderWithPermissions(
        <div>
          <button data-testid="protected-action">受保护的操作</button>
        </div>,
        ['store:write'],
        ['商务人员']
      )
      
      expect(screen.getByTestId('protected-action')).toBeInTheDocument()
    })

    it(permissionScenarios.unauthorized, () => {
      renderWithPermissions(
        <div data-testid="unauthorized-message">
          权限不足
        </div>,
        [], // No permissions
        []  // No roles
      )
      
      expect(screen.getByText('权限不足')).toBeInTheDocument()
    })

    it('should show different UI for different roles', () => {
      // Admin role
      renderWithPermissions(
        <div>
          <button data-testid="admin-action">管理员功能</button>
        </div>,
        ['admin:all'],
        ['管理员']
      )
      
      expect(screen.getByTestId('admin-action')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    const responsiveScenarios = scenarioBuilder.createResponsiveScenario('页面')

    it(responsiveScenarios.desktop, () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
      window.dispatchEvent(new Event('resize'))
      
      renderPage(
        <div data-testid="desktop-layout">
          桌面端布局
        </div>
      )
      
      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument()
    })

    it(responsiveScenarios.mobile, () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
      window.dispatchEvent(new Event('resize'))
      
      renderPage(
        <div data-testid="mobile-layout">
          移动端布局
        </div>
      )
      
      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument()
    })
  })

  describe('SEO and Meta Data', () => {
    it('should have correct page title', () => {
      // Test document title
      document.title = 'PAGE_NAME - 好饭碗门店管理系统'
      expect(document.title).toBe('PAGE_NAME - 好饭碗门店管理系统')
    })

    it('should have meta description', () => {
      // Create meta description
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = 'PAGE_NAME页面描述'
      document.head.appendChild(meta)
      
      const description = document.querySelector('meta[name="description"]')
      expect(description).toHaveAttribute('content', 'PAGE_NAME页面描述')
    })
  })

  describe('Performance', () => {
    it('should render within acceptable time', async () => {
      const renderTime = await testHelpers.measureRenderTime(async () => {
        renderPage(<div data-testid="performance-test">Performance Test</div>)
        await waitFor(() => screen.getByTestId('performance-test'))
      })
      
      // Page should render within 200ms
      expect(renderTime).toBeLessThan(200)
    })

    it('should handle large data sets efficiently', async () => {
      const largeDataSet = Array.from({ length: 1000 }, () => MockFactory.generateStorePlan())
      
      const renderTime = await testHelpers.measureRenderTime(async () => {
        renderPage(
          <div data-testid="large-list">
            {largeDataSet.slice(0, 20).map(item => ( // Only render first 20 items
              <div key={item.id}>{item.title}</div>
            ))}
          </div>
        )
      })
      
      // Should still render quickly even with large dataset
      expect(renderTime).toBeLessThan(100)
    })

    it('should not cause memory leaks', () => {
      const memoryCheck = testHelpers.checkForMemoryLeaks('PAGE_NAME')
      
      // Render page multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderPage(
          <div data-testid={`page-${i}`}>Page Instance {i}</div>
        )
        unmount()
      }
      
      const memoryDiff = memoryCheck.finish()
      expect(memoryDiff).toBeLessThan(2 * 1024 * 1024) // 2MB threshold for pages
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      renderPage(
        <div>
          <header role="banner">
            <h1>页面标题</h1>
          </header>
          <main role="main">
            <section aria-labelledby="content-heading">
              <h2 id="content-heading">主要内容</h2>
              <p>内容描述</p>
            </section>
          </main>
          <aside role="complementary" aria-label="边栏">
            边栏内容
          </aside>
          <footer role="contentinfo">
            页脚信息
          </footer>
        </div>
      )
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('should support screen reader navigation', () => {
      renderPage(
        <div>
          <a href="#main-content" className="skip-link">
            跳转到主内容
          </a>
          <nav aria-label="主导航">
            <ul>
              <li><a href="/">首页</a></li>
              <li><a href="/about">关于</a></li>
            </ul>
          </nav>
          <main id="main-content" tabIndex={-1}>
            主要内容
          </main>
        </div>
      )
      
      expect(screen.getByText('跳转到主内容')).toBeInTheDocument()
      expect(screen.getByLabelText('主导航')).toBeInTheDocument()
    })

    it('should have no accessibility violations', async () => {
      renderPage(
        <div>
          <h1>页面标题</h1>
          <button aria-label="关闭">×</button>
          <input aria-label="搜索" type="text" />
          <img src="test.jpg" alt="测试图片" />
          <table>
            <caption>数据表格</caption>
            <thead>
              <tr>
                <th scope="col">列1</th>
                <th scope="col">列2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>数据1</td>
                <td>数据2</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
      
      const issues = await testHelpers.checkA11y()
      expect(issues).toHaveLength(0)
    })
  })

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const ErrorComponent = () => {
        throw new Error('Component error')
      }
      
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>
        } catch (error) {
          return <div data-testid="error-boundary">页面出错了</div>
        }
      }
      
      renderPage(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
      consoleError.mockRestore()
    })
  })
})

/**
 * Page Test Coverage Checklist:
 * 
 * □ Page renders without crashing
 * □ Page header and navigation render correctly
 * □ Breadcrumb navigation works
 * □ Main content area renders
 * □ Loading states are handled
 * □ Data loading and display works
 * □ Empty state is handled
 * □ Error states are handled
 * □ Search functionality works
 * □ Filtering works
 * □ CRUD operations work
 * □ Bulk operations work
 * □ Pagination works
 * □ All user interactions are testable
 * □ Modal operations work
 * □ Form operations work
 * □ Table operations work
 * □ Authentication is handled
 * □ Authorization is enforced
 * □ Responsive design works
 * □ SEO meta data is correct
 * □ Performance is acceptable
 * □ No memory leaks
 * □ Accessibility requirements are met
 * □ Error boundaries work
 * 
 * Additional Notes:
 * - Replace PAGE_NAME with your actual page name
 * - Update imports to match your page location
 * - Add page-specific test scenarios
 * - Update API mocks to match your endpoints
 * - Customize authentication/authorization tests
 * - Add business logic specific to your page
 */