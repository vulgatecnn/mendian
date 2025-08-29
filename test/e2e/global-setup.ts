/**
 * Playwright全局设置
 * 在所有测试运行前准备测试环境和数据
 */
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  
  console.log('🔧 开始E2E测试环境设置...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 等待前端服务启动
    console.log('⏳ 等待前端服务启动...')
    await page.goto(`${baseURL}/health`, { waitUntil: 'networkidle' })
    
    // 等待后端API服务启动
    console.log('⏳ 等待后端服务启动...')
    const apiURL = process.env.E2E_API_URL || 'http://localhost:7100'
    await page.goto(`${apiURL}/health`, { waitUntil: 'networkidle' })

    // 准备测试数据
    console.log('📊 准备测试数据...')
    
    // 通过API创建测试用户和权限
    await setupTestUsers(page)
    
    // 创建测试用的开店计划数据
    await setupTestStorePlans(page)

    console.log('✅ E2E测试环境设置完成')
  } catch (error) {
    console.error('❌ E2E测试环境设置失败:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

async function setupTestUsers(page: any) {
  // 创建测试用户数据
  const testUsers = [
    {
      id: 'e2e-admin',
      username: 'e2e-admin',
      name: 'E2E测试管理员',
      roles: ['admin'],
      permissions: ['*'],
    },
    {
      id: 'e2e-planner',
      username: 'e2e-planner', 
      name: 'E2E测试计划员',
      roles: ['planner'],
      permissions: ['store-plan:create', 'store-plan:update', 'store-plan:view'],
    },
    {
      id: 'e2e-approver',
      username: 'e2e-approver',
      name: 'E2E测试审批员', 
      roles: ['approver'],
      permissions: ['store-plan:approve', 'store-plan:view'],
    },
  ]

  // 这里可以通过API创建测试用户
  // 实际实现时需要根据项目的用户管理API进行调整
  console.log('👥 创建测试用户:', testUsers.length)
}

async function setupTestStorePlans(page: any) {
  // 创建测试用的开店计划数据
  const testPlans = [
    {
      name: 'E2E测试计划-草稿状态',
      type: 'DIRECT',
      status: 'DRAFT',
      priority: 'medium',
      region: '华东区域',
      targetOpenDate: '2024-12-31',
      budget: 500000,
      description: 'E2E测试用的草稿状态计划',
    },
    {
      name: 'E2E测试计划-已提交状态',
      type: 'FRANCHISE',
      status: 'SUBMITTED',
      priority: 'high',
      region: '华南区域',
      targetOpenDate: '2024-11-30',
      budget: 300000,
      description: 'E2E测试用的已提交状态计划',
    },
    {
      name: 'E2E测试计划-已批准状态',
      type: 'FLAGSHIP',
      status: 'APPROVED',
      priority: 'urgent',
      region: '华北区域',
      targetOpenDate: '2024-10-31',
      budget: 800000,
      description: 'E2E测试用的已批准状态计划',
    },
  ]

  // 这里可以通过API创建测试数据
  // 实际实现时需要根据项目的API接口进行调整
  console.log('📋 创建测试计划:', testPlans.length)
}

export default globalSetup;