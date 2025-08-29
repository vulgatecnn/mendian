/**
 * 输入验证中间件
 * 使用Zod进行请求数据验证
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * 验证选项
 */
interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
  strict?: boolean; // 是否严格模式（不允许额外字段）
  stripUnknown?: boolean; // 是否移除未知字段
}

/**
 * 创建验证中间件
 */
export const validate = (options: ValidationOptions) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const errors: Array<{ field: string; message: string; value?: any }> = [];

      // 验证请求体
      if (options.body) {
        try {
          const result = options.body.parse(request.body);
          request.body = result; // 使用验证后的数据
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              errors.push({
                field: `body.${err.path.join('.')}`,
                message: err.message,
                value: err.input,
              });
            });
          }
        }
      }

      // 验证查询参数
      if (options.query) {
        try {
          const result = options.query.parse(request.query);
          request.query = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              errors.push({
                field: `query.${err.path.join('.')}`,
                message: err.message,
                value: err.input,
              });
            });
          }
        }
      }

      // 验证路径参数
      if (options.params) {
        try {
          const result = options.params.parse(request.params);
          request.params = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              errors.push({
                field: `params.${err.path.join('.')}`,
                message: err.message,
                value: err.input,
              });
            });
          }
        }
      }

      // 验证请求头
      if (options.headers) {
        try {
          const result = options.headers.parse(request.headers);
          // 不直接替换headers，只验证
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              errors.push({
                field: `headers.${err.path.join('.')}`,
                message: err.message,
                value: err.input,
              });
            });
          }
        }
      }

      // 如果有验证错误，返回400错误
      if (errors.length > 0) {
        logger.warn('Request validation failed', {
          path: request.url,
          method: request.method,
          errors,
        });

        return reply.status(400).send({
          success: false,
          message: '请求数据验证失败',
          code: 'VALIDATION_ERROR',
          errors,
        });
      }

    } catch (error) {
      logger.error('Validation middleware error', { error });

      return reply.status(500).send({
        success: false,
        message: '数据验证处理失败',
        code: 'VALIDATION_PROCESSING_ERROR',
      });
    }
  };
};

/**
 * 只验证请求体的快捷方法
 */
export const validateBody = (schema: z.ZodSchema) => {
  return validate({ body: schema });
};

/**
 * 只验证查询参数的快捷方法
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return validate({ query: schema });
};

/**
 * 只验证路径参数的快捷方法
 */
export const validateParams = (schema: z.ZodSchema) => {
  return validate({ params: schema });
};

/**
 * 常用的路径参数验证模式
 */
export const commonParams = {
  // ID参数验证
  id: z.object({
    id: z.string().cuid('无效的ID格式'),
  }),

  // 分页参数验证
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),

  // 排序参数验证
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // 状态参数验证
  status: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  }),
};

/**
 * 常用的查询参数验证模式
 */
export const commonQueries = {
  // 搜索查询
  search: z.object({
    keyword: z.string().optional(),
    ...commonParams.pagination.shape,
    ...commonParams.sorting.shape,
  }),

  // 过滤查询
  filter: z.object({
    ...commonParams.pagination.shape,
    ...commonParams.sorting.shape,
    ...commonParams.status.shape,
    startDate: z.string().datetime('无效的开始日期格式').optional(),
    endDate: z.string().datetime('无效的结束日期格式').optional(),
  }),

  // 日期范围查询
  dateRange: z.object({
    startDate: z.string().datetime('无效的开始日期格式'),
    endDate: z.string().datetime('无效的结束日期格式'),
  }).refine(
    data => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: '开始日期不能晚于结束日期',
      path: ['endDate'],
    }
  ),
};

/**
 * 创建动态验证中间件
 * 根据请求方法使用不同的验证规则
 */
export const createMethodValidation = (validations: {
  POST?: ValidationOptions;
  PUT?: ValidationOptions;
  PATCH?: ValidationOptions;
  GET?: ValidationOptions;
  DELETE?: ValidationOptions;
}) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const method = request.method as keyof typeof validations;
    const options = validations[method];

    if (options) {
      return await validate(options)(request, reply);
    }
  };
};

/**
 * 文件上传验证中间件
 */
export const validateFileUpload = (options: {
  maxSize?: number; // 最大文件大小（字节）
  allowedTypes?: string[]; // 允许的MIME类型
  required?: boolean; // 是否必须上传文件
}) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const data = await request.file();
      
      if (!data && options.required) {
        return reply.status(400).send({
          success: false,
          message: '请选择要上传的文件',
          code: 'FILE_REQUIRED',
        });
      }

      if (data) {
        // 检查文件大小
        if (options.maxSize && data.file.readableLength > options.maxSize) {
          return reply.status(400).send({
            success: false,
            message: `文件大小不能超过 ${Math.round(options.maxSize / 1024 / 1024)}MB`,
            code: 'FILE_SIZE_EXCEEDED',
          });
        }

        // 检查文件类型
        if (options.allowedTypes && !options.allowedTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            success: false,
            message: `不支持的文件类型：${data.mimetype}`,
            code: 'FILE_TYPE_NOT_ALLOWED',
            allowedTypes: options.allowedTypes,
          });
        }

        // 将文件信息添加到请求对象
        (request as any).uploadedFile = data;
      }

    } catch (error) {
      logger.error('File upload validation failed', { error });

      return reply.status(400).send({
        success: false,
        message: '文件上传验证失败',
        code: 'FILE_VALIDATION_ERROR',
      });
    }
  };
};

/**
 * 自定义验证中间件工厂
 * 支持自定义验证逻辑
 */
export const createCustomValidation = (
  validatorFn: (request: FastifyRequest) => Promise<{ valid: boolean; message?: string; errors?: any[] }>
) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const result = await validatorFn(request);

      if (!result.valid) {
        return reply.status(400).send({
          success: false,
          message: result.message || '验证失败',
          code: 'CUSTOM_VALIDATION_ERROR',
          errors: result.errors,
        });
      }

    } catch (error) {
      logger.error('Custom validation failed', { error });

      return reply.status(500).send({
        success: false,
        message: '自定义验证处理失败',
        code: 'CUSTOM_VALIDATION_PROCESSING_ERROR',
      });
    }
  };
};

/**
 * 条件验证中间件
 * 只在满足特定条件时进行验证
 */
export const conditionalValidate = (
  condition: (request: FastifyRequest) => boolean,
  validation: ValidationOptions
) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (condition(request)) {
      return await validate(validation)(request, reply);
    }
  };
};

/**
 * 验证错误处理助手
 */
export const formatValidationError = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    received: (err as any).received,
  }));
};

/**
 * 创建Zod中间件插件
 * 为Fastify添加验证支持
 */
export const zodValidationPlugin = async (fastify: any) => {
  fastify.addHook('preValidation', async (request: FastifyRequest, reply: FastifyReply) => {
    // 这里可以添加全局验证逻辑
    // 例如：API版本检查、内容类型验证等
  });

  // 添加验证装饰器
  fastify.decorate('validate', validate);
  fastify.decorate('validateBody', validateBody);
  fastify.decorate('validateQuery', validateQuery);
  fastify.decorate('validateParams', validateParams);
};