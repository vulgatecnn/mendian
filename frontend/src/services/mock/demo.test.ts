/**
 * Mock服务演示和测试
 * 演示如何使用Mock数据和API服务
 */

// 测试Mock数据工厂
import { createMockUser, createMockStorePlan } from './factories'
import { RBACService } from '../rbac'
import { EnhancedAuthService } from '../api/enhanced.auth'
import { EnhancedStorePlanService } from '../api/enhanced.storePlan'

/**
 * 测试Mock数据生成
 */
export function testMockDataGeneration() {
  console.log('🧪 测试Mock数据生成...')
  
  // 测试用户数据生成
  const user = createMockUser()
  console.log('✅ 用户数据:', {
    id: user.id,
    name: user.name,
    username: user.username,
    roles: user.roleNames,
    department: user.departmentName,
  })
  
  // 测试开店计划数据生成
  const storePlan = createMockStorePlan()
  console.log('✅ 开店计划数据:', {
    id: storePlan.id,
    name: storePlan.name,
    type: storePlan.type,
    status: storePlan.status,
    progress: storePlan.progress,
    budget: storePlan.budget,
  })
}

/**
 * 测试RBAC权限服务
 */
export function testRBACService() {
  console.log('🔐 测试RBAC权限服务...')
  
  // 获取第一个用户
  const users = RBACService.getUsers({ page: 1, pageSize: 5 })
  if (users.data.length > 0) {
    const user = users.data[0]
    console.log('✅ 用户信息:', {
      name: user.name,
      roles: user.roleNames,
    })
    
    // 测试权限检查
    const hasViewPermission = RBACService.hasPermission(user.id, 'dashboard:view')
    const hasManagePermission = RBACService.hasPermission(user.id, 'system:manage')
    
    console.log('✅ 权限检查:', {
      'dashboard:view': hasViewPermission,
      'system:manage': hasManagePermission,
    })
    
    // 测试角色检查
    const isAdmin = RBACService.hasRole(user.id, '超级管理员')
    console.log('✅ 角色检查:', {
      '是否管理员': isAdmin,
    })
  }
}

/**
 * 测试API服务（需要在Mock服务启动后调用）
 */
export async function testAPIServices() {
  console.log('🌐 测试API服务...')
  
  try {
    // 测试登录API
    const loginResponse = await EnhancedAuthService.login({
      username: 'admin',
      password: 'admin123'
    })
    console.log('✅ 登录测试:', loginResponse.success ? '成功' : '失败')
    
    if (loginResponse.success) {
      // 测试获取用户信息
      const userResponse = await EnhancedAuthService.getCurrentUser()
      console.log('✅ 用户信息:', userResponse.success ? '获取成功' : '获取失败')
      
      // 测试开店计划API
      const plansResponse = await EnhancedStorePlanService.getStorePlans({ page: 1, pageSize: 5 })
      console.log('✅ 开店计划列表:', plansResponse.success ? `获取${plansResponse.data?.length}条` : '获取失败')
      
      if (plansResponse.success && plansResponse.data && plansResponse.data.length > 0) {
        // 测试获取单个计划
        const planId = plansResponse.data[0].id
        const planResponse = await EnhancedStorePlanService.getStorePlanById(planId)
        console.log('✅ 单个计划:', planResponse.success ? '获取成功' : '获取失败')
      }
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error)
  }
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('🚀 开始Mock服务测试...')
  console.log('━'.repeat(50))
  
  // 测试数据生成
  testMockDataGeneration()
  console.log()
  
  // 测试RBAC服务
  testRBACService()
  console.log()
  
  // 等待Mock服务启动
  console.log('⏳ 等待Mock服务启动...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 测试API服务
  await testAPIServices()
  
  console.log()
  console.log('━'.repeat(50))
  console.log('✅ 所有测试完成！')
}

/**
 * 性能测试
 */
export function performanceTest() {
  console.log('⚡ 性能测试开始...')
  
  // 测试大量数据生成
  const startTime = Date.now()
  const users = []
  for (let i = 0; i < 1000; i++) {
    users.push(createMockUser())
  }
  const endTime = Date.now()
  
  console.log(`✅ 生成1000个用户耗时: ${endTime - startTime}ms`)
  console.log(`✅ 平均每个用户: ${(endTime - startTime) / 1000}ms`)
  
  // 测试权限检查性能
  const testUserId = users[0].id
  const permissionStartTime = Date.now()
  for (let i = 0; i < 1000; i++) {
    RBACService.hasPermission(testUserId, 'dashboard:view')
  }
  const permissionEndTime = Date.now()
  
  console.log(`✅ 1000次权限检查耗时: ${permissionEndTime - permissionStartTime}ms`)
}

// 在开发环境下自动运行测试
if (process.env.NODE_ENV === 'development') {
  // 延迟执行，确保其他模块已加载
  setTimeout(() => {
    console.log('🧪 Mock服务测试模式启用')
    console.log('📝 使用以下命令进行测试:')
    console.log('  - window.runMockTests() - 运行所有测试')
    console.log('  - window.performanceTest() - 性能测试')
    
    // 暴露测试函数到全局
    if (typeof window !== 'undefined') {
      (window as any).runMockTests = runAllTests
      ;(window as any).performanceTest = performanceTest
      ;(window as any).testMockData = testMockDataGeneration
      ;(window as any).testRBAC = testRBACService
      ;(window as any).testAPI = testAPIServices
    }
  }, 1000)
}

export default {
  runAllTests,
  testMockDataGeneration,
  testRBACService, 
  testAPIServices,
  performanceTest,
}