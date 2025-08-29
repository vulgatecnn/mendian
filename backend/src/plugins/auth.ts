import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { User } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User & {
      roles: string[];
      permissions: string[];
    };
  }
}

interface AuthOptions {
  roles?: string[];
  permissions?: string[];
  optional?: boolean;
}

const authPlugin = async (fastify: FastifyInstance): Promise<void> => {
  // JWT verification decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = await request.jwtVerify();
      
      if (!token || typeof token !== 'object' || !('userId' in token)) {
        throw new UnauthorizedError('Invalid token format');
      }

      const userId = token.userId as string;
      
      // Fetch user with roles and permissions
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
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

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Extract roles and permissions
      const roles = user.userRoles.map(ur => ur.role.code);
      const permissions = user.userRoles
        .flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.code))
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      request.user = {
        ...user,
        roles,
        permissions,
      };

    } catch (error) {
      throw new UnauthorizedError('Authentication failed');
    }
  });

  // Authorization decorator
  fastify.decorate('authorize', (options: AuthOptions = {}) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // If authentication is optional and no user, skip authorization
      if (options.optional && !request.user) {
        return;
      }

      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Check role requirements
      if (options.roles && options.roles.length > 0) {
        const hasRequiredRole = options.roles.some(role => 
          request.user!.roles.includes(role)
        );
        
        if (!hasRequiredRole) {
          throw new ForbiddenError(
            `Required role: ${options.roles.join(' or ')}`
          );
        }
      }

      // Check permission requirements
      if (options.permissions && options.permissions.length > 0) {
        const hasRequiredPermission = options.permissions.some(permission => 
          request.user!.permissions.includes(permission)
        );
        
        if (!hasRequiredPermission) {
          throw new ForbiddenError(
            `Required permission: ${options.permissions.join(' or ')}`
          );
        }
      }
    };
  });

  // Utility function to check if user has permission
  fastify.decorate('hasPermission', (request: FastifyRequest, permission: string): boolean => {
    return request.user?.permissions.includes(permission) ?? false;
  });

  // Utility function to check if user has role
  fastify.decorate('hasRole', (request: FastifyRequest, role: string): boolean => {
    return request.user?.roles.includes(role) ?? false;
  });

  // Pre-handler for routes that need authentication
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip authentication for public routes
    const publicRoutes = [
      '/health',
      '/docs',
      '/auth/login',
      '/auth/wechat',
      '/auth/refresh',
    ];

    const isPublicRoute = publicRoutes.some(route => 
      request.url.startsWith(route)
    );

    if (isPublicRoute) {
      return;
    }

    // For API routes, require authentication
    if (request.url.startsWith('/api/')) {
      await fastify.authenticate(request, reply);
    }
  });
};

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['database'],
});