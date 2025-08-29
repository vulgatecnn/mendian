import React, { useEffect, useState, useCallback } from 'react'
import {
  Card,
  Tabs,
  Row,
  Col,
  Descriptions,
  Button,
  Space,
  Tag,
  Progress,
  Timeline,
  Statistic,
  Badge,
  Divider,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Table,
  Empty,
  Spin,
  Alert,
  Dropdown,
  message,
  Tooltip,
  Avatar
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  BankOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import PageContainer from '@/components/common/PageContainer'
import { usePreparationStore } from '@/stores/preparationStore'
import {
  PREPARATION_STATUS_COLORS,
  PRIORITY_COLORS,
  PreparationStatus
} from '@/constants/colors'
import type {
  PreparationProject,
  PreparationStatusType,
  Priority,
  ProgressUpdateRequest
} from '@/constants/colors'

// 导入即将创建的子组件
import EngineeringManagement from '@/components/preparation/EngineeringManagement'
import EquipmentManagement from '@/components/preparation/EquipmentManagement'
import LicenseManagement from '@/components/preparation/LicenseManagement'
import StaffManagement from '@/components/preparation/StaffManagement'
import MilestoneTracking from '@/components/preparation/MilestoneTracking'

dayjs.extend(relativeTime)

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { TextArea } = Input

// 状态选项配置
const STATUS_OPTIONS = [
  { value: 'PLANNING', label: '规划中', color: PREPARATION_STATUS_COLORS.PLANNING },
  { value: 'APPROVED', label: '已批准', color: PREPARATION_STATUS_COLORS.APPROVED },
  { value: 'IN_PROGRESS', label: '进行中', color: PREPARATION_STATUS_COLORS.IN_PROGRESS },
  { value: 'SUSPENDED', label: '已暂停', color: PREPARATION_STATUS_COLORS.SUSPENDED },
  { value: 'COMPLETED', label: '已完成', color: PREPARATION_STATUS_COLORS.COMPLETED },
  { value: 'CANCELLED', label: '已取消', color: PREPARATION_STATUS_COLORS.CANCELLED },
  { value: 'OVERDUE', label: '已逾期', color: PREPARATION_STATUS_COLORS.OVERDUE },
]

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: '紧急', color: PRIORITY_COLORS.URGENT },
  { value: 'HIGH', label: '高', color: PRIORITY_COLORS.HIGH },
  { value: 'MEDIUM', label: '中', color: PRIORITY_COLORS.MEDIUM },
  { value: 'LOW', label: '低', color: PRIORITY_COLORS.LOW },
]

