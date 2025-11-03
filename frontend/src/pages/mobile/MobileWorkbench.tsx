/**
 * 移动端工作台
 * 提供各业务模块的快速访问入口
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Grid, Divider } from '@arco-design/web-react';
import { 
  IconArchive,
  IconFile,
  IconTool,
  IconCheckCircle,
  IconHome,
  IconCalendar,
  IconBarChart,
  IconSettings
} from '@arco-design/web-react/icon';
import './mobile.css';

const { Row, Col } = Grid;

/**
 * 工作台菜单项
 */
interface WorkMenuItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  description?: string;
}

/**
 * 移动端工作台组件
 */
export const MobileWorkbench: React.FC = () => {
  const navigate = useNavigate();

  // 拓店管理菜单
  const expansionMenus: WorkMenuItem[] = [
    {
      key: 'locations',
      title: '候选点位',
      icon: <IconArchive />,
      path: '/mobile/expansion/locations',
      color: '#165DFF',
      description: '查看和管理候选点位'
    },
    {
      key: 'follow-ups',
      title: '跟进单',
      icon: <IconFile />,
      path: '/mobile/expansion/follow-ups',
      color: '#14C9C9',
      description: '铺位跟进和盈利测算'
    }
  ];

  // 开店筹备菜单
  const preparationMenus: WorkMenuItem[] = [
    {
      key: 'construction',
      title: '工程管理',
      icon: <IconTool />,
      path: '/mobile/preparation/construction',
      color: '#F7BA1E',
      description: '施工进度和验收管理'
    },
    {
      key: 'delivery',
      title: '交付管理',
      icon: <IconCheckCircle />,
      path: '/mobile/preparation/delivery',
      color: '#00B42A',
      description: '门店交付和资料管理'
    }
  ];

  // 门店档案菜单
  const archiveMenus: WorkMenuItem[] = [
    {
      key: 'stores',
      title: '门店档案',
      icon: <IconHome />,
      path: '/mobile/archive/stores',
      color: '#722ED1',
      description: '门店信息和历史记录'
    }
  ];

  // 审批中心菜单
  const approvalMenus: WorkMenuItem[] = [
    {
      key: 'pending',
      title: '待办审批',
      icon: <IconFile />,
      path: '/mobile/approvals/pending',
      color: '#F53F3F',
      description: '需要我审批的事项'
    },
    {
      key: 'processed',
      title: '已办审批',
      icon: <IconCheckCircle />,
      path: '/mobile/approvals/processed',
      color: '#86909C',
      description: '我已处理的审批'
    }
  ];

  // 渲染菜单组
  const renderMenuGroup = (title: string, menus: WorkMenuItem[]) => (
    <Card className="mobile-work-card" title={title} bordered={false}>
      <div className="mobile-work-menu-list">
        {menus.map(menu => (
          <div
            key={menu.key}
            className="mobile-work-menu-item"
            onClick={() => navigate(menu.path)}
          >
            <div 
              className="mobile-work-menu-icon"
              style={{ backgroundColor: `${menu.color}15`, color: menu.color }}
            >
              {menu.icon}
            </div>
            <div className="mobile-work-menu-content">
              <div className="mobile-work-menu-title">{menu.title}</div>
              {menu.description && (
                <div className="mobile-work-menu-desc">{menu.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="mobile-workbench">
      {renderMenuGroup('拓店管理', expansionMenus)}
      {renderMenuGroup('开店筹备', preparationMenus)}
      {renderMenuGroup('门店档案', archiveMenus)}
      {renderMenuGroup('审批中心', approvalMenus)}
    </div>
  );
};

export default MobileWorkbench;
