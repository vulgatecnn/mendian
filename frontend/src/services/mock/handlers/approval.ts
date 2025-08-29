// 审批中心Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'

export class ApprovalMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 获取审批列表
      http.get(`${this.config.baseUrl}/approval/list`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const status = url.searchParams.get('status')
        const type = url.searchParams.get('type')
        const priority = url.searchParams.get('priority')

        let data = MockDataStore.getInstance().getData('approvalItems') || []

        // 应用过滤器
        if (status) {
          data = data.filter((item: any) => item.status === status)
        }
        if (type) {
          data = data.filter((item: any) => item.type === type)
        }
        if (priority) {
          data = data.filter((item: any) => item.priority === priority)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 获取审批详情
      http.get(`${this.config.baseUrl}/approval/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const data = MockDataStore.getInstance().getData('approvalItems') || []
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('审批项不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item))
      }),

      // 创建审批申请
      http.post(`${this.config.baseUrl}/approval/submit`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()
        const newApproval = {
          ...body,
          id: MockUtils.generateId(),
          code: `APPROVAL${Math.random().toString().substr(2, 8)}`,
          status: 'pending',
          priority: body.priority || 'medium',
          submittedAt: new Date().toISOString(),
          submittedBy: MockUtils.generateId(),
          submittedByName: MockUtils.generateChineseName(),
          approvalFlow: [
            {
              id: MockUtils.generateId(),
              stepName: '部门经理审批',
              approver: MockUtils.generateId(),
              approverName: MockUtils.generateChineseName(),
              status: 'pending',
              order: 1,
              requiredApprovals: 1,
              actualApprovals: 0,
              createdAt: new Date().toISOString(),
              deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2天后
            },
            {
              id: MockUtils.generateId(),
              stepName: '总监审批',
              approver: MockUtils.generateId(),
              approverName: MockUtils.generateChineseName(),
              status: 'waiting',
              order: 2,
              requiredApprovals: 1,
              actualApprovals: 0,
              createdAt: null,
              deadline: null
            }
          ],
          attachments: body.attachments || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('approvalItems', newApproval)

        return HttpResponse.json(MockResponse.success(newApproval, '审批申请提交成功'))
      }),

      // 处理审批
      http.post(`${this.config.baseUrl}/approval/:id/process`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()
        const { action, comment, stepId } = body

        const data = MockDataStore.getInstance().getData('approvalItems') || []
        const item = data.find((item: any) => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('审批项不存在', 404), { status: 404 })
        }

        const step = item.approvalFlow.find((step: any) => step.id === stepId)
        if (!step) {
          return HttpResponse.json(MockResponse.error('审批步骤不存在', 404), { status: 404 })
        }

        // 更新步骤状态
        step.status = action === 'approve' ? 'approved' : 'rejected'
        step.processedAt = new Date().toISOString()
        step.comment = comment
        step.processor = MockUtils.generateId()
        step.processorName = MockUtils.generateChineseName()

        if (action === 'approve') {
          step.actualApprovals = step.requiredApprovals

          // 检查是否所有步骤都已完成
          const allApproved = item.approvalFlow.every((s: any) => 
            s.order <= step.order ? s.status === 'approved' : true
          )

          if (allApproved) {
            // 激活下一个步骤或完成审批
            const nextStep = item.approvalFlow.find((s: any) => s.order === step.order + 1)
            if (nextStep) {
              nextStep.status = 'pending'
              nextStep.createdAt = new Date().toISOString()
              nextStep.deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
            } else {
              // 全部审批完成
              item.status = 'approved'
              item.completedAt = new Date().toISOString()
            }
          }
        } else {
          // 拒绝，整个审批流程结束
          item.status = 'rejected'
          item.completedAt = new Date().toISOString()
        }

        item.updatedAt = new Date().toISOString()

        MockDataStore.getInstance().updateData('approvalItems', id as string, item)

        return HttpResponse.json(MockResponse.success(item, '审批处理成功'))
      }),

      // 获取待审批列表（当前用户）
      http.get(`${this.config.baseUrl}/approval/pending`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

        const data = MockDataStore.getInstance().getData('approvalItems') || []
        
        // 过滤出待审批的项目（简化实现，实际应该根据当前用户）
        const pendingItems = data.filter((item: any) => 
          item.approvalFlow.some((step: any) => step.status === 'pending')
        )

        const paginatedData = MockUtils.paginate(pendingItems, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, pendingItems.length)
        )
      }),

      // 获取审批统计
      http.get(`${this.config.baseUrl}/approval/stats`, async () => {
        await MockUtils.delay()

        const data = MockDataStore.getInstance().getData('approvalItems') || []

        const stats = {
          total: data.length,
          byStatus: {
            pending: data.filter((item: any) => item.status === 'pending').length,
            approved: data.filter((item: any) => item.status === 'approved').length,
            rejected: data.filter((item: any) => item.status === 'rejected').length,
            cancelled: data.filter((item: any) => item.status === 'cancelled').length
          },
          byType: {
            store_report: data.filter((item: any) => item.type === 'store_report').length,
            license_application: data.filter((item: any) => item.type === 'license_application').length,
            price_comparison: data.filter((item: any) => item.type === 'price_comparison').length,
            contract_approval: data.filter((item: any) => item.type === 'contract_approval').length,
            budget_approval: data.filter((item: any) => item.type === 'budget_approval').length,
            supplier_approval: data.filter((item: any) => item.type === 'supplier_approval').length,
            other: data.filter((item: any) => item.type === 'other').length
          },
          byPriority: {
            high: data.filter((item: any) => item.priority === 'high').length,
            medium: data.filter((item: any) => item.priority === 'medium').length,
            low: data.filter((item: any) => item.priority === 'low').length
          },
          pendingByUser: [
            {
              userId: MockUtils.generateId(),
              userName: '张经理',
              count: Math.floor(Math.random() * 10) + 1
            },
            {
              userId: MockUtils.generateId(),
              userName: '李总监',
              count: Math.floor(Math.random() * 8) + 1
            },
            {
              userId: MockUtils.generateId(),
              userName: '王总',
              count: Math.floor(Math.random() * 5) + 1
            }
          ],
          avgProcessingTime: Math.floor(Math.random() * 48) + 24, // 24-72小时
          overdueCounts: data.filter((item: any) => {
            return item.approvalFlow.some((step: any) => {
              if (step.status === 'pending' && step.deadline) {
                return new Date(step.deadline) < new Date()
              }
              return false
            })
          }).length
        }

        return HttpResponse.json(MockResponse.success(stats))
      }),

      // 获取审批模板
      http.get(`${this.config.baseUrl}/approval/templates`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const type = url.searchParams.get('type')

        let templates = [
          {
            id: MockUtils.generateId(),
            name: '报店审批模板',
            type: 'store_report',
            description: '新开店铺报备审批流程',
            steps: [
              { name: '区域经理审批', required: true, order: 1 },
              { name: '运营总监审批', required: true, order: 2 },
              { name: '总经理审批', required: true, order: 3 }
            ],
            fields: [
              { name: 'storeName', label: '店铺名称', type: 'text', required: true },
              { name: 'location', label: '店铺位置', type: 'text', required: true },
              { name: 'area', label: '店铺面积', type: 'number', required: true },
              { name: 'rentCost', label: '租金成本', type: 'number', required: true }
            ],
            isActive: true,
            createdAt: '2024-01-15T08:00:00Z'
          },
          {
            id: MockUtils.generateId(),
            name: '执照办理审批模板',
            type: 'license_application',
            description: '各类执照办理审批流程',
            steps: [
              { name: '部门经理审批', required: true, order: 1 },
              { name: '法务审批', required: true, order: 2 },
              { name: '财务总监审批', required: true, order: 3 }
            ],
            fields: [
              { name: 'licenseType', label: '执照类型', type: 'select', required: true },
              { name: 'applicationReason', label: '申请原因', type: 'textarea', required: true },
              { name: 'urgencyLevel', label: '紧急程度', type: 'select', required: true }
            ],
            isActive: true,
            createdAt: '2024-01-20T10:00:00Z'
          },
          {
            id: MockUtils.generateId(),
            name: '比价审批模板',
            type: 'price_comparison',
            description: '供应商比价采购审批流程',
            steps: [
              { name: '采购经理审批', required: true, order: 1 },
              { name: '财务审批', required: true, order: 2 }
            ],
            fields: [
              { name: 'purchaseItem', label: '采购项目', type: 'text', required: true },
              { name: 'suppliers', label: '供应商信息', type: 'array', required: true },
              { name: 'totalAmount', label: '采购总额', type: 'number', required: true }
            ],
            isActive: true,
            createdAt: '2024-02-01T14:00:00Z'
          }
        ]

        if (type) {
          templates = templates.filter((template: any) => template.type === type)
        }

        return HttpResponse.json(MockResponse.success(templates))
      }),

      // 撤回审批
      http.post(`${this.config.baseUrl}/approval/:id/withdraw`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()
        const { reason } = body

        const item = MockDataStore.getInstance().updateData('approvalItems', id as string, {
          status: 'cancelled',
          withdrawnAt: new Date().toISOString(),
          withdrawReason: reason
        })

        if (!item) {
          return HttpResponse.json(MockResponse.error('审批项不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item, '审批已撤回'))
      })
    ]
  }
}

export const approvalHandlers = new ApprovalMockHandler().getHandlers()