// 项目基本信息组件
const ProjectOverview: React.FC<{ project: PreparationProject }> = ({ project }) => {
  const statusOption = STATUS_OPTIONS.find(opt => opt.value === project.status)
  const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === project.priority)

  return (
    <div>
      <Row gutter={24}>
        {/* 基本信息 */}
        <Col span={16}>
          <Card title="项目基本信息" style={{ marginBottom: 24 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="项目编号">
                <Text copyable>{project.projectCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="项目名称">
                <Text strong>{project.projectName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="门店编码">
                <Text copyable>{project.storeCode || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="门店名称">
                {project.storeName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Badge color={statusOption?.color} text={statusOption?.label} />
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityOption?.color}>{priorityOption?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目经理">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {/* 这里应该根据managerId获取用户信息 */}
                  {project.managerId || '未分配'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(project.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {project.description && (
              <>
                <Divider />
                <div>
                  <Text strong>项目描述：</Text>
                  <Paragraph style={{ marginTop: 8 }}>
                    {project.description}
                  </Paragraph>
                </div>
              </>
            )}

            {project.notes && (
              <div style={{ marginTop: 16 }}>
                <Text strong>备注：</Text>
                <Paragraph style={{ marginTop: 8 }}>
                  {project.notes}
                </Paragraph>
              </div>
            )}
          </Card>

          {/* 时间进度 */}
          <Card title="时间进度" style={{ marginBottom: 24 }}>
            <Timeline>
              <Timeline.Item
                color="blue"
                dot={<CalendarOutlined />}
              >
                <div>
                  <Text strong>计划开始时间</Text>
                  <br />
                  <Text>{dayjs(project.plannedStartDate).format('YYYY年MM月DD日')}</Text>
                </div>
              </Timeline.Item>

              {project.actualStartDate && (
                <Timeline.Item
                  color="green"
                  dot={<PlayCircleOutlined />}
                >
                  <div>
                    <Text strong>实际开始时间</Text>
                    <br />
                    <Text>{dayjs(project.actualStartDate).format('YYYY年MM月DD日')}</Text>
                  </div>
                </Timeline.Item>
              )}

              <Timeline.Item
                color={dayjs().isAfter(project.plannedEndDate) ? 'red' : 'blue'}
                dot={<ClockCircleOutlined />}
              >
                <div>
                  <Text strong>计划结束时间</Text>
                  <br />
                  <Text>{dayjs(project.plannedEndDate).format('YYYY年MM月DD日')}</Text>
                  {dayjs().isAfter(project.plannedEndDate) && (
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      已逾期 {dayjs().diff(project.plannedEndDate, 'day')} 天
                    </Tag>
                  )}
                </div>
              </Timeline.Item>

              {project.actualEndDate && (
                <Timeline.Item
                  color="green"
                  dot={<CheckCircleOutlined />}
                >
                  <div>
                    <Text strong>实际结束时间</Text>
                    <br />
                    <Text>{dayjs(project.actualEndDate).format('YYYY年MM月DD日')}</Text>
                  </div>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>

        {/* 关键指标 */}
        <Col span={8}>
          <Card title="关键指标" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="项目进度"
                  value={project.progressPercentage}
                  suffix="%"
                  valueStyle={{ color: project.progressPercentage >= 70 ? '#3f8600' : '#cf1322' }}
                />
                <Progress
                  percent={project.progressPercentage}
                  size="small"
                  strokeColor={project.progressPercentage >= 70 ? '#52c41a' : '#faad14'}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="预算执行"
                  value={project.actualBudget ? (project.actualBudget / project.budget * 100).toFixed(1) : 0}
                  suffix="%"
                  prefix={<DollarOutlined />}
                  valueStyle={{ 
                    color: project.actualBudget && project.actualBudget > project.budget ? '#cf1322' : '#3f8600' 
                  }}
                />
              </Col>
            </Row>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="预算金额">
                <Text strong style={{ color: '#1890ff' }}>
                  {(project.budget / 10000).toFixed(2)} 万元
                </Text>
              </Descriptions.Item>
              {project.actualBudget && (
                <Descriptions.Item label="实际支出">
                  <Text strong style={{ color: project.actualBudget > project.budget ? '#cf1322' : '#3f8600' }}>
                    {(project.actualBudget / 10000).toFixed(2)} 万元
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="剩余天数">
                <Text style={{ color: dayjs().isAfter(project.plannedEndDate) ? '#cf1322' : '#3f8600' }}>
                  {dayjs().isAfter(project.plannedEndDate) 
                    ? `已逾期 ${dayjs().diff(project.plannedEndDate, 'day')} 天`
                    : `剩余 ${dayjs(project.plannedEndDate).diff(dayjs(), 'day')} 天`
                  }
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 快速操作 */}
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                block
                onClick={() => {/* 编辑项目逻辑 */}}
              >
                编辑项目
              </Button>
              <Button
                icon={<BarChartOutlined />}
                block
                onClick={() => {/* 更新进度逻辑 */}}
              >
                更新进度
              </Button>
              <Button
                icon={<FileTextOutlined />}
                block
                onClick={() => {/* 生成报告逻辑 */}}
              >
                生成报告
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                block
                onClick={() => {/* 删除项目逻辑 */}}
              >
                删除项目
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

// 项目统计概览组件
const ProjectStats: React.FC<{ project: PreparationProject }> = ({ project }) => {
  return (
    <div>
      <Row gutter={24}>
        <Col span={6}>
          <Card>
            <Statistic
              title="工程任务"
              value={0} // 这里应该从store获取实际数据
              prefix={<ToolOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="设备采购"
              value={0}
              prefix={<BankOutlined />}
              suffix="项"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="证照办理"
              value={0}
              prefix={<SafetyCertificateOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="人员招聘"
              value={0}
              prefix={<TeamOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Alert
          message="统计数据"
          description="此页面显示项目各子模块的统计信息，包括任务完成情况、预算执行情况、时间进度等关键指标。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="统计图表开发中..." />
      </div>
    </div>
  )
}

// 进度更新模态框组件
const ProgressUpdateModal: React.FC<{
  visible: boolean
  project: PreparationProject | null
  onCancel: () => void
  onOk: (data: ProgressUpdateRequest) => Promise<void>
}> = ({ visible, project, onCancel, onOk }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && project) {
      form.setFieldsValue({
        progressPercentage: project.progressPercentage,
        actualStartDate: project.actualStartDate ? dayjs(project.actualStartDate) : undefined,
        actualEndDate: project.actualEndDate ? dayjs(project.actualEndDate) : undefined,
        actualBudget: project.actualBudget,
        notes: ''
      })
    }
  }, [visible, project, form])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      const data: ProgressUpdateRequest = {
        progressPercentage: values.progressPercentage,
        actualStartDate: values.actualStartDate?.format('YYYY-MM-DD'),
        actualEndDate: values.actualEndDate?.format('YYYY-MM-DD'),
        actualBudget: values.actualBudget,
        notes: values.notes
      }
      await onOk(data)
      form.resetFields()
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="更新项目进度"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="progressPercentage"
          label="项目进度"
          rules={[
            { required: true, message: '请输入项目进度' },
            { type: 'number', min: 0, max: 100, message: '进度必须在0-100之间' }
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            formatter={(value) => `${value}%`}
            parser={(value) => value!.replace('%', '') as any}
            style={{ width: '100%' }}
          />
        </Form.Item>

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

        <Form.Item
          name="actualBudget"
          label="实际预算（元）"
        >
          <InputNumber
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="notes" label="更新说明">
          <TextArea rows={3} placeholder="请输入本次更新的说明..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const PreparationProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Store状态
  const {
    currentProject,
    isLoading,
    activeProjectTab,
    setActiveProjectTab,
    fetchProject,
    updateProject,
    updateProjectProgress,
    deleteProject
  } = usePreparationStore()

  // 本地状态
  const [progressUpdateVisible, setProgressUpdateVisible] = useState(false)

  // 初始化数据
  useEffect(() => {
    if (id) {
      fetchProject(id)
    }
  }, [id, fetchProject])

  // 进度更新处理
  const handleProgressUpdate = useCallback(async (data: ProgressUpdateRequest) => {
    if (!id) return
    
    const success = await updateProjectProgress(id, data)
    if (success) {
      setProgressUpdateVisible(false)
      message.success('进度更新成功')
    }
  }, [id, updateProjectProgress])

  // 删除项目处理
  const handleDelete = useCallback(async () => {
    if (!id || !currentProject) return

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目"${currentProject.projectName}"吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        const success = await deleteProject(id)
        if (success) {
          navigate('/preparation/projects')
        }
      }
    })
  }, [id, currentProject, deleteProject, navigate])

  if (isLoading || !currentProject) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/preparation/projects')}
          >
            返回列表
          </Button>
          <Divider type="vertical" />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {currentProject.projectName}
            </Title>
            <Text type="secondary">{currentProject.projectCode}</Text>
          </div>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setProgressUpdateVisible(true)}
          >
            更新进度
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/preparation/projects/${id}/edit`)}
          >
            编辑项目
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchProject(id!)}
            loading={isLoading}
          >
            刷新
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'export',
                  label: '导出报告',
                  icon: <DownloadOutlined />
                },
                {
                  key: 'settings',
                  label: '项目设置',
                  icon: <SettingOutlined />
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  label: <Text type="danger">删除项目</Text>,
                  icon: <DeleteOutlined />,
                  onClick: handleDelete
                }
              ]
            }}
            trigger={['click']}
          >
            <Button icon={<SettingOutlined />} />
          </Dropdown>
        </Space>
      }
      breadcrumb={{
        routes: [
          { path: '/', breadcrumbName: '首页' },
          { path: '/preparation', breadcrumbName: '开店筹备' },
          { path: '/preparation/projects', breadcrumbName: '筹备项目' },
          { path: `/preparation/projects/${id}`, breadcrumbName: '项目详情' },
        ]
      }}
    >
      <Tabs
        activeKey={activeProjectTab}
        onChange={(key) => setActiveProjectTab(key as any)}
        size="large"
        tabBarExtraContent={
          <Space>
            <Badge
              count={currentProject.status === 'OVERDUE' ? '逾期' : 0}
              style={{ backgroundColor: '#f50' }}
            >
              <Tag color={PREPARATION_STATUS_COLORS[currentProject.status]}>
                {STATUS_OPTIONS.find(opt => opt.value === currentProject.status)?.label}
              </Tag>
            </Badge>
          </Space>
        }
      >
        <TabPane
          tab={
            <span>
              <EyeOutlined />
              项目概览
            </span>
          }
          key="overview"
        >
          <ProjectOverview project={currentProject} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ToolOutlined />
              工程管理
            </span>
          }
          key="engineering"
        >
          <EngineeringManagement projectId={id!} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <BankOutlined />
              设备采购
            </span>
          }
          key="equipment"
        >
          <EquipmentManagement projectId={id!} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <SafetyCertificateOutlined />
              证照办理
            </span>
          }
          key="license"
        >
          <LicenseManagement projectId={id!} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              人员招聘
            </span>
          }
          key="staff"
        >
          <StaffManagement projectId={id!} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              里程碑
            </span>
          }
          key="milestone"
        >
          <MilestoneTracking projectId={id!} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              统计分析
            </span>
          }
          key="stats"
        >
          <ProjectStats project={currentProject} />
        </TabPane>
      </Tabs>

      {/* 进度更新模态框 */}
      <ProgressUpdateModal
        visible={progressUpdateVisible}
        project={currentProject}
        onCancel={() => setProgressUpdateVisible(false)}
        onOk={handleProgressUpdate}
      />
    </PageContainer>
  )
}

export default PreparationProjectDetail