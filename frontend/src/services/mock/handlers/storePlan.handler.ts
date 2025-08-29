/**
 * 开店计划Mock处理器
 */
import { rest } from 'msw'
import { 
  API_BASE_URL, 
  HTTP_STATUS, 
  createCRUDHandlers,
  createSuccessResponse, 
  createErrorResponse,
  parsePaginationParams,
  parseQueryParams,
  filterByKeyword,
  filterByDateRange,
  mockDelay,
} from './base.handler'
import { mockStorePlans } from '../mockData'
import { createMockStorePlan, generateStorePlanStats } from '../factories/storePlan.factory'
import type { StorePlan, CreateStorePlanDto, UpdateStorePlanDto } from '../../types/business'

// 创建开店计划
function createStorePlan(data: Partial<CreateStorePlanDto>): StorePlan {
  const newPlan = createMockStorePlan()
  
  // 使用提交的数据覆盖mock数据
  return {
    ...newPlan,
    ...data,
    id: newPlan.id, // 保持自动生成的ID
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as StorePlan
}

// 更新开店计划
function updateStorePlan(id: string, data: Partial<UpdateStorePlanDto>): StorePlan | null {
  const index = mockStorePlans.findIndex(plan => plan.id === id)
  if (index === -1) return null

  const updatedPlan = {
    ...mockStorePlans[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  mockStorePlans[index] = updatedPlan
  return updatedPlan
}

// 搜索开店计划
function searchStorePlans(keyword: string, plans: StorePlan[]): StorePlan[] {
  return filterByKeyword(plans, keyword, ['name', 'region'])
}

// 基础CRUD处理器
const crudHandlers = createCRUDHandlers('/store-plans', mockStorePlans, {
  createFn: createStorePlan,
  updateFn: updateStorePlan,
  searchFn: searchStorePlans,
})

// 自定义处理器
export const storePlanHandlers = [
  ...crudHandlers,

  // GET /store-plans/stats - 获取开店计划统计
  rest.get(`${API_BASE_URL}/store-plans/stats`, async (req, res, ctx) => {
    try {
      await mockDelay()
      
      const url = new URL(req.url)
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')
      
      let filteredPlans = mockStorePlans
      if (startDate || endDate) {
        filteredPlans = filterByDateRange(mockStorePlans, startDate || undefined, endDate || undefined)
      }

      const stats = generateStorePlanStats(filteredPlans)
      
      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse(stats))
      )
    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('获取统计数据失败'))
      )
    }
  }),

  // GET /store-plans/search - 高级搜索
  rest.get(`${API_BASE_URL}/store-plans/search`, async (req, res, ctx) => {
    try {
      await mockDelay()
      
      const url = new URL(req.url)
      const queryParams = parseQueryParams(url)
      const { page, pageSize } = parsePaginationParams(url)
      
      let filteredPlans = mockStorePlans

      // 按状态过滤
      if (queryParams.status) {
        filteredPlans = filteredPlans.filter(plan => plan.status === queryParams.status)
      }

      // 按类型过滤
      if (queryParams.type) {
        filteredPlans = filteredPlans.filter(plan => plan.type === queryParams.type)
      }

      // 按优先级过滤
      if (queryParams.priority) {
        filteredPlans = filteredPlans.filter(plan => plan.priority === queryParams.priority)
      }

      // 按区域过滤
      if (queryParams.regionId) {
        filteredPlans = filteredPlans.filter(plan => plan.region.id === queryParams.regionId)
      }

      // 按创建者过滤
      if (queryParams.createdBy) {
        filteredPlans = filteredPlans.filter(plan => plan.createdBy === queryParams.createdBy)
      }

      // 按日期范围过滤
      if (queryParams.startDate || queryParams.endDate) {
        filteredPlans = filterByDateRange(filteredPlans, queryParams.startDate, queryParams.endDate)
      }

      // 按关键词过滤
      if (queryParams.keyword) {
        filteredPlans = searchStorePlans(queryParams.keyword, filteredPlans)
      }

      // 分页
      const totalCount = filteredPlans.length
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedPlans = filteredPlans.slice(startIndex, endIndex)

      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse({
          data: paginatedPlans,
          pagination: {
            current: page,
            pageSize,
            total: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          }
        }))
      )
    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('搜索失败'))
      )
    }
  }),

  // POST /store-plans/:id/approve - 审批开店计划
  rest.post(`${API_BASE_URL}/store-plans/:id/approve`, async (req, res, ctx) => {
    try {
      await mockDelay()
      
      const { id } = req.params
      const { comment, approved } = await req.json()
      
      const plan = mockStorePlans.find(p => p.id === id)
      if (!plan) {
        return res(
          ctx.status(HTTP_STATUS.NOT_FOUND),
          ctx.json(createErrorResponse('开店计划不存在'))
        )
      }

      // 更新状态
      plan.status = approved ? 'approved' : 'draft'
      plan.updatedAt = new Date().toISOString()

      // 添加审批记录（简化处理）
      plan.approvalHistory.push({
        id: crypto.randomUUID(),
        nodeId: crypto.randomUUID(),
        nodeName: '管理员审批',
        approver: 'current-user-id',
        approverName: '当前用户',
        action: approved ? 'approve' : 'reject',
        comment,
        processedAt: new Date().toISOString(),
      })

      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse(plan, approved ? '审批通过' : '审批拒绝'))
      )
    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('审批操作失败'))
      )
    }
  }),

  // POST /store-plans/:id/milestones - 添加里程碑
  rest.post(`${API_BASE_URL}/store-plans/:id/milestones`, async (req, res, ctx) => {
    try {
      await mockDelay()
      
      const { id } = req.params
      const milestoneData = await req.json()
      
      const plan = mockStorePlans.find(p => p.id === id)
      if (!plan) {
        return res(
          ctx.status(HTTP_STATUS.NOT_FOUND),
          ctx.json(createErrorResponse('开店计划不存在'))
        )
      }

      const newMilestone = {
        id: crypto.randomUUID(),
        ...milestoneData,
      }

      plan.milestones.push(newMilestone)
      plan.updatedAt = new Date().toISOString()

      return res(
        ctx.status(HTTP_STATUS.CREATED),
        ctx.json(createSuccessResponse(newMilestone, '里程碑添加成功'))
      )
    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('添加里程碑失败'))
      )
    }
  }),

  // PUT /store-plans/:id/milestones/:milestoneId - 更新里程碑
  rest.put(`${API_BASE_URL}/store-plans/:id/milestones/:milestoneId`, async (req, res, ctx) => {
    try {
      await mockDelay()
      
      const { id, milestoneId } = req.params
      const milestoneData = await req.json()
      
      const plan = mockStorePlans.find(p => p.id === id)
      if (!plan) {
        return res(
          ctx.status(HTTP_STATUS.NOT_FOUND),
          ctx.json(createErrorResponse('开店计划不存在'))
        )
      }

      const milestoneIndex = plan.milestones.findIndex(m => m.id === milestoneId)
      if (milestoneIndex === -1) {
        return res(
          ctx.status(HTTP_STATUS.NOT_FOUND),
          ctx.json(createErrorResponse('里程碑不存在'))
        )
      }

      plan.milestones[milestoneIndex] = {
        ...plan.milestones[milestoneIndex],
        ...milestoneData,
      }
      plan.updatedAt = new Date().toISOString()

      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse(plan.milestones[milestoneIndex], '里程碑更新成功'))
      )
    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('更新里程碑失败'))
      )
    }
  }),

  // GET /store-plans/export - 导出开店计划
  rest.get(`${API_BASE_URL}/store-plans/export`, async (req, res, ctx) => {
    try {
      await mockDelay(1000, 2000) // 导出操作较慢
      
      // 模拟返回导出文件URL
      const exportUrl = `${API_BASE_URL}/files/exports/store-plans-${Date.now()}.xlsx`
      
      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse({ 
          exportUrl,
          filename: `开店计划导出_${new Date().toISOString().split('T')[0]}.xlsx`
        }, '导出成功'))
      )
    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('导出失败'))
      )
    }
  }),
]