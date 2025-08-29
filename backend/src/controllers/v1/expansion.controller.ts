/**
 * 拓店管理控制器
 * 候选点位管理、跟进记录管理、地图数据、统计分析和数据导出功能
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { expansionService } from '@/services/business/expansion.service.js';
import { logger } from '@/utils/logger.js';
import { 
  createCandidateLocationSchema,
  updateCandidateLocationSchema,
  candidateLocationQuerySchema,
  statusChangeSchema,
  scoreUpdateSchema,
  createFollowUpRecordSchema,
  updateFollowUpRecordSchema,
  followUpRecordQuerySchema,
  batchOperationSchema,
  mapQuerySchema,
  statisticsQuerySchema,
  exportSchema,
  idParamSchema,
  type CreateCandidateLocationData,
  type UpdateCandidateLocationData,
  type CandidateLocationQuery,
  type StatusChangeData,
  type ScoreUpdateData,
  type CreateFollowUpRecordData,
  type UpdateFollowUpRecordData,
  type FollowUpRecordQuery,
  type BatchOperationData,
  type MapQuery,
  type StatisticsQuery,
  type ExportData,
  type IdParam,
} from '@/types/expansion.js';
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

export const expansionController = {
  // ===============================
  // 候选点位管理
  // ===============================

  /**
   * 获取候选点位列表
   * GET /api/v1/candidate-locations
   */
  async getCandidateLocationList(
    request: FastifyRequest<{ Querystring: CandidateLocationQuery }>,
    reply: FastifyReply
  ) {
    try {
      // 验证查询参数
      const validatedQuery = candidateLocationQuerySchema.parse(request.query);
      
      const result = await expansionService.getCandidateLocationList(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: result,
        message: '获取候选点位列表成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get candidate location list:', error);
      throw error;
    }
  },

  /**
   * 获取候选点位详情
   * GET /api/v1/candidate-locations/:id
   */
  async getCandidateLocationById(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      // 验证参数
      const { id } = idParamSchema.parse(request.params);
      
      const candidateLocation = await expansionService.getCandidateLocationById(id);

      reply.send({
        success: true,
        code: 200,
        data: {
          candidateLocation,
        },
        message: '获取候选点位详情成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get candidate location by id:', error);
      throw error;
    }
  },

  /**
   * 创建候选点位
   * POST /api/v1/candidate-locations
   */
  async createCandidateLocation(
    request: FastifyRequest<{ Body: CreateCandidateLocationData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证请求体
      const validatedData = createCandidateLocationSchema.parse(request.body);
      
      const candidateLocation = await expansionService.createCandidateLocation(validatedData, request.user.id);

      logger.info(`Candidate location created: ${candidateLocation.id} by user ${request.user.username}`);

      reply.status(201).send({
        success: true,
        code: 201,
        data: {
          candidateLocation,
        },
        message: '创建候选点位成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create candidate location:', error);
      throw error;
    }
  },

  /**
   * 更新候选点位
   * PUT /api/v1/candidate-locations/:id
   */
  async updateCandidateLocation(
    request: FastifyRequest<{ Params: IdParam; Body: UpdateCandidateLocationData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数和请求体
      const { id } = idParamSchema.parse(request.params);
      const validatedData = updateCandidateLocationSchema.parse(request.body);

      const candidateLocation = await expansionService.updateCandidateLocation(id, validatedData, request.user.id);

      logger.info(`Candidate location updated: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: {
          candidateLocation,
        },
        message: '更新候选点位成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update candidate location:', error);
      throw error;
    }
  },

  /**
   * 删除候选点位
   * DELETE /api/v1/candidate-locations/:id
   */
  async deleteCandidateLocation(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数
      const { id } = idParamSchema.parse(request.params);

      await expansionService.deleteCandidateLocation(id, request.user.id);

      logger.info(`Candidate location deleted: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        message: '删除候选点位成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete candidate location:', error);
      throw error;
    }
  },

  /**
   * 变更候选点位状态
   * POST /api/v1/candidate-locations/:id/status
   */
  async changeCandidateLocationStatus(
    request: FastifyRequest<{ Params: IdParam; Body: StatusChangeData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const statusData = statusChangeSchema.parse(request.body);

      const candidateLocation = await expansionService.changeCandidateLocationStatus(id, statusData, request.user.id);

      logger.info(`Candidate location status changed: ${id} to ${statusData.status} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { candidateLocation },
        message: '候选点位状态变更成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to change candidate location status:', error);
      throw error;
    }
  },

  /**
   * 更新候选点位评分
   * POST /api/v1/candidate-locations/:id/score
   */
  async updateCandidateLocationScore(
    request: FastifyRequest<{ Params: IdParam; Body: ScoreUpdateData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const scoreData = scoreUpdateSchema.parse(request.body);

      const candidateLocation = await expansionService.updateCandidateLocationScore(id, scoreData, request.user.id);

      logger.info(`Candidate location score updated: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { candidateLocation },
        message: '候选点位评分更新成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update candidate location score:', error);
      throw error;
    }
  },

  // ===============================
  // 跟进记录管理
  // ===============================

  /**
   * 获取跟进记录列表
   * GET /api/v1/follow-up-records
   */
  async getFollowUpRecordList(
    request: FastifyRequest<{ Querystring: FollowUpRecordQuery }>,
    reply: FastifyReply
  ) {
    try {
      // 验证查询参数
      const validatedQuery = followUpRecordQuerySchema.parse(request.query);
      
      const result = await expansionService.getFollowUpRecordList(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: result,
        message: '获取跟进记录列表成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get follow-up record list:', error);
      throw error;
    }
  },

  /**
   * 获取指定候选点位的跟进记录时间线
   * GET /api/v1/candidate-locations/:id/timeline
   */
  async getCandidateLocationTimeline(
    request: FastifyRequest<{ Params: IdParam; Querystring: Partial<FollowUpRecordQuery> }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = idParamSchema.parse(request.params);
      
      // 构建查询参数，限制为指定候选点位
      const timelineQuery = {
        page: 1,
        limit: 100,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
        candidateLocationId: id,
        ...request.query
      };

      const validatedQuery = followUpRecordQuerySchema.parse(timelineQuery);
      const result = await expansionService.getFollowUpRecordList(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: result,
        message: '获取候选点位时间线成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get candidate location timeline:', error);
      throw error;
    }
  },

  /**
   * 获取跟进记录详情
   * GET /api/v1/follow-up-records/:id
   */
  async getFollowUpRecordById(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      // 验证参数
      const { id } = idParamSchema.parse(request.params);
      
      const followUpRecord = await expansionService.getFollowUpRecordById(id);

      reply.send({
        success: true,
        code: 200,
        data: {
          followUpRecord,
        },
        message: '获取跟进记录详情成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get follow-up record by id:', error);
      throw error;
    }
  },

  /**
   * 创建跟进记录
   * POST /api/v1/follow-up-records
   */
  async createFollowUpRecord(
    request: FastifyRequest<{ Body: CreateFollowUpRecordData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证请求体
      const validatedData = createFollowUpRecordSchema.parse(request.body);
      
      const followUpRecord = await expansionService.createFollowUpRecord(validatedData, request.user.id);

      logger.info(`Follow-up record created: ${followUpRecord.id} by user ${request.user.username}`);

      reply.status(201).send({
        success: true,
        code: 201,
        data: {
          followUpRecord,
        },
        message: '创建跟进记录成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create follow-up record:', error);
      throw error;
    }
  },

  /**
   * 更新跟进记录
   * PUT /api/v1/follow-up-records/:id
   */
  async updateFollowUpRecord(
    request: FastifyRequest<{ Params: IdParam; Body: UpdateFollowUpRecordData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数和请求体
      const { id } = idParamSchema.parse(request.params);
      const validatedData = updateFollowUpRecordSchema.parse(request.body);

      const followUpRecord = await expansionService.updateFollowUpRecord(id, validatedData, request.user.id);

      logger.info(`Follow-up record updated: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: {
          followUpRecord,
        },
        message: '更新跟进记录成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update follow-up record:', error);
      throw error;
    }
  },

  /**
   * 删除跟进记录
   * DELETE /api/v1/follow-up-records/:id
   */
  async deleteFollowUpRecord(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数
      const { id } = idParamSchema.parse(request.params);

      await expansionService.deleteFollowUpRecord(id, request.user.id);

      logger.info(`Follow-up record deleted: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        message: '删除跟进记录成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete follow-up record:', error);
      throw error;
    }
  },

  // ===============================
  // 批量操作
  // ===============================

  /**
   * 批量操作候选点位
   * POST /api/v1/candidate-locations/batch
   */
  async batchOperationCandidateLocations(
    request: FastifyRequest<{ Body: BatchOperationData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const validatedData = batchOperationSchema.parse(request.body);

      const results = await expansionService.batchOperationCandidateLocations(validatedData, request.user.id);

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

  // ===============================
  // 地图数据服务
  // ===============================

  /**
   * 获取地图数据
   * GET /api/v1/expansion/map-data
   */
  async getMapData(
    request: FastifyRequest<{ Querystring: MapQuery }>,
    reply: FastifyReply
  ) {
    try {
      const validatedQuery = mapQuerySchema.parse(request.query);
      
      const mapData = await expansionService.getMapData(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: mapData,
        message: '获取地图数据成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get map data:', error);
      throw error;
    }
  },

  // ===============================
  // 统计分析服务
  // ===============================

  /**
   * 获取拓店统计数据
   * GET /api/v1/expansion/statistics
   */
  async getExpansionStatistics(
    request: FastifyRequest<{ Querystring: StatisticsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const validatedQuery = statisticsQuerySchema.parse(request.query);
      
      const statistics = await expansionService.getExpansionStatistics(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: statistics,
        message: '获取拓店统计数据成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get expansion statistics:', error);
      throw error;
    }
  },

  /**
   * 获取跟进统计数据
   * GET /api/v1/expansion/follow-up-statistics
   */
  async getFollowUpStatistics(
    request: FastifyRequest<{ Querystring: StatisticsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const validatedQuery = statisticsQuerySchema.parse(request.query);
      
      const statistics = await expansionService.getFollowUpStatistics(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: statistics,
        message: '获取跟进统计数据成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get follow-up statistics:', error);
      throw error;
    }
  },

  /**
   * 获取拓店进度数据
   * GET /api/v1/expansion/progress
   */
  async getExpansionProgress(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const progress = await expansionService.getExpansionProgress();

      reply.send({
        success: true,
        code: 200,
        data: progress,
        message: '获取拓店进度数据成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get expansion progress:', error);
      throw error;
    }
  },

  /**
   * 获取拓店仪表板数据
   * GET /api/v1/expansion/dashboard
   */
  async getExpansionDashboard(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const dashboard = await expansionService.getExpansionDashboard();

      reply.send({
        success: true,
        code: 200,
        data: dashboard,
        message: '获取拓店仪表板数据成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get expansion dashboard:', error);
      throw error;
    }
  },

  // ===============================
  // 数据导出服务
  // ===============================

  /**
   * 导出候选点位数据
   * POST /api/v1/expansion/export
   */
  async exportCandidateLocationData(
    request: FastifyRequest<{ Body: ExportData }>,
    reply: FastifyReply
  ) {
    try {
      const validatedData = exportSchema.parse(request.body);
      
      const exportResult = await expansionService.exportCandidateLocationData(validatedData);

      logger.info(`Candidate locations exported by user ${request.user?.username || 'anonymous'}: ${exportResult.filename}`);

      reply
        .header('Content-Type', exportResult.contentType)
        .header('Content-Disposition', `attachment; filename="${encodeURIComponent(exportResult.filename)}"`)
        .header('Access-Control-Expose-Headers', 'Content-Disposition')
        .send(exportResult.buffer);

    } catch (error) {
      logger.error('Failed to export candidate locations:', error);
      throw error;
    }
  },

  // ===============================
  // 快速操作端点
  // ===============================

  /**
   * 快速标记候选点位为跟进中
   * POST /api/v1/candidate-locations/:id/start-following
   */
  async startFollowing(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);

      const candidateLocation = await expansionService.changeCandidateLocationStatus(
        id,
        { status: 'FOLLOWING' },
        request.user.id
      );

      logger.info(`Candidate location started following: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { candidateLocation },
        message: '开始跟进候选点位成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to start following candidate location:', error);
      throw error;
    }
  },

  /**
   * 快速标记候选点位为商务谈判
   * POST /api/v1/candidate-locations/:id/start-negotiation
   */
  async startNegotiation(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);

      const candidateLocation = await expansionService.changeCandidateLocationStatus(
        id,
        { status: 'NEGOTIATING' },
        request.user.id
      );

      logger.info(`Candidate location started negotiation: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { candidateLocation },
        message: '开始商务谈判成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to start negotiation for candidate location:', error);
      throw error;
    }
  },

  /**
   * 快速签约候选点位
   * POST /api/v1/candidate-locations/:id/sign-contract
   */
  async signContract(
    request: FastifyRequest<{ Params: IdParam; Body: Partial<StatusChangeData> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const statusData = {
        status: 'CONTRACTED' as const,
        reason: '签约成功',
        ...request.body,
      };

      const candidateLocation = await expansionService.changeCandidateLocationStatus(id, statusData, request.user.id);

      logger.info(`Candidate location signed contract: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { candidateLocation },
        message: '候选点位签约成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to sign contract for candidate location:', error);
      throw error;
    }
  },

  /**
   * 快速完成跟进记录
   * POST /api/v1/follow-up-records/:id/complete
   */
  async completeFollowUpRecord(
    request: FastifyRequest<{ Params: IdParam; Body: Partial<UpdateFollowUpRecordData> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const updateData = {
        status: 'COMPLETED' as const,
        actualFollowUpDate: new Date().toISOString(),
        ...request.body,
      };

      const followUpRecord = await expansionService.updateFollowUpRecord(id, updateData, request.user.id);

      logger.info(`Follow-up record completed: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { followUpRecord },
        message: '跟进记录标记完成成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to complete follow-up record:', error);
      throw error;
    }
  },

  /**
   * 获取我的待办跟进任务
   * GET /api/v1/expansion/my-tasks
   */
  async getMyTasks(
    request: FastifyRequest<{ Querystring: Partial<FollowUpRecordQuery> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 构建查询参数，限制为当前用户的任务
      const taskQuery = {
        page: 1,
        limit: 50,
        sortBy: 'nextFollowUpDate' as const,
        sortOrder: 'asc' as const,
        assigneeId: request.user.id,
        status: 'PENDING' as const,
        ...request.query
      };

      const validatedQuery = followUpRecordQuerySchema.parse(taskQuery);
      const result = await expansionService.getFollowUpRecordList(validatedQuery);

      reply.send({
        success: true,
        code: 200,
        data: result,
        message: '获取我的待办任务成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get my tasks:', error);
      throw error;
    }
  },
};