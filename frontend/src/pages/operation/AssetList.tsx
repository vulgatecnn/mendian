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
  Avatar,
  Image,
  QRCode
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  QrcodeOutlined,
  ToolOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PropertySafetyOutlined,
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

interface Asset {
  id: string
  assetCode: string
  assetName: string
  category: string
  storeCode: string
  storeName: string
  brand: string
  model: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: number
  currentValue: number
  status: string
  condition: string
  location: string
  responsible: string
  warrantyDate: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  supplier: string
  description: string
  images?: string[]
  region: string
}

const AssetList: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [form] = Form.useForm()

  // 模拟资产数据
  const mockAssets: Asset[] = [
    {
      id: '1',
      assetCode: 'AST20231201001',
      assetName: '商用燃气灶',
      category: '厨房设备',
      storeCode: 'HFW001',
      storeName: '好饭碗(国贸店)',
      brand: '海尔',
      model: 'HCG-880A',
      serialNumber: 'SN202311001',
      purchaseDate: '2023-02-15',
      purchasePrice: 12800,
      currentValue: 9600,
      status: '正常使用',
      condition: '良好',
      location: '厨房操作间',
      responsible: '张经理',
      warrantyDate: '2025-02-15',
      lastMaintenanceDate: '2023-11-01',
      nextMaintenanceDate: '2024-02-01',
      supplier: '厨房设备供应商',
      description: '六头商用燃气灶，日常烹饪使用',
      region: '华北大区',
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400']
    },
    {
      id: '2',
      assetCode: 'AST20231201002',
      assetName: '收银系统',
      category: 'IT设备',
      storeCode: 'HFW001',
      storeName: '好饭碗(国贸店)',
      brand: '商米',
      model: 'SUNMI-T2',
      serialNumber: 'SM202311002',
      purchaseDate: '2023-03-01',
      purchasePrice: 3200,
      currentValue: 2400,
      status: '正常使用',
      condition: '良好',
      location: '收银台',
      responsible: '李收银员',
      warrantyDate: '2024-03-01',
      lastMaintenanceDate: '2023-10-15',
      nextMaintenanceDate: '2024-01-15',
      supplier: 'IT设备供应商',
      description: '智能收银终端，支持多种支付方式',
      region: '华北大区'
    },
    {
      id: '3',
      assetCode: 'AST20231201003',
      assetName: '冷藏冷冻柜',
      category: '厨房设备',
      storeCode: 'HFW002',
      storeName: '好饭碗(三里屯店)',
      brand: '美的',
      model: 'MD-1200L',
      serialNumber: 'MD202311003',
      purchaseDate: '2023-06-20',
      purchasePrice: 15600,
      currentValue: 13000,
      status: '维修中',
      condition: '需维修',
      location: '后厨储存区',
      responsible: '王厨师长',
      warrantyDate: '2025-06-20',
      lastMaintenanceDate: '2023-09-20',
      nextMaintenanceDate: '2023-12-20',
      supplier: '制冷设备公司',
      description: '双门冷藏冷冻柜，温控系统故障',
      region: '华北大区'
    },
    {
      id: '4',
      assetCode: 'AST20231201004',
      assetName: '空调系统',
      category: '空调设备',
      storeCode: 'HFW003',
      storeName: '好饭碗(陆家嘴店)',
      brand: '格力',
      model: 'GREE-VRV',
      serialNumber: 'GR202311004',
      purchaseDate: '2023-01-10',
      purchasePrice: 28000,
      currentValue: 22000,
      status: '正常使用',
      condition: '良好',
      location: '全店',
      responsible: '赵经理',
      warrantyDate: '2026-01-10',
      lastMaintenanceDate: '2023-11-10',
      nextMaintenanceDate: '2024-02-10',
      supplier: '空调工程公司',
      description: '中央空调系统，覆盖全店区域',
      region: '华东大区'
    },
    {
      id: '5',
      assetCode: 'AST20231201005',
      assetName: '监控系统',
      category: '安防设备',
      storeCode: 'HFW004',
      storeName: '好饭碗(天河店)',
      brand: '海康威视',
      model: 'HIK-NVR16',
      serialNumber: 'HIK202311005',
      purchaseDate: '2023-07-01',
      purchasePrice: 8900,
      currentValue: 7500,
      status: '正常使用',
      condition: '良好',
      location: '全店各区域',
      responsible: '陈经理',
      warrantyDate: '2024-07-01',
      lastMaintenanceDate: '2023-10-01',
      nextMaintenanceDate: '2024-01-01',
      supplier: '安防设备公司',
      description: '16路监控系统，覆盖店内外关键区域',
      region: '华南大区'
    }
  ]

  const filteredAssets = mockAssets.filter(asset => {
    const matchesSearch = 
      asset.assetCode.toLowerCase().includes(searchText.toLowerCase()) ||
      asset.assetName.toLowerCase().includes(searchText.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchText.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus
    const matchesStore = selectedStore === 'all' || asset.storeCode === selectedStore
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStore
  })

  const columns: ColumnsType<Asset> = [
    {
      title: '资产信息',
      key: 'assetInfo',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {record.images && record.images[0] ? (
            <Image
              src={record.images[0]}
              alt={record.assetName}
              width={48}
              height={48}
              style={{ objectFit: 'cover', borderRadius: '4px' }}
              preview={false}
            />
          ) : (
            <Avatar 
              size={48} 
              icon={<PropertySafetyOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
          )}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {record.assetName}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.assetCode}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              {record.brand} {record.model}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => {
        const colorMap: Record<string, string> = {
          '厨房设备': 'blue',
          'IT设备': 'green',
          '空调设备': 'orange',
          '安防设备': 'purple'
        }
        return <Tag color={colorMap[category]}>{category}</Tag>
      }
    },
    {
      title: '所属门店',
      key: 'storeInfo',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.storeName}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.storeCode}</div>
        </div>
      )
    },
    {
      title: '当前价值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      width: 100,
      align: 'right',
      render: (value: number, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>¥{value.toLocaleString()}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>
            购入: ¥{record.purchasePrice.toLocaleString()}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record) => {
        const statusConfig: Record<string, { color: string; icon: any }> = {
          '正常使用': { color: 'success', icon: <CheckCircleOutlined /> },
          '维修中': { color: 'warning', icon: <ToolOutlined /> },
          '已报废': { color: 'error', icon: <WarningOutlined /> },
          '闲置': { color: 'default', icon: <ClockCircleOutlined /> }
        }
        const config = statusConfig[status]
        
        // 检查是否临近保修期
        const isWarrantyExpiring = dayjs(record.warrantyDate).diff(dayjs(), 'day') <= 30
        
        return (
          <div>
            <Badge 
              status={config.color as any} 
              icon={config.icon}
              text={status}
            />
            {isWarrantyExpiring && (
              <div style={{ color: '#faad14', fontSize: '12px', marginTop: 2 }}>
                <WarningOutlined /> 保修将到期
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: '责任人',
      dataIndex: 'responsible',
      key: 'responsible',
      width: 100,
      render: (responsible: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {responsible}
        </Space>
      )
    },
    {
      title: '下次保养',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      width: 100,
      render: (date: string) => {
        const isOverdue = dayjs(date).isBefore(dayjs())
        const isUrgent = dayjs(date).diff(dayjs(), 'day') <= 7
        return (
          <div style={{ 
            color: isOverdue ? '#f50' : isUrgent ? '#faad14' : '#666' 
          }}>
            {dayjs(date).format('MM-DD')}
            {isOverdue && <div style={{ fontSize: '12px' }}>已逾期</div>}
            {isUrgent && !isOverdue && <div style={{ fontSize: '12px' }}>即将到期</div>}
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewAsset(record)}
          >
            详情
          </Button>
          <Button
            type="text"
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => handleShowQR(record)}
          >
            二维码
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAsset(record)}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ]

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setDetailDrawerVisible(true)
  }

  const handleShowQR = (asset: Asset) => {
    setSelectedAsset(asset)
    setQrModalVisible(true)
  }

  const handleEditAsset = (asset: Asset) => {
    console.log('编辑资产:', asset)
  }

  const handleCreateAsset = async (values: any) => {
    try {
      console.log('创建资产:', values)
      message.success('资产创建成功')
      setCreateModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('创建失败，请重试')
    }
  }

  // 统计数据
  const stats = {
    totalValue: filteredAssets.reduce((sum, a) => sum + a.currentValue, 0),
    totalCount: filteredAssets.length,
    maintenanceCount: filteredAssets.filter(a => 
      dayjs(a.nextMaintenanceDate).diff(dayjs(), 'day') <= 7
    ).length,
    repairCount: filteredAssets.filter(a => a.status === '维修中').length
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="资产总值"
              value={stats.totalValue}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<PropertySafetyOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="资产总数"
              value={stats.totalCount}
              valueStyle={{ color: '#52c41a' }}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待保养"
              value={stats.maintenanceCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ToolOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="维修中"
              value={stats.repairCount}
              valueStyle={{ color: '#f50' }}
              prefix={<WarningOutlined />}
              suffix="件"
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
                placeholder="搜索资产编号、名称、品牌"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 280 }}
              />
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 120 }}
                placeholder="分类"
              >
                <Option value="all">全部分类</Option>
                <Option value="厨房设备">厨房设备</Option>
                <Option value="IT设备">IT设备</Option>
                <Option value="空调设备">空调设备</Option>
                <Option value="安防设备">安防设备</Option>
              </Select>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 120 }}
                placeholder="状态"
              >
                <Option value="all">全部状态</Option>
                <Option value="正常使用">正常使用</Option>
                <Option value="维修中">维修中</Option>
                <Option value="已报废">已报废</Option>
                <Option value="闲置">闲置</Option>
              </Select>
              <Select
                value={selectedStore}
                onChange={setSelectedStore}
                style={{ width: 150 }}
                placeholder="门店"
              >
                <Option value="all">全部门店</Option>
                <Option value="HFW001">好饭碗(国贸店)</Option>
                <Option value="HFW002">好饭碗(三里屯店)</Option>
                <Option value="HFW003">好饭碗(陆家嘴店)</Option>
                <Option value="HFW004">好饭碗(天河店)</Option>
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
                新增资产
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 资产列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredAssets}
          rowKey="id"
          pagination={{
            total: filteredAssets.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 创建资产模态框 */}
      <Modal
        title="新增资产"
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
          onFinish={handleCreateAsset}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assetName"
                label="资产名称"
                rules={[{ required: true, message: '请输入资产名称' }]}
              >
                <Input placeholder="请输入资产名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="资产分类"
                rules={[{ required: true, message: '请选择资产分类' }]}
              >
                <Select placeholder="请选择资产分类">
                  <Option value="厨房设备">厨房设备</Option>
                  <Option value="IT设备">IT设备</Option>
                  <Option value="空调设备">空调设备</Option>
                  <Option value="安防设备">安防设备</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storeCode"
                label="所属门店"
                rules={[{ required: true, message: '请选择所属门店' }]}
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
                name="responsible"
                label="责任人"
                rules={[{ required: true, message: '请输入责任人' }]}
              >
                <Input placeholder="请输入责任人" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="brand"
                label="品牌"
                rules={[{ required: true, message: '请输入品牌' }]}
              >
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="model"
                label="型号"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="serialNumber"
                label="序列号"
              >
                <Input placeholder="请输入序列号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="purchaseDate"
                label="购买日期"
                rules={[{ required: true, message: '请选择购买日期' }]}
              >
                <DatePicker placeholder="选择购买日期" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="purchasePrice"
                label="购买价格"
                rules={[{ required: true, message: '请输入购买价格' }]}
              >
                <Input placeholder="请输入购买价格" prefix="¥" type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="warrantyDate"
                label="保修期至"
              >
                <DatePicker placeholder="选择保修期" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="存放位置"
                rules={[{ required: true, message: '请输入存放位置' }]}
              >
                <Input placeholder="请输入存放位置" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplier"
                label="供应商"
              >
                <Input placeholder="请输入供应商" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="资产描述"
          >
            <TextArea rows={3} placeholder="请输入资产详细描述" />
          </Form.Item>

          <Form.Item
            name="images"
            label="资产照片"
          >
            <Upload
              multiple
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={5}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 资产详情抽屉 */}
      <Drawer
        title="资产详情"
        width={700}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedAsset && (
          <div>
            {/* 资产图片 */}
            {selectedAsset.images && selectedAsset.images.length > 0 && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Image
                  src={selectedAsset.images[0]}
                  alt={selectedAsset.assetName}
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                />
              </Card>
            )}

            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="资产编号">
                  {selectedAsset.assetCode}
                </Descriptions.Item>
                <Descriptions.Item label="资产名称">
                  {selectedAsset.assetName}
                </Descriptions.Item>
                <Descriptions.Item label="资产分类">
                  <Tag color="blue">{selectedAsset.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="品牌型号">
                  {selectedAsset.brand} {selectedAsset.model}
                </Descriptions.Item>
                <Descriptions.Item label="序列号">
                  {selectedAsset.serialNumber}
                </Descriptions.Item>
                <Descriptions.Item label="所属门店">
                  {selectedAsset.storeName}
                </Descriptions.Item>
                <Descriptions.Item label="存放位置">
                  {selectedAsset.location}
                </Descriptions.Item>
                <Descriptions.Item label="责任人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {selectedAsset.responsible}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="供应商">
                  {selectedAsset.supplier}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Badge 
                    status={selectedAsset.status === '正常使用' ? 'success' : 
                           selectedAsset.status === '维修中' ? 'processing' : 'error'}
                    text={selectedAsset.status}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="资产描述" span={2}>
                  {selectedAsset.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 财务信息 */}
            <Card title="财务信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="购买价格"
                    value={selectedAsset.purchasePrice}
                    precision={0}
                    prefix="¥"
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="当前价值"
                    value={selectedAsset.currentValue}
                    precision={0}
                    prefix="¥"
                    valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="折旧率"
                    value={((selectedAsset.purchasePrice - selectedAsset.currentValue) / selectedAsset.purchasePrice * 100)}
                    precision={1}
                    suffix="%"
                    valueStyle={{ fontSize: '16px', color: '#faad14' }}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <span>购买日期：</span>
                  <span>{selectedAsset.purchaseDate}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span>使用年限：</span>
                  <span>{dayjs().diff(selectedAsset.purchaseDate, 'year')}年</span>
                </div>
              </div>
            </Card>

            {/* 维护信息 */}
            <Card title="维护信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="保修期至">
                  <span style={{
                    color: dayjs(selectedAsset.warrantyDate).isBefore(dayjs().add(30, 'day')) ? '#faad14' : '#666'
                  }}>
                    {selectedAsset.warrantyDate}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="设备状况">
                  {selectedAsset.condition}
                </Descriptions.Item>
                <Descriptions.Item label="上次保养">
                  {selectedAsset.lastMaintenanceDate}
                </Descriptions.Item>
                <Descriptions.Item label="下次保养">
                  <span style={{
                    color: dayjs(selectedAsset.nextMaintenanceDate).diff(dayjs(), 'day') <= 7 ? '#f50' : '#666'
                  }}>
                    {selectedAsset.nextMaintenanceDate}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 维护记录 */}
            <Card title="维护记录" size="small">
              <Timeline size="small">
                <Timeline.Item color="green">
                  <p>设备正常运行检查</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {selectedAsset.lastMaintenanceDate} · 设备维护
                  </p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p>设备安装调试完成</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {dayjs(selectedAsset.purchaseDate).add(7, 'day').format('YYYY-MM-DD')} · 设备安装
                  </p>
                </Timeline.Item>
                <Timeline.Item>
                  <p>设备采购入库</p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {selectedAsset.purchaseDate} · 采购入库
                  </p>
                </Timeline.Item>
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>

      {/* 二维码模态框 */}
      <Modal
        title="资产二维码"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={400}
      >
        {selectedAsset && (
          <div style={{ textAlign: 'center' }}>
            <QRCode
              value={`${selectedAsset.assetCode}|${selectedAsset.assetName}|${selectedAsset.storeCode}`}
              size={200}
            />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 'bold' }}>{selectedAsset.assetName}</div>
              <div style={{ color: '#666', marginTop: 4 }}>{selectedAsset.assetCode}</div>
              <div style={{ color: '#999', fontSize: '12px', marginTop: 4 }}>
                扫描二维码查看资产详情
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AssetList