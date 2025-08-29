/**
 * 角色管理服务
 * 负责角色CRUD操作、权限分配等
 */
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest,
  RoleSearchParams,
  Role,
} from '../types/permission.js';

export class RoleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建角色
   */
  async createRole(data: CreateRoleRequest, createdBy?: string): Promise<Role> {
    try {
      // 检查角色名称是否已存在
      const existingRoleName = await this.prisma.role.findUnique({
        where: { name: data.name },
      });

      if (existingRoleName) {
        throw new AppError('角色名称已存在', 400);
      }

      // 检查角色编码是否已存在
      const existingRoleCode = await this.prisma.role.findUnique({
        where: { code: data.code },
      });

      if (existingRoleCode) {
        throw new AppError('角色编码已存在', 400);
      }

      // 验证权限是否存在
      if (data.permissionIds && data.permissionIds.length > 0) {
        const permissions = await this.prisma.permission.findMany({
          where: {
            id: { in: data.permissionIds },
            status: 'ACTIVE',
          },
        });

        if (permissions.length !== data.permissionIds.length) {
          throw new AppError('部分权限不存在或已被禁用', 400);
        }
      }

      // 创建角色（在事务中）
      const role = await this.prisma.$transaction(async (tx) => {
        // 创建角色记录
        const newRole = await tx.role.create({
          data: {
            name: data.name,
            code: data.code,
            type: data.type,
            description: data.description,
            status: data.status || 'ACTIVE',
            sortOrder: data.sortOrder,
          },
        });

        // 分配权限
        if (data.permissionIds && data.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissionIds.map(permissionId => ({
              roleId: newRole.id,
              permissionId,
            })),
          });
        }

        return newRole;
      });

      logger.info(`Role created`, { 
        roleId: role.id,
        roleName: role.name,
        createdBy 
      });

      // 返回完整的角色信息
      return await this.getRoleById(role.id);

    } catch (error) {
      logger.error('Create role failed', { data: { name: data.name, code: data.code }, error });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('角色创建失败', 500, error);
    }
  }

  /**
   * 根据ID获取角色
   */
  async getRoleById(id: string): Promise<Role> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        throw new AppError('角色不存在', 404);
      }

      // 构建角色信息
      const permissions = role.rolePermissions.map(rp => rp.permission);

      return {
        id: role.id,
        name: role.name,
        code: role.code,
        type: role.type,
        description: role.description ?? undefined,
        isSystem: role.isSystem,
        status: role.status,
        permissions,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取角色信息失败', 500, error);
    }
  }

  /**
   * 更新角色信息
   */
  async updateRole(id: string, data: UpdateRoleRequest, updatedBy?: string): Promise<Role> {
    try {
      // 检查角色是否存在
      const existingRole = await this.prisma.role.findUnique({
        where: { id },
      });

      if (!existingRole) {
        throw new AppError('角色不存在', 404);
      }

      // 系统角色不允许修改
      if (existingRole.isSystem) {
        throw new AppError('系统角色不允许修改', 403);
      }

      // 检查角色名称唯一性
      if (data.name && data.name !== existingRole.name) {
        const nameExists = await this.prisma.role.findUnique({
          where: { 
            name: data.name,
            NOT: { id }
          },
        });

        if (nameExists) {
          throw new AppError('角色名称已存在', 400);
        }
      }

      // 更新角色信息
      await this.prisma.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          status: data.status,
          sortOrder: data.sortOrder,
        },
      });

      logger.info(`Role updated`, { roleId: id, updatedBy });

      // 返回更新后的角色信息
      return await this.getRoleById(id);

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('角色更新失败', 500, error);
    }
  }

  /**
   * 删除角色（软删除）
   */
  async deleteRole(id: string, deletedBy?: string): Promise<void> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          userRoles: {
            select: { id: true },
          },
        },
      });

      if (!role) {
        throw new AppError('角色不存在', 404);
      }

      // 系统角色不允许删除
      if (role.isSystem) {
        throw new AppError('系统角色不允许删除', 403);
      }

      // 检查是否有用户使用此角色
      if (role.userRoles.length > 0) {
        throw new AppError('该角色正在被使用，无法删除', 400);
      }

      // 软删除：将状态设置为DELETED
      await this.prisma.role.update({
        where: { id },
        data: { 
          status: 'DELETED',
        },
      });

      logger.info(`Role deleted`, { roleId: id, deletedBy });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('角色删除失败', 500, error);
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermissions(data: AssignPermissionsRequest, assignedBy?: string): Promise<void> {
    try {
      // 检查角色是否存在
      const role = await this.prisma.role.findUnique({
        where: { id: data.roleId },
      });

      if (!role) {
        throw new AppError('角色不存在', 404);
      }

      // 系统角色不允许修改权限
      if (role.isSystem) {
        throw new AppError('系统角色权限不允许修改', 403);
      }

      // 检查所有权限是否存在
      const permissions = await this.prisma.permission.findMany({
        where: {
          id: { in: data.permissionIds },
          status: 'ACTIVE',
        },
      });

      if (permissions.length !== data.permissionIds.length) {
        throw new AppError('部分权限不存在或已被禁用', 400);
      }

      // 在事务中更新权限分配
      await this.prisma.$transaction(async (tx) => {
        // 删除现有权限
        await tx.rolePermission.deleteMany({
          where: { roleId: data.roleId },
        });

        // 添加新权限
        if (data.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissionIds.map(permissionId => ({
              roleId: data.roleId,
              permissionId,
            })),
          });
        }
      });

      logger.info(`Permissions assigned to role`, { 
        roleId: data.roleId, 
        permissionIds: data.permissionIds, 
        assignedBy 
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('权限分配失败', 500, error);
    }
  }

  /**
   * 搜索角色
   */
  async searchRoles(params: RoleSearchParams): Promise<{
    roles: Role[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        keyword,
        type,
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

      if (type) {
        where.type = type;
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
        case 'type':
          orderBy.type = sortOrder;
          break;
        case 'createdAt':
          orderBy.createdAt = sortOrder;
          break;
        case 'sortOrder':
        default:
          orderBy.sortOrder = sortOrder;
          orderBy.createdAt = 'desc'; // 次要排序
          break;
      }

      // 执行查询
      const [roles, total] = await Promise.all([
        this.prisma.role.findMany({
          where,
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.role.count({ where }),
      ]);

      // 转换为Role格式
      const roleList: Role[] = roles.map(role => ({
        id: role.id,
        name: role.name,
        code: role.code,
        type: role.type,
        description: role.description ?? undefined,
        isSystem: role.isSystem,
        status: role.status,
        permissions: role.rolePermissions.map(rp => rp.permission),
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        roles: roleList,
        total,
        page,
        limit,
        totalPages,
      };

    } catch (error) {
      logger.error('Search roles failed', { params, error });
      throw new AppError('角色搜索失败', 500, error);
    }
  }

  /**
   * 获取所有可用角色（用于下拉列表等）
   */
  async getAvailableRoles(): Promise<Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    description?: string;
  }>> {
    try {
      const roles = await this.prisma.role.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
          description: true,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      return roles.map(role => ({
        id: role.id,
        name: role.name,
        code: role.code,
        type: role.type,
        description: role.description ?? undefined,
      }));

    } catch (error) {
      throw new AppError('获取可用角色失败', 500, error);
    }
  }

  /**
   * 获取角色权限列表
   */
  async getRolePermissions(roleId: string): Promise<Array<{
    id: string;
    name: string;
    code: string;
    module: string;
    action: string;
    description?: string;
    assignedAt: Date;
  }>> {
    try {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true,
        },
      });

      return rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        module: rp.permission.module,
        action: rp.permission.action,
        description: rp.permission.description ?? undefined,
        assignedAt: rp.createdAt,
      }));

    } catch (error) {
      throw new AppError('获取角色权限失败', 500, error);
    }
  }

  /**
   * 批量更新角色状态
   */
  async batchUpdateRoleStatus(roleIds: string[], status: string, updatedBy?: string): Promise<void> {
    try {
      // 检查是否包含系统角色
      const systemRoles = await this.prisma.role.findMany({
        where: {
          id: { in: roleIds },
          isSystem: true,
        },
        select: { id: true, name: true },
      });

      if (systemRoles.length > 0) {
        throw new AppError(`系统角色不允许批量操作: ${systemRoles.map(r => r.name).join(', ')}`, 403);
      }

      await this.prisma.role.updateMany({
        where: {
          id: { in: roleIds },
          isSystem: false,
        },
        data: { status },
      });

      logger.info(`Batch update role status`, { 
        roleIds, 
        status, 
        updatedBy 
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('批量更新角色状态失败', 500, error);
    }
  }

  /**
   * 复制角色
   */
  async copyRole(sourceRoleId: string, newRoleName: string, newRoleCode: string, copiedBy?: string): Promise<Role> {
    try {
      // 获取源角色信息
      const sourceRole = await this.prisma.role.findUnique({
        where: { id: sourceRoleId },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!sourceRole) {
        throw new AppError('源角色不存在', 404);
      }

      // 检查新角色名称和编码是否已存在
      const [existingName, existingCode] = await Promise.all([
        this.prisma.role.findUnique({ where: { name: newRoleName } }),
        this.prisma.role.findUnique({ where: { code: newRoleCode } }),
      ]);

      if (existingName) {
        throw new AppError('角色名称已存在', 400);
      }

      if (existingCode) {
        throw new AppError('角色编码已存在', 400);
      }

      // 复制角色
      const newRole = await this.prisma.$transaction(async (tx) => {
        // 创建新角色
        const role = await tx.role.create({
          data: {
            name: newRoleName,
            code: newRoleCode,
            type: sourceRole.type,
            description: sourceRole.description ? `${sourceRole.description} (复制)` : '复制的角色',
            status: 'ACTIVE',
            isSystem: false,
            sortOrder: sourceRole.sortOrder,
          },
        });

        // 复制权限
        if (sourceRole.rolePermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: sourceRole.rolePermissions.map(rp => ({
              roleId: role.id,
              permissionId: rp.permissionId,
            })),
          });
        }

        return role;
      });

      logger.info(`Role copied`, { 
        sourceRoleId, 
        newRoleId: newRole.id, 
        copiedBy 
      });

      return await this.getRoleById(newRole.id);

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('角色复制失败', 500, error);
    }
  }
}

// 创建单例实例
const prisma = new PrismaClient();
export const roleService = new RoleService(prisma);