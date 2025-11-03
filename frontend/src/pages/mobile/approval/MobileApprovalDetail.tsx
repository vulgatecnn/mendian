/**
 * 移动端审批详情
 * 支持查看审批流程、处理审批
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Form,
  Input,
  Radio,
  Message,
  Spin,
  Tabs,
  Space,
  Timeline,
  Modal
} from '@arco-design/web-react';
import { 
  IconLeft, 
  IconCheckCircle,
  IconCloseCircle,
  IconSwap
} from '@arco-design/web-react/icon';
import { useOfflineData } from '../../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../../utils/offlineCache';
import ApprovalService from '../../../api/approvalService';
import '../mobile.css';

const TabPane = Tabs.TabPane;
const FormItem = Form.Item;
const TextArea = Input.TextArea;

/**
 * 移动端审批详情组件
 */
export const MobileApprovalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [processing, setProcessing] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | 'transfer'>('approve');

  // 获取审批详情
  const { 
    data: approval, 
    loading,
    refresh 
  } = useOfflineData<any>({
    storeName: CACHE_STORES.PLANS,
    cacheKey: `approval_detail_${id}`,
    fetchFn: async () => {
      const response = await ApprovalService.getApprovalDetail(Number(id));
      return response.data;
    },
    expiresIn: CACHE_EXPIRY.SHORT
  });

  // 打开操作弹窗
  const handleOpenAction = (action: 'approve' | 'reject' | 'transfer') => {
    setCurrentAction(action);
    setActionModalVisible(true);
  };

  // 处理审批
  const handleProcess = async () => {
    try {
      const values = await form.validate();
      setProcessing(true);

      switch (currentAction) {
        case 'approve':
          await ApprovalService.approveApproval(Number(id), values);
          Message.success('审批通过');
          break;
        case 'reject':
          await ApprovalService.rejectApproval(Number(id), values);
          Message.success('审批拒绝');
          break;
        case 'transfer':
          await ApprovalService.transferApproval(Number(id), values);
          Message.success('审批转交');
          break;
      }

      setActionModalVisible(false);
      refresh(true);
      navigate(-1);
    } catch (error) {
      Message.error('操作失败');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin />
      </div>
    );
  }

  if (!approval) {
    return <div>审批不存在</div>;
  }

  // 获取操作按钮文本
  const getActionTitle = () => {
    switch (currentAction) {
      case 'approve':
        return '审批通过';
      case 'reject':
        return '审批拒绝';
      case 'transfer':
        return '转交审批';
      default:
        return '';
    }
  };

  return (
    <div className="mobile-approval-detail">
      {/* 头部 */}
      <div className="mobile-detail-header">
        <Button
          type="text"
          icon={<IconLeft />}
          onClick={() => navigate(-1)}
        />
        <h2>审批详情</h2>
        <div />
      </div>

      {/* 状态 */}
      <Card className="mobile-detail-card">
        <Space size="medium">
          <Tag color="blue">{approval.status_display}</Tag>
          {approval.is_urgent && <Tag color="red">紧急</Tag>}
        </Space>
      </Card>

      {/* 详情标签页 */}
      <Tabs defaultActiveTab="basic" type="card-gutter">
        {/* 基本信息 */}
        <TabPane key="basic" title="基本信息">
          <Card>
            <Descriptions
              column={1}
              data={[
                { label: '审批单号', value: approval.instance_no },
                { label: '审批标题', value: approval.title },
                { label: '审批类型', value: approval.template?.template_name },
                { label: '发起人', value: approval.initiator?.real_name },
                { label: '发起时间', value: new Date(approval.initiated_at).toLocaleString() },
                { label: '当前节点', value: approval.current_node?.node_name }
              ]}
            />
          </Card>
        </TabPane>

        {/* 表单数据 */}
        <TabPane key="form" title="表单数据">
          <Card>
            {approval.form_data && Object.keys(approval.form_data).length > 0 ? (
              <Descriptions
                column={1}
                data={Object.entries(approval.form_data).map(([key, value]) => ({
                  label: key,
                  value: typeof value === 'object' ? JSON.stringify(value) : String(value)
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#86909C' }}>
                暂无表单数据
              </div>
            )}
          </Card>
        </TabPane>

        {/* 审批流程 */}
        <TabPane key="flow" title="审批流程">
          <Card>
            <Timeline>
              {approval.nodes?.map((node: any) => (
                <Timeline.Item
                  key={node.id}
                  label={new Date(node.created_at).toLocaleString()}
                  dot={
                    node.status === 'approved' ? (
                      <IconCheckCircle style={{ color: '#00B42A' }} />
                    ) : node.status === 'rejected' ? (
                      <IconCloseCircle style={{ color: '#F53F3F' }} />
                    ) : undefined
                  }
                >
                  <div className="mobile-timeline-content">
                    <div className="mobile-timeline-title">
                      {node.node_name}
                      <Tag color={node.status === 'approved' ? 'green' : node.status === 'rejected' ? 'red' : 'blue'}>
                        {node.status_display}
                      </Tag>
                    </div>
                    <div className="mobile-timeline-info">
                      审批人：{node.approvers?.map((a: any) => a.real_name).join('、')}
                    </div>
                    {node.approval_comment && (
                      <div className="mobile-timeline-comment">
                        意见：{node.approval_comment}
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      {/* 操作按钮 */}
      {approval.status === 'pending' && approval.can_approve && (
        <div className="mobile-detail-actions">
          <Space size="medium">
            <Button
              type="primary"
              status="success"
              icon={<IconCheckCircle />}
              onClick={() => handleOpenAction('approve')}
            >
              通过
            </Button>
            <Button
              type="primary"
              status="danger"
              icon={<IconCloseCircle />}
              onClick={() => handleOpenAction('reject')}
            >
              拒绝
            </Button>
            <Button
              type="outline"
              icon={<IconSwap />}
              onClick={() => handleOpenAction('transfer')}
            >
              转交
            </Button>
          </Space>
        </div>
      )}

      {/* 操作弹窗 */}
      <Modal
        title={getActionTitle()}
        visible={actionModalVisible}
        onOk={handleProcess}
        onCancel={() => setActionModalVisible(false)}
        confirmLoading={processing}
      >
        <Form form={form} layout="vertical">
          {currentAction === 'transfer' && (
            <FormItem
              label="转交给"
              field="transfer_to"
              rules={[{ required: true, message: '请选择转交人' }]}
            >
              <Input placeholder="请输入用户ID或姓名" />
            </FormItem>
          )}
          
          <FormItem
            label={currentAction === 'reject' ? '拒绝原因' : '审批意见'}
            field="comment"
            rules={currentAction === 'reject' ? [{ required: true, message: '请输入拒绝原因' }] : []}
          >
            <TextArea
              placeholder={currentAction === 'reject' ? '请输入拒绝原因' : '请输入审批意见（选填）'}
              rows={4}
              maxLength={500}
              showWordLimit
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};

export default MobileApprovalDetail;
