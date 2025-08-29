// 门店档案管理Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'

export class StoreFilesMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 获取门店档案列表
      http.get(`${this.config.baseUrl}/store-files`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const status = url.searchParams.get('status')
        const region = url.searchParams.get('region')
        const keyword = url.searchParams.get('keyword')

        let data = MockDataStore.getInstance().getData('storeFiles') || []

        // 应用过滤器
        if (status) {
          data = data.filter((item: any) => item.status === status)
        }
        if (region) {
          data = data.filter((item: any) => item.location.region === region)
        }
        if (keyword) {
          data = data.filter((item: any) => 
            item.name.includes(keyword) || 
            item.code.includes(keyword) ||
            item.location.address.includes(keyword)
          )
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 获取门店档案详情
      http.get(`${this.config.baseUrl}/store-files/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const data = MockDataStore.getInstance().getData('storeFiles') || []
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('门店档案不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item))
      }),

      // 创建门店档案
      http.post(`${this.config.baseUrl}/store-files`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newStore = {
          ...body,
          id: MockUtils.generateId(),
          code: `STORE${Math.random().toString().substr(2, 6)}`,
          status: 'active',
          operatingStatus: 'normal',
          openingDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: {
            businessLicense: {
              number: `营业执照${Math.random().toString().substr(2, 8)}`,
              validFrom: '2024-01-01',
              validTo: '2034-01-01',
              status: 'valid',
              fileUrl: null
            },
            foodPermit: {
              number: `食品许可${Math.random().toString().substr(2, 8)}`,
              validFrom: '2024-01-01',
              validTo: '2027-01-01',
              status: 'valid',
              fileUrl: null
            },
            firePermit: {
              number: `消防许可${Math.random().toString().substr(2, 8)}`,
              validFrom: '2024-01-01',
              validTo: '2029-01-01',
              status: 'valid',
              fileUrl: null
            }
          },
          performance: {
            monthlyRevenue: Math.floor(Math.random() * 100000) + 50000,
            dailyAvgCustomers: Math.floor(Math.random() * 200) + 100,
            avgTransactionValue: Math.floor(Math.random() * 50) + 30,
            monthlyGrowthRate: (Math.random() * 0.3 - 0.1).toFixed(2)
          }
        }

        MockDataStore.getInstance().addData('storeFiles', newStore)

        return HttpResponse.json(MockResponse.success(newStore, '门店档案创建成功'))
      }),

      // 更新门店档案
      http.put(`${this.config.baseUrl}/store-files/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData(
          'storeFiles',
          id as string,
          body
        )

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('门店档案不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 删除门店档案
      http.delete(`${this.config.baseUrl}/store-files/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const deleted = MockDataStore.getInstance().deleteData('storeFiles', id as string)

        if (!deleted) {
          return HttpResponse.json(MockResponse.error('门店档案不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(null, '删除成功'))
      }),

      // 获取门店统计
      http.get(`${this.config.baseUrl}/store-files/stats`, async () => {
        await MockUtils.delay()

        const data = MockDataStore.getInstance().getData('storeFiles') || []

        const stats = {
          total: data.length,
          byStatus: {
            active: data.filter((item: any) => item.status === 'active').length,
            inactive: data.filter((item: any) => item.status === 'inactive').length,
            closed: data.filter((item: any) => item.status === 'closed').length
          },
          byType: {
            direct: data.filter((item: any) => item.storeType === 'direct').length,
            franchise: data.filter((item: any) => item.storeType === 'franchise').length,
            joint_venture: data.filter((item: any) => item.storeType === 'joint_venture').length
          },
          byRegion: data.reduce(
            (acc: any, item: any) => {
              const regionName = item.location.region || '其他'
              acc[regionName] = (acc[regionName] || 0) + 1
              return acc
            },
            {}
          ),
          performance: {
            totalRevenue: data.reduce((sum: number, item: any) => sum + item.performance.monthlyRevenue, 0),
            avgRevenue: data.reduce((sum: number, item: any) => sum + item.performance.monthlyRevenue, 0) / data.length,
            totalCustomers: data.reduce((sum: number, item: any) => sum + item.performance.dailyAvgCustomers, 0),
            avgGrowthRate: (data.reduce((sum: number, item: any) => sum + parseFloat(item.performance.monthlyGrowthRate), 0) / data.length).toFixed(2)
          },
          documents: {
            expiringSoon: data.filter((item: any) => {
              const oneMonthFromNow = new Date()
              oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
              
              return Object.values(item.documents).some((doc: any) => {
                const validTo = new Date(doc.validTo)
                return validTo <= oneMonthFromNow
              })
            }).length,
            expired: data.filter((item: any) => {
              const now = new Date()
              
              return Object.values(item.documents).some((doc: any) => {
                const validTo = new Date(doc.validTo)
                return validTo < now
              })
            }).length
          }
        }

        return HttpResponse.json(MockResponse.success(stats))
      }),

      // 获取门店历史记录
      http.get(`${this.config.baseUrl}/store-files/:id/history`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const historyData = [
          {
            id: MockUtils.generateId(),
            storeId: id,
            type: 'status_change',
            title: '门店状态变更',
            description: '门店状态从"筹备中"变更为"正常营业"',
            operator: '张经理',
            operatorId: MockUtils.generateId(),
            createdAt: '2024-08-15T10:00:00Z',
            metadata: {
              from: 'preparing',
              to: 'active'
            }
          },
          {
            id: MockUtils.generateId(),
            storeId: id,
            type: 'document_update',
            title: '证件更新',
            description: '更新了食品经营许可证信息',
            operator: '李助理',
            operatorId: MockUtils.generateId(),
            createdAt: '2024-08-10T14:30:00Z',
            metadata: {
              documentType: 'foodPermit'
            }
          },
          {
            id: MockUtils.generateId(),
            storeId: id,
            type: 'performance_update',
            title: '业绩数据更新',
            description: '更新了7月份营业数据',
            operator: '财务部',
            operatorId: MockUtils.generateId(),
            createdAt: '2024-08-01T09:00:00Z',
            metadata: {
              month: '2024-07',
              revenue: 85000
            }
          }
        ]

        return HttpResponse.json(MockResponse.success(historyData))
      }),

      // 批量操作门店档案
      http.post(`${this.config.baseUrl}/store-files/batch`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const { action, ids } = body

        let message = ''
        let successCount = 0

        switch (action) {
          case 'activate':
            ids.forEach((id: string) => {
              MockDataStore.getInstance().updateData('storeFiles', id, { status: 'active' })
              successCount++
            })
            message = `成功激活${successCount}个门店`
            break
          
          case 'deactivate':
            ids.forEach((id: string) => {
              MockDataStore.getInstance().updateData('storeFiles', id, { status: 'inactive' })
              successCount++
            })
            message = `成功停用${successCount}个门店`
            break
          
          case 'delete':
            ids.forEach((id: string) => {
              MockDataStore.getInstance().deleteData('storeFiles', id)
              successCount++
            })
            message = `成功删除${successCount}个门店`
            break
          
          default:
            return HttpResponse.json(MockResponse.error('不支持的批量操作', 400), { status: 400 })
        }

        return HttpResponse.json(MockResponse.success({ successCount }, message))
      })
    ]
  }
}

export const storeFilesHandlers = new StoreFilesMockHandler().getHandlers()