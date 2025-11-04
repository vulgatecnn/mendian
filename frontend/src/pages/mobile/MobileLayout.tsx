/**
 * 移动端布局组件
 * 提供统一的移动端页面布局和导航
 */
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Badge } from '@arco-design/web-react';
import { 
  IconHome, 
  IconFile, 
  IconMessage, 
  IconUser,
  IconApps
} from '@arco-design/web-react/icon';
import { useAuth } from '../../contexts';
import { useOfflineData } from '../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../utils/offlineCache';
import MessageService from '../../api/messageService';
import './mobile.css';

const { Header, Content, Footer } = Layout;

/**
 * 移动端布局组件
 */
export const MobileLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // 获取未读消息数
  const { data: unreadCount } = useOfflineData<number>({
    storeName: CACHE_STORES.STATISTICS,
    cacheKey: 'unread_message_count',
    fetchFn: async () => {
      const response = await MessageService.getUnreadCount();
      return (response as any).count || 0;
    },
    expiresIn: CACHE_EXPIRY.SHORT,
    autoFetch: true
  });

  // 底部导航栏配置
  const tabs = [
    {
      key: '/mobile/home',
      title: '首页',
      icon: <IconHome />
    },
    {
      key: '/mobile/work',
      title: '工作台',
      icon: <IconApps />
    },
    {
      key: '/mobile/approvals',
      title: '审批',
      icon: <IconFile />
    },
    {
      key: '/mobile/messages',
      title: '消息',
      icon: <IconMessage />,
      badge: unreadCount && unreadCount > 0 ? unreadCount : undefined
    },
    {
      key: '/mobile/profile',
      title: '我的',
      icon: <IconUser />
    }
  ];

  // 获取当前激活的tab
  const getActiveTab = () => {
    const path = location.pathname;
    const tab = tabs.find(t => path.startsWith(t.key));
    return tab?.key || tabs[0].key;
  };

  // 处理tab切换
  const handleTabChange = (key: string) => {
    navigate(key);
  };

  return (
    <Layout className="mobile-layout">
      <Header className="mobile-header">
        <div className="mobile-header-content">
          <h1 className="mobile-header-title">好饭碗门店管理</h1>
          {user && (
            <div className="mobile-header-user">
              {user.username}
            </div>
          )}
        </div>
      </Header>

      <Content className="mobile-content">
        <Outlet />
      </Content>

      <Footer className="mobile-footer">
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #f0f0f0' }}>
          {tabs.map(tab => (
            <div 
              key={tab.key} 
              style={{ 
                textAlign: 'center', 
                cursor: 'pointer',
                color: getActiveTab() === tab.key ? '#1890ff' : '#666'
              }}
              onClick={() => handleTabChange(tab.key)}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                {tab.icon}
                {tab.badge && (
                  <Badge count={tab.badge} dot={tab.badge > 99} style={{ marginLeft: '4px' }} />
                )}
              </div>
              <div style={{ fontSize: '12px' }}>{tab.title}</div>
            </div>
          ))}
        </div>
      </Footer>
    </Layout>
  );
};

export default MobileLayout;
