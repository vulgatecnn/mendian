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
  IconBook,
  IconCheck,
  IconCalendar,
  IconApps
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
    
    // 拓店管理模块
    if (path.includes('/store-expansion/locations')) return ['expansion-locations'];
    if (path.includes('/store-expansion/follow-ups')) return ['expansion-follow-ups'];
    if (path.includes('/store-expansion/profit-config')) return ['expansion-profit-config'];
    
    // 开店筹备模块
    if (path.includes('/store-preparation/construction')) return ['preparation-construction'];
    if (path.includes('/store-preparation/acceptance')) return ['preparation-acceptance'];
    if (path.includes('/store-preparation/milestones')) return ['preparation-milestones'];
    if (path.includes('/store-preparation/delivery')) return ['preparation-delivery'];
    
    // 门店档案模块
    if (path.includes('/store-archive')) return ['archive-stores'];
    
    // 审批中心模块
    if (path.includes('/approval/pending')) return ['approval-pending'];
    if (path.includes('/approval/processed')) return ['approval-processed'];
    if (path.includes('/approval/cc')) return ['approval-cc'];
    if (path.includes('/approval/followed')) return ['approval-followed'];
    if (path.includes('/approval/initiated')) return ['approval-initiated'];
    if (path.includes('/approval/all')) return ['approval-all'];
    if (path.includes('/approval/templates')) return ['approval-templates'];
    
    // 基础数据管理模块
    if (path.includes('/base-data/regions')) return ['base-data-regions'];
    if (path.includes('/base-data/suppliers')) return ['base-data-suppliers'];
    if (path.includes('/base-data/legal-entities')) return ['base-data-legal-entities'];
    if (path.includes('/base-data/customers')) return ['base-data-customers'];
    if (path.includes('/base-data/budgets')) return ['base-data-budgets'];
    
    // 门店运营管理模块
    if (path.includes('/store-operation/payment-tracking')) return ['operation-payment-tracking'];
    if (path.includes('/store-operation/asset-management')) return ['operation-asset-management'];
    
    // 经营大屏模块
    if (path.includes('/business-dashboard/dashboard')) return ['business-dashboard'];
    if (path.includes('/business-dashboard/reports')) return ['business-reports'];
    
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
    if (path.includes('/store-expansion/')) {
      openKeys.push('store-expansion');
    }
    if (path.includes('/store-preparation/')) {
      openKeys.push('store-preparation');
    }
    if (path.includes('/store-archive/')) {
      openKeys.push('store-archive');
    }
    if (path.includes('/approval/')) {
      openKeys.push('approval');
    }
    if (path.includes('/base-data/')) {
      openKeys.push('base-data');
    }
    if (path.includes('/store-operation/')) {
      openKeys.push('store-operation');
    }
    if (path.includes('/business-dashboard/')) {
      openKeys.push('business-dashboard');
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
      // 开店计划管理
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
      // 拓店管理
      case 'expansion-locations':
        navigate('/store-expansion/locations');
        break;
      case 'expansion-follow-ups':
        navigate('/store-expansion/follow-ups');
        break;
      case 'expansion-profit-config':
        navigate('/store-expansion/profit-config');
        break;
      // 开店筹备
      case 'preparation-construction':
        navigate('/store-preparation/construction');
        break;
      case 'preparation-acceptance':
        navigate('/store-preparation/acceptance');
        break;
      case 'preparation-milestones':
        navigate('/store-preparation/milestones');
        break;
      case 'preparation-delivery':
        navigate('/store-preparation/delivery');
        break;
      // 门店档案
      case 'archive-stores':
        navigate('/store-archive');
        break;
      // 审批中心
      case 'approval-pending':
        navigate('/approval/pending');
        break;
      case 'approval-processed':
        navigate('/approval/processed');
        break;
      case 'approval-cc':
        navigate('/approval/cc');
        break;
      case 'approval-followed':
        navigate('/approval/followed');
        break;
      case 'approval-initiated':
        navigate('/approval/initiated');
        break;
      case 'approval-all':
        navigate('/approval/all');
        break;
      case 'approval-templates':
        navigate('/approval/templates');
        break;
      // 基础数据管理
      case 'base-data-regions':
        navigate('/base-data/regions');
        break;
      case 'base-data-suppliers':
        navigate('/base-data/suppliers');
        break;
      case 'base-data-legal-entities':
        navigate('/base-data/legal-entities');
        break;
      case 'base-data-customers':
        navigate('/base-data/customers');
        break;
      case 'base-data-budgets':
        navigate('/base-data/budgets');
        break;
      // 门店运营管理
      case 'operation-payment-tracking':
        navigate('/store-operation/payment-tracking');
        break;
      case 'operation-asset-management':
        navigate('/store-operation/asset-management');
        break;
      // 经营大屏
      case 'business-dashboard':
        navigate('/business-dashboard/dashboard');
        break;
      case 'business-reports':
        navigate('/business-dashboard/reports');
        break;
      // 系统管理
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

      {/* 拓店管理 */}
      <SubMenu
        key="store-expansion"
        title={
          <span>
            <IconStorage />
            拓店管理
          </span>
        }
      >
        <PermissionGuard permission="expansion.location.view">
          <Item key="expansion-locations">
            <IconStorage />
            候选点位
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="expansion.followup.view">
          <Item key="expansion-follow-ups">
            <IconFile />
            跟进管理
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="expansion.formula.view">
          <Item key="expansion-profit-config">
            <IconSettings />
            盈利测算配置
          </Item>
        </PermissionGuard>
      </SubMenu>

      {/* 开店筹备管理 */}
      <SubMenu
        key="store-preparation"
        title={
          <span>
            <IconTool />
            开店筹备管理
          </span>
        }
      >
        <PermissionGuard permission="preparation.construction.view">
          <Item key="preparation-construction">
            <IconTool />
            施工管理
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="preparation.construction.acceptance">
          <Item key="preparation-acceptance">
            <IconCheck />
            验收管理
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="preparation.construction.view">
          <Item key="preparation-milestones">
            <IconHistory />
            里程碑管理
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="preparation.delivery.view">
          <Item key="preparation-delivery">
            <IconFile />
            交付管理
          </Item>
        </PermissionGuard>
      </SubMenu>

      {/* 门店档案 */}
      <SubMenu
        key="store-archive"
        title={
          <span>
            <IconDesktop />
            门店档案
          </span>
        }
      >
        <PermissionGuard permission="archive.store.view">
          <Item key="archive-stores">
            <IconFile />
            门店档案
          </Item>
        </PermissionGuard>
      </SubMenu>

      {/* 审批中心 */}
      <SubMenu
        key="approval"
        title={
          <span>
            <IconFile />
            审批中心
          </span>
        }
      >
        <PermissionGuard permission="approval.instance.view">
          <Item key="approval-pending">
            <IconFile />
            待办审批
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="approval.instance.view">
          <Item key="approval-processed">
            <IconHistory />
            已办审批
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="approval.instance.view">
          <Item key="approval-cc">
            <IconFile />
            抄送我的
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="approval.instance.view">
          <Item key="approval-followed">
            <IconFile />
            我关注的
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="approval.instance.view">
          <Item key="approval-initiated">
            <IconFile />
            我发起的
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="approval.instance.view">
          <Item key="approval-all">
            <IconFile />
            全部审批
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="approval.template.view">
          <Item key="approval-templates">
            <IconSettings />
            审批模板
          </Item>
        </PermissionGuard>
      </SubMenu>

      {/* 门店运营管理 */}
      <SubMenu
        key="store-operation"
        title={
          <span>
            <IconApps />
            门店运营管理
          </span>
        }
      >
        <PermissionGuard permission="store_operation.payment.view">
          <Item key="operation-payment-tracking">
            <IconCalendar />
            付款追踪
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="store_operation.asset.view">
          <Item key="operation-asset-management">
            <IconDesktop />
            资产管理
          </Item>
        </PermissionGuard>
      </SubMenu>

      {/* 经营大屏 */}
      <SubMenu
        key="business-dashboard"
        title={
          <span>
            <IconDashboard />
            经营大屏
          </span>
        }
      >
        <PermissionGuard permission="business_dashboard.view">
          <Item key="business-dashboard">
            <IconDashboard />
            数据可视化大屏
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="business_dashboard.reports">
          <Item key="business-reports">
            <IconFile />
            数据报表
          </Item>
        </PermissionGuard>
      </SubMenu>

      {/* 基础数据管理 */}
      <SubMenu
        key="base-data"
        title={
          <span>
            <IconStorage />
            基础数据管理
          </span>
        }
      >
        <PermissionGuard permission="base_data.region.view">
          <Item key="base-data-regions">
            <IconBranch />
            业务大区
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="base_data.supplier.view">
          <Item key="base-data-suppliers">
            <IconUser />
            供应商
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="base_data.legal_entity.view">
          <Item key="base-data-legal-entities">
            <IconFile />
            法人主体
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="base_data.customer.view">
          <Item key="base-data-customers">
            <IconUserGroup />
            客户管理
          </Item>
        </PermissionGuard>
        
        <PermissionGuard permission="base_data.budget.view">
          <Item key="base-data-budgets">
            <IconFile />
            商务预算
          </Item>
        </PermissionGuard>
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