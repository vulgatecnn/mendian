import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Timeline,
  Row,
  Col,
  Statistic,
  Alert,
  Empty,
  Progress
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

import { usePreparationStore } from '@/stores/preparationStore'
import type { MilestoneTracking } from '@/constants/colors'

const MilestoneTrackingComponent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [formVisible, setFormVisible] = useState(false)
  
  const {
    milestones,
    isLoading,
    fetchMilestones
  } = usePreparationStore()

  useEffect(() => {
    fetchMilestones({ preparationProjectId: projectId })
  }, [projectId, fetchMilestones])

  const columns = [
    {
      title: '里程碑名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>
    },
    {
      title: '计划日期',
      dataIndex: 'plannedDate',
      key: 'plannedDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: MilestoneTracking) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} />
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ]

  const mockTimelineData = [
    {
      title: '项目启动',
      status: 'completed',
      date: '2024-01-01',
      description: '项目正式启动，团队组建完成'
    },
    {
      title: '设计方案确认',
      status: 'completed', 
      date: '2024-01-15',
      description: '设计方案通过审核'
    },
    {
      title: '施工开始',
      status: 'in_progress',
      date: '2024-02-01',
      description: '正式开始施工作业'
    },
    {
      title: '设备安装',
      status: 'pending',
      date: '2024-03-01',
      description: '设备采购到货，开始安装'
    },
    {
      title: '试营业',
      status: 'pending',
      date: '2024-03-15',
      description: '开始试营业阶段'
    }
  ]

  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'in_progress': return 'blue'
      case 'pending': return 'gray'
      case 'overdue': return 'red'
      default: return 'gray'
    }
  }

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />
      case 'in_progress': return <ClockCircleOutlined />
      case 'overdue': return <ExclamationCircleOutlined />
      default: return <FlagOutlined />
    }
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="里程碑总数"
              value={milestones.length}
              prefix={<FlagOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已完成"
              value={0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="进行中"
              value={0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="完成度"
              value={40}
              suffix="%"
              prefix={<Progress type="circle" percent={40} size="small" />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="里程碑列表"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setFormVisible(true)}
              >
                新增里程碑
              </Button>
            }
          >
            {milestones.length === 0 ? (
              <Empty description="暂无里程碑记录" />
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={milestones}
                loading={isLoading}
                size="small"
                pagination={false}
              />
            )}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="项目时间轴">
            <Timeline>
              {mockTimelineData.map((item, index) => (
                <Timeline.Item
                  key={index}
                  color={getTimelineColor(item.status)}
                  dot={getTimelineIcon(item.status)}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      {item.date} | {item.description}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      <Modal
        title="里程碑管理"
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="功能开发中"
          description="里程碑跟踪管理功能正在开发中，敬请期待。"
          type="info"
          showIcon
        />
      </Modal>
    </div>
  )
}

export default MilestoneTrackingComponent