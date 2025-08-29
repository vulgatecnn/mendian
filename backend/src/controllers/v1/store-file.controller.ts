/**
 * 门店档案管理控制器
 * 提供完整的CRUD操作、状态管理、统计分析和数据导出功能
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { storeFileService } from '@/services/business/store-file.service.js';
import { logger } from '@/utils/logger.js';
import { 
  createStoreFileSchema,
  updateStoreFileSchema,
  storeFileQuerySchema,
  statusChangeSchema,
  batchOperationSchema,
  statisticsQuerySchema,
  exportSchema,
  idParamSchema,
  type CreateStoreFileData,
  type UpdateStoreFileData,
  type StoreFileQuery,
  type StatusChangeData,
  type BatchOperationData,
  type StatisticsQuery,
  type ExportData,
  type IdParam,
} from '@/types/storeFile.js';
import { 
  BadRequestError, 
  NotFoundError, 
  ConflictError, 
  ForbiddenError,
  AppError 
} from '@/utils/errors.js';

// 统一的API响应格式
interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  data?: T;
  message: string;
  timestamp: string;
  errors?: string[];
}

// 错误响应处理辅助函数
const handleError = (error: any, reply: FastifyReply, defaultMessage: string = '操作失败') => {
  logger.error(defaultMessage, error);

  if (error instanceof AppError) {
    const statusCode = getStatusCodeFromError(error);
    return reply.status(statusCode).send({
      success: false,
      code: statusCode,
      message: error.message,
      timestamp: new Date().toISOString(),
      ...(error.details && { errors: Array.isArray(error.details) ? error.details : [error.details] })
    } as ApiResponse);
  }

  // Zod验证错误处理
  if (error.name === 'ZodError') {
    const validationErrors = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
    return reply.status(400).send({
      success: false,
      code: 400,
      message: '请求参数验证失败',
      timestamp: new Date().toISOString(),
      errors: validationErrors
    } as ApiResponse);
  }

  // Prisma错误处理
  if (error.name === 'PrismaClientKnownRequestError') {
    const { code, message } = error;
    switch (code) {
      case 'P2002':
        return reply.status(409).send({
          success: false,
          code: 409,
          message: '数据已存在，违反唯一约束',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      case 'P2025':
        return reply.status(404).send({
          success: false,
          code: 404,
          message: '记录未找到',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      default:
        return reply.status(500).send({
          success: false,
          code: 500,
          message: '数据库操作失败',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
    }
  }

  // 默认错误处理
  return reply.status(500).send({
    success: false,
    code: 500,
    message: defaultMessage,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
};

// 根据错误类型获取HTTP状态码
const getStatusCodeFromError = (error: AppError): number => {
  if (error instanceof BadRequestError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof ForbiddenError) return 403;
  return 500;
};

// 成功响应处理辅助函数
const sendSuccess = <T>(reply: FastifyReply, data: T, message: string, code: number = 200) => {
  reply.send({
    success: true,
    code,
    data,
    message,
    timestamp: new Date().toISOString(),
  } as ApiResponse<T>);
};

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

export const storeFileController = {
  /**
   * 获取门店档案列表
   * GET /api/v1/store-files
   */
  async getList(
    request: FastifyRequest<{ Querystring: StoreFileQuery }>,
    reply: FastifyReply
  ) {
    try {
      // 验证查询参数
      const validatedQuery = storeFileQuerySchema.parse(request.query);
      
      const result = await storeFileService.getList(validatedQuery);

      sendSuccess(reply, result, '获取门店档案列表成功');
    } catch (error) {
      handleError(error, reply, '获取门店档案列表失败');
    }
  },

  /**
   * 获取门店档案详情
   * GET /api/v1/store-files/:id
   */
  async getById(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      // 验证参数
      const { id } = idParamSchema.parse(request.params);
      
      const storeFile = await storeFileService.getById(id);

      sendSuccess(reply, { storeFile }, '获取门店档案详情成功');
    } catch (error) {
      handleError(error, reply, '获取门店档案详情失败');
    }
  },

  /**
   * 创建门店档案
   * POST /api/v1/store-files
   */
  async create(
    request: FastifyRequest<{ Body: CreateStoreFileData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证请求体
      const validatedData = createStoreFileSchema.parse(request.body);
      
      const storeFile = await storeFileService.create(validatedData, request.user.id);

      logger.info(`Store file created: ${storeFile.id} (${storeFile.storeCode}) by user ${request.user.username}`);

      reply.status(201).send({
        success: true,
        code: 201,
        data: {
          storeFile,
        },
        message: '创建门店档案成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create store file:', error);
      throw error;
    }
  },

  /**
   * 更新门店档案
   * PUT /api/v1/store-files/:id
   */
  async update(
    request: FastifyRequest<{ Params: IdParam; Body: UpdateStoreFileData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数和请求体
      const { id } = idParamSchema.parse(request.params);
      const validatedData = updateStoreFileSchema.parse(request.body);

      const storeFile = await storeFileService.update(id, validatedData, request.user.id);

      logger.info(`Store file updated: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: {
          storeFile,
        },
        message: '更新门店档案成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update store file:', error);
      throw error;
    }
  },

  /**
   * 删除门店档案
   * DELETE /api/v1/store-files/:id
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

      await storeFileService.delete(id, request.user.id);

      logger.info(`Store file deleted: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        message: '删除门店档案成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete store file:', error);
      throw error;
    }
  },

  /**
   * 更改门店状态
   * PUT /api/v1/store-files/:id/status
   */
  async changeStatus(
    request: FastifyRequest<{ Params: IdParam; Body: StatusChangeData }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      // 验证参数和请求体
      const { id } = idParamSchema.parse(request.params);
      const validatedData = statusChangeSchema.parse(request.body);

      const storeFile = await storeFileService.changeStatus(id, validatedData, request.user.id);

      logger.info(`Store file status changed: ${id} to ${validatedData.status} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storeFile },
        message: '更改门店状态成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to change store file status:', error);
      throw error;
    }
  },

  /**
   * 开业门店
   * POST /api/v1/store-files/:id/open
   */
  async openStore(
    request: FastifyRequest<{ Params: IdParam; Body: Partial<StatusChangeData> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const statusData = statusChangeSchema.parse({
        status: 'OPEN',
        operator: request.user.name,
        ...request.body,
      });

      const storeFile = await storeFileService.changeStatus(id, statusData, request.user.id);

      logger.info(`Store opened: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storeFile },
        message: '门店开业成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to open store:', error);
      throw error;
    }
  },

  /**
   * 暂停营业
   * POST /api/v1/store-files/:id/suspend
   */
  async suspendStore(
    request: FastifyRequest<{ Params: IdParam; Body: Partial<StatusChangeData> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const statusData = statusChangeSchema.parse({
        status: 'SUSPENDED',
        operator: request.user.name,
        ...request.body,
      });

      const storeFile = await storeFileService.changeStatus(id, statusData, request.user.id);

      logger.info(`Store suspended: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storeFile },
        message: '门店暂停营业成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to suspend store:', error);
      throw error;
    }
  },

  /**
   * 关闭门店
   * POST /api/v1/store-files/:id/close
   */
  async closeStore(
    request: FastifyRequest<{ Params: IdParam; Body: Partial<StatusChangeData> }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      const statusData = statusChangeSchema.parse({
        status: 'CLOSED',
        operator: request.user.name,
        ...request.body,
      });

      const storeFile = await storeFileService.changeStatus(id, statusData, request.user.id);

      logger.info(`Store closed: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { storeFile },
        message: '门店关闭成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to close store:', error);
      throw error;
    }
  },

  /**
   * 批量操作
   * POST /api/v1/store-files/batch
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

      const results = await storeFileService.batchOperation(validatedData, request.user.id);

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
   * GET /api/v1/store-files/statistics
   */
  async getStatistics(
    request: FastifyRequest<{ Querystring: StatisticsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const validatedQuery = statisticsQuerySchema.parse(request.query);
      
      const statistics = await storeFileService.getStatistics(validatedQuery);

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
   * GET /api/v1/store-files/progress
   */
  async getProgress(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const progress = await storeFileService.getProgress();

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
   * GET /api/v1/store-files/summary
   */
  async getSummary(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const summary = await storeFileService.getSummary();

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
   * POST /api/v1/store-files/export
   */
  async exportData(
    request: FastifyRequest<{ Body: ExportData }>,
    reply: FastifyReply
  ) {
    try {
      const validatedData = exportSchema.parse(request.body);
      
      const exportResult = await storeFileService.exportData(validatedData);

      logger.info(`Store files exported by user ${request.user?.username || 'anonymous'}: ${exportResult.filename}`);

      reply
        .header('Content-Type', exportResult.contentType)
        .header('Content-Disposition', `attachment; filename="${encodeURIComponent(exportResult.filename)}"`)
        .header('Access-Control-Expose-Headers', 'Content-Disposition')
        .send(exportResult.buffer);

    } catch (error) {
      logger.error('Failed to export store files:', error);
      throw error;
    }
  },

  /**
   * 获取门店证照文档
   * GET /api/v1/store-files/:id/documents
   */
  async getDocuments(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = idParamSchema.parse(request.params);
      
      const storeFile = await storeFileService.getById(id);
      
      // 从门店档案的documents字段中提取证照信息
      const documents = storeFile.documents || {};

      reply.send({
        success: true,
        code: 200,
        data: { 
          storeId: id,
          documents: Object.entries(documents).map(([key, value]) => ({
            id: key,
            ...value,
          })),
        },
        message: '获取门店证照文档成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get store documents:', error);
      throw error;
    }
  },

  /**
   * 上传门店证照文档
   * POST /api/v1/store-files/:id/documents
   */
  async uploadDocuments(
    request: FastifyRequest<{ Params: IdParam; Body: any }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id } = idParamSchema.parse(request.params);
      
      // 获取当前门店档案
      const currentStoreFile = await storeFileService.getById(id);
      
      // 更新documents字段
      const updatedDocuments = {
        ...currentStoreFile.documents || {},
        ...request.body.documents || {},
      };

      const storeFile = await storeFileService.update(id, { 
        documents: updatedDocuments 
      }, request.user.id);

      logger.info(`Store documents uploaded: ${id} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        data: { 
          storeFile,
          documents: Object.entries(updatedDocuments).map(([key, value]) => ({
            id: key,
            ...value,
          })),
        },
        message: '上传门店证照文档成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to upload store documents:', error);
      throw error;
    }
  },

  /**
   * 删除门店证照文档
   * DELETE /api/v1/store-files/:id/documents/:documentId
   */
  async deleteDocument(
    request: FastifyRequest<{ Params: IdParam & { documentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        throw new BadRequestError('用户信息缺失');
      }

      const { id, documentId } = request.params;
      
      // 获取当前门店档案
      const currentStoreFile = await storeFileService.getById(id);
      
      // 删除指定文档
      const updatedDocuments = { ...currentStoreFile.documents || {} };
      delete updatedDocuments[documentId];

      await storeFileService.update(id, { 
        documents: updatedDocuments 
      }, request.user.id);

      logger.info(`Store document deleted: ${id}/${documentId} by user ${request.user.username}`);

      reply.send({
        success: true,
        code: 200,
        message: '删除门店证照文档成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete store document:', error);
      throw error;
    }
  },
};