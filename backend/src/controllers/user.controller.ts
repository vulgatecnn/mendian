/**
 * 用户管理控制器
 * 处理用户相关的HTTP请求
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
// Import middleware to get augmented FastifyRequest type
import '../middleware/auth.middleware.js';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchParams,
  AssignRolesRequest,
} from '../types/auth.js';

export class UserController {
  /**
   * 创建用户
   */
  async createUser(
    request: FastifyRequest<{
      Body: CreateUserRequest;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const createdBy = request.user?.id;
      const user = await userService.createUser(request.body, createdBy);

      reply.send({
        success: true,
        message: '用户创建成功',
        data: user,
      });
    } catch (error) {
      logger.error('Create user failed', { body: request.body, error });
      
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'USER_CREATE_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '用户创建失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 获取用户详情
   */
  async getUserById(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const user = await userService.getUserById(request.params.id);

      reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'USER_NOT_FOUND',
        });
      }

      reply.status(500).send({
        success: false,
        message: '获取用户信息失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateUserRequest;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const updatedBy = request.user?.id;
      const user = await userService.updateUser(request.params.id, request.body, updatedBy);

      reply.send({
        success: true,
        message: '用户信息更新成功',
        data: user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'USER_UPDATE_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '用户信息更新失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const deletedBy = request.user?.id;
      await userService.deleteUser(request.params.id, deletedBy);

      reply.send({
        success: true,
        message: '用户删除成功',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'USER_DELETE_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '用户删除失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(
    request: FastifyRequest<{
      Querystring: UserSearchParams;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const result = await userService.searchUsers(request.query);

      reply.send({
        success: true,
        data: result.users,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error('Search users failed', { query: request.query, error });

      reply.status(500).send({
        success: false,
        message: '用户搜索失败',
        code: 'USER_SEARCH_FAILED',
      });
    }
  }

  /**
   * 分配角色给用户
   */
  async assignRoles(
    request: FastifyRequest<{
      Body: AssignRolesRequest;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const assignedBy = request.user?.id;
      await userService.assignRoles(request.body.userId, request.body.roleIds, assignedBy);

      reply.send({
        success: true,
        message: '角色分配成功',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'ROLE_ASSIGN_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '角色分配失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 获取用户角色列表
   */
  async getUserRoles(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const roles = await userService.getUserRoles(request.params.id);

      reply.send({
        success: true,
        data: roles,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'GET_USER_ROLES_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '获取用户角色失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 获取用户权限列表
   */
  async getUserPermissions(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const permissions = await userService.getUserPermissions(request.params.id);

      reply.send({
        success: true,
        data: permissions,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'GET_USER_PERMISSIONS_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '获取用户权限失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({
          success: false,
          message: '用户未登录',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const user = await userService.getUserById(request.user.id);

      reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'GET_CURRENT_USER_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '获取当前用户信息失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 更新当前用户信息
   */
  async updateCurrentUser(
    request: FastifyRequest<{
      Body: Partial<UpdateUserRequest>;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({
          success: false,
          message: '用户未登录',
          code: 'NOT_AUTHENTICATED',
        });
      }

      // 限制普通用户只能更新特定字段
      const allowedFields: (keyof UpdateUserRequest)[] = [
        'name', 
        'nickname', 
        'avatar', 
        'phone'
      ];

      const updateData: Partial<UpdateUserRequest> = {};
      
      for (const field of allowedFields) {
        if (field in request.body) {
          (updateData as any)[field] = (request.body as any)[field];
        }
      }

      const user = await userService.updateUser(request.user.id, updateData as UpdateUserRequest, request.user.id);

      reply.send({
        success: true,
        message: '个人信息更新成功',
        data: user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'UPDATE_CURRENT_USER_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '个人信息更新失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 批量更新用户状态
   */
  async batchUpdateUserStatus(
    request: FastifyRequest<{
      Body: {
        userIds: string[];
        status: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const updatedBy = request.user?.id;
      await userService.batchUpdateUserStatus(request.body.userIds, request.body.status, updatedBy);

      reply.send({
        success: true,
        message: '批量更新用户状态成功',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          code: 'BATCH_UPDATE_STATUS_FAILED',
        });
      }

      reply.status(500).send({
        success: false,
        message: '批量更新用户状态失败',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStatistics(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // 这里可以实现用户统计逻辑
      // 例如：总用户数、活跃用户数、各状态用户数等

      reply.send({
        success: true,
        data: {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          // 更多统计数据...
        },
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        message: '获取用户统计信息失败',
        code: 'GET_USER_STATISTICS_FAILED',
      });
    }
  }
}

// 创建控制器实例
export const userController = new UserController();