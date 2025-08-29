/**
 * 权限中间件
 * 负责RBAC权限检查、动态权限验证等
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { 
  PermissionContext, 
  ResourceContext, 
  PermissionCheck 
} from '../types/permission.js';

const prisma = new PrismaClient();

/**
 * 权限检查服务类
 */
class PermissionService {
  /**
   * 检查用户是否具有指定权限
   */
  async checkPermission(
    context: PermissionContext,
    requiredPermission: string,
    resource?: ResourceContext
  ): Promise<PermissionCheck> {
    try {
      // 超级管理员拥有所有权限
      if (context.isAdmin || context.permissions.includes('*')) {
        return { allowed: true };
      }

      // 检查直接权限
      if (context.permissions.includes(requiredPermission)) {
        // 如果有资源上下文，需要进行资源级权限检查
        if (resource) {
          return await this.checkResourcePermission(context, requiredPermission, resource);
        }
        return { allowed: true };
      }

      // 检查通配符权限 (例如: store-plan:* 可以匹配 store-plan:create)
      const permissionParts = requiredPermission.split(':');
      if (permissionParts.length >= 2) {
        const wildcardPermission = `${permissionParts[0]}:*`;
        if (context.permissions.includes(wildcardPermission)) {
          if (resource) {
            return await this.checkResourcePermission(context, requiredPermission, resource);
          }
          return { allowed: true };
        }
      }

      return {
        allowed: false,
        reason: '缺少必要权限',
        requiredPermission,
        currentPermissions: context.permissions,
      };

    } catch (error) {
      logger.error('Permission check failed', { 
        userId: context.userId, 
        permission: requiredPermission, 
        error 
      });

      return {
        allowed: false,
        reason: '权限检查失败',
        requiredPermission,
      };
    }
  }

  /**
   * 检查资源级权限
   * 用于检查用户是否对特定资源有操作权限
   */
  private async checkResourcePermission(
    context: PermissionContext,
    permission: string,
    resource: ResourceContext
  ): Promise<PermissionCheck> {
    const [module, action] = permission.split(':');

    switch (module) {
      case 'store-plan':
        return await this.checkStorePlanPermission(context, action, resource);
      
      case 'expansion':
        return await this.checkExpansionPermission(context, action, resource);
      
      case 'preparation':
        return await this.checkPreparationPermission(context, action, resource);
      
      case 'store-files':
        return await this.checkStoreFilesPermission(context, action, resource);
      
      case 'operation':
        return await this.checkOperationPermission(context, action, resource);
      
      case 'approval':
        return await this.checkApprovalPermission(context, action, resource);
      
      default:
        return { allowed: true }; // 默认允许（基础权限检查已通过）
    }
  }

  /**
   * 开店计划权限检查
   */
  private async checkStorePlanPermission(
    context: PermissionContext,
    action: string,
    resource: ResourceContext
  ): Promise<PermissionCheck> {
    if (!resource.resourceId) {
      return { allowed: true }; // 新建操作或列表查看
    }

    try {
      const storePlan = await prisma.storePlan.findUnique({
        where: { id: resource.resourceId },
        select: {
          createdById: true,
          regionId: true,
          status: true,
        },
      });

      if (!storePlan) {
        return { allowed: false, reason: '资源不存在' };
      }

      // 创建者或管理员可以操作
      if (storePlan.createdById === context.userId) {
        return { allowed: true };
      }

      // 部门权限检查（如果实现了区域-部门映射）
      // if (context.departmentId && this.isRegionAccessible(storePlan.regionId, context.departmentId)) {
      //   return { allowed: true };
      // }

      // 根据操作类型进行不同的权限检查
      switch (action) {
        case 'read':
          return { allowed: true }; // 读权限相对宽松
        case 'update':
          return storePlan.status === 'DRAFT' 
            ? { allowed: true }
            : { allowed: false, reason: '只能修改草稿状态的计划' };
        case 'delete':
          return storePlan.status === 'DRAFT'
            ? { allowed: true }
            : { allowed: false, reason: '只能删除草稿状态的计划' };
        case 'approve':
          return { allowed: true }; // 有审批权限的用户都可以审批
        default:
          return { allowed: true };
      }

    } catch (error) {
      logger.error('Store plan permission check failed', { error });
      return { allowed: false, reason: '权限检查失败' };
    }
  }

