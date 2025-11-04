/**
 * 移动端跟进单列表
 * 支持创建、查看和状态筛选
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Input, 
  Tag, 
  Empty, 
  Spin, 

  Tabs,
  Button
} from '@arco-design/web-react';
import { IconSearch, IconPlus, IconCalendar } from '@arco-design/web-react/icon';
import { useOfflineData } from '../../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../../utils/offlineCache';
import ExpansionService from '../../../api/expansionService';
import '../mobile.css';

const TabPane = Tabs.TabPane;

/**
 * 移动端跟进单列表组件
 */
export const MobileFollowUpList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // 获取跟进单列表
  const { 
    data: followUps, 
    loading, 
    fromCache,
    refresh 
  } = useOfflineData<any>({
    storeName: CACHE_STORES.PLANS,
    cacheKey: `follow_ups_${status}`,
    fetchFn: async () => {
      const response = await ExpansionService.getFollowUps({
        status: status === 'all' ? undefined : status as any,
        // search: searchText // TODO: 修复查询参数
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

  // 状态标签颜色映射
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'investigating': 'blue',
      'calculating': 'cyan',
      'approving': 'orange',
      'signed': 'green',
      'abandoned': 'gray'
    };
    return colorMap[status] || 'default';
  };

  // 优先级标签颜色映射
  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      'high': 'red',
      'medium': 'orange',
      'low': 'blue'
    };
    return colorMap[priority] || 'default';
  };

  // 渲染跟进单卡片
  const renderFollowUpCard = (followUp: any) => (
    <Card
      key={followUp.id}
      className="mobile-followup-card"
      hoverable
      onClick={() => navigate(`/mobile/expansion/follow-ups/${followUp.id}`)}
    >
      <div className="mobile-followup-header">
        <div className="mobile-followup-title">
          <div className="mobile-followup-name">{followUp.location?.name}</div>
          <Tag color={getPriorityColor(followUp.priority)}>
            {followUp.priority_display}
          </Tag>
        </div>
        <Tag color={getStatusColor(followUp.status)}>
          {followUp.status_display}
        </Tag>
      </div>

      <div className="mobile-followup-info">
        <div className="mobile-followup-info-item">
          <span className="label">跟进单号：</span>
          <span>{followUp.record_no}</span>
        </div>
        {followUp.survey_date && (
          <div className="mobile-followup-info-item">
            <IconCalendar />
            <span>调研日期：{followUp.survey_date}</span>
          </div>
        )}
        {followUp.profit_calculation && (
          <div className="mobile-followup-info-item">
            <span className="label">ROI：</span>
            <span className="highlight">{followUp.profit_calculation.roi}%</span>
            <span className="label" style={{ marginLeft: 16 }}>回本周期：</span>
            <span className="highlight">{followUp.profit_calculation.payback_period}个月</span>
          </div>
        )}
      </div>

      <div className="mobile-followup-footer">
        <span className="mobile-followup-creator">
          创建人：{followUp.created_by?.real_name}
        </span>
        <span className="mobile-followup-time">
          {new Date(followUp.created_at).toLocaleDateString()}
        </span>
      </div>
    </Card>
  );

  return (
    <div className="mobile-followup-list">
      {/* 搜索和创建 */}
      <div className="mobile-search-bar">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索跟进单"
          value={searchText}
          onChange={setSearchText}
          allowClear
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={() => navigate('/mobile/expansion/follow-ups/create')}
          style={{ marginLeft: 8 }}
        >
          新建
        </Button>
      </div>

      {/* 状态筛选 */}
      <Tabs activeTab={status} onChange={setStatus} type="rounded">
        <TabPane key="all" title="全部" />
        <TabPane key="investigating" title="调研中" />
        <TabPane key="calculating" title="测算中" />
        <TabPane key="approving" title="审批中" />
        <TabPane key="signed" title="已签约" />
      </Tabs>

      {/* 缓存提示 */}
      {fromCache && (
        <div className="mobile-cache-notice">
          正在显示缓存数据，下拉刷新获取最新数据
        </div>
      )}

      {/* 跟进单列表 */}
      <div className="mobile-followup-content">
        <div style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
          <Button onClick={handleRefresh} loading={refreshing} size="small">刷新</Button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : followUps?.results && followUps.results.length > 0 ? (
          followUps.results.map(renderFollowUpCard)
        ) : (
          <Empty description="暂无跟进单" />
        )}
      </div>
    </div>
  );
};

export default MobileFollowUpList;
