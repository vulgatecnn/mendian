import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:7800'
const API_BASE_URL = 'http://localhost:7900'

// Test data
const testPlan = {
  title: '自动化测试开店计划',
  description: '这是一个自动化测试创建的开店计划',
  year: new Date().getFullYear(),
  quarter: 1,
  storeType: 'DIRECT',
  plannedCount: 3,
  budget: 500000, // 50万
  priority: 'HIGH'
}

// Helper functions
const login = async (page: Page) => {
  await page.goto(`${BASE_URL}/auth/login`)
  
  // 假设有测试用户账号
  await page.fill('[data-testid="username"]', 'test_user')
  await page.fill('[data-testid="password"]', 'test_password')
  await page.click('[data-testid="login-button"]')
  
  // 等待登录完成
  await page.waitForURL(`${BASE_URL}/dashboard`)
  await expect(page).toHaveTitle(/好饭碗门店管理系统/)
}

const navigateToStorePlan = async (page: Page) => {
  await page.click('[data-testid="menu-store-plan"]')
  await page.waitForURL(`${BASE_URL}/store-plan`)
  await expect(page.locator('h1')).toContainText('开店计划')
}

test.describe('Store Plan Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route(`${API_BASE_URL}/api/v1/store-plans/**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0
              }
            }
          })
        })
      }
    })
    
    await login(page)
  })

  test('should complete full store plan workflow', async ({ page }) => {
    // 1. Navigate to store plan page
    await navigateToStorePlan(page)
    
    // 2. Check initial state
    await expect(page.locator('[data-testid="store-plan-list"]')).toBeVisible()
    
    // 3. Create new store plan
    await page.click('[data-testid="create-plan-button"]')
    await page.waitForURL(`${BASE_URL}/store-plan/create`)
    
    // Fill form
    await page.fill('[data-testid="plan-title"]', testPlan.title)
    await page.fill('[data-testid="plan-description"]', testPlan.description)
    await page.selectOption('[data-testid="store-type"]', testPlan.storeType)
    await page.fill('[data-testid="planned-count"]', testPlan.plannedCount.toString())
    await page.fill('[data-testid="budget"]', (testPlan.budget / 10000).toString()) // 转换为万元
    await page.selectOption('[data-testid="priority"]', testPlan.priority)
    
    // Select region (assuming first option)
    await page.click('[data-testid="region-selector"]')
    await page.click('[data-testid="region-option-0"]')
    
    // Select entity (assuming first option)
    await page.click('[data-testid="entity-selector"]')
    await page.click('[data-testid="entity-option-0"]')
    
    // Set target date
    await page.click('[data-testid="target-date"]')
    await page.click('[data-testid="date-today"]') // Select today
    
    // Save as draft
    await page.click('[data-testid="save-draft-button"]')
    
    // Wait for success message
    await expect(page.locator('.ant-message-success')).toContainText('保存草稿成功')
    
    // Should redirect to detail page
    await expect(page.url()).toMatch(/\/store-plan\/[^\/]+$/)
  })

  test('should display store plan dashboard correctly', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/store-plan/dashboard`)
    
    // Check dashboard elements
    await expect(page.locator('h2')).toContainText('开店计划执行看板')
    
    // Check statistics cards
    await expect(page.locator('[data-testid="stat-total-plans"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-completion-rate"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-budget"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-avg-time"]')).toBeVisible()
    
    // Check charts
    await expect(page.locator('[data-testid="status-pie-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="region-column-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-trend-chart"]')).toBeVisible()
    
    // Check progress table
    await expect(page.locator('[data-testid="progress-table"]')).toBeVisible()
  })

  test('should filter store plans correctly', async ({ page }) => {
    await navigateToStorePlan(page)
    
    // Open filter panel
    await page.click('[data-testid="filter-button"]')
    
    // Apply status filter
    await page.selectOption('[data-testid="status-filter"]', 'DRAFT')
    await page.click('[data-testid="apply-filter-button"]')
    
    // Check URL params
    await expect(page.url()).toContain('status=DRAFT')
    
    // Apply date range filter
    await page.click('[data-testid="date-range-picker"]')
    await page.click('[data-testid="date-range-last-month"]')
    await page.click('[data-testid="apply-filter-button"]')
    
    // Check that filters are applied
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible()
  })

  test('should handle mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await navigateToStorePlan(page)
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-store-plan-list"]')).toBeVisible()
    
    // Check floating action button
    await expect(page.locator('[data-testid="fab-create-plan"]')).toBeVisible()
    
    // Check mobile statistics cards
    await expect(page.locator('[data-testid="mobile-stats-cards"]')).toBeVisible()
    
    // Test mobile navigation
    await page.click('[data-testid="fab-create-plan"]')
    await expect(page.url()).toContain('/store-plan/create')
  })

  test('should handle store plan approval workflow', async ({ page }) => {
    // Create a plan first (mocked)
    const planId = 'test-plan-001'
    await page.goto(`${BASE_URL}/store-plan/${planId}`)
    
    // Check plan details
    await expect(page.locator('[data-testid="plan-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="plan-status"]')).toContainText('草稿')
    
    // Submit for approval
    await page.click('[data-testid="submit-approval-button"]')
    
    // Fill approval form
    await page.selectOption('[data-testid="urgency-select"]', 'NORMAL')
    await page.fill('[data-testid="approval-comment"]', '请审批此开店计划')
    await page.click('[data-testid="confirm-submit-button"]')
    
    // Check success message
    await expect(page.locator('.ant-message-success')).toContainText('已提交审批')
    
    // Check status change
    await page.reload()
    await expect(page.locator('[data-testid="plan-status"]')).toContainText('待审批')
    
    // Check approval flow
    await page.click('[data-testid="tab-approval"]')
    await expect(page.locator('[data-testid="approval-steps"]')).toBeVisible()
    await expect(page.locator('[data-testid="approval-history"]')).toBeVisible()
  })

  test('should export store plan data', async ({ page }) => {
    await navigateToStorePlan(page)
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.click('[data-testid="export-button"]')
    
    // Wait for export options
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible()
    
    // Select Excel format
    await page.click('[data-testid="export-excel"]')
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/开店计划.*\.xlsx$/)
    
    // Save download for verification
    await download.saveAs(`./test-results/${download.suggestedFilename()}`)
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route(`${API_BASE_URL}/api/v1/store-plans`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: '服务器内部错误'
        })
      })
    })
    
    await navigateToStorePlan(page)
    
    // Check error message
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-alert"]')).toContainText('加载失败')
    
    // Check retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    
    // Test retry
    await page.click('[data-testid="retry-button"]')
    
    // Should attempt to reload
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
  })

  test('should validate form inputs correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/store-plan/create`)
    
    // Try to submit empty form
    await page.click('[data-testid="save-draft-button"]')
    
    // Check validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('计划标题至少2个字符')
    await expect(page.locator('[data-testid="region-error"]')).toContainText('请选择所属地区')
    await expect(page.locator('[data-testid="entity-error"]')).toContainText('请选择公司主体')
    
    // Fill invalid data
    await page.fill('[data-testid="plan-title"]', 'a') // Too short
    await page.fill('[data-testid="planned-count"]', '0') // Invalid number
    await page.fill('[data-testid="budget"]', '-100') // Negative number
    
    await page.click('[data-testid="save-draft-button"]')
    
    // Check specific validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('计划标题至少2个字符')
    await expect(page.locator('[data-testid="count-error"]')).toContainText('计划数量必须为正整数')
    await expect(page.locator('[data-testid="budget-error"]')).toContainText('预算金额必须大于0')
  })

  test('should search and sort store plans', async ({ page }) => {
    await navigateToStorePlan(page)
    
    // Test search
    await page.fill('[data-testid="search-input"]', testPlan.title)
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Check search results
    await expect(page.url()).toContain(`keyword=${encodeURIComponent(testPlan.title)}`)
    
    // Test sorting
    await page.click('[data-testid="sort-dropdown"]')
    await page.click('[data-testid="sort-by-date"]')
    
    // Check sort parameter
    await expect(page.url()).toContain('sortBy=createdAt')
    
    // Test sort order
    await page.click('[data-testid="sort-order-toggle"]')
    await expect(page.url()).toContain('sortOrder=asc')
  })

  test('should handle offline scenarios', async ({ page, context }) => {
    await navigateToStorePlan(page)
    
    // Go offline
    await context.setOffline(true)
    
    // Try to refresh
    await page.reload()
    
    // Check offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('网络连接已断开')
    
    // Go back online
    await context.setOffline(false)
    
    // Check reconnection
    await page.click('[data-testid="reconnect-button"]')
    await expect(page.locator('[data-testid="offline-message"]')).not.toBeVisible()
  })
})

