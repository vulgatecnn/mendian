/**
 * 开店计划性能测试
 * 测试大数据量、并发操作和页面性能
 */
import { test, expect, Page } from '@playwright/test'

test.describe('开店计划性能测试', () => {
  test('大数据量列表加载性能', async ({ page }) => {
    await test.step('测试大数据量列表加载', async () => {
      // 登录
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()

      // 记录性能指标
      await page.goto('/store-plan', { waitUntil: 'networkidle' })
      
      // 测试页面加载时间
      const startTime = Date.now()
      await page.waitForSelector('[data-testid="store-plan-table"]')
      const loadTime = Date.now() - startTime
      
      // 验证加载时间在可接受范围内 (< 3秒)
      expect(loadTime).toBeLessThan(3000)
      
      // 验证表格渲染
      await expect(page.locator('.ant-table-tbody tr')).toHaveCount({ min: 1 })
    })
  })

  test('分页性能测试', async ({ page }) => {
    await test.step('测试分页切换性能', async () => {
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      await page.goto('/store-plan')
      
      // 测试分页切换时间
      const paginationButtons = page.locator('.ant-pagination-item')
      const buttonCount = await paginationButtons.count()
      
      if (buttonCount > 1) {
        const startTime = Date.now()
        await paginationButtons.nth(1).click()  // 点击第2页
        await page.waitForLoadState('networkidle')
        const switchTime = Date.now() - startTime
        
        // 验证切换时间 (< 2秒)
        expect(switchTime).toBeLessThan(2000)
        
        // 验证页面数据已更新
        await expect(page.locator('.ant-pagination-item-active')).toHaveText('2')
      }
    })
  })

  test('搜索和筛选性能', async ({ page }) => {
    await test.step('测试搜索筛选响应时间', async () => {
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      await page.goto('/store-plan')
      
      // 测试搜索性能
      const searchInput = page.getByPlaceholder('请输入计划名称')
      await searchInput.fill('测试')
      
      const startTime = Date.now()
      await page.getByRole('button', { name: '搜索' }).click()
      await page.waitForLoadState('networkidle')
      const searchTime = Date.now() - startTime
      
      // 验证搜索响应时间 (< 1.5秒)
      expect(searchTime).toBeLessThan(1500)
      
      // 测试状态筛选性能
      const filterStartTime = Date.now()
      await page.getByLabel('状态').click()
      await page.getByText('草稿').click()
      await page.getByRole('button', { name: '搜索' }).click()
      await page.waitForLoadState('networkidle')
      const filterTime = Date.now() - filterStartTime
      
      // 验证筛选响应时间 (< 1.5秒)
      expect(filterTime).toBeLessThan(1500)
    })
  })

  test('表格滚动和渲染性能', async ({ page }) => {
    await test.step('测试表格滚动性能', async () => {
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      await page.goto('/store-plan')
      
      const tableBody = page.locator('.ant-table-body')
      
      // 测试垂直滚动
      const scrollStartTime = Date.now()
      await tableBody.evaluate((el) => {
        el.scrollTop = el.scrollHeight / 2  // 滚动到中间
      })
      
      // 等待滚动完成
      await page.waitForTimeout(100)
      const scrollTime = Date.now() - scrollStartTime
      
      // 验证滚动响应时间 (< 200ms)
      expect(scrollTime).toBeLessThan(200)
      
      // 测试水平滚动 (如果有)
      await tableBody.evaluate((el) => {
        el.scrollLeft = 100
      })
      
      await page.waitForTimeout(100)
    })
  })

  test('内存使用监控', async ({ page }) => {
    await test.step('监控内存使用情况', async () => {
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      // 记录初始内存使用
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSMemory: (performance as any).memory.usedJSMemory,
          totalJSMemory: (performance as any).memory.totalJSMemory,
        } : null
      })
      
      // 执行一系列操作
      await page.goto('/store-plan')
      
      // 模拟用户操作：切换页面、筛选等
      for (let i = 0; i < 5; i++) {
        await page.reload()
        await page.waitForLoadState('networkidle')
        
        // 执行一些操作
        const searchInput = page.getByPlaceholder('请输入计划名称')
        await searchInput.fill(`测试${i}`)
        await page.getByRole('button', { name: '搜索' }).click()
        await page.waitForLoadState('networkidle')
        
        await page.getByRole('button', { name: '重置' }).click()
        await page.waitForLoadState('networkidle')
      }
      
      // 记录最终内存使用
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSMemory: (performance as any).memory.usedJSMemory,
          totalJSMemory: (performance as any).memory.totalJSMemory,
        } : null
      })
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSMemory - initialMemory.usedJSMemory
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSMemory) * 100
        
        console.log(`内存使用增长: ${memoryIncrease} 字节 (${memoryIncreasePercent.toFixed(2)}%)`)
        
        // 验证内存增长不超过100%（可能存在内存泄漏）
        expect(memoryIncreasePercent).toBeLessThan(100)
      }
    })
  })

  test('网络请求性能', async ({ page }) => {
    await test.step('监控网络请求性能', async () => {
      const requests: any[] = []
      const responses: any[] = []
      
      // 监听网络请求
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            startTime: Date.now(),
          })
        }
      })
      
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const request = requests.find(req => req.url === response.url())
          if (request) {
            responses.push({
              ...request,
              status: response.status(),
              endTime: Date.now(),
              duration: Date.now() - request.startTime,
            })
          }
        }
      })
      
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      await page.goto('/store-plan')
      await page.waitForLoadState('networkidle')
      
      // 分析网络请求性能
      const apiRequests = responses.filter(r => r.url.includes('/api/v1/store-plans'))
      
      for (const request of apiRequests) {
        console.log(`API请求 ${request.method} ${request.url}: ${request.duration}ms (状态: ${request.status})`)
        
        // 验证API响应时间 (< 2秒)
        expect(request.duration).toBeLessThan(2000)
        
        // 验证响应状态码
        expect([200, 201, 204]).toContain(request.status)
      }
      
      // 验证并发请求数量不会过多
      const concurrentRequests = apiRequests.filter(r => 
        Math.abs(r.startTime - apiRequests[0].startTime) < 100  // 100ms内的请求视为并发
      )
      expect(concurrentRequests.length).toBeLessThan(10)  // 并发请求不超过10个
    })
  })

  test('DOM元素数量监控', async ({ page }) => {
    await test.step('监控DOM元素数量', async () => {
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      await page.goto('/store-plan')
      await page.waitForLoadState('networkidle')
      
      // 计算DOM元素数量
      const domNodeCount = await page.evaluate(() => {
        return document.getElementsByTagName('*').length
      })
      
      console.log(`DOM元素数量: ${domNodeCount}`)
      
      // 验证DOM元素数量在合理范围内 (< 5000)
      expect(domNodeCount).toBeLessThan(5000)
      
      // 测试表格行数与DOM元素的关系
      const tableRows = await page.locator('.ant-table-tbody tr').count()
      console.log(`表格行数: ${tableRows}`)
      
      // 计算每行平均DOM元素数 (应该在合理范围内)
      if (tableRows > 0) {
        const elementsPerRow = domNodeCount / tableRows
        expect(elementsPerRow).toBeLessThan(100)  // 每行不超过100个DOM元素
      }
    })
  })

  test('页面加载关键性能指标', async ({ page }) => {
    await test.step('测试页面核心性能指标', async () => {
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      // 导航到列表页并记录性能指标
      await page.goto('/store-plan', { waitUntil: 'networkidle' })
      
      // 获取页面性能指标
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByType('paint')
        
        return {
          // 页面加载时间
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          // DOM内容加载时间
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          // 首次内容绘制时间
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          // 最大内容绘制时间
          largestContentfulPaint: paint.find(p => p.name === 'largest-contentful-paint')?.startTime || 0,
          // DNS查询时间
          dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
          // TCP连接时间
          connectTime: navigation.connectEnd - navigation.connectStart,
          // 页面总加载时间
          totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
        }
      })
      
      console.log('页面性能指标:', performanceMetrics)
      
      // 验证关键性能指标
      expect(performanceMetrics.totalLoadTime).toBeLessThan(5000)  // 总加载时间 < 5秒
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000)  // DOM加载 < 2秒
      
      if (performanceMetrics.firstContentfulPaint > 0) {
        expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000)  // FCP < 2秒
      }
    })
  })

  test('长时间运行稳定性测试', async ({ page }) => {
    test.setTimeout(60000)  // 设置60秒超时
    
    await test.step('测试长时间运行稳定性', async () => {
      await page.goto('/login')
      await page.getByLabel('用户名').fill('e2e-admin')
      await page.getByLabel('密码').fill('password123')
      await page.getByRole('button', { name: '登录' }).click()
      
      await page.goto('/store-plan')
      
      // 模拟用户长时间使用应用的场景
      const operations = [
        async () => {
          // 刷新数据
          await page.getByRole('button', { name: '刷新' }).click()
          await page.waitForLoadState('networkidle')
        },
        async () => {
          // 搜索操作
          const searchInput = page.getByPlaceholder('请输入计划名称')
          await searchInput.fill('测试')
          await page.getByRole('button', { name: '搜索' }).click()
          await page.waitForLoadState('networkidle')
          await page.getByRole('button', { name: '重置' }).click()
          await page.waitForLoadState('networkidle')
        },
        async () => {
          // 切换筛选条件
          await page.getByLabel('状态').click()
          await page.getByText('草稿').click()
          await page.getByRole('button', { name: '搜索' }).click()
          await page.waitForLoadState('networkidle')
          await page.getByRole('button', { name: '重置' }).click()
          await page.waitForLoadState('networkidle')
        },
      ]
      
      // 连续执行30次操作 (约30-45秒)
      for (let i = 0; i < 30; i++) {
        const operation = operations[i % operations.length]
        try {
          await operation()
          
          // 每10次操作后检查页面是否还正常
          if (i % 10 === 9) {
            await expect(page.getByText('开店计划管理')).toBeVisible()
            console.log(`完成 ${i + 1}/30 次操作`)
          }
        } catch (error) {
          console.error(`操作 ${i + 1} 失败:`, error)
          throw error
        }
        
        // 短暂暂停，模拟真实用户操作间隔
        await page.waitForTimeout(500)
      }
      
      // 验证页面最终状态
      await expect(page.getByText('开店计划管理')).toBeVisible()
      await expect(page.locator('.ant-table')).toBeVisible()
      
      console.log('长时间运行稳定性测试通过')
    })
  })
});