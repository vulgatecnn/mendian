// 基础数据管理Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'

export class BasicDataMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 获取区域数据
      http.get(`${this.config.baseUrl}/basic-data/regions`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const level = url.searchParams.get('level')
        const parentId = url.searchParams.get('parentId')

        let data = MockDataStore.getInstance().getData('regions') || []

        if (level) {
          data = data.filter((item: any) => item.level === level)
        }
        if (parentId) {
          data = data.filter((item: any) => item.parentId === parentId)
        }

        return HttpResponse.json(MockResponse.success(data))
      }),

      // 获取供应商数据
      http.get(`${this.config.baseUrl}/basic-data/suppliers`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const status = url.searchParams.get('status')
        const category = url.searchParams.get('category')

        let data = MockDataStore.getInstance().getData('suppliers') || []

        if (status) {
          data = data.filter((item: any) => item.status === status)
        }
        if (category) {
          data = data.filter((item: any) => item.category === category)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 创建供应商
      http.post(`${this.config.baseUrl}/basic-data/suppliers`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newSupplier = {
          ...body,
          id: MockUtils.generateId(),
          code: `SUP${Math.random().toString().substr(2, 6)}`,
          status: 'active',
          rating: Math.floor(Math.random() * 3) + 3, // 3-5星
          cooperationStartDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('suppliers', newSupplier)

        return HttpResponse.json(MockResponse.success(newSupplier, '供应商创建成功'))
      }),

      // 更新供应商
      http.put(`${this.config.baseUrl}/basic-data/suppliers/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData('suppliers', id as string, body)

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('供应商不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 获取客户数据
      http.get(`${this.config.baseUrl}/basic-data/customers`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const type = url.searchParams.get('type')
        const status = url.searchParams.get('status')

        let data = MockDataStore.getInstance().getData('customers') || []

        if (type) {
          data = data.filter((item: any) => item.type === type)
        }
        if (status) {
          data = data.filter((item: any) => item.status === status)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 创建客户
      http.post(`${this.config.baseUrl}/basic-data/customers`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newCustomer = {
          ...body,
          id: MockUtils.generateId(),
          code: `CUST${Math.random().toString().substr(2, 6)}`,
          status: 'active',
          level: 'regular',
          totalOrders: 0,
          totalAmount: 0,
          lastOrderDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('customers', newCustomer)

        return HttpResponse.json(MockResponse.success(newCustomer, '客户创建成功'))
      }),

      // 更新客户
      http.put(`${this.config.baseUrl}/basic-data/customers/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData('customers', id as string, body)

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('客户不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 获取组织架构数据
      http.get(`${this.config.baseUrl}/basic-data/organizations`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const flat = url.searchParams.get('flat') === 'true'

        let data = MockDataStore.getInstance().getData('organizations') || []

        if (!flat) {
          // 构建树形结构
          const buildTree = (items: any[], parentId: string | null = null): any[] => {
            return items
              .filter(item => item.parentId === parentId)
              .map(item => ({
                ...item,
                children: buildTree(items, item.id)
              }))
          }

          data = buildTree(data)
        }

        return HttpResponse.json(MockResponse.success(data))
      }),

      // 创建组织
      http.post(`${this.config.baseUrl}/basic-data/organizations`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newOrg = {
          ...body,
          id: MockUtils.generateId(),
          code: `ORG${Math.random().toString().substr(2, 6)}`,
          status: 'active',
          memberCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('organizations', newOrg)

        return HttpResponse.json(MockResponse.success(newOrg, '组织创建成功'))
      }),

      // 更新组织
      http.put(`${this.config.baseUrl}/basic-data/organizations/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData('organizations', id as string, body)

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('组织不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 获取业务区域数据
      http.get(`${this.config.baseUrl}/basic-data/business-regions`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const status = url.searchParams.get('status')

        let data = MockDataStore.getInstance().getData('businessRegions') || []

        if (status) {
          data = data.filter((item: any) => item.status === status)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 创建业务区域
      http.post(`${this.config.baseUrl}/basic-data/business-regions`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newRegion = {
          ...body,
          id: MockUtils.generateId(),
          code: `BR${Math.random().toString().substr(2, 4)}`,
          status: 'active',
          storeCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('businessRegions', newRegion)

        return HttpResponse.json(MockResponse.success(newRegion, '业务区域创建成功'))
      }),

      // 更新业务区域
      http.put(`${this.config.baseUrl}/basic-data/business-regions/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData('businessRegions', id as string, body)

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('业务区域不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 获取所有基础数据选项
      http.get(`${this.config.baseUrl}/basic-data/options`, async () => {
        await MockUtils.delay()

        const regions = MockDataStore.getInstance().getData('regions') || []
        const suppliers = MockDataStore.getInstance().getData('suppliers') || []
        const organizations = MockDataStore.getInstance().getData('organizations') || []
        const businessRegions = MockDataStore.getInstance().getData('businessRegions') || []

        const options = {
          regions: regions.map((r: any) => ({ id: r.id, name: r.name, code: r.code, level: r.level })),
          suppliers: suppliers
            .filter((s: any) => s.status === 'active')
            .map((s: any) => ({ id: s.id, name: s.name, code: s.code, category: s.category })),
          organizations: organizations
            .filter((o: any) => o.status === 'active')
            .map((o: any) => ({ id: o.id, name: o.name, code: o.code, type: o.type })),
          businessRegions: businessRegions
            .filter((br: any) => br.status === 'active')
            .map((br: any) => ({ id: br.id, name: br.name, code: br.code })),
          
          // 枚举选项
          supplierCategories: [
            { value: 'food', label: '食材供应' },
            { value: 'equipment', label: '设备供应' },
            { value: 'decoration', label: '装修工程' },
            { value: 'service', label: '服务支持' },
            { value: 'other', label: '其他' }
          ],
          customerTypes: [
            { value: 'individual', label: '个人客户' },
            { value: 'corporate', label: '企业客户' },
            { value: 'franchise', label: '加盟商' },
            { value: 'partner', label: '合作伙伴' }
          ],
          organizationTypes: [
            { value: 'headquarters', label: '总部' },
            { value: 'branch', label: '分公司' },
            { value: 'department', label: '部门' },
            { value: 'team', label: '团队' }
          ],
          statusOptions: [
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '停用' },
            { value: 'pending', label: '待审核' }
          ]
        }

        return HttpResponse.json(MockResponse.success(options))
      }),

      // 批量操作
      http.post(`${this.config.baseUrl}/basic-data/:type/batch`, async ({ params, request }) => {
        await MockUtils.delay()

        const { type } = params
        const body = await request.json()
        const { action, ids } = body

        let message = ''
        let successCount = 0

        const dataTypes = ['suppliers', 'customers', 'organizations', 'businessRegions']
        
        if (!dataTypes.includes(type as string)) {
          return HttpResponse.json(MockResponse.error('不支持的数据类型', 400), { status: 400 })
        }

        switch (action) {
          case 'activate':
            ids.forEach((id: string) => {
              MockDataStore.getInstance().updateData(type as string, id, { status: 'active' })
              successCount++
            })
            message = `成功启用${successCount}条记录`
            break
          
          case 'deactivate':
            ids.forEach((id: string) => {
              MockDataStore.getInstance().updateData(type as string, id, { status: 'inactive' })
              successCount++
            })
            message = `成功停用${successCount}条记录`
            break
          
          case 'delete':
            ids.forEach((id: string) => {
              MockDataStore.getInstance().deleteData(type as string, id)
              successCount++
            })
            message = `成功删除${successCount}条记录`
            break
          
          default:
            return HttpResponse.json(MockResponse.error('不支持的批量操作', 400), { status: 400 })
        }

        return HttpResponse.json(MockResponse.success({ successCount }, message))
      })
    ]
  }
}

export const basicDataHandlers = new BasicDataMockHandler().getHandlers()