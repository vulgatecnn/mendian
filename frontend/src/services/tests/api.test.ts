// API服务测试
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthApiService, StorePlanApiService } from '../api'
import { MockDataStore } from '../mock/data'
import { server } from './setup'

describe('API服务测试', () => {
  beforeEach(() => {
    // 重置Mock数据
    MockDataStore.getInstance().clearData()
  })

  describe('AuthApiService', () => {
    describe('用户登录', () => {
      it('应该能够成功登录', async () => {
        const loginData = {
          username: 'testuser',
          password: 'testpass'
        }

        const response = await AuthApiService.login(loginData)

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('accessToken')
        expect(response.data).toHaveProperty('refreshToken')
        expect(response.data).toHaveProperty('user')
        expect(response.data.user).toHaveProperty('username')
      })

      it('应该在密码错误时返回错误', async () => {
        const loginData = {
          username: 'testuser',
          password: 'wrong'
        }

        await expect(AuthApiService.login(loginData)).rejects.toThrow()
      })

      it('应该验证必需的字段', async () => {
        const loginData = {
          username: '',
          password: ''
        }

        await expect(AuthApiService.login(loginData)).rejects.toThrow()
      })
    })

    describe('用户登出', () => {
      it('应该能够成功登出', async () => {
        const response = await AuthApiService.logout()

        expect(response.code).toBe(200)
        expect(response.message).toBe('登出成功')
      })
    })

    describe('获取用户信息', () => {
      it('应该能够获取用户信息', async () => {
        const response = await AuthApiService.getUserInfo()

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('id')
        expect(response.data).toHaveProperty('username')
        expect(response.data).toHaveProperty('name')
        expect(response.data).toHaveProperty('permissions')
      })
    })

    describe('权限管理', () => {
      it('应该能够获取用户权限', async () => {
        const response = await AuthApiService.getUserPermissions()

        expect(response.code).toBe(200)
        expect(Array.isArray(response.data)).toBe(true)
      })

      it('应该能够检查权限', async () => {
        const permissions = ['store:plan:view', 'store:plan:create']
        const response = await AuthApiService.checkPermissions(permissions)

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('hasPermission')
        expect(response.data).toHaveProperty('permissions')
      })
    })

    describe('密码管理', () => {
      it('应该能够修改密码', async () => {
        const passwordData = {
          oldPassword: 'oldpass',
          newPassword: 'newpass',
          confirmPassword: 'newpass'
        }

        const response = await AuthApiService.changePassword(passwordData)

        expect(response.code).toBe(200)
        expect(response.message).toBe('密码修改成功')
      })

      it('应该在密码不匹配时返回错误', async () => {
        const passwordData = {
          oldPassword: 'oldpass',
          newPassword: 'newpass',
          confirmPassword: 'different'
        }

        await expect(AuthApiService.changePassword(passwordData)).rejects.toThrow()
      })
    })
  })

  describe('StorePlanApiService', () => {
    describe('获取开店计划列表', () => {
      it('应该能够获取开店计划列表', async () => {
        const response = await StorePlanApiService.getStorePlans()

        expect(response.code).toBe(200)
        expect(Array.isArray(response.data)).toBe(true)
        expect(response).toHaveProperty('pagination')
        expect(response.pagination).toHaveProperty('page')
        expect(response.pagination).toHaveProperty('pageSize')
        expect(response.pagination).toHaveProperty('total')
      })

      it('应该支持分页参数', async () => {
        const params = {
          page: 2,
          pageSize: 10
        }

        const response = await StorePlanApiService.getStorePlans(params)

        expect(response.code).toBe(200)
        expect(response.pagination.page).toBe(2)
        expect(response.pagination.pageSize).toBe(10)
      })

      it('应该支持过滤参数', async () => {
        const params = {
          name: '测试',
          status: 'draft' as const,
          type: 'direct' as const
        }

        const response = await StorePlanApiService.getStorePlans(params)

        expect(response.code).toBe(200)
        // Mock服务应该根据过滤条件返回相应的数据
      })
    })

    describe('获取开店计划详情', () => {
      it('应该能够获取开店计划详情', async () => {
        // 先获取列表中的一个ID
        const listResponse = await StorePlanApiService.getStorePlans({ pageSize: 1 })
        const storePlan = listResponse.data[0]

        if (storePlan) {
          const response = await StorePlanApiService.getStorePlan(storePlan.id)

          expect(response.code).toBe(200)
          expect(response.data).toHaveProperty('id')
          expect(response.data).toHaveProperty('name')
          expect(response.data).toHaveProperty('status')
          expect(response.data.id).toBe(storePlan.id)
        }
      })

      it('应该在计划不存在时返回404错误', async () => {
        const nonExistentId = 'non-existent-id'

        await expect(StorePlanApiService.getStorePlan(nonExistentId)).rejects.toThrow()
      })
    })

    describe('创建开店计划', () => {
      it('应该能够创建开店计划', async () => {
        const storePlanData = {
          name: '测试开店计划',
          description: '这是一个测试计划',
          type: 'direct' as const,
          status: 'draft' as const,
          priority: 'medium' as const,
          region: {
            id: 'region-1',
            code: 'R001',
            name: '测试区域',
            level: 2,
            enabled: true,
            sort: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          targetOpenDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          budget: 1000000,
          milestones: [],
          attachments: [],
          approvalHistory: []
        }

        const response = await StorePlanApiService.createStorePlan(storePlanData)

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('id')
        expect(response.data.name).toBe(storePlanData.name)
        expect(response.data.type).toBe(storePlanData.type)
        expect(response.message).toBe('开店计划创建成功')
      })
    })

    describe('更新开店计划', () => {
      it('应该能够更新开店计划', async () => {
        // 先创建一个计划
        const createData = {
          name: '待更新计划',
          type: 'direct' as const,
          status: 'draft' as const,
          priority: 'medium' as const,
          region: {
            id: 'region-1',
            code: 'R001',
            name: '测试区域',
            level: 2,
            enabled: true,
            sort: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          targetOpenDate: new Date().toISOString(),
          budget: 500000,
          milestones: [],
          attachments: [],
          approvalHistory: []
        }

        const createResponse = await StorePlanApiService.createStorePlan(createData)
        const planId = createResponse.data.id

        // 更新计划
        const updateData = {
          name: '已更新计划',
          budget: 800000
        }

        const response = await StorePlanApiService.updateStorePlan(planId, updateData)

        expect(response.code).toBe(200)
        expect(response.data.name).toBe(updateData.name)
        expect(response.data.budget).toBe(updateData.budget)
        expect(response.message).toBe('更新成功')
      })
    })

    describe('删除开店计划', () => {
      it('应该能够删除开店计划', async () => {
        // 先创建一个计划
        const createData = {
          name: '待删除计划',
          type: 'direct' as const,
          status: 'draft' as const,
          priority: 'medium' as const,
          region: {
            id: 'region-1',
            code: 'R001',
            name: '测试区域',
            level: 2,
            enabled: true,
            sort: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          targetOpenDate: new Date().toISOString(),
          budget: 500000,
          milestones: [],
          attachments: [],
          approvalHistory: []
        }

        const createResponse = await StorePlanApiService.createStorePlan(createData)
        const planId = createResponse.data.id

        // 删除计划
        const response = await StorePlanApiService.deleteStorePlan(planId)

        expect(response.code).toBe(200)
        expect(response.message).toBe('删除成功')
      })
    })

    describe('批量操作', () => {
      it('应该能够批量删除开店计划', async () => {
        const batchParams = {
          ids: ['id1', 'id2', 'id3'],
          action: 'delete' as const,
          reason: '批量清理测试数据'
        }

        const response = await StorePlanApiService.batchOperation(batchParams)

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('successCount')
        expect(response.data).toHaveProperty('failureCount')
      })
    })

    describe('获取统计数据', () => {
      it('应该能够获取开店计划统计', async () => {
        const response = await StorePlanApiService.getStats()

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('total')
        expect(response.data).toHaveProperty('byStatus')
        expect(response.data).toHaveProperty('byType')
        expect(response.data).toHaveProperty('timeline')
      })

      it('应该支持统计参数过滤', async () => {
        const params = {
          period: 'month' as const,
          regionId: 'region-1',
          type: 'direct' as const
        }

        const response = await StorePlanApiService.getStats(params)

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('total')
      })
    })

    describe('获取选项数据', () => {
      it('应该能够获取开店计划选项', async () => {
        const response = await StorePlanApiService.getOptions()

        expect(response.code).toBe(200)
        expect(response.data).toHaveProperty('regions')
        expect(response.data).toHaveProperty('types')
        expect(response.data).toHaveProperty('statuses')
        expect(response.data).toHaveProperty('priorities')
        expect(response.data).toHaveProperty('users')
      })
    })
  })
})
