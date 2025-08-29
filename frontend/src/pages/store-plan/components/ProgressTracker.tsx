import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Progress,
  Timeline,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Tooltip,
  Badge,
  Avatar,
  Typography,
  Divider,
  Alert,
  Statistic
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  WarningOutlined,
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { Column } from '@ant-design/plots'
import dayjs from 'dayjs'
import type { StorePlan } from '@/services/types/business'

const { Text, Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface Milestone {
  id: string
  name: string
  description?: string
  targetDate: string
  actualDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  responsible: string
  responsibleName: string
  progress: number
  dependencies?: string[]
  comments?: Array<{
    id: string
    content: string
    author: string
    createdAt: string
  }>
}

interface ProgressTrackerProps {
  plan: StorePlan
  milestones: Milestone[]
  onUpdateMilestone?: (milestoneId: string, data: Partial<Milestone>) => Promise<void>
  onAddMilestone?: (data: Omit<Milestone, 'id'>) => Promise<void>
  editable?: boolean
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  plan,
  milestones,
  onUpdateMilestone,
  onAddMilestone,
  editable = false
}) => {
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form] = Form.useForm()

  // 计算整体进度
  const overallProgress = milestones.length > 0
    ? Math.round(milestones.reduce((acc, m) => acc + m.progress, 0) / milestones.length)
    : 0

  // 统计各状态数量
  const statusCount = milestones.reduce((acc, milestone) => {
    acc[milestone.status] = (acc[milestone.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 计算延期天数
  const getDelayDays = (milestone: Milestone) => {
    if (milestone.status === 'completed') return 0
    const targetDate = dayjs(milestone.targetDate)
    const now = dayjs()
    if (now.isAfter(targetDate)) {
      return now.diff(targetDate, 'day')
    }
    return 0
  }

  // 获取状态配置
  const getStatusConfig = (status: Milestone['status'], delayDays = 0) => {
    const configs = {
      pending: { color: 'default', text: '待开始', icon: <ClockCircleOutlined /> },
      in_progress: { color: 'processing', text: '进行中', icon: <ClockCircleOutlined /> },
      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      overdue: { color: 'error', text: `延期${delayDays}天`, icon: <ExclamationCircleOutlined /> }
    }
    
    if (status !== 'completed' && delayDays > 0) {
      return configs.overdue
    }
    
    return configs[status]
  }

  // 渲染进度概览卡片
  const renderProgressOverview = () => {
    const completedCount = statusCount.completed || 0
    const totalCount = milestones.length
    const overdueCount = milestones.filter(m => getDelayDays(m) > 0).length

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总体进度"
              value={overallProgress}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: overallProgress >= 80 ? '#52c41a' : overallProgress >= 60 ? '#faad14' : '#f5222d' }}
            />
            <Progress 
              percent={overallProgress} 
              strokeColor={overallProgress >= 80 ? '#52c41a' : overallProgress >= 60 ? '#faad14' : '#f5222d'}
              size="small" 
              style={{ marginTop: 8 }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成里程碑"
              value={completedCount}
              suffix={`/ ${totalCount}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              完成率: {totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : 0}%
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={statusCount.in_progress || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              待开始: {statusCount.pending || 0}个
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="延期项目"
              value={overdueCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: overdueCount > 0 ? '#f5222d' : '#52c41a' }}
            />
            {overdueCount > 0 && (
              <Text type="danger" style={{ fontSize: '12px' }}>
                需要关注
              </Text>
            )}
          </Card>
        </Col>
      </Row>
    )
  }

  // 渲染里程碑时间线
  const renderTimeline = () => {
    const timelineItems = milestones
      .sort((a, b) => dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf())
      .map(milestone => {
        const delayDays = getDelayDays(milestone)
        const statusConfig = getStatusConfig(milestone.status, delayDays)
        
        return {
          dot: statusConfig.icon,
          color: statusConfig.color,
          children: (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ marginRight: 8 }}>
                      {milestone.name}
                    </Text>
                    <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                    {milestone.progress > 0 && milestone.progress < 100 && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {milestone.progress}%
                      </Text>
                    )}
                  </div>
                  
                  {milestone.description && (
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: 4 }}>
                      {milestone.description}
                    </Text>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Space size="small">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {milestone.responsibleName}
                      </Text>
                    </Space>
                    <Space size="small">
                      <CalendarOutlined style={{ fontSize: '12px', color: '#999' }} />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(milestone.targetDate).format('MM-DD')}
                      </Text>
                    </Space>
                    {delayDays > 0 && (
                      <Tag color="red" style={{ fontSize: '11px' }}>
                        延期 {delayDays} 天
                      </Tag>
                    )}
                  </div>
                  
                  {milestone.progress > 0 && milestone.progress < 100 && (
                    <Progress 
                      percent={milestone.progress} 
                      size="small" 
                      style={{ marginTop: 8, maxWidth: 200 }} 
                    />
                  )}
                </div>
                
                {editable && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditMilestone(milestone)}
                  />
                )}
              </div>
            </div>
          )
        }
      })

    return (
      <Card title="里程碑进度" style={{ marginBottom: 24 }}>
        <Timeline mode="left" items={timelineItems} />
      </Card>
    )
  }

  // 渲染进度图表
  const renderProgressChart = () => {
    const data = milestones.map(milestone => ({
      milestone: milestone.name.length > 10 ? milestone.name.substring(0, 10) + '...' : milestone.name,
      进度: milestone.progress,
      状态: milestone.status === 'completed' ? '已完成' : 
            milestone.status === 'in_progress' ? '进行中' : '待开始'
    }))

    const config = {
      data,
      xField: 'milestone',
      yField: '进度',
      seriesField: '状态',
      color: ['#52c41a', '#1890ff', '#d9d9d9'],
      columnStyle: {
        radius: [4, 4, 0, 0]
      },
      label: {
        position: 'middle' as const,
        style: {
          fill: '#FFFFFF',
          opacity: 0.8
        }
      },
      legend: {
        position: 'top' as const
      },
      yAxis: {
        max: 100,
        label: {
          formatter: (v: string) => `${v}%`
        }
      }
    }

    return (
      <Card title="进度分析" style={{ marginBottom: 24 }}>
        <Column {...config} height={300} />
      </Card>
    )
  }

  // 编辑里程碑
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    form.setFieldsValue({
      ...milestone,
      targetDate: dayjs(milestone.targetDate),
      actualDate: milestone.actualDate ? dayjs(milestone.actualDate) : null
    })
  }

  // 保存里程碑更新
  const handleSaveMilestone = async (values: any) => {
    if (!editingMilestone || !onUpdateMilestone) return

    try {
      const updateData = {
        ...values,
        targetDate: values.targetDate.toISOString(),
        actualDate: values.actualDate ? values.actualDate.toISOString() : undefined
      }
      
      await onUpdateMilestone(editingMilestone.id, updateData)
      setEditingMilestone(null)
      form.resetFields()
      message.success('里程碑更新成功')
    } catch (error) {
      message.error('保存失败，请重试')
    }
  }

  // 添加新里程碑
  const handleAddMilestone = async (values: any) => {
    if (!onAddMilestone) return

    try {
      const newMilestone = {
        ...values,
        targetDate: values.targetDate.toISOString(),
        status: 'pending' as const,
        progress: 0
      }
      
      await onAddMilestone(newMilestone)
      setShowAddModal(false)
      form.resetFields()
      message.success('里程碑添加成功')
    } catch (error) {
      message.error('添加失败，请重试')
    }
  }

  return (
    <div>
      {/* 进度概览 */}
      {renderProgressOverview()}

      {/* 延期预警 */}
      {milestones.some(m => getDelayDays(m) > 0) && (
        <Alert
          message="发现延期里程碑"
          description={`有 ${milestones.filter(m => getDelayDays(m) > 0).length} 个里程碑出现延期，请及时关注并调整计划`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="primary">
              查看详情
            </Button>
          }
        />
      )}

      <Row gutter={16}>
        <Col span={14}>
          {/* 里程碑时间线 */}
          {renderTimeline()}
        </Col>
        <Col span={10}>
          {/* 进度图表 */}
          {renderProgressChart()}
          
          {/* 操作区域 */}
          {editable && (
            <Card title="快速操作" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddModal(true)}
                  style={{ width: '100%' }}
                >
                  添加里程碑
                </Button>
                <Button
                  icon={<FileTextOutlined />}
                  style={{ width: '100%' }}
                >
                  导出进度报告
                </Button>
                <Button
                  icon={<TeamOutlined />}
                  style={{ width: '100%' }}
                >
                  团队协作
                </Button>
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {/* 编辑里程碑模态框 */}
      <Modal
        title="编辑里程碑"
        open={!!editingMilestone}
        onCancel={() => {
          setEditingMilestone(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveMilestone}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="里程碑名称"
                rules={[{ required: true, message: '请输入里程碑名称' }]}
              >
                <Input placeholder="请输入里程碑名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="pending">待开始</Option>
                  <Option value="in_progress">进行中</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入里程碑描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="progress"
                label="完成进度"
                rules={[{ required: true, message: '请输入进度' }]}
              >
                <Input type="number" min={0} max={100} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="targetDate"
                label="目标完成时间"
                rules={[{ required: true, message: '请选择目标时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actualDate"
                label="实际完成时间"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="responsibleName"
            label="负责人"
            rules={[{ required: true, message: '请输入负责人' }]}
          >
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>
          
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditingMilestone(null)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加里程碑模态框 */}
      <Modal
        title="添加里程碑"
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMilestone}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="里程碑名称"
                rules={[{ required: true, message: '请输入里程碑名称' }]}
              >
                <Input placeholder="请输入里程碑名称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入里程碑描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetDate"
                label="目标完成时间"
                rules={[{ required: true, message: '请选择目标时间' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="responsibleName"
                label="负责人"
                rules={[{ required: true, message: '请输入负责人' }]}
              >
                <Input placeholder="请输入负责人姓名" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowAddModal(false)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProgressTracker