import React, { useState } from 'react'
import {
  Button,
  Table,
  Tag,
  Space,
  Card,
  Form,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Progress,
  Timeline,
  Avatar,
  Image,
  Badge,
  Tooltip,
  Upload,
  Drawer
} from 'antd'
import {
  BuildOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  CameraOutlined,
  FileImageOutlined,
  UploadOutlined,
  ToolOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input
const { TextArea } = Input

interface ConstructionListProps {
  embedded?: boolean
}

const ConstructionList: React.FC<ConstructionListProps> = ({ embedded = false }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [showFilters, setShowFilters] = useState(false)
  const [showProgressDrawer, setShowProgressDrawer] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<any>(null)

  // Mock数据
  const mockData = {
    data: [
      {
        id: '1',
        projectId: '1',
        projectName: '万达广场A区门店筹备项目',
        constructionType: 'renovation',
        status: 'in_progress',
        phase: 'decoration',
        progress: 75,
        startDate: '2024-02-01T00:00:00Z',
        expectedEndDate: '2024-03-10T00:00:00Z',
        actualEndDate: null,
        contractor: '北京建工集团',
        contractorContact: '王工',
        contractorPhone: '13800138010',
        supervisor: '张主管',
        supervisorPhone: '13800138011',
        budget: 500000,
        actualCost: 375000,
        qualityScore: 88,
        safetyScore: 92,
        risks: ['材料供应延迟', '天气影响'],
        milestones: [
          { name: '主体改造', status: 'completed', progress: 100, date: '2024-02-15', description: '墙体改造完成' },
          { name: '水电安装', status: 'completed', progress: 100, date: '2024-02-20', description: '水电线路铺设完成' },
          { name: '装修施工', status: 'in_progress', progress: 80, date: '2024-03-01', description: '地面、墙面装修进行中' },
          { name: '设备安装', status: 'pending', progress: 0, date: '2024-03-05', description: '待装修完成后进行' },
          { name: '最终验收', status: 'pending', progress: 0, date: '2024-03-10', description: '整体验收' }
        ],
        images: [
          'https://via.placeholder.com/200x150?text=Construction+1',
          'https://via.placeholder.com/200x150?text=Construction+2'
        ],
        lastUpdate: '2024-02-25T16:30:00Z'
      },
      {
        id: '2',
        projectId: '2',
        projectName: '银泰城B座门店筹备项目',
        constructionType: 'new_build',
        status: 'planning',
        phase: 'preparation',
        progress: 15,
        startDate: '2024-03-01T00:00:00Z',
        expectedEndDate: '2024-04-20T00:00:00Z',
        actualEndDate: null,
        contractor: '上海装饰公司',
        contractorContact: '李经理',
        contractorPhone: '13800138020',
        supervisor: '陈主管',
        supervisorPhone: '13800138021',
        budget: 380000,
        actualCost: 57000,
        qualityScore: null,
        safetyScore: null,
        risks: ['设计方案待确认'],
        milestones: [
          { name: '施工准备', status: 'in_progress', progress: 60, date: '2024-03-05', description: '材料采购、人员配置' },
          { name: '主体施工', status: 'pending', progress: 0, date: '2024-03-10', description: '主体结构施工' },
          { name: '装修施工', status: 'pending', progress: 0, date: '2024-03-25', description: '内部装修' },
          { name: '设备安装', status: 'pending', progress: 0, date: '2024-04-10', description: '设备安装调试' },
          { name: '最终验收', status: 'pending', progress: 0, date: '2024-04-18', description: '竣工验收' }
        ],
        images: [],
        lastUpdate: '2024-02-28T10:15:00Z'
      }
    ],
    meta: { total: 2, page: 1, pageSize: 10 }
  }

  // 状态映射
  const statusMap = {
    planning: { color: 'default', text: '筹备中', icon: <ClockCircleOutlined /> },
    in_progress: { color: 'processing', text: '施工中', icon: <BuildOutlined /> },
    suspended: { color: 'warning', text: '暂停', icon: <ExclamationCircleOutlined /> },
    completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', text: '施工异常', icon: <ExclamationCircleOutlined /> }
  }

  const constructionTypeMap = {
    new_build: { color: 'blue', text: '新建' },
    renovation: { color: 'green', text: '装修改造' },
    expansion: { color: 'orange', text: '扩建' }
  }

  const phaseMap = {
    preparation: { color: 'default', text: '准备阶段' },
    foundation: { color: 'blue', text: '基础阶段' },
    structure: { color: 'processing', text: '结构阶段' },
    decoration: { color: 'warning', text: '装修阶段' },
    installation: { color: 'purple', text: '安装阶段' },
    acceptance: { color: 'success', text: '验收阶段' }
  }

  // 表格列定义
  const columns = [
    {
      title: '施工项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 220,
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => navigate(`/preparation/projects/${record.projectId}`)}>
            {text}
          </a>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            <ToolOutlined /> {record.contractor}
          </div>
        </div>
      )
    },
    {
      title: '施工类型',
      dataIndex: 'constructionType',
      key: 'constructionType',
      width: 100,
      render: (type: string) => {
        const config = constructionTypeMap[type as keyof typeof constructionTypeMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status as keyof typeof statusMap]
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '当前阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 100,
      render: (phase: string) => {
        const config = phaseMap[phase as keyof typeof phaseMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '施工进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (progress: number, record: any) => (
        <div>
          <Progress 
            percent={progress} 
            size="small"
            status={record.status === 'failed' ? 'exception' : progress === 100 ? 'success' : 'active'}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            预算: ¥{(record.budget / 10000).toFixed(1)}万
          </div>
        </div>
      )
    },
    {
      title: '承包商信息',
      key: 'contractor',
      width: 150,
      render: (_: any, record: any) => (
        <div>
          <div>
            <Avatar size="small" icon={<UserOutlined />} />
            <span style={{ marginLeft: 8 }}>{record.contractorContact}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            <PhoneOutlined /> {record.contractorPhone}
          </div>
        </div>
      )
    },
    {
      title: '质量评分',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      width: 100,
      render: (score: number) => {
        if (!score) return '-'
        const color = score >= 90 ? '#52c41a' : score >= 80 ? '#faad14' : '#ff4d4f'
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color, fontWeight: 'bold' }}>{score}</div>
            <Progress percent={score} size="small" showInfo={false} strokeColor={color} />
          </div>
        )
      }
    },
    {
      title: '安全评分',
      dataIndex: 'safetyScore',
      key: 'safetyScore',
      width: 100,
      render: (score: number) => {
        if (!score) return '-'
        const color = score >= 95 ? '#52c41a' : score >= 85 ? '#faad14' : '#ff4d4f'
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color, fontWeight: 'bold' }}>{score}</div>
            <Progress percent={score} size="small" showInfo={false} strokeColor={color} />
          </div>
        )
      }
    },
    {
      title: '工期',
      key: 'duration',
      width: 140,
      render: (_: any, record: any) => {
        const startDate = dayjs(record.startDate)
        const endDate = dayjs(record.expectedEndDate)
        const isOverdue = endDate.isBefore(dayjs()) && record.status !== 'completed'
        
        return (
          <div>
            <div style={{ fontSize: '12px' }}>
              {startDate.format('MM-DD')} ~ {endDate.format('MM-DD')}
            </div>
            <div style={{ fontSize: '12px', marginTop: 2 }}>
              <span style={{ color: isOverdue ? '#ff4d4f' : '#666' }}>
                剩余: {endDate.diff(dayjs(), 'day')}天
              </span>
              {isOverdue && <Tag color="error" size="small">逾期</Tag>}
            </div>
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewProgress(record)}
          >
            进度详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleUpdateProgress(record)}
          >
            更新进度
          </Button>
        </Space>
      )
    }
  ]

  // 事件处理
  const handleViewProgress = (record: any) => {
    setCurrentRecord(record)
    setShowProgressDrawer(true)
  }

  const handleUpdateProgress = (record: any) => {
    navigate(`/preparation/construction/${record.id}/progress`)
  }

  const handleSearch = (values: any) => {
    console.log('Search values:', values)
  }

  const handleReset = () => {
    form.resetFields()
  }

  // 渲染进度时间线
  const renderProgressTimeline = (milestones: any[]) => {
    const timelineItems = milestones.map(milestone => {
      let color = 'blue'
      if (milestone.status === 'completed') color = 'green'
      else if (milestone.status === 'in_progress') color = 'blue'
      else color = 'gray'

      return {
        color,
        children: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {milestone.name}
              <Tag size="small" color={color} style={{ marginLeft: 8 }}>
                {milestone.status === 'completed' ? '已完成' : 
                 milestone.status === 'in_progress' ? '进行中' : '待开始'}
              </Tag>
            </div>
            <div style={{ color: '#666', marginBottom: 4 }}>
              {milestone.description}
            </div>
            <div style={{ marginBottom: 4 }}>
              <Progress percent={milestone.progress} size="small" />
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              计划完成: {milestone.date}
            </div>
          </div>
        )
      }
    })

    return <Timeline items={timelineItems} />
  }

  const pageHeaderContent = !embedded && (
    <PageHeader
      title="施工管理"
      description="监控和管理施工进度、质量、安全等施工相关事务"
      breadcrumbs={[
        { title: '开店筹备', path: '/preparation' },
        { title: '施工管理' }
      ]}
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />}>
          刷新
        </Button>
      ]}
    />
  )

  return (
    <div>
      {pageHeaderContent}

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col flex="auto">
              <Form.Item name="keyword">
                <Search
                  placeholder="搜索项目名称、承包商"
                  allowClear
                  style={{ width: 300 }}
                  onSearch={() => form.submit()}
                />
              </Form.Item>
            </Col>
            <Col>
              <Space>
                <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? '收起筛选' : '展开筛选'}
                </Button>
                <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>

          {showFilters && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Form.Item name="status" label="施工状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value="planning">筹备中</Option>
                    <Option value="in_progress">施工中</Option>
                    <Option value="suspended">暂停</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="failed">施工异常</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="constructionType" label="施工类型">
                  <Select placeholder="请选择" allowClear>
                    <Option value="new_build">新建</Option>
                    <Option value="renovation">装修改造</Option>
                    <Option value="expansion">扩建</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="phase" label="当前阶段">
                  <Select placeholder="请选择" allowClear>
                    <Option value="preparation">准备阶段</Option>
                    <Option value="foundation">基础阶段</Option>
                    <Option value="structure">结构阶段</Option>
                    <Option value="decoration">装修阶段</Option>
                    <Option value="installation">安装阶段</Option>
                    <Option value="acceptance">验收阶段</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="contractor" label="承包商">
                  <Select placeholder="请选择" allowClear>
                    <Option value="北京建工集团">北京建工集团</Option>
                    <Option value="上海装饰公司">上海装饰公司</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Card>

      {/* 主表格 */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={mockData.data}
          loading={false}
          scroll={{ x: 1300 }}
          pagination={{
            current: 1,
            pageSize: 10,
            total: mockData.meta.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
          }}
        />
      </Card>

      {/* 进度详情抽屉 */}
      <Drawer
        title="施工进度详情"
        open={showProgressDrawer}
        onClose={() => setShowProgressDrawer(false)}
        width={600}
      >
        {currentRecord && (
          <div>
            <Card title="项目基本信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>项目名称：</strong>{currentRecord.projectName}</p>
                  <p><strong>施工类型：</strong>{constructionTypeMap[currentRecord.constructionType]?.text}</p>
                  <p><strong>当前阶段：</strong>{phaseMap[currentRecord.phase]?.text}</p>
                </Col>
                <Col span={12}>
                  <p><strong>承包商：</strong>{currentRecord.contractor}</p>
                  <p><strong>联系人：</strong>{currentRecord.contractorContact}</p>
                  <p><strong>联系电话：</strong>{currentRecord.contractorPhone}</p>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <p><strong>整体进度：</strong></p>
                  <Progress percent={currentRecord.progress} />
                </Col>
                <Col span={8}>
                  <p><strong>质量评分：</strong></p>
                  <div style={{ color: currentRecord.qualityScore >= 90 ? '#52c41a' : '#faad14', fontSize: '18px', fontWeight: 'bold' }}>
                    {currentRecord.qualityScore || 'N/A'}
                  </div>
                </Col>
                <Col span={8}>
                  <p><strong>安全评分：</strong></p>
                  <div style={{ color: currentRecord.safetyScore >= 95 ? '#52c41a' : '#faad14', fontSize: '18px', fontWeight: 'bold' }}>
                    {currentRecord.safetyScore || 'N/A'}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="施工进度" size="small" style={{ marginBottom: 16 }}>
              {renderProgressTimeline(currentRecord.milestones)}
            </Card>

            {currentRecord.images.length > 0 && (
              <Card title="现场照片" size="small">
                <Image.PreviewGroup>
                  <Row gutter={8}>
                    {currentRecord.images.map((image: string, index: number) => (
                      <Col span={8} key={index}>
                        <Image
                          width={150}
                          height={100}
                          src={image}
                          style={{ objectFit: 'cover' }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ConstructionList