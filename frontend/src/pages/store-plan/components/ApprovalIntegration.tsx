import React, { useState } from 'react'
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Steps,
  Table,
  Tag,
  Space,
  Avatar,
  Timeline,
  Typography,
  Alert,
  message,
  Tooltip,
  Divider
} from 'antd'
import {
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  AuditOutlined,
  BellOutlined
} from '@ant-design/icons'
import { usePermission } from '@/hooks/usePermission'
import { PERMISSIONS } from '@/constants/permissions'
import dayjs from 'dayjs'
import type { StorePlan } from '@/services/types/business'

const { Step } = Steps
const { TextArea } = Input
const { Option } = Select
const { Title, Text } = Typography

interface ApprovalFlowStep {
  id: string
  stepNumber: number
  stepName: string
  approverType: 'USER' | 'ROLE' | 'DEPARTMENT'
  approvers: Array<{
    id: string
    name: string
    avatar?: string
    title?: string
  }>
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED'
  processedAt?: string
  processedBy?: {
    id: string
    name: string
    avatar?: string
  }
  comment?: string
  deadline?: string
}

interface ApprovalFlow {
  id: string
  flowName: string
  businessType: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  currentStep: number
  totalSteps: number
  submittedAt: string
  submittedBy: {
    id: string
    name: string
    avatar?: string
  }
  steps: ApprovalFlowStep[]
  urgency: 'NORMAL' | 'HIGH' | 'URGENT'
  deadline?: string
  description?: string
}

interface ApprovalIntegrationProps {
  plan: StorePlan
  onStatusChange?: (newStatus: string) => void
  editable?: boolean
}

const ApprovalIntegration: React.FC<ApprovalIntegrationProps> = ({
  plan,
  onStatusChange,
  editable = false
}) => {
  const { hasPermission } = usePermission()
  const [submitModalVisible, setSubmitModalVisible] = useState(false)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 模拟审批流程数据
  const [approvalFlow] = useState<ApprovalFlow>({
    id: 'flow_001',
    flowName: '开店计划审批流程',
    businessType: 'STORE_PLAN',
    status: plan.status === 'PENDING' ? 'PENDING' : 
            plan.status === 'APPROVED' ? 'APPROVED' : 
            plan.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
    currentStep: 1,
    totalSteps: 3,
    submittedAt: plan.createdAt,
    submittedBy: {
      id: plan.createdBy?.id || '',
      name: plan.createdBy?.name || '',
      avatar: plan.createdBy?.avatar
    },
    urgency: plan.priority === 'URGENT' ? 'URGENT' : 'NORMAL',
    deadline: plan.endDate,
    description: plan.description,
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        stepName: '部门经理审批',
        approverType: 'ROLE',
        approvers: [
          {
            id: 'manager_1',
            name: '张经理',
            title: '区域经理'
          }
        ],
        status: 'APPROVED',
        processedAt: '2024-01-16 10:30:00',
        processedBy: {
          id: 'manager_1',
          name: '张经理'
        },
        comment: '计划合理，同意执行'
      },
      {
        id: 'step_2',
        stepNumber: 2,
        stepName: '运营总监审批',
        approverType: 'USER',
        approvers: [
          {
            id: 'director_1',
            name: '李总监',
            title: '运营总监'
          }
        ],
        status: 'PENDING',
        deadline: '2024-01-18 18:00:00'
      },
      {
        id: 'step_3',
        stepNumber: 3,
        stepName: '总裁审批',
        approverType: 'USER',
        approvers: [
          {
            id: 'ceo_1',
            name: '王总',
            title: 'CEO'
          }
        ],
        status: 'PENDING'
      }
    ]
  })

  // 提交审批
  const handleSubmitApproval = async (values: any) => {
    try {
      // 调用审批API
      console.log('提交审批:', values)
      message.success('已提交审批')
      setSubmitModalVisible(false)
      onStatusChange?.('PENDING')
    } catch (error) {
      message.error('提交审批失败')
    }
  }

  // 处理审批
  const handleProcessApproval = async (values: any) => {
    try {
      // 调用审批处理API
      console.log('处理审批:', values)
      message.success(values.action === 'APPROVE' ? '审批通过' : '审批拒绝')
      setApproveModalVisible(false)
      onStatusChange?.(values.action === 'APPROVE' ? 'APPROVED' : 'REJECTED')
    } catch (error) {
      message.error('审批处理失败')
    }
  }

  // 撤回审批
  const handleWithdrawApproval = () => {
    Modal.confirm({
      title: '确认撤回',
      content: '确定要撤回此审批申请吗？撤回后可以重新修改和提交。',
      onOk: async () => {
        try {
          message.success('审批已撤回')
          onStatusChange?.('DRAFT')
        } catch (error) {
          message.error('撤回失败')
        }
      }
    })
  }

  // 获取步骤状态
  const getStepStatus = (step: ApprovalFlowStep) => {
    switch (step.status) {
      case 'APPROVED':
        return 'finish'
      case 'REJECTED':
        return 'error'
      case 'PENDING':
        return step.stepNumber === approvalFlow.currentStep ? 'process' : 'wait'
      case 'SKIPPED':
        return 'wait'
      default:
        return 'wait'
    }
  }

  // 渲染审批步骤
  const renderApprovalSteps = () => (
    <Card title="审批流程" style={{ marginBottom: 16 }}>
      <Steps current={approvalFlow.currentStep - 1} status={
        approvalFlow.status === 'REJECTED' ? 'error' : 'process'
      }>
        {approvalFlow.steps.map(step => (
          <Step
            key={step.id}
            title={step.stepName}
            status={getStepStatus(step)}
            description={
              <div>
                <div>
                  {step.approvers.map(approver => (
                    <Space key={approver.id} size="small">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text>{approver.name}</Text>
                      {approver.title && <Text type="secondary">({approver.title})</Text>}
                    </Space>
                  ))}
                </div>
                {step.processedAt && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dayjs(step.processedAt).format('MM-DD HH:mm')}
                  </Text>
                )}
                {step.deadline && step.status === 'PENDING' && (
                  <Text type={dayjs().isAfter(dayjs(step.deadline)) ? 'danger' : 'warning'} 
                        style={{ fontSize: '12px', display: 'block' }}>
                    截止: {dayjs(step.deadline).format('MM-DD HH:mm')}
                  </Text>
                )}
              </div>
            }
            icon={
              step.status === 'APPROVED' ? <CheckOutlined /> :
              step.status === 'REJECTED' ? <CloseOutlined /> :
              step.status === 'PENDING' ? <ClockCircleOutlined /> : undefined
            }
          />
        ))}
      </Steps>
    </Card>
  )

  // 渲染审批历史
  const renderApprovalHistory = () => {
    const processedSteps = approvalFlow.steps.filter(step => 
      step.status === 'APPROVED' || step.status === 'REJECTED'
    )

    if (processedSteps.length === 0) {
      return (
        <Card title="审批历史">
          <Alert message="暂无审批记录" type="info" showIcon />
        </Card>
      )
    }

    return (
      <Card title="审批历史">
        <Timeline>
          <Timeline.Item color="blue">
            <div>
              <Space>
                <Avatar size="small" src={approvalFlow.submittedBy.avatar} icon={<UserOutlined />} />
                <Text strong>{approvalFlow.submittedBy.name}</Text>
                <Text>提交审批</Text>
              </Space>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(approvalFlow.submittedAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
            </div>
          </Timeline.Item>

          {processedSteps.map(step => (
            <Timeline.Item
              key={step.id}
              color={step.status === 'APPROVED' ? 'green' : 'red'}
            >
              <div>
                <Space>
                  <Avatar size="small" src={step.processedBy?.avatar} icon={<UserOutlined />} />
                  <Text strong>{step.processedBy?.name}</Text>
                  <Text>{step.status === 'APPROVED' ? '审批通过' : '审批拒绝'}</Text>
                  <Tag color={step.status === 'APPROVED' ? 'green' : 'red'}>
                    {step.stepName}
                  </Tag>
                </Space>
                <div style={{ marginTop: 4 }}>
                  {step.comment && (
                    <div style={{ marginBottom: 4 }}>
                      <Text>审批意见: {step.comment}</Text>
                    </div>
                  )}
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dayjs(step.processedAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    )
  }

  // 渲染操作按钮
  const renderActionButtons = () => {
    const buttons = []

    if (plan.status === 'DRAFT' && hasPermission(PERMISSIONS.STORE_PLAN.SUBMIT_APPROVAL)) {
      buttons.push(
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          onClick={() => setSubmitModalVisible(true)}
        >
          提交审批
        </Button>
      )
    }

    if (plan.status === 'PENDING') {
      // 如果是提交人，可以撤回
      if (approvalFlow.submittedBy.id === 'current_user_id') { // 这里应该是当前用户ID
        buttons.push(
          <Button
            key="withdraw"
            icon={<ReloadOutlined />}
            onClick={handleWithdrawApproval}
          >
            撤回申请
          </Button>
        )
      }

      // 如果是当前审批人，可以审批
      const currentStep = approvalFlow.steps[approvalFlow.currentStep - 1]
      if (currentStep && currentStep.approvers.some(a => a.id === 'current_user_id')) {
        buttons.push(
          <Button
            key="approve"
            type="primary"
            icon={<AuditOutlined />}
            onClick={() => setApproveModalVisible(true)}
          >
            处理审批
          </Button>
        )
      }
    }

    return buttons
  }

  // 渲染提交审批模态框
  const renderSubmitModal = () => (
    <Modal
      title="提交审批"
      open={submitModalVisible}
      onCancel={() => setSubmitModalVisible(false)}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmitApproval}
      >
        <Alert
          message="提交说明"
          description="提交审批后，计划将按照预设的审批流程进行审批，在审批完成前无法修改计划内容。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="urgency"
          label="紧急程度"
          initialValue="NORMAL"
          rules={[{ required: true, message: '请选择紧急程度' }]}
        >
          <Select>
            <Option value="NORMAL">普通</Option>
            <Option value="HIGH">紧急</Option>
            <Option value="URGENT">非常紧急</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="deadline"
          label="期望完成时间"
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="comment"
          label="提交说明"
        >
          <TextArea rows={4} placeholder="请说明提交审批的原因和相关情况" />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Space>
            <Button onClick={() => setSubmitModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认提交
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )

  // 渲染审批处理模态框
  const renderApproveModal = () => (
    <Modal
      title="处理审批"
      open={approveModalVisible}
      onCancel={() => setApproveModalVisible(false)}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleProcessApproval}
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5}>{plan.title}</Title>
          <Space>
            <Text type="secondary">申请人:</Text>
            <Text>{approvalFlow.submittedBy.name}</Text>
          </Space>
          <br />
          <Space>
            <Text type="secondary">提交时间:</Text>
            <Text>{dayjs(approvalFlow.submittedAt).format('YYYY-MM-DD HH:mm')}</Text>
          </Space>
          {approvalFlow.description && (
            <>
              <br />
              <Text type="secondary">申请说明:</Text>
              <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                {approvalFlow.description}
              </Paragraph>
            </>
          )}
        </Card>

        <Form.Item
          name="action"
          label="审批决定"
          rules={[{ required: true, message: '请选择审批决定' }]}
        >
          <Select placeholder="请选择审批决定">
            <Option value="APPROVE">
              <Space>
                <CheckOutlined style={{ color: '#52c41a' }} />
                <span>通过</span>
              </Space>
            </Option>
            <Option value="REJECT">
              <Space>
                <CloseOutlined style={{ color: '#f5222d' }} />
                <span>拒绝</span>
              </Space>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="comment"
          label="审批意见"
          rules={[{ required: true, message: '请填写审批意见' }]}
        >
          <TextArea rows={4} placeholder="请填写审批意见" />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Space>
            <Button onClick={() => setApproveModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认提交
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )

  return (
    <div>
      {/* 操作按钮 */}
      {renderActionButtons().length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>{renderActionButtons()}</Space>
        </Card>
      )}

      {/* 审批提醒 */}
      {plan.status === 'PENDING' && (
        <Alert
          message="审批进行中"
          description={`当前正在进行第 ${approvalFlow.currentStep} / ${approvalFlow.totalSteps} 步审批，等待审批人处理。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" icon={<BellOutlined />}>
              催促审批
            </Button>
          }
        />
      )}

      {/* 审批流程 */}
      {(plan.status === 'PENDING' || plan.status === 'APPROVED' || plan.status === 'REJECTED') && (
        <>
          {renderApprovalSteps()}
          {renderApprovalHistory()}
        </>
      )}

      {/* 模态框 */}
      {renderSubmitModal()}
      {renderApproveModal()}
    </div>
  )
}

export default ApprovalIntegration