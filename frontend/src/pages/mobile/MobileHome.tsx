/**
 * 移动端首页
 * 显示待办事项、快捷入口和最新消息
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Grid, Badge, Empty, Spin, PullToRefresh } from '@arco-design/web-react';
import { 
  IconFile, 
  IconCalendar, 
  IconTool,
  IconArchive,
  IconCheckCircle,
  IconMessage,
  IconRight
} from '@arco-design/web-react/icon';
import { useOfflineData } from '../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../utils/offlineCache';
import HomeService from '../../api/homeService';
import './mobile.css';

const { Row, Col } = Grid;

/**
 * 移动端首页组件
 */
export const MobileHome: React.FC = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // 获取待办事项
  const { 
    data: todos, 
    loading: todosLoading, 
    refresh: refreshTodos 
  } = useOfflineData<any[]>({
    storeName: CACHE_STORES.STATISTICS,
    cacheKey: 'home_todos',
    fetchFn: async () => {
      const response = await HomeService.getTodos();
      return response.data || [];
    },
    expiresIn: CACHE_EXPIRY.SHORT
  });

  // 快捷入口配置
  const shortcuts = [
    {
      key: 'locations',
      title: '候选点位',
      icon: <IconArchive />,
      path: '/mobile/expansion/locations',
      color: '#165DFF'
    },
    {
      key: 'follow-ups',
      title: '跟进单',
      icon: <IconFile />,
      path: '/mobile/expansion/follow-ups',
      color: '#14C9C9'
    },
    {
      key: 'construction',
      title: '工程管理',
      icon: <IconTool />,
      path: '/mobile/preparation/construction',
      color: '#F7BA1E'
    },
    {
      key: 'delivery',
      title: '交付管理',
      icon: <IconCheckCircle />,
      path: '/mobile/preparation/delivery',
      color: '#00B42A'
    },
    {
      key: 'stores',
      title: '门店档案',
      icon: <IconArchive />,
      path: '/mobile/archive/stores',
      color: '#722ED1'
    },
    {
      key: 'approvals',
      title: '审批中心',
      icon: <IconFile />,
      path: '/mobile/approvals',
      color: '#F53F3F'
    }
  ];

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTodos(true);
    } finally {
      setRefreshing(false);
    }
  };

  // 渲染待办事项
  const renderTodos = () => {
    if (todosLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      );
    }

    if (!todos || todos.length === 0) {
      return (
        <Empty description="暂无待办事项" />
      );
    }

    return (
      <div className="mobile-todo-list">
        {todos.map((todo: any) => (
          <Card
            key={todo.type}
            className="mobile-todo-card"
            hoverable
            onClick={() => navigate(todo.link)}
          >
            <div className="mobile-todo-content">
              <div className="mobile-todo-info">
                <div className="mobile-todo-title">{todo.title}</div>
                <div className="mobile-todo-desc">{todo.description || '点击查看详情'}</div>
              </div>
              <div className="mobile-todo-badge">
                <Badge count={todo.count} />
                <IconRight style={{ marginLeft: 8, color: '#86909C' }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
      <div className="mobile-home">
        {/* 快捷入口 */}
        <Card className="mobile-shortcuts-card" title="快捷入口" bordered={false}>
          <Row gutter={[16, 16]}>
            {shortcuts.map(shortcut => (
              <Col key={shortcut.key} span={8}>
                <div
                  className="mobile-shortcut-item"
                  onClick={() => navigate(shortcut.path)}
                >
                  <div 
                    className="mobile-shortcut-icon"
                    style={{ backgroundColor: `${shortcut.color}15`, color: shortcut.color }}
                  >
                    {shortcut.icon}
                  </div>
                  <div className="mobile-shortcut-title">{shortcut.title}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 待办事项 */}
        <Card className="mobile-todos-card" title="待办事项" bordered={false}>
          {renderTodos()}
        </Card>
      </div>
    </PullToRefresh>
  );
};

export default MobileHome;
