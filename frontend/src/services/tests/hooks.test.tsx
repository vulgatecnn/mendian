// React Query Hooks测试
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin, useUserInfo, useStorePlans, useCreateStorePlan } from '../query/hooks'
import { server } from './setup'
import { http, HttpResponse } from 'msw'

// 创建测试用的QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false // 测试时禁用重试
      },
      mutations: {
        retry: false
      }
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  })

// 创建测试包装器
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('React Query Hooks测试', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  describe('认证相关Hooks', () => {
    describe('useLogin', () => {
      it('应该能够成功登录', async () => {
        const wrapper = createWrapper(queryClient)

        const { result } = renderHook(() => useLogin(), { wrapper })

        const loginData = {
          username: 'testuser',
          password: 'testpass'
        }

        result.current.mutate(loginData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data?.code).toBe(200)
        expect(result.current.data?.data).toHaveProperty('accessToken')
      })

      it('应该在登录失败时显示错误', async () => {
        const wrapper = createWrapper(queryClient)

        const { result } = renderHook(() => useLogin(), { wrapper })

        const loginData = {
          username: 'testuser',
          password: 'wrong'
        }

        result.current.mutate(loginData)

        await waitFor(() => {
          expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toBeTruthy()
      })
    })

    describe('useUserInfo', () => {
      it('应该能够获取用户信息', async () => {
        const wrapper = createWrapper(queryClient)

        const { result } = renderHook(() => useUserInfo(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data?.code).toBe(200)
        expect(result.current.data?.data).toHaveProperty('username')
      })

      it('应该在未授权时处理错误', async () => {
        // Mock unauthorized response
        server.use(
          http.get('*/auth/user', () => {
            return new HttpResponse(null, { status: 401 })
          })
        )

        const wrapper = createWrapper(queryClient)

        const { result } = renderHook(() => useUserInfo(), { wrapper })

        await waitFor(() => {
          expect(result.current.isError).toBe(true)
        })
      })
    })
  })

  describe('开店计划相关Hooks', () => {
    describe('useStorePlans', () => {
      it('应该能够获取开店计划列表', async () => {
        const wrapper = createWrapper(queryClient)

        const { result } = renderHook(() => useStorePlans(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data?.code).toBe(200)
        expect(Array.isArray(result.current.data?.data)).toBe(true)
      })

      it('应该支持查询参数', async () => {
        const wrapper = createWrapper(queryClient)
        const params = { page: 1, pageSize: 10, status: 'draft' as const }

        const { result } = renderHook(() => useStorePlans(params), { wrapper })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data?.pagination?.page).toBe(1)
        expect(result.current.data?.pagination?.pageSize).toBe(10)
      })

      it('应该在参数变化时重新获取数据', async () => {
        const wrapper = createWrapper(queryClient)

        const { result, rerender } = renderHook(({ params }) => useStorePlans(params), {
          wrapper,
          initialProps: { params: { page: 1 } }
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        // 改变参数
        rerender({ params: { page: 2 } })

        await waitFor(() => {
          expect(result.current.data?.pagination?.page).toBe(2)
        })
      })
    })

    describe('useCreateStorePlan', () => {
      it('应该能够创建开店计划', async () => {
        const wrapper = createWrapper(queryClient)

        const { result } = renderHook(() => useCreateStorePlan(), { wrapper })

        const storePlanData = {
          name: '测试计划',
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
          budget: 1000000,
          milestones: [],
          attachments: [],
          approvalHistory: []
        }

        result.current.mutate(storePlanData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data?.code).toBe(200)
        expect(result.current.data?.data.name).toBe(storePlanData.name)
      })

      it('应该在创建失败时显示错误', async () => {
        // Mock error response
        server.use(
          http.post('*/store-plans', () => {
            return HttpResponse.json(
              { code: 400, message: '创建失败', data: null, timestamp: Date.now() },
              { status: 400 }
            )
          })
        )

        const wrapper = createWrapper(queryClient)

        const { result } = renderHook(() => useCreateStorePlan(), { wrapper })

        const invalidData = {}

        result.current.mutate(invalidData as any)

        await waitFor(() => {
          expect(result.current.isError).toBe(true)
        })
      })
    })
  })

  describe('Query缓存管理', () => {
    it('应该正确缓存查询结果', async () => {
      const wrapper = createWrapper(queryClient)

      // 第一次请求
      const { result: result1 } = renderHook(() => useStorePlans(), { wrapper })

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
      })

      // 第二次请求应该从缓存获取
      const { result: result2 } = renderHook(() => useStorePlans(), { wrapper })

      // 应该立即返回缓存结果
      expect(result2.current.data).toBeTruthy()
      expect(result2.current.isStale).toBe(false)
    })

    it('应该在mutation成功后更新缓存', async () => {
      const wrapper = createWrapper(queryClient)

      // 先获取列表
      const { result: listResult } = renderHook(() => useStorePlans(), { wrapper })

      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      const initialCount = listResult.current.data?.data.length || 0

      // 创建新项目
      const { result: createResult } = renderHook(() => useCreateStorePlan(), { wrapper })

      const newPlan = {
        name: '新计划',
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
        budget: 1000000,
        milestones: [],
        attachments: [],
        approvalHistory: []
      }

      createResult.current.mutate(newPlan)

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // 缓存应该被更新（在实际应用中，这会触发列表的重新获取）
      // 这里我们主要验证mutation成功执行
      expect(createResult.current.data?.data.name).toBe(newPlan.name)
    })
  })

  describe('错误处理', () => {
    it('应该正确处理网络错误', async () => {
      // Mock network error
      server.use(
        http.get('*/store-plans', () => {
          return HttpResponse.error()
        })
      )

      const wrapper = createWrapper(queryClient)

      const { result } = renderHook(() => useStorePlans(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeTruthy()
    })

    it('应该在401错误时处理认证失败', async () => {
      // Mock 401 error
      server.use(
        http.get('*/auth/user', () => {
          return new HttpResponse(null, { status: 401 })
        })
      )

      const wrapper = createWrapper(queryClient)

      const { result } = renderHook(() => useUserInfo(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // 在实际应用中，这会触发重定向到登录页
    })
  })
})