  /**
   * 拓店管理权限检查
   */
  private async checkExpansionPermission(
    context: PermissionContext,
    action: string,
    resource: ResourceContext
  ): Promise<PermissionCheck> {
    if (!resource.resourceId) {
      return { allowed: true };
    }

    try {
      const location = await prisma.candidateLocation.findUnique({
        where: { id: resource.resourceId },
        select: {
          regionId: true,
          status: true,
          followUpRecords: {
            where: { assigneeId: context.userId },
            select: { id: true },
          },
        },
      });

      if (!location) {
        return { allowed: false, reason: '资源不存在' };
      }

      // 如果用户是该点位的跟进负责人
      if (location.followUpRecords.length > 0) {
        return { allowed: true };
      }

      // 区域权限检查
      // 这里可以根据用户部门和区域的关系进行权限判断

      return { allowed: true }; // 默认允许有权限的用户操作

    } catch (error) {
      logger.error('Expansion permission check failed', { error });
      return { allowed: false, reason: '权限检查失败' };
    }
  }

  /**
   * 开店筹备权限检查
   */
  private async checkPreparationPermission(
    context: PermissionContext,
    action: string,
    resource: ResourceContext
  ): Promise<PermissionCheck> {
    // 实现筹备权限检查逻辑
    return { allowed: true };
  }

