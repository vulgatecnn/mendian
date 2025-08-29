/**
 * 认证相关类型定义
 */
import { z } from 'zod';

// ===============================
// 认证基础类型
// ===============================

export interface JWTPayload {
  id: string;
  username: string;
  name: string;
  email?: string;
  departmentId?: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: string;
  username: string;
  jti: string; // JWT ID for refresh token tracking
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  name: string;
  nickname?: string;
  avatar?: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    fullPath?: string;
  };
  roles: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    code: string;
    module: string;
    action: string;
  }>;
  status: string;
  lastLoginAt?: Date;
  createdAt: Date;
}

// ===============================
// 登录响应类型
// ===============================

export interface LoginResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// ===============================
// Session管理类型
// ===============================

export interface SessionData {
  userId: string;
  username: string;
  loginAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActivity: Date;
  isActive: boolean;
}

export interface TokenBlacklist {
  jti: string;
  userId: string;
  blacklistedAt: Date;
  expiresAt: Date;
  reason: string;
}

// ===============================
// 请求验证Schemas
// ===============================

// 登录请求验证
export const loginSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名不超过50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(100, '密码不超过100个字符'),
  remember: z.boolean().optional().default(false),
  captcha: z.string().optional(),
});

// 密码修改验证
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string()
    .min(8, '新密码至少8个字符')
    .max(100, '新密码不超过100个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, 
           '新密码必须包含大小写字母和数字'),
  confirmPassword: z.string().min(1, '确认密码不能为空'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "密码确认不匹配",
  path: ["confirmPassword"],
});

// 刷新令牌验证
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '刷新令牌不能为空'),
});

// 用户注册验证 (管理员创建用户)
export const createUserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名不超过50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string()
    .email('无效的邮箱格式')
    .optional(),
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '无效的手机号码')
    .optional(),
  name: z.string()
    .min(2, '姓名至少2个字符')
    .max(50, '姓名不超过50个字符'),
  nickname: z.string()
    .max(50, '昵称不超过50个字符')
    .optional(),
  jobTitle: z.string()
    .max(100, '职位不超过100个字符')
    .optional(),
  employeeId: z.string()
    .max(50, '工号不超过50个字符')
    .optional(),
  departmentId: z.string().cuid('无效的部门ID').optional(),
  roleIds: z.array(z.string().cuid('无效的角色ID'))
    .min(1, '至少选择一个角色')
    .optional(),
  password: z.string()
    .min(8, '密码至少8个字符')
    .max(100, '密码不超过100个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, 
           '密码必须包含大小写字母和数字')
    .optional(), // 可选，如果不提供则生成默认密码
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
    .default('ACTIVE'),
});

// 用户更新验证
export const updateUserSchema = z.object({
  email: z.string().email('无效的邮箱格式').optional(),
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '无效的手机号码')
    .optional(),
  name: z.string()
    .min(2, '姓名至少2个字符')
    .max(50, '姓名不超过50个字符')
    .optional(),
  nickname: z.string()
    .max(50, '昵称不超过50个字符')
    .optional(),
  avatar: z.string().url('无效的头像URL').optional(),
  jobTitle: z.string()
    .max(100, '职位不超过100个字符')
    .optional(),
  departmentId: z.string().cuid('无效的部门ID').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

// 角色分配验证
export const assignRolesSchema = z.object({
  userId: z.string().cuid('无效的用户ID'),
  roleIds: z.array(z.string().cuid('无效的角色ID'))
    .min(1, '至少选择一个角色'),
});

// 用户搜索验证
export const userSearchSchema = z.object({
  keyword: z.string().optional(),
  departmentId: z.string().cuid('无效的部门ID').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  role: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'username', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ===============================
// 响应类型验证
// ===============================

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().optional(),
    name: z.string(),
    nickname: z.string().optional(),
    avatar: z.string().optional(),
    departmentId: z.string().optional(),
    department: z.object({
      id: z.string(),
      name: z.string(),
      fullPath: z.string().optional(),
    }).optional(),
    roles: z.array(z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      type: z.string(),
    })),
    permissions: z.array(z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      module: z.string(),
      action: z.string(),
    })),
    status: z.string(),
    lastLoginAt: z.date().optional(),
    createdAt: z.date(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.string(),
});

// ===============================
// 导出类型推断
// ===============================

export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type AssignRolesRequest = z.infer<typeof assignRolesSchema>;
export type UserSearchParams = z.infer<typeof userSearchSchema>;
export type LoginResponseData = z.infer<typeof loginResponseSchema>;