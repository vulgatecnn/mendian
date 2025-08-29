/**
 * 拓店管理控制器
 * 处理候选点位管理、跟进记录、数据分析等业务逻辑
 */
import { FastifyRequest, FastifyReply } from 'fastify'
import { expansionService } from '../services/business/expansion.service.js'
import {
  CandidateLocationQuery,
  CreateCandidateLocationData,
  UpdateCandidateLocationData,
  StatusChangeData,
  ScoreUpdateData,
  FollowUpRecordQuery,
  CreateFollowUpRecordData,
  UpdateFollowUpRecordData,
  BatchOperationData,
  MapQuery,
  StatisticsQuery,
  ExportData
} from '../types/expansion.js'
import { ApiResponse } from '../types/common.js'
import { logger } from '../utils/logger.js'

export const expansionController = {
  // ===============================
  // 候选点位管理API
  // ===============================

  /**
   * 获取候选点位列表
   */
  async getCandidateLocationList(
    request: FastifyRequest<{ Querystring: CandidateLocationQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = request.query
      const result = await expansionService.getCandidateLocationList(query)
      
      return reply.send({
        success: true,
        data: result,
        message: '获取候选点位列表成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get candidate location list failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取候选点位列表失败'
      })
    }
  },

  /**
   * 根据ID获取候选点位详情
   */
  async getCandidateLocationById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const result = await expansionService.getCandidateLocationById(id)
      
      return reply.send({
        success: true,
        data: result,
        message: '获取候选点位详情成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get candidate location by id failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取候选点位详情失败'
      })
    }
  },

  /**
   * 创建候选点位
   */
  async createCandidateLocation(
    request: FastifyRequest<{ Body: CreateCandidateLocationData }>,
    reply: FastifyReply
  ) {
    try {
      const data = request.body
      const operatorId = (request as any).user?.id || 'system' // 从认证中间件获取用户ID
      
      const result = await expansionService.createCandidateLocation(data, operatorId)
      
      return reply.status(201).send({
        success: true,
        data: result,
        message: '创建候选点位成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Create candidate location failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '创建候选点位失败'
      })
    }
  },

  /**
   * 更新候选点位
   */
  async updateCandidateLocation(
    request: FastifyRequest<{ 
      Params: { id: string }
      Body: UpdateCandidateLocationData 
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const data = request.body
      const operatorId = (request as any).user?.id || 'system'
      
      const result = await expansionService.updateCandidateLocation(id, data, operatorId)
      
      return reply.send({
        success: true,
        data: result,
        message: '更新候选点位成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Update candidate location failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '更新候选点位失败'
      })
    }
  },

  /**
   * 删除候选点位
   */
  async deleteCandidateLocation(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const operatorId = (request as any).user?.id || 'system'
      
      await expansionService.deleteCandidateLocation(id, operatorId)
      
      return reply.send({
        success: true,
        message: '删除候选点位成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Delete candidate location failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '删除候选点位失败'
      })
    }
  },

  /**
   * 变更候选点位状态
   */
  async changeCandidateLocationStatus(
    request: FastifyRequest<{ 
      Params: { id: string }
      Body: StatusChangeData 
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const statusData = request.body
      const operatorId = (request as any).user?.id || 'system'
      
      const result = await expansionService.changeCandidateLocationStatus(id, statusData, operatorId)
      
      return reply.send({
        success: true,
        data: result,
        message: '状态变更成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Change candidate location status failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '状态变更失败'
      })
    }
  },

  /**
   * 更新候选点位评分
   */
  async updateCandidateLocationScore(
    request: FastifyRequest<{ 
      Params: { id: string }
      Body: ScoreUpdateData 
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const scoreData = request.body
      const operatorId = (request as any).user?.id || 'system'
      
      const result = await expansionService.updateCandidateLocationScore(id, scoreData, operatorId)
      
      return reply.send({
        success: true,
        data: result,
        message: '评分更新成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Update candidate location score failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '评分更新失败'
      })
    }
  },

  // ===============================
  // 跟进记录管理API
  // ===============================

  /**
   * 获取跟进记录列表
   */
  async getFollowUpRecordList(
    request: FastifyRequest<{ Querystring: FollowUpRecordQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = request.query
      const result = await expansionService.getFollowUpRecordList(query)
      
      return reply.send({
        success: true,
        data: result,
        message: '获取跟进记录列表成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get follow-up record list failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取跟进记录列表失败'
      })
    }
  },

  /**
   * 根据ID获取跟进记录详情
   */
  async getFollowUpRecordById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const result = await expansionService.getFollowUpRecordById(id)
      
      return reply.send({
        success: true,
        data: result,
        message: '获取跟进记录详情成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get follow-up record by id failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取跟进记录详情失败'
      })
    }
  },

  /**
   * 创建跟进记录
   */
  async createFollowUpRecord(
    request: FastifyRequest<{ Body: CreateFollowUpRecordData }>,
    reply: FastifyReply
  ) {
    try {
      const data = request.body
      const createdById = (request as any).user?.id || 'system'
      
      const result = await expansionService.createFollowUpRecord(data, createdById)
      
      return reply.status(201).send({
        success: true,
        data: result,
        message: '创建跟进记录成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Create follow-up record failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '创建跟进记录失败'
      })
    }
  },

  /**
   * 更新跟进记录
   */
  async updateFollowUpRecord(
    request: FastifyRequest<{ 
      Params: { id: string }
      Body: UpdateFollowUpRecordData 
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const data = request.body
      const operatorId = (request as any).user?.id || 'system'
      
      const result = await expansionService.updateFollowUpRecord(id, data, operatorId)
      
      return reply.send({
        success: true,
        data: result,
        message: '更新跟进记录成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Update follow-up record failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '更新跟进记录失败'
      })
    }
  },

  /**
   * 删除跟进记录
   */
  async deleteFollowUpRecord(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const operatorId = (request as any).user?.id || 'system'
      
      await expansionService.deleteFollowUpRecord(id, operatorId)
      
      return reply.send({
        success: true,
        message: '删除跟进记录成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Delete follow-up record failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '删除跟进记录失败'
      })
    }
  },

  // ===============================
  // 批量操作API
  // ===============================

  /**
   * 批量操作候选点位
   */
  async batchOperationCandidateLocations(
    request: FastifyRequest<{ Body: BatchOperationData }>,
    reply: FastifyReply
  ) {
    try {
      const batchData = request.body
      const operatorId = (request as any).user?.id || 'system'
      
      const result = await expansionService.batchOperationCandidateLocations(batchData, operatorId)
      
      return reply.send({
        success: true,
        data: result,
        message: '批量操作完成'
      } as ApiResponse)
    } catch (error) {
      logger.error('Batch operation failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '批量操作失败'
      })
    }
  },

  // ===============================
  // 地图数据API
  // ===============================

  /**
   * 获取地图数据
   */
  async getMapData(
    request: FastifyRequest<{ Querystring: MapQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = request.query
      const result = await expansionService.getMapData(query)
      
      return reply.send({
        success: true,
        data: result,
        message: '获取地图数据成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get map data failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取地图数据失败'
      })
    }
  },

  // ===============================
  // 统计分析API
  // ===============================

  /**
   * 获取拓店统计数据
   */
  async getExpansionStatistics(
    request: FastifyRequest<{ Querystring: StatisticsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = request.query
      const result = await expansionService.getExpansionStatistics(query)
      
      return reply.send({
        success: true,
        data: result,
        message: '获取统计数据成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get expansion statistics failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取统计数据失败'
      })
    }
  },

  /**
   * 获取跟进统计数据
   */
  async getFollowUpStatistics(
    request: FastifyRequest<{ Querystring: StatisticsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = request.query
      const result = await expansionService.getFollowUpStatistics(query)
      
      return reply.send({
        success: true,
        data: result,
        message: '获取跟进统计数据成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get follow-up statistics failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取跟进统计数据失败'
      })
    }
  },

  /**
   * 获取拓店进度数据
   */
  async getExpansionProgress(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const result = await expansionService.getExpansionProgress()
      
      return reply.send({
        success: true,
        data: result,
        message: '获取拓店进度数据成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get expansion progress failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取拓店进度数据失败'
      })
    }
  },

  /**
   * 获取拓店仪表板数据
   */
  async getExpansionDashboard(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const result = await expansionService.getExpansionDashboard()
      
      return reply.send({
        success: true,
        data: result,
        message: '获取仪表板数据成功'
      } as ApiResponse)
    } catch (error) {
      logger.error('Get expansion dashboard failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '获取仪表板数据失败'
      })
    }
  },

  // ===============================
  // 数据导出API
  // ===============================

  /**
   * 导出候选点位数据
   */
  async exportCandidateLocationData(
    request: FastifyRequest<{ Body: ExportData }>,
    reply: FastifyReply
  ) {
    try {
      const exportData = request.body
      const result = await expansionService.exportCandidateLocationData(exportData)
      
      // 设置响应头
      reply.header('Content-Type', result.contentType)
      reply.header('Content-Disposition', `attachment; filename="${result.filename}"`)
      
      return reply.send(result.buffer)
    } catch (error) {
      logger.error('Export candidate location data failed:', error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : '导出数据失败'
      })
    }
  },

  // ===============================
  // 健康检查API
  // ===============================

  /**
   * 健康检查
   */
  async healthCheck(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'expansion-service'
      },
      message: '拓店管理服务运行正常'
    } as ApiResponse)
  }
}