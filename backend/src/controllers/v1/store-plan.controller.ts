/**
 * 开店计划管理控制器
 * 提供完整的CRUD操作、状态管理、统计分析和数据导出功能
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { storePlanService } from '@/services/business/store-plan.service.js';
import { logger } from '@/utils/logger.js';
import { 
  createStorePlanSchema,
  updateStorePlanSchema,
  storePlanQuerySchema,
  statusChangeSchema,
  batchOperationSchema,
  statisticsQuerySchema,
  exportSchema,
  idParamSchema,
  type CreateStorePlanData,
  type UpdateStorePlanData,
  type StorePlanQuery,
  type StatusChangeData,
  type BatchOperationData,
  type StatisticsQuery,
  type ExportData,
  type IdParam,
} from '@/types/storePlan.js';
import { BadRequestError } from '@/utils/errors.js';

// 扩展FastifyRequest类型以包含用户信息
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      username: string;
      name: string;
      roles: string[];
      permissions: string[];
    };
  }
}

export const storePlanController = {
  /**
   * 获取开店计划列表
   * GET /api/v1/store-plans
   */
  async getList(
    request: FastifyRequest<{ Querystring: StorePlanQuery }>,
    reply: FastifyReply
  ) {
    try {
      // 验证查询参数
      const validatedQuery = storePlanQuerySchema.parse(request.query);
      
      const result = await storePlanService.getList(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: result,
        message: '获取开店计划列表成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get store plan list:', error);
      throw error;
    }
  },

  /**
   * 获取开店计划详情
   * GET /api/v1/store-plans/:id
   */
  async getById(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      // 验证参数
      const { id } = idParamSchema.parse(request.params);
      
      const storePlan = await storePlanService.getById(id);

      reply.send({
        success: true,
        code: 200,
        data: {
          storePlan,
        },
        message: '获取开店计划详情成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get store plan by id:', error);
      throw error;
    }
  },

  /**
   * 创建开店计划
   * POST /api/v1/store-plans
   */
  async create(
    request: FastifyRequest<{ Body: CreateStorePlanData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证请求体
      const validatedData = createStorePlanSchema.parse(request.body);
      
      const storePlan = await storePlanService.create(validatedData, request.user.id);

      logger.info(`Store plan created: ${storePlan.id} by user ${request.user.username}`);

      reply.status(201).send({
        success: true,
        code: 201,
        data: {
          storePlan,
        },
        message: '创建开店计划成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create store plan:', error);
      throw error;
    }
  },

  /**
   * 更新开店计划
   * PUT /api/v1/store-plans/:id
   */
  async update(
    request: FastifyRequest<{ Params: IdParam; Body: UpdateStorePlanData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数和请求体
      const { id } = idParamSchema.parse(request.params);
      const validatedData = updateStorePlanSchema.parse(request.body);

      const storePlan = await storePlanService.update(id, validatedData, request.user.id);

      logger.info(`Store plan updated: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: {
          storePlan,
        },
        message: '更新开店计划成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update store plan:', error);
      throw error;
    }
  },

  /**
   * 删除开店计划
   * DELETE /api/v1/store-plans/:id
   */
  async delete(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数
      const { id } = idParamSchema.parse(request.params);

      await storePlanService.delete(id, request.user.id);

      logger.info(`Store plan deleted: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        message: '删除开店计划成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete store plan:', error);
      throw error;
    }
  },

  /**
   * 提交计划（草稿→待审批）
   * POST /api/v1/store-plans/:id/submit
   */
  async submit(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);

      const storePlan = await storePlanService.changeStatus(
        id,
        { status: 'SUBMITTED' },
        request.user.id
      );

      logger.info(`Store plan submitted: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storePlan },
        message: '提交开店计划成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to submit store plan:', error);
      throw error;
    }
  },

  /**
   * 审批通过计划
   * POST /api/v1/store-plans/:id/approve
   */
  async approve(
    request: FastifyRequest<{ Params: IdParam; Body: Partial<StatusChangeData> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const statusData = statusChangeSchema.parse({
        status: 'APPROVED',
        approver: request.user.name,
        ...request.body,
      });

      const storePlan = await storePlanService.changeStatus(id, statusData, request.user.id);

      logger.info(`Store plan approved: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storePlan },
        message: '审批开店计划成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to approve store plan:', error);
      throw error;
    }
  },

  /**
   * 拒绝计划
   * POST /api/v1/store-plans/:id/reject
   */
  async reject(
    request: FastifyRequest<{ Params: IdParam; Body: Partial<StatusChangeData> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const statusData = statusChangeSchema.parse({
        status: 'REJECTED',
        approver: request.user.name,
        ...request.body,
      });

      const storePlan = await storePlanService.changeStatus(id, statusData, request.user.id);

      logger.info(`Store plan rejected: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storePlan },
        message: '拒绝开店计划成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to reject store plan:', error);
      throw error;
    }
  },

  /**
   * 开始执行计划
   * POST /api/v1/store-plans/:id/execute
   */
  async execute(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);

      const storePlan = await storePlanService.changeStatus(
        id,
        { status: 'IN_PROGRESS' },
        request.user.id
      );

      logger.info(`Store plan execution started: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storePlan },
        message: '开始执行开店计划成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to execute store plan:', error);
      throw error;
    }
  },

  /**
   * 批量操作
   * POST /api/v1/store-plans/batch
   */
  async batchOperation(
    request: FastifyRequest<{ Body: BatchOperationData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const validatedData = batchOperationSchema.parse(request.body);

      const results = await storePlanService.batchOperation(validatedData, request.user.id);

      logger.info(`Batch operation ${validatedData.action} completed by user ${request.user.username}: ${results.success} success, ${results.failed} failed`);

      reply.send({
        success: true,
        code: 200,
        data: results,
        message: `批量${validatedData.action}操作完成`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to perform batch operation:', error);
      throw error;
    }
  },

  /**
   * 获取统计数据
   * GET /api/v1/store-plans/statistics
   */
  async getStatistics(
    request: FastifyRequest<{ Querystring: StatisticsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const validatedQuery = statisticsQuerySchema.parse(request.query);
      
      const statistics = await storePlanService.getStatistics(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: statistics,
        message: '获取统计数据成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get statistics:', error);
      throw error;
    }
  },

  /**
   * 获取进度数据
   * GET /api/v1/store-plans/progress
   */
  async getProgress(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const progress = await storePlanService.getProgress();

      reply.send({
        success: true,
        code: 200,
        data: progress,
        message: '获取进度数据成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get progress:', error);
      throw error;
    }
  },

  /**
   * 获取汇总信息
   * GET /api/v1/store-plans/summary
   */
  async getSummary(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const summary = await storePlanService.getSummary();

      reply.send({
        success: true,
        code: 200,
        data: summary,
        message: '获取汇总信息成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get summary:', error);
      throw error;
    }
  },

  /**
   * 导出数据
   * POST /api/v1/store-plans/export
   */
  async exportData(
    request: FastifyRequest<{ Body: ExportData }>,
    reply: FastifyReply
  ) {
    try {
      const validatedData = exportSchema.parse(request.body);
      
      const exportResult = await storePlanService.exportData(validatedData);

      logger.info(`Store plans exported by user ${request.user?.username || 'anonymous'}: ${exportResult.filename}`);

      reply
        .header('Content-Type', exportResult.contentType)
        .header('Content-Disposition', `attachment; filename="${encodeURIComponent(exportResult.filename)}"`)
        .header('Access-Control-Expose-Headers', 'Content-Disposition')
        .send(exportResult.buffer);

    } catch (error) {
      logger.error('Failed to export store plans:', error);
      throw error;
    }
  },
};