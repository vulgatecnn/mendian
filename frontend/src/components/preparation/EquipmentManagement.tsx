import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Tooltip,
  Empty
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

import { usePreparationStore } from '@/stores/preparationStore'
import type { EquipmentProcurement } from '@/constants/colors'

const { Title } = Typography

const EquipmentManagement: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [formVisible, setFormVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<EquipmentProcurement | null>(null)
  
  const {
    equipmentProcurements,
    isLoading,
    fetchEquipmentProcurements
  } = usePreparationStore()

  useEffect(() => {
    fetchEquipmentProcurements({ preparationProjectId: projectId })
  }, [projectId, fetchEquipmentProcurements])

  const columns = [
    {
      title: '设备名称',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
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
      render: (_, record: EquipmentProcurement) => (
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
              title="设备总数"
              value={equipmentProcurements.length}
              prefix={<BankOutlined />}
              suffix="项"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已到货"
              value={0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待采购"
              value={0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="采购总额"
              value={0}
              precision={1}
              suffix="万"
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="设备采购列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFormVisible(true)}
          >
            新增设备
          </Button>
        }
      >
        {equipmentProcurements.length === 0 ? (
          <Empty description="暂无设备采购记录" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={equipmentProcurements}
            loading={isLoading}
            size="small"
          />
        )}
      </Card>

      <Modal
        title="设备采购"
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="功能开发中"
          description="设备采购管理功能正在开发中，敬请期待。"
          type="info"
          showIcon
        />
      </Modal>
    </div>
  )
}

export default EquipmentManagement