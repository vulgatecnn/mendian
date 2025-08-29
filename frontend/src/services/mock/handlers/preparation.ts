// 开店筹备管理Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'

export class PreparationMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 获取筹备项目列表
      http.get(`${this.config.baseUrl}/preparation/projects`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const status = url.searchParams.get('status')
        const storeType = url.searchParams.get('storeType')

        let data = MockDataStore.getInstance().getData('preparationProjects') || []

        // 应用过滤器
        if (status) {
          data = data.filter((item: any) => item.status === status)
        }
        if (storeType) {
          data = data.filter((item: any) => item.storeType === storeType)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 获取筹备项目详情
      http.get(`${this.config.baseUrl}/preparation/projects/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const data = MockDataStore.getInstance().getData('preparationProjects') || []
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('筹备项目不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item))
      }),

      // 创建筹备项目
      http.post(`${this.config.baseUrl}/preparation/projects`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newProject = {
          ...body,
          id: MockUtils.generateId(),
          status: 'planning',
          progress: 0,
          milestones: [
            { name: '筹备启动', status: 'completed', completedAt: new Date().toISOString() },
            { name: '施工许可', status: 'pending', completedAt: null },
            { name: '工程施工', status: 'pending', completedAt: null },
            { name: '验收确认', status: 'pending', completedAt: null },
            { name: '门店交付', status: 'pending', completedAt: null }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('preparationProjects', newProject)

        return HttpResponse.json(MockResponse.success(newProject, '筹备项目创建成功'))
      }),

      // 更新筹备项目
      http.put(`${this.config.baseUrl}/preparation/projects/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData(
          'preparationProjects',
          id as string,
          body
        )

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('筹备项目不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 获取筹备统计
      http.get(`${this.config.baseUrl}/preparation/stats`, async () => {
        await MockUtils.delay()

        const data = MockDataStore.getInstance().getData('preparationProjects') || []

        const stats = {
          total: data.length,
          byStatus: {
            planning: data.filter((item: any) => item.status === 'planning').length,
            construction: data.filter((item: any) => item.status === 'construction').length,
            acceptance: data.filter((item: any) => item.status === 'acceptance').length,
            delivered: data.filter((item: any) => item.status === 'delivered').length,
            delayed: data.filter((item: any) => item.status === 'delayed').length
          },
          averageProgress: data.reduce((sum: number, item: any) => sum + item.progress, 0) / data.length,
          onTimeRate: Math.floor(Math.random() * 20) + 80, // 80-100%
          delayedCount: data.filter((item: any) => item.status === 'delayed').length,
          urgentCount: data.filter((item: any) => {
            const dueDate = new Date(item.expectedDeliveryDate)
            const now = new Date()
            const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            return diffDays <= 7 && diffDays > 0
          }).length
        }

        return HttpResponse.json(MockResponse.success(stats))
      }),

      // 获取工程管理数据
      http.get(`${this.config.baseUrl}/preparation/engineering`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const projectId = url.searchParams.get('projectId')

        let engineeringData = []
        
        if (projectId) {
          // 返回特定项目的工程数据
          engineeringData = [
            {
              id: MockUtils.generateId(),
              projectId,
              type: 'construction',
              name: '主体施工',
              status: 'in_progress',
              progress: 65,
              startDate: '2024-08-01',
              expectedEndDate: '2024-09-15',
              actualEndDate: null,
              contractor: '建设工程有限公司',
              cost: 150000,
              milestones: [
                { name: '基础施工', status: 'completed', completedAt: '2024-08-10' },
                { name: '主体建设', status: 'in_progress', completedAt: null },
                { name: '装修施工', status: 'pending', completedAt: null }
              ]
            }
          ]
        } else {
          engineeringData = MockDataStore.getInstance().getData('engineeringProjects') || []
        }

        return HttpResponse.json(MockResponse.success(engineeringData))
      }),

      // 获取验收管理数据
      http.get(`${this.config.baseUrl}/preparation/acceptance`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const projectId = url.searchParams.get('projectId')

        const acceptanceData = [
          {
            id: MockUtils.generateId(),
            projectId: projectId || MockUtils.generateId(),
            type: 'construction',
            name: '施工验收',
            status: 'pending',
            scheduledDate: '2024-09-20',
            actualDate: null,
            inspector: '张工程师',
            checklist: [
              { item: '结构安全检查', status: 'pending', result: null },
              { item: '电气系统检查', status: 'pending', result: null },
              { item: '消防设施检查', status: 'pending', result: null },
              { item: '环境卫生检查', status: 'pending', result: null }
            ]
          }
        ]

        return HttpResponse.json(MockResponse.success(acceptanceData))
      }),

      // 获取设备管理数据
      http.get(`${this.config.baseUrl}/preparation/equipment`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const projectId = url.searchParams.get('projectId')

        const equipmentData = [
          {
            id: MockUtils.generateId(),
            projectId: projectId || MockUtils.generateId(),
            name: '厨房设备套装',
            category: 'kitchen',
            status: 'ordered',
            quantity: 1,
            unitPrice: 50000,
            totalPrice: 50000,
            supplier: '厨具设备有限公司',
            expectedDelivery: '2024-09-10',
            actualDelivery: null,
            installationDate: null,
            warranty: 24
          },
          {
            id: MockUtils.generateId(),
            projectId: projectId || MockUtils.generateId(),
            name: '收银系统',
            category: 'pos',
            status: 'delivered',
            quantity: 2,
            unitPrice: 3000,
            totalPrice: 6000,
            supplier: '科技设备有限公司',
            expectedDelivery: '2024-08-25',
            actualDelivery: '2024-08-23',
            installationDate: '2024-08-25',
            warranty: 12
          }
        ]

        return HttpResponse.json(MockResponse.success(equipmentData))
      })
    ]
  }
}

export const preparationHandlers = new PreparationMockHandler().getHandlers()