/**
 * 权限系统相关类型定义
 */
import { z } from 'zod';

// ===============================
// 权限系统核心类型
// ===============================

export interface Permission {
  id: string;
  name: string;
  code: string; // 权限码：module:action[:resource]
  module: string; // 模块：store-plan, expansion, etc.
  action: string; // 动作：create, read, update, delete, approve
  resource?: string; // 资源：可选的具体资源标识
  description?: string;
  status: string;
  isSystem: boolean;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  type: string; // UserRoleType enum
  description?: string;
  isSystem: boolean;
  status: string;
  permissions: Permission[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  createdAt: Date;
}

// ===============================
// 权限检查上下文
// ===============================

export interface PermissionContext {
  userId: string;
  roles: string[]; // role codes
  permissions: string[]; // permission codes
  departmentId?: string;
  isAdmin: boolean;
}

export interface ResourceContext {
  resourceType: string; // 资源类型
  resourceId?: string; // 资源ID
  ownerId?: string; // 资源拥有者ID
  departmentId?: string; // 资源所属部门ID
  metadata?: Record<string, any>; // 额外的上下文信息
}

// ===============================
// 权限操作结果
// ===============================

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredPermission?: string;
  currentPermissions?: string[];
}

// ===============================
// 验证Schemas
// ===============================

// 权限创建验证
export const createPermissionSchema = z.object({
  name: z.string()
    .min(2, '权限名称至少2个字符')
    .max(100, '权限名称不超过100个字符'),
  code: z.string()
    .min(3, '权限码至少3个字符')
    .max(100, '权限码不超过100个字符')
    .regex(/^[a-z0-9-]+:[a-z0-9-]+(?::[a-z0-9-]+)?$/, 
           '权限码格式：module:action 或 module:action:resource'),
  module: z.string()
    .min(2, '模块名至少2个字符')
    .max(50, '模块名不超过50个字符')
    .regex(/^[a-z0-9-]+$/, '模块名只能包含小写字母、数字和连字符'),
  action: z.string()
    .min(2, '动作名至少2个字符')
    .max(20, '动作名不超过20个字符')
    .regex(/^[a-z0-9-]+$/, '动作名只能包含小写字母、数字和连字符'),
  resource: z.string()
    .max(50, '资源名不超过50个字符')
    .regex(/^[a-z0-9-]*$/, '资源名只能包含小写字母、数字和连字符')
    .optional(),
  description: z.string()
    .max(500, '描述不超过500个字符')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
    .default('ACTIVE'),
});