  /**
   * 门店档案权限检查
   */
  private async checkStoreFilesPermission(
    context: PermissionContext,
    action: string,
    resource: ResourceContext
  ): Promise<PermissionCheck> {
    if (!resource.resourceId) {
      return { allowed: true };
    }

    try {
      const storeFile = await prisma.storeFile.findUnique({
        where: { id: resource.resourceId },
        select: {
          entityId: true,
          storeType: true,
        },
      });

      if (!storeFile) {
        return { allowed: false, reason: '资源不存在' };
      }

      // 加盟商只能查看自己的门店
      if (context.roles.includes('FRANCHISEE')) {
        // 这里需要检查用户是否是该门店的加盟商
        // 具体逻辑需要根据业务规则实现
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Store files permission check failed', { error });
      return { allowed: false, reason: '权限检查失败' };
    }
  }

  /**
   * 门店运营权限检查
   */
  private async checkOperationPermission(
    context: PermissionContext,
    action: string,
    resource: ResourceContext
  ): Promise<PermissionCheck> {
    // 实现运营权限检查逻辑
    return { allowed: true };
  }

  /**
   * 审批权限检查
   */
  private async checkApprovalPermission(
    context: PermissionContext,
    action: string,
    resource: ResourceContext
  ): Promise<PermissionCheck> {
    if (!resource.resourceId) {
      return { allowed: true };
    }

    try {
      const approval = await prisma.approvalFlow.findUnique({
        where: { id: resource.resourceId },
        select: {
          createdById: true,
          status: true,
          currentStep: true,
        },
      });

      if (!approval) {
        return { allowed: false, reason: '资源不存在' };
      }

      // 创建者可以查看和取消
      if (approval.createdById === context.userId) {
        if (action === 'read' || (action === 'update' && approval.status === 'DRAFT')) {
          return { allowed: true };
        }
      }

      // 审批人可以进行审批操作
      if (action === 'approve') {
        // 这里需要检查用户是否是当前步骤的审批人
        // 具体逻辑需要查询审批模板和当前步骤配置
        return { allowed: true };
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Approval permission check failed', { error });
      return { allowed: false, reason: '权限检查失败' };
    }
  }
}

const permissionService = new PermissionService();

/**
 * 权限检查中间件工厂
 * 创建检查特定权限的中间件
 */
export const requirePermission = (permission: string) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user?.isAuthenticated) {
      return reply.status(401).send({
        success: false,
        message: '请先登录',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const context: PermissionContext = {
      userId: request.user.id,
      roles: request.user.roles || [],
      permissions: request.user.permissions || [],
      departmentId: request.user.departmentId,
      isAdmin: request.user.roles?.includes('ADMIN') || false,
    };

    // 从请求中提取资源上下文
    const resource: ResourceContext | undefined = extractResourceContext(request);

    const permissionCheck = await permissionService.checkPermission(context, permission, resource);

    if (!permissionCheck.allowed) {
      logger.warn('Permission denied', {
        userId: context.userId,
        permission,
        reason: permissionCheck.reason,
        path: request.url,
      });

      return reply.status(403).send({
        success: false,
        message: permissionCheck.reason || '权限不足',
        code: 'PERMISSION_DENIED',
        details: {
          required: permissionCheck.requiredPermission,
          current: permissionCheck.currentPermissions,
        },
      });
    }

    logger.debug('Permission granted', {
      userId: context.userId,
      permission,
      path: request.url,
    });
  };
};

/**
 * 角色检查中间件工厂
 * 检查用户是否具有指定角色
 */
export const requireRole = (roles: string | string[]) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user?.isAuthenticated) {
      return reply.status(401).send({
        success: false,
        message: '请先登录',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const userRoles = request.user.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      logger.warn('Role access denied', {
        userId: request.user.id,
        userRoles,
        requiredRoles,
        path: request.url,
      });

      return reply.status(403).send({
        success: false,
        message: '角色权限不足',
        code: 'ROLE_ACCESS_DENIED',
        details: {
          required: requiredRoles,
          current: userRoles,
        },
      });
    }

    logger.debug('Role access granted', {
      userId: request.user.id,
      userRoles,
      requiredRoles,
      path: request.url,
    });
  };
};

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * 业务人员权限检查中间件
 */
export const requireBusinessAccess = requireRole([
  'ADMIN',
  'PRESIDENT_OFFICE',
  'BUSINESS_STAFF',
  'OPERATIONS_STAFF',
]);

/**
 * 财务人员权限检查中间件
 */
export const requireFinanceAccess = requireRole([
  'ADMIN',
  'FINANCE_STAFF',
]);

/**
 * 组合权限检查中间件
 * 支持"或"逻辑的权限检查
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user?.isAuthenticated) {
      return reply.status(401).send({
        success: false,
        message: '请先登录',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const context: PermissionContext = {
      userId: request.user.id,
      roles: request.user.roles || [],
      permissions: request.user.permissions || [],
      departmentId: request.user.departmentId,
      isAdmin: request.user.roles?.includes('ADMIN') || false,
    };

    // 检查是否有任一权限
    let hasPermission = false;
    let lastCheck: PermissionCheck = { allowed: false };

    for (const permission of permissions) {
      const resource = extractResourceContext(request);
      const check = await permissionService.checkPermission(context, permission, resource);
      
      if (check.allowed) {
        hasPermission = true;
        break;
      }
      lastCheck = check;
    }

    if (!hasPermission) {
      return reply.status(403).send({
        success: false,
        message: lastCheck.reason || '权限不足',
        code: 'PERMISSION_DENIED',
        details: {
          required: permissions,
          current: context.permissions,
        },
      });
    }
  };
};

/**
 * 从请求中提取资源上下文
 */
function extractResourceContext(request: FastifyRequest): ResourceContext | undefined {
  // 从路径参数中提取资源信息
  const params = request.params as any;
  
  if (params.id) {
    // 根据URL路径确定资源类型
    const path = request.url.split('?')[0];
    
    if (path.includes('/store-plans/')) {
      return {
        resourceType: 'store-plan',
        resourceId: params.id,
      };
    }
    
    if (path.includes('/expansion/')) {
      return {
        resourceType: 'candidate-location',
        resourceId: params.id,
      };
    }
    
    if (path.includes('/preparation/')) {
      return {
        resourceType: 'construction-project',
        resourceId: params.id,
      };
    }
    
    if (path.includes('/store-files/')) {
      return {
        resourceType: 'store-file',
        resourceId: params.id,
      };
    }
    
    if (path.includes('/operation/')) {
      return {
        resourceType: 'payment-item',
        resourceId: params.id,
      };
    }
    
    if (path.includes('/approval/')) {
      return {
        resourceType: 'approval-flow',
        resourceId: params.id,
      };
    }
  }

  return undefined;
}

/**
 * 创建自定义权限检查中间件
 * 支持动态权限逻辑
 */
export const createPermissionCheck = (
  checkFn: (context: PermissionContext, resource?: ResourceContext) => Promise<PermissionCheck>
) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user?.isAuthenticated) {
      return reply.status(401).send({
        success: false,
        message: '请先登录',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const context: PermissionContext = {
      userId: request.user.id,
      roles: request.user.roles || [],
      permissions: request.user.permissions || [],
      departmentId: request.user.departmentId,
      isAdmin: request.user.roles?.includes('ADMIN') || false,
    };

    const resource = extractResourceContext(request);
    const permissionCheck = await checkFn(context, resource);

    if (!permissionCheck.allowed) {
      return reply.status(403).send({
        success: false,
        message: permissionCheck.reason || '权限不足',
        code: 'PERMISSION_DENIED',
      });
    }
  };
};