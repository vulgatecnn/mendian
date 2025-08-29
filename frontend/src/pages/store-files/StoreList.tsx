import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  Drawer,
  Row,
  Col,
  Statistic,
  Progress,
  Timeline,
  Image,
  Descriptions,
  Divider,
  Modal,
  Form,
  Upload,
  DatePicker,
  message,
  Badge,
  Tooltip,
  Popconfirm,
  Alert
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  CalendarOutlined,
  FileImageOutlined,
  PlusOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType, TableProps } from 'antd/es/table'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { StoreFilesApiService } from '@/services/api/storeFiles'
// import type { Store as StoreType } from '@/services/types/business'

const { Option } = Select
const { TextArea } = Input

// 门店状态映射
const STORE_STATUS_MAP = {
  PREPARING: { text: '筹备中', color: 'processing', badge: 'processing' },
  OPEN: { text: '营业中', color: 'success', badge: 'success' },
  RENOVATING: { text: '装修中', color: 'warning', badge: 'warning' },
  SUSPENDED: { text: '暂停营业', color: 'error', badge: 'error' },
  CLOSED: { text: '已关闭', color: 'default', badge: 'default' },
} as const

// 门店类型映射
const STORE_TYPE_MAP = {
  DIRECT: { text: '直营店', color: 'green' },
  FRANCHISE: { text: '加盟店', color: 'orange' },
  FLAGSHIP: { text: '旗舰店', color: 'purple' },
  POPUP: { text: '快闪店', color: 'blue' },
} as const

interface StoreListQuery {
  page?: number
  limit?: number
  keyword?: string
  storeType?: keyof typeof STORE_TYPE_MAP
  status?: keyof typeof STORE_STATUS_MAP
  entityId?: string
}

interface Store {
  id: string
  storeCode: string
  storeName: string
  storeType: keyof typeof STORE_TYPE_MAP
  status: keyof typeof STORE_STATUS_MAP
  address: string
  detailedAddress?: string
  area?: number
  usableArea?: number
  openDate?: string
  businessLicense?: string
  monthlyRevenue?: number
  employeeCount?: number
  contactPhone?: string
  contactEmail?: string
  notes?: string
  tags: string[]
  entity: {
    id: string
    name: string
    code: string
  }
  candidateLocation?: {
    id: string
    name: string
  }
  _count: {
    paymentItems: number
    assets: number
  }
  createdAt: string
  updatedAt: string
}

// Mock 数据
const mockStores: Store[] = [
  {
    id: '1',
    storeCode: 'HFW001',
    storeName: '好饭碗北京中关村店',
    storeType: 'DIRECT',
    status: 'OPEN',
    address: '北京市海淀区中关村大街1号',
    detailedAddress: '海龙大厦B座1层101室',
    area: 120.5,
    usableArea: 98.2,
    openDate: '2024-01-15T00:00:00Z',
    businessLicense: '110108123456789',
    monthlyRevenue: 450000,
    employeeCount: 8,
    contactPhone: '010-82345678',
    contactEmail: 'zgc001@haofanwan.com',
    notes: '核心商圈门店，客流量大',
    tags: ['旗舰店', '高流量'],
    entity: {
      id: 'entity1',
      name: '北京好饭碗餐饮管理有限公司',
      code: 'BJHFW'
    },
    candidateLocation: {
      id: 'loc1',
      name: '中关村商圈A点'
    },
    _count: {
      paymentItems: 12,
      assets: 25
    },
    createdAt: '2024-01-10T10:30:00Z',
    updatedAt: '2024-01-20T16:45:00Z'
  },
  {
    id: '2',
    storeCode: 'HFW002',
    storeName: '好饭碗上海浦东店',
    storeType: 'FRANCHISE',
    status: 'PREPARING',
    address: '上海市浦东新区陆家嘴环路123号',
    detailedAddress: '国金中心商场3层A301',
    area: 150.0,
    usableArea: 125.0,
    openDate: '2024-02-01T00:00:00Z',
    businessLicense: '310115987654321',
    monthlyRevenue: 0,
    employeeCount: 0,
    contactPhone: '021-68901234',
    contactEmail: 'pd002@haofanwan.com',
    notes: '筹备中，预计2月开业',
    tags: ['新店', '筹备中'],
    entity: {
      id: 'entity2',
      name: '上海好饭碗餐饮有限公司',
      code: 'SHHFW'
    },
    _count: {
      paymentItems: 0,
      assets: 0
    },
    createdAt: '2024-01-15T14:20:00Z',
    updatedAt: '2024-01-25T11:30:00Z'
  },
  {
    id: '3',
    storeCode: 'HFW003',
    storeName: '好饭碗深圳南山店',
    storeType: 'FLAGSHIP',
    status: 'RENOVATING',
    address: '深圳市南山区深南大道9999号',
    detailedAddress: '华润万象城L2层201号',
    area: 200.0,
    usableArea: 165.0,
    openDate: '2023-12-01T00:00:00Z',
    businessLicense: '440301123987654',
    monthlyRevenue: 680000,
    employeeCount: 12,
    contactPhone: '0755-26001234',
    contactEmail: 'sz003@haofanwan.com',
    notes: '旗舰店升级改造中',
    tags: ['旗舰店', '装修中'],
    entity: {
      id: 'entity3',
      name: '深圳好饭碗餐饮管理有限公司',
      code: 'SZHFW'
    },
    _count: {
      paymentItems: 18,
      assets: 42
    },
    createdAt: '2023-11-20T09:15:00Z',
    updatedAt: '2024-01-20T08:22:00Z'
  }
]

