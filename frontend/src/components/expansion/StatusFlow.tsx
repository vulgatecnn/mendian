import React, { useState } from 'react'
import {
  Steps,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Typography,
  Tag,
  message
} from 'antd'
import {
  EyeOutlined,
  BarChartOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  EditOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useExpansionStore } from '@/stores/expansionStore'
import type { CandidateLocation } from '@/services/types'

const { Step } = Steps
const { Text } = Typography
const { TextArea } = Input

interface StatusFlowProps {
  candidateLocation: CandidateLocation
  onStatusChanged?: (newStatus: CandidateLocation['status']) => void
}

const StatusFlow: React.FC<StatusFlowProps> = ({
  candidateLocation,
  onStatusChanged
}) => {
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<CandidateLocation['status'] | null>(null)
  const [form] = Form.useForm()

  const {
    isSubmitting,
    updateLocationStatus
  } = useExpansionStore()

  // 状态配置
  const statusConfig = {
    DISCOVERED: { 
      title: '已发现',
      description: '候选点位已发现',
      icon: <EyeOutlined />,
      color: '#d9d9d9',
      step: 0
    },
    INVESTIGATING: { 
      title: '调研中',
      description: '实地调研评估中',
      icon: <BarChartOutlined />,
      color: '#1890ff',
      step: 1
    },
    NEGOTIATING: { 
      title: '谈判中',
      description: '商务条件谈判中',
      icon: <TeamOutlined />,
      color: '#faad14',
      step: 2
    },
    APPROVED: { 
      title: '已通过',
      description: '审核通过待签约',
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      step: 3
    },
    SIGNED: { 
      title: '已签约',
      description: '成功签约',
      icon: <StarOutlined />,
      color: '#722ed1',
      step: 4
    },
    REJECTED: { 
      title: '已拒绝',
      description: '不符合要求',
      icon: <CloseCircleOutlined />,
      color: '#f5222d',
      step: -1
    }
  }

  // 状态转换规则
  const statusTransitions: Record<CandidateLocation['status'], CandidateLocation['status'][]> = {
    DISCOVERED: ['INVESTIGATING', 'REJECTED'],
    INVESTIGATING: ['NEGOTIATING', 'REJECTED'],
    NEGOTIATING: ['APPROVED', 'INVESTIGATING', 'REJECTED'],
    APPROVED: ['SIGNED', 'REJECTED'],
    SIGNED: [], // 已签约不能再转换
    REJECTED: ['DISCOVERED'] // 拒绝后可以重新开始
  }

  const getCurrentStep = () => {
    const config = statusConfig[candidateLocation.status]
    if (config.step === -1) {
      // 拒绝状态显示在最后
      return 5
    }
    return config.step
  }

  const getStepStatus = (stepIndex: number) => {
    const currentStep = getCurrentStep()
    
    if (candidateLocation.status === 'REJECTED') {
      return stepIndex === 5 ? 'error' : 'wait'
    }
    
    if (stepIndex < currentStep) {
      return 'finish'
    } else if (stepIndex === currentStep) {
      return 'process'
    } else {
      return 'wait'
    }
  }

  const handleStatusChange = (newStatus: CandidateLocation['status']) => {
    setTargetStatus(newStatus)
    setShowChangeModal(true)
    
    // 预设一些常用的变更原因
    const reasons = {
      DISCOVERED: '新发现候选位置',
      INVESTIGATING: '开始实地调研评估',
      NEGOTIATING: '进入商务条件谈判',
      APPROVED: '通过内部审核',
      SIGNED: '成功签署租赁合同',
      REJECTED: '不符合选址要求'
    }
    
    form.setFieldsValue({
      reason: reasons[newStatus] || ''
    })
  }

  const handleConfirmStatusChange = async (values: any) => {
    if (!targetStatus || !candidateLocation.id) return

    const success = await updateLocationStatus(
      candidateLocation.id,
      targetStatus,
      values.reason
    )

    if (success) {
      setShowChangeModal(false)
      form.resetFields()
      onStatusChanged?.(targetStatus)
      message.success('状态更新成功')
    }
  }

  const getAvailableTransitions = () => {
    return statusTransitions[candidateLocation.status] || []
  }

  const renderStatusButtons = () => {
    const availableStatuses = getAvailableTransitions()
    
    if (availableStatuses.length === 0) {
      return (
        <Text type="secondary">
          {candidateLocation.status === 'SIGNED' ? '已完成，无需更多操作' : '暂无可执行的状态变更'}
        </Text>
      )
    }

    return (
      <Space wrap>
        {availableStatuses.map(status => {
          const config = statusConfig[status]
          return (
            <Button
              key={status}
              type={status === 'SIGNED' || status === 'APPROVED' ? 'primary' : 'default'}
              danger={status === 'REJECTED'}
              icon={config.icon}
              onClick={() => handleStatusChange(status)}
            >
              转为{config.title}
            </Button>
          )
        })}
      </Space>
    )
  }

  const steps = [
    {
      title: '已发现',
      description: '候选点位已发现',
      icon: <EyeOutlined />
    },
    {
      title: '调研中',
      description: '实地调研评估',
      icon: <BarChartOutlined />
    },
    {
      title: '谈判中',
      description: '商务条件谈判',
      icon: <TeamOutlined />
    },
    {
      title: '已通过',
      description: '审核通过',
      icon: <CheckCircleOutlined />
    },
    {
      title: '已签约',
      description: '成功签约',
      icon: <StarOutlined />
    },
    {
      title: '已拒绝',
      description: '不符合要求',
      icon: <CloseCircleOutlined />
    }
  ]

  return (
    <Card title="状态流转" style={{ marginBottom: 16 }}>
      {/* 状态步骤条 */}
      <div style={{ marginBottom: 24 }}>
        <Steps 
          current={getCurrentStep()} 
          status={candidateLocation.status === 'REJECTED' ? 'error' : 'process'}
          size="small"
        >
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              status={getStepStatus(index)}
            />
          ))}
        </Steps>
      </div>

      {/* 当前状态信息 */}
      <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
        <Space>
          <Text strong>当前状态：</Text>
          <Tag 
            color={statusConfig[candidateLocation.status].color}
            icon={statusConfig[candidateLocation.status].icon}
          >
            {statusConfig[candidateLocation.status].title}
          </Tag>
          <Text type="secondary">
            {statusConfig[candidateLocation.status].description}
          </Text>
        </Space>
      </div>

      {/* 操作按钮 */}
      <div>
        <Text strong style={{ marginRight: 16 }}>可执行操作：</Text>
        {renderStatusButtons()}
      </div>

      {/* 状态变更模态框 */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            状态变更确认
          </Space>
        }
        open={showChangeModal}
        onCancel={() => setShowChangeModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Tag color={statusConfig[candidateLocation.status].color}>
              {statusConfig[candidateLocation.status].title}
            </Tag>
            <RightOutlined style={{ color: '#999' }} />
            <Tag color={targetStatus ? statusConfig[targetStatus].color : 'default'}>
              {targetStatus ? statusConfig[targetStatus].title : ''}
            </Tag>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleConfirmStatusChange}
        >
          <Form.Item
            name="reason"
            label="变更原因"
            rules={[{ required: true, message: '请输入变更原因' }]}
          >
            <TextArea
              rows={3}
              placeholder="请说明状态变更的原因..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {targetStatus === 'REJECTED' && (
            <Form.Item
              name="rejectionType"
              label="拒绝类型"
            >
              <Select placeholder="选择拒绝原因分类">
                <Select.Option value="location">地理位置不佳</Select.Option>
                <Select.Option value="rent">租金过高</Select.Option>
                <Select.Option value="area">面积不合适</Select.Option>
                <Select.Option value="competition">竞争激烈</Select.Option>
                <Select.Option value="traffic">交通不便</Select.Option>
                <Select.Option value="property">物业条件不符</Select.Option>
                <Select.Option value="other">其他原因</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowChangeModal(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isSubmitting}
                danger={targetStatus === 'REJECTED'}
              >
                确认变更
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default StatusFlow