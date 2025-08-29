import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Drawer,
  Descriptions,
  Timeline,
  Upload,
  message,
  Popconfirm,
  Tooltip,
  Alert,
  Progress
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ApprovalInstance, ProcessApprovalRequest } from '../../types/approval'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const PendingApprovals: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [transferModalVisible, setTransferModalVisible] = useState(false)
  const [addSignModalVisible, setAddSignModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null)
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([])
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | null>(null)
  const [form] = Form.useForm()
  const [transferForm] = Form.useForm()
  const [addSignForm] = Form.useForm()

  // 模拟待办审批数据
  const mockPendingApprovals: ApprovalInstance[] = [
    {
      id: '1',
      instanceCode: 'APP20231201001',
      templateId: 'TPL001',
      templateName: '门店选址申请',
      title: '好饭碗(国贸店)选址申请',
      category: '选址申请',
      businessType: 'store_application',
      applicant: {
        id: 'u1',
        name: '张经理',
        position: '区域经理',
        department: '华北大区'
      },
      currentNode: 'n2',
      status: 'pending',
      priority: 'high',
      formData: {
        storeName: '好饭碗(国贸店)',
        address: '北京市朝阳区国贸CBD核心区',
        area: 180,
        rentCost: 45000,
        expectedRevenue: 300000
      },
      createTime: '2023-12-01 09:30:00',
      updateTime: '2023-12-01 14:20:00',
      deadline: '2023-12-03 18:00:00',
      executionPath: ['n1', 'n2'],
      currentApprovers: [
        {
          id: 'u2',
          name: '李总监',
          position: '运营总监',
          department: '运营中心'
        }
      ],
      totalNodes: 4,
      completedNodes: 1,
      estimatedDuration: 48,
      actualDuration: 28
    },
    {
      id: '2',
      instanceCode: 'APP20231201002',
      templateId: 'TPL002',
      templateName: '营业执照申请',
      title: '好饭碗(三里屯店)营业执照申请',
      category: '执照申请',
      businessType: 'license_approval',
      applicant: {
        id: 'u3',
        name: '王经理',
        position: '店长',
        department: '华北大区'
      },
      currentNode: 'n1',
      status: 'pending',
      priority: 'normal',
      formData: {
        storeName: '好饭碗(三里屯店)',
        businessScope: '餐饮服务',
        registeredCapital: 1000000
      },
      createTime: '2023-12-01 15:20:00',
      updateTime: '2023-12-01 15:20:00',
      deadline: '2023-12-05 18:00:00',
      executionPath: ['n1'],
      currentApprovers: [
        {
          id: 'u2',
          name: '李总监',
          position: '运营总监',
          department: '运营中心'
        }
      ],
      totalNodes: 3,
      completedNodes: 0,
      estimatedDuration: 72,
      actualDuration: 6
    },
    {
      id: '3',
      instanceCode: 'APP20231201003',
      templateId: 'TPL003',
      templateName: '设备采购比价',
      title: '厨房设备采购比价审批',
      category: '采购申请',
      businessType: 'price_comparison',
      applicant: {
        id: 'u4',
        name: '陈采购',
        position: '采购专员',
        department: '采购部'
      },
      currentNode: 'n3',
      status: 'pending',
      priority: 'urgent',
      formData: {
        equipmentType: '商用燃气灶',
        quantity: 5,
        budget: 64000,
        suppliers: ['供应商A', '供应商B', '供应商C']
      },
      createTime: '2023-11-30 10:15:00',
      updateTime: '2023-12-01 16:45:00',
      deadline: '2023-12-02 12:00:00',
      executionPath: ['n1', 'n2', 'n3'],
      currentApprovers: [
        {
          id: 'u5',
          name: '刘财务',
          position: '财务经理',
          department: '财务部'
        }
      ],
      totalNodes: 4,
      completedNodes: 2,
      estimatedDuration: 24,
      actualDuration: 30
    }
  ]

  const filteredApprovals = mockPendingApprovals.filter(approval => {
    const matchesSearch = 
      approval.title.toLowerCase().includes(searchText.toLowerCase()) ||
      approval.instanceCode.toLowerCase().includes(searchText.toLowerCase()) ||
      approval.applicant.name.toLowerCase().includes(searchText.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || approval.category === selectedCategory
    const matchesPriority = selectedPriority === 'all' || approval.priority === selectedPriority
    
    return matchesSearch && matchesCategory && matchesPriority
  })

  const columns: ColumnsType<ApprovalInstance> = [
    {
      title: '审批信息',
      key: 'approvalInfo',
      width: 280,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: 4 }}>
            {record.title}
          </div>
          <div style={{ color: '#666', fontSize: '12px', marginBottom: 2 }}>
            {record.instanceCode} · {record.templateName}
          </div>
          <Space size="small">
            <Tag color="blue">{record.category}</Tag>
            <Tag 
              color={
                record.priority === 'urgent' ? 'red' :
                record.priority === 'high' ? 'orange' :
                record.priority === 'normal' ? 'green' : 'default'
              }
            >
              {record.priority === 'urgent' ? '紧急' :
               record.priority === 'high' ? '高' :
               record.priority === 'normal' ? '中' : '低'}
            </Tag>
          </Space>
        </div>
      )
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 120,
      render: (_, record) => (
        <div>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{record.applicant.name}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>{record.applicant.department}</div>
            </div>
          </Space>
        </div>
      )
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      render: (_, record) => {
        const progress = (record.completedNodes / record.totalNodes) * 100
        return (
          <div>
            <Progress 
              percent={progress} 
              size="small" 
              status={progress === 100 ? 'success' : 'active'}
              showInfo={false}
            />
            <div style={{ fontSize: '12px', textAlign: 'center', marginTop: 2 }}>
              {record.completedNodes}/{record.totalNodes} 节点
            </div>
          </div>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 100,
      render: (time: string) => (
        <div>
          <div>{dayjs(time).format('MM-DD')}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {dayjs(time).format('HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 100,
      render: (deadline: string) => {
        const isOverdue = dayjs(deadline).isBefore(dayjs())
        const isUrgent = dayjs(deadline).diff(dayjs(), 'hour') <= 12
        return (
          <div style={{ 
            color: isOverdue ? '#f50' : isUrgent ? '#faad14' : '#666' 
          }}>
            <div>{dayjs(deadline).format('MM-DD')}</div>
            <div style={{ fontSize: '12px' }}>
              {dayjs(deadline).format('HH:mm')}
            </div>
            {isOverdue && (
              <Tag color="red" size="small">已逾期</Tag>
            )}
            {isUrgent && !isOverdue && (
              <Tag color="orange" size="small">即将到期</Tag>
            )}
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space wrap>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleProcess(record, 'approve')}
          >
            审批
          </Button>
          <Button
            danger
            type="text"
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleProcess(record, 'reject')}
          >
            拒绝
          </Button>
          <Button
            type="text"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleTransfer(record)}
          >
            转交
          </Button>
        </Space>
      )
    }
  ]

  const handleViewDetail = (instance: ApprovalInstance) => {
    setSelectedInstance(instance)
    setDetailDrawerVisible(true)
  }

  const handleProcess = (instance: ApprovalInstance, action: 'approve' | 'reject') => {
    setSelectedInstance(instance)
    setProcessAction(action)
    setProcessModalVisible(true)
  }

  const handleTransfer = (instance: ApprovalInstance) => {
    setSelectedInstance(instance)
    setTransferModalVisible(true)
  }

  const handleAddSign = (instance: ApprovalInstance) => {
    setSelectedInstance(instance)
    setAddSignModalVisible(true)
  }

  const handleSubmitProcess = async (values: any) => {
    if (!selectedInstance || !processAction) return

    try {
      const request: ProcessApprovalRequest = {
        instanceId: selectedInstance.id,
        nodeId: selectedInstance.currentNode,
        action: processAction,
        comment: values.comment,
        attachments: values.attachments
      }

      console.log('处理审批:', request)
      message.success(`审批${processAction === 'approve' ? '通过' : '拒绝'}成功`)
      setProcessModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleSubmitTransfer = async (values: any) => {
    if (!selectedInstance) return

    try {
      const request: ProcessApprovalRequest = {
        instanceId: selectedInstance.id,
        nodeId: selectedInstance.currentNode,
        action: 'transfer',
        comment: values.comment,
        transferTo: values.transferTo
      }

      console.log('转交审批:', request)
      message.success('转交成功')
      setTransferModalVisible(false)
      transferForm.resetFields()
    } catch (error) {
      message.error('转交失败，请重试')
    }
  }

  const handleBatchApprove = async () => {
    if (selectedInstanceIds.length === 0) {
      message.warning('请选择要批量审批的项目')
      return
    }

    try {
      console.log('批量审批:', selectedInstanceIds)
      message.success(`批量审批 ${selectedInstanceIds.length} 项成功`)
      setSelectedInstanceIds([])
    } catch (error) {
      message.error('批量审批失败，请重试')
    }
  }

  // 统计数据
  const stats = {
    totalPending: filteredApprovals.length,
    urgentCount: filteredApprovals.filter(a => a.priority === 'urgent').length,
    overdueCount: filteredApprovals.filter(a => dayjs(a.deadline).isBefore(dayjs())).length,
    todayCount: filteredApprovals.filter(a => 
      dayjs(a.createTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待办总数"
              value={stats.totalPending}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="紧急审批"
              value={stats.urgentCount}
              valueStyle={{ color: '#f50' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已逾期"
              value={stats.overdueCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="今日新增"
              value={stats.todayCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Input
                placeholder="搜索审批标题、编号、申请人"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 120 }}
                placeholder="审批类别"
              >
                <Option value="all">全部类别</Option>
                <Option value="选址申请">选址申请</Option>
                <Option value="执照申请">执照申请</Option>
                <Option value="采购申请">采购申请</Option>
                <Option value="合同审批">合同审批</Option>
              </Select>
              <Select
                value={selectedPriority}
                onChange={setSelectedPriority}
                style={{ width: 100 }}
                placeholder="优先级"
              >
                <Option value="all">全部</Option>
                <Option value="urgent">紧急</Option>
                <Option value="high">高</Option>
                <Option value="normal">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Popconfirm
                title="确认批量审批通过所选项目？"
                onConfirm={handleBatchApprove}
                disabled={selectedInstanceIds.length === 0}
              >
                <Button 
                  type="primary"
                  disabled={selectedInstanceIds.length === 0}
                >
                  批量审批 ({selectedInstanceIds.length})
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 待办列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredApprovals}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedInstanceIds,
            onChange: setSelectedInstanceIds,
            getCheckboxProps: (record) => ({
              disabled: dayjs(record.deadline).isBefore(dayjs()) // 已逾期的不允许批量操作
            })
          }}
          pagination={{
            total: filteredApprovals.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 审批处理模态框 */}
      <Modal
        title={`${processAction === 'approve' ? '审批通过' : '审批拒绝'}: ${selectedInstance?.title}`}
        open={processModalVisible}
        onCancel={() => {
          setProcessModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitProcess}
        >
          {processAction === 'reject' && (
            <Alert
              message="请详细说明拒绝原因，便于申请人了解并改进"
              type="warning"
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            name="comment"
            label={processAction === 'approve' ? '审批意见' : '拒绝原因'}
            rules={[
              { required: processAction === 'reject', message: '请输入详细的拒绝原因' },
              { min: processAction === 'reject' ? 10 : 0, message: '拒绝原因至少10个字符' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder={
                processAction === 'approve' 
                  ? '请输入审批意见（可选）' 
                  : '请详细说明拒绝的具体原因...'
              }
            />
          </Form.Item>

          <Form.Item
            name="attachments"
            label="相关附件"
          >
            <Upload
              multiple
              beforeUpload={() => false}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 转交审批模态框 */}
      <Modal
        title={`转交审批: ${selectedInstance?.title}`}
        open={transferModalVisible}
        onCancel={() => {
          setTransferModalVisible(false)
          transferForm.resetFields()
        }}
        onOk={() => transferForm.submit()}
        width={500}
      >
        <Form
          form={transferForm}
          layout="vertical"
          onFinish={handleSubmitTransfer}
        >
          <Form.Item
            name="transferTo"
            label="转交给"
            rules={[{ required: true, message: '请选择转交对象' }]}
          >
            <Select placeholder="请选择转交对象">
              <Option value="u6">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <div>
                    <div>赵主管</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>运营中心</div>
                  </div>
                </Space>
              </Option>
              <Option value="u7">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <div>
                    <div>钱总监</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>财务部</div>
                  </div>
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="转交说明"
            rules={[{ required: true, message: '请输入转交说明' }]}
          >
            <TextArea rows={3} placeholder="请说明转交原因..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审批详情抽屉 */}
      <Drawer
        title="审批详情"
        width={800}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedInstance && (
          <div>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="审批标题">
                  {selectedInstance.title}
                </Descriptions.Item>
                <Descriptions.Item label="审批编号">
                  {selectedInstance.instanceCode}
                </Descriptions.Item>
                <Descriptions.Item label="审批模板">
                  {selectedInstance.templateName}
                </Descriptions.Item>
                <Descriptions.Item label="审批类别">
                  <Tag color="blue">{selectedInstance.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  <Tag 
                    color={
                      selectedInstance.priority === 'urgent' ? 'red' :
                      selectedInstance.priority === 'high' ? 'orange' :
                      selectedInstance.priority === 'normal' ? 'green' : 'default'
                    }
                  >
                    {selectedInstance.priority === 'urgent' ? '紧急' :
                     selectedInstance.priority === 'high' ? '高' :
                     selectedInstance.priority === 'normal' ? '中' : '低'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Badge status="processing" text="待审批" />
                </Descriptions.Item>
                <Descriptions.Item label="申请人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {selectedInstance.applicant.name} ({selectedInstance.applicant.position})
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="申请部门">
                  {selectedInstance.applicant.department}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {selectedInstance.createTime}
                </Descriptions.Item>
                <Descriptions.Item label="截止时间">
                  <span style={{
                    color: dayjs(selectedInstance.deadline).isBefore(dayjs()) ? '#f50' : '#666'
                  }}>
                    {selectedInstance.deadline}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 申请内容 */}
            <Card title="申请内容" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                {Object.entries(selectedInstance.formData).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>

            {/* 流程进度 */}
            <Card title="流程进度" size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Progress 
                  percent={(selectedInstance.completedNodes / selectedInstance.totalNodes) * 100}
                  status="active"
                  format={() => `${selectedInstance.completedNodes}/${selectedInstance.totalNodes}`}
                />
              </div>
              <Timeline>
                <Timeline.Item color="green">
                  <p>申请已提交</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {selectedInstance.createTime} · {selectedInstance.applicant.name}
                  </p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p>等待审批</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    当前节点 · {selectedInstance.currentApprovers[0]?.name}
                  </p>
                </Timeline.Item>
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default PendingApprovals