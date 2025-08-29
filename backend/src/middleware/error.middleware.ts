/**
 * 错误处理中间件
 * 统一处理应用程序错误并返回标准化的错误响应
 */
import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { appConfig, isDevelopment } from '../config/index.js';

/**
 * 全局错误处理器
 */
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  // 记录错误日志
  logger.error('Request error', {
    error: {
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
      code: error.code,
      statusCode: error.statusCode,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers['user-agent'],
        'x-forwarded-for': request.headers['x-forwarded-for'],
      },
      body: request.method !== 'GET' ? request.body : undefined,
      query: request.query,
      params: request.params,
    },
    user: {
      id: request.user?.id,
      username: request.user?.username,
    },
  });

  // 处理不同类型的错误
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code || 'APPLICATION_ERROR',
      ...(isDevelopment && { stack: error.stack }),
    });
  }

  // Fastify 验证错误
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      errors: error.validation.map(err => ({
        field: err.instancePath || err.schemaPath,
        message: err.message,
        value: err.data,
      })),
    });
  }

  // JWT 错误
  if (error.code === 'FST_JWT_BAD_REQUEST' || error.message?.includes('jwt')) {
    return reply.status(401).send({
      success: false,
      message: '令牌无效',
      code: 'INVALID_TOKEN',
    });
  }

  // 速率限制错误
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      message: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: reply.getHeader('Retry-After'),
    });
  }

  // 数据库错误
  if (error.message?.includes('Prisma') || error.code?.startsWith('P')) {
    return handleDatabaseError(error, reply);
  }

  // 网络相关错误
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return reply.status(503).send({
      success: false,
      message: '服务暂时不可用，请稍后再试',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // 文件上传错误
  if (error.code === 'FST_FILES_LIMIT' || error.code === 'FST_FILE_SIZE_LIMIT') {
    return reply.status(413).send({
      success: false,
      message: '文件大小超过限制',
      code: 'FILE_SIZE_LIMIT_EXCEEDED',
    });
  }

  // 默认内部服务器错误
  const statusCode = error.statusCode || 500;
  const message = isDevelopment ? error.message : '内部服务器错误';

  reply.status(statusCode).send({
    success: false,
    message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { 
      stack: error.stack,
      details: {
        name: error.name,
        code: error.code,
      }
    }),
  });
};

/**
 * 处理数据库错误
 */
function handleDatabaseError(error: FastifyError, reply: FastifyReply): void {
  // Prisma 错误代码映射
  const prismaErrors: Record<string, { status: number; message: string; code: string }> = {
    'P2002': {
      status: 409,
      message: '数据已存在，请检查唯一性约束',
      code: 'DUPLICATE_ENTRY',
    },
    'P2025': {
      status: 404,
      message: '记录不存在',
      code: 'RECORD_NOT_FOUND',
    },
    'P2003': {
      status: 400,
      message: '外键约束失败',
      code: 'FOREIGN_KEY_CONSTRAINT',
    },
    'P2014': {
      status: 400,
      message: '操作违反了数据完整性约束',
      code: 'INTEGRITY_CONSTRAINT',
    },
    'P1008': {
      status: 408,
      message: '数据库操作超时',
      code: 'DATABASE_TIMEOUT',
    },
  };

  const errorCode = error.code;
  const errorInfo = errorCode && prismaErrors[errorCode];

  if (errorInfo) {
    return reply.status(errorInfo.status).send({
      success: false,
      message: errorInfo.message,
      code: errorInfo.code,
    });
  }

  // 通用数据库错误
  reply.status(500).send({
    success: false,
    message: '数据库操作失败',
    code: 'DATABASE_ERROR',
    ...(isDevelopment && { details: error.message }),
  });
}

/**
 * 404 错误处理器
 */
export const notFoundHandler = (
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  logger.warn('Route not found', {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  });

  reply.status(404).send({
    success: false,
    message: `路由 ${request.method} ${request.url} 不存在`,
    code: 'ROUTE_NOT_FOUND',
  });
};

/**
 * 异步错误捕获包装器
 */
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return (...args: T): Promise<R> => {
    const result = fn(...args);
    
    if (result && typeof result.catch === 'function') {
      return result.catch((error: Error) => {
        // 这里的错误会被全局错误处理器捕获
        throw error;
      });
    }
    
    return result;
  };
};

/**
 * 创建错误响应助手
 */
export const createErrorResponse = (
  statusCode: number,
  message: string,
  code?: string,
  details?: any
) => ({
  success: false,
  message,
  code: code || 'ERROR',
  ...(details && { details }),
  timestamp: new Date().toISOString(),
});

/**
 * 验证错误格式化器
 */
export const formatValidationErrors = (errors: any[]) => {
  return errors.map(error => ({
    field: error.instancePath?.replace('/', '') || error.schemaPath,
    message: error.message,
    value: error.data,
    constraint: error.keyword,
  }));
};

/**
 * 安全错误信息过滤器
 * 在生产环境中过滤敏感信息
 */
export const filterSensitiveError = (error: any): any => {
  if (isDevelopment) {
    return error;
  }

  // 移除敏感信息
  const filteredError = { ...error };
  
  // 移除堆栈信息
  delete filteredError.stack;
  
  // 移除数据库连接信息
  if (filteredError.message?.includes('connection') || 
      filteredError.message?.includes('password')) {
    filteredError.message = '数据库连接错误';
  }
  
  // 移除文件路径信息
  if (filteredError.message?.includes(process.cwd())) {
    filteredError.message = filteredError.message.replace(
      new RegExp(process.cwd(), 'g'), 
      '[APP_ROOT]'
    );
  }
  
  return filteredError;
};

/**
 * 错误统计和监控
 */
class ErrorMonitor {
  private errorCounts = new Map<string, number>();
  private lastReset = Date.now();
  private readonly resetInterval = 60 * 60 * 1000; // 1小时

  recordError(error: Error, context?: any): void {
    const errorKey = `${error.name}:${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // 检查是否需要重置统计
    if (Date.now() - this.lastReset > this.resetInterval) {
      this.resetStats();
    }

    // 如果错误频率过高，发送告警
    if (currentCount > 10) {
      this.sendAlert(errorKey, currentCount, context);
    }
  }

  getStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  private resetStats(): void {
    this.errorCounts.clear();
    this.lastReset = Date.now();
  }

  private sendAlert(errorKey: string, count: number, context?: any): void {
    logger.error('High error frequency detected', {
      errorKey,
      count,
      context,
      interval: '1 hour',
    });

    // 这里可以集成外部告警系统
    // 例如：发送邮件、推送到钉钉/企微等
  }
}

export const errorMonitor = new ErrorMonitor();

/**
 * 错误恢复助手
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        break;
      }

      // 指数退避延迟
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
};