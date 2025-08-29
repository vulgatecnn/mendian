// 门店运营管理Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'

export class OperationMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 获取付款项列表
      http.get(`${this.config.baseUrl}/operation/payments`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const status = url.searchParams.get('status')
        const type = url.searchParams.get('type')
        const storeId = url.searchParams.get('storeId')

        let data = MockDataStore.getInstance().getData('paymentItems') || []

        // 应用过滤器
        if (status) {
          data = data.filter((item: any) => item.status === status)
        }
        if (type) {
          data = data.filter((item: any) => item.type === type)
        }
        if (storeId) {
          data = data.filter((item: any) => item.storeId === storeId)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 获取付款项详情
      http.get(`${this.config.baseUrl}/operation/payments/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const data = MockDataStore.getInstance().getData('paymentItems') || []
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('付款项不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item))
      }),

      // 创建付款项
      http.post(`${this.config.baseUrl}/operation/payments`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newPayment = {
          ...body,
          id: MockUtils.generateId(),
          code: `PAY${Math.random().toString().substr(2, 8)}`,
          status: 'pending',
          actualAmount: 0,
          paidAmount: 0,
          remainingAmount: body.plannedAmount || 0,
          paymentRecords: [],
          createdBy: MockUtils.generateId(),
          createdByName: MockUtils.generateChineseName(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('paymentItems', newPayment)

        return HttpResponse.json(MockResponse.success(newPayment, '付款项创建成功'))
      }),

      // 更新付款项
      http.put(`${this.config.baseUrl}/operation/payments/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData('paymentItems', id as string, body)

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('付款项不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 执行付款
      http.post(`${this.config.baseUrl}/operation/payments/:id/pay`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()
        const { amount, paymentMethod, remark, receipt } = body

        const data = MockDataStore.getInstance().getData('paymentItems') || []
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('付款项不存在', 404), { status: 404 })
        }

        // 添加付款记录
        const paymentRecord = {
          id: MockUtils.generateId(),
          amount: amount,
          paymentMethod: paymentMethod,
          remark: remark || '',
          receipt: receipt || null,
          paymentDate: new Date().toISOString(),
          operator: MockUtils.generateId(),
          operatorName: MockUtils.generateChineseName()
        }

        item.paymentRecords = item.paymentRecords || []
        item.paymentRecords.push(paymentRecord)

        // 更新付款状态
        item.paidAmount = (item.paidAmount || 0) + amount
        item.remainingAmount = (item.plannedAmount || 0) - item.paidAmount

        if (item.remainingAmount <= 0) {
          item.status = 'completed'
          item.completedAt = new Date().toISOString()
        } else if (item.paidAmount > 0) {
          item.status = 'partial'
        }

        item.updatedAt = new Date().toISOString()

        MockDataStore.getInstance().updateData('paymentItems', id as string, item)

        return HttpResponse.json(MockResponse.success(item, '付款记录添加成功'))
      }),

      // 获取资产列表
      http.get(`${this.config.baseUrl}/operation/assets`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const category = url.searchParams.get('category')
        const status = url.searchParams.get('status')
        const storeId = url.searchParams.get('storeId')

        let data = MockDataStore.getInstance().getData('assets') || []

        // 应用过滤器
        if (category) {
          data = data.filter((item: any) => item.category === category)
        }
        if (status) {
          data = data.filter((item: any) => item.status === status)
        }
        if (storeId) {
          data = data.filter((item: any) => item.storeId === storeId)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 创建资产
      http.post(`${this.config.baseUrl}/operation/assets`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newAsset = {
          ...body,
          id: MockUtils.generateId(),
          code: `ASSET${Math.random().toString().substr(2, 6)}`,
          status: 'normal',
          currentValue: body.originalValue || 0,
          depreciationRecords: [],
          maintenanceRecords: [],
          createdBy: MockUtils.generateId(),
          createdByName: MockUtils.generateChineseName(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('assets', newAsset)

        return HttpResponse.json(MockResponse.success(newAsset, '资产创建成功'))
      }),

      // 资产维护记录
      http.post(`${this.config.baseUrl}/operation/assets/:id/maintenance`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const data = MockDataStore.getInstance().getData('assets') || []
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('资产不存在', 404), { status: 404 })
        }

        const maintenanceRecord = {
          id: MockUtils.generateId(),
          type: body.type,
          description: body.description,
          cost: body.cost || 0,
          maintainer: body.maintainer || '',
          maintenanceDate: body.maintenanceDate || new Date().toISOString(),
          nextMaintenanceDate: body.nextMaintenanceDate || null,
          createdBy: MockUtils.generateId(),
          createdByName: MockUtils.generateChineseName(),
          createdAt: new Date().toISOString()
        }

        item.maintenanceRecords = item.maintenanceRecords || []
        item.maintenanceRecords.push(maintenanceRecord)
        item.lastMaintenanceDate = maintenanceRecord.maintenanceDate
        item.updatedAt = new Date().toISOString()

        MockDataStore.getInstance().updateData('assets', id as string, item)

        return HttpResponse.json(MockResponse.success(item, '维护记录添加成功'))
      }),

      // 获取运营统计
      http.get(`${this.config.baseUrl}/operation/stats`, async () => {
        await MockUtils.delay()

        const paymentData = MockDataStore.getInstance().getData('paymentItems') || []
        const assetData = MockDataStore.getInstance().getData('assets') || []

        const stats = {
          payments: {
            total: paymentData.length,
            byStatus: {
              pending: paymentData.filter((item: any) => item.status === 'pending').length,
              partial: paymentData.filter((item: any) => item.status === 'partial').length,
              completed: paymentData.filter((item: any) => item.status === 'completed').length,
              overdue: paymentData.filter((item: any) => {
                if (item.status !== 'completed' && item.dueDate) {
                  return new Date(item.dueDate) < new Date()
                }
                return false
              }).length
            },
            byType: {
              rent: paymentData.filter((item: any) => item.type === 'rent').length,
              utilities: paymentData.filter((item: any) => item.type === 'utilities').length,
              supplies: paymentData.filter((item: any) => item.type === 'supplies').length,
              maintenance: paymentData.filter((item: any) => item.type === 'maintenance').length,
              other: paymentData.filter((item: any) => item.type === 'other').length
            },
            totalAmount: paymentData.reduce((sum: number, item: any) => sum + (item.plannedAmount || 0), 0),
            paidAmount: paymentData.reduce((sum: number, item: any) => sum + (item.paidAmount || 0), 0),
            remainingAmount: paymentData.reduce((sum: number, item: any) => sum + (item.remainingAmount || 0), 0)
          },
          assets: {
            total: assetData.length,
            byCategory: {
              equipment: assetData.filter((item: any) => item.category === 'equipment').length,
              furniture: assetData.filter((item: any) => item.category === 'furniture').length,
              electronics: assetData.filter((item: any) => item.category === 'electronics').length,
              fixtures: assetData.filter((item: any) => item.category === 'fixtures').length,
              other: assetData.filter((item: any) => item.category === 'other').length
            },
            byStatus: {
              normal: assetData.filter((item: any) => item.status === 'normal').length,
              maintenance: assetData.filter((item: any) => item.status === 'maintenance').length,
              repair: assetData.filter((item: any) => item.status === 'repair').length,
              scrapped: assetData.filter((item: any) => item.status === 'scrapped').length
            },
            totalValue: assetData.reduce((sum: number, item: any) => sum + (item.currentValue || 0), 0),
            originalValue: assetData.reduce((sum: number, item: any) => sum + (item.originalValue || 0), 0),
            depreciationRate: assetData.length > 0 ? 
              (assetData.reduce((sum: number, item: any) => sum + (item.originalValue || 0), 0) - 
               assetData.reduce((sum: number, item: any) => sum + (item.currentValue || 0), 0)) / 
              assetData.reduce((sum: number, item: any) => sum + (item.originalValue || 0), 0) : 0
          },
          timeline: Array.from({ length: 12 }, (_, i) => ({
            month: `2024-${String(i + 1).padStart(2, '0')}`,
            payments: Math.floor(Math.random() * 50000) + 20000,
            maintenance: Math.floor(Math.random() * 10000) + 2000
          }))
        }

        return HttpResponse.json(MockResponse.success(stats))
      }),

      // 获取运营选项数据
      http.get(`${this.config.baseUrl}/operation/options`, async () => {
        await MockUtils.delay()

        const storeFiles = MockDataStore.getInstance().getData('storeFiles') || []

        const options = {
          stores: storeFiles.map((store: any) => ({
            id: store.id,
            name: store.name,
            code: store.code,
            status: store.status
          })),
          paymentTypes: [
            { value: 'rent', label: '租金' },
            { value: 'utilities', label: '水电费' },
            { value: 'supplies', label: '物料采购' },
            { value: 'maintenance', label: '维护费用' },
            { value: 'insurance', label: '保险费' },
            { value: 'tax', label: '税费' },
            { value: 'other', label: '其他' }
          ],
          paymentMethods: [
            { value: 'bank_transfer', label: '银行转账' },
            { value: 'cash', label: '现金' },
            { value: 'check', label: '支票' },
            { value: 'online_payment', label: '在线支付' },
            { value: 'other', label: '其他' }
          ],
          paymentStatuses: [
            { value: 'pending', label: '待付款' },
            { value: 'partial', label: '部分付款' },
            { value: 'completed', label: '已完成' },
            { value: 'overdue', label: '已逾期' }
          ],
          assetCategories: [
            { value: 'equipment', label: '设备' },
            { value: 'furniture', label: '家具' },
            { value: 'electronics', label: '电子设备' },
            { value: 'fixtures', label: '固定装置' },
            { value: 'vehicles', label: '车辆' },
            { value: 'other', label: '其他' }
          ],
          assetStatuses: [
            { value: 'normal', label: '正常使用' },
            { value: 'maintenance', label: '维护中' },
            { value: 'repair', label: '维修中' },
            { value: 'idle', label: '闲置' },
            { value: 'scrapped', label: '已报废' }
          ],
          maintenanceTypes: [
            { value: 'preventive', label: '预防性维护' },
            { value: 'corrective', label: '修复性维护' },
            { value: 'emergency', label: '紧急维修' },
            { value: 'upgrade', label: '升级改造' }
          ]
        }

        return HttpResponse.json(MockResponse.success(options))
      })
    ]
  }
}

export const operationHandlers = new OperationMockHandler().getHandlers()