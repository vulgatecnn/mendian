import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { appConfig } from '@/config/index.js';
import { UnauthorizedError, BadRequestError, NotFoundError } from '@/utils/errors.js';
import { weChatWorkService } from './wechat-work.service.js';
import { redisService } from './redis.service.js';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

export interface LoginResult {
  user: {
    id: string;
    username: string;
    name: string;
    email?: string;
    avatar?: string;
    roles: string[];
  };
  token: string;
  refreshToken: string;
}

export const authService = {
  // 用户名密码登录
  login: async (username: string, password: string): Promise<LoginResult> => {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('用户不存在或已被禁用');
    }

    // 验证密码 (这里简化处理，实际项目中用户可能没有密码字段，只通过企业微信登录)
    // const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    // if (!isPasswordValid) {
    //   throw new UnauthorizedError('密码错误');
    // }

    // 生成令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      appConfig.JWT_SECRET,
      { expiresIn: appConfig.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      appConfig.JWT_REFRESH_SECRET,
      { expiresIn: appConfig.JWT_REFRESH_EXPIRES_IN }
    );

    // 缓存用户会话
    await redisService.setUserSession(user.id, token, refreshToken);

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map(ur => ur.role.code);

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        roles,
      },
      token,
      refreshToken,
    };
  },

  // 获取企业微信OAuth URL
  getWeChatOAuthUrl: (): string => {
    const baseUrl = 'https://open.work.weixin.qq.com/wwopen/oauth2/authorize';
    const params = new URLSearchParams({
      appid: appConfig.WECHAT_WORK_CORP_ID,
      redirect_uri: appConfig.WECHAT_WORK_REDIRECT_URI,
      response_type: 'code',
      scope: 'snsapi_base',
      agentid: appConfig.WECHAT_WORK_AGENT_ID,
    });

    return `${baseUrl}?${params.toString()}#wechat_redirect`;
  },

  // 处理企业微信OAuth回调
  handleWeChatCallback: async (code: string): Promise<LoginResult> => {
    try {
      // 获取企业微信用户信息
      const weChatUser = await weChatWorkService.getUserInfo(code);
      
      // 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { wechatId: weChatUser.userId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        // 创建新用户
        user = await prisma.user.create({
          data: {
            wechatId: weChatUser.userId,
            username: weChatUser.userId,
            name: weChatUser.name,
            email: weChatUser.email,
            avatar: weChatUser.avatar,
            departmentId: weChatUser.departmentId,
          },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        logger.info(`Created new user from WeChat: ${user.username}`);
      } else if (!user.isActive) {
        throw new UnauthorizedError('用户已被禁用');
      }

      // 生成令牌
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        appConfig.JWT_SECRET,
        { expiresIn: appConfig.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        appConfig.JWT_REFRESH_SECRET,
        { expiresIn: appConfig.JWT_REFRESH_EXPIRES_IN }
      );

      // 缓存用户会话
      await redisService.setUserSession(user.id, token, refreshToken);

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const roles = user.userRoles.map(ur => ur.role.code);

      return {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          roles,
        },
        token,
        refreshToken,
      };

    } catch (error) {
      logger.error('WeChat callback handling failed:', error);
      throw new UnauthorizedError('企业微信登录失败');
    }
  },

  // 刷新访问令牌
  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    try {
      const payload = jwt.verify(refreshToken, appConfig.JWT_REFRESH_SECRET) as {
        userId: string;
        type: string;
      };

      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('无效的刷新令牌');
      }

      // 检查用户是否存在且活跃
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('用户不存在或已被禁用');
      }

      // 生成新的令牌
      const newToken = jwt.sign(
        { userId: user.id, username: user.username },
        appConfig.JWT_SECRET,
        { expiresIn: appConfig.JWT_EXPIRES_IN }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        appConfig.JWT_REFRESH_SECRET,
        { expiresIn: appConfig.JWT_REFRESH_EXPIRES_IN }
      );

      // 更新缓存
      await redisService.setUserSession(user.id, newToken, newRefreshToken);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('无效的刷新令牌');
      }
      throw error;
    }
  },

  // 用户登出
  logout: async (token: string): Promise<void> => {
    try {
      const payload = jwt.verify(token, appConfig.JWT_SECRET) as {
        userId: string;
      };

      // 从缓存中删除用户会话
      await redisService.deleteUserSession(payload.userId);
      
      // 将令牌加入黑名单
      await redisService.addTokenToBlacklist(token);

    } catch (error) {
      // 即使token无效，也不抛出错误，因为登出应该总是成功的
      logger.warn('Logout with invalid token:', error);
    }
  },

  // 获取当前用户信息
  getCurrentUser: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        department: {
          select: {
            id: true,
            name: true,
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
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 提取角色和权限
    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
    }));

    const permissions = user.userRoles
      .flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission))
      .filter((permission, index, self) => 
        self.findIndex(p => p.id === permission.id) === index
      );

    return {
      ...user,
      roles,
      permissions,
    };
  },
};