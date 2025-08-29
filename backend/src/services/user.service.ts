/**
 * 用户管理服务
 * 负责用户CRUD操作、角色分配、状态管理等
 */
import { PrismaClient } from '@prisma/client';
import { enhancedAuthService } from './auth.service.enhanced.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchParams,
  AuthenticatedUser,
} from '../types/auth.js';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建用户
   */
  async createUser(data: CreateUserRequest, createdBy?: string): Promise<AuthenticatedUser> {
    try {
      // 检查用户名是否已存在
      const existingUser = await this.prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser) {
        throw new AppError('用户名已存在', 400);
      }

      // 检查邮箱是否已存在
      if (data.email) {
        const existingEmail = await this.prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingEmail) {
          throw new AppError('邮箱已被使用', 400);
        }
      }

      // 检查工号是否已存在
      if (data.employeeId) {
        const existingEmployeeId = await this.prisma.user.findUnique({
          where: { employeeId: data.employeeId },
        });

        if (existingEmployeeId) {
          throw new AppError('工号已存在', 400);
        }
      }

      // 验证部门是否存在
      if (data.departmentId) {
        const department = await this.prisma.department.findUnique({
          where: { id: data.departmentId },
        });

        if (!department) {
          throw new AppError('部门不存在', 400);
        }
      }

      // 创建用户（在事务中）
      const user = await this.prisma.$transaction(async (tx) => {
        // 创建用户记录
        const newUser = await tx.user.create({
          data: {
            wechatId: `user_${data.username}_${Date.now()}`, // 临时生成，实际应该从企微获取
            username: data.username,
            email: data.email,
            phone: data.phone,
            name: data.name,
            nickname: data.nickname,
            jobTitle: data.jobTitle,
            employeeId: data.employeeId,
            departmentId: data.departmentId,
            status: data.status || 'ACTIVE',
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                fullPath: true,
              },
            },
          },
        });

        // 分配默认角色或指定角色
        if (data.roleIds && data.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: data.roleIds.map(roleId => ({
              userId: newUser.id,
              roleId,
            })),
          });
        }

        return newUser;
      });

      // 记录日志
      logger.info(`User created`, { 
        userId: user.id,
        username: user.username,
        createdBy 
      });

      // 获取完整的用户信息（包括角色和权限）
      return await this.getUserById(user.id);

    } catch (error) {
      logger.error('Create user failed', { data: { username: data.username }, error });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('用户创建失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<AuthenticatedUser> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              fullPath: true,
            },
          },
          userRoles: {
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
          },
        },
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 构建用户信息
      const roles = user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
        type: ur.role.type,
      }));

      const permissions = user.userRoles.flatMap(ur =>
        ur.role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          code: rp.permission.code,
          module: rp.permission.module,
          action: rp.permission.action,
        }))
      );

      return {
        id: user.id,
        username: user.username,
        email: user.email ?? undefined,
        name: user.name,
        nickname: user.nickname ?? undefined,
        avatar: user.avatar ?? undefined,
        departmentId: user.departmentId ?? undefined,
        department: user.department || undefined,
        roles,
        permissions,
        status: user.status,
        lastLoginAt: user.lastLoginAt ?? undefined,
        createdAt: user.createdAt,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取用户信息失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: UpdateUserRequest, updatedBy?: string): Promise<AuthenticatedUser> {
    try {
      // 检查用户是否存在
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new AppError('用户不存在', 404);
      }

      // 检查邮箱唯一性
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { 
            email: data.email,
            NOT: { id }
          },
        });

        if (emailExists) {
          throw new AppError('邮箱已被使用', 400);
        }
      }

      // 验证部门是否存在
      if (data.departmentId) {
        const department = await this.prisma.department.findUnique({
          where: { id: data.departmentId },
        });

        if (!department) {
          throw new AppError('部门不存在', 400);
        }
      }

      // 更新用户信息
      await this.prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          phone: data.phone,
          name: data.name,
          nickname: data.nickname,
          avatar: data.avatar,
          jobTitle: data.jobTitle,
          departmentId: data.departmentId,
          status: data.status,
        },
      });

      logger.info(`User updated`, { userId: id, updatedBy });

      // 返回更新后的用户信息
      return await this.getUserById(id);

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('用户更新失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(id: string, deletedBy?: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 软删除：将状态设置为DELETED
      await this.prisma.user.update({
        where: { id },
        data: { 
          status: 'DELETED',
        },
      });

      // 将用户的所有令牌加入黑名单
      await enhancedAuthService.logout(id, '');

      logger.info(`User deleted`, { userId: id, deletedBy });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('用户删除失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 分配角色给用户
   */
  async assignRoles(userId: string, roleIds: string[], assignedBy?: string): Promise<void> {
    try {
      // 检查用户是否存在
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 检查所有角色是否存在
      const roles = await this.prisma.role.findMany({
        where: {
          id: { in: roleIds },
          status: 'ACTIVE',
        },
      });

      if (roles.length !== roleIds.length) {
        throw new AppError('部分角色不存在或已被禁用', 400);
      }

      // 在事务中更新角色分配
      await this.prisma.$transaction(async (tx) => {
        // 删除现有角色
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // 添加新角色
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map(roleId => ({
              userId,
              roleId,
            })),
          });
        }
      });

      logger.info(`Roles assigned to user`, { 
        userId, 
        roleIds, 
        assignedBy 
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('角色分配失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(params: UserSearchParams): Promise<{
    users: AuthenticatedUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        keyword,
        departmentId,
        status,
        role,
        page,
        limit,
        sortBy,
        sortOrder
      } = params;

      // 构建查询条件
      const where: any = {};

      if (keyword) {
        where.OR = [
          { username: { contains: keyword, mode: 'insensitive' } },
          { name: { contains: keyword, mode: 'insensitive' } },
          { nickname: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
          { employeeId: { contains: keyword, mode: 'insensitive' } },
        ];
      }

      if (departmentId) {
        where.departmentId = departmentId;
      }

      if (status) {
        where.status = status;
      }

      if (role) {
        where.userRoles = {
          some: {
            role: {
              OR: [
                { code: role },
                { name: { contains: role, mode: 'insensitive' } },
              ],
            },
          },
        };
      }

      // 排序配置
      const orderBy: any = {};
      switch (sortBy) {
        case 'name':
          orderBy.name = sortOrder;
          break;
        case 'username':
          orderBy.username = sortOrder;
          break;
        case 'lastLoginAt':
          orderBy.lastLoginAt = sortOrder;
          break;
        case 'createdAt':
        default:
          orderBy.createdAt = sortOrder;
          break;
      }

      // 执行查询
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            department: {
              select: {
                id: true,
                name: true,
                fullPath: true,
              },
            },
            userRoles: {
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
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.user.count({ where }),
      ]);

      // 转换为AuthenticatedUser格式
      const authenticatedUsers: AuthenticatedUser[] = users.map(user => {
        const roles = user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          code: ur.role.code,
          type: ur.role.type,
        }));

        const permissions = user.userRoles.flatMap(ur =>
          ur.role.rolePermissions.map(rp => ({
            id: rp.permission.id,
            name: rp.permission.name,
            code: rp.permission.code,
            module: rp.permission.module,
            action: rp.permission.action,
          }))
        );

        return {
          id: user.id,
          username: user.username,
          email: user.email ?? undefined,
          name: user.name,
          nickname: user.nickname ?? undefined,
          avatar: user.avatar ?? undefined,
          departmentId: user.departmentId ?? undefined,
          department: user.department || undefined,
          roles,
          permissions,
          status: user.status,
          lastLoginAt: user.lastLoginAt ?? undefined,
          createdAt: user.createdAt,
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        users: authenticatedUsers,
        total,
        page,
        limit,
        totalPages,
      };

    } catch (error) {
      logger.error('Search users failed', { params, error });
      throw new AppError('用户搜索失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 获取用户的角色列表
   */
  async getUserRoles(userId: string): Promise<Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    assignedAt: Date;
  }>> {
    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      return userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
        type: ur.role.type,
        assignedAt: ur.createdAt,
      }));

    } catch (error) {
      throw new AppError('获取用户角色失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 获取用户的权限列表
   */
  async getUserPermissions(userId: string): Promise<Array<{
    id: string;
    name: string;
    code: string;
    module: string;
    action: string;
    source: string; // 权限来源（角色名称）
  }>> {
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

      const permissions: Array<{
        id: string;
        name: string;
        code: string;
        module: string;
        action: string;
        source: string;
      }> = [];

      userRoles.forEach(ur => {
        ur.role.rolePermissions.forEach(rp => {
          permissions.push({
            id: rp.permission.id,
            name: rp.permission.name,
            code: rp.permission.code,
            module: rp.permission.module,
            action: rp.permission.action,
            source: ur.role.name,
          });
        });
      });

      // 去重（同一个权限可能通过多个角色获得）
      const uniquePermissions = permissions.filter((permission, index, self) =>
        index === self.findIndex(p => p.id === permission.id)
      );

      return uniquePermissions;

    } catch (error) {
      throw new AppError('获取用户权限失败', 500, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 批量操作用户状态
   */
  async batchUpdateUserStatus(userIds: string[], status: string, updatedBy?: string): Promise<void> {
    try {
      await this.prisma.user.updateMany({
        where: {
          id: { in: userIds },
        },
        data: { status },
      });

      logger.info(`Batch update user status`, { 
        userIds, 
        status, 
        updatedBy 
      });

    } catch (error) {
      throw new AppError('批量更新用户状态失败', 500, error instanceof Error ? error.message : String(error));
    }
  }
}

// 创建单例实例
const prisma = new PrismaClient();
export const userService = new UserService(prisma);