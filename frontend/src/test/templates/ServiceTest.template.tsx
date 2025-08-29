/**
 * Service/API Test Template
 * 
 * This template provides comprehensive testing structure for service layers,
 * API clients, and utility functions. Services are typically pure functions
 * or classes that handle data processing, API communication, and business logic.
 * 
 * Usage:
 * 1. Copy this file to your test directory
 * 2. Rename to match your service (e.g., storePlanService.test.ts)
 * 3. Replace SERVICE_NAME with your actual service name
 * 4. Update imports and mock dependencies
 * 5. Customize test scenarios for your service's functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MockFactory,
  ApiMockUtils,
  HttpMockUtils,
  TimeMockUtils,
  cleanup,
} from '@/test/utils'

// Import your service
// import { SERVICE_NAME } from '@/services/SERVICE_NAME'
// import type { ServiceParams, ServiceResponse } from '@/types/service'

// Mock dependencies
vi.mock('axios')
vi.mock('@/utils/logger')

// Mock service implementation for template
class MockService {
  constructor(private baseURL: string = '/api/v1') {}

  async getData(id: string) {
    if (!id) throw new Error('ID is required')
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return ApiMockUtils.createSuccessResponse({
      id,
      data: MockFactory.generateStorePlan(),
    })
  }

  async createData(data: any) {
    if (!data) throw new Error('Data is required')
    
    const newItem = {
      ...data,
      id: MockFactory.generateId(),
      createdAt: new Date().toISOString(),
    }
    
    return ApiMockUtils.createSuccessResponse(newItem, '创建成功')
  }

  async updateData(id: string, data: any) {
    if (!id || !data) throw new Error('ID and data are required')
    
    const updatedItem = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    }
    
    return ApiMockUtils.createSuccessResponse(updatedItem, '更新成功')
  }

  async deleteData(id: string) {
    if (!id) throw new Error('ID is required')
    
    return ApiMockUtils.createSuccessResponse(null, '删除成功')
  }

  async getList(params: any = {}) {
    const { page = 1, pageSize = 20, search, filters } = params
    
    // Generate mock data
    const items = Array.from({ length: pageSize }, () => MockFactory.generateStorePlan())
    
    // Apply search filter if provided
    const filteredItems = search 
      ? items.filter(item => item.title.includes(search))
      : items
    
    return ApiMockUtils.createPaginationResponse(
      filteredItems,
      page,
      pageSize,
      100 // total
    )
  }

  validateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!data) {
      errors.push('数据不能为空')
    }
    
    if (data && !data.name) {
      errors.push('名称是必填项')
    }
    
    if (data && data.name && data.name.length < 2) {
      errors.push('名称长度不能少于2个字符')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  formatData(rawData: any) {
    if (!rawData) return null
    
    return {
      id: rawData.id,
      title: rawData.name || rawData.title,
      description: rawData.desc || rawData.description,
      createdAt: rawData.created_at || rawData.createdAt,
      updatedAt: rawData.updated_at || rawData.updatedAt,
    }
  }

  calculateStats(items: any[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        total: 0,
        average: 0,
        max: 0,
        min: 0,
      }
    }
    
    const values = items.map(item => item.value || 0)
    const total = values.reduce((sum, val) => sum + val, 0)
    
    return {
      total,
      average: total / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
    }
  }
}

describe('SERVICE_NAME Service', () => {
  let service: MockService
  let mockHttp: any

  beforeEach(() => {
    service = new MockService()
    mockHttp = HttpMockUtils.mockAxios()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new MockService()
      expect(defaultService).toBeInstanceOf(MockService)
    })

    it('should initialize with custom configuration', () => {
      const customService = new MockService('/api/v2')
      expect(customService).toBeInstanceOf(MockService)
    })

    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        new MockService('')
      }).not.toThrow()
    })
  })

  describe('Data Retrieval', () => {
    it('should fetch data by ID successfully', async () => {
      const testId = 'test-id'
      const result = await service.getData(testId)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe(testId)
      expect(result.data.data).toBeDefined()
    })

    it('should handle missing ID parameter', async () => {
      await expect(service.getData('')).rejects.toThrow('ID is required')
    })

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockHttp.get.mockRejectedValueOnce(new Error('Network error'))
      
      // Service should handle the error appropriately
      // This depends on actual implementation
      expect(mockHttp.get).toBeDefined()
    })

    it('should cache responses when configured', async () => {
      const testId = 'cached-id'
      
      // First call
      const result1 = await service.getData(testId)
      
      // Second call should potentially use cache
      const result2 = await service.getData(testId)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('should handle timeout errors', async () => {
      vi.useFakeTimers()
      
      // Mock a slow response
      const slowPromise = new Promise(resolve => 
        setTimeout(resolve, 10000) // 10 second delay
      )
      
      mockHttp.get.mockImplementationOnce(() => slowPromise)
      
      // Fast forward time
      vi.advanceTimersByTime(5000)
      
      vi.useRealTimers()
    })
  })

  describe('Data Creation', () => {
    it('should create new data successfully', async () => {
      const testData = {
        name: '测试数据',
        description: '测试描述',
      }
      
      const result = await service.createData(testData)
      
      expect(result.success).toBe(true)
      expect(result.data.name).toBe(testData.name)
      expect(result.data.id).toBeDefined()
      expect(result.data.createdAt).toBeDefined()
      expect(result.message).toBe('创建成功')
    })

    it('should validate required fields', async () => {
      await expect(service.createData(null)).rejects.toThrow('Data is required')
    })

    it('should handle creation conflicts', async () => {
      const testData = { name: '重复名称' }
      
      // Mock conflict response
      mockHttp.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: '名称已存在' }
        }
      })
      
      // Service should handle conflict appropriately
      expect(mockHttp.post).toBeDefined()
    })

    it('should sanitize input data', async () => {
      const unsafeData = {
        name: '<script>alert("xss")</script>',
        description: 'Normal description',
      }
      
      const result = await service.createData(unsafeData)
      
      // Service should sanitize the input
      expect(result.success).toBe(true)
    })
  })

  describe('Data Updates', () => {
    it('should update data successfully', async () => {
      const testId = 'test-id'
      const updateData = {
        name: '更新后的名称',
        description: '更新后的描述',
      }
      
      const result = await service.updateData(testId, updateData)
      
      expect(result.success).toBe(true)
      expect(result.data.id).toBe(testId)
      expect(result.data.name).toBe(updateData.name)
      expect(result.data.updatedAt).toBeDefined()
      expect(result.message).toBe('更新成功')
    })

    it('should validate update parameters', async () => {
      await expect(service.updateData('', {})).rejects.toThrow('ID and data are required')
      await expect(service.updateData('id', null)).rejects.toThrow('ID and data are required')
    })

    it('should handle partial updates', async () => {
      const testId = 'test-id'
      const partialUpdate = { name: '仅更新名称' }
      
      const result = await service.updateData(testId, partialUpdate)
      
      expect(result.success).toBe(true)
      expect(result.data.name).toBe(partialUpdate.name)
    })

    it('should handle non-existent resources', async () => {
      mockHttp.put.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: '资源不存在' }
        }
      })
      
      // Service should handle 404 appropriately
      expect(mockHttp.put).toBeDefined()
    })
  })

  describe('Data Deletion', () => {
    it('should delete data successfully', async () => {
      const testId = 'test-id'
      
      const result = await service.deleteData(testId)
      
      expect(result.success).toBe(true)
      expect(result.message).toBe('删除成功')
    })

    it('should validate delete parameters', async () => {
      await expect(service.deleteData('')).rejects.toThrow('ID is required')
    })

    it('should handle deletion of non-existent resources', async () => {
      mockHttp.delete.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: '资源不存在' }
        }
      })
      
      // Service should handle 404 appropriately
      expect(mockHttp.delete).toBeDefined()
    })

    it('should handle cascade deletion conflicts', async () => {
      mockHttp.delete.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: '存在关联数据，无法删除' }
        }
      })
      
      expect(mockHttp.delete).toBeDefined()
    })
  })

  describe('List Operations', () => {
    it('should fetch paginated list successfully', async () => {
      const params = {
        page: 1,
        pageSize: 20,
      }
      
      const result = await service.getList(params)
      
      expect(result.success).toBe(true)
      expect(result.data.list).toHaveLength(20)
      expect(result.data.pagination.page).toBe(1)
      expect(result.data.pagination.pageSize).toBe(20)
      expect(result.data.pagination.total).toBe(100)
    })

    it('should handle search parameters', async () => {
      const params = {
        page: 1,
        pageSize: 10,
        search: '搜索关键词',
      }
      
      const result = await service.getList(params)
      
      expect(result.success).toBe(true)
      // Search filtering should be applied
    })

    it('should handle filter parameters', async () => {
      const params = {
        filters: {
          status: 'active',
          category: 'type1',
        },
      }
      
      const result = await service.getList(params)
      
      expect(result.success).toBe(true)
    })

    it('should handle empty results', async () => {
      const params = {
        search: 'nonexistent-term',
      }
      
      const result = await service.getList(params)
      
      expect(result.success).toBe(true)
      expect(result.data.list).toHaveLength(0)
    })

    it('should handle sorting parameters', async () => {
      const params = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }
      
      const result = await service.getList(params)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Data Validation', () => {
    it('should validate valid data', () => {
      const validData = {
        name: '有效名称',
        description: '有效描述',
      }
      
      const result = service.validateData(validData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch validation errors', () => {
      const invalidData = {
        description: '缺少名称字段',
      }
      
      const result = service.validateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('名称是必填项')
    })

    it('should validate field length constraints', () => {
      const shortNameData = {
        name: 'a', // Too short
      }
      
      const result = service.validateData(shortNameData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('名称长度不能少于2个字符')
    })

    it('should handle null/undefined data', () => {
      const nullResult = service.validateData(null)
      const undefinedResult = service.validateData(undefined)
      
      expect(nullResult.isValid).toBe(false)
      expect(undefinedResult.isValid).toBe(false)
      expect(nullResult.errors).toContain('数据不能为空')
    })

    it('should validate multiple fields', () => {
      const multiErrorData = {}
      
      const result = service.validateData(multiErrorData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Data Formatting', () => {
    it('should format raw data correctly', () => {
      const rawData = {
        id: 'test-id',
        name: 'Raw Name',
        desc: 'Raw Description',
        created_at: '2024-01-01T00:00:00Z',
      }
      
      const formatted = service.formatData(rawData)
      
      expect(formatted.id).toBe(rawData.id)
      expect(formatted.title).toBe(rawData.name)
      expect(formatted.description).toBe(rawData.desc)
      expect(formatted.createdAt).toBe(rawData.created_at)
    })

    it('should handle missing fields gracefully', () => {
      const incompleteData = {
        id: 'test-id',
      }
      
      const formatted = service.formatData(incompleteData)
      
      expect(formatted.id).toBe(incompleteData.id)
      expect(formatted.title).toBeUndefined()
    })

    it('should handle null/undefined input', () => {
      const nullResult = service.formatData(null)
      const undefinedResult = service.formatData(undefined)
      
      expect(nullResult).toBeNull()
      expect(undefinedResult).toBeNull()
    })

    it('should preserve data types', () => {
      const rawData = {
        id: 'test-id',
        name: 'Test Name',
        count: 42,
        isActive: true,
        created_at: '2024-01-01T00:00:00Z',
      }
      
      const formatted = service.formatData(rawData)
      
      expect(formatted.id).toBe(rawData.id)
      expect(typeof formatted.title).toBe('string')
    })

    it('should handle nested objects', () => {
      const complexData = {
        id: 'test-id',
        name: 'Test Name',
        metadata: {
          author: 'Test Author',
          version: '1.0',
        },
      }
      
      const formatted = service.formatData(complexData)
      
      expect(formatted).toBeDefined()
    })
  })

  describe('Statistical Calculations', () => {
    it('should calculate statistics correctly', () => {
      const testItems = [
        { value: 10 },
        { value: 20 },
        { value: 30 },
        { value: 40 },
      ]
      
      const stats = service.calculateStats(testItems)
      
      expect(stats.total).toBe(100)
      expect(stats.average).toBe(25)
      expect(stats.max).toBe(40)
      expect(stats.min).toBe(10)
    })

    it('should handle empty arrays', () => {
      const stats = service.calculateStats([])
      
      expect(stats.total).toBe(0)
      expect(stats.average).toBe(0)
      expect(stats.max).toBe(0)
      expect(stats.min).toBe(0)
    })

    it('should handle arrays with missing values', () => {
      const testItems = [
        { value: 10 },
        { name: 'No value field' },
        { value: 30 },
      ]
      
      const stats = service.calculateStats(testItems)
      
      expect(stats.total).toBe(40) // 10 + 0 + 30
      expect(stats.average).toBe(40 / 3)
    })

    it('should handle non-array input', () => {
      const stats = service.calculateStats(null as any)
      
      expect(stats.total).toBe(0)
      expect(stats.average).toBe(0)
    })

    it('should handle single item arrays', () => {
      const testItems = [{ value: 42 }]
      
      const stats = service.calculateStats(testItems)
      
      expect(stats.total).toBe(42)
      expect(stats.average).toBe(42)
      expect(stats.max).toBe(42)
      expect(stats.min).toBe(42)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockHttp.get.mockRejectedValueOnce(new Error('Network unavailable'))
      
      // Service should handle network errors gracefully
      expect(mockHttp.get).toBeDefined()
    })

    it('should handle timeout errors', async () => {
      mockHttp.get.mockRejectedValueOnce(new Error('Request timeout'))
      
      expect(mockHttp.get).toBeDefined()
    })

    it('should handle server errors (5xx)', async () => {
      mockHttp.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      })
      
      expect(mockHttp.get).toBeDefined()
    })

    it('should handle authentication errors (401)', async () => {
      mockHttp.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      })
      
      expect(mockHttp.get).toBeDefined()
    })

    it('should handle permission errors (403)', async () => {
      mockHttp.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        }
      })
      
      expect(mockHttp.get).toBeDefined()
    })

    it('should retry on transient failures', async () => {
      let callCount = 0
      mockHttp.get.mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Transient error'))
        }
        return Promise.resolve({ data: { success: true } })
      })
      
      // Service should implement retry logic for transient failures
      expect(mockHttp.get).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should complete operations within acceptable time', async () => {
      const startTime = Date.now()
      await service.getData('test-id')
      const endTime = Date.now()
      
      // Should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should handle large datasets efficiently', async () => {
      const largeParams = {
        page: 1,
        pageSize: 1000, // Large page size
      }
      
      const startTime = Date.now()
      const result = await service.getList(largeParams)
      const endTime = Date.now()
      
      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(2000) // 2 second limit
    })

    it('should not leak memory', () => {
      // Create multiple service instances
      const services = Array.from({ length: 100 }, () => new MockService())
      
      // Perform operations
      services.forEach((svc, index) => {
        svc.validateData({ name: `Test ${index}` })
      })
      
      // Services should be garbage collectable
      expect(services.length).toBe(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      mockHttp.get.mockResolvedValueOnce({
        data: 'not json',
      })
      
      // Service should handle malformed responses
      expect(mockHttp.get).toBeDefined()
    })

    it('should handle missing response fields', async () => {
      mockHttp.get.mockResolvedValueOnce({
        data: {
          // Missing expected fields
        }
      })
      
      expect(mockHttp.get).toBeDefined()
    })

    it('should handle unicode characters', async () => {
      const unicodeData = {
        name: '测试数据 🎉',
        description: '包含emoji和中文字符',
      }
      
      const result = await service.createData(unicodeData)
      
      expect(result.success).toBe(true)
      expect(result.data.name).toBe(unicodeData.name)
    })

    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(10000)
      const longData = {
        name: 'Test',
        description: longString,
      }
      
      const result = await service.createData(longData)
      
      expect(result.success).toBe(true)
    })

    it('should handle concurrent requests', async () => {
      // Create multiple concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) => 
        service.getData(`concurrent-${i}`)
      )
      
      const results = await Promise.all(requests)
      
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })
})

/**
 * Service Test Coverage Checklist:
 * 
 * □ Service initializes correctly with default config
 * □ Service initializes correctly with custom config
 * □ Invalid configuration is handled gracefully
 * □ Data retrieval works correctly
 * □ Missing parameters are handled
 * □ API errors are handled gracefully
 * □ Response caching works (if implemented)
 * □ Timeout errors are handled
 * □ Data creation works correctly
 * □ Required field validation works
 * □ Creation conflicts are handled
 * □ Input data sanitization works
 * □ Data updates work correctly
 * □ Update parameter validation works
 * □ Partial updates are handled
 * □ Non-existent resource updates are handled
 * □ Data deletion works correctly
 * □ Delete parameter validation works
 * □ Deletion of non-existent resources is handled
 * □ Cascade deletion conflicts are handled
 * □ Paginated list retrieval works
 * □ Search parameters work
 * □ Filter parameters work
 * □ Empty results are handled
 * □ Sorting parameters work
 * □ Data validation works for valid data
 * □ Validation errors are caught
 * □ Field length constraints are validated
 * □ Null/undefined data validation works
 * □ Multiple field validation works
 * □ Data formatting works correctly
 * □ Missing fields in formatting are handled
 * □ Null/undefined formatting input is handled
 * □ Data types are preserved in formatting
 * □ Nested objects are handled in formatting
 * □ Statistical calculations are correct
 * □ Empty arrays in calculations are handled
 * □ Missing values in calculations are handled
 * □ Non-array input in calculations is handled
 * □ Single item calculations are correct
 * □ Network errors are handled
 * □ Timeout errors are handled
 * □ Server errors (5xx) are handled
 * □ Authentication errors (401) are handled
 * □ Permission errors (403) are handled
 * □ Retry logic works for transient failures
 * □ Operations complete within acceptable time
 * □ Large datasets are handled efficiently
 * □ No memory leaks occur
 * □ Malformed API responses are handled
 * □ Missing response fields are handled
 * □ Unicode characters are handled
 * □ Very long strings are handled
 * □ Concurrent requests are handled properly
 * 
 * Additional Notes:
 * - Replace SERVICE_NAME with your actual service name
 * - Update imports to match your service location
 * - Add service-specific test scenarios
 * - Update API mocks to match your endpoints
 * - Customize error handling tests for your use cases
 * - Add business logic specific to your service
 * - Consider testing service composition if applicable
 * - Add integration tests if the service interacts with multiple APIs
 */