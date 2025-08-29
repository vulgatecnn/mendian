import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  List,
  Avatar,
  Timeline,
  Descriptions,
  Badge,
  Tabs,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Popconfirm,
  Tooltip,
  Image,
  Rate,
  Divider,
  Empty,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  CameraOutlined,
  StarOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

import { usePreparationStore } from '@/stores/preparationStore'
import { 
  ENGINEERING_STATUS_COLORS, 
  PRIORITY_COLORS,
  type EngineeringTask,
  type EngineeringStatusType,
  type Priority,
  type CreateEngineeringTaskRequest,
  type UpdateEngineeringTaskRequest,
  type QualityCheck,
  type SafetyRecord,
  type MaterialUsage
} from '@shared/types'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

// 工程状态选项配置
const ENGINEERING_STATUS_OPTIONS = [
  { value: 'PLANNED', label: '已计划', color: ENGINEERING_STATUS_COLORS.PLANNED },
  { value: 'APPROVED', label: '已批准', color: ENGINEERING_STATUS_COLORS.APPROVED },
  { value: 'IN_PROGRESS', label: '施工中', color: ENGINEERING_STATUS_COLORS.IN_PROGRESS },
  { value: 'SUSPENDED', label: '已暂停', color: ENGINEERING_STATUS_COLORS.SUSPENDED },
  { value: 'COMPLETED', label: '已完成', color: ENGINEERING_STATUS_COLORS.COMPLETED },
  { value: 'CANCELLED', label: '已取消', color: ENGINEERING_STATUS_COLORS.CANCELLED },
  { value: 'ACCEPTED', label: '已验收', color: ENGINEERING_STATUS_COLORS.ACCEPTED },
  { value: 'WARRANTY', label: '保修期', color: ENGINEERING_STATUS_COLORS.WARRANTY },
]

const ENGINEERING_TYPES = [
  { value: 'CONSTRUCTION', label: '基础建设' },
  { value: 'DECORATION', label: '装修装饰' },
  { value: 'EQUIPMENT', label: '设备安装' },
  { value: 'ELECTRICAL', label: '电气工程' },
  { value: 'PLUMBING', label: '管道工程' },
  { value: 'HVAC', label: '暖通空调' },
  { value: 'FIRE_SAFETY', label: '消防工程' },
  { value: 'SECURITY', label: '安防工程' },
  { value: 'NETWORK', label: '网络工程' },
  { value: 'OTHER', label: '其他' },
]

// 状态徽章组件
const StatusBadge: React.FC<{ status: EngineeringStatusType }> = ({ status }) => {
  const option = ENGINEERING_STATUS_OPTIONS.find(opt => opt.value === status)
  return (
    <Badge
      color={option?.color}
      text={option?.label || status}
    />
  )
}

