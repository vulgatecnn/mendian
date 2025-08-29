// 集成测试
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { initMockService, stopMockService, isMockEnabled } from '../mock'
import { AuthApiService, StorePlanApiService } from '../api'
import { queryClient } from '../query/config'

describe('API服务层集成测试', () => {
  beforeAll(async () => {
    // 初始化Mock服务
    if (isMockEnabled()) {
      await initMockService()
    }
  })

  afterAll(() => {
    if (isMockEnabled()) {
      stopMockService()
    }
  })

  describe('完整的用户认证流程', () => {
    it('应该完成完整的登录->获取用户信息->登出流程', async () => {
      // 1. 用户登录
      const loginResponse = await AuthApiService.login({
        username: 'testuser',
        password: 'testpass'
      })

      expect(loginResponse.code).toBe(200)
      expect(loginResponse.data).toHaveProperty('accessToken')

      // 2. 获取用户信息
      const userInfoResponse = await AuthApiService.getUserInfo()

      expect(userInfoResponse.code).toBe(200)
      expect(userInfoResponse.data).toHaveProperty('username')

      // 3. 获取用户权限
      const permissionsResponse = await AuthApiService.getUserPermissions()

      expect(permissionsResponse.code).toBe(200)
      expect(Array.isArray(permissionsResponse.data)).toBe(true)

      // 4. 用户登出
      const logoutResponse = await AuthApiService.logout()

      expect(logoutResponse.code).toBe(200)
    })
  })

  describe('完整的开店计划管理流程', () => {
    it('应该完成完整的创建->查看->更新->删除流程', async () => {
      // 1. 创建开店计划
      const createData = {
        name: '集成测试计划',
        description: '这是集成测试创建的计划',
        type: 'direct' as const,
        status: 'draft' as const,
        priority: 'medium' as const,
        region: {
          id: 'region-test',
          code: 'RT001',
          name: '测试区域',
          level: 2,
          enabled: true,
          sort: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        targetOpenDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 1500000,
        milestones: [],
        attachments: [],
        approvalHistory: []
      }

      const createResponse = await StorePlanApiService.createStorePlan(createData)

      expect(createResponse.code).toBe(200)
      expect(createResponse.data).toHaveProperty('id')
      expect(createResponse.data.name).toBe(createData.name)

      const planId = createResponse.data.id

      // 2. 获取计划详情
      const detailResponse = await StorePlanApiService.getStorePlan(planId)

      expect(detailResponse.code).toBe(200)
      expect(detailResponse.data.id).toBe(planId)
      expect(detailResponse.data.name).toBe(createData.name)

      // 3. 更新计划
      const updateData = {
        name: '更新后的集成测试计划',
        budget: 1800000
      }

      const updateResponse = await StorePlanApiService.updateStorePlan(planId, updateData)

      expect(updateResponse.code).toBe(200)
      expect(updateResponse.data.name).toBe(updateData.name)
      expect(updateResponse.data.budget).toBe(updateData.budget)

      // 4. 获取更新后的详情
      const updatedDetailResponse = await StorePlanApiService.getStorePlan(planId)

      expect(updatedDetailResponse.code).toBe(200)
      expect(updatedDetailResponse.data.name).toBe(updateData.name)
      expect(updatedDetailResponse.data.budget).toBe(updateData.budget)

      // 5. 删除计划
      const deleteResponse = await StorePlanApiService.deleteStorePlan(planId)

      expect(deleteResponse.code).toBe(200)
    })
  })

  describe('数据一致性测试', () => {
    it('应该在创建后能在列表中找到新创建的项目', async () => {
      // 获取创建前的列表
      const beforeResponse = await StorePlanApiService.getStorePlans({ pageSize: 100 })
      const beforeCount = beforeResponse.data.length

      // 创建新项目
      const createData = {
        name: '数据一致性测试计划',
        type: 'franchise' as const,
        status: 'draft' as const,
        priority: 'high' as const,
        region: {
          id: 'region-consistency',
          code: 'RC001',
          name: '一致性测试区域',
          level: 2,
          enabled: true,
          sort: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        targetOpenDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 2000000,
        milestones: [],
        attachments: [],
        approvalHistory: []
      }

      const createResponse = await StorePlanApiService.createStorePlan(createData)
      expect(createResponse.code).toBe(200)

      // 获取创建后的列表
      const afterResponse = await StorePlanApiService.getStorePlans({ pageSize: 100 })
      const afterCount = afterResponse.data.length

      // 验证数量增加
      expect(afterCount).toBe(beforeCount + 1)

      // 验证新创建的项目存在
      const newItem = afterResponse.data.find(item => item.id === createResponse.data.id)
      expect(newItem).toBeTruthy()
      expect(newItem?.name).toBe(createData.name)
    })
  })

  describe('错误处理集成测试', () => {
    it('应该正确处理业务逻辑错误', async () => {
      // 测试获取不存在的计划
      await expect(StorePlanApiService.getStorePlan('non-existent-id')).rejects.toThrow()
    })

    it('应该正确处理参数验证错误', async () => {
      // 测试空数据创建
      await expect(StorePlanApiService.createStorePlan({} as any)).rejects.toThrow()
    })
  })

  describe('缓存一致性测试', () => {
    it('应该在更新后正确更新缓存', async () => {
      const cacheKey = 'test-cache-key'

      // 设置初始缓存
      queryClient.setQueryData([cacheKey], { value: 'initial' })

      // 获取缓存
      const cachedData = queryClient.getQueryData([cacheKey])
      expect(cachedData).toEqual({ value: 'initial' })

      // 更新缓存
      queryClient.setQueryData([cacheKey], { value: 'updated' })

      // 验证缓存已更新
      const updatedCachedData = queryClient.getQueryData([cacheKey])
      expect(updatedCachedData).toEqual({ value: 'updated' })

      // 清理缓存
      queryClient.removeQueries({ queryKey: [cacheKey] })

      // 验证缓存已清除
      const clearedData = queryClient.getQueryData([cacheKey])
      expect(clearedData).toBeUndefined()
    })
  })

  describe('Mock服务质量测试', () => {
    it('Mock数据应该符合类型定义', async () => {
      const response = await StorePlanApiService.getStorePlans({ pageSize: 1 })

      expect(response.code).toBe(200)
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('pagination')

      if (response.data.length > 0) {
        const storePlan = response.data[0]

        // 验证必需字段
        expect(storePlan).toHaveProperty('id')
        expect(storePlan).toHaveProperty('name')
        expect(storePlan).toHaveProperty('type')
        expect(storePlan).toHaveProperty('status')
        expect(storePlan).toHaveProperty('region')
        expect(storePlan).toHaveProperty('budget')
        expect(storePlan).toHaveProperty('createdAt')
        expect(storePlan).toHaveProperty('updatedAt')

        // 验证字段类型
        expect(typeof storePlan.id).toBe('string')
        expect(typeof storePlan.name).toBe('string')
        expect(['direct', 'franchise', 'joint_venture']).toContain(storePlan.type)
        expect(['draft', 'pending', 'approved', 'in_progress', 'completed', 'cancelled']).toContain(
          storePlan.status
        )
        expect(typeof storePlan.budget).toBe('number')
      }
    })

    it('Mock数据应该支持复杂查询', async () => {
      // 测试多条件查询
      const params = {
        name: '万达',
        status: 'approved' as const,
        type: 'direct' as const,
        page: 1,
        pageSize: 5
      }

      const response = await StorePlanApiService.getStorePlans(params)

      expect(response.code).toBe(200)
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.pageSize).toBe(5)
    })
  })
})
