/**
 * 开店计划详情页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  Message,
  Progress,
  Typography,
  Divider,
  Statistic,
  Grid
} from '@arco-design/web-react'
import {
  IconEdit,
  IconCheckCircle,
  IconCloseCircle,
  IconLeft
} from '@arco-design/web-react/icon'
import { useNavigate, useParams } from 'react-router-dom'
import { PlanService } from '../../api'
import { StorePlan, PlanStatus, RegionalPlan } from '../../types'
import { PermissionGuard, PlanPublishModal, PlanCancelModal } from '../../components'
import styles from './PlanDetail.module.css'

const { Title } = Typography
const { Row, Col } = Grid

// 计划状态配置
const PLAN_STATUS_CONFIG: Record<PlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'gray' },
  published: { text: '已发布', color: 'blue' },
  executing: { text: '执行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' }
}

const PlanDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [plan, setPlan] = useState<StorePlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // 模态框状态
  const [publishModalVisible, setPublishModalVisible] = useState(false)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)

  // 加载计划详情
  const loadPlanDetail = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const data = await PlanService.getPlanDetail(parseInt(id))
      setPlan(data)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载计划详情失败')
      navigate('/store-planning/plans')
    } finally {
      setLoading(false)
    }
  }

  // 显示发布确认弹窗
  const showPublishModal = () => {
    setPublishModalVisible(true)
  }

  // 确认发布计划
  const handlePublishConfirm = async () => {
    if (!id) return
    
    try {
      setActionLoading(true)
      await PlanService.publishPlan(parseInt(id))
      Message.success('发布成功')
      setPublishModalVisible(false)
      loadPlanDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '发布失败')
    } finally {
      setActionLoading(false)
    }
  }

  // 显示取消原因输入弹窗
  const showCancelModal = () => {
    setCancelModalVisible(true)
  }

  // 确认取消计划
  const handleCancelConfirm = async (reason: string) => {
    if (!id) return
    
    try {
      setActionLoading(true)
      await PlanService.cancelPlan(parseInt(id), { cancel_reason: reason })
      Message.success('取消成功')
      setCancelModalVisible(false)
      loadPlanDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '取消失败')
    } finally {
      setActionLoading(false)
    }
  }

  // 区域计划表格列配置
  const regionalPlanColumns = [
    {
      title: '经营区域',
      dataIndex: 'region',
      render: (region: any) => region?.name || '-'
    },
    {
      title: '门店类型',
      dataIndex: 'store_type',
      render: (storeType: any) => storeType?.name || '-'
    },
    {
      title: '目标数量',
      dataIndex: 'target_count',
      align: 'right' as const,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成数量',
      dataIndex: 'completed_count',
      align: 'right' as const,
      render: (count: number) => `${count || 0} 家`
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      align: 'right' as const,
      render: (_: any, record: RegionalPlan) => {
        const rate = record.target_count > 0
          ? ((record.completed_count || 0) / record.target_count) * 100
          : 0
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Progress
              percent={rate}
              size="small"
              style={{ width: 100 }}
              status={rate >= 100 ? 'success' : undefined}
            />
            <span>{rate.toFixed(1)}%</span>
          </div>
        )
      }
    },
    {
      title: '贡献率',
      dataIndex: 'contribution_rate',
      align: 'right' as const,
      render: (rate: number) => `${rate?.toFixed(1) || 0}%`
    },
    {
      title: '预算金额',
      dataIndex: 'budget_amount',
      align: 'right' as const,
      render: (amount: number) => `¥${(amount || 0).toLocaleString()}`
    }
  ]

  // 初始加载
  useEffect(() => {
    loadPlanDetail()
  }, [id])

  if (!plan) {
    return null
  }

  const statusConfig = PLAN_STATUS_CONFIG[plan.status]
  const overallCompletionRate = plan.total_target_count > 0
    ? (plan.total_completed_count / plan.total_target_count) * 100
    : 0

  return (
    <div className={styles.container}>
      {/* 页面标题和操作按钮 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button
            icon={<IconLeft />}
            onClick={() => navigate('/store-planning/plans')}
          >
            返回列表
          </Button>
          <Title heading={3} style={{ margin: '0 0 0 16px' }}>
            {plan.name}
          </Title>
          <Tag color={statusConfig.color} style={{ marginLeft: 16 }}>
            {statusConfig.text}
          </Tag>
        </div>
        
        <Space>
          {plan.status === 'draft' && (
            <>
              <PermissionGuard permission="store_planning.plan.edit">
                <Button
                  icon={<IconEdit />}
                  onClick={() => navigate(`/store-planning/plans/${id}/edit`)}
                >
                  编辑
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission="store_planning.plan.publish">
                <Button
                  type="primary"
                  icon={<IconCheckCircle />}
                  onClick={showPublishModal}
                >
                  发布
                </Button>
              </PermissionGuard>
            </>
          )}
          
          {(plan.status === 'published' || plan.status === 'executing') && (
            <PermissionGuard permission="store_planning.plan.cancel">
              <Button
                status="danger"
                icon={<IconCloseCircle />}
                onClick={showCancelModal}
              >
                取消计划
              </Button>
            </PermissionGuard>
          )}
        </Space>
      </div>

      {/* 执行进度统计 */}
      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Title heading={5}>执行进度</Title>
        <Divider />
        
        <Row gutter={24}>
          <Col span={6}>
            <Statistic
              title="总目标数量"
              value={plan.total_target_count}
              suffix="家"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成数量"
              value={plan.total_completed_count}
              suffix="家"
              style={{ color: '#00b42a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="完成率"
              value={overallCompletionRate.toFixed(1)}
              suffix="%"
              style={{ 
                color: overallCompletionRate >= 100 ? '#00b42a' : '#ff7d00' 
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总预算金额"
              value={plan.total_budget_amount}
              prefix="¥"
              precision={2}
            />
          </Col>
        </Row>
        
        <div style={{ marginTop: 24 }}>
          <Progress
            percent={overallCompletionRate}
            status={overallCompletionRate >= 100 ? 'success' : undefined}
          />
        </div>
      </Card>

      {/* 基本信息 */}
      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Title heading={5}>基本信息</Title>
        <Divider />
        
        <Descriptions
          column={2}
          data={[
            {
              label: '计划名称',
              value: plan.name
            },
            {
              label: '计划类型',
              value: plan.plan_type === 'annual' ? '年度计划' : '季度计划'
            },
            {
              label: '计划周期',
              value: `${plan.start_date} 至 ${plan.end_date}`
            },
            {
              label: '计划状态',
              value: <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            },
            {
              label: '创建人',
              value: plan.created_by_info?.full_name || plan.created_by_info?.username || '-'
            },
            {
              label: '创建时间',
              value: plan.created_at ? new Date(plan.created_at).toLocaleString('zh-CN') : '-'
            },
            {
              label: '发布时间',
              value: plan.published_at ? new Date(plan.published_at).toLocaleString('zh-CN') : '-'
            },
            {
              label: '更新时间',
              value: plan.updated_at ? new Date(plan.updated_at).toLocaleString('zh-CN') : '-'
            }
          ]}
        />
        
        {plan.description && (
          <>
            <Divider />
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>计划描述：</div>
              <div style={{ color: '#86909c' }}>{plan.description}</div>
            </div>
          </>
        )}
        
        {plan.status === 'cancelled' && plan.cancel_reason && (
          <>
            <Divider />
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500, color: '#f53f3f' }}>
                取消原因：
              </div>
              <div style={{ color: '#86909c' }}>{plan.cancel_reason}</div>
            </div>
          </>
        )}
      </Card>

      {/* 区域计划详情 */}
      <Card loading={loading}>
        <Title heading={5}>区域计划详情</Title>
        <Divider />
        
        <Table
          columns={regionalPlanColumns}
          data={plan.regional_plans || []}
          pagination={false}
          rowKey="id"
        />
      </Card>

      {/* 发布确认弹窗 */}
      <PlanPublishModal
        visible={publishModalVisible}
        planName={plan.name}
        onConfirm={handlePublishConfirm}
        onCancel={() => setPublishModalVisible(false)}
        loading={actionLoading}
      />

      {/* 取消原因输入弹窗 */}
      <PlanCancelModal
        visible={cancelModalVisible}
        planName={plan.name}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelModalVisible(false)}
        loading={actionLoading}
      />
    </div>
  )
}

export default PlanDetail
