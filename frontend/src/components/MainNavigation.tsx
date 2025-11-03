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
  IconDesktop,
  IconImport,
  IconExport,
  IconBook
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
    
    // 开店计划管理模块
    if (path.includes('/store-planning/dashboard')) return ['store-dashboard'];
    if (path.includes('/store-planning/reports')) return ['store-reports'];
    if (path.includes('/store-planning/plans')) return ['store-plans'];
    if (path.includes('/store-planning/import')) return ['store-import'];
    if (path.includes('/store-planning/export')) return ['store-export'];
    if (path.includes('/store-planning/templates')) return ['store-templates'];
    
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
    
    if (path.includes('/store-planning/')) {
      openKeys.push('store-planning');
    }
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
      case 'store-dashboard':
        navigate('/store-planning/dashboard');
        break;
      case 'store-reports':
        navigate('/store-planning/reports');
        break;
      case 'store-plans':
        navigate('/store-planning/plans');
        break;
      case 'store-import':
        navigate('/store-planning/import');
        break;
      case 'store-export':
        navigate('/store-planning/export');
        break;
      case 'store-templates':
        navigate('/store-planning/templates');
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

      {/* 开店计划管理 */}
      <SubMenu
        key="store-planning"
        title={
          <span>
            <IconDashboard />
            开店计划管理
          </span>
        }
      >
        <PermissionGuard permission="store_planning.plan.view">
          <Item key="store-dashboard">
            <IconDashboard />
            执行仪表板
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="store_planning.plan.view">
          <Item key="store-reports">
            <IconFile />
            分析报表
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="store_planning.plan.view">
          <Item key="store-plans">
            <IconFile />
            门店计划
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="store_planning.plan.import">
          <Item key="store-import">
            <IconImport />
            数据导入
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="store_planning.plan.export">
          <Item key="store-export">
            <IconExport />
            数据导出
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="store_planning.plan.view">
          <Item key="store-templates">
            <IconBook />
            导入模板
          </Item>
        </PermissionGuard>
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