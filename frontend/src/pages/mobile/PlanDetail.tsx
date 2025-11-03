/**
 * 移动端 - 计划详情页面
 * 展示计划的详细信息和执行进度
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, 
  Descriptions, 
  Tag, 
  Progress, 
  Spin, 
  Message,
  Empty,
  Divider
} from '@arco-design/web-react'
import { IconLeft } from '@arco-design/web-react/icon'
import { PlanService } from '../../api/planService'
import { StorePlan, PlanStatus } from '../../types'
import './mobile.css'

// 计划状态配置
const STATUS_CONFIG: Record<PlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'gray' },
  published: { text: '已发布', color: 'blue' },
  executing: { text: '执行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' }
}

const MobilePlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<StorePlan | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * 加载计划详情
   */
  useEffect(() => {
    const loadPlanDetail = async () => {
      if (!id) return

      setLoading(true)
      try {
        const planData = await PlanService.getPlanDetail(Number(id))
        setPlan(planData)
      } catch (error) {
        Message.error('加载计划详情失败')
        console.error('加载计划详情失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlanDetail()
  }, [id])

  /**
   * 返回列表
   */
  const handleBack = () => {
    navigate('/mobile/plans')
  }

  /**
   * 格式化日期
   */
  const formatDate = (dateStr: string) => {
    return dateStr.split('T')[0]
  }

  /**
   * 格式化金额
   */
  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  /**
   * 获取进度条颜色
   */
  const getProgressColor = (rate: number) => {
    if (rate >= 80) return '#00b42a'
    if (rate >= 50) return '#ff7d00'
    return '#f53f3f'
  }

  if (loading) {
    return (
      <div className="mobile-plan-detail loading">
        <Spin size={40} />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mobile-plan-detail">
        <Empty description="计划不存在" />
      </div>
    )
  }

  const completionRate = plan.total_target_count > 0
    ? Math.round((plan.total_completed_count / plan.total_target_count) * 100)
    : 0

  return (
    <div className="mobile-plan-detail">
      {/* 头部导航 */}
      <div className="mobile-header">
        <div className="back-button" onClick={handleBack}>
          <IconLeft />
        </div>
        <h2>计划详情</h2>
      </div>

      <div className="mobile-content">
        {/* 基本信息卡片 */}
        <Card className="detail-card" title="基本信息">
          <Descriptions
            column={1}
            data={[
              {
                label: '计划名称',
                value: plan.name
              },
              {
                label: '计划状态',
                value: (
                  <Tag color={STATUS_CONFIG[plan.status].color}>
                    {STATUS_CONFIG[plan.status].text}
                  </Tag>
                )
              },
              {
                label: '计划类型',
                value: plan.plan_type === 'annual' ? '年度计划' : '季度计划'
              },
              {
                label: '计划周期',
                value: `${formatDate(plan.start_date)} 至 ${formatDate(plan.end_date)}`
              },
              {
                label: '创建人',
                value: plan.created_by_info?.full_name || '未知'
              },
              {
                label: '创建时间',
                value: formatDate(plan.created_at)
              }
            ]}
          />
          
          {plan.description && (
            <>
              <Divider />
              <div className="description">
                <div className="label">计划说明：</div>
                <div className="value">{plan.description}</div>
              </div>
            </>
          )}
        </Card>

        {/* 执行进度卡片 */}
        <Card className="detail-card" title="执行进度">
          <div className="progress-summary">
            <div className="progress-item">
              <div className="label">目标数量</div>
              <div className="value large">{plan.total_target_count}</div>
              <div className="unit">家</div>
            </div>
            <div className="progress-item">
              <div className="label">已完成</div>
              <div className="value large highlight">{plan.total_completed_count}</div>
              <div className="unit">家</div>
            </div>
            <div className="progress-item">
              <div className="label">完成率</div>
              <div className="value large">{completionRate}%</div>
            </div>
          </div>

          <div className="progress-bar">
            <Progress
              percent={completionRate}
              color={getProgressColor(completionRate)}
              size="large"
            />
          </div>

          <div className="budget-info">
            <span className="label">总预算：</span>
            <span className="value">{formatAmount(plan.total_budget_amount)}</span>
          </div>
        </Card>

        {/* 区域计划卡片 */}
        <Card className="detail-card" title="区域计划明细">
          {plan.regional_plans && plan.regional_plans.length > 0 ? (
            <div className="regional-plans">
              {plan.regional_plans.map((regional, index) => {
                const regionalRate = regional.target_count > 0
                  ? Math.round(((regional.completed_count || 0) / regional.target_count) * 100)
                  : 0

                return (
                  <div key={index} className="regional-plan-item">
                    <div className="regional-header">
                      <span className="region-name">
                        {regional.region?.name || '未知区域'}
                      </span>
                      <Tag size="small">
                        {regional.store_type?.name || '未知类型'}
                      </Tag>
                    </div>

                    <div className="regional-stats">
                      <div className="stat-item">
                        <span className="label">目标：</span>
                        <span className="value">{regional.target_count} 家</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">完成：</span>
                        <span className="value highlight">
                          {regional.completed_count || 0} 家
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="label">贡献率：</span>
                        <span className="value">{regional.contribution_rate}%</span>
                      </div>
                    </div>

                    <Progress
                      percent={regionalRate}
                      color={getProgressColor(regionalRate)}
                      showText={true}
                    />

                    <div className="regional-budget">
                      <span className="label">预算：</span>
                      <span className="value">{formatAmount(regional.budget_amount)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty description="暂无区域计划" />
          )}
        </Card>

        {/* 取消原因（如果已取消） */}
        {plan.status === 'cancelled' && plan.cancel_reason && (
          <Card className="detail-card cancel-reason">
            <div className="label">取消原因：</div>
            <div className="value">{plan.cancel_reason}</div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MobilePlanDetail
