/**
 * 移动端消息中心
 * 支持消息查看、标记已读、快速回复
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Tabs, 
  Tag, 
  Empty, 
  Spin, 

  Badge,
  Button,
  Message as ArcoMessage
} from '@arco-design/web-react';
import { IconCalendar, IconCheckCircle } from '@arco-design/web-react/icon';
import { useOfflineData } from '../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../utils/offlineCache';
import MessageService from '../../api/messageService';
import './mobile.css';

const TabPane = Tabs.TabPane;

/**
 * 移动端消息中心组件
 */
export const MobileMessages: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // 获取消息列表
  const { 
    data: messages, 
    loading, 
    fromCache,
    refresh 
  } = useOfflineData<any>({
    storeName: CACHE_STORES.STATISTICS,
    cacheKey: `messages_${activeTab}`,
    fetchFn: async () => {
      const response = await MessageService.getMessages({
        is_read: activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined
      });
      return response.results;
    },
    expiresIn: CACHE_EXPIRY.SHORT
  });

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh(true);
    } finally {
      setRefreshing(false);
    }
  };

  // 标记已读
  const handleMarkRead = async (messageId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await MessageService.markAsRead(messageId);
      ArcoMessage.success('已标记为已读');
      refresh(true);
    } catch (error) {
      ArcoMessage.error('操作失败');
    }
  };

  // 全部标记已读
  const handleMarkAllRead = async () => {
    try {
      await MessageService.markAllAsRead();
      ArcoMessage.success('已全部标记为已读');
      refresh(true);
    } catch (error) {
      ArcoMessage.error('操作失败');
    }
  };

  // 消息类型标签颜色映射
  const getMessageTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'approval_pending': 'orange',
      'approval_approved': 'green',
      'approval_rejected': 'red',
      'milestone_reminder': 'blue',
      'contract_reminder': 'purple',
      'system': 'gray'
    };
    return colorMap[type] || 'default';
  };

  // 渲染消息卡片
  const renderMessageCard = (message: any) => (
    <Card
      key={message.id}
      className={`mobile-message-card ${!message.is_read ? 'unread' : ''}`}
      hoverable
      onClick={() => {
        if (message.link) {
          navigate(message.link);
        }
        if (!message.is_read) {
          handleMarkRead(message.id, {} as React.MouseEvent);
        }
      }}
    >
      <div className="mobile-message-header">
        <div className="mobile-message-title">
          {!message.is_read && <Badge status="processing" />}
          <span>{message.title}</span>
        </div>
        <Tag color={getMessageTypeColor(message.message_type)}>
          {message.message_type_display}
        </Tag>
      </div>

      <div className="mobile-message-content">
        {message.content}
      </div>

      <div className="mobile-message-footer">
        <div className="mobile-message-time">
          <IconCalendar />
          <span>{new Date(message.created_at).toLocaleString()}</span>
        </div>
        {!message.is_read && (
          <Button
            type="text"
            size="small"
            icon={<IconCheckCircle />}
            onClick={(e: any) => handleMarkRead(message.id, e)}
          >
            标记已读
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="mobile-messages">
      {/* 状态筛选 */}
      <div className="mobile-messages-header">
        <Tabs activeTab={activeTab} onChange={setActiveTab} type="rounded">
          <TabPane key="all" title="全部" />
          <TabPane key="unread" title="未读" />
          <TabPane key="read" title="已读" />
        </Tabs>
        
        {activeTab === 'unread' && messages?.results && messages.results.length > 0 && (
          <Button
            type="text"
            size="small"
            onClick={handleMarkAllRead}
          >
            全部已读
          </Button>
        )}
      </div>

      {/* 缓存提示 */}
      {fromCache && (
        <div className="mobile-cache-notice">
          正在显示缓存数据，下拉刷新获取最新数据
        </div>
      )}

      {/* 消息列表 */}
      <div className="mobile-messages-content">
        <div style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
          <Button onClick={handleRefresh} loading={refreshing} size="small">刷新</Button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : messages?.results && messages.results.length > 0 ? (
          messages.results.map(renderMessageCard)
        ) : (
          <Empty description="暂无消息" />
        )}
      </div>
    </div>
  );
};

export default MobileMessages;
