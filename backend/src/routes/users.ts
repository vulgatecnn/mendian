/**
 * 用户管理路由
 * 定义用户相关的API接口
 */
import type { FastifyPluginAsync } from 'fastify';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requirePermission, requireAdmin } from '../middleware/permission.middleware.js';
import { validateBody, validateQuery, validateParams, commonParams } from '../middleware/validation.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userSearchSchema,
  assignRolesSchema,
} from '../types/auth.js';

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // 应用认证中间件到所有路由
  fastify.addHook('preHandler', authenticateToken);

  /**
   * @api {get} /api/v1/users 获取用户列表
   * @apiName SearchUsers
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.get('/', {
    preHandler: [
      requirePermission('system:manage-users'),
      validateQuery(userSearchSchema),
    ],
    handler: userController.searchUsers,
  });

  /**
   * @api {post} /api/v1/users 创建用户
   * @apiName CreateUser
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.post('/', {
    preHandler: [
      requirePermission('system:manage-users'),
      validateBody(createUserSchema),
    ],
    handler: userController.createUser,
  });

  /**
   * @api {get} /api/v1/users/me 获取当前用户信息
   * @apiName GetCurrentUser
   * @apiGroup Users
   */
  fastify.get('/me', {
    handler: userController.getCurrentUser,
  });

  /**
   * @api {put} /api/v1/users/me 更新当前用户信息
   * @apiName UpdateCurrentUser
   * @apiGroup Users
   */
  fastify.put('/me', {
    preHandler: [validateBody(updateUserSchema.partial())],
    handler: userController.updateCurrentUser,
  });

  /**
   * @api {get} /api/v1/users/:id 获取指定用户信息
   * @apiName GetUser
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.get('/:id', {
    preHandler: [
      requirePermission('system:manage-users'),
      validateParams(commonParams.id),
    ],
    handler: userController.getUserById,
  });

  /**
   * @api {put} /api/v1/users/:id 更新用户信息
   * @apiName UpdateUser
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.put('/:id', {
    preHandler: [
      requirePermission('system:manage-users'),
      validateParams(commonParams.id),
      validateBody(updateUserSchema),
    ],
    handler: userController.updateUser,
  });

  /**
   * @api {delete} /api/v1/users/:id 删除用户
   * @apiName DeleteUser
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.delete('/:id', {
    preHandler: [
      requireAdmin, // 只有管理员可以删除用户
      validateParams(commonParams.id),
    ],
    handler: userController.deleteUser,
  });

  /**
   * @api {post} /api/v1/users/assign-roles 分配角色
   * @apiName AssignRoles
   * @apiGroup Users
   * @apiPermission system:manage-roles
   */
  fastify.post('/assign-roles', {
    preHandler: [
      requirePermission('system:manage-roles'),
      validateBody(assignRolesSchema),
    ],
    handler: userController.assignRoles,
  });

  /**
   * @api {get} /api/v1/users/:id/roles 获取用户角色
   * @apiName GetUserRoles
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.get('/:id/roles', {
    preHandler: [
      requirePermission('system:manage-users'),
      validateParams(commonParams.id),
    ],
    handler: userController.getUserRoles,
  });

  /**
   * @api {get} /api/v1/users/:id/permissions 获取用户权限
   * @apiName GetUserPermissions
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.get('/:id/permissions', {
    preHandler: [
      requirePermission('system:manage-users'),
      validateParams(commonParams.id),
    ],
    handler: userController.getUserPermissions,
  });

  /**
   * @api {patch} /api/v1/users/batch-status 批量更新用户状态
   * @apiName BatchUpdateUserStatus
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.patch('/batch-status', {
    preHandler: [
      requireAdmin, // 批量操作需要管理员权限
    ],
    handler: userController.batchUpdateUserStatus,
  });

  /**
   * @api {get} /api/v1/users/statistics 获取用户统计信息
   * @apiName GetUserStatistics
   * @apiGroup Users
   * @apiPermission system:manage-users
   */
  fastify.get('/statistics', {
    preHandler: [requirePermission('system:manage-users')],
    handler: userController.getUserStatistics,
  });
};

export default usersRoutes;