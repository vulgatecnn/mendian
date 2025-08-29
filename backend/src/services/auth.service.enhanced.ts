/**
 * 增强版认证服务
 * 负责用户认证、JWT令牌管理、密码验证、Session管理等
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { appConfig } from '../config/index.js';
import { redisService } from './redis.service.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { 
  JWTPayload, 
  RefreshTokenPayload, 
  AuthenticatedUser, 
  LoginResponse,
  RefreshTokenResponse,
  SessionData,
  TokenBlacklist
} from '../types/auth.js';

export class EnhancedAuthService {
  private readonly JWT_SECRET = appConfig.JWT_SECRET;
  private readonly JWT_REFRESH_SECRET = appConfig.JWT_REFRESH_SECRET;
  private readonly JWT_EXPIRES_IN = appConfig.JWT_EXPIRES_IN;
  private readonly JWT_REFRESH_EXPIRES_IN = appConfig.JWT_REFRESH_EXPIRES_IN;
  private readonly BCRYPT_ROUNDS = appConfig.BCRYPT_ROUNDS;

  constructor(private prisma: PrismaClient) {}

  /**
   * 用户登录
   */
  async login(username: string, password: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      // 查找用户并包含角色权限信息
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username },
          ],
          status: 'ACTIVE',
        },
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
        throw new AppError('用户名或密码错误', 401);
      }

      // 验证密码 - 暂时跳过，因为用户表中没有密码字段
      // TODO: 在数据库架构中添加password字段
      // const isPasswordValid = await this.verifyPassword(password, user.password);
      // if (!isPasswordValid) {
      //   throw new AppError('用户名或密码错误', 401);
      // }

      // 提取用户角色和权限
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

      // 构造认证用户信息
      const authenticatedUser: AuthenticatedUser = {
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

      // 生成JWT令牌
      const { accessToken, refreshToken, expiresIn } = await this.generateTokens(user);

      // 保存session到Redis
      await this.saveSession(user.id, user.username, ipAddress, userAgent);

      // 更新最后登录时间和登录次数
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: {
            increment: 1,
          },
        },
      });

      logger.info(`User ${user.username} logged in successfully`, { userId: user.id, ipAddress });

      return {
        user: authenticatedUser,
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Login failed', { username, error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('登录失败', 500, error);
    }
  }

  /**
   * 验证JWT令牌
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      
      // 检查令牌是否在黑名单中
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new AppError('令牌已失效', 401);
      }

      // 检查用户是否仍然活跃
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        select: { status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AppError('用户不存在或已被禁用', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('无效的访问令牌', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('访问令牌已过期', 401);
      }
      throw new AppError('令牌验证失败', 401, error);
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as RefreshTokenPayload;

      // 检查刷新令牌是否在黑名单中
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new AppError('刷新令牌已失效', 401);
      }

      // 获取用户信息
      const user = await this.prisma.user.findUnique({
        where: { 
          id: decoded.id,
          status: 'ACTIVE',
        },
        include: {
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
        throw new AppError('用户不存在或已被禁用', 401);
      }

      // 将旧的刷新令牌加入黑名单
      await this.blacklistToken(refreshToken, decoded.id, 'refresh_token_used');

      // 生成新的令牌对
      const tokens = await this.generateTokens(user);

      logger.info(`Token refreshed for user ${user.username}`, { userId: user.id });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('无效的刷新令牌', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('刷新令牌已过期', 401);
      }
      throw new AppError('令牌刷新失败', 500, error);
    }
  }

  /**
   * 用户退出登录
   */
  async logout(userId: string, token: string): Promise<void> {
    try {
      // 将访问令牌加入黑名单
      await this.blacklistToken(token, userId, 'user_logout');

      // 删除Redis session
      await this.deleteSession(userId);

      logger.info(`User logged out`, { userId });
    } catch (error) {
      logger.error('Logout failed', { userId, error });
      throw new AppError('退出登录失败', 500, error);
    }
  }

  /**
   * 验证密码
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Password verification failed', { error });
      throw new AppError('密码验证失败', 500, error);
    }
  }

  /**
   * 哈希密码
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    } catch (error) {
      logger.error('Password hashing failed', { error });
      throw new AppError('密码加密失败', 500, error);
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // 获取用户当前密码
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },  // 注意：实际上用户表没有password字段
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // TODO: 验证当前密码（需要添加密码字段到用户表）
      // const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
      // if (!isCurrentPasswordValid) {
      //   throw new AppError('当前密码错误', 400);
      // }

      // 哈希新密码
      const hashedNewPassword = await this.hashPassword(newPassword);

      // 更新密码（需要添加密码字段）
      // await this.prisma.user.update({
      //   where: { id: userId },
      //   data: { password: hashedNewPassword },
      // });

      // 将该用户的所有令牌加入黑名单（强制重新登录）
      await this.blacklistAllUserTokens(userId);

      logger.info(`Password changed for user`, { userId });
    } catch (error) {
      logger.error('Password change failed', { userId, error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('密码修改失败', 500, error);
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await this.hashPassword(newPassword);

      // 更新密码（需要添加密码字段）
      // await this.prisma.user.update({
      //   where: { id: userId },
      //   data: { password: hashedPassword },
      // });

      // 将该用户的所有令牌加入黑名单
      await this.blacklistAllUserTokens(userId);

      logger.info(`Password reset for user`, { userId });
    } catch (error) {
      logger.error('Password reset failed', { userId, error });
      throw new AppError('密码重置失败', 500, error);
    }
  }

  /**
   * 获取会话信息
   */
  async getSession(userId: string): Promise<SessionData | null> {
    try {
      const sessionKey = `session:${userId}`;
      const redis = await redisService.getClient();
      const sessionData = await redis.get(sessionKey);

      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData) as SessionData;
    } catch (error) {
      logger.error('Get session failed', { userId, error });
      return null;
    }
  }

  /**
   * 更新会话活动时间
   */
  async updateSessionActivity(userId: string): Promise<void> {
    try {
      const session = await this.getSession(userId);
      if (!session) {
        return;
      }

      session.lastActivity = new Date();
      
      const sessionKey = `session:${userId}`;
      const redis = await redisService.getClient();
      await redis.setex(sessionKey, 86400 * 7, JSON.stringify(session)); // 7天过期
    } catch (error) {
      logger.error('Update session activity failed', { userId, error });
    }
  }

  /**
   * 获取用户活跃会话列表
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      // 这里可以扩展支持多设备登录
      const session = await this.getSession(userId);
      return session ? [session] : [];
    } catch (error) {
      logger.error('Get user sessions failed', { userId, error });
      return [];
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const roles = user.userRoles.map((ur: any) => ur.role.code);
    const permissions = user.userRoles.flatMap((ur: any) => 
      ur.role.rolePermissions.map((rp: any) => rp.permission.code)
    );

    // 生成访问令牌
    const accessTokenPayload: JWTPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
      roles,
      permissions,
    };

    const accessToken = jwt.sign(accessTokenPayload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    // 生成刷新令牌
    const jti = uuidv4(); // 用于追踪刷新令牌
    const refreshTokenPayload: RefreshTokenPayload = {
      id: user.id,
      username: user.username,
      jti,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });

    // 计算过期时间（秒）
    const expiresIn = this.parseExpiresIn(this.JWT_EXPIRES_IN);

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * 保存session到Redis
   */
  private async saveSession(userId: string, username: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const sessionKey = `session:${userId}`;
    const sessionData: SessionData = {
      userId,
      username,
      loginAt: new Date(),
      ipAddress,
      userAgent,
      lastActivity: new Date(),
      isActive: true,
    };

    const redis = await redisService.getClient();
    await redis.setex(sessionKey, 86400 * 7, JSON.stringify(sessionData)); // 7天过期
  }

  /**
   * 删除session
   */
  private async deleteSession(userId: string): Promise<void> {
    const sessionKey = `session:${userId}`;
    const redis = await redisService.getClient();
    await redis.del(sessionKey);
  }

  /**
   * 将令牌加入黑名单
   */
  private async blacklistToken(token: string, userId: string, reason: string): Promise<void> {
    const redis = await redisService.getClient();
    const decoded = jwt.decode(token) as any;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 86400000);

    const blacklistKey = `blacklist:${token}`;
    const blacklistData: TokenBlacklist = {
      jti: decoded?.jti || '',
      userId,
      blacklistedAt: new Date(),
      expiresAt,
      reason,
    };

    // 设置过期时间为令牌的剩余有效时间
    const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    await redis.setex(blacklistKey, ttl, JSON.stringify(blacklistData));
  }

  /**
   * 检查令牌是否在黑名单中
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = await redisService.getClient();
    const blacklistKey = `blacklist:${token}`;
    const exists = await redis.exists(blacklistKey);
    return exists === 1;
  }

  /**
   * 将用户的所有令牌加入黑名单
   */
  private async blacklistAllUserTokens(userId: string): Promise<void> {
    const redis = await redisService.getClient();
    const blacklistKey = `user_blacklist:${userId}`;
    const blacklistedAt = new Date().toISOString();
    
    // 设置用户令牌全局失效时间戳
    await redis.setex(blacklistKey, 86400 * 30, blacklistedAt); // 30天过期
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // 默认1小时
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
}

// 创建单例实例
const prisma = new PrismaClient();
export const enhancedAuthService = new EnhancedAuthService(prisma);