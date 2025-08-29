// HTTP客户端测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpClient } from '../http'
import { MockResponse } from '../mock/config'
import { server } from './setup'
import { http, HttpResponse } from 'msw'

describe('HttpClient', () => {
  let client: HttpClient

  beforeEach(() => {
    client = new HttpClient({
      baseURL: 'http://localhost:3000/api',
      enableErrorMessage: false // 测试时禁用错误提示
    })
    vi.clearAllMocks()
  })

  describe('基础HTTP方法', () => {
    it('应该能够发送GET请求', async () => {
      // 模拟成功响应
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json(MockResponse.success({ message: 'GET success' }))
        })
      )

      const response = await client.get('/test')

      expect(response.code).toBe(200)
      expect(response.data.message).toBe('GET success')
    })

    it('应该能够发送POST请求', async () => {
      const testData = { name: 'test', value: 123 }

      server.use(
        http.post('http://localhost:3000/api/test', async ({ request }) => {
          const body = await request.json()
          expect(body).toEqual(testData)
          return HttpResponse.json(MockResponse.success({ id: '1', ...body }))
        })
      )

      const response = await client.post('/test', testData)

      expect(response.code).toBe(200)
      expect(response.data).toEqual({ id: '1', ...testData })
    })

    it('应该能够发送PUT请求', async () => {
      const updateData = { id: '1', name: 'updated' }

      server.use(
        http.put('http://localhost:3000/api/test/1', async ({ request }) => {
          const body = await request.json()
          expect(body).toEqual(updateData)
          return HttpResponse.json(MockResponse.success(body))
        })
      )

      const response = await client.put('/test/1', updateData)

      expect(response.code).toBe(200)
      expect(response.data).toEqual(updateData)
    })

    it('应该能够发送DELETE请求', async () => {
      server.use(
        http.delete('http://localhost:3000/api/test/1', () => {
          return HttpResponse.json(MockResponse.success(null, '删除成功'))
        })
      )

      const response = await client.delete('/test/1')

      expect(response.code).toBe(200)
      expect(response.message).toBe('删除成功')
    })

    it('应该能够发送PATCH请求', async () => {
      const patchData = { status: 'active' }

      server.use(
        http.patch('http://localhost:3000/api/test/1', async ({ request }) => {
          const body = await request.json()
          expect(body).toEqual(patchData)
          return HttpResponse.json(MockResponse.success({ id: '1', ...patchData }))
        })
      )

      const response = await client.patch('/test/1', patchData)

      expect(response.code).toBe(200)
      expect(response.data).toEqual({ id: '1', ...patchData })
    })
  })

  describe('请求拦截器', () => {
    it('应该自动添加认证token', async () => {
      const token = 'test-token'
      localStorage.setItem('auth_token', token)

      server.use(
        http.get('http://localhost:3000/api/protected', ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          expect(authHeader).toBe(`Bearer ${token}`)
          return HttpResponse.json(MockResponse.success({ protected: true }))
        })
      )

      await client.get('/protected')
    })

    it('应该添加默认请求头', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', ({ request }) => {
          expect(request.headers.get('Content-Type')).toBe('application/json')
          expect(request.headers.get('X-Client')).toBe('mendian-frontend')
          return HttpResponse.json(MockResponse.success({}))
        })
      )

      await client.get('/test')
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      server.use(
        http.get('http://localhost:3000/api/network-error', () => {
          return HttpResponse.error()
        })
      )

      await expect(client.get('/network-error')).rejects.toThrow()
    })

    it('应该处理404错误', async () => {
      server.use(
        http.get('http://localhost:3000/api/not-found', () => {
          return new HttpResponse(null, { status: 404 })
        })
      )

      await expect(client.get('/not-found')).rejects.toThrow()
    })

    it('应该处理401未授权错误', async () => {
      server.use(
        http.get('http://localhost:3000/api/unauthorized', () => {
          return HttpResponse.json(MockResponse.error('未授权访问', 401), { status: 401 })
        })
      )

      await expect(client.get('/unauthorized')).rejects.toThrow()
    })

    it('应该处理业务错误', async () => {
      server.use(
        http.get('http://localhost:3000/api/business-error', () => {
          return HttpResponse.json({
            code: 4001,
            message: '业务处理失败',
            data: null,
            timestamp: Date.now()
          })
        })
      )

      await expect(client.get('/business-error')).rejects.toThrow('业务处理失败')
    })
  })

  describe('文件上传', () => {
    it('应该能够上传文件', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', file)

      server.use(
        http.post('http://localhost:3000/api/upload', async ({ request }) => {
          const body = await request.formData()
          const uploadedFile = body.get('file') as File
          expect(uploadedFile.name).toBe('test.txt')
          return HttpResponse.json(
            MockResponse.success({
              id: '1',
              filename: 'test.txt',
              url: '/uploads/test.txt',
              size: file.size
            })
          )
        })
      )

      const response = await client.upload('/upload', formData)

      expect(response.code).toBe(200)
      expect(response.data.filename).toBe('test.txt')
    }, { timeout: 10000 }) // 设置10秒超时
  })

  describe('请求重试', () => {
    it('应该在网络错误时重试', async () => {
      let attemptCount = 0

      server.use(
        http.get('http://localhost:3000/api/retry-test', () => {
          attemptCount++
          if (attemptCount < 3) {
            return HttpResponse.error()
          }
          return HttpResponse.json(MockResponse.success({ attempt: attemptCount }))
        })
      )

      const response = await client.get('/retry-test')

      expect(attemptCount).toBe(3)
      expect(response.data.attempt).toBe(3)
    })
  })

  describe('请求取消', () => {
    it('应该能够取消所有请求', () => {
      expect(() => client.cancelAllRequests()).not.toThrow()
    })
  })

  describe('配置管理', () => {
    it('应该能够更新配置', () => {
      const newConfig = {
        timeout: 15000,
        enableErrorMessage: true
      }

      expect(() => client.updateConfig(newConfig)).not.toThrow()
    })

    it('应该能够设置认证token', () => {
      const token = 'new-token'

      expect(() => client.setAuthToken(token)).not.toThrow()
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', token)
    })

    it('应该能够清除认证token', () => {
      expect(() => client.clearAuthToken()).not.toThrow()
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('加载状态管理', () => {
    it('应该追踪加载状态', () => {
      expect(client.isLoading).toBe(false)
    })

    it('应该支持加载状态监听', () => {
      const callback = vi.fn()
      const unsubscribe = client.onLoadingChange(callback)

      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })
  })
})
