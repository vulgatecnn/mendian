/**
 * 里程碑管理页面
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
  Progress,
  Timeline,
  Descriptions
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconEye,
  IconEdit,
  IconSearch
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import { PreparationService } from '../../api'
import {
  ConstructionOrder,
  ConstructionOrderQueryParams,
  ConstructionStatus,
  Milestone,
  MilestoneStatus
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import MilestoneManager from './MilestoneManager'

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

// 里程碑状态配置
const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { text: string; color: string }> = {
  pending: { text: '待开始', color: 'gray' },
  in_progress: { text: '进行中', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
  delayed: { text: '已延期', color: 'red' }
}

const MilestoneManagement: React.FC = () => {
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
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  // 弹窗状态
  const [milestoneVisible, setMilestoneVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ConstructionOrder | null>(null)

  // 加载工程单列表（只显示有里程碑管理需求的）
  const loadOrders = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const params: ConstructionOrderQueryParams = {
        page,
        page_size: pageSize,
        ...filters
      }

      // 如果没有指定状态筛选，则只显示需要里程碑管理的工程单
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
    setDateRange(undefined)
    setFilters({})
    loadOrders(1, pagination.pageSize)
  }

  // 查看里程碑详情
  const handleViewMilestones = (order: ConstructionOrder) => {
    setSelectedOrder(order)
    setDetailVisible(true)
  }

  // 管理里程碑
  const handleManageMilestones = (order: ConstructionOrder) => {
    setSelectedOrder(order)
    setMilestoneVisible(true)
  }

  // 里程碑更新回调
  const handleMilestoneUpdate = () => {
    loadOrders(pagination.current, pagination.pageSize)
  }

  // 跳转到工程详情页面
  const handleGoToDetail = (order: ConstructionOrder) => {
    navigate(`/store-preparation/construction/${order.id}`)
  }

  // 计算里程碑进度
  const calculateMilestoneProgress = (milestones: Milestone[]) => {
    if (!milestones || milestones.length === 0) return 0
    const completed = milestones.filter(m => m.status === 'completed').length
    return Math.round((completed / milestones.length) * 100)
  }

  // 获取里程碑状态统计
  const getMilestoneStatusStats = (milestones: Milestone[]) => {
    if (!milestones || milestones.length === 0) {
      return { total: 0, completed: 0, pending: 0, delayed: 0 }
    }
    
    return {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      pending: milestones.filter(m => m.status === 'pending').length,
      delayed: milestones.filter(m => m.status === 'delayed').length
    }
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
      title: '里程碑进度',
      dataIndex: 'milestones',
      width: 200,
      render: (milestones: Milestone[]) => {
        const progress = calculateMilestoneProgress(milestones)
        const stats = getMilestoneStatusStats(milestones)
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Progress percent={progress} size="small" />
            <div style={{ fontSize: '12px', color: '#86909c' }}>
              {stats.completed}/{stats.total} 已完成
              {stats.delayed > 0 && (
                <Tag color="red" size="small" style={{ marginLeft: '4px' }}>
                  {stats.delayed} 延期
                </Tag>
              )}
            </div>
          </Space>
        )
      }
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
      title: '供应商',
      dataIndex: 'supplier',
      width: 150,
      render: (supplier: any) => supplier?.name || '-'
    },
    {
      title: '创建人',
      dataIndex: 'created_by_info',
      width: 120,
      render: (info: any) => info?.full_name || info?.username || '-'
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
            onClick={() => handleViewMilestones(record)}
          >
            查看
          </Button>

          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <PermissionGuard permission="preparation.construction.edit">
              <Button
                type="text"
                size="small"
                icon={<IconEdit />}
                onClick={() => handleManageMilestones(record)}
              >
                管理
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
          <Title heading={3}>里程碑管理</Title>
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
              <Select.Option value="planning">规划中</Select.Option>
              <Select.Option value="in_progress">施工中</Select.Option>
              <Select.Option value="acceptance">验收中</Select.Option>
              <Select.Option value="rectification">整改中</Select.Option>
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

      {/* 里程碑管理弹窗 */}
      <Modal
        title={`里程碑管理 - ${selectedOrder?.order_no}`}
        visible={milestoneVisible}
        onCancel={() => setMilestoneVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        {selectedOrder && (
          <MilestoneManager
            constructionOrderId={selectedOrder.id}
            milestones={selectedOrder.milestones || []}
            onUpdate={() => {
              handleMilestoneUpdate()
              // 重新加载当前选中的工程单详情
              PreparationService.getConstructionOrderDetail(selectedOrder.id)
                .then(updatedOrder => {
                  setSelectedOrder(updatedOrder)
                })
                .catch(error => {
                  console.error('重新加载工程单详情失败:', error)
                })
            }}
            readonly={selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled'}
          />
        )}
      </Modal>

      {/* 里程碑详情查看弹窗 */}
      <Modal
        title={`里程碑详情 - ${selectedOrder?.order_no}`}
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
          <div>
            {/* 基本信息 */}
            <Card title="工程基本信息" size="small" style={{ marginBottom: '16px' }}>
              <Descriptions
                column={2}
                size="small"
                data={[
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
                    label: '开工日期',
                    value: selectedOrder.construction_start_date || '-'
                  },
                  {
                    label: '预计完工',
                    value: selectedOrder.construction_end_date || '-'
                  },
                  {
                    label: '供应商',
                    value: selectedOrder.supplier?.name || '-'
                  },
                  {
                    label: '里程碑进度',
                    value: `${calculateMilestoneProgress(selectedOrder.milestones || [])}%`
                  }
                ]}
              />
            </Card>

            {/* 里程碑时间线 */}
            <Card title="里程碑时间线" size="small">
              {selectedOrder.milestones && selectedOrder.milestones.length > 0 ? (
                <Timeline>
                  {selectedOrder.milestones.map((milestone) => {
                    const statusConfig = MILESTONE_STATUS_CONFIG[milestone.status]
                    return (
                      <Timeline.Item
                        key={milestone.id}
                        label={milestone.planned_date}
                        dot={<Tag color={statusConfig.color}>{statusConfig.text}</Tag>}
                      >
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                            {milestone.name}
                          </div>
                          {milestone.description && (
                            <div style={{ fontSize: '12px', color: '#86909c', marginBottom: '4px' }}>
                              {milestone.description}
                            </div>
                          )}
                          {milestone.actual_date && (
                            <div style={{ fontSize: '12px', color: '#86909c' }}>
                              实际完成：{milestone.actual_date}
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    )
                  })}
                </Timeline>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#86909c' }}>
                  暂无里程碑
                </div>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MilestoneManagement