// 权限更新验证
export const updatePermissionSchema = z.object({
  name: z.string()
    .min(2, '权限名称至少2个字符')
    .max(100, '权限名称不超过100个字符')
    .optional(),
  description: z.string()
    .max(500, '描述不超过500个字符')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

// 角色创建验证
export const createRoleSchema = z.object({
  name: z.string()
    .min(2, '角色名称至少2个字符')
    .max(100, '角色名称不超过100个字符'),
  code: z.string()
    .min(2, '角色编码至少2个字符')
    .max(50, '角色编码不超过50个字符')
    .regex(/^[A-Z0-9_]+$/, '角色编码只能包含大写字母、数字和下划线'),
  type: z.enum([
    'ADMIN',
    'PRESIDENT_OFFICE',
    'BUSINESS_STAFF',
    'OPERATIONS_STAFF',
    'SALES_STAFF',
    'FINANCE_STAFF',
    'FRANCHISEE',
    'STORE_MANAGER'
  ]),
  description: z.string()
    .max(500, '描述不超过500个字符')
    .optional(),
  permissionIds: z.array(z.string().cuid('无效的权限ID')).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
    .default('ACTIVE'),
  sortOrder: z.number().min(0).max(999).optional(),
});

// 角色更新验证
export const updateRoleSchema = z.object({
  name: z.string()
    .min(2, '角色名称至少2个字符')
    .max(100, '角色名称不超过100个字符')
    .optional(),
  description: z.string()
    .max(500, '描述不超过500个字符')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  sortOrder: z.number().min(0).max(999).optional(),
});

// 角色权限分配验证
export const assignPermissionsSchema = z.object({
  roleId: z.string().cuid('无效的角色ID'),
  permissionIds: z.array(z.string().cuid('无效的权限ID'))
    .min(1, '至少选择一个权限'),
});

// 权限检查请求验证
export const checkPermissionSchema = z.object({
  permission: z.string()
    .min(3, '权限码至少3个字符')
    .regex(/^[a-z0-9-]+:[a-z0-9-]+(?::[a-z0-9-]+)?$/, 
           '权限码格式错误'),
  resource: z.object({
    type: z.string().min(1, '资源类型不能为空'),
    id: z.string().optional(),
    ownerId: z.string().optional(),
    departmentId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
});

// 权限搜索验证
export const permissionSearchSchema = z.object({
  keyword: z.string().optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'code', 'module', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 角色搜索验证
export const roleSearchSchema = z.object({
  keyword: z.string().optional(),
  type: z.enum([
    'ADMIN',
    'PRESIDENT_OFFICE',
    'BUSINESS_STAFF',
    'OPERATIONS_STAFF',
    'SALES_STAFF',
    'FINANCE_STAFF',
    'FRANCHISEE',
    'STORE_MANAGER'
  ]).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'code', 'type', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ===============================
// 预定义权限常量
// ===============================

export const PERMISSIONS = {
  // 系统管理
  SYSTEM: {
    ADMIN: 'system:admin',
    MANAGE_USERS: 'system:manage-users',
    MANAGE_ROLES: 'system:manage-roles',
    MANAGE_PERMISSIONS: 'system:manage-permissions',
    VIEW_LOGS: 'system:view-logs',
  },
  
  // 开店计划管理
  STORE_PLAN: {
    CREATE: 'store-plan:create',
    READ: 'store-plan:read',
    UPDATE: 'store-plan:update',
    DELETE: 'store-plan:delete',
    APPROVE: 'store-plan:approve',
    EXPORT: 'store-plan:export',
  },
  
  // 拓店管理
  EXPANSION: {
    CREATE: 'expansion:create',
    READ: 'expansion:read',
    UPDATE: 'expansion:update',
    DELETE: 'expansion:delete',
    FOLLOW_UP: 'expansion:follow-up',
    ASSIGN: 'expansion:assign',
  },
  
  // 开店筹备
  PREPARATION: {
    CREATE: 'preparation:create',
    READ: 'preparation:read',
    UPDATE: 'preparation:update',
    DELETE: 'preparation:delete',
    APPROVE: 'preparation:approve',
    PROGRESS: 'preparation:progress',
  },
  
  // 门店档案
  STORE_FILES: {
    CREATE: 'store-files:create',
    READ: 'store-files:read',
    UPDATE: 'store-files:update',
    DELETE: 'store-files:delete',
    EXPORT: 'store-files:export',
  },
  
  // 门店运营
  OPERATION: {
    CREATE: 'operation:create',
    READ: 'operation:read',
    UPDATE: 'operation:update',
    DELETE: 'operation:delete',
    PAY: 'operation:pay',
    APPROVE: 'operation:approve',
  },
  
  // 审批中心
  APPROVAL: {
    CREATE: 'approval:create',
    READ: 'approval:read',
    UPDATE: 'approval:update',
    APPROVE: 'approval:approve',
    DELEGATE: 'approval:delegate',
    TEMPLATE: 'approval:template',
  },
  
  // 基础数据
  BASIC_DATA: {
    CREATE: 'basic-data:create',
    READ: 'basic-data:read',
    UPDATE: 'basic-data:update',
    DELETE: 'basic-data:delete',
    IMPORT: 'basic-data:import',
    EXPORT: 'basic-data:export',
  },
} as const;

// ===============================
// 角色权限映射
// ===============================

export const ROLE_PERMISSIONS = {
  ADMIN: Object.values(PERMISSIONS).flatMap(p => Object.values(p)),
  
  PRESIDENT_OFFICE: [
    PERMISSIONS.STORE_PLAN.READ,
    PERMISSIONS.EXPANSION.READ,
    PERMISSIONS.PREPARATION.READ,
    PERMISSIONS.STORE_FILES.READ,
    PERMISSIONS.OPERATION.READ,
    PERMISSIONS.APPROVAL.READ,
    PERMISSIONS.BASIC_DATA.READ,
    PERMISSIONS.SYSTEM.VIEW_LOGS,
  ],
  
  BUSINESS_STAFF: [
    ...Object.values(PERMISSIONS.STORE_PLAN),
    ...Object.values(PERMISSIONS.EXPANSION),
    ...Object.values(PERMISSIONS.PREPARATION),
    ...Object.values(PERMISSIONS.APPROVAL).filter(p => p !== PERMISSIONS.APPROVAL.TEMPLATE),
    PERMISSIONS.BASIC_DATA.READ,
  ],
  
  OPERATIONS_STAFF: [
    PERMISSIONS.STORE_PLAN.CREATE,
    PERMISSIONS.STORE_PLAN.READ,
    PERMISSIONS.STORE_PLAN.UPDATE,
    ...Object.values(PERMISSIONS.EXPANSION),
    PERMISSIONS.PREPARATION.READ,
    PERMISSIONS.BASIC_DATA.READ,
  ],
  
  SALES_STAFF: [
    PERMISSIONS.EXPANSION.READ,
    PERMISSIONS.EXPANSION.FOLLOW_UP,
    PERMISSIONS.PREPARATION.READ,
    PERMISSIONS.PREPARATION.UPDATE,
    ...Object.values(PERMISSIONS.STORE_FILES),
    PERMISSIONS.BASIC_DATA.READ,
  ],
  
  FINANCE_STAFF: [
    PERMISSIONS.STORE_PLAN.READ,
    PERMISSIONS.EXPANSION.READ,
    PERMISSIONS.PREPARATION.READ,
    PERMISSIONS.STORE_FILES.READ,
    ...Object.values(PERMISSIONS.OPERATION),
    PERMISSIONS.APPROVAL.READ,
    PERMISSIONS.APPROVAL.APPROVE,
  ],
  
  FRANCHISEE: [
    PERMISSIONS.PREPARATION.READ,
    PERMISSIONS.STORE_FILES.READ,
    PERMISSIONS.OPERATION.READ,
  ],
  
  STORE_MANAGER: [
    PERMISSIONS.STORE_FILES.READ,
    PERMISSIONS.STORE_FILES.UPDATE,
    PERMISSIONS.OPERATION.READ,
    PERMISSIONS.OPERATION.UPDATE,
  ],
} as const;

// ===============================
// 导出类型推断
// ===============================

export type CreatePermissionRequest = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionRequest = z.infer<typeof updatePermissionSchema>;
export type CreateRoleRequest = z.infer<typeof createRoleSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsRequest = z.infer<typeof assignPermissionsSchema>;
export type CheckPermissionRequest = z.infer<typeof checkPermissionSchema>;
export type PermissionSearchParams = z.infer<typeof permissionSearchSchema>;
export type RoleSearchParams = z.infer<typeof roleSearchSchema>;