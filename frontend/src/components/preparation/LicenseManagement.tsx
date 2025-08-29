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
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

import { usePreparationStore } from '@/stores/preparationStore'
import type { LicenseApplication } from '@/constants/colors'

const LicenseManagement: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [formVisible, setFormVisible] = useState(false)
  
  const {
    licenseApplications,
    isLoading,
    fetchLicenseApplications
  } = usePreparationStore()

  useEffect(() => {
    fetchLicenseApplications({ preparationProjectId: projectId })
  }, [projectId, fetchLicenseApplications])

  const columns = [
    {
      title: '证照名称',
      dataIndex: 'licenseName',
      key: 'licenseName',
    },
    {
      title: '类型',
      dataIndex: 'licenseType',
      key: 'licenseType',
      render: (type: string) => <Tag>{type}</Tag>
    },
    {
      title: '发证机关',
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
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
      render: (_, record: LicenseApplication) => (
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
              title="证照总数"
              value={licenseApplications.length}
              prefix={<SafetyCertificateOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已办理"
              value={0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="办理中"
              value={0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="办理费用"
              value={0}
              precision={1}
              suffix="元"
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="证照办理列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFormVisible(true)}
          >
            新增证照
          </Button>
        }
      >
        {licenseApplications.length === 0 ? (
          <Empty description="暂无证照办理记录" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={licenseApplications}
            loading={isLoading}
            size="small"
          />
        )}
      </Card>

      <Modal
        title="证照办理"
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="功能开发中"
          description="证照办理管理功能正在开发中，敬请期待。"
          type="info"
          showIcon
        />
      </Modal>
    </div>
  )
}

export default LicenseManagement