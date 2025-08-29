/**
 * 开店计划管理路由
 * 提供完整的REST API端点和权限控制
 */
import type { FastifyInstance } from 'fastify';
import { storePlanController } from '@/controllers/v1/store-plan.controller.js';

const storePlanRoutes = async (fastify: FastifyInstance): Promise<void> => {
  
  // ==================== 基础CRUD操作 ====================
  
  /**
   * 获取开店计划列表
   * GET /api/v1/store-plans
   */
  fastify.get('/', {
    schema: {
      tags: ['store-plan'],
      summary: '获取开店计划列表',
      description: '分页获取开店计划列表，支持多维度筛选和排序',
      querystring: {
        type: 'object',
        properties: {
          // 分页参数
          page: { type: 'number', minimum: 1, default: 1, description: '页码' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20, description: '每页条数' },
          
          // 排序参数
          sortBy: { 
            type: 'string', 
            enum: ['year', 'quarter', 'plannedCount', 'completedCount', 'budget', 'createdAt', 'updatedAt'],
            default: 'createdAt',
            description: '排序字段'
          },
          sortOrder: { 
            type: 'string', 
            enum: ['asc', 'desc'], 
            default: 'desc',
            description: '排序方向'
          },
          
          // 筛选参数
          year: { type: 'number', minimum: 2020, maximum: 2030, description: '年份' },
          quarter: { type: 'number', minimum: 1, maximum: 4, description: '季度' },
          regionId: { type: 'string', description: '地区ID' },
          entityId: { type: 'string', description: '公司主体ID' },
          storeType: { 
            type: 'string', 
            enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'],
            description: '门店类型'
          },
          status: { 
            type: 'string', 
            enum: ['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            description: '计划状态'
          },
          priority: {
            type: 'string',
            enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
            description: '优先级'
          },
          createdById: { type: 'string', description: '创建人ID' },
          budgetMin: { type: 'number', minimum: 0, description: '最小预算' },
          budgetMax: { type: 'number', minimum: 0, description: '最大预算' },
          startDate: { type: 'string', format: 'date-time', description: '开始日期' },
          endDate: { type: 'string', format: 'date-time', description: '结束日期' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'number' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    totalPages: { type: 'number' },
                    hasNext: { type: 'boolean' },
                    hasPrev: { type: 'boolean' },
                  },
                },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:read'] })
    ],
  }, storePlanController.getList);

  /**
   * 获取开店计划详情
   * GET /api/v1/store-plans/:id
   */
  fastify.get('/:id', {
    schema: {
      tags: ['store-plan'],
      summary: '获取开店计划详情',
      description: '根据ID获取开店计划的详细信息，包括关联数据',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '开店计划ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'number' },
            data: {
              type: 'object',
              properties: {
                storePlan: { type: 'object', description: '开店计划详细信息' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:read'] })
    ],
  }, storePlanController.getById);

  /**
   * 创建开店计划
   * POST /api/v1/store-plans
   */
  fastify.post('/', {
    schema: {
      tags: ['store-plan'],
      summary: '创建开店计划',
      description: '创建新的开店计划，支持完整的计划信息',
      body: {
        type: 'object',
        required: ['title', 'year', 'regionId', 'entityId', 'storeType', 'plannedCount'],
        properties: {
          planCode: { type: 'string', maxLength: 50, description: '计划编号（可选，自动生成）' },
          title: { type: 'string', minLength: 2, maxLength: 200, description: '计划标题' },
          year: { type: 'number', minimum: 2020, maximum: 2030, description: '年份' },
          quarter: { type: 'number', minimum: 1, maximum: 4, description: '季度（可选）' },
          regionId: { type: 'string', description: '地区ID' },
          entityId: { type: 'string', description: '公司主体ID' },
          storeType: { 
            type: 'string', 
            enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'],
            description: '门店类型'
          },
          plannedCount: { type: 'number', minimum: 1, description: '计划开店数量' },
          budget: { type: 'number', minimum: 0, description: '预算金额' },
          actualBudget: { type: 'number', minimum: 0, description: '实际预算' },
          priority: { 
            type: 'string', 
            enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
            default: 'MEDIUM',
            description: '优先级'
          },
          startDate: { type: 'string', format: 'date-time', description: '开始日期' },
          endDate: { type: 'string', format: 'date-time', description: '结束日期' },
          description: { type: 'string', maxLength: 1000, description: '计划描述' },
          remark: { type: 'string', maxLength: 1000, description: '备注' },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:create'] })
    ],
  }, storePlanController.create);

  /**
   * 更新开店计划
   * PUT /api/v1/store-plans/:id
   */
  fastify.put('/:id', {
    schema: {
      tags: ['store-plan'],
      summary: '更新开店计划',
      description: '更新现有开店计划的信息',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '开店计划ID' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 2, maxLength: 200, description: '计划标题' },
          quarter: { type: 'number', minimum: 1, maximum: 4, description: '季度' },
          storeType: { 
            type: 'string', 
            enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'],
            description: '门店类型'
          },
          plannedCount: { type: 'number', minimum: 1, description: '计划开店数量' },
          budget: { type: 'number', minimum: 0, description: '预算金额' },
          actualBudget: { type: 'number', minimum: 0, description: '实际预算' },
          priority: { 
            type: 'string', 
            enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
            description: '优先级'
          },
          startDate: { type: 'string', format: 'date-time', description: '开始日期' },
          endDate: { type: 'string', format: 'date-time', description: '结束日期' },
          description: { type: 'string', maxLength: 1000, description: '计划描述' },
          remark: { type: 'string', maxLength: 1000, description: '备注' },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:update'] })
    ],
  }, storePlanController.update);

  /**
   * 删除开店计划
   * DELETE /api/v1/store-plans/:id
   */
  fastify.delete('/:id', {
    schema: {
      tags: ['store-plan'],
      summary: '删除开店计划',
      description: '软删除开店计划（标记为已取消状态）',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '开店计划ID' },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:delete'] })
    ],
  }, storePlanController.delete);

  // ==================== 状态管理操作 ====================

  /**
   * 提交计划审批
   * POST /api/v1/store-plans/:id/submit
   */
  fastify.post('/:id/submit', {
    schema: {
      tags: ['store-plan'],
      summary: '提交计划审批',
      description: '将草稿状态的计划提交审批',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '开店计划ID' },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:submit'] })
    ],
  }, storePlanController.submit);

  /**
   * 审批通过计划
   * POST /api/v1/store-plans/:id/approve
   */
  fastify.post('/:id/approve', {
    schema: {
      tags: ['store-plan'],
      summary: '审批通过计划',
      description: '审批通过开店计划',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '开店计划ID' },
        },
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500, description: '审批原因' },
          comments: { type: 'string', maxLength: 1000, description: '审批意见' },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:approve'] })
    ],
  }, storePlanController.approve);

  /**
   * 拒绝计划
   * POST /api/v1/store-plans/:id/reject
   */
  fastify.post('/:id/reject', {
    schema: {
      tags: ['store-plan'],
      summary: '拒绝计划',
      description: '拒绝开店计划申请',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '开店计划ID' },
        },
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500, description: '拒绝原因' },
          comments: { type: 'string', maxLength: 1000, description: '拒绝意见' },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:approve'] })
    ],
  }, storePlanController.reject);

  /**
   * 开始执行计划
   * POST /api/v1/store-plans/:id/execute
   */
  fastify.post('/:id/execute', {
    schema: {
      tags: ['store-plan'],
      summary: '开始执行计划',
      description: '将已审批的计划设置为执行状态',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '开店计划ID' },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:execute'] })
    ],
  }, storePlanController.execute);

  // ==================== 批量操作 ====================

  /**
   * 批量操作
   * POST /api/v1/store-plans/batch
   */
  fastify.post('/batch', {
    schema: {
      tags: ['store-plan'],
      summary: '批量操作',
      description: '对多个开店计划执行批量操作',
      body: {
        type: 'object',
        required: ['ids', 'action'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            description: '开店计划ID列表'
          },
          action: {
            type: 'string',
            enum: ['delete', 'approve', 'reject', 'execute'],
            description: '操作类型'
          },
          reason: {
            type: 'string',
            maxLength: 500,
            description: '操作原因'
          },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:batch-operation'] })
    ],
  }, storePlanController.batchOperation);

  // ==================== 数据统计分析 ====================

  /**
   * 获取统计数据
   * GET /api/v1/store-plans/statistics
   */
  fastify.get('/statistics', {
    schema: {
      tags: ['store-plan'],
      summary: '获取统计数据',
      description: '获取开店计划的综合统计分析数据',
      querystring: {
        type: 'object',
        properties: {
          year: { type: 'number', minimum: 2020, maximum: 2030, description: '年份' },
          quarter: { type: 'number', minimum: 1, maximum: 4, description: '季度' },
          regionIds: {
            type: 'array',
            items: { type: 'string' },
            description: '地区ID列表'
          },
          entityIds: {
            type: 'array',
            items: { type: 'string' },
            description: '公司主体ID列表'
          },
          storeTypes: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP']
            },
            description: '门店类型列表'
          },
          groupBy: {
            type: 'string',
            enum: ['region', 'entity', 'storeType', 'month'],
            description: '分组方式'
          },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:statistics'] })
    ],
  }, storePlanController.getStatistics);

  /**
   * 获取进度数据
   * GET /api/v1/store-plans/progress
   */
  fastify.get('/progress', {
    schema: {
      tags: ['store-plan'],
      summary: '获取进度数据',
      description: '获取开店计划的执行进度和延期情况',
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:progress'] })
    ],
  }, storePlanController.getProgress);

  /**
   * 获取汇总信息
   * GET /api/v1/store-plans/summary
   */
  fastify.get('/summary', {
    schema: {
      tags: ['store-plan'],
      summary: '获取汇总信息',
      description: '获取开店计划的关键指标汇总信息',
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:summary'] })
    ],
  }, storePlanController.getSummary);

  // ==================== 数据导出 ====================

  /**
   * 导出数据
   * POST /api/v1/store-plans/export
   */
  fastify.post('/export', {
    schema: {
      tags: ['store-plan'],
      summary: '导出数据',
      description: '导出开店计划数据为Excel或CSV格式',
      body: {
        type: 'object',
        required: ['format'],
        properties: {
          format: {
            type: 'string',
            enum: ['xlsx', 'csv'],
            description: '导出格式'
          },
          filters: {
            type: 'object',
            properties: {
              year: { type: 'number', minimum: 2020, maximum: 2030 },
              quarter: { type: 'number', minimum: 1, maximum: 4 },
              regionId: { type: 'string' },
              entityId: { type: 'string' },
              storeType: { 
                type: 'string', 
                enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP']
              },
              status: { 
                type: 'string', 
                enum: ['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
              },
            },
            description: '过滤条件'
          },
          columns: {
            type: 'array',
            items: { type: 'string' },
            description: '要导出的列（可选，默认导出所有列）'
          },
        },
      },
    },
    preHandler: [
      fastify.authenticate,
      fastify.authorize({ permissions: ['store-plan:export'] })
    ],
  }, storePlanController.exportData);
};

export default storePlanRoutes;