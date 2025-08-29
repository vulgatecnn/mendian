import React, { useState } from 'react'
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Avatar,
  Typography,
  Row,
  Col,
  Badge,
  Tooltip,
  Progress,
  Statistic,
  List,
  Timeline,
  Tabs,
  Transfer,
  TreeSelect
} from 'antd'
import {
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  ReloadOutlined,
  FilterOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

interface TaskData {
  id: string
  title: string
  description: string
  type: 'FOLLOW_UP' | 'SITE_VISIT' | 'NEGOTIATION' | 'EVALUATION' | 'CONTRACT_SIGN'
  candidateLocationId?: string
  candidateLocationName?: string
  assigneeId: string
  assigneeName: string
  assignerName: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  dueDate: string
  estimatedHours: number
  actualHours?: number
  progress: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface TeamMember {
  id: string
  name: string
  avatar?: string
  department: string
  position: string
  workload: number
  maxCapacity: number
  skills: string[]
  currentTasks: number
  completionRate: number
}

const TaskAssignment: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [currentTask, setCurrentTask] = useState<TaskData | null>(null)
  const [activeTab, setActiveTab] = useState('tasks')

  // 模拟数据
  const mockTasks: TaskData[] = [
    {
      id: '1',
      title: '万达广场A区实地考察',
      description: '对万达广场A区候选点位进行详细实地考察，评估商业价值',
      type: 'SITE_VISIT',
      candidateLocationId: '1',
      candidateLocationName: '万达广场A区候选点位',
      assigneeId: '1',
      assigneeName: '张三',
      assignerName: '李经理',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2024-02-20T16:00:00Z',
      estimatedHours: 4,
      actualHours: 2,
      progress: 60,
      tags: ['实地考察', '重要', '万达'],
      createdAt: '2024-02-15T10:00:00Z',
      updatedAt: '2024-02-18T14:30:00Z'
    },
    {
      id: '2',
      title: '银泰城B座商务谈判',
      description: '与银泰城B座业主进行租金和合同条款谈判',
      type: 'NEGOTIATION',
      candidateLocationId: '2',
      candidateLocationName: '银泰城B座潜力点位',
      assigneeId: '2',
      assigneeName: '李四',
      assignerName: '王主管',
      priority: 'URGENT',
      status: 'PENDING',
      dueDate: '2024-02-18T10:00:00Z',
      estimatedHours: 6,
      progress: 0,
      tags: ['商务谈判', '紧急', '银泰城'],
      createdAt: '2024-02-16T09:00:00Z',
      updatedAt: '2024-02-16T09:00:00Z'
    },
    {
      id: '3',
      title: '朝阳大悦城跟进回访',
      description: '跟进朝阳大悦城候选点位的最新进展',
      type: 'FOLLOW_UP',
      candidateLocationId: '3',
      candidateLocationName: '朝阳大悦城潜在店铺',
      assigneeId: '3',
      assigneeName: '王五',
      assignerName: '陈总监',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: '2024-02-17T14:00:00Z',
      estimatedHours: 2,
      actualHours: 1.5,
      progress: 100,
      tags: ['跟进回访', '大悦城'],
      createdAt: '2024-02-14T11:00:00Z',
      updatedAt: '2024-02-17T15:30:00Z'
    }
  ]

  const mockTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: '张三',
      avatar: '',
      department: '拓店部',
      position: '高级拓店专员',
      workload: 70,
      maxCapacity: 40,
      skills: ['实地考察', '商业分析', '谈判'],
      currentTasks: 3,
      completionRate: 85
    },
    {
      id: '2',
      name: '李四',
      avatar: '',
      department: '商务部',
      position: '商务经理',
      workload: 90,
      maxCapacity: 45,
      skills: ['商务谈判', '合同审查', '关系维护'],
      currentTasks: 5,
      completionRate: 78
    },
    {
      id: '3',
      name: '王五',
      avatar: '',
      department: '拓店部',
      position: '拓店专员',
      workload: 50,
      maxCapacity: 35,
      skills: ['跟进回访', '数据整理', '客户沟通'],
      currentTasks: 2,
      completionRate: 92
    },
    {
      id: '4',
      name: '赵六',
      avatar: '',
      department: '评估部',
      position: '评估师',
      workload: 60,
      maxCapacity: 30,
      skills: ['点位评估', '市场分析', '报告撰写'],
      currentTasks: 2,
      completionRate: 88
    }
  ]

  // 任务类型映射
  const taskTypeMap = {
    FOLLOW_UP: { color: '#1890ff', text: '跟进回访', icon: <PhoneOutlined /> },
    SITE_VISIT: { color: '#52c41a', text: '实地考察', icon: <EnvironmentOutlined /> },
    NEGOTIATION: { color: '#fa8c16', text: '商务谈判', icon: <TeamOutlined /> },
    EVALUATION: { color: '#722ed1', text: '点位评估', icon: <BarChartOutlined /> },
    CONTRACT_SIGN: { color: '#eb2f96', text: '合同签署', icon: <EditOutlined /> }
  }

  const statusMap = {
    PENDING: { color: '#d9d9d9', text: '待分配' },
    ASSIGNED: { color: '#1890ff', text: '已分配' },
    IN_PROGRESS: { color: '#faad14', text: '进行中' },
    COMPLETED: { color: '#52c41a', text: '已完成' },
    CANCELLED: { color: '#ff4d4f', text: '已取消' }
  }

  const priorityMap = {
    LOW: { color: '#52c41a', text: '低' },
    MEDIUM: { color: '#1890ff', text: '中' },
    HIGH: { color: '#fa8c16', text: '高' },
    URGENT: { color: '#ff4d4f', text: '紧急' }
  }

  // 任务列表表格列
  const taskColumns = [
    {
      title: '任务信息',
      key: 'taskInfo',
      width: 250,
      render: (record: TaskData) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            <Space>
              {taskTypeMap[record.type]?.icon}
              {record.title}
              <Tag color={priorityMap[record.priority]?.color} size="small">
                {priorityMap[record.priority]?.text}
              </Tag>
            </Space>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            {record.description}
          </div>
          {record.candidateLocationName && (
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              <EnvironmentOutlined style={{ marginRight: '4px' }} />
              {record.candidateLocationName}
            </div>
          )}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: keyof typeof taskTypeMap) => (
        <Tag color={taskTypeMap[type]?.color} icon={taskTypeMap[type]?.icon}>
          {taskTypeMap[type]?.text}
        </Tag>
      )
    },
    {
      title: '负责人',
      key: 'assignee',
      width: 120,
      render: (record: TaskData) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size="small" style={{ backgroundColor: '#1890ff', marginRight: '8px' }}>
            {record.assigneeName[0]}
          </Avatar>
          <div>
            <div style={{ fontSize: '13px' }}>{record.assigneeName}</div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {mockTeamMembers.find(m => m.id === record.assigneeId)?.department}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof statusMap) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      render: (record: TaskData) => (
        <div>
          <Progress 
            percent={record.progress} 
            size="small" 
            status={record.status === 'COMPLETED' ? 'success' : 'active'}
          />
          <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
            {record.actualHours || 0}h / {record.estimatedHours}h
          </div>
        </div>
      )
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => {
        const dueDate = dayjs(date)
        const isOverdue = dueDate.isBefore(dayjs()) && dueDate.diff(dayjs(), 'day') !== 0
        const isToday = dueDate.isSame(dayjs(), 'day')
        const isTomorrow = dueDate.diff(dayjs(), 'day') === 1
        
        return (
          <div>
            <div style={{ 
              color: isOverdue ? '#ff4d4f' : isToday ? '#fa8c16' : '#666',
              fontSize: '12px'
            }}>
              {dueDate.format('MM-DD HH:mm')}
            </div>
            {isOverdue && <Tag color="error" size="small">逾期</Tag>}
            {isToday && <Tag color="warning" size="small">今日</Tag>}
            {isTomorrow && <Tag color="processing" size="small">明日</Tag>}
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (record: TaskData) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewTask(record)}
            />
          </Tooltip>
          <Tooltip title="编辑任务">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditTask(record)}
            />
          </Tooltip>
          <Tooltip title="重新分配">
            <Button 
              type="link" 
              icon={<SendOutlined />} 
              size="small"
              onClick={() => handleReassignTask(record)}
            />
          </Tooltip>
          {record.status !== 'COMPLETED' && (
            <Tooltip title="取消任务">
              <Button 
                type="link" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
                onClick={() => handleCancelTask(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  // 团队成员表格列
  const memberColumns = [
    {
      title: '成员',
      key: 'member',
      render: (member: TeamMember) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff', marginRight: '12px' }}>
            {member.name[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold' }}>{member.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {member.department} · {member.position}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              技能：{member.skills.join('、')}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '工作负载',
      key: 'workload',
      width: 200,
      render: (member: TeamMember) => {
        const percentage = (member.workload / member.maxCapacity) * 100
        const status = percentage > 90 ? 'exception' : percentage > 70 ? 'active' : 'success'
        
        return (
          <div>
            <Progress 
              percent={percentage} 
              size="small" 
              status={status}
              format={() => `${member.workload}h / ${member.maxCapacity}h`}
            />
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              当前任务：{member.currentTasks}个
            </div>
          </div>
        )
      }
    },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 100,
      render: (rate: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
            {rate}%
          </div>
          <Progress 
            percent={rate} 
            size="small" 
            showInfo={false}
            strokeColor="#52c41a"
          />
        </div>
      )
    },
    {
      title: '可分配',
      key: 'available',
      width: 80,
      render: (member: TeamMember) => {
        const available = member.maxCapacity - member.workload > 5
        return (
          <Tag color={available ? 'success' : 'error'}>
            {available ? '可分配' : '繁忙'}
          </Tag>
        )
      }
    }
  ]

  // 事件处理
  const handleViewTask = (task: TaskData) => {
    navigate(`/expansion/tasks/${task.id}`)
  }

  const handleEditTask = (task: TaskData) => {
    navigate(`/expansion/tasks/${task.id}/edit`)
  }

  const handleReassignTask = (task: TaskData) => {
    setCurrentTask(task)
    setShowAssignModal(true)
  }

  const handleCancelTask = (task: TaskData) => {
    Modal.confirm({
      title: '确认取消任务',
      content: `确定要取消任务"${task.title}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('任务已取消')
      }
    })
  }

  const handleCreateTask = () => {
    navigate('/expansion/tasks/create')
  }

  const handleBatchAssign = () => {
    if (selectedTasks.length === 0) {
      message.warning('请先选择要分配的任务')
      return
    }
    setShowBatchAssignModal(true)
  }

  const handleAssignSubmit = (values: any) => {
    console.log('分配任务:', values)
    message.success('任务分配成功')
    setShowAssignModal(false)
    setCurrentTask(null)
  }

  const handleBatchAssignSubmit = (values: any) => {
    console.log('批量分配任务:', values)
    message.success(`成功分配${selectedTasks.length}个任务`)
    setShowBatchAssignModal(false)
    setSelectedTasks([])
  }

  // 统计数据
  const stats = {
    total: mockTasks.length,
    pending: mockTasks.filter(t => t.status === 'PENDING').length,
    inProgress: mockTasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: mockTasks.filter(t => t.status === 'COMPLETED').length,
    overdue: mockTasks.filter(t => dayjs(t.dueDate).isBefore(dayjs()) && t.status !== 'COMPLETED').length
  }

  return (
    <div>
      <PageHeader
        title="任务分配管理"
        description="统一管理拓店相关任务的分配和跟踪"
        breadcrumbs={[
          { title: '拓店管理', path: '/expansion' },
          { title: '任务分配' }
        ]}
        extra={[
          <Button key="batch" onClick={handleBatchAssign} disabled={selectedTasks.length === 0}>
            批量分配 ({selectedTasks.length})
          </Button>,
          <Button key="refresh" icon={<ReloadOutlined />}>
            刷新
          </Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateTask}>
            创建任务
          </Button>
        ]}
      />

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总任务"
              value={stats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待分配"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="逾期任务"
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            {stats.overdue > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Tag color="error" size="small">需要关注</Tag>
              </div>
            )}
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="团队效率"
              value={85.5}
              precision={1}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="任务列表" key="tasks">
            <Table<TaskData>
              rowKey="id"
              columns={taskColumns}
              dataSource={mockTasks}
              rowSelection={{
                selectedRowKeys: selectedTasks,
                onChange: setSelectedTasks
              }}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
              }}
            />
          </TabPane>

          <TabPane tab="团队成员" key="members">
            <Table<TeamMember>
              rowKey="id"
              columns={memberColumns}
              dataSource={mockTeamMembers}
              pagination={false}
            />
          </TabPane>

          <TabPane tab="任务看板" key="kanban">
            <Row gutter={16}>
              {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                <Col span={8} key={status}>
                  <Card 
                    title={statusMap[status as keyof typeof statusMap]?.text} 
                    size="small"
                    style={{ marginBottom: 16 }}
                  >
                    <List
                      size="small"
                      dataSource={mockTasks.filter(t => t.status === status)}
                      renderItem={(task) => (
                        <List.Item>
                          <Card size="small" style={{ width: '100%' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <Space>
                                <Tag color={taskTypeMap[task.type]?.color} size="small">
                                  {taskTypeMap[task.type]?.text}
                                </Tag>
                                <Tag color={priorityMap[task.priority]?.color} size="small">
                                  {priorityMap[task.priority]?.text}
                                </Tag>
                              </Space>
                            </div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                              负责人：{task.assigneeName}
                            </div>
                            <Progress 
                              percent={task.progress} 
                              size="small"
                              status={status === 'COMPLETED' ? 'success' : 'active'}
                            />
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                              {dayjs(task.dueDate).format('MM-DD HH:mm')}
                            </div>
                          </Card>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 任务分配弹窗 */}
      <Modal
        title="重新分配任务"
        open={showAssignModal}
        onCancel={() => setShowAssignModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAssignSubmit}
        >
          {currentTask && (
            <div style={{ backgroundColor: '#f5f5f5', padding: '12px', marginBottom: '16px' }}>
              <Text strong>当前任务：</Text>{currentTask.title}
              <br />
              <Text type="secondary">当前负责人：{currentTask.assigneeName}</Text>
            </div>
          )}
          
          <Form.Item
            name="assigneeId"
            label="新负责人"
            rules={[{ required: true, message: '请选择新负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {mockTeamMembers.map(member => (
                <Option key={member.id} value={member.id}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar size="small" style={{ marginRight: '8px' }}>
                      {member.name[0]}
                    </Avatar>
                    <div>
                      <div>{member.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {member.department} · 负载 {member.workload}h/{member.maxCapacity}h
                      </div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="分配原因"
            rules={[{ required: true, message: '请输入分配原因' }]}
          >
            <TextArea rows={3} placeholder="请说明重新分配的原因" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认分配
              </Button>
              <Button onClick={() => setShowAssignModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量分配弹窗 */}
      <Modal
        title={`批量分配任务 (${selectedTasks.length}个)`}
        open={showBatchAssignModal}
        onCancel={() => setShowBatchAssignModal(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBatchAssignSubmit}
        >
          <Form.Item
            name="assigneeId"
            label="分配给"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {mockTeamMembers.map(member => (
                <Option key={member.id} value={member.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar size="small" style={{ marginRight: '8px' }}>
                        {member.name[0]}
                      </Avatar>
                      <div>
                        <div>{member.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {member.department} · {member.position}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px' }}>
                        负载：{member.workload}h/{member.maxCapacity}h
                      </div>
                      <Progress 
                        percent={(member.workload / member.maxCapacity) * 100} 
                        size="small" 
                        showInfo={false}
                      />
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="分配说明"
            rules={[{ required: true, message: '请输入分配说明' }]}
          >
            <TextArea rows={3} placeholder="请说明批量分配的原因和要求" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认批量分配
              </Button>
              <Button onClick={() => setShowBatchAssignModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TaskAssignment