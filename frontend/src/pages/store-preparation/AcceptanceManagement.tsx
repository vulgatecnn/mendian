/**
 * 验收管理页面
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
  Modal,
  Descriptions
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconEye,
  IconCheck,
  IconSearch
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import { PreparationService } from '../../api'
import {
  ConstructionOrder,
  ConstructionOrderQueryParams,
  ConstructionStatus,
  AcceptanceResult
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import AcceptanceForm from './AcceptanceForm'

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

// 验收结果配置
const ACCEPTANCE_RESULT_CONFIG: Record<AcceptanceResult, { text: string; color: string }> = {
  passed: { text: '通过', color: 'green' },
  failed: { text: '不通过', color: 'red' },
  conditional: { text: '有条件通过', color: 'orange' }
}

const AcceptanceManagement: React.FC = () => {
  const navigate = useNavigate()

  // 状态管理
  const [orders, setOrders] = useState<ConstructionOrder[]>([])
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
  const [selectedResult, setSelectedResult] = useState<AcceptanceResult | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  // 表单弹窗
  const [acceptanceVisible, setAcceptanceVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ConstructionOrder | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)

  // 加载工程单列表（只显示需要验收或已验收的）
  const loadOrders = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const params: ConstructionOrderQueryParams = {
        page,
        page_size: pageSize,
        ...filters
      }

      // 如果没有指定状态筛选，则只显示需要验收的工程单
      if (!filters.status) {
        // 可以通过多次请求或者后端支持多状态查询来实现
        // 这里先使用单一状态查询，实际使用时可能需要调整
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
    if (selectedResult) {
      newFilters.acceptance_result = selectedResult
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
    setSelectedResult(undefined)
    setDateRange(undefined)
    setFilters({})
    loadOrders(1, pagination.pageSize)
  }

  // 查看工程详情
  const handleViewDetail = (order: ConstructionOrder) => {
    setSelectedOrder(order)
    setDetailVisible(true)
  }

  // 执行验收
  const handleAcceptance = (order: ConstructionOrder) => {
    setSelectedOrder(order)
    setAcceptanceVisible(true)
  }

  // 验收成功回调
  const handleAcceptanceSuccess = () => {
    setAcceptanceVisible(false)
    setSelectedOrder(null)
    loadOrders(pagination.current, pagination.pageSize)
  }

  // 跳转到工程详情页面
  const handleGoToDetail = (order: ConstructionOrder) => {
    navigate(`/store-preparation/construction/${order.id}`)
  }

  // 表格列配置
  const columns = [
    {
      title: '工程单号',
      dataIndex: 'order_no',
      width: 150,
      render: (orderNo: string, record: ConstructionOrder) => (
        <a onClick={() => handleGoToDetail(record)}>
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
      title: '工程状态',
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
      render: (supplier: any) => supplier?.name || '-'
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
      title: '验收日期',
      dataIndex: 'acceptance_date',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '验收结果',
      dataIndex: 'acceptance_result',
      width: 120,
      render: (result: AcceptanceResult) => {
        if (!result) return '-'
        const config = ACCEPTANCE_RESULT_CONFIG[result]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '整改项',
      dataIndex: 'rectification_items',
      width: 100,
      render: (items: any[]) => {
        if (!items || items.length === 0) return '-'
        const completed = items.filter(item => item.status === 'completed').length
        return `${completed}/${items.length}`
      }
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

          {(record.status === 'in_progress' || record.status === 'acceptance') && (
            <PermissionGuard permission="preparation.construction.acceptance">
              <Button
                type="text"
                size="small"
                icon={<IconCheck />}
                onClick={() => handleAcceptance(record)}
              >
                验收
              </Button>
            </PermissionGuard>
          )}

          <Button
            type="text"
            size="small"
            onClick={() => handleGoToDetail(record)}
          >
            详情
          </Button>
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
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        {/* 页面标题和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title heading={3}>验收管理</Title>
          <Space>
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
              <Select.Option value="in_progress">施工中</Select.Option>
              <Select.Option value="acceptance">验收中</Select.Option>
              <Select.Option value="rectification">整改中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder="验收结果"
              value={selectedResult}
              onChange={setSelectedResult}
              allowClear
            >
              <Select.Option value="passed">通过</Select.Option>
              <Select.Option value="conditional">有条件通过</Select.Option>
              <Select.Option value="failed">不通过</Select.Option>
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
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 验收表单弹窗 */}
      <Modal
        title="执行验收"
        visible={acceptanceVisible}
        onCancel={() => setAcceptanceVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        {selectedOrder && (
          <AcceptanceForm
            constructionOrderId={selectedOrder.id}
            onSuccess={handleAcceptanceSuccess}
            onCancel={() => setAcceptanceVisible(false)}
          />
        )}
      </Modal>

      {/* 工程详情弹窗 */}
      <Modal
        title="工程详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setDetailVisible(false)}>关闭</Button>
            <Button 
              type="primary" 
              onClick={() => selectedOrder && handleGoToDetail(selectedOrder)}
            >
              查看完整详情
            </Button>
          </Space>
        }
        style={{ width: 800 }}
      >
        {selectedOrder && (
          <Descriptions
            column={2}
            data={[
              {
                label: '工程单号',
                value: selectedOrder.order_no
              },
              {
                label: '门店名称',
                value: selectedOrder.store_name
              },
              {
                label: '工程状态',
                value: (
                  <Tag color={CONSTRUCTION_STATUS_CONFIG[selectedOrder.status].color}>
                    {CONSTRUCTION_STATUS_CONFIG[selectedOrder.status].text}
                  </Tag>
                )
              },
              {
                label: '施工供应商',
                value: selectedOrder.supplier?.name || '-'
              },
              {
                label: '开工日期',
                value: selectedOrder.construction_start_date || '-'
              },
              {
                label: '预计完工',
                value: selectedOrder.construction_end_date || '-'
              },
              {
                label: '实际完工',
                value: selectedOrder.actual_end_date || '-'
              },
              {
                label: '验收日期',
                value: selectedOrder.acceptance_date || '-'
              },
              {
                label: '验收结果',
                value: selectedOrder.acceptance_result ? (
                  <Tag color={ACCEPTANCE_RESULT_CONFIG[selectedOrder.acceptance_result].color}>
                    {ACCEPTANCE_RESULT_CONFIG[selectedOrder.acceptance_result].text}
                  </Tag>
                ) : '-'
              },
              {
                label: '里程碑进度',
                value: selectedOrder.milestones ? (
                  `${selectedOrder.milestones.filter(m => m.status === 'completed').length}/${selectedOrder.milestones.length}`
                ) : '-'
              },
              {
                label: '整改项',
                value: selectedOrder.rectification_items ? (
                  `${selectedOrder.rectification_items.filter(item => item.status === 'completed').length}/${selectedOrder.rectification_items.length}`
                ) : '-'
              },
              {
                label: '创建人',
                value: selectedOrder.created_by_info?.full_name || '-'
              }
            ]}
          />
        )}
      </Modal>
    </div>
  )
}

export default AcceptanceManagement