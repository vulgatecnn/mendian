/**
 * 移动端审批列表
 * 支持待办、已办审批的查看和处理
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Tabs, 
  Tag, 
  Empty, 
  Spin, 
  PullToRefresh,
  Badge
} from '@arco-design/web-react';
import { IconCalendar, IconUser } from '@arco-design/web-react/icon';
import { useOfflineData } from '../../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../../utils/offlineCache';
import ApprovalService from '../../../api/approvalService';
import '../mobile.css';

const TabPane = Tabs.TabPane;

/**
 * 移动端审批列表组件
 */
export const MobileApprovalList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);

  // 获取审批列表
  const { 
    data: approvals, 
    loading, 
    fromCache,
    refresh 
  } = useOfflineData<any>({
    storeName: CACHE_STORES.PLANS,
    cacheKey: `approvals_${activeTab}`,
    fetchFn: async () => {
      let response;
      switch (activeTab) {
        case 'pending':
          response = await ApprovalService.getPendingApprovals();
          break;
        case 'processed':
          response = await ApprovalService.getProcessedApprovals();
          break;
        case 'cc':
          response = await ApprovalService.getCCApprovals();
          break;
        default:
          response = await ApprovalService.getAllApprovals();
      }
      return response.data;
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
      'pending': 'orange',
      'approved': 'green',
      'rejected': 'red',
      'revoked': 'gray'
    };
    return colorMap[status] || 'default';
  };

  // 渲染审批卡片
  const renderApprovalCard = (approval: any) => (
    <Card
      key={approval.id}
      className="mobile-approval-card"
      hoverable
      onClick={() => navigate(`/mobile/approvals/${approval.id}`)}
    >
      <div className="mobile-approval-header">
        <div className="mobile-approval-title">
          <div className="mobile-approval-name">{approval.title}</div>
          {approval.is_urgent && (
            <Badge status="processing" text="紧急" />
          )}
        </div>
        <Tag color={getStatusColor(approval.status)}>
          {approval.status_display}
        </Tag>
      </div>

      <div className="mobile-approval-info">
        <div className="mobile-approval-info-item">
          <span className="label">审批单号：</span>
          <span>{approval.instance_no}</span>
        </div>
        <div className="mobile-approval-info-item">
          <span className="label">审批类型：</span>
          <span>{approval.template?.template_name}</span>
        </div>
        <div className="mobile-approval-info-item">
          <IconUser />
          <span>发起人：{approval.initiator?.real_name}</span>
        </div>
        <div className="mobile-approval-info-item">
          <IconCalendar />
          <span>{new Date(approval.initiated_at).toLocaleString()}</span>
        </div>
      </div>

      {/* 当前节点信息 */}
      {approval.current_node && activeTab === 'pending' && (
        <div className="mobile-approval-current-node">
          <Tag color="blue">当前节点：{approval.current_node.node_name}</Tag>
        </div>
      )}
    </Card>
  );

  return (
    <div className="mobile-approval-list">
      {/* 状态筛选 */}
      <Tabs activeTab={activeTab} onChange={setActiveTab} type="rounded">
        <TabPane key="pending" title="待办" />
        <TabPane key="processed" title="已办" />
        <TabPane key="cc" title="抄送" />
        <TabPane key="all" title="全部" />
      </Tabs>

      {/* 缓存提示 */}
      {fromCache && (
        <div className="mobile-cache-notice">
          正在显示缓存数据，下拉刷新获取最新数据
        </div>
      )}

      {/* 审批列表 */}
      <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
        <div className="mobile-approval-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : approvals?.results && approvals.results.length > 0 ? (
            approvals.results.map(renderApprovalCard)
          ) : (
            <Empty description="暂无审批" />
          )}
        </div>
      </PullToRefresh>
    </div>
  );
};

export default MobileApprovalList;
