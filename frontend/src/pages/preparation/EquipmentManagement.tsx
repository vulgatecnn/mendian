import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Form,
  Modal,
  message,
  Tooltip,
  Progress,
  Tag,
  Badge,
  Row,
  Col,
  Statistic,
  Typography,
  Dropdown,
  Popconfirm,
  InputNumber,
  Upload,
  Image,
  Divider,
  Timeline,
  Rate,
  Alert,
  Steps,
  List
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  SafetyOutlined,
  HomeOutlined,
  LaptopOutlined,
  BulbOutlined,
  StarOutlined,
  MoreOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import PageContainer from '@/components/common/PageContainer'
import { usePreparationStore } from '@/stores/preparationStore'
import type {
  EquipmentProcurement,
  EquipmentStatusType,
  EquipmentCategoryType,
  Priority,
  EquipmentProcurementFilters
} from '@/constants/colors'

const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select
const { Text, Title } = Typography
const { Step } = Steps

// 设备状态选项配置
const STATUS_OPTIONS = [
  { value: 'PENDING', label: '待采购', color: '#d9d9d9' },
  { value: 'QUOTED', label: '已报价', color: '#1890ff' },
  { value: 'APPROVED', label: '已批准', color: '#52c41a' },
  { value: 'ORDERED', label: '已下单', color: '#faad14' },
  { value: 'DELIVERED', label: '已交付', color: '#13c2c2' },
  { value: 'INSTALLED', label: '已安装', color: '#722ed1' },
  { value: 'ACCEPTED', label: '已验收', color: '#389e0d' },
  { value: 'WARRANTY', label: '保修期', color: '#fa8c16' },
  { value: 'MAINTENANCE', label: '维护中', color: '#eb2f96' },
]

const CATEGORY_OPTIONS = [
  { value: 'KITCHEN', label: '厨房设备', icon: <ToolOutlined />, color: '#ff7875' },
  { value: 'DINING', label: '餐厅设备', icon: <HomeOutlined />, color: '#ffa940' },
  { value: 'COOLING', label: '制冷设备', icon: <StarOutlined />, color: '#40a9ff' },
  { value: 'CLEANING', label: '清洁设备', icon: <SafetyOutlined />, color: '#73d13d' },
  { value: 'SAFETY', label: '安全设备', icon: <SafetyOutlined />, color: '#f759ab' },
  { value: 'FURNITURE', label: '家具设备', icon: <HomeOutlined />, color: '#d3adf7' },
  { value: 'TECHNOLOGY', label: '技术设备', icon: <LaptopOutlined />, color: '#91d5ff' },
  { value: 'DECORATION', label: '装饰设备', icon: <BulbOutlined />, color: '#ffec3d' },
  { value: 'OTHER', label: '其他设备', icon: <MoreOutlined />, color: '#d9d9d9' },
]

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: '紧急', color: '#ff4d4f' },
  { value: 'HIGH', label: '高', color: '#fa8c16' },
  { value: 'MEDIUM', label: '中', color: '#1890ff' },
  { value: 'LOW', label: '低', color: '#52c41a' },
]

// 状态徽章组件
const StatusBadge: React.FC<{ status: EquipmentStatusType }> = ({ status }) => {
  const option = STATUS_OPTIONS.find(opt => opt.value === status)
  return (
    <Badge
      color={option?.color}
      text={option?.label || status}
    />
  )
}

// 设备类别标签组件
const CategoryTag: React.FC<{ category: EquipmentCategoryType }> = ({ category }) => {
  const option = CATEGORY_OPTIONS.find(opt => opt.value === category)
  return (
    <Tag icon={option?.icon} color={option?.color} style={{ margin: 0 }}>
      {option?.label || category}
    </Tag>
  )
}

// 优先级标签组件
const PriorityTag: React.FC<{ priority: Priority }> = ({ priority }) => {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === priority)
  return (
    <Tag color={option?.color} style={{ margin: 0 }}>
      {option?.label || priority}
    </Tag>
  )
}

// 设备详情弹窗组件
const EquipmentDetailModal: React.FC<{
  visible: boolean
  equipment: EquipmentProcurement | null
  onClose: () => void
}> = ({ visible, equipment, onClose }) => {
  const getStatusSteps = (status: EquipmentStatusType) => {
    const statusMap: Record<EquipmentStatusType, number> = {
      'PENDING': 0,
      'QUOTED': 1,
      'APPROVED': 2,
      'ORDERED': 3,
      'DELIVERED': 4,
      'INSTALLED': 5,
      'ACCEPTED': 6,
      'WARRANTY': 7,
      'MAINTENANCE': 7,
    }
    return statusMap[status] || 0
  }

  if (!equipment) return null

  return (
    <Modal
      title={`设备详情 - ${equipment.equipmentName}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      {/* 采购流程步骤 */}
      <Card title="采购流程" size="small" style={{ marginBottom: 16 }}>
        <Steps
          current={getStatusSteps(equipment.status)}
          size="small"
          items={[
            { title: '待采购', description: '需求确认' },
            { title: '已报价', description: '获取报价' },
            { title: '已批准', description: '采购批准' },
            { title: '已下单', description: '订单确认' },
            { title: '已交付', description: '设备到货' },
            { title: '已安装', description: '安装完成' },
            { title: '已验收', description: '验收通过' },
            { title: '保修/维护', description: '售后服务' },
          ]}
        />
      </Card>

      <Row gutter={16}>
        {/* 基本信息 */}
        <Col span={12}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <div style={{ lineHeight: '28px' }}>
              <Text strong>采购编号：</Text>
              <Text copyable>{equipment.procurementCode}</Text>
              <br />
              <Text strong>设备名称：</Text>
              <Text>{equipment.equipmentName}</Text>
              <br />
              <Text strong>设备类别：</Text>
              <CategoryTag category={equipment.category} />
              <br />
              <Text strong>品牌型号：</Text>
              <Text>{equipment.brand} {equipment.model}</Text>
              <br />
              <Text strong>采购数量：</Text>
              <Text>{equipment.quantity} 台/套</Text>
              <br />
              <Text strong>优先级：</Text>
              <PriorityTag priority={equipment.priority} />
              <br />
              <Text strong>当前状态：</Text>
              <StatusBadge status={equipment.status} />
            </div>
          </Card>
        </Col>

        {/* 价格信息 */}
        <Col span={12}>
          <Card title="价格信息" size="small" style={{ marginBottom: 16 }}>
            <div style={{ lineHeight: '28px' }}>
              <Text strong>单价：</Text>
              <Text>{equipment.unitPrice ? `¥${equipment.unitPrice.toLocaleString()}` : '待确定'}</Text>
              <br />
              <Text strong>总价：</Text>
              <Text style={{ fontSize: 16, color: '#fa541c' }}>
                ¥{equipment.totalPrice ? equipment.totalPrice.toLocaleString() : '待确定'}
              </Text>
              <br />
              <Text strong>币种：</Text>
              <Text>{equipment.currency}</Text>
              <br />
              <Text strong>供应商：</Text>
              <Text>{equipment.supplier || '待确定'}</Text>
              <br />
              <Text strong>联系方式：</Text>
              <Text>{equipment.supplierContact || '待确定'}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 时间信息 */}
      <Card title="时间信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>计划交付：</Text>
            <div>{equipment.plannedDeliveryDate ? dayjs(equipment.plannedDeliveryDate).format('YYYY-MM-DD') : '待确定'}</div>
          </Col>
          <Col span={8}>
            <Text strong>实际交付：</Text>
            <div style={{ color: equipment.actualDeliveryDate ? '#52c41a' : '#d9d9d9' }}>
              {equipment.actualDeliveryDate ? dayjs(equipment.actualDeliveryDate).format('YYYY-MM-DD') : '未交付'}
            </div>
          </Col>
          <Col span={8}>
            <Text strong>安装日期：</Text>
            <div style={{ color: equipment.installationDate ? '#52c41a' : '#d9d9d9' }}>
              {equipment.installationDate ? dayjs(equipment.installationDate).format('YYYY-MM-DD') : '未安装'}
            </div>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col span={8}>
            <Text strong>验收日期：</Text>
            <div style={{ color: equipment.acceptanceDate ? '#52c41a' : '#d9d9d9' }}>
              {equipment.acceptanceDate ? dayjs(equipment.acceptanceDate).format('YYYY-MM-DD') : '未验收'}
            </div>
          </Col>
          <Col span={8}>
            <Text strong>保修期：</Text>
            <div>{equipment.warrantyPeriod ? `${equipment.warrantyPeriod}个月` : '待确定'}</div>
          </Col>
          <Col span={8}>
            <Text strong>保修到期：</Text>
            <div style={{ color: equipment.warrantyExpiry ? '#fa541c' : '#d9d9d9' }}>
              {equipment.warrantyExpiry ? dayjs(equipment.warrantyExpiry).format('YYYY-MM-DD') : '待确定'}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 规格参数 */}
      {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
        <Card title="规格参数" size="small" style={{ marginBottom: 16 }}>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {Object.entries(equipment.specifications).map(([key, value]) => (
              <div key={key} style={{ lineHeight: '24px', borderBottom: '1px solid #f0f0f0', padding: '4px 0' }}>
                <Text strong>{key}：</Text>
                <Text>{String(value)}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 安装和维护信息 */}
      <Row gutter={16}>
        <Col span={12}>
          {equipment.installationRequirements && (
            <Card title="安装要求" size="small" style={{ marginBottom: 16 }}>
              <Text>{equipment.installationRequirements}</Text>
            </Card>
          )}
        </Col>
        <Col span={12}>
          {equipment.maintenanceSchedule && (
            <Card title="维护计划" size="small" style={{ marginBottom: 16 }}>
              <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                {Object.entries(equipment.maintenanceSchedule).map(([key, value]) => (
                  <div key={key} style={{ lineHeight: '24px' }}>
                    <Text strong>{key}：</Text>
                    <Text>{String(value)}</Text>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* 设备照片 */}
      {equipment.photos && equipment.photos.length > 0 && (
        <Card title="设备照片" size="small" style={{ marginBottom: 16 }}>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {equipment.photos.map((photo, index) => (
                <Image
                  key={index}
                  width={100}
                  height={100}
                  src={photo}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </div>
          </Image.PreviewGroup>
        </Card>
      )}

      {/* 相关文档 */}
      {equipment.documents && equipment.documents.length > 0 && (
        <Card title="相关文档" size="small" style={{ marginBottom: 16 }}>
          <List
            size="small"
            dataSource={equipment.documents}
            renderItem={(doc, index) => (
              <List.Item
                actions={[
                  <Button 
                    key="download" 
                    type="link" 
                    size="small" 
                    icon={<DownloadOutlined />}
                    onClick={() => window.open(doc, '_blank')}
                  >
                    下载
                  </Button>
                ]}
              >
                <Text>文档 {index + 1}</Text>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 备注信息 */}
      {equipment.notes && (
        <Card title="备注信息" size="small">
          <Text>{equipment.notes}</Text>
        </Card>
      )}
    </Modal>
  )
}

const EquipmentManagement: React.FC = () => {
  const navigate = useNavigate()
  
  // Store状态 - 这里需要从准备store中获取设备相关的状态和方法
  const {
    equipmentList,
    selectedEquipmentIds,
    equipmentFilters,
    equipmentPagination,
    isLoading,
    
    // 方法
    fetchEquipmentList,
    setSelectedEquipmentIds,
    setEquipmentFilters,
    setEquipmentPagination,
    deleteEquipment,
    updateEquipmentStatus,
    clearAllSelections
  } = usePreparationStore()

  // 本地状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [quickStatusFilter, setQuickStatusFilter] = useState<EquipmentStatusType | undefined>()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentProcurement | null>(null)
  
  // 初始化数据
  useEffect(() => {
    fetchEquipmentList()
  }, [fetchEquipmentList])

  // 搜索处理
  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword)
    const newFilters = { ...equipmentFilters, keyword, page: 1 }
    setEquipmentFilters(newFilters)
    fetchEquipmentList(newFilters)
  }, [equipmentFilters, setEquipmentFilters, fetchEquipmentList])

  // 快速状态筛选
  const handleQuickStatusFilter = useCallback((status?: EquipmentStatusType) => {
    setQuickStatusFilter(status)
    const newFilters = { ...equipmentFilters, status, page: 1 }
    setEquipmentFilters(newFilters)
    fetchEquipmentList(newFilters)
  }, [equipmentFilters, setEquipmentFilters, fetchEquipmentList])

  // 分页处理
  const handleTableChange: TableProps<EquipmentProcurement>['onChange'] = useCallback((pagination) => {
    const newPagination = {
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 20
    }
    setEquipmentPagination(newPagination)
    
    const newFilters = {
      ...equipmentFilters,
      page: newPagination.current,
      limit: newPagination.pageSize
    }
    fetchEquipmentList(newFilters)
  }, [equipmentFilters, setEquipmentPagination, fetchEquipmentList])

  // 选择处理
  const rowSelection: TableProps<EquipmentProcurement>['rowSelection'] = {
    selectedRowKeys: selectedEquipmentIds,
    onChange: (selectedKeys) => {
      setSelectedEquipmentIds(selectedKeys as string[])
    },
  }

  // 状态变更处理
  const handleStatusChange = useCallback(async (record: EquipmentProcurement, status: EquipmentStatusType) => {
    await updateEquipmentStatus(record.id, status)
  }, [updateEquipmentStatus])

  // 删除处理
  const handleDelete = useCallback(async (record: EquipmentProcurement) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除设备"${record.equipmentName}"吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        await deleteEquipment(record.id)
      }
    })
  }, [deleteEquipment])

  // 查看详情
  const handleViewDetail = useCallback((record: EquipmentProcurement) => {
    setSelectedEquipment(record)
    setDetailModalVisible(true)
  }, [])

  // 表格列配置
  const columns: ColumnsType<EquipmentProcurement> = useMemo(() => [
    {
      title: '设备信息',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 280,
      fixed: 'left',
      render: (text: string, record: EquipmentProcurement) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', fontWeight: 500 }}
              onClick={() => handleViewDetail(record)}
            >
              {text}
            </Button>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
            编号：{record.procurementCode}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            品牌：{record.brand} {record.model}
          </div>
          <div style={{ marginTop: 4 }}>
            <CategoryTag category={record.category} />
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EquipmentStatusType, record) => (
        <Dropdown
          menu={{
            items: STATUS_OPTIONS.map(opt => ({
              key: opt.value,
              label: <StatusBadge status={opt.value as EquipmentStatusType} />,
              onClick: () => handleStatusChange(record, opt.value as EquipmentStatusType),
              disabled: opt.value === status
            }))
          }}
          trigger={['click']}
        >
          <div style={{ cursor: 'pointer' }}>
            <StatusBadge status={status} />
          </div>
        </Dropdown>
      ),
    },
    {
      title: '数量/单价',
      key: 'quantity',
      width: 120,
      render: (_, record: EquipmentProcurement) => (
        <div>
          <div style={{ fontSize: 13 }}>
            数量：{record.quantity} 台
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            单价：{record.unitPrice ? `¥${(record.unitPrice/10000).toFixed(1)}万` : '待确定'}
          </div>
        </div>
      ),
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      render: (price: number) => (
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: '#fa541c' }}>
            {price ? `¥${(price/10000).toFixed(1)}万` : '待确定'}
          </Text>
        </div>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
      render: (supplier: string, record) => (
        <div>
          <div style={{ fontSize: 13 }}>
            {supplier || '待确定'}
          </div>
          {record.supplierContact && (
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.supplierContact}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '交付时间',
      key: 'deliveryTime',
      width: 150,
      render: (_, record: EquipmentProcurement) => (
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>
            计划：{record.plannedDeliveryDate ? dayjs(record.plannedDeliveryDate).format('MM/DD') : '待定'}
          </div>
          {record.actualDeliveryDate && (
            <div style={{ fontSize: 12, color: '#52c41a' }}>
              实际：{dayjs(record.actualDeliveryDate).format('MM/DD')}
            </div>
          )}
          {record.installationDate && (
            <div style={{ fontSize: 12, color: '#1890ff' }}>
              安装：{dayjs(record.installationDate).format('MM/DD')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '保修期',
      key: 'warranty',
      width: 120,
      render: (_, record: EquipmentProcurement) => (
        <div>
          <div style={{ fontSize: 13 }}>
            {record.warrantyPeriod ? `${record.warrantyPeriod}个月` : '待确定'}
          </div>
          {record.warrantyExpiry && (
            <div style={{ 
              fontSize: 12, 
              color: dayjs().isAfter(record.warrantyExpiry) ? '#ff4d4f' : '#52c41a' 
            }}>
              至：{dayjs(record.warrantyExpiry).format('MM/DD')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: Priority) => <PriorityTag priority={priority} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: EquipmentProcurement) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/preparation/equipment/${record.id}/edit`)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'status',
                  label: '更改状态',
                  children: STATUS_OPTIONS.map(opt => ({
                    key: `status-${opt.value}`,
                    label: <StatusBadge status={opt.value as EquipmentStatusType} />,
                    onClick: () => handleStatusChange(record, opt.value as EquipmentStatusType),
                    disabled: opt.value === record.status
                  }))
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  label: <Text type="danger">删除</Text>,
                  onClick: () => handleDelete(record)
                }
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ], [navigate, handleStatusChange, handleDelete, handleViewDetail])

  return (
    <PageContainer
      title="设备采购管理"
      breadcrumb={{
        routes: [
          { path: '/', breadcrumbName: '首页' },
          { path: '/preparation', breadcrumbName: '开店筹备' },
          { path: '/preparation/equipment', breadcrumbName: '设备采购' },
        ]
      }}
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总设备数"
              value={equipmentPagination.total}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待采购"
              value={equipmentList.filter(e => e.status === 'PENDING').length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已交付"
              value={equipmentList.filter(e => e.status === 'DELIVERED').length}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已验收"
              value={equipmentList.filter(e => e.status === 'ACCEPTED').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索设备名称、编号、品牌"
                allowClear
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 300 }}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                value={quickStatusFilter}
                onChange={handleQuickStatusFilter}
                style={{ width: 150 }}
              >
                {STATUS_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    <StatusBadge status={option.value as EquipmentStatusType} />
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="设备类别"
                allowClear
                style={{ width: 150 }}
              >
                {CATEGORY_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    <CategoryTag category={option.value as EquipmentCategoryType} />
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col flex="none">
            <Space>
              {selectedEquipmentIds.length > 0 && (
                <>
                  <Text type="secondary">
                    已选择 {selectedEquipmentIds.length} 项
                  </Text>
                  <Button onClick={clearAllSelections}>取消选择</Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/preparation/equipment/create')}
              >
                新建采购
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => message.info('筛选功能开发中')}
              >
                筛选
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => message.info('导出功能开发中')}
              >
                导出
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchEquipmentList()}
                loading={isLoading}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 表格 */}
        <Table<EquipmentProcurement>
          rowKey="id"
          columns={columns}
          dataSource={equipmentList}
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{
            current: equipmentPagination.current,
            pageSize: equipmentPagination.pageSize,
            total: equipmentPagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1400 }}
          onChange={handleTableChange}
          size="small"
        />
      </Card>

      {/* 设备详情弹窗 */}
      <EquipmentDetailModal
        visible={detailModalVisible}
        equipment={selectedEquipment}
        onClose={() => {
          setDetailModalVisible(false)
          setSelectedEquipment(null)
        }}
      />
    </PageContainer>
  )
}

export default EquipmentManagement