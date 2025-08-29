/**
 * MSW基础处理器
 * 提供通用的Mock响应处理逻辑
 */
import { rest } from 'msw'
import { mockDelay, mockError, createPaginatedResponse, type PaginatedResponse } from '../factories'

// API基础路径
export const API_BASE_URL = 'http://localhost:7900/api/v1'

// 响应状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

// 标准API响应格式
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
  timestamp: string
}

// 标准分页响应格式
export interface ApiPaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    current: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 创建成功响应
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message || 'Success',
    code: HTTP_STATUS.OK,
    timestamp: new Date().toISOString(),
  }
}

// 创建分页成功响应
export function createPaginatedSuccessResponse<T>(
  paginatedData: PaginatedResponse<T>,
  message?: string
): ApiPaginatedResponse<T> {
  return {
    success: true,
    data: paginatedData.data,
    pagination: paginatedData.pagination,
    message: message || 'Success',
    code: HTTP_STATUS.OK,
    timestamp: new Date().toISOString(),
  }
}

// 创建错误响应
export function createErrorResponse(message: string, code: number = HTTP_STATUS.BAD_REQUEST): ApiResponse {
  return {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
  }
}

// 通用的CRUD Mock处理器生成函数
export function createCRUDHandlers<T extends { id: string }>(
  endpoint: string,
  dataStore: T[],
  options: {
    createFn?: (data: Partial<T>) => T
    updateFn?: (id: string, data: Partial<T>) => T | null
    searchFn?: (query: string, data: T[]) => T[]
  } = {}
) {
  const { createFn, updateFn, searchFn } = options

  return [
    // GET /endpoint - 分页查询
    rest.get(`${API_BASE_URL}${endpoint}`, async (req, res, ctx) => {
      try {
        await mockDelay()
        mockError(0.05) // 5%错误率

        const url = new URL(req.url)
        const page = Number(url.searchParams.get('page')) || 1
        const pageSize = Number(url.searchParams.get('pageSize')) || 10
        const keyword = url.searchParams.get('keyword') || ''

        let filteredData = dataStore
        
        // 关键词搜索
        if (keyword && searchFn) {
          filteredData = searchFn(keyword, dataStore)
        }

        const paginatedData = createPaginatedResponse(filteredData, { page, pageSize })
        
        return res(
          ctx.status(HTTP_STATUS.OK),
          ctx.json(createPaginatedSuccessResponse(paginatedData))
        )
      } catch (error) {
        return res(
          ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
          ctx.json(createErrorResponse('Internal server error'))
        )
      }
    }),

    // GET /endpoint/:id - 根据ID查询
    rest.get(`${API_BASE_URL}${endpoint}/:id`, async (req, res, ctx) => {
      try {
        await mockDelay()
        mockError(0.03)

        const { id } = req.params
        const item = dataStore.find(item => item.id === id)

        if (!item) {
          return res(
            ctx.status(HTTP_STATUS.NOT_FOUND),
            ctx.json(createErrorResponse('Record not found'))
          )
        }

        return res(
          ctx.status(HTTP_STATUS.OK),
          ctx.json(createSuccessResponse(item))
        )
      } catch (error) {
        return res(
          ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
          ctx.json(createErrorResponse('Internal server error'))
        )
      }
    }),

    // POST /endpoint - 创建
    rest.post(`${API_BASE_URL}${endpoint}`, async (req, res, ctx) => {
      try {
        await mockDelay()
        mockError(0.03)

        if (!createFn) {
          return res(
            ctx.status(HTTP_STATUS.METHOD_NOT_ALLOWED),
            ctx.json(createErrorResponse('Create operation not supported'))
          )
        }

        const requestData = await req.json()
        const newItem = createFn(requestData)
        dataStore.push(newItem)

        return res(
          ctx.status(HTTP_STATUS.CREATED),
          ctx.json(createSuccessResponse(newItem, 'Created successfully'))
        )
      } catch (error) {
        return res(
          ctx.status(HTTP_STATUS.BAD_REQUEST),
          ctx.json(createErrorResponse('Invalid request data'))
        )
      }
    }),

    // PUT /endpoint/:id - 更新
    rest.put(`${API_BASE_URL}${endpoint}/:id`, async (req, res, ctx) => {
      try {
        await mockDelay()
        mockError(0.03)

        if (!updateFn) {
          return res(
            ctx.status(HTTP_STATUS.METHOD_NOT_ALLOWED),
            ctx.json(createErrorResponse('Update operation not supported'))
          )
        }

        const { id } = req.params
        const requestData = await req.json()
        const updatedItem = updateFn(id as string, requestData)

        if (!updatedItem) {
          return res(
            ctx.status(HTTP_STATUS.NOT_FOUND),
            ctx.json(createErrorResponse('Record not found'))
          )
        }

        return res(
          ctx.status(HTTP_STATUS.OK),
          ctx.json(createSuccessResponse(updatedItem, 'Updated successfully'))
        )
      } catch (error) {
        return res(
          ctx.status(HTTP_STATUS.BAD_REQUEST),
          ctx.json(createErrorResponse('Invalid request data'))
        )
      }
    }),

    // DELETE /endpoint/:id - 删除
    rest.delete(`${API_BASE_URL}${endpoint}/:id`, async (req, res, ctx) => {
      try {
        await mockDelay()
        mockError(0.03)

        const { id } = req.params
        const index = dataStore.findIndex(item => item.id === id)

        if (index === -1) {
          return res(
            ctx.status(HTTP_STATUS.NOT_FOUND),
            ctx.json(createErrorResponse('Record not found'))
          )
        }

        dataStore.splice(index, 1)

        return res(
          ctx.status(HTTP_STATUS.OK),
          ctx.json(createSuccessResponse(null, 'Deleted successfully'))
        )
      } catch (error) {
        return res(
          ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
          ctx.json(createErrorResponse('Internal server error'))
        )
      }
    }),
  ]
}

// 通用查询参数解析
export function parseQueryParams(url: URL) {
  const params: Record<string, any> = {}
  
  for (const [key, value] of url.searchParams.entries()) {
    // 尝试转换为数字
    const numValue = Number(value)
    if (!isNaN(numValue) && isFinite(numValue)) {
      params[key] = numValue
    } else if (value === 'true' || value === 'false') {
      params[key] = value === 'true'
    } else {
      params[key] = value
    }
  }
  
  return params
}

// 分页参数解析
export function parsePaginationParams(url: URL) {
  return {
    page: Number(url.searchParams.get('page')) || 1,
    pageSize: Number(url.searchParams.get('pageSize')) || 10,
  }
}

// 日期范围过滤
export function filterByDateRange<T extends { createdAt: string }>(
  data: T[],
  startDate?: string,
  endDate?: string
): T[] {
  if (!startDate && !endDate) return data

  return data.filter(item => {
    const itemDate = new Date(item.createdAt)
    if (startDate && itemDate < new Date(startDate)) return false
    if (endDate && itemDate > new Date(endDate)) return false
    return true
  })
}

// 文本搜索过滤
export function filterByKeyword<T>(
  data: T[],
  keyword: string,
  searchFields: (keyof T)[]
): T[] {
  if (!keyword) return data

  const lowerKeyword = keyword.toLowerCase()
  
  return data.filter(item =>
    searchFields.some(field => {
      const value = item[field]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerKeyword)
      }
      if (typeof value === 'number') {
        return value.toString().includes(lowerKeyword)
      }
      return false
    })
  )
}