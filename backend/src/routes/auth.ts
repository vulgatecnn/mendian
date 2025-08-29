/**
 * 认证路由
 * 定义用户认证相关的API接口
 */
import type { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller.js';
import { authenticateToken, optionalAuth, validateRefreshToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../types/auth.js';

const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
  /**
   * 用户登录
   */
  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: '用户登录',
      description: '使用用户名密码登录系统',
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', description: '用户名' },
          password: { type: 'string', description: '密码' },
          remember: { type: 'boolean', description: '记住我' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
                tokenType: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [validateBody(loginSchema)],
  }, authController.login);

  /**
   * 获取企业微信OAuth URL
   */
  fastify.get('/wechat/oauth-url', {
    schema: {
      tags: ['auth'],
      summary: '获取企业微信OAuth URL',
      description: '获取企业微信登录授权URL',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                message: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, authController.getWeChatOAuthUrl);

  /**
   * 企业微信OAuth回调
   */
  fastify.post('/wechat/callback', {
    schema: {
      tags: ['auth'],
      summary: '企业微信OAuth回调',
      description: '处理企业微信OAuth授权回调',
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', description: '授权码' },
        },
      },
    },
  }, authController.handleWeChatCallback);

  /**
   * 刷新访问令牌
   */
  fastify.post('/refresh-token', {
    schema: {
      tags: ['auth'],
      summary: '刷新访问令牌',
      description: '使用刷新令牌获取新的访问令牌',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: '刷新令牌' },
        },
      },
    },
    preHandler: [
      validateRefreshToken,
      validateBody(refreshTokenSchema),
    ],
  }, authController.refreshToken);

  /**
   * 用户登出
   */
  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: '用户登出',
      description: '用户登出系统',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [optionalAuth], // 使用可选认证
  }, authController.logout);

  /**
   * 获取当前用户信息
   */
  fastify.get('/me', {
    schema: {
      tags: ['auth'],
      summary: '获取当前用户信息',
      description: '获取当前登录用户的详细信息',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [authenticateToken],
  }, authController.getCurrentUser);

  /**
   * 修改密码
   */
  fastify.post('/change-password', {
    schema: {
      tags: ['auth'],
      summary: '修改密码',
      description: '修改当前用户密码',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmPassword'],
        properties: {
          currentPassword: { type: 'string', description: '当前密码' },
          newPassword: { type: 'string', description: '新密码' },
          confirmPassword: { type: 'string', description: '确认新密码' },
        },
      },
    },
    preHandler: [
      authenticateToken,
      validateBody(changePasswordSchema),
    ],
  }, authController.changePassword);

  /**
   * 验证令牌有效性
   */
  fastify.post('/validate-token', {
    schema: {
      tags: ['auth'],
      summary: '验证令牌有效性',
      description: '验证访问令牌是否有效',
    },
  }, authController.validateToken);

  /**
   * 获取会话信息
   */
  fastify.get('/session', {
    schema: {
      tags: ['auth'],
      summary: '获取会话信息',
      description: '获取当前用户的会话信息',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [authenticateToken],
  }, authController.getSessionInfo);

  /**
   * 获取同步状态
   */
  fastify.get('/sync/status', {
    schema: {
      tags: ['auth'],
      summary: '获取企业微信同步状态',
      description: '获取企业微信用户和部门同步状态',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                isRunning: { type: 'boolean' },
                lastSyncTime: { type: 'string' },
                userCount: { type: 'number' },
                departmentCount: { type: 'number' },
              },
            },
          },
        },
      },
    },
    preHandler: [authenticateToken],
  }, authController.getSyncStatus);

  /**
   * 手动触发同步
   */
  fastify.post('/sync/trigger', {
    schema: {
      tags: ['auth'],
      summary: '手动触发企业微信同步',
      description: '手动触发企业微信用户和部门同步任务',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken],
  }, authController.triggerSync);
};

export default authRoutes;