// 工程任务表单组件
const EngineeringTaskForm: React.FC<{
  visible: boolean
  task?: EngineeringTask | null
  projectId: string
  onCancel: () => void
  onOk: () => void
}> = ({ visible, task, projectId, onCancel, onOk }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { createEngineeringTask, updateEngineeringTask } = usePreparationStore()

  const isEdit = Boolean(task)

  useEffect(() => {
    if (visible && task) {
      form.setFieldsValue({
        ...task,
        plannedStartDate: task.plannedStartDate ? dayjs(task.plannedStartDate) : undefined,
        plannedEndDate: task.plannedEndDate ? dayjs(task.plannedEndDate) : undefined,
        actualStartDate: task.actualStartDate ? dayjs(task.actualStartDate) : undefined,
        actualEndDate: task.actualEndDate ? dayjs(task.actualEndDate) : undefined,
      })
    } else if (visible) {
      form.resetFields()
    }
  }, [visible, task, form])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      const submitData = {
        ...values,
        preparationProjectId: projectId,
        plannedStartDate: values.plannedStartDate?.format('YYYY-MM-DD'),
        plannedEndDate: values.plannedEndDate?.format('YYYY-MM-DD'),
        actualStartDate: values.actualStartDate?.format('YYYY-MM-DD'),
        actualEndDate: values.actualEndDate?.format('YYYY-MM-DD'),
      }

      if (isEdit && task) {
        await updateEngineeringTask(task.id, submitData)
      } else {
        await createEngineeringTask(submitData)
      }

      onOk()
      form.resetFields()
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑工程任务' : '新建工程任务'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="projectName"
              label="任务名称"
              rules={[{ required: true, message: '请输入任务名称' }]}
            >
              <Input placeholder="请输入工程任务名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="taskType"
              label="工程类型"
              rules={[{ required: true, message: '请选择工程类型' }]}
            >
              <Select placeholder="请选择工程类型">
                {ENGINEERING_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="supplierId"
              label="承包商"
              rules={[{ required: true, message: '请选择承包商' }]}
            >
              <Select placeholder="请选择承包商">
                {/* 这里应该从接口获取供应商列表 */}
                <Option value="supplier1">建筑工程有限公司</Option>
                <Option value="supplier2">装修装饰有限公司</Option>
                <Option value="supplier3">设备安装有限公司</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contractAmount"
              label="合同金额（元）"
              rules={[{ required: true, message: '请输入合同金额' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入合同金额"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="plannedStartDate"
              label="计划开始日期"
              rules={[{ required: true, message: '请选择计划开始日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="plannedEndDate"
              label="计划结束日期"
              rules={[{ required: true, message: '请选择计划结束日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        {isEdit && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="actualStartDate" label="实际开始日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualEndDate" label="实际结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item name="description" label="工程描述">
          <TextArea rows={3} placeholder="请输入工程详细描述..." />
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <TextArea rows={2} placeholder="请输入备注信息..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// 质量检查记录组件
const QualityCheckList: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [checks, setChecks] = useState<QualityCheck[]>([])
  const [loading, setLoading] = useState(false)

  // 这里应该从API获取质量检查记录
  useEffect(() => {
    // fetchQualityChecks(taskId)
  }, [taskId])

  const mockChecks: QualityCheck[] = [
    {
      id: '1',
      taskId,
      checkDate: '2024-01-15',
      checkType: '基础结构检查',
      checkPoints: [
        { name: '地基深度', standard: '≥2米', score: 95, result: 'PASS', notes: '符合要求' },
        { name: '钢筋间距', standard: '200mm±10mm', score: 90, result: 'PASS' },
        { name: '混凝土强度', standard: 'C30', score: 92, result: 'PASS' }
      ],
      overallScore: 92,
      result: 'PASS',
      inspector: '张工程师',
      inspectedAt: '2024-01-15T10:00:00Z'
    }
  ]

  return (
    <Card title="质量检查记录" size="small">
      {mockChecks.length === 0 ? (
        <Empty description="暂无质量检查记录" />
      ) : (
        <List
          dataSource={mockChecks}
          renderItem={(check) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{check.checkType}</Text>
                    <Tag color={check.result === 'PASS' ? 'green' : 'red'}>
                      {check.result === 'PASS' ? '通过' : '未通过'}
                    </Tag>
                    <Rate disabled defaultValue={check.overallScore / 20} />
                    <Text type="secondary">({check.overallScore}分)</Text>
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">
                      检查员：{check.inspector} | 
                      检查时间：{dayjs(check.checkDate).format('YYYY-MM-DD')}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {check.checkPoints.map((point, index) => (
                        <Tag
                          key={index}
                          color={point.result === 'PASS' ? 'green' : 'red'}
                          style={{ marginBottom: 4 }}
                        >
                          {point.name}: {point.score}分
                        </Tag>
                      ))}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

// 安全记录组件
const SafetyRecordList: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [records, setRecords] = useState<SafetyRecord[]>([])

  const mockRecords: SafetyRecord[] = [
    {
      id: '1',
      taskId,
      recordDate: new Date('2024-01-14'),
      type: 'INSPECTION',
      description: '日常安全检查，所有工人佩戴安全帽，施工区域围栏完整',
      severity: 'LOW',
      status: 'CLOSED',
      reporter: '安全员'
    }
  ]

  return (
    <Card title="安全记录" size="small">
      {mockRecords.length === 0 ? (
        <Empty description="暂无安全记录" />
      ) : (
        <Timeline>
          {mockRecords.map((record) => (
            <Timeline.Item
              key={record.id}
              color={record.severity === 'HIGH' || record.severity === 'CRITICAL' ? 'red' : 'green'}
              dot={<SafetyCertificateOutlined />}
            >
              <div>
                <Space>
                  <Text strong>{record.type === 'INSPECTION' ? '安全检查' : 
                               record.type === 'INCIDENT' ? '安全事故' : '安全培训'}</Text>
                  <Tag color={record.severity === 'CRITICAL' ? 'red' : 
                             record.severity === 'HIGH' ? 'orange' :
                             record.severity === 'MEDIUM' ? 'blue' : 'green'}>
                    {record.severity === 'CRITICAL' ? '紧急' :
                     record.severity === 'HIGH' ? '高危' :
                     record.severity === 'MEDIUM' ? '中等' : '低风险'}
                  </Tag>
                </Space>
                <div style={{ marginTop: 4 }}>
                  <Text>{record.description}</Text>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                  {record.reporter} · {dayjs(record.recordDate).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
    </Card>
  )
}

// 工程管理主组件
const EngineeringManagement: React.FC<{ projectId: string }> = ({ projectId }) => {
  // Store状态
  const {
    engineeringTasks,
    selectedEngineeringTaskIds,
    isLoading,
    fetchEngineeringTasks,
    setSelectedEngineeringTaskIds,
    deleteEngineeringTask,
    updateEngineeringStatus
  } = usePreparationStore()

  // 本地状态
  const [taskFormVisible, setTaskFormVisible] = useState(false)
  const [currentTask, setCurrentTask] = useState<EngineeringTask | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)

  // 初始化数据
  useEffect(() => {
    fetchEngineeringTasks({ preparationProjectId: projectId })
  }, [projectId, fetchEngineeringTasks])

  // 表格列配置
  const columns: ColumnsType<EngineeringTask> = [
    {
      title: '任务名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string, record: EngineeringTask) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {ENGINEERING_TYPES.find(t => t.value === record.taskType)?.label}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: EngineeringStatusType) => (
        <StatusBadge status={status} />
      ),
    },
    {
      title: '进度',
      dataIndex: 'progressPercentage',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '合同金额',
      dataIndex: 'contractAmount',
      key: 'contractAmount',
      render: (amount: number) => (
        <Text>{(amount / 10000).toFixed(2)}万</Text>
      ),
    },
    {
      title: '计划时间',
      key: 'plannedTime',
      render: (_, record: EngineeringTask) => (
        <div style={{ fontSize: 12 }}>
          <div>{dayjs(record.plannedStartDate).format('MM/DD')}</div>
          <div>～{dayjs(record.plannedEndDate).format('MM/DD')}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: EngineeringTask) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setCurrentTask(record)
                setDetailVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentTask(record)
                setTaskFormVisible(true)
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个工程任务吗？"
            onConfirm={() => deleteEngineeringTask(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys: selectedEngineeringTaskIds,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedEngineeringTaskIds(selectedKeys as string[])
    },
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="工程任务"
              value={engineeringTasks.length}
              prefix={<ToolOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="进行中"
              value={engineeringTasks.filter(t => t.status === 'IN_PROGRESS').length}
              valueStyle={{ color: '#faad14' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已完成"
              value={engineeringTasks.filter(t => t.status === 'COMPLETED').length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="合同总额"
              value={engineeringTasks.reduce((sum, task) => sum + (task.contractAmount || 0), 0) / 10000}
              precision={1}
              suffix="万"
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card
        title="工程任务列表"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCurrentTask(null)
                setTaskFormVisible(true)
              }}
            >
              新建任务
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={engineeringTasks}
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          size="small"
        />
      </Card>

      {/* 任务表单 */}
      <EngineeringTaskForm
        visible={taskFormVisible}
        task={currentTask}
        projectId={projectId}
        onCancel={() => {
          setTaskFormVisible(false)
          setCurrentTask(null)
        }}
        onOk={() => {
          setTaskFormVisible(false)
          setCurrentTask(null)
          fetchEngineeringTasks({ preparationProjectId: projectId })
        }}
      />

      {/* 任务详情 */}
      <Modal
        title="工程任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {currentTask && (
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Descriptions column={2}>
                <Descriptions.Item label="任务名称">
                  {currentTask.projectName}
                </Descriptions.Item>
                <Descriptions.Item label="工程类型">
                  {ENGINEERING_TYPES.find(t => t.value === currentTask.taskType)?.label}
                </Descriptions.Item>
                <Descriptions.Item label="合同金额">
                  {(currentTask.contractAmount / 10000).toFixed(2)} 万元
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <StatusBadge status={currentTask.status} />
                </Descriptions.Item>
                <Descriptions.Item label="计划时间">
                  {dayjs(currentTask.plannedStartDate).format('YYYY-MM-DD')} ~ 
                  {dayjs(currentTask.plannedEndDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="实际时间">
                  {currentTask.actualStartDate ? 
                    `${dayjs(currentTask.actualStartDate).format('YYYY-MM-DD')} ~ ${
                      currentTask.actualEndDate ? dayjs(currentTask.actualEndDate).format('YYYY-MM-DD') : '进行中'
                    }` : '未开始'}
                </Descriptions.Item>
              </Descriptions>
              
              {currentTask.description && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>工程描述</Title>
                  <Text>{currentTask.description}</Text>
                </div>
              )}
            </TabPane>

            <TabPane tab="质量检查" key="quality">
              <QualityCheckList taskId={currentTask.id} />
            </TabPane>

            <TabPane tab="安全记录" key="safety">
              <SafetyRecordList taskId={currentTask.id} />
            </TabPane>

            <TabPane tab="材料使用" key="materials">
              <Alert
                message="材料使用记录"
                description="此功能正在开发中，将显示工程材料的使用情况和成本统计。"
                type="info"
                showIcon
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  )
}

export default EngineeringManagement