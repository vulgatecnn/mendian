// 开店计划Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'
import type { StorePlan, StorePlanQueryParams } from '../../types'

export class StorePlanMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 获取开店计划列表
      http.get(`${this.config.baseUrl}/store-plans`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const name = url.searchParams.get('name')
        const status = url.searchParams.get('status')
        const type = url.searchParams.get('type')

        let data = MockDataStore.getInstance().getData<StorePlan>('storePlans')

        // 应用过滤器
        if (name) {
          data = data.filter(item => item.name.includes(name))
        }
        if (status) {
          data = data.filter(item => item.status === status)
        }
        if (type) {
          data = data.filter(item => item.type === type)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 获取开店计划详情
      http.get(`${this.config.baseUrl}/store-plans/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const data = MockDataStore.getInstance().getData<StorePlan>('storePlans')
        const item = data.find(item => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('开店计划不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item))
      }),

      // 创建开店计划
      http.post(`${this.config.baseUrl}/store-plans`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as Partial<StorePlan>

        const newPlan: StorePlan = {
          ...(body as StorePlan),
          id: MockUtils.generateId(),
          progress: 0,
          milestones: [],
          attachments: [],
          approvalHistory: [],
          createdBy: MockUtils.generateId(),
          createdByName: MockUtils.generateChineseName(),
          updatedBy: MockUtils.generateId(),
          updatedByName: MockUtils.generateChineseName(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('storePlans', newPlan)

        return HttpResponse.json(MockResponse.success(newPlan, '开店计划创建成功'))
      }),

      // 更新开店计划
      http.put(`${this.config.baseUrl}/store-plans/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData<StorePlan>(
          'storePlans',
          id as string,
          {
            ...body,
            updatedBy: MockUtils.generateId(),
            updatedByName: MockUtils.generateChineseName()
          }
        )

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('开店计划不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 删除开店计划
      http.delete(`${this.config.baseUrl}/store-plans/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const deleted = MockDataStore.getInstance().deleteData('storePlans', id as string)

        if (!deleted) {
          return HttpResponse.json(MockResponse.error('开店计划不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(null, '删除成功'))
      }),

      // 审批开店计划
      http.post(`${this.config.baseUrl}/store-plans/:id/approve`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const updatedItem = MockDataStore.getInstance().updateData<StorePlan>(
          'storePlans',
          id as string,
          {
            status: 'approved'
          }
        )

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('开店计划不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(null, '审批通过'))
      }),

      // 拒绝开店计划
      http.post(`${this.config.baseUrl}/store-plans/:id/reject`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const updatedItem = MockDataStore.getInstance().updateData<StorePlan>(
          'storePlans',
          id as string,
          {
            status: 'cancelled'
          }
        )

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('开店计划不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(null, '已拒绝'))
      }),

      // 获取统计数据
      http.get(`${this.config.baseUrl}/store-plans/stats`, async () => {
        await MockUtils.delay()

        const data = MockDataStore.getInstance().getData<StorePlan>('storePlans')

        const stats = {
          total: {
            total: data.length,
            increase: Math.floor(Math.random() * 20),
            increaseRate: Math.random() * 0.2,
            periodData: Array.from({ length: 12 }, (_, i) => ({
              period: `2024-${String(i + 1).padStart(2, '0')}`,
              value: Math.floor(Math.random() * 20)
            }))
          },
          byStatus: {
            draft: data.filter(item => item.status === 'draft').length,
            pending: data.filter(item => item.status === 'pending').length,
            approved: data.filter(item => item.status === 'approved').length,
            in_progress: data.filter(item => item.status === 'in_progress').length,
            completed: data.filter(item => item.status === 'completed').length,
            cancelled: data.filter(item => item.status === 'cancelled').length
          },
          byType: {
            direct: data.filter(item => item.type === 'direct').length,
            franchise: data.filter(item => item.type === 'franchise').length,
            joint_venture: data.filter(item => item.type === 'joint_venture').length
          },
          byRegion: data.reduce(
            (acc, item) => {
              acc[item.region.name] = (acc[item.region.name] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          timeline: Array.from({ length: 12 }, (_, i) => ({
            date: `2024-${String(i + 1).padStart(2, '0')}`,
            planned: Math.floor(Math.random() * 10),
            completed: Math.floor(Math.random() * 8)
          }))
        }

        return HttpResponse.json(MockResponse.success(stats))
      }),

      // 获取选项数据
      http.get(`${this.config.baseUrl}/store-plans/options`, async () => {
        await MockUtils.delay()

        const regions = MockDataStore.getInstance().getData('regions')
        const users = MockDataStore.getInstance().getData('users')

        const options = {
          regions: regions.map((r: any) => ({ id: r.id, name: r.name, code: r.code })),
          types: [
            { value: 'direct', label: '直营' },
            { value: 'franchise', label: '加盟' },
            { value: 'joint_venture', label: '合资' }
          ],
          statuses: [
            { value: 'draft', label: '草稿' },
            { value: 'pending', label: '待审批' },
            { value: 'approved', label: '已批准' },
            { value: 'in_progress', label: '进行中' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' }
          ],
          priorities: [
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' },
            { value: 'urgent', label: '紧急' }
          ],
          users: users.map((u: any) => ({ id: u.id, name: u.name, department: u.department.name }))
        }

        return HttpResponse.json(MockResponse.success(options))
      })
    ]
  }
}
