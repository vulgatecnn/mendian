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
  Switch,
  message,
  Popconfirm,
  Drawer,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Rate,
  Descriptions,
  Timeline,
  Divider,
  DatePicker,
  Upload,
  Avatar
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import PageHeader from '@/components/common/PageHeader'
import SearchForm from '@/components/common/SearchForm'
import { BasicDataApiService } from '@/services/api/basicData'
import type {
  Supplier,
  SupplierQueryParams,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierStats,
  SupplierContactInfo,
  SupplierBusinessInfo,
  SupplierCooperationInfo,
  SupplierQualification
} from '@/services/types'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

interface SupplierFormData {
  name: string
  code: string
  shortName?: string
  category: Supplier['category']
  type: Supplier['type']
  contactInfo: SupplierContactInfo
  businessInfo: SupplierBusinessInfo
  cooperationInfo: SupplierCooperationInfo
  status: Supplier['status']
  tags: string[]
  notes?: string
}

const SupplierManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stats, setStats] = useState<SupplierStats | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 表单和弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // 选中行状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 表单实例
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  // 查询参数
  const [queryParams, setQueryParams] = useState<SupplierQueryParams>({
    page: 1,
    pageSize: 10
  })

  // 加载数据
  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const response = await BasicDataApiService.getSuppliers(queryParams)
      if (response.code === 200) {
        setSuppliers(response.data)
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.pageSize,
          total: response.pagination.total
        })
      }
    } catch (error) {
      console.error('加载供应商列表失败:', error)
      message.error('加载供应商列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await BasicDataApiService.getSupplierStats()
      if (response.code === 200) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadSuppliers()
    loadStats()
  }, [queryParams])

  // 搜索处理
  const handleSearch = (values: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      ...values
    })
  }

  // 重置搜索
  const handleSearchReset = () => {
    searchForm.resetFields()
    setQueryParams({
      page: 1,
      pageSize: 10
    })
  }

  // 分页处理
  const handleTableChange = (page: number, pageSize: number) => {
    setQueryParams({
      ...queryParams,
      page,
      pageSize
    })
  }

  // 新建供应商
  const handleCreate = () => {
    setEditingSupplier(null)
    form.resetFields()
    // 设置默认值
    form.setFieldsValue({
      status: 'active',
      type: 'company',
      category: 'equipment',
      cooperationInfo: {
        paymentTerms: 'monthly',
        creditRating: 'B',
        serviceRating: 3
      }
    })
    setModalVisible(true)
  }

  // 编辑供应商
  const handleEdit = (record: Supplier) => {
    setEditingSupplier(record)
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      shortName: record.shortName,
      category: record.category,
      type: record.type,
      contactInfo: record.contactInfo,
      businessInfo: record.businessInfo,
      cooperationInfo: record.cooperationInfo,
      status: record.status,
      tags: record.tags,
      notes: record.notes
    })
    setModalVisible(true)
  }

  // 查看详情
  const handleDetail = async (record: Supplier) => {
    setSelectedSupplier(record)
    setDetailDrawerVisible(true)
  }

  // 删除供应商
  const handleDelete = async (id: string) => {
    try {
      const response = await BasicDataApiService.deleteSupplier(id)
      if (response.code === 200) {
        message.success('删除成功')
        loadSuppliers()
        loadStats()
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 保存供应商
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const formData: SupplierFormData = values

      if (editingSupplier) {
        // 更新
        const updateData: UpdateSupplierDto = {
          ...formData,
          updatedBy: 'current-user', // 实际应用中从用户状态获取
          updatedByName: '当前用户'
        }
        const response = await BasicDataApiService.updateSupplier(editingSupplier.id, updateData)
        if (response.code === 200) {
          message.success('更新成功')
        }
      } else {
        // 新建
        const createData: CreateSupplierDto = {
          ...formData,
          createdBy: 'current-user', // 实际应用中从用户状态获取
          createdByName: '当前用户',
          updatedBy: 'current-user',
          updatedByName: '当前用户'
        }
        const response = await BasicDataApiService.createSupplier(createData)
        if (response.code === 200) {
          message.success('创建成功')
        }
      }

      setModalVisible(false)
      loadSuppliers()
      loadStats()
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  // 批量操作
  const handleBatchStatusUpdate = async (status: Supplier['status']) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的供应商')
      return
    }

    try {
      const response = await BasicDataApiService.batchUpdateSupplierStatus(
        selectedRowKeys as string[],
        status
      )
      if (response.code === 200) {
        message.success(`批量${getStatusText(status)}成功`)
        setSelectedRowKeys([])
        loadSuppliers()
        loadStats()
      }
    } catch (error) {
      console.error('批量操作失败:', error)
      message.error('批量操作失败')
    }
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const response = await BasicDataApiService.exportSuppliers(queryParams)
      if (response.code === 200) {
        // 创建下载链接
        const link = document.createElement('a')
        link.href = response.data
        link.download = `suppliers_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        message.success('导出成功')
      }
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败')
    }
  }

  // 获取状态文本
  const getStatusText = (status: Supplier['status']) => {
    switch (status) {
      case 'active':
        return '启用'
      case 'inactive':
        return '禁用'
      case 'blacklisted':
        return '黑名单'
      default:
        return status
    }
  }

  // 获取分类文本
  const getCategoryText = (category: Supplier['category']) => {
    switch (category) {
      case 'equipment':
        return '设备供应商'
      case 'decoration':
        return '装修供应商'
      case 'material':
        return '原材料供应商'
      case 'service':
        return '服务供应商'
      case 'other':
        return '其他'
      default:
        return category
    }
  }

  // 获取付款条件文本
  const getPaymentTermsText = (terms: string) => {
    switch (terms) {
      case 'cash':
        return '现金'
      case 'monthly':
        return '月结30天'
      case 'quarterly':
        return '季结'
      case 'custom':
        return '自定义'
      default:
        return terms
    }
  }

  // 表格列定义
  const columns: ColumnsType<Supplier> = [
    {
      title: '供应商信息',
      key: 'info',
      width: 220,
      render: (_, record: Supplier) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Text strong>{record.name}</Text>
            {record.shortName && <Text type="secondary">({record.shortName})</Text>}
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            编码: {record.code}
          </Text>
        </Space>
      )
    },
    {
      title: '类型分类',
      key: 'category',
      width: 120,
      render: (_, record: Supplier) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue">{getCategoryText(record.category)}</Tag>
          <Tag color="green">{record.type === 'company' ? '企业' : '个人'}</Tag>
        </Space>
      )
    },
    {
      title: '联系信息',
      key: 'contact',
      width: 160,
      render: (_, record: Supplier) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <PhoneOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>{record.contactInfo.phone}</Text>
          </Space>
          <Space size={4}>
            <Text strong style={{ fontSize: '12px' }}>{record.contactInfo.contact}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: '合作信息',
      key: 'cooperation',
      width: 150,
      render: (_, record: Supplier) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <Text style={{ fontSize: '12px' }}>信用:</Text>
            <Tag color={
              record.cooperationInfo.creditRating === 'A' ? 'green' :
              record.cooperationInfo.creditRating === 'B' ? 'blue' :
              record.cooperationInfo.creditRating === 'C' ? 'orange' : 'red'
            }>
              {record.cooperationInfo.creditRating}
            </Tag>
          </Space>
          <Space size={4}>
            <Text style={{ fontSize: '12px' }}>评分:</Text>
            <Rate disabled value={record.cooperationInfo.serviceRating} style={{ fontSize: '12px' }} />
          </Space>
        </Space>
      )
    },
    {
      title: '付款条件',
      dataIndex: ['cooperationInfo', 'paymentTerms'],
      key: 'paymentTerms',
      width: 100,
      render: (terms: string) => (
        <Text style={{ fontSize: '12px' }}>{getPaymentTermsText(terms)}</Text>
      )
    },
    {
      title: '资质证书',
      dataIndex: 'qualifications',
      key: 'qualifications',
      width: 100,
      render: (qualifications: SupplierQualification[]) => {
        const validCount = qualifications?.filter(q => q.status === 'valid').length || 0
        const expiredCount = qualifications?.filter(q => q.status === 'expired').length || 0
        return (
          <Space direction="vertical" size={2}>
            <Badge count={validCount} showZero style={{ backgroundColor: '#52c41a' }} />
            {expiredCount > 0 && (
              <Badge count={expiredCount} showZero style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </Space>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: Supplier['status']) => (
        <Tag color={
          status === 'active' ? 'green' :
          status === 'inactive' ? 'orange' : 'red'
        }>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text: string) => (
        <Text style={{ fontSize: '12px' }}>
          {dayjs(text).format('YYYY-MM-DD')}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record: Supplier) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除这个供应商吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 行选择配置
  const rowSelection: TableRowSelection<Supplier> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record: Supplier) => ({
      disabled: record.status === 'blacklisted' // 黑名单不能选择
    })
  }

  // 搜索表单字段
  const searchFields = [
    {
      name: 'keyword',
      label: '关键字',
      type: 'input' as const,
      placeholder: '搜索供应商名称、编码或联系人'
    },
    {
      name: 'category',
      label: '分类',
      type: 'select' as const,
      options: [
        { label: '全部', value: '' },
        { label: '设备供应商', value: 'equipment' },
        { label: '装修供应商', value: 'decoration' },
        { label: '原材料供应商', value: 'material' },
        { label: '服务供应商', value: 'service' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
        { label: '黑名单', value: 'blacklisted' }
      ]
    },
    {
      name: 'creditRating',
      label: '信用等级',
      type: 'select' as const,
      options: [
        { label: '全部', value: '' },
        { label: 'A级', value: 'A' },
        { label: 'B级', value: 'B' },
        { label: 'C级', value: 'C' },
        { label: 'D级', value: 'D' }
      ]
    }
  ]

  return (
    <div>
      <PageHeader
        title="供应商管理"
        description="管理各类供应商信息，包括设备供应商、装修供应商、原材料供应商等合作伙伴"
        breadcrumbs={[{ title: '基础数据' }, { title: '供应商管理' }]}
      />

      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="总供应商数"
                value={stats.totalSuppliers}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="活跃供应商"
                value={stats.activeSuppliers}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="平均评分"
                value={stats.averageRating}
                precision={1}
                prefix={<StarOutlined />}
                suffix="/5.0"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="证书到期"
                value={stats.qualificationExpiring}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>供应商分类分布</Text>
                <Space>
                  {stats.suppliersByCategory.map(item => (
                    <Badge key={item.category} count={item.count} showZero>
                      <Tag>{getCategoryText(item.category as Supplier['category'])}</Tag>
                    </Badge>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {/* 搜索表单 */}
        <SearchForm
          form={searchForm}
          fields={searchFields}
          onSearch={handleSearch}
          onReset={handleSearchReset}
        />

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建供应商
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadSuppliers()
                loadStats()
              }}
            >
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchStatusUpdate('active')}
            >
              批量启用
            </Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchStatusUpdate('inactive')}
            >
              批量禁用
            </Button>
            <Button
              danger
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchStatusUpdate('blacklisted')}
            >
              加入黑名单
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange
          }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={editingSupplier ? '编辑供应商' : '新建供应商'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active',
            type: 'company',
            category: 'equipment',
            cooperationInfo: {
              paymentTerms: 'monthly',
              creditRating: 'B',
              serviceRating: 3
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="供应商名称"
                rules={[{ required: true, message: '请输入供应商名称' }]}
              >
                <Input placeholder="请输入供应商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="供应商编码"
                rules={[{ required: true, message: '请输入供应商编码' }]}
              >
                <Input placeholder="请输入供应商编码" disabled={!!editingSupplier} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="shortName" label="简称">
                <Input placeholder="请输入简称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="供应商类型"
                rules={[{ required: true, message: '请选择供应商类型' }]}
              >
                <Select placeholder="请选择供应商类型">
                  <Option value="equipment">设备供应商</Option>
                  <Option value="decoration">装修供应商</Option>
                  <Option value="material">原材料供应商</Option>
                  <Option value="service">服务供应商</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="type"
                label="主体类型"
                rules={[{ required: true, message: '请选择主体类型' }]}
              >
                <Select placeholder="请选择主体类型">
                  <Option value="company">企业</Option>
                  <Option value="individual">个人</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">联系信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['contactInfo', 'contact']}
                label="联系人"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['contactInfo', 'phone']}
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['contactInfo', 'email']} label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['contactInfo', 'wechat']} label="微信">
                <Input placeholder="请输入微信号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name={['contactInfo', 'address']} label="联系地址">
            <Input placeholder="请输入联系地址" />
          </Form.Item>

          <Divider orientation="left">企业信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['businessInfo', 'businessLicense']} label="营业执照号码">
                <Input placeholder="请输入营业执照号码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['businessInfo', 'legalPerson']} label="法人代表">
                <Input placeholder="请输入法人代表" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">合作条件</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name={['cooperationInfo', 'paymentTerms']}
                label="付款条件"
                rules={[{ required: true, message: '请选择付款条件' }]}
              >
                <Select placeholder="请选择付款条件">
                  <Option value="cash">现金</Option>
                  <Option value="monthly">月结30天</Option>
                  <Option value="quarterly">季结</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['cooperationInfo', 'creditRating']}
                label="信用等级"
                rules={[{ required: true, message: '请选择信用等级' }]}
              >
                <Select placeholder="请选择信用等级">
                  <Option value="A">A级</Option>
                  <Option value="B">B级</Option>
                  <Option value="C">C级</Option>
                  <Option value="D">D级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['cooperationInfo', 'serviceRating']}
                label="服务评分"
              >
                <Rate />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['cooperationInfo', 'cooperationStartDate']} label="合作开始时间">
                <DatePicker placeholder="请选择合作开始时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  <Option value="active">启用</Option>
                  <Option value="inactive">禁用</Option>
                  <Option value="blacklisted">黑名单</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="供应商详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={800}
      >
        {selectedSupplier && (
          <div>
            <Descriptions
              title="基本信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="供应商名称">
                {selectedSupplier.name}
                {selectedSupplier.shortName && ` (${selectedSupplier.shortName})`}
              </Descriptions.Item>
              <Descriptions.Item label="供应商编码">{selectedSupplier.code}</Descriptions.Item>
              <Descriptions.Item label="供应商类型">
                {getCategoryText(selectedSupplier.category)}
              </Descriptions.Item>
              <Descriptions.Item label="主体类型">
                {selectedSupplier.type === 'company' ? '企业' : '个人'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={
                  selectedSupplier.status === 'active' ? 'green' :
                  selectedSupplier.status === 'inactive' ? 'orange' : 'red'
                }>
                  {getStatusText(selectedSupplier.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedSupplier.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="联系信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="联系人">{selectedSupplier.contactInfo.contact}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedSupplier.contactInfo.phone}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedSupplier.contactInfo.email || '未填写'}</Descriptions.Item>
              <Descriptions.Item label="微信">{selectedSupplier.contactInfo.wechat || '未填写'}</Descriptions.Item>
              <Descriptions.Item label="联系地址" span={2}>
                {selectedSupplier.contactInfo.address}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="合作信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="付款条件">
                {getPaymentTermsText(selectedSupplier.cooperationInfo.paymentTerms)}
              </Descriptions.Item>
              <Descriptions.Item label="信用等级">
                <Tag color={
                  selectedSupplier.cooperationInfo.creditRating === 'A' ? 'green' :
                  selectedSupplier.cooperationInfo.creditRating === 'B' ? 'blue' :
                  selectedSupplier.cooperationInfo.creditRating === 'C' ? 'orange' : 'red'
                }>
                  {selectedSupplier.cooperationInfo.creditRating}级
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务评分">
                <Rate disabled value={selectedSupplier.cooperationInfo.serviceRating} />
              </Descriptions.Item>
              <Descriptions.Item label="合作开始时间">
                {selectedSupplier.cooperationInfo.cooperationStartDate ? 
                  dayjs(selectedSupplier.cooperationInfo.cooperationStartDate).format('YYYY-MM-DD') : 
                  '未填写'
                }
              </Descriptions.Item>
            </Descriptions>

            {selectedSupplier.businessInfo && (
              <Descriptions
                title="企业信息"
                bordered
                column={2}
                size="small"
                style={{ marginBottom: 24 }}
              >
                <Descriptions.Item label="营业执照号码">
                  {selectedSupplier.businessInfo.businessLicense || '未填写'}
                </Descriptions.Item>
                <Descriptions.Item label="法人代表">
                  {selectedSupplier.businessInfo.legalPerson || '未填写'}
                </Descriptions.Item>
                <Descriptions.Item label="税号">
                  {selectedSupplier.businessInfo.taxNumber || '未填写'}
                </Descriptions.Item>
                <Descriptions.Item label="注册资本">
                  {selectedSupplier.businessInfo.registeredCapital ? 
                    `${selectedSupplier.businessInfo.registeredCapital}万元` : '未填写'}
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedSupplier.qualifications && selectedSupplier.qualifications.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Title level={5}>资质证书</Title>
                <Timeline>
                  {selectedSupplier.qualifications.map(qual => (
                    <Timeline.Item
                      key={qual.id}
                      color={qual.status === 'valid' ? 'green' : qual.status === 'expired' ? 'red' : 'orange'}
                    >
                      <div>
                        <Space>
                          <Text strong>{qual.name}</Text>
                          <Tag color={qual.status === 'valid' ? 'green' : qual.status === 'expired' ? 'red' : 'orange'}>
                            {qual.status === 'valid' ? '有效' : qual.status === 'expired' ? '已过期' : '待审核'}
                          </Tag>
                        </Space>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            证书编号: {qual.number} | 发证机构: {qual.issuer}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            发证日期: {dayjs(qual.issueDate).format('YYYY-MM-DD')}
                            {qual.expiryDate && ` | 到期日期: ${dayjs(qual.expiryDate).format('YYYY-MM-DD')}`}
                          </Text>
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}

            {selectedSupplier.evaluations && selectedSupplier.evaluations.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Title level={5}>评价记录</Title>
                <Timeline>
                  {selectedSupplier.evaluations.map(evaluation => (
                    <Timeline.Item key={evaluation.id} color="blue">
                      <div>
                        <Space>
                          <Text strong>评估期间: {evaluation.period}</Text>
                          <Text>评估人: {evaluation.evaluatorName}</Text>
                        </Space>
                        <div style={{ marginTop: 4 }}>
                          <Row gutter={16}>
                            <Col span={6}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                质量评分: {evaluation.qualityScore}/10
                              </Text>
                            </Col>
                            <Col span={6}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                服务评分: {evaluation.serviceScore}/10
                              </Text>
                            </Col>
                            <Col span={6}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                交付评分: {evaluation.deliveryScore}/10
                              </Text>
                            </Col>
                            <Col span={6}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                综合评分: {evaluation.overallScore}/10
                              </Text>
                            </Col>
                          </Row>
                        </div>
                        {evaluation.comments && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              评价: {evaluation.comments}
                            </Text>
                          </div>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            评估时间: {dayjs(evaluation.evaluatedAt).format('YYYY-MM-DD HH:mm:ss')}
                          </Text>
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}

            {selectedSupplier.notes && (
              <div>
                <Title level={5}>备注信息</Title>
                <Paragraph>{selectedSupplier.notes}</Paragraph>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default SupplierManagement