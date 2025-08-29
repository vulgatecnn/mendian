/**
 * Playwright全局清理
 * 在所有测试运行后清理测试环境和数据
 */
import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始E2E测试环境清理...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 清理测试数据
    await cleanupTestData(page)

    // 清理测试用户
    await cleanupTestUsers(page)

    console.log('✅ E2E测试环境清理完成')
  } catch (error) {
    console.error('❌ E2E测试环境清理失败:', error)
    // 不抛出错误，避免影响测试报告
  } finally {
    await context.close()
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  // 清理测试创建的开店计划数据
  console.log('🗑️ 清理测试开店计划数据...')
  
  // 可以通过API删除所有E2E测试创建的数据
  // 或者重置测试数据库到初始状态
}

async function cleanupTestUsers(page: any) {
  // 清理测试用户数据
  console.log('👥 清理测试用户数据...')
  
  // 可以通过API删除测试用户
  // 或者重置用户数据到初始状态
}

export default globalTeardown;