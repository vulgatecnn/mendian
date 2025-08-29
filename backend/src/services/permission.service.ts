/**
 * 权限管理服务
 * 负责权限CRUD操作、权限检查等
 */
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../types/permission.js';
import type {
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionSearchParams,
  Permission,
} from '../types/permission.js';

export class PermissionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建权限
   */
  async createPermission(data: CreatePermissionRequest, createdBy?: string): Promise<Permission> {
    try {
      // 检查权限名称是否已存在
      const existingPermissionName = await this.prisma.permission.findUnique({
        where: { name: data.name },
      });

      if (existingPermissionName) {
        throw new AppError('权限名称已存在', 400);
      }

      // 检查权限码是否已存在
      const existingPermissionCode = await this.prisma.permission.findUnique({
        where: { code: data.code },
      });

      if (existingPermissionCode) {
        throw new AppError('权限码已存在', 400);
      }

      // 检查模块-动作-资源组合是否已存在
      const existingCombination = await this.prisma.permission.findFirst({
        where: {
          module: data.module,
          action: data.action,
          resource: data.resource || null,
        },
      });

      if (existingCombination) {
        throw new AppError('相同的权限组合已存在', 400);
      }

      // 创建权限
      const permission = await this.prisma.permission.create({
        data: {
          name: data.name,
          code: data.code,
          module: data.module,
          action: data.action,
          resource: data.resource,
          description: data.description,
          status: data.status || 'ACTIVE',
          isSystem: false,
        },
      });

      logger.info(`Permission created`, { 
        permissionId: permission.id,
        permissionCode: permission.code,
        createdBy 
      });

      return {
        id: permission.id,
        name: permission.name,
        code: permission.code,
        module: permission.module,
        action: permission.action,
        resource: permission.resource ?? undefined,
        description: permission.description ?? undefined,
        status: permission.status,
        isSystem: permission.isSystem,
      };

    } catch (error) {
      logger.error('Create permission failed', { data: { name: data.name, code: data.code }, error });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('权限创建失败', 500, error);
    }
  }

  /**
   * 根据ID获取权限
   */
  async getPermissionById(id: string): Promise<Permission> {
    try {
      const permission = await this.prisma.permission.findUnique({
        where: { id },
      });

      if (!permission) {
        throw new AppError('权限不存在', 404);
      }

      return {
        id: permission.id,
        name: permission.name,
        code: permission.code,
        module: permission.module,
        action: permission.action,
        resource: permission.resource ?? undefined,
        description: permission.description ?? undefined,
        status: permission.status,
        isSystem: permission.isSystem,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取权限信息失败', 500, error);
    }
  }

  /**
   * 更新权限信息
   */
  async updatePermission(id: string, data: UpdatePermissionRequest, updatedBy?: string): Promise<Permission> {
    try {
      // 检查权限是否存在
      const existingPermission = await this.prisma.permission.findUnique({
        where: { id },
      });

      if (!existingPermission) {
        throw new AppError('权限不存在', 404);
      }

      // 系统权限不允许修改
      if (existingPermission.isSystem) {
        throw new AppError('系统权限不允许修改', 403);
      }

      // 检查权限名称唯一性
      if (data.name && data.name !== existingPermission.name) {
        const nameExists = await this.prisma.permission.findUnique({
          where: { 
            name: data.name,
            NOT: { id }
          },
        });

        if (nameExists) {
          throw new AppError('权限名称已存在', 400);
        }
      }

      // 更新权限信息
      const permission = await this.prisma.permission.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          status: data.status,
        },
      });

      logger.info(`Permission updated`, { permissionId: id, updatedBy });

      return {
        id: permission.id,
        name: permission.name,
        code: permission.code,
        module: permission.module,
        action: permission.action,
        resource: permission.resource ?? undefined,
        description: permission.description ?? undefined,
        status: permission.status,
        isSystem: permission.isSystem,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('权限更新失败', 500, error);
    }
  }

  /**
   * 删除权限（软删除）
   */
  async deletePermission(id: string, deletedBy?: string): Promise<void> {
    try {
      const permission = await this.prisma.permission.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            select: { id: true },
          },
        },
      });

      if (!permission) {
        throw new AppError('权限不存在', 404);
      }

      // 系统权限不允许删除
      if (permission.isSystem) {
        throw new AppError('系统权限不允许删除', 403);
      }

      // 检查是否有角色使用此权限
      if (permission.rolePermissions.length > 0) {
        throw new AppError('该权限正在被使用，无法删除', 400);
      }

      // 软删除：将状态设置为DELETED
      await this.prisma.permission.update({
        where: { id },
        data: { 
          status: 'DELETED',
        },
      });

      logger.info(`Permission deleted`, { permissionId: id, deletedBy });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('权限删除失败', 500, error);
    }
  }

  /**
   * 搜索权限
   */
  async searchPermissions(params: PermissionSearchParams): Promise<{
    permissions: Permission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        keyword,
        module,
        action,
        status,
        page,
        limit,
        sortBy,
        sortOrder
      } = params;

      // 构建查询条件
      const where: any = {};

      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: 'insensitive' } },
          { code: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ];
      }

      if (module) {
        where.module = module;
      }

      if (action) {
        where.action = action;
      }

      if (status) {
        where.status = status;
      }

      // 排序配置
      const orderBy: any = {};
      switch (sortBy) {
        case 'name':
          orderBy.name = sortOrder;
          break;
        case 'code':
          orderBy.code = sortOrder;
          break;
        case 'module':
          orderBy.module = sortOrder;
          break;
        case 'createdAt':
        default:
          orderBy.createdAt = sortOrder;
          break;
      }

      // 执行查询
      const [permissions, total] = await Promise.all([
        this.prisma.permission.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.permission.count({ where }),
      ]);

      // 转换为Permission格式
      const permissionList: Permission[] = permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        code: permission.code,
        module: permission.module,
        action: permission.action,
        resource: permission.resource ?? undefined,
        description: permission.description ?? undefined,
        status: permission.status,
        isSystem: permission.isSystem,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        permissions: permissionList,
        total,
        page,
        limit,
        totalPages,
      };

    } catch (error) {
      logger.error('Search permissions failed', { params, error });
      throw new AppError('权限搜索失败', 500, error);
    }
  }

  /**
   * 按模块分组获取权限
   */
  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: [
          { module: 'asc' },
          { action: 'asc' },
        ],
      });

      const permissionsByModule: Record<string, Permission[]> = {};

      permissions.forEach(permission => {
        if (!permissionsByModule[permission.module]) {
          permissionsByModule[permission.module] = [];
        }

        permissionsByModule[permission.module].push({
          id: permission.id,
          name: permission.name,
          code: permission.code,
          module: permission.module,
          action: permission.action,
          resource: permission.resource ?? undefined,
          description: permission.description ?? undefined,
          status: permission.status,
          isSystem: permission.isSystem,
        });
      });

      return permissionsByModule;

    } catch (error) {
      throw new AppError('获取权限模块失败', 500, error);
    }
  }

  /**
   * 获取所有可用权限（用于角色分配等）
   */
  async getAvailablePermissions(): Promise<Permission[]> {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: [
          { module: 'asc' },
          { action: 'asc' },
        ],
      });

      return permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        code: permission.code,
        module: permission.module,
        action: permission.action,
        resource: permission.resource ?? undefined,
        description: permission.description ?? undefined,
        status: permission.status,
        isSystem: permission.isSystem,
      }));

    } catch (error) {
      throw new AppError('获取可用权限失败', 500, error);
    }
  }

  /**
   * 初始化系统权限
   * 创建预定义的权限数据
   */
  async initializeSystemPermissions(): Promise<void> {
    try {
      const systemPermissions: Array<{
        name: string;
        code: string;
        module: string;
        action: string;
        resource?: string;
        description: string;
      }> = [];

      // 构建系统权限列表
      Object.entries(PERMISSIONS).forEach(([moduleName, modulePermissions]) => {
        Object.entries(modulePermissions).forEach(([actionName, permissionCode]) => {
          const [module, action, resource] = permissionCode.split(':');
          
          systemPermissions.push({
            name: `${moduleName}_${actionName}`,
            code: permissionCode,
            module,
            action,
            resource,
            description: `${moduleName}模块的${actionName}权限`,
          });
        });
      });

      // 批量创建权限（如果不存在）
      for (const permData of systemPermissions) {
        const existing = await this.prisma.permission.findUnique({
          where: { code: permData.code },
        });

        if (!existing) {
          await this.prisma.permission.create({
            data: {
              ...permData,
              status: 'ACTIVE',
              isSystem: true,
            },
          });
        }
      }

      logger.info('System permissions initialized');

    } catch (error) {
      logger.error('Initialize system permissions failed', { error });
      throw new AppError('系统权限初始化失败', 500, error);
    }
  }

  /**
   * 初始化系统角色
   * 创建预定义的角色并分配权限
   */
  async initializeSystemRoles(): Promise<void> {
    try {
      // 获取所有权限
      const allPermissions = await this.prisma.permission.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, code: true },
      });

      const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

      // 创建系统角色
      for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
        const existingRole = await this.prisma.role.findUnique({
          where: { code: roleCode },
        });

        if (!existingRole) {
          // 创建角色
          const role = await this.prisma.role.create({
            data: {
              name: this.getRoleDisplayName(roleCode),
              code: roleCode,
              type: roleCode as any,
              description: `系统预设${this.getRoleDisplayName(roleCode)}角色`,
              status: 'ACTIVE',
              isSystem: true,
            },
          });

          // 分配权限
          const rolePermissions = permissionCodes
            .map(code => permissionMap.get(code))
            .filter(id => id) // 过滤掉不存在的权限
            .map(permissionId => ({
              roleId: role.id,
              permissionId: permissionId!,
            }));

          if (rolePermissions.length > 0) {
            await this.prisma.rolePermission.createMany({
              data: rolePermissions,
            });
          }

          logger.info(`System role created: ${roleCode}`);
        }
      }

      logger.info('System roles initialized');

    } catch (error) {
      logger.error('Initialize system roles failed', { error });
      throw new AppError('系统角色初始化失败', 500, error);
    }
  }

  /**
   * 获取角色显示名称
   */
  private getRoleDisplayName(roleCode: string): string {
    const roleNames: Record<string, string> = {
      'ADMIN': '系统管理员',
      'PRESIDENT_OFFICE': '总裁办人员',
      'BUSINESS_STAFF': '商务人员',
      'OPERATIONS_STAFF': '运营人员',
      'SALES_STAFF': '销售人员',
      'FINANCE_STAFF': '财务人员',
      'FRANCHISEE': '加盟商',
      'STORE_MANAGER': '店长',
    };

    return roleNames[roleCode] || roleCode;
  }

  /**
   * 检查用户权限
   */
  async checkUserPermission(userId: string, permissionCode: string): Promise<boolean> {
    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // 检查是否有管理员角色
      const hasAdminRole = userRoles.some(ur => ur.role.code === 'ADMIN');
      if (hasAdminRole) {
        return true;
      }

      // 检查具体权限
      const hasPermission = userRoles.some(ur =>
        ur.role.rolePermissions.some(rp => 
          rp.permission.code === permissionCode || rp.permission.code === '*'
        )
      );

      return hasPermission;

    } catch (error) {
      logger.error('Check user permission failed', { userId, permissionCode, error });
      return false;
    }
  }

  /**
   * 获取模块列表
   */
  async getModules(): Promise<Array<{
    module: string;
    count: number;
    permissions: string[];
  }>> {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: { status: 'ACTIVE' },
        select: { module: true, action: true },
      });

      const moduleMap = new Map<string, { count: number; permissions: Set<string> }>();

      permissions.forEach(p => {
        if (!moduleMap.has(p.module)) {
          moduleMap.set(p.module, { count: 0, permissions: new Set() });
        }
        const moduleData = moduleMap.get(p.module)!;
        moduleData.count++;
        moduleData.permissions.add(p.action);
      });

      return Array.from(moduleMap.entries()).map(([module, data]) => ({
        module,
        count: data.count,
        permissions: Array.from(data.permissions),
      }));

    } catch (error) {
      throw new AppError('获取模块列表失败', 500, error);
    }
  }
}

// 创建单例实例
const prisma = new PrismaClient();
export const permissionService = new PermissionService(prisma);