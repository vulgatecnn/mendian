/**
 * 认证中间件
 * 负责JWT令牌验证、用户认证状态检查
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { enhancedAuthService } from '../services/auth.service.enhanced.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { JWTPayload } from '../types/auth.js';

// 扩展FastifyRequest类型以包含用户信息
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload & {
      isAuthenticated: boolean;
    };
  }
}

/**
 * JWT认证中间件
 * 验证Authorization header中的Bearer令牌
 */
export const authenticateToken = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('缺少访问令牌', 401);
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    if (!token) {
      throw new AppError('访问令牌不能为空', 401);
    }

    // 验证令牌
    const payload = await enhancedAuthService.verifyToken(token);

    // 更新会话活动时间
    await enhancedAuthService.updateSessionActivity(payload.id);

    // 将用户信息附加到请求对象
    request.user = {
      ...payload,
      isAuthenticated: true,
    };

    logger.debug('User authenticated', { 
      userId: payload.id, 
      username: payload.username,
      path: request.url 
    });

  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      path: request.url,
      ip: request.ip,
    });

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        message: error.message,
        code: 'AUTHENTICATION_FAILED',
      });
    }

    return reply.status(401).send({
      success: false,
      message: '认证失败',
      code: 'AUTHENTICATION_FAILED',
    });
  }
};

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行（用于公开但可受益于用户身份的接口）
 */
export const optionalAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有令牌，设置为未认证状态
      request.user = { isAuthenticated: false } as any;
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      request.user = { isAuthenticated: false } as any;
      return;
    }

    // 尝试验证令牌
    try {
      const payload = await enhancedAuthService.verifyToken(token);
      await enhancedAuthService.updateSessionActivity(payload.id);

      request.user = {
        ...payload,
        isAuthenticated: true,
      };
    } catch (error) {
      // 令牌无效，设置为未认证状态
      request.user = { isAuthenticated: false } as any;
      
      logger.debug('Optional auth failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: request.url 
      });
    }

  } catch (error) {
    // 出现其他错误，设置为未认证状态
    request.user = { isAuthenticated: false } as any;
  }
};

/**
 * 用户状态检查中间件
 * 确保用户账户处于活跃状态
 */
export const requireActiveUser = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.user?.isAuthenticated) {
    return reply.status(401).send({
      success: false,
      message: '请先登录',
      code: 'AUTHENTICATION_REQUIRED',
    });
  }

  // 这里可以添加额外的用户状态检查
  // 例如检查用户是否被锁定、是否需要修改密码等
  
  try {
    // 可以从数据库中获取最新的用户状态
    // const user = await prisma.user.findUnique({
    //   where: { id: request.user.id },
    //   select: { status: true, lastLoginAt: true }
    // });
    
    // if (!user || user.status !== 'ACTIVE') {
    //   return reply.status(403).send({
    //     success: false,
    //     message: '用户账户已被禁用',
    //     code: 'USER_INACTIVE',
    //   });
    // }

  } catch (error) {
    logger.error('User status check failed', { 
      userId: request.user.id, 
      error 
    });

    return reply.status(500).send({
      success: false,
      message: '用户状态检查失败',
      code: 'USER_STATUS_CHECK_FAILED',
    });
  }
};

/**
 * 刷新令牌验证中间件
 * 专门用于验证刷新令牌的接口
 */
export const validateRefreshToken = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        message: '缺少刷新令牌',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    // 验证刷新令牌（在控制器中进行实际验证和令牌生成）
    // 这里只做基本的格式验证

  } catch (error) {
    logger.error('Refresh token validation failed', { error });

    return reply.status(400).send({
      success: false,
      message: '刷新令牌验证失败',
      code: 'REFRESH_TOKEN_VALIDATION_FAILED',
    });
  }
};

/**
 * IP地址限制中间件工厂
 * 创建基于IP地址的访问限制中间件
 */
export const createIPRestriction = (allowedIPs: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const clientIP = request.ip;

    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP access denied', { 
        clientIP, 
        path: request.url,
        allowedIPs 
      });

      return reply.status(403).send({
        success: false,
        message: '访问被拒绝：IP地址不在允许范围内',
        code: 'IP_ACCESS_DENIED',
      });
    }

    logger.debug('IP access granted', { clientIP, path: request.url });
  };
};

/**
 * 会话超时检查中间件
 */
export const checkSessionTimeout = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.user?.isAuthenticated) {
    return;
  }

  try {
    const session = await enhancedAuthService.getSession(request.user.id);

    if (!session) {
      return reply.status(401).send({
        success: false,
        message: '会话已过期，请重新登录',
        code: 'SESSION_EXPIRED',
      });
    }

    // 检查会话是否超过最大空闲时间（例如24小时无活动）
    const maxIdleTime = 24 * 60 * 60 * 1000; // 24小时毫秒数
    const lastActivity = new Date(session.lastActivity).getTime();
    const now = Date.now();

    if (now - lastActivity > maxIdleTime) {
      // 删除过期会话
      await enhancedAuthService.deleteSession(request.user.id);

      return reply.status(401).send({
        success: false,
        message: '会话已超时，请重新登录',
        code: 'SESSION_TIMEOUT',
      });
    }

  } catch (error) {
    logger.error('Session timeout check failed', { 
      userId: request.user.id, 
      error 
    });

    // 会话检查失败时不阻塞请求，但记录错误
  }
};

/**
 * 开发环境跳过认证中间件
 * 仅在开发环境中使用，用于测试目的
 */
export const skipAuthInDev = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    // 在开发环境中创建一个模拟用户
    request.user = {
      id: 'dev-user-id',
      username: 'dev-user',
      name: '开发用户',
      email: 'dev@example.com',
      departmentId: 'dev-dept',
      roles: ['ADMIN'],
      permissions: ['*'],
      isAuthenticated: true,
    } as any;

    logger.debug('Development mode: Authentication skipped');
  }
};

/**
 * 创建速率限制错误处理器
 */
export const rateLimitErrorHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  return reply.status(429).send({
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: reply.getHeader('Retry-After'),
  });
};