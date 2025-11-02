/**
 * 权限上下文 - 管理用户权限状态和权限检查方法
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 权限接口定义
interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
}

// 权限上下文接口
interface PermissionContextType {
  permissions: Permission[];
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
  loadUserPermissions: () => Promise<void>;
  loading: boolean;
}

// 创建权限上下文
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// 权限提供者组件属性
interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * 权限提供者组件
 */
export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 检查用户是否具有指定权限
   */
  const hasPermission = (permissionCode: string): boolean => {
    return permissions.some(permission => permission.code === permissionCode);
  };

  /**
   * 检查用户是否具有任意一个权限
   */
  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  };

  /**
   * 检查用户是否具有所有权限
   */
  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => hasPermission(code));
  };

  /**
   * 加载用户权限
   */
  const loadUserPermissions = async (): Promise<void> => {
    setLoading(true);
    try {
      // 这里应该调用实际的API获取用户权限
      // 暂时使用模拟数据 - 模拟系统管理员权限
      const mockPermissions: Permission[] = [
        { id: 1, code: 'system.department.view', name: '查看部门', module: '系统管理' },
        { id: 2, code: 'system.department.sync', name: '同步部门', module: '系统管理' },
        { id: 3, code: 'system.user.view', name: '查看用户', module: '系统管理' },
        { id: 4, code: 'system.user.manage', name: '管理用户', module: '系统管理' },
        { id: 5, code: 'system.user.sync', name: '同步用户', module: '系统管理' },
        { id: 6, code: 'system.role.view', name: '查看角色', module: '系统管理' },
        { id: 7, code: 'system.role.manage', name: '管理角色', module: '系统管理' },
        { id: 8, code: 'system.audit.view', name: '查看审计日志', module: '系统管理' },
      ];
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPermissions(mockPermissions);
    } catch (error) {
      console.error('加载用户权限失败:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载权限
  useEffect(() => {
    loadUserPermissions();
  }, []);

  const value: PermissionContextType = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loadUserPermissions,
    loading,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * 使用权限上下文的Hook
 */
export const usePermissionContext = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext 必须在 PermissionProvider 内部使用');
  }
  return context;
};