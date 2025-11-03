/**
 * 工程单列表页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Message,
  Input,
  Select,
  DatePicker,
  Typography,
  Modal
} from '@arco-design/web-react'
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconEye,
  IconSearch
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import { PreparationService } from '../../api'
import {
  ConstructionOrder,
  ConstructionOrderQueryParams,
  ConstructionStatus,
  Supplier
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import ConstructionForm from './ConstructionForm'

const { Title } = Typography
const { RangePicker } = DatePicker

// 工程状态配置
const CONSTRUCTION_STATUS_CONFIG: Record<ConstructionStatus, { text: string; color: string }> = {
  planning: { text: '规划中', color: 'blue' },
  in_progress: { text: '施工中', color: 'orange' },
  acceptance: { text: '验收中', color: 'purple' },
  rectification: { text: '整改中', color: 'red' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'gray' }
}

const ConstructionList: React.FC = () => {
  const navigate = useNavigate()

  // 状态管理
  const [orders, setOrders] = useState<ConstructionOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 筛选条件
  const [filters, setFilters] = useState<ConstructionOrderQueryParams>({})
  const [searchOrderNo, setSearchOrderNo] = useState('')
  const [searchStoreName, setSearchStoreName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ConstructionStatus | undefined>()
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  // 表单弹窗
  const [formVisible, setFormVisible] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ConstructionOrder | null>(null)

  // 加载工程单列表
  const loadOrders = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const params: ConstructionOrderQueryParams = {
        page,
        page_size: pageSize,
        ...filters
      }

      const response = await PreparationService.getConstructionOrders(params)
      setOrders(response.results)
      setPagination({
        current: page,
        pageSize,
        total: response.count
      })
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载工程单列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载供应商列表
  const loadSuppliers = async () => {
    try {
      const response = await PreparationService.getSuppliers()
      setSuppliers(response)
    } catch (error: any) {
      Message.error('加载供应商列表失败')
    }
  }

  // 应用筛选
  const handleSearch = () => {
    const newFilters: ConstructionOrderQueryParams = {}

    if (searchOrderNo) {
      newFilters.order_no = searchOrderNo
    }
    if (searchStoreName) {
      newFilters.store_name = searchStoreName
    }
    if (selectedStatus) {
      newFilters.status = selectedStatus
    }
    if (selectedSupplier) {
      newFilters.supplier_id = selectedSupplier
    }
    if (dateRange && dateRange.length === 2) {
      newFilters.start_date = dateRange[0]
      newFilters.end_date = dateRange[1]
    }

    setFilters(newFilters)
    loadOrders(1, pagination.pageSize)
  }

  // 重置筛选
  const handleReset = () => {
    setSearchOrderNo('')
    setSearchStoreName('')
    setSelectedStatus(undefined)
    setSelectedSupplier(undefined)
    setDateRange(undefined)
    setFilters({})
    loadOrders(1, pagination.pageSize)
  }

  // 打开新建表单
  const handleCreate = () => {
    setEditingOrder(null)
    setFormVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (order: ConstructionOrder) => {
    setEditingOrder(order)
    setFormVisible(true)
  }

  // 查看详情
  const handleViewDetail = (order: ConstructionOrder) => {
    navigate(`/store-preparation/construction/${order.id}`)
  }

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingOrder(null)
    loadOrders(pagination.current, pagination.pageSize)
  }

  // 表格列配置
  const columns = [
    {
      title: '工程单号',
      dataIndex: 'order_no',
      width: 150,
      render: (orderNo: string, record: ConstructionOrder) => (
        <a onClick={() => handleViewDetail(record)}>
          {orderNo}
        </a>
      )
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: ConstructionStatus) => {
        const config = CONSTRUCTION_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      width: 150,
      render: (supplier: Supplier) => supplier?.name || '-'
    },
    {
      title: '开工日期',
      dataIndex: 'construction_start_date',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '预计完工',
      dataIndex: 'construction_end_date',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '实际完工',
      dataIndex: 'actual_end_date',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '里程碑',
      dataIndex: 'milestones',
      width: 100,
      render: (milestones: any[]) => {
        if (!milestones || milestones.length === 0) return '-'
        const completed = milestones.filter(m => m.status === 'completed').length
        return `${completed}/${milestones.length}`
      }
    },
    {
      title: '创建人',
      dataIndex: 'created_by_info',
      width: 120,
      render: (info: any) => info?.full_name || info?.username || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      dataIndex: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: ConstructionOrder) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>

          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <PermissionGuard permission="preparation.construction.edit">
              <Button
                type="text"
                size="small"
                icon={<IconEdit />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </PermissionGuard>
          )}
        </Space>
      )
    }
  ]

  // 分页变化处理
  const handleTableChange = (pagination: any) => {
    loadOrders(pagination.current, pagination.pageSize)
  }

  // 初始加载
  useEffect(() => {
    loadOrders()
    loadSuppliers()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        {/* 页面标题和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title heading={3}>工程管理</Title>
          <Space>
            <PermissionGuard permission="preparation.construction.create">
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={handleCreate}
              >
                新建工程单
              </Button>
            </PermissionGuard>
            <Button
              icon={<IconRefresh />}
              onClick={() => loadOrders(pagination.current, pagination.pageSize)}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 筛选条件 */}
        <div style={{ marginBottom: '20px' }}>
          <Space wrap>
            <Input
              style={{ width: 150 }}
              placeholder="工程单号"
              value={searchOrderNo}
              onChange={setSearchOrderNo}
              allowClear
            />
            <Input
              style={{ width: 200 }}
              placeholder="门店名称"
              value={searchStoreName}
              onChange={setSearchStoreName}
              allowClear
            />
            <Select
              style={{ width: 120 }}
              placeholder="工程状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Select.Option value="planning">规划中</Select.Option>
              <Select.Option value="in_progress">施工中</Select.Option>
              <Select.Option value="acceptance">验收中</Select.Option>
              <Select.Option value="rectification">整改中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="供应商"
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              allowClear
            >
              {suppliers.map(supplier => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              style={{ width: 260 }}
              placeholder={['开始日期', '结束日期']}
              onChange={(dateStrings) => setDateRange(dateStrings as [string, string])}
            />
            <Button
              type="primary"
              icon={<IconSearch />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        {/* 工程单列表表格 */}
        <Table
          columns={columns}
          data={orders}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: true,
            showJumper: true,
            sizeCanChange: true
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 新建/编辑表单弹窗 */}
      <Modal
        title={editingOrder ? '编辑工程单' : '新建工程单'}
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <ConstructionForm
          order={editingOrder}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormVisible(false)}
        />
      </Modal>
    </div>
  )
}

export default ConstructionList
