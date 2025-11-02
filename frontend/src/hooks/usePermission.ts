/**
 * 权限检查Hook
 */
import { usePermissionContext } from '../contexts/PermissionContext';

/**
 * 权限检查Hook
 * 提供便捷的权限检查方法
 */
export const usePermission = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, permissions, loading } = usePermissionContext();

  /**
   * 检查是否具有指定权限
   */
  const checkPermission = (permissionCode: string): boolean => {
    return hasPermission(permissionCode);
  };

  /**
   * 检查是否具有任意一个权限
   */
  const checkAnyPermission = (permissionCodes: string[]): boolean => {
    return hasAnyPermission(permissionCodes);
  };

  /**
   * 检查是否具有所有权限
   */
  const checkAllPermissions = (permissionCodes: string[]): boolean => {
    return hasAllPermissions(permissionCodes);
  };

  /**
   * 获取用户所有权限代码
   */
  const getPermissionCodes = (): string[] => {
    return permissions.map(permission => permission.code);
  };

  /**
   * 获取指定模块的权限
   */
  const getModulePermissions = (module: string) => {
    return permissions.filter(permission => permission.module === module);
  };

  /**
   * 检查是否具有模块的任意权限
   */
  const hasModuleAccess = (module: string): boolean => {
    return permissions.some(permission => permission.module === module);
  };

  return {
    // 权限检查方法
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    hasModuleAccess,
    
    // 权限数据获取
    getPermissionCodes,
    getModulePermissions,
    permissions,
    
    // 状态
    loading,
    
    // 别名方法（保持与上下文一致）
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

export default usePermission;