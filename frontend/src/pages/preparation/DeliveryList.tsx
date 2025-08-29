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
  Steps,
  Descriptions,
  Badge,
  Avatar,
  Rate,
  Upload,
  Image,
  Drawer,
  Checkbox
} from 'antd'
import {
  DeliveredProcedureOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  FileTextOutlined,
  StarOutlined,
  CameraOutlined,
  CheckSquareOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input
const { Step } = Steps
const { TextArea } = Input

interface DeliveryListProps {
  embedded?: boolean
}

const DeliveryList: React.FC<DeliveryListProps> = ({ embedded = false }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [showFilters, setShowFilters] = useState(false)
  const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<any>(null)

  // Mock数据
  const mockData = {
    data: [
      {
        id: '1',
        projectId: '1',
        projectName: '万达广场A区门店筹备项目',
        storeLocation: '北京市朝阳区建国路万达广场A区1F-08',
        deliveryStatus: 'in_delivery',
        deliveryPhase: 'inspection',
        overallProgress: 85,
        deliveryDate: '2024-03-10T00:00:00Z',
        actualDeliveryDate: null,
        recipient: '门店经理-张三',
        recipientPhone: '13800138001',
        deliverer: '项目经理-李四',
        delivererPhone: '13800138002',
        qualityRating: 4.5,
        completionItems: [
          { name: '装修工程', status: 'completed', progress: 100, checkDate: '2024-03-08', checker: '质检员A' },
          { name: '设备安装', status: 'completed', progress: 100, checkDate: '2024-03-09', checker: '设备工程师B' },
          { name: '消防验收', status: 'in_progress', progress: 80, checkDate: null, checker: null },
          { name: '环保验收', status: 'pending', progress: 0, checkDate: null, checker: null },
          { name: '营业许可', status: 'pending', progress: 0, checkDate: null, checker: null }
        ],
        issues: [
          { 
            id: '1', 
            type: 'quality', 
            description: '洗手间地砖有轻微色差', 
            severity: 'minor', 
            status: 'resolved',
            resolvedDate: '2024-03-09',
            resolver: '施工队长'
          }
        ],
        documents: [
          { name: '竣工验收报告', status: 'completed', url: '#' },
          { name: '设备清单', status: 'completed', url: '#' },
          { name: '保修单据', status: 'pending', url: null }
        ],
        images: [
          'https://via.placeholder.com/200x150?text=Delivery+1',
          'https://via.placeholder.com/200x150?text=Delivery+2'
        ],
        createdAt: '2024-03-08T10:00:00Z'
      },
      {
        id: '2',
        projectId: '2',
        projectName: '银泰城B座门店筹备项目',
        storeLocation: '上海市浦东新区张杨路银泰城B座2F-15',
        deliveryStatus: 'pending',
        deliveryPhase: 'preparation',
        overallProgress: 30,
        deliveryDate: '2024-04-20T00:00:00Z',
        actualDeliveryDate: null,
        recipient: '门店经理-王五',
        recipientPhone: '13800138003',
        deliverer: '项目经理-赵六',
        delivererPhone: '13800138004',
        qualityRating: null,
        completionItems: [
          { name: '装修工程', status: 'in_progress', progress: 60, checkDate: null, checker: null },
          { name: '设备安装', status: 'pending', progress: 0, checkDate: null, checker: null },
          { name: '消防验收', status: 'pending', progress: 0, checkDate: null, checker: null },
          { name: '环保验收', status: 'pending', progress: 0, checkDate: null, checker: null },
          { name: '营业许可', status: 'pending', progress: 0, checkDate: null, checker: null }
        ],
        issues: [],
        documents: [
          { name: '施工进度报告', status: 'completed', url: '#' },
          { name: '材料清单', status: 'in_progress', url: null }
        ],
        images: [],
        createdAt: '2024-02-28T14:30:00Z'
      }
    ],
    meta: { total: 2, page: 1, pageSize: 10 }
  }

  // 状态映射
  const deliveryStatusMap = {
    pending: { color: 'default', text: '准备中', icon: <ClockCircleOutlined /> },
    in_delivery: { color: 'processing', text: '交付中', icon: <DeliveredProcedureOutlined /> },
    completed: { color: 'success', text: '已交付', icon: <CheckCircleOutlined /> },
    rejected: { color: 'error', text: '交付失败', icon: <CloseCircleOutlined /> }
  }

  const deliveryPhaseMap = {
    preparation: { color: 'default', text: '准备阶段' },
    inspection: { color: 'processing', text: '验收阶段' },
    documentation: { color: 'warning', text: '文档整理' },
    handover: { color: 'purple', text: '正式交付' },
    follow_up: { color: 'success', text: '后续跟进' }
  }

  const itemStatusMap = {
    pending: { color: 'default', text: '待开始' },
    in_progress: { color: 'processing', text: '进行中' },
    completed: { color: 'success', text: '已完成' },
    failed: { color: 'error', text: '未通过' }
  }

  const issueStatusMap = {
    open: { color: 'error', text: '待解决' },
    in_progress: { color: 'warning', text: '处理中' },
    resolved: { color: 'success', text: '已解决' }
  }

  const severityMap = {
    critical: { color: 'error', text: '严重' },
    major: { color: 'warning', text: '重要' },
    minor: { color: 'default', text: '轻微' }
  }

  // 表格列定义
  const columns = [
    {
      title: '交付项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 220,
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => navigate(`/preparation/projects/${record.projectId}`)}>
            {text}
          </a>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            <DeliveredProcedureOutlined /> {record.storeLocation}
          </div>
        </div>
      )
    },
    {
      title: '交付状态',
      dataIndex: 'deliveryStatus',
      key: 'deliveryStatus',
      width: 100,
      render: (status: string) => {
        const config = deliveryStatusMap[status as keyof typeof deliveryStatusMap]
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '当前阶段',
      dataIndex: 'deliveryPhase',
      key: 'deliveryPhase',
      width: 100,
      render: (phase: string) => {
        const config = deliveryPhaseMap[phase as keyof typeof deliveryPhaseMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '交付进度',
      dataIndex: 'overallProgress',
      key: 'overallProgress',
      width: 120,
      render: (progress: number, record: any) => (
        <div>
          <Progress 
            percent={progress} 
            size="small"
            status={record.deliveryStatus === 'rejected' ? 'exception' : 
                   progress === 100 ? 'success' : 'active'}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            完成项: {record.completionItems.filter((item: any) => item.status === 'completed').length}/{record.completionItems.length}
          </div>
        </div>
      )
    },
    {
      title: '交付人员',
      key: 'personnel',
      width: 160,
      render: (_: any, record: any) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <span style={{ marginLeft: 8 }}>交付方: {record.deliverer}</span>
          </div>
          <div>
            <Avatar size="small" icon={<UserOutlined />} />
            <span style={{ marginLeft: 8 }}>接收方: {record.recipient}</span>
          </div>
        </div>
      )
    },
    {
      title: '质量评分',
      dataIndex: 'qualityRating',
      key: 'qualityRating',
      width: 120,
      render: (rating: number) => {
        if (!rating) return '-'
        return (
          <div style={{ textAlign: 'center' }}>
            <Rate disabled value={rating} allowHalf />
            <div style={{ fontSize: '12px', color: '#666' }}>{rating.toFixed(1)}</div>
          </div>
        )
      }
    },
    {
      title: '问题数量',
      key: 'issues',
      width: 100,
      render: (_: any, record: any) => {
        const openIssues = record.issues.filter((issue: any) => issue.status === 'open').length
        const totalIssues = record.issues.length
        
        return (
          <div style={{ textAlign: 'center' }}>
            <Badge count={openIssues} showZero>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {totalIssues}
              </span>
            </Badge>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {openIssues > 0 ? `${openIssues}个待解决` : '无问题'}
            </div>
          </div>
        )
      }
    },
    {
      title: '计划交付时间',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 120,
      render: (date: string, record: any) => {
        const deliveryDate = dayjs(date)
        const isOverdue = deliveryDate.isBefore(dayjs()) && record.deliveryStatus !== 'completed'
        
        return (
          <div>
            <div style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
              {deliveryDate.format('MM-DD')}
            </div>
            {record.actualDeliveryDate ? (
              <div style={{ fontSize: '12px', color: '#52c41a' }}>
                实际: {dayjs(record.actualDeliveryDate).format('MM-DD')}
              </div>
            ) : isOverdue && (
              <Tag color="error" size="small">逾期</Tag>
            )}
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
            onClick={() => handleViewDelivery(record)}
          >
            交付详情
          </Button>
          {record.deliveryStatus === 'in_delivery' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleConfirmDelivery(record)}
            >
              确认交付
            </Button>
          )}
        </Space>
      )
    }
  ]

  // 事件处理
  const handleViewDelivery = (record: any) => {
    setCurrentRecord(record)
    setShowDeliveryDrawer(true)
  }

  const handleConfirmDelivery = (record: any) => {
    navigate(`/preparation/delivery/${record.id}/confirm`)
  }

  const handleSearch = (values: any) => {
    console.log('Search values:', values)
  }

  const handleReset = () => {
    form.resetFields()
  }

  // 渲染交付清单
  const renderDeliveryChecklist = (items: any[]) => {
    return (
      <div>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: 16, padding: 12, border: '1px solid #f0f0f0', borderRadius: 6 }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <div style={{ fontWeight: 'bold' }}>
                  {item.name}
                  <Tag size="small" color={itemStatusMap[item.status]?.color} style={{ marginLeft: 8 }}>
                    {itemStatusMap[item.status]?.text}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <Progress percent={item.progress} size="small" />
              </Col>
              <Col span={8}>
                {item.checkDate ? (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    验收: {item.checkDate} by {item.checker}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    待验收
                  </div>
                )}
              </Col>
            </Row>
          </div>
        ))}
      </div>
    )
  }

  // 渲染问题列表
  const renderIssuesList = (issues: any[]) => {
    if (issues.length === 0) {
      return <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>暂无问题</div>
    }

    return (
      <div>
        {issues.map((issue, index) => (
          <div key={index} style={{ marginBottom: 12, padding: 12, border: '1px solid #f0f0f0', borderRadius: 6 }}>
            <div style={{ marginBottom: 8 }}>
              <Tag color={severityMap[issue.severity]?.color}>{severityMap[issue.severity]?.text}</Tag>
              <Tag color={issueStatusMap[issue.status]?.color}>{issueStatusMap[issue.status]?.text}</Tag>
            </div>
            <div style={{ marginBottom: 8 }}>{issue.description}</div>
            {issue.status === 'resolved' && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                解决时间: {issue.resolvedDate} | 解决人: {issue.resolver}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const pageHeaderContent = !embedded && (
    <PageHeader
      title="交付管理"
      description="管理门店交付流程，包括验收确认、文档交接等"
      breadcrumbs={[
        { title: '开店筹备', path: '/preparation' },
        { title: '交付管理' }
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
                  placeholder="搜索项目名称、交付人员"
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
                <Form.Item name="deliveryStatus" label="交付状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value="pending">准备中</Option>
                    <Option value="in_delivery">交付中</Option>
                    <Option value="completed">已交付</Option>
                    <Option value="rejected">交付失败</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="deliveryPhase" label="交付阶段">
                  <Select placeholder="请选择" allowClear>
                    <Option value="preparation">准备阶段</Option>
                    <Option value="inspection">验收阶段</Option>
                    <Option value="documentation">文档整理</Option>
                    <Option value="handover">正式交付</Option>
                    <Option value="follow_up">后续跟进</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="hasIssues" label="问题状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value="no_issues">无问题</Option>
                    <Option value="has_open_issues">有待解决问题</Option>
                    <Option value="has_resolved_issues">有已解决问题</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="recipient" label="接收人">
                  <Select placeholder="请选择" allowClear>
                    <Option value="张三">张三</Option>
                    <Option value="王五">王五</Option>
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
          scroll={{ x: 1200 }}
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

      {/* 交付详情抽屉 */}
      <Drawer
        title="交付详情"
        open={showDeliveryDrawer}
        onClose={() => setShowDeliveryDrawer(false)}
        width={800}
      >
        {currentRecord && (
          <div>
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="项目名称">{currentRecord.projectName}</Descriptions.Item>
                <Descriptions.Item label="门店位置">{currentRecord.storeLocation}</Descriptions.Item>
                <Descriptions.Item label="交付状态">
                  <Tag color={deliveryStatusMap[currentRecord.deliveryStatus]?.color}>
                    {deliveryStatusMap[currentRecord.deliveryStatus]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="当前阶段">
                  <Tag color={deliveryPhaseMap[currentRecord.deliveryPhase]?.color}>
                    {deliveryPhaseMap[currentRecord.deliveryPhase]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="交付方">{currentRecord.deliverer}</Descriptions.Item>
                <Descriptions.Item label="接收方">{currentRecord.recipient}</Descriptions.Item>
                <Descriptions.Item label="计划交付时间">
                  {dayjs(currentRecord.deliveryDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="整体进度">
                  <Progress percent={currentRecord.overallProgress} size="small" style={{ width: 120 }} />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="交付清单" size="small" style={{ marginBottom: 16 }}>
              {renderDeliveryChecklist(currentRecord.completionItems)}
            </Card>

            <Card title="问题记录" size="small" style={{ marginBottom: 16 }}>
              {renderIssuesList(currentRecord.issues)}
            </Card>

            {currentRecord.images.length > 0 && (
              <Card title="交付照片" size="small">
                <Image.PreviewGroup>
                  <Row gutter={8}>
                    {currentRecord.images.map((image: string, index: number) => (
                      <Col span={8} key={index}>
                        <Image
                          width={200}
                          height={150}
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

export default DeliveryList