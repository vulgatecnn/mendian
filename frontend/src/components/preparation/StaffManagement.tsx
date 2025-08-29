import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Row,
  Col,
  Statistic,
  Alert,
  Empty
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

import { usePreparationStore } from '@/stores/preparationStore'
import type { StaffRecruitment } from '@/constants/colors'

const StaffManagement: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [formVisible, setFormVisible] = useState(false)
  
  const {
    staffRecruitments,
    isLoading,
    fetchStaffRecruitments
  } = usePreparationStore()

  useEffect(() => {
    fetchStaffRecruitments({ preparationProjectId: projectId })
  }, [projectId, fetchStaffRecruitments])

  const columns = [
    {
      title: '职位名称',
      dataIndex: 'positionTitle',
      key: 'positionTitle',
    },
    {
      title: '职位类型',
      dataIndex: 'positionType',
      key: 'positionType',
      render: (type: string) => <Tag>{type}</Tag>
    },
    {
      title: '计划人数',
      dataIndex: 'plannedCount',
      key: 'plannedCount',
    },
    {
      title: '已招聘',
      dataIndex: 'recruitedCount',
      key: 'recruitedCount',
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
      render: (_, record: StaffRecruitment) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} />
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="招聘岗位"
              value={staffRecruitments.length}
              prefix={<TeamOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已招聘"
              value={0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="招聘中"
              value={0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="入职人数"
              value={0}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="人员招聘列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFormVisible(true)}
          >
            新增招聘
          </Button>
        }
      >
        {staffRecruitments.length === 0 ? (
          <Empty description="暂无人员招聘记录" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={staffRecruitments}
            loading={isLoading}
            size="small"
          />
        )}
      </Card>

      <Modal
        title="人员招聘"
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="功能开发中"
          description="人员招聘管理功能正在开发中，敬请期待。"
          type="info"
          showIcon
        />
      </Modal>
    </div>
  )
}

export default StaffManagement