test.describe('Store Plan Performance Tests', () => {
  test('should load store plan list quickly', async ({ page }) => {
    await login(page)
    
    const startTime = Date.now()
    await navigateToStorePlan(page)
    
    // Wait for list to load
    await expect(page.locator('[data-testid="store-plan-list"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
  })

  test('should handle large datasets efficiently', async ({ page }) => {
    // Mock large dataset
    await page.route(`${API_BASE_URL}/api/v1/store-plans**`, async (route) => {
      const largeMockData = {
        success: true,
        data: {
          items: Array(100).fill(null).map((_, index) => ({
            id: `plan-${index}`,
            title: `测试计划 ${index + 1}`,
            status: 'DRAFT',
            createdAt: new Date().toISOString()
          })),
          pagination: {
            page: 1,
            limit: 100,
            total: 1000,
            totalPages: 10
          }
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeMockData)
      })
    })
    
    await navigateToStorePlan(page)
    
    // Check virtual scrolling performance
    const startTime = Date.now()
    await page.locator('[data-testid="virtual-list"]').scrollIntoView()
    
    const scrollTime = Date.now() - startTime
    expect(scrollTime).toBeLessThan(1000) // Scrolling should be smooth
    
    // Check that not all items are rendered at once (virtual scrolling)
    const renderedItems = await page.locator('[data-testid^="plan-item-"]').count()
    expect(renderedItems).toBeLessThan(100) // Should use virtual scrolling
  })
})