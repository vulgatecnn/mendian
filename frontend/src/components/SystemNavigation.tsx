/**
 * 系统管理导航菜单组件
 */
import React from 'react';
import { Menu } from '@arco-design/web-react';
import { 
  IconBranch, 
  IconUser, 
  IconUserGroup, 
  IconHistory,
  IconSettings 
} from '@arco-design/web-react/icon';
import { useNavigate, useLocation } from 'react-router-dom';
import { PermissionGuard } from './PermissionGuard';
import { usePermission } from '../hooks/usePermission';

const { SubMenu, Item } = Menu;

interface SystemNavigationProps {
  /** 是否为侧边栏模式 */
  mode?: 'horizontal' | 'vertical';
}

/**
 * 系统管理导航菜单组件
 */
export const SystemNavigation: React.FC<SystemNavigationProps> = ({
  mode = 'vertical'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModuleAccess } = usePermission();

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.includes('/system/departments')) return ['departments'];
    if (path.includes('/system/users')) return ['users'];
    if (path.includes('/system/roles')) return ['roles'];
    if (path.includes('/system/audit-logs')) return ['audit-logs'];
    return [];
  };

  // 菜单点击处理
  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'departments':
        navigate('/system/departments');
        break;
      case 'users':
        navigate('/system/users');
        break;
      case 'roles':
        navigate('/system/roles');
        break;
      case 'audit-logs':
        navigate('/system/audit-logs');
        break;
      default:
        break;
    }
  };

  // 如果用户没有系统管理模块的任何权限，不显示菜单
  if (!hasModuleAccess('系统管理')) {
    return null;
  }

  return (
    <Menu
      mode={mode}
      selectedKeys={getSelectedKeys()}
      onClickMenuItem={handleMenuClick}
      style={{ width: '100%' }}
    >
      <SubMenu
        key="system"
        title={
          <span>
            <IconSettings />
            系统管理
          </span>
        }
      >
        <PermissionGuard permission="system.department.view">
          <Item key="departments">
            <IconBranch />
            部门管理
          </Item>
        </PermissionGuard>

        <PermissionGuard permission="system.user.view">
          <Item key="users">
            <IconUser />
            用户管理
          </Item>
        </PermissionGuard>

        <PermissionGuard permission="system.role.view">
          <Item key="roles">
            <IconUserGroup />
            角色管理
          </Item>
        </PermissionGuard>

        <PermissionGuard permission="system.audit.view">
          <Item key="audit-logs">
            <IconHistory />
            审计日志
          </Item>
        </PermissionGuard>
      </SubMenu>
    </Menu>
  );
};

export default SystemNavigation;