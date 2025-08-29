/**
 * 认证控制器
 * 处理用户认证相关的HTTP请求
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { enhancedAuthService } from '../services/auth.service.enhanced.js';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
// Import middleware to get augmented FastifyRequest type
import '../middleware/auth.middleware.js';
import type {
  LoginRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
} from '../types/auth.js';

interface WeChatCallbackBody {
  code: string;
}

export const authController = {
  // 用户登录
  login: async (
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ) => {
    try {
      const { username, password } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'];

      const result = await enhancedAuthService.login(username, password, ipAddress, userAgent);
      
      logger.info(`User login successful: ${username}`);
      
      reply.send({
        success: true,
        data: result,
        message: '登录成功',
      });
    } catch (error) {
      logger.error(`User login failed: ${request.body.username}`, error);
      
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'LOGIN_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '登录处理失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  },

  // 获取企业微信OAuth URL
  getWeChatOAuthUrl: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const oauthUrl = authService.getWeChatOAuthUrl();
      
      reply.send({
        success: true,
        data: {
          url: oauthUrl,
          message: '请在企业微信中打开此链接进行授权登录'
        },
        message: '获取授权URL成功',
      });
    } catch (error) {
      logger.error('Failed to get WeChat OAuth URL', error);
      
      reply.status(500).send({
        success: false,
        message: '获取企业微信授权链接失败',
        code: 'GET_WECHAT_URL_FAILED',
      });
    }
  },

  // 处理企业微信OAuth回调
  handleWeChatCallback: async (
    request: FastifyRequest<{ Body: WeChatCallbackBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { code } = request.body;
      const result = await authService.handleWeChatCallback(code);
      
      logger.info(`WeChat login successful: ${result.user.username}`);
      
      reply.send({
        success: true,
        data: result,
        message: '企业微信登录成功',
      });
    } catch (error) {
      logger.error('WeChat login failed', error);
      
      reply.status(401).send({
        success: false,
        message: error instanceof Error ? error.message : '企业微信登录失败',
        code: 'WECHAT_LOGIN_FAILED',
      });
    }
  },

  // 获取同步状态
  getSyncStatus: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const wechatSyncService = (await import('../services/sync.service.js')).wechatSyncService;
      const status = await wechatSyncService.getSyncStatus();
      
      reply.send({
        success: true,
        data: status,
        message: '获取同步状态成功',
      });
    } catch (error) {
      logger.error('Get sync status failed', error);
      
      reply.status(500).send({
        success: false,
        message: '获取同步状态失败',
        code: 'GET_SYNC_STATUS_FAILED',
      });
    }
  },

  // 手动触发同步
  triggerSync: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const wechatSyncService = (await import('../services/sync.service.js')).wechatSyncService;
      
      // 异步执行同步，不等待完成
      wechatSyncService.performFullSync({
        fullSync: true,
        batchSize: 50
      }).catch(error => {
        logger.error('Manual sync failed:', error);
      });
      
      logger.info('Manual WeChat sync triggered', {
        userId: request.user?.id,
        ip: request.ip
      });

      reply.send({
        success: true,
        message: '同步任务已启动',
      });
    } catch (error) {
      logger.error('Trigger sync failed', error);
      
      reply.status(500).send({
        success: false,
        message: '启动同步任务失败',
        code: 'TRIGGER_SYNC_FAILED',
      });
    }
  },

  // 刷新访问令牌
  refreshToken: async (
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply
  ) => {
    try {
      const { refreshToken } = request.body;
      const result = await enhancedAuthService.refreshToken(refreshToken);
      
      reply.send({
        success: true,
        data: result,
        message: '令牌刷新成功',
      });
    } catch (error) {
      logger.error('Token refresh failed', error);
      
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'TOKEN_REFRESH_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '令牌刷新处理失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  },

  // 用户登出
  logout: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '') || '';
      const userId = request.user?.id;

      if (userId && token) {
        await enhancedAuthService.logout(userId, token);
      }
      
      logger.info(`User logout: ${request.user?.username}`);
      
      reply.send({
        success: true,
        message: '登出成功',
      });
    } catch (error) {
      logger.error('User logout failed', error);
      
      // 登出操作即使失败也应该返回成功，客户端可以清除本地令牌
      reply.send({
        success: true,
        message: '登出成功',
      });
    }
  },

  // 获取当前用户信息
  getCurrentUser: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: '用户未登录',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const user = await authService.getCurrentUser(userId);
      
      reply.send({
        success: true,
        data: user,
        message: '获取用户信息成功',
      });
    } catch (error) {
      logger.error('Failed to get current user', error);
      
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'GET_CURRENT_USER_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '获取用户信息失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  },

  // 修改密码
  changePassword: async (
    request: FastifyRequest<{ Body: ChangePasswordRequest }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: '用户未登录',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const { currentPassword, newPassword } = request.body;
      await enhancedAuthService.changePassword(userId, currentPassword, newPassword);
      
      reply.send({
        success: true,
        message: '密码修改成功，请重新登录',
      });
    } catch (error) {
      logger.error('Change password failed', { userId: request.user?.id, error });
      
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'CHANGE_PASSWORD_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '密码修改失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  },

  // 验证令牌有效性
  validateToken: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '') || '';
      
      if (!token) {
        return reply.status(400).send({
          success: false,
          message: '缺少访问令牌',
          code: 'MISSING_TOKEN',
        });
      }

      const payload = await enhancedAuthService.verifyToken(token);
      
      reply.send({
        success: true,
        message: '令牌有效',
        data: {
          valid: true,
          userId: payload.id,
          username: payload.username,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        },
      });
    } catch (error) {
      logger.debug('Token validation failed', { error });
      
      reply.status(401).send({
        success: false,
        message: '令牌无效或已过期',
        code: 'INVALID_TOKEN',
        data: {
          valid: false,
        },
      });
    }
  },

  // 获取用户会话信息
  getSessionInfo: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: '用户未登录',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const sessions = await enhancedAuthService.getUserSessions(userId);
      
      reply.send({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Get session info failed', { userId: request.user?.id, error });

      reply.status(500).send({
        success: false,
        message: '获取会话信息失败',
        code: 'GET_SESSION_INFO_FAILED',
      });
    }
  },
};