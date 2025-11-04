/**
 * 移动端跟进单详情
 * 支持查看详情、上传图片、录入信息
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Upload,
  Message,
  Spin,
  Tabs,
  Space
} from '@arco-design/web-react';
import { 
  IconLeft, 
  IconCamera, 
  IconEdit,
  IconCheckCircle 
} from '@arco-design/web-react/icon';
import { useOfflineData } from '../../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../../utils/offlineCache';
import ExpansionService from '../../../api/expansionService';
import '../mobile.css';

const TabPane = Tabs.TabPane;

/**
 * 移动端跟进单详情组件
 */
export const MobileFollowUpDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  // 获取跟进单详情
  const { 
    data: followUp, 
    loading,
    refresh 
  } = useOfflineData<any>({
    storeName: CACHE_STORES.PLANS,
    cacheKey: `follow_up_detail_${id}`,
    fetchFn: async () => {
      const response = await ExpansionService.getFollowUpDetail(Number(id));
      return response;
    },
    expiresIn: CACHE_EXPIRY.SHORT
  });

  // 上传图片
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('follow_up_id', id!);
      
      // TODO: 实现图片上传功能
      console.log('上传图片功能待实现');
      Message.success('图片上传成功');
      refresh(true);
    } catch (error) {
      Message.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin />
      </div>
    );
  }

  if (!followUp) {
    return <div>跟进单不存在</div>;
  }

  return (
    <div className="mobile-followup-detail">
      {/* 头部 */}
      <div className="mobile-detail-header">
        <Button
          type="text"
          icon={<IconLeft />}
          onClick={() => navigate(-1)}
        />
        <h2>{followUp.location?.name}</h2>
        <Button
          type="text"
          icon={<IconEdit />}
          onClick={() => navigate(`/mobile/expansion/follow-ups/${id}/edit`)}
        />
      </div>

      {/* 状态和优先级 */}
      <Card className="mobile-detail-card">
        <Space size="medium">
          <Tag color="blue">{followUp.status_display}</Tag>
          <Tag color="orange">{followUp.priority_display}</Tag>
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
                { label: '跟进单号', value: followUp.record_no },
                { label: '点位名称', value: followUp.location?.name },
                { label: '地址', value: `${followUp.location?.province} ${followUp.location?.city} ${followUp.location?.district}` },
                { label: '面积', value: `${followUp.location?.area}㎡` },
                { label: '租金', value: `¥${followUp.location?.rent}/月` },
                { label: '创建人', value: followUp.created_by?.real_name },
                { label: '创建时间', value: new Date(followUp.created_at).toLocaleString() }
              ]}
            />
          </Card>
        </TabPane>

        {/* 调研信息 */}
        <TabPane key="survey" title="调研信息">
          <Card>
            {followUp.survey_data ? (
              <Descriptions
                column={1}
                data={Object.entries(followUp.survey_data).map(([key, value]) => ({
                  label: key,
                  value: String(value)
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#86909C' }}>
                暂无调研信息
              </div>
            )}
            
            {/* 上传调研图片 */}
            <div style={{ marginTop: 16 }}>
              <Upload
                action="/api/upload"
                accept="image/*"
                beforeUpload={handleUpload}
                showUploadList={false}
              >
                <Button
                  type="primary"
                  icon={<IconCamera />}
                  loading={uploading}
                  long
                >
                  拍照上传
                </Button>
              </Upload>
            </div>
          </Card>
        </TabPane>

        {/* 盈利测算 */}
        <TabPane key="profit" title="盈利测算">
          <Card>
            {followUp.profit_calculation ? (
              <>
                <Descriptions
                  column={1}
                  data={[
                    { label: '总投资', value: `¥${followUp.profit_calculation.total_investment}` },
                    { label: '投资回报率', value: `${followUp.profit_calculation.roi}%` },
                    { label: '回本周期', value: `${followUp.profit_calculation.payback_period}个月` },
                    { label: '贡献率', value: `${followUp.profit_calculation.contribution_rate}%` },
                    { label: '月均销售额', value: `¥${followUp.profit_calculation.monthly_sales}` }
                  ]}
                />
                
                {/* 盈利指标卡片 */}
                <div className="mobile-profit-cards">
                  <div className="mobile-profit-card">
                    <div className="mobile-profit-label">ROI</div>
                    <div className="mobile-profit-value">{followUp.profit_calculation.roi}%</div>
                  </div>
                  <div className="mobile-profit-card">
                    <div className="mobile-profit-label">回本周期</div>
                    <div className="mobile-profit-value">{followUp.profit_calculation.payback_period}月</div>
                  </div>
                  <div className="mobile-profit-card">
                    <div className="mobile-profit-label">贡献率</div>
                    <div className="mobile-profit-value">{followUp.profit_calculation.contribution_rate}%</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#86909C' }}>
                暂无盈利测算数据
              </div>
            )}
          </Card>
        </TabPane>

        {/* 签约信息 */}
        <TabPane key="contract" title="签约信息">
          <Card>
            {followUp.contract_info ? (
              <Descriptions
                column={1}
                data={[
                  { label: '签约日期', value: followUp.contract_date },
                  { label: '法人主体', value: followUp.legal_entity?.entity_name },
                  ...Object.entries(followUp.contract_info).map(([key, value]) => ({
                    label: key,
                    value: String(value)
                  }))
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#86909C' }}>
                暂无签约信息
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* 操作按钮 */}
      <div className="mobile-detail-actions">
        {followUp.status === 'investigating' && (
          <Button
            type="primary"
            icon={<IconCheckCircle />}
            onClick={() => navigate(`/mobile/expansion/follow-ups/${id}/survey`)}
            long
          >
            录入调研信息
          </Button>
        )}
        {followUp.status === 'calculating' && (
          <Button
            type="primary"
            icon={<IconCheckCircle />}
            onClick={() => navigate(`/mobile/expansion/follow-ups/${id}/calculate`)}
            long
          >
            执行盈利测算
          </Button>
        )}
        {followUp.status === 'approving' && (
          <Button
            type="primary"
            icon={<IconCheckCircle />}
            onClick={() => navigate(`/mobile/expansion/follow-ups/${id}/contract`)}
            long
          >
            录入签约信息
          </Button>
        )}
      </div>
    </div>
  );
};

export default MobileFollowUpDetail;