const StoreList: React.FC = () => {
  const [query, setQuery] = useState<StoreListQuery>({ page: 1, limit: 20 })
  const [selectedStoreType, setSelectedStoreType] = useState<keyof typeof STORE_TYPE_MAP | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof STORE_STATUS_MAP | 'all'>('all')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)

  // 模拟数据加载和操作
  const storeData = {
    data: {
      items: mockStores.filter(store => {
        if (selectedStoreType !== 'all' && store.storeType !== selectedStoreType) return false
        if (selectedStatus !== 'all' && store.status !== selectedStatus) return false
        if (query.keyword && !store.storeName.includes(query.keyword) && !store.storeCode.includes(query.keyword)) return false
        return true
      }),
      pagination: {
        total: mockStores.length,
        page: query.page || 1,
        pages: Math.ceil(mockStores.length / (query.limit || 20))
      }
    }
  }

  const error = null
  
  const refetch = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500)
  }

  // 处理搜索
  const handleSearch = (keyword: string) => {
    setQuery(prev => ({ ...prev, page: 1, keyword: keyword || undefined }))
  }

  // 处理筛选
  const handleFilter = (filterType: string, value: string) => {
    setQuery(prev => ({
      ...prev,
      page: 1,
      [filterType]: value === 'all' ? undefined : value
    }))
  }

  // 处理分页
  const handleTableChange: TableProps<Store>['onChange'] = (pagination) => {
    setQuery(prev => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || 20
    }))
  }

  const stores = storeData?.data?.items || []
  const pagination = storeData?.data?.pagination || { total: 0, page: 1, pages: 1 }

  // 事件处理函数
  const handleViewStore = (store: Store) => {
    setSelectedStore(store)
    setDrawerVisible(true)
  }

  const handleEditStore = (store: Store) => {
    setSelectedStore(store)
    form.setFieldsValue({
      ...store,
      entityId: store.entity.id,
      openDate: store.openDate ? new Date(store.openDate) : undefined,
    })
    setEditModalVisible(true)
  }

  const handleCreateStore = () => {
    setCreateModalVisible(true)
  }

  const handleDeleteStore = (id: string) => {
    message.success('删除成功（模拟操作）')
    setSelectedRowKeys([])
  }

  const handleChangeStatus = (id: string, status: keyof typeof STORE_STATUS_MAP, reason?: string) => {
    message.success('状态更新成功（模拟操作）')
  }

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的门店')
      return
    }
    
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个门店吗？此操作不可撤销。`,
      onOk: async () => {
        message.success('批量删除成功（模拟操作）')
        setSelectedRowKeys([])
      },
    })
  }

  const columns: ColumnsType<Store> = [
    {
      title: '门店信息',
      key: 'storeInfo',
      width: 300,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={48}
            icon={<ShopOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{record.storeName}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.storeCode}</div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              <EnvironmentOutlined /> {record.address?.slice(0, 25)}...
            </div>
          </div>
        </div>
      )
    },
    {
      title: '公司主体',
      key: 'entity',
      width: 120,
      render: (_, record) => (
        <Tooltip title={record.entity.name}>
          <Tag color="blue">{record.entity.code}</Tag>
        </Tooltip>
      )
    },
    {
      title: '门店类型',
      dataIndex: 'storeType',
      key: 'storeType',
      width: 100,
      render: (type: keyof typeof STORE_TYPE_MAP) => {
        const typeConfig = STORE_TYPE_MAP[type]
        return <Tag color={typeConfig?.color}>{typeConfig?.text || type}</Tag>
      }
    },
    {
      title: '营业状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof STORE_STATUS_MAP) => {
        const statusConfig = STORE_STATUS_MAP[status]
        return <Badge status={statusConfig?.badge as any} text={statusConfig?.text || status} />
      }
    },
    {
      title: '面积(㎡)',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      align: 'center',
      render: (area: number) => area ? area.toFixed(0) : '-'
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 140,
      render: (_, record) => (
        <div>
          {record.contactPhone && (
            <div style={{ fontSize: '12px' }}>
              <PhoneOutlined /> {record.contactPhone}
            </div>
          )}
          {record.contactEmail && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.contactEmail}
            </div>
          )}
        </div>
      )
    },
    {
      title: '月营收(万)',
      dataIndex: 'monthlyRevenue',
      key: 'monthlyRevenue',
      width: 100,
      align: 'right',
      render: (revenue: number) => revenue ? `¥${(revenue / 10000).toFixed(1)}` : '-'
    },
    {
      title: '员工数',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 80,
      align: 'center',
      render: (count: number) => count || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewStore(record)}
          >
            详情
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditStore(record)}
          >
            编辑
          </Button>
          {record.status === 'PREPARING' && (
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleChangeStatus(record.id, 'OPEN')}
            >
              开业
            </Button>
          )}
          {record.status === 'OPEN' && (
            <Button
              type="text"
              size="small"
              icon={<PauseCircleOutlined />}
              style={{ color: '#fa8c16' }}
              onClick={() => handleChangeStatus(record.id, 'SUSPENDED')}
            >
              暂停
            </Button>
          )}
          <Popconfirm
            title="确定要删除这个门店吗？"
            description="此操作不可撤销，请谨慎操作。"
            onConfirm={() => handleDeleteStore(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]


  const handleSaveStore = async (values: any) => {
    try {
      message.success('更新成功（模拟操作）')
      setEditModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('保存失败，请重试')
    }
  }

  const handleCreateSubmit = async (values: any) => {
    message.success('门店创建成功（模拟操作）')
    setCreateModalVisible(false)
    createForm.resetFields()
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], selectedRows: Store[]) => {
      setSelectedRowKeys(keys as string[])
    },
    getCheckboxProps: (record: Store) => ({
      disabled: record.status === 'OPEN', // 营业中的门店不能批量删除
    }),
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error instanceof Error ? error.message : '请稍后重试'}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={() => refetch()}>
            重试
          </Button>
        }
      />
    )
  }

  return (
    <div>
      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="搜索门店名称或编码"
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 240 }}
                onPressEnter={(e) => handleSearch(e.currentTarget.value)}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleSearch('')
                  }
                }}
              />
              <Select
                value={selectedStoreType}
                onChange={(value) => {
                  setSelectedStoreType(value)
                  handleFilter('storeType', value)
                }}
                style={{ width: 120 }}
                placeholder="门店类型"
              >
                <Option value="all">全部类型</Option>
                {Object.entries(STORE_TYPE_MAP).map(([key, config]) => (
                  <Option key={key} value={key}>{config.text}</Option>
                ))}
              </Select>
              <Select
                value={selectedStatus}
                onChange={(value) => {
                  setSelectedStatus(value)
                  handleFilter('status', value)
                }}
                style={{ width: 120 }}
                placeholder="营业状态"
              >
                <Option value="all">全部状态</Option>
                {Object.entries(STORE_STATUS_MAP).map(([key, config]) => (
                  <Option key={key} value={key}>{config.text}</Option>
                ))}
              </Select>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => refetch()}
                loading={isLoading}
              >
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={handleBatchDelete}
                >
                  批量删除({selectedRowKeys.length})
                </Button>
              )}
              <Button icon={<ExportOutlined />}>
                导出数据
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateStore}
              >
                新增门店
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 门店列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={stores}
          rowKey="id"
          rowSelection={rowSelection}
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            current: pagination.page,
            pageSize: query.limit || 20,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 门店详情抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={32}
              icon={<ShopOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <div>{selectedStore?.storeName}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {selectedStore && STORE_STATUS_MAP[selectedStore.status]?.text}
              </div>
            </div>
          </div>
        }
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedStore && (
          <div>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="门店编码">{selectedStore.storeCode}</Descriptions.Item>
                <Descriptions.Item label="门店名称">{selectedStore.storeName}</Descriptions.Item>
                <Descriptions.Item label="公司主体">{selectedStore.entity.name}</Descriptions.Item>
                <Descriptions.Item label="门店类型">
                  <Tag color={STORE_TYPE_MAP[selectedStore.storeType]?.color}>
                    {STORE_TYPE_MAP[selectedStore.storeType]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="营业状态">
                  <Badge 
                    status={STORE_STATUS_MAP[selectedStore.status]?.badge as any} 
                    text={STORE_STATUS_MAP[selectedStore.status]?.text}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="开业时间">
                  {selectedStore.openDate ? new Date(selectedStore.openDate).toLocaleDateString() : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="营业面积">
                  {selectedStore.area ? `${selectedStore.area}㎡` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="使用面积">
                  {selectedStore.usableArea ? `${selectedStore.usableArea}㎡` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="营业执照">{selectedStore.businessLicense || '-'}</Descriptions.Item>
                <Descriptions.Item label="员工数量">{selectedStore.employeeCount || '-'}人</Descriptions.Item>
                <Descriptions.Item label="门店地址" span={2}>
                  <EnvironmentOutlined /> {selectedStore.address}
                  {selectedStore.detailedAddress && (
                    <div style={{ marginTop: 4, color: '#666' }}>
                      详细地址：{selectedStore.detailedAddress}
                    </div>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 联系信息 */}
            <Card title="联系信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="联系电话">
                  {selectedStore.contactPhone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱地址">
                  {selectedStore.contactEmail || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 运营数据 */}
            <Card title="运营数据" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="月营收"
                      value={selectedStore.monthlyRevenue || 0}
                      precision={0}
                      valueStyle={{ color: '#3f8600' }}
                      prefix="¥"
                      suffix="元"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="员工数量"
                      value={selectedStore.employeeCount || 0}
                      valueStyle={{ color: '#1890ff' }}
                      suffix="人"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="相关事项"
                      value={selectedStore._count.paymentItems + selectedStore._count.assets}
                      valueStyle={{ color: '#faad14' }}
                      suffix="项"
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* 关联数据 */}
            <Card title="关联数据" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '24px', color: '#1890ff' }}>
                      {selectedStore._count.paymentItems}
                    </div>
                    <div>付款项目</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '24px', color: '#52c41a' }}>
                      {selectedStore._count.assets}
                    </div>
                    <div>资产设备</div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 标签 */}
            {selectedStore.tags && selectedStore.tags.length > 0 && (
              <Card title="门店标签" size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                  {selectedStore.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* 备注 */}
            {selectedStore.notes && (
              <Card title="备注信息" size="small" style={{ marginBottom: 16 }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedStore.notes}</div>
              </Card>
            )}

            {/* 变更历史 */}
            <Card title="变更历史" size="small">
              <Timeline size="small">
                <Timeline.Item color="green">
                  <p>门店创建</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {new Date(selectedStore.createdAt).toLocaleString()}
                  </p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p>最后更新</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {new Date(selectedStore.updatedAt).toLocaleString()}
                  </p>
                </Timeline.Item>
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>

      {/* 编辑门店信息模态框 */}
      <Modal
        title="编辑门店信息"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={800}
        confirmLoading={isLoading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveStore}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storeName"
                label="门店名称"
                rules={[{ required: true, message: '请输入门店名称' }]}
              >
                <Input placeholder="请输入门店名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="storeType"
                label="门店类型"
                rules={[{ required: true, message: '请选择门店类型' }]}
              >
                <Select placeholder="请选择门店类型">
                  {Object.entries(STORE_TYPE_MAP).map(([key, config]) => (
                    <Option key={key} value={key}>{config.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="门店地址"
            rules={[{ required: true, message: '请输入门店地址' }]}
          >
            <TextArea rows={2} placeholder="请输入详细地址" />
          </Form.Item>

          <Form.Item
            name="detailedAddress"
            label="详细地址"
          >
            <TextArea rows={2} placeholder="请输入详细地址补充信息" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area"
                label="营业面积(㎡)"
              >
                <Input placeholder="请输入营业面积" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="usableArea"
                label="使用面积(㎡)"
              >
                <Input placeholder="请输入使用面积" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactEmail"
                label="邮箱地址"
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="monthlyRevenue"
                label="月营收(元)"
              >
                <Input placeholder="请输入月营收" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employeeCount"
                label="员工数量"
              >
                <Input placeholder="请输入员工数量" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="businessLicense"
                label="营业执照号"
              >
                <Input placeholder="请输入营业执照号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="openDate"
                label="开业时间"
              >
                <DatePicker placeholder="请选择开业时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建门店模态框 */}
      <Modal
        title="新增门店"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          createForm.resetFields()
        }}
        onOk={() => createForm.submit()}
        width={800}
        confirmLoading={isLoading}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storeName"
                label="门店名称"
                rules={[{ required: true, message: '请输入门店名称' }]}
              >
                <Input placeholder="请输入门店名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="storeCode"
                label="门店编码"
                rules={[{ required: true, message: '请输入门店编码' }]}
              >
                <Input placeholder="请输入门店编码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="entityId"
                label="公司主体"
                rules={[{ required: true, message: '请选择公司主体' }]}
              >
                <Select placeholder="请选择公司主体">
                  {/* TODO: 从API获取公司主体列表 */}
                  <Option value="entity1">公司主体1</Option>
                  <Option value="entity2">公司主体2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="storeType"
                label="门店类型"
                rules={[{ required: true, message: '请选择门店类型' }]}
              >
                <Select placeholder="请选择门店类型">
                  {Object.entries(STORE_TYPE_MAP).map(([key, config]) => (
                    <Option key={key} value={key}>{config.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="门店地址"
            rules={[{ required: true, message: '请输入门店地址' }]}
          >
            <TextArea rows={2} placeholder="请输入详细地址" />
          </Form.Item>

          <Form.Item
            name="detailedAddress"
            label="详细地址"
          >
            <TextArea rows={2} placeholder="请输入详细地址补充信息" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area"
                label="营业面积(㎡)"
              >
                <Input placeholder="请输入营业面积" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="usableArea"
                label="使用面积(㎡)"
              >
                <Input placeholder="请输入使用面积" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactEmail"
                label="邮箱地址"
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="monthlyRevenue"
                label="月营收(元)"
              >
                <Input placeholder="请输入月营收" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employeeCount"
                label="员工数量"
              >
                <Input placeholder="请输入员工数量" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="businessLicense"
                label="营业执照号"
              >
                <Input placeholder="请输入营业执照号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="openDate"
                label="开业时间"
              >
                <DatePicker placeholder="请选择开业时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default StoreList