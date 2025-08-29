// Mock处理器统一导出
import { AuthMockHandler } from './auth'
import { StorePlanMockHandler } from './storePlan'
import { ExpansionMockHandler } from './expansion'
import { BaseMockHandler } from '../config'
import { http, HttpResponse } from 'msw'
import { MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data/index'

// 简化版Mock处理器 - 基本CRUD操作
export class SimpleMockHandler extends BaseMockHandler {
  constructor(
    private entityName: string,
    private basePath: string,
    config?: any
  ) {
    super(config)
  }

  getHandlers() {
    return [
      // 列表查询
      http.get(`${this.config.baseUrl}${this.basePath}`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

        const data = MockDataStore.getInstance().getData(this.entityName)
        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 详情查询
      http.get(`${this.config.baseUrl}${this.basePath}/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const data = MockDataStore.getInstance().getData(this.entityName)
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('记录不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item))
      }),

      // 创建
      http.post(`${this.config.baseUrl}${this.basePath}`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newItem = {
          ...body,
          id: MockUtils.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData(this.entityName, newItem)

        return HttpResponse.json(MockResponse.success(newItem, '创建成功'))
      }),

      // 更新
      http.put(`${this.config.baseUrl}${this.basePath}/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData(
          this.entityName,
          id as string,
          body
        )

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('记录不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 删除
      http.delete(`${this.config.baseUrl}${this.basePath}/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const deleted = MockDataStore.getInstance().deleteData(this.entityName, id as string)

        if (!deleted) {
          return HttpResponse.json(MockResponse.error('记录不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(null, '删除成功'))
      })
    ]
  }
}

// 导出所有处理器
export const mockHandlers = [
  new AuthMockHandler(),
  new StorePlanMockHandler(),
  new ExpansionMockHandler(),
  new SimpleMockHandler('preparationProjects', '/preparation/projects'),
  new SimpleMockHandler('stores', '/store-files/stores'),
  new SimpleMockHandler('paymentItems', '/operation/payments'),
  new SimpleMockHandler('approvalFlows', '/approval/flows'),
  new SimpleMockHandler('regions', '/basic-data/regions'),
  new SimpleMockHandler('suppliers', '/basic-data/suppliers')
]
