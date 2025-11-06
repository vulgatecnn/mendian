/**
 * 移动端漏斗图组件
 * 优化的漏斗可视化，支持触摸交互
 */
import React, { useState } from 'react'
import { Space, Typography, Progress, Tag, Alert, Drawer, List } from '@arco-design/web-react'
import { IconDown, IconInfoCircle } from '@arco-design/web-react/icon'
import './MobileFunnelChart.css'

const { Text, Title } = Typography

/**
 * 漏斗阶段数据接口
 */
interface FunnelStage {
  name: string
  count: number
  percentage: number
}

/**
 * 转化率数据接口
 */
interface ConversionRate {
  from_stage: string
  to_stage: string
  rate: number
  from_count: number
  to_count: number
}

/**
 * 漏斗数据接口
 */
interface FunnelData {
  stages: Record<string, FunnelStage>
  conversion_rates: ConversionRate[]
  total_count: number
  warning_stages: string[]
  last_updated: string
}

/**
 * 组件属性接口
 */
interface MobileFunnelChartProps {
  data: FunnelData
}

/**
 * 移动端漏斗图组件
 */
const MobileFunnelChart: React.FC<MobileFunnelChartProps> = ({ data }) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  
  // 获取阶段列表（按顺序）
  const getStageList = (): [string, FunnelStage][] => {
    const stageOrder = ['investigating', 'calculating', 'approving', 'signing', 'signed']
    return stageOrder
      .filter(key => data.stages[key])
      .map(key => [key, data.stages[key]])
  }
  
  // 获取阶段颜色
  const getStageColor = (index: number, total: number): string => {
    const colors = ['#165DFF', '#14C9C9', '#F7BA1E', '#F77234', '#00B42A']
    return colors[index % colors.length]
  }
  
  // 获取转化率颜色
  const getConversionColor = (rate: number): string => {
    if (rate >= 70) return '#00B42A'
    if (rate >= 50) return '#F7BA1E'
    if (rate >= 30) return '#FF7D00'
    return '#F53F3F'
  }
  
  // 处理阶段点击
  const handleStageClick = (stageKey: string) => {
    setSelectedStage(stageKey)
    setShowDetail(true)
  }
  
  // 渲染预警信息
  const renderWarnings = () => {
    if (!data.warning_stages || data.warning_stages.length === 0) return null
    
    return (
      <Alert
        type="warning"
        content={
          <Space direction="vertical" size="small">
            <Text strong>转化预警</Text>
            {data.warning_stages.map((warning, index) => (
              <Text key={index} style={{ fontSize: 12 }}>• {warning}</Text>
            ))}
          </Space>
        }
        closable
        style={{ marginBottom: 12 }}
      />
    )
  }
  
  // 渲染漏斗阶段
  const renderFunnelStages = () => {
    const stages = getStageList()
    
    return (
      <div className="mobile-funnel-stages">
        {stages.map(([key, stage], index) => {
          const color = getStageColor(index, stages.length)
          const widthPercent = (stage.count / data.total_count) * 100
          
          return (
            <div key={key} className="funnel-stage-wrapper">
              {/* 阶段块 */}
              <div
                className="funnel-stage"
                style={{
                  background: color,
                  width: `${Math.max(widthPercent, 20)}%`,
                }}
                onClick={() => handleStageClick(key)}
              >
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text style={{ color: '#fff', fontWeight: 500 }}>
                    {stage.name}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                    {stage.count}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>
                    {stage.percentage.toFixed(1)}%
                  </Text>
                </Space>
              </div>
              
              {/* 转化率箭头 */}
              {index < stages.length - 1 && (
                <div className="funnel-conversion">
                  {data.conversion_rates[index] && (
                    <Space size={4}>
                      <IconDown style={{ fontSize: 12 }} />
                      <Tag
                        color={getConversionColor(data.conversion_rates[index].rate)}
                        size="small"
                      >
                        {data.conversion_rates[index].rate.toFixed(1)}%
                      </Tag>
                    </Space>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
  
  // 渲染转化率详情
  const renderConversionDetails = () => {
    return (
      <div className="conversion-details">
        <Title heading={6} style={{ marginBottom: 12 }}>转化率详情</Title>
        <List
          dataSource={data.conversion_rates}
          render={(item) => (
            <List.Item key={`${item.from_stage}-${item.to_stage}`}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{item.from_stage} → {item.to_stage}</Text>
                  <Tag color={getConversionColor(item.rate)}>
                    {item.rate.toFixed(1)}%
                  </Tag>
                </Space>
                <Progress
                  percent={item.rate}
                  color={getConversionColor(item.rate)}
                  showText={false}
                  size="small"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.from_count} → {item.to_count}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </div>
    )
  }
  
  // 渲染阶段详情抽屉
  const renderStageDetail = () => {
    if (!selectedStage || !data.stages[selectedStage]) return null
    
    const stage = data.stages[selectedStage]
    
    return (
      <Drawer
        width="90%"
        title="阶段详情"
        visible={showDetail}
        onCancel={() => setShowDetail(false)}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">阶段名称</Text>
            <Title heading={6} style={{ margin: '4px 0' }}>{stage.name}</Title>
          </div>
          
          <div>
            <Text type="secondary">数量</Text>
            <Title heading={5} style={{ margin: '4px 0', color: '#165DFF' }}>
              {stage.count}
            </Title>
          </div>
          
          <div>
            <Text type="secondary">占比</Text>
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={stage.percentage}
                color="#165DFF"
              />
            </div>
          </div>
          
          <div>
            <Alert
              type="info"
              icon={<IconInfoCircle />}
              content={`该阶段共有 ${stage.count} 个跟进单，占总数的 ${stage.percentage.toFixed(1)}%`}
            />
          </div>
        </Space>
      </Drawer>
    )
  }
  
  return (
    <div className="mobile-funnel-chart">
      {/* 预警信息 */}
      {renderWarnings()}
      
      {/* 总数统计 */}
      <div className="funnel-summary">
        <Space>
          <Text type="secondary">总跟进数：</Text>
          <Text strong style={{ fontSize: 18, color: '#165DFF' }}>
            {data.total_count}
          </Text>
        </Space>
      </div>
      
      {/* 漏斗阶段 */}
      {renderFunnelStages()}
      
      {/* 转化率详情 */}
      {renderConversionDetails()}
      
      {/* 阶段详情抽屉 */}
      {renderStageDetail()}
    </div>
  )
}

export default MobileFunnelChart
