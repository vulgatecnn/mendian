/**
 * 移动端计划进度组件
 * 优化的进度可视化，支持触摸交互
 */
import React, { useState } from 'react'
import { Card, Space, Typography, Progress, Tag, Drawer, List } from '@arco-design/web-react'
import { IconCheckCircle, IconClockCircle } from '@arco-design/web-react/icon'
import './MobilePlanProgress.css'

const { Text, Title } = Typography

/**
 * 分组进度数据接口
 */
interface GroupProgress {
  name: string
  target_count: number
  completed_count: number
  completion_rate: number
}

/**
 * 计划数据接口
 */
interface PlanData {
  plan_id: number
  plan_name: string
  plan_type: string
  status: string
  start_date: string
  end_date: string
  total_target_count: number
  total_completed_count: number
  completion_rate: number
  grouped_progress: Record<string, GroupProgress>
}

/**
 * 进度数据接口
 */
interface PlanProgressData {
  plans: PlanData[]
  overall_statistics: {
    total_plans: number
    total_target_count: number
    total_completed_count: number
    overall_completion_rate: number
  }
  last_updated: string
}

/**
 * 组件属性接口
 */
interface MobilePlanProgressProps {
  data: PlanProgressData
}

/**
 * 移动端计划进度组件
 */
const MobilePlanProgress: React.FC<MobilePlanProgressProps> = ({ data }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  
  // 获取进度颜色
  const getProgressColor = (rate: number): string => {
    if (rate >= 80) return '#00B42A'
    if (rate >= 60) return '#14C9C9'
    if (rate >= 40) return '#F7BA1E'
    if (rate >= 20) return '#FF7D00'
    return '#F53F3F'
  }
  
  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      published: { text: '已发布', color: 'blue' },
      executing: { text: '执行中', color: 'green' },
      completed: { text: '已完成', color: 'gray' },
      draft: { text: '草稿', color: 'default' },
    }
    const config = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={config.color}>{config.text}</Tag>
  }
  
  // 处理计划点击
  const handlePlanClick = (plan: PlanData) => {
    setSelectedPlan(plan)
    setShowDetail(true)
  }
  
  // 渲染总体统计
  const renderOverallStats = () => {
    const { overall_statistics } = data
    
    return (
      <Card className="overall-stats-card" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>总目标</Text>
              <Title heading={5} style={{ margin: '4px 0', color: '#165DFF' }}>
                {overall_statistics.total_target_count}
              </Title>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>已完成</Text>
              <Title heading={5} style={{ margin: '4px 0', color: '#00B42A' }}>
                {overall_statistics.total_completed_count}
              </Title>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>完成率</Text>
              <Title heading={5} style={{ margin: '4px 0', color: getProgressColor(overall_statistics.overall_completion_rate) }}>
                {overall_statistics.overall_completion_rate.toFixed(1)}%
              </Title>
            </div>
          </Space>
          
          <Progress
            percent={overall_statistics.overall_completion_rate}
            color={getProgressColor(overall_statistics.overall_completion_rate)}
            size="large"
          />
        </Space>
      </Card>
    )
  }
  
  // 渲染计划列表
  const renderPlanList = () => {
    return (
      <div className="mobile-plan-list">
        {data.plans.map(plan => (
          <Card
            key={plan.plan_id}
            className="plan-card"
            bordered={false}
            onClick={() => handlePlanClick(plan)}
          >
            <Space direction="vertical" size="medium" style={{ width: '100%' }}>
              {/* 计划标题 */}
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Text strong>{plan.plan_name}</Text>
                  {getStatusTag(plan.status)}
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(plan.start_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {new Date(plan.end_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </Text>
              </Space>
              
              {/* 进度条 */}
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Space size={4}>
                    <IconCheckCircle style={{ color: '#00B42A', fontSize: 14 }} />
                    <Text style={{ fontSize: 12 }}>
                      {plan.total_completed_count} / {plan.total_target_count}
                    </Text>
                  </Space>
                  <Text strong style={{ color: getProgressColor(plan.completion_rate) }}>
                    {plan.completion_rate.toFixed(1)}%
                  </Text>
                </Space>
                <Progress
                  percent={plan.completion_rate}
                  color={getProgressColor(plan.completion_rate)}
                  showText={false}
                />
              </div>
              
              {/* 分组进度预览 */}
              <Space wrap size="small">
                {Object.entries(plan.grouped_progress).map(([key, group]) => (
                  <Tag key={key} size="small">
                    {group.name}: {group.completion_rate.toFixed(0)}%
                  </Tag>
                ))}
              </Space>
            </Space>
          </Card>
        ))}
      </div>
    )
  }
  
  // 渲染计划详情抽屉
  const renderPlanDetail = () => {
    if (!selectedPlan) return null
    
    return (
      <Drawer
        width="90%"
        title="计划详情"
        visible={showDetail}
        onCancel={() => setShowDetail(false)}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 基本信息 */}
          <div>
            <Text type="secondary">计划名称</Text>
            <Title heading={6} style={{ margin: '4px 0' }}>{selectedPlan.plan_name}</Title>
          </div>
          
          <div>
            <Text type="secondary">计划状态</Text>
            <div style={{ marginTop: 4 }}>
              {getStatusTag(selectedPlan.status)}
            </div>
          </div>
          
          <div>
            <Text type="secondary">计划周期</Text>
            <Text style={{ display: 'block', marginTop: 4 }}>
              {new Date(selectedPlan.start_date).toLocaleDateString('zh-CN')}
              {' 至 '}
              {new Date(selectedPlan.end_date).toLocaleDateString('zh-CN')}
            </Text>
          </div>
          
          {/* 总体进度 */}
          <div>
            <Text type="secondary">总体进度</Text>
            <div style={{ marginTop: 8 }}>
              <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>
                  已完成 {selectedPlan.total_completed_count} / {selectedPlan.total_target_count}
                </Text>
                <Text strong style={{ color: getProgressColor(selectedPlan.completion_rate) }}>
                  {selectedPlan.completion_rate.toFixed(1)}%
                </Text>
              </Space>
              <Progress
                percent={selectedPlan.completion_rate}
                color={getProgressColor(selectedPlan.completion_rate)}
              />
            </div>
          </div>
          
          {/* 分组进度详情 */}
          <div>
            <Text type="secondary">分组进度</Text>
            <List
              style={{ marginTop: 8 }}
              dataSource={Object.entries(selectedPlan.grouped_progress)}
              render={([key, group]) => (
                <List.Item key={key}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong>{group.name}</Text>
                      <Text style={{ color: getProgressColor(group.completion_rate) }}>
                        {group.completion_rate.toFixed(1)}%
                      </Text>
                    </Space>
                    <Progress
                      percent={group.completion_rate}
                      color={getProgressColor(group.completion_rate)}
                      showText={false}
                      size="small"
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      目标: {group.target_count} | 完成: {group.completed_count}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Drawer>
    )
  }
  
  return (
    <div className="mobile-plan-progress">
      {/* 总体统计 */}
      {renderOverallStats()}
      
      {/* 计划列表 */}
      {renderPlanList()}
      
      {/* 计划详情抽屉 */}
      {renderPlanDetail()}
    </div>
  )
}

export default MobilePlanProgress
