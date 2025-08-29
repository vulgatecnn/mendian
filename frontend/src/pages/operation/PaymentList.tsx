import React, { useState } from 'react'
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
  DatePicker,
  Statistic,
  Progress,
  Drawer,
  Descriptions,
  Timeline,
  Upload,
  message,
  Badge,
  Tooltip,
  Avatar
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  ShopOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

interface Payment {
  id: string
  paymentCode: string
  storeCode: string
  storeName: string
  paymentType: string
  supplier: string
  amount: number
  dueDate: string
  status: string
  priority: string
  description: string
  applicant: string
  approver?: string
  createDate: string
  documents?: string[]
  region: string
}

const PaymentList: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [form] = Form.useForm()

  // 模拟付款项数据
  const mockPayments: Payment[] = [
    {
      id: '1',
      paymentCode: 'PAY20231201001',
      storeCode: 'HFW001',
      storeName: '好饭碗(国贸店)',
      paymentType: '装修费用',
      supplier: '北京建筑装饰公司',
      amount: 285000,
      dueDate: '2023-12-15',
      status: '待审批',
      priority: '高',
      description: '门店装修尾款支付',
      applicant: '张经理',
      createDate: '2023-12-01 10:30:00',
      region: '华北大区'
    },
    {
      id: '2',
      paymentCode: 'PAY20231201002',
      storeCode: 'HFW002',
      storeName: '好饭碗(三里屯店)',
      paymentType: '设备采购',
      supplier: '厨房设备供应商',
      amount: 125000,
      dueDate: '2023-12-10',
      status: '已审批',
      priority: '中',
      description: '厨房设备采购款',
      applicant: '李经理',
      approver: '王总监',
      createDate: '2023-11-28 14:20:00',
      region: '华北大区'
    },
    {
      id: '3',
      paymentCode: 'PAY20231201003',
      storeCode: 'HFW003',
      storeName: '好饭碗(陆家嘴店)',
      paymentType: '租金费用',
      supplier: '物业管理公司',
      amount: 85000,
      dueDate: '2023-12-05',
      status: '已支付',
      priority: '高',
      description: '12月份租金',
      applicant: '王经理',
      approver: '李总监',
      createDate: '2023-11-25 09:15:00',
      region: '华东大区'
    },
    {
      id: '4',
      paymentCode: 'PAY20231201004',
      storeCode: 'HFW004',
      storeName: '好饭碗(天河店)',
      paymentType: '营销费用',
      supplier: '广告传媒公司',
      amount: 58000,
      dueDate: '2023-12-20',
      status: '待审批',
      priority: '低',
      description: '开业营销活动费用',
      applicant: '陈经理',
      createDate: '2023-12-02 16:45:00',
      region: '华南大区'
    },
    {
      id: '5',
      paymentCode: 'PAY20231201005',
      storeCode: 'HFW005',
      storeName: '好饭碗(春熙路店)',
      paymentType: '装修费用',
      supplier: '成都装修公司',
      amount: 195000,
      dueDate: '2023-12-08',
      status: '已拒绝',
      priority: '中',
      description: '装修费用超出预算',
      applicant: '刘经理',
      approver: '张总监',
      createDate: '2023-11-30 11:20:00',
      region: '华西大区'
    }
  ]

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = 
      payment.paymentCode.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.storeName.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.supplier.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus
    const matchesType = selectedType === 'all' || payment.paymentType === selectedType
    const matchesRegion = selectedRegion === 'all' || payment.region === selectedRegion
    
    return matchesSearch && matchesStatus && matchesType && matchesRegion
  })

  const columns: ColumnsType<Payment> = [
    {
      title: '付款信息',
      key: 'paymentInfo',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {record.paymentCode}
          </div>
          <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
            <ShopOutlined /> {record.storeName}
          </div>
          <div style={{ color: '#999', fontSize: '12px' }}>
            <UserOutlined /> {record.applicant}
          </div>
        </div>
      )
    },
    {
      title: '付款类型',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '装修费用': 'blue',
          '设备采购': 'green',
          '租金费用': 'orange',
          '营销费用': 'purple'
        }
        return <Tag color={colorMap[type]}>{type}</Tag>
      }
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      ellipsis: true,
      width: 150
    },
    {
      title: '金额(元)',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <span style={{ color: '#f50', fontWeight: 'bold' }}>
          ¥{amount.toLocaleString()}
        </span>
      )
    },
    {
      title: '到期时间',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 100,
      render: (date: string) => {
        const isOverdue = dayjs(date).isBefore(dayjs())
        const isUrgent = dayjs(date).diff(dayjs(), 'day') <= 3
        return (
          <div style={{ 
            color: isOverdue ? '#f50' : isUrgent ? '#faad14' : '#666' 
          }}>
            {dayjs(date).format('MM-DD')}
          </div>
        )
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          '高': 'red',
          '中': 'orange',
          '低': 'green'
        }
        return <Tag color={colorMap[priority]}>{priority}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; icon: any }> = {
          '待审批': { color: 'processing', icon: <ClockCircleOutlined /> },
          '已审批': { color: 'success', icon: <CheckCircleOutlined /> },
          '已支付': { color: 'success', icon: <CheckCircleOutlined /> },
          '已拒绝': { color: 'error', icon: <ExclamationCircleOutlined /> }
        }
        const config = statusConfig[status]
        return (
          <Badge 
            status={config.color as any} 
            icon={config.icon}
            text={status}
          />
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewPayment(record)}
          >
            详情
          </Button>
          {(record.status === '待审批' || record.status === '已拒绝') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditPayment(record)}
            >
              编辑
            </Button>
          )}
        </Space>
      )
    }
  ]

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailDrawerVisible(true)
  }

  const handleEditPayment = (payment: Payment) => {
    console.log('编辑付款项:', payment)
  }

  const handleCreatePayment = async (values: any) => {
    try {
      console.log('创建付款项:', values)
      message.success('付款项创建成功')
      setCreateModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('创建失败，请重试')
    }
  }

  // 统计数据
  const stats = {
    totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
    pendingCount: filteredPayments.filter(p => p.status === '待审批').length,
    overdueCount: filteredPayments.filter(p => 
      p.status !== '已支付' && dayjs(p.dueDate).isBefore(dayjs())
    ).length,
    paidCount: filteredPayments.filter(p => p.status === '已支付').length
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总金额"
              value={stats.totalAmount}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待审批"
              value={stats.pendingCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
              suffix="项"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已逾期"
              value={stats.overdueCount}
              valueStyle={{ color: '#f50' }}
              prefix={<ExclamationCircleOutlined />}
              suffix="项"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已支付"
              value={stats.paidCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
              suffix="项"
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
                placeholder="搜索付款编号、门店、供应商"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 280 }}
              />
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 120 }}
                placeholder="状态"
              >
                <Option value="all">全部状态</Option>
                <Option value="待审批">待审批</Option>
                <Option value="已审批">已审批</Option>
                <Option value="已支付">已支付</Option>
                <Option value="已拒绝">已拒绝</Option>
              </Select>
              <Select
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: 120 }}
                placeholder="类型"
              >
                <Option value="all">全部类型</Option>
                <Option value="装修费用">装修费用</Option>
                <Option value="设备采购">设备采购</Option>
                <Option value="租金费用">租金费用</Option>
                <Option value="营销费用">营销费用</Option>
              </Select>
              <Select
                value={selectedRegion}
                onChange={setSelectedRegion}
                style={{ width: 120 }}
                placeholder="大区"
              >
                <Option value="all">全部大区</Option>
                <Option value="华北大区">华北大区</Option>
                <Option value="华东大区">华东大区</Option>
                <Option value="华南大区">华南大区</Option>
                <Option value="华西大区">华西大区</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ExportOutlined />}>
                导出数据
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                新建付款项
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 付款项列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredPayments}
          rowKey="id"
          pagination={{
            total: filteredPayments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 创建付款项模态框 */}
      <Modal
        title="新建付款项"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreatePayment}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storeCode"
                label="所属门店"
                rules={[{ required: true, message: '请选择门店' }]}
              >
                <Select placeholder="请选择门店">
                  <Option value="HFW001">好饭碗(国贸店)</Option>
                  <Option value="HFW002">好饭碗(三里屯店)</Option>
                  <Option value="HFW003">好饭碗(陆家嘴店)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentType"
                label="付款类型"
                rules={[{ required: true, message: '请选择付款类型' }]}
              >
                <Select placeholder="请选择付款类型">
                  <Option value="装修费用">装修费用</Option>
                  <Option value="设备采购">设备采购</Option>
                  <Option value="租金费用">租金费用</Option>
                  <Option value="营销费用">营销费用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier"
                label="供应商"
                rules={[{ required: true, message: '请输入供应商名称' }]}
              >
                <Input placeholder="请输入供应商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="付款金额"
                rules={[{ required: true, message: '请输入付款金额' }]}
              >
                <Input
                  placeholder="请输入付款金额"
                  prefix="¥"
                  type="number"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="到期时间"
                rules={[{ required: true, message: '请选择到期时间' }]}
              >
                <DatePicker placeholder="请选择到期时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  <Option value="高">高</Option>
                  <Option value="中">中</Option>
                  <Option value="低">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="付款说明"
            rules={[{ required: true, message: '请输入付款说明' }]}
          >
            <TextArea rows={3} placeholder="请详细描述付款用途和相关信息" />
          </Form.Item>

          <Form.Item
            name="documents"
            label="相关文件"
          >
            <Upload
              multiple
              beforeUpload={() => false}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 付款项详情抽屉 */}
      <Drawer
        title="付款项详情"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedPayment && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="付款编号">
                {selectedPayment.paymentCode}
              </Descriptions.Item>
              <Descriptions.Item label="所属门店">
                <Space>
                  <Avatar size="small" icon={<ShopOutlined />} />
                  {selectedPayment.storeName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="付款类型">
                <Tag color="blue">{selectedPayment.paymentType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="供应商">
                {selectedPayment.supplier}
              </Descriptions.Item>
              <Descriptions.Item label="付款金额">
                <span style={{ color: '#f50', fontSize: '16px', fontWeight: 'bold' }}>
                  ¥{selectedPayment.amount.toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="到期时间">
                {selectedPayment.dueDate}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={selectedPayment.priority === '高' ? 'red' : 
                           selectedPayment.priority === '中' ? 'orange' : 'green'}>
                  {selectedPayment.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {selectedPayment.status === '待审批' && (
                  <Badge status="processing" text="待审批" />
                )}
                {selectedPayment.status === '已审批' && (
                  <Badge status="success" text="已审批" />
                )}
                {selectedPayment.status === '已支付' && (
                  <Badge status="success" text="已支付" />
                )}
                {selectedPayment.status === '已拒绝' && (
                  <Badge status="error" text="已拒绝" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {selectedPayment.applicant}
                </Space>
              </Descriptions.Item>
              {selectedPayment.approver && (
                <Descriptions.Item label="审批人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {selectedPayment.approver}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">
                {selectedPayment.createDate}
              </Descriptions.Item>
              <Descriptions.Item label="付款说明">
                {selectedPayment.description}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4>处理记录</h4>
              <Timeline size="small">
                <Timeline.Item color="blue">
                  <p>付款申请已提交</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {selectedPayment.createDate} · {selectedPayment.applicant}
                  </p>
                </Timeline.Item>
                {selectedPayment.status !== '待审批' && (
                  <Timeline.Item 
                    color={selectedPayment.status === '已拒绝' ? 'red' : 'green'}
                  >
                    <p>
                      {selectedPayment.status === '已拒绝' ? '审批已拒绝' : 
                       selectedPayment.status === '已审批' ? '审批已通过' : '付款已完成'}
                    </p>
                    <p style={{ color: '#666', fontSize: '12px' }}>
                      {dayjs().format('YYYY-MM-DD HH:mm:ss')} · {selectedPayment.approver}
                    </p>
                  </Timeline.Item>
                )}
              </Timeline>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default PaymentList