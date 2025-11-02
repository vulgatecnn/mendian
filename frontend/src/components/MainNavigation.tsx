/**
 * 主导航菜单组件
 */
import React from 'react';
import { Menu } from '@arco-design/web-react';
import { 
  IconHome,
  IconSettings,
  IconBranch, 
  IconUser, 
  IconUserGroup, 
  IconHistory,
  IconDashboard,
  IconStorage,
  IconTool,
  IconFile,
  IconDesktop
} from '@arco-design/web-react/icon';
import { useNavigate, useLocation } from 'react-router-dom';
import { PermissionGuard } from './PermissionGuard';
import { usePermission } from '../hooks/usePermission';

const { SubMenu, Item } = Menu;

interface MainNavigationProps {
  /** 菜单模式 */
  mode?: 'horizontal' | 'vertical';
}

/**
 * 主导航菜单组件
 */
export const MainNavigation: React.FC<MainNavigationProps> = ({
  mode = 'vertical'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModuleAccess } = usePermission();

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    
    // 首页
    if (path === '/') return ['home'];
    
    // 系统管理模块
    if (path.includes('/system/departments')) return ['system-departments'];
    if (path.includes('/system/users')) return ['system-users'];
    if (path.includes('/system/roles')) return ['system-roles'];
    if (path.includes('/system/audit-logs')) return ['system-audit-logs'];
    
    return [];
  };

  // 获取展开的子菜单
  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys: string[] = [];
    
    if (path.includes('/system/')) {
      openKeys.push('system');
    }
    
    return openKeys;
  };

  // 菜单点击处理
  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'home':
        navigate('/');
        break;
      case 'system-departments':
        navigate('/system/departments');
        break;
      case 'system-users':
        navigate('/system/users');
        break;
      case 'system-roles':
        navigate('/system/roles');
        break;
      case 'system-audit-logs':
        navigate('/system/audit-logs');
        break;
      default:
        break;
    }
  };

  return (
    <Menu
      mode={mode}
      selectedKeys={getSelectedKeys()}
      defaultOpenKeys={getOpenKeys()}
      onClickMenuItem={handleMenuClick}
      style={{ width: '100%' }}
    >
      {/* 首页 */}
      <Item key="home">
        <IconHome />
        首页
      </Item>

      {/* 开店计划管理 - 暂未实现 */}
      <SubMenu
        key="store-planning"
        title={
          <span style={{ color: '#ccc' }}>
            <IconDashboard />
            开店计划管理
          </span>
        }
      >
        <Item key="store-plans" disabled>
          <IconFile />
          门店计划
        </Item>
      </SubMenu>

      {/* 拓店管理 - 暂未实现 */}
      <SubMenu
        key="store-expansion"
        title={
          <span style={{ color: '#ccc' }}>
            <IconStorage />
            拓店管理
          </span>
        }
      >
        <Item key="candidate-locations" disabled>
          <IconStorage />
          候选位置
        </Item>
      </SubMenu>

      {/* 开店筹备管理 - 暂未实现 */}
      <SubMenu
        key="store-preparation"
        title={
          <span style={{ color: '#ccc' }}>
            <IconTool />
            开店筹备管理
          </span>
        }
      >
        <Item key="construction" disabled>
          <IconTool />
          施工管理
        </Item>
      </SubMenu>

      {/* 门店运营管理 - 暂未实现 */}
      <SubMenu
        key="store-operation"
        title={
          <span style={{ color: '#ccc' }}>
            <IconDesktop />
            门店运营管理
          </span>
        }
      >
        <Item key="store-files" disabled>
          <IconFile />
          门店档案
        </Item>
      </SubMenu>

      {/* 系统管理模块 */}
      {hasModuleAccess('系统管理') && (
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
            <Item key="system-departments">
              <IconBranch />
              部门管理
            </Item>
          </PermissionGuard>

          <PermissionGuard permission="system.user.view">
            <Item key="system-users">
              <IconUser />
              用户管理
            </Item>
          </PermissionGuard>

          <PermissionGuard permission="system.role.view">
            <Item key="system-roles">
              <IconUserGroup />
              角色管理
            </Item>
          </PermissionGuard>

          <PermissionGuard permission="system.audit.view">
            <Item key="system-audit-logs">
              <IconHistory />
              审计日志
            </Item>
          </PermissionGuard>
        </SubMenu>
      )}
    </Menu>
  );
};

export default MainNavigation;