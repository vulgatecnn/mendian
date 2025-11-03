/**
 * 交付清单列表页面
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
  DeliveryChecklist,
  DeliveryChecklistQueryParams,
  DeliveryStatus
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import DeliveryForm from './DeliveryForm'

const { Title } = Typography
const { RangePicker } = DatePicker

// 交付状态配置
const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, { text: string; color: string }> = {
  preparing: { text: '准备中', color: 'blue' },
  in_progress: { text: '进行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' }
}

const DeliveryList: React.FC = () => {
  const navigate = useNavigate()

  // 状态管理
  const [checklists, setChecklists] = useState<DeliveryChecklist[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 筛选条件
  const [filters, setFilters] = useState<DeliveryChecklistQueryParams>({})
  const [searchChecklistNo, setSearchChecklistNo] = useState('')
  const [searchStoreName, setSearchStoreName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  // 表单弹窗
  const [formVisible, setFormVisible] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<DeliveryChecklist | null>(null)

  // 加载交付清单列表
  const loadChecklists = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const params: DeliveryChecklistQueryParams = {
        page,
        page_size: pageSize,
        ...filters
      }

      const response = await PreparationService.getDeliveryChecklists(params)
      setChecklists(response.results)
      setPagination({
        current: page,
        pageSize,
        total: response.count
      })
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载交付清单列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 应用筛选
  const handleSearch = () => {
    const newFilters: DeliveryChecklistQueryParams = {}

    if (searchChecklistNo) {
      newFilters.checklist_no = searchChecklistNo
    }
    if (searchStoreName) {
      newFilters.store_name = searchStoreName
    }
    if (selectedStatus) {
      newFilters.status = selectedStatus
    }
    if (dateRange && dateRange.length === 2) {
      newFilters.start_date = dateRange[0]
      newFilters.end_date = dateRange[1]
    }

    setFilters(newFilters)
    loadChecklists(1, pagination.pageSize)
  }

  // 重置筛选
  const handleReset = () => {
    setSearchChecklistNo('')
    setSearchStoreName('')
    setSelectedStatus(undefined)
    setDateRange(undefined)
    setFilters({})
    loadChecklists(1, pagination.pageSize)
  }

  // 打开新建表单
  const handleCreate = () => {
    setEditingChecklist(null)
    setFormVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (checklist: DeliveryChecklist) => {
    setEditingChecklist(checklist)
    setFormVisible(true)
  }

  // 查看详情
  const handleViewDetail = (checklist: DeliveryChecklist) => {
    navigate(`/store-preparation/delivery/${checklist.id}`)
  }

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingChecklist(null)
    loadChecklists(pagination.current, pagination.pageSize)
  }

  // 计算完成进度
  const calculateProgress = (checklist: DeliveryChecklist) => {
    if (!checklist.delivery_items || checklist.delivery_items.length === 0) {
      return 0
    }
    const completed = checklist.delivery_items.filter(item => item.is_completed).length
    return Math.round((completed / checklist.delivery_items.length) * 100)
  }

  // 表格列配置
  const columns = [
    {
      title: '清单编号',
      dataIndex: 'checklist_no',
      width: 150,
      render: (checklistNo: string, record: DeliveryChecklist) => (
        <a onClick={() => handleViewDetail(record)}>
          {checklistNo}
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
      render: (status: DeliveryStatus) => {
        const config = DELIVERY_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '交付项进度',
      dataIndex: 'delivery_items',
      width: 150,
      render: (_: any, record: DeliveryChecklist) => {
        const progress = calculateProgress(record)
        const completed = record.delivery_items?.filter(item => item.is_completed).length || 0
        const total = record.delivery_items?.length || 0
        return (
          <Space>
            <span>{completed}/{total}</span>
            <Tag color={progress === 100 ? 'green' : 'blue'}>{progress}%</Tag>
          </Space>
        )
      }
    },
    {
      title: '交付文档',
      dataIndex: 'documents',
      width: 100,
      render: (documents: any[]) => documents?.length || 0
    },
    {
      title: '交付日期',
      dataIndex: 'delivery_date',
      width: 120,
      render: (date: string) => date || '-'
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
      render: (_: any, record: DeliveryChecklist) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>

          {record.status !== 'completed' && (
            <PermissionGuard permission="preparation.delivery.edit">
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
    loadChecklists(pagination.current, pagination.pageSize)
  }

  // 初始加载
  useEffect(() => {
    loadChecklists()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        {/* 页面标题和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title heading={3}>交付管理</Title>
          <Space>
            <PermissionGuard permission="preparation.delivery.create">
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={handleCreate}
              >
                新建交付清单
              </Button>
            </PermissionGuard>
            <Button
              icon={<IconRefresh />}
              onClick={() => loadChecklists(pagination.current, pagination.pageSize)}
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
              placeholder="清单编号"
              value={searchChecklistNo}
              onChange={setSearchChecklistNo}
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
              placeholder="交付状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Select.Option value="preparing">准备中</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
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

        {/* 交付清单列表表格 */}
        <Table
          columns={columns}
          data={checklists}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: true,
            showJumper: true,
            sizeCanChange: true
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 新建/编辑表单弹窗 */}
      <Modal
        title={editingChecklist ? '编辑交付清单' : '新建交付清单'}
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <DeliveryForm
          checklist={editingChecklist}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormVisible(false)}
        />
      </Modal>
    </div>
  )
}

export default DeliveryList
