/**
 * 铺位跟进单列表页面
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
  Progress
} from '@arco-design/web-react'
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconEye,
  IconSearch,
  IconCalendar,
  IconFile
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import { ExpansionService, PlanService } from '../../api'
import { 
  FollowUpRecord, 
  FollowUpRecordQueryParams, 
  FollowUpStatus,
  FollowUpPriority,
  BusinessRegion 
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import FollowUpForm from './FollowUpForm'
import styles from './FollowUpList.module.css'

const { Title } = Typography
const { RangePicker } = DatePicker

// 跟进状态配置
const FOLLOW_UP_STATUS_CONFIG: Record<FollowUpStatus, { text: string; color: string }> = {
  investigating: { text: '调研中', color: 'blue' },
  calculating: { text: '测算中', color: 'orange' },
  approving: { text: '审批中', color: 'purple' },
  signed: { text: '已签约', color: 'green' },
  abandoned: { text: '已放弃', color: 'gray' }
}

// 优先级配置
const PRIORITY_CONFIG: Record<FollowUpPriority, { text: string; color: string }> = {
  low: { text: '低', color: 'gray' },
  medium: { text: '中', color: 'blue' },
  high: { text: '高', color: 'orange' },
  urgent: { text: '紧急', color: 'red' }
}

const FollowUpList: React.FC = () => {
  const navigate = useNavigate()
  
  // 状态管理
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [regions, setRegions] = useState<BusinessRegion[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // 筛选条件
  const [filters, setFilters] = useState<FollowUpRecordQueryParams>({})
  const [searchRecordNo, setSearchRecordNo] = useState('')
  const [searchLocationName, setSearchLocationName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<FollowUpStatus | undefined>()
  const [selectedPriority, setSelectedPriority] = useState<FollowUpPriority | undefined>()
  const [selectedRegion, setSelectedRegion] = useState<number | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  // 表单弹窗
  const [formVisible, setFormVisible] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUpRecord | null>(null)

  // 加载跟进单列表
  const loadFollowUps = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const params: FollowUpRecordQueryParams = {
        page,
        page_size: pageSize,
        ...filters
      }
      
      const response = await ExpansionService.getFollowUps(params)
      setFollowUps(response.results)
      setPagination({
        current: page,
        pageSize,
        total: response.count
      })
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载跟进单列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载业务大区列表
  const loadRegions = async () => {
    try {
      const response = await PlanService.getRegions()
      setRegions(response)
    } catch (error: any) {
      Message.error('加载业务大区失败')
    }
  }

  // 应用筛选
  const handleSearch = () => {
    const newFilters: FollowUpRecordQueryParams = {}
    
    if (searchRecordNo) {
      newFilters.record_no = searchRecordNo
    }
    if (searchLocationName) {
      newFilters.location_name = searchLocationName
    }
    if (selectedStatus) {
      newFilters.status = selectedStatus
    }
    if (selectedPriority) {
      newFilters.priority = selectedPriority
    }
    if (selectedRegion) {
      newFilters.business_region_id = selectedRegion
    }
    if (dateRange && dateRange.length === 2) {
      newFilters.start_date = dateRange[0]
      newFilters.end_date = dateRange[1]
    }
    
    setFilters(newFilters)
    loadFollowUps(1, pagination.pageSize)
  }

  // 重置筛选
  const handleReset = () => {
    setSearchRecordNo('')
    setSearchLocationName('')
    setSelectedStatus(undefined)
    setSelectedPriority(undefined)
    setSelectedRegion(undefined)
    setDateRange(undefined)
    setFilters({})
    loadFollowUps(1, pagination.pageSize)
  }

  // 打开新建表单
  const handleCreate = () => {
    setEditingFollowUp(null)
    setFormVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (followUp: FollowUpRecord) => {
    setEditingFollowUp(followUp)
    setFormVisible(true)
  }

  // 查看详情
  const handleViewDetail = (followUp: FollowUpRecord) => {
    navigate(`/store-expansion/follow-ups/${followUp.id}`)
  }

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingFollowUp(null)
    loadFollowUps(pagination.current, pagination.pageSize)
  }

  // 计算跟进进度
  const calculateProgress = (followUp: FollowUpRecord) => {
    const statusProgress: Record<FollowUpStatus, number> = {
      investigating: 25,
      calculating: 50,
      approving: 75,
      signed: 100,
      abandoned: 0
    }
    return statusProgress[followUp.status] || 0
  }

  // 表格列配置
  const columns = [
    {
      title: '跟进单号',
      dataIndex: 'record_no',
      width: 150,
      render: (recordNo: string, record: FollowUpRecord) => (
        <a onClick={() => handleViewDetail(record)}>
          {recordNo}
        </a>
      )
    },
    {
      title: '点位名称',
      dataIndex: 'location',
      width: 200,
      render: (location: any) => location?.name || '-'
    },
    {
      title: '地址',
      dataIndex: 'location',
      width: 250,
      render: (location: any) => {
        if (!location) return '-'
        return `${location.province} ${location.city} ${location.district}`
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: FollowUpStatus) => {
        const config = FOLLOW_UP_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (priority: FollowUpPriority) => {
        const config = PRIORITY_CONFIG[priority]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '跟进进度',
      dataIndex: 'progress',
      width: 120,
      render: (_: any, record: FollowUpRecord) => {
        const progress = calculateProgress(record)
        return (
          <Progress
            percent={progress}
            size="small"
            status={record.status === 'abandoned' ? 'error' : undefined}
          />
        )
      }
    },
    {
      title: '盈利测算',
      dataIndex: 'profit_calculation',
      width: 120,
      render: (calculation: any) => {
        if (!calculation) return '-'
        return (
          <Space direction="vertical" size={0}>
            <span>ROI: {calculation.roi}%</span>
            <span>回本: {calculation.payback_period}月</span>
          </Space>
        )
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
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: FollowUpRecord) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          
          {!record.is_abandoned && record.status !== 'signed' && (
            <PermissionGuard permission="expansion.followup.edit">
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
          
          {record.status === 'calculating' && record.profit_calculation && (
            <PermissionGuard permission="expansion.followup.approve">
              <Button
                type="text"
                size="small"
                icon={<IconFile />}
                onClick={() => {
                  // TODO: 发起审批
                  Message.info('发起审批功能待实现')
                }}
              >
                报店审批
              </Button>
            </PermissionGuard>
          )}
          
          {record.contract_reminders && record.contract_reminders.length > 0 && (
            <Button
              type="text"
              size="small"
              icon={<IconCalendar />}
              onClick={() => {
                // TODO: 查看合同提醒
                Message.info('合同提醒功能待实现')
              }}
            >
              合同提醒
            </Button>
          )}
        </Space>
      )
    }
  ]

  // 分页变化处理
  const handleTableChange = (pagination: any) => {
    loadFollowUps(pagination.current, pagination.pageSize)
  }

  // 初始加载
  useEffect(() => {
    loadFollowUps()
    loadRegions()
  }, [])

  return (
    <div className={styles.container}>
      <Card>
        {/* 页面标题和操作按钮 */}
        <div className={styles.header}>
          <Title heading={3}>铺位跟进管理</Title>
          <Space>
            <PermissionGuard permission="expansion.followup.create">
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={handleCreate}
              >
                新建跟进单
              </Button>
            </PermissionGuard>
            <Button
              icon={<IconRefresh />}
              onClick={() => loadFollowUps(pagination.current, pagination.pageSize)}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 筛选条件 */}
        <div className={styles.filters}>
          <Space wrap>
            <Input
              style={{ width: 150 }}
              placeholder="跟进单号"
              value={searchRecordNo}
              onChange={setSearchRecordNo}
              allowClear
            />
            <Input
              style={{ width: 200 }}
              placeholder="点位名称"
              value={searchLocationName}
              onChange={setSearchLocationName}
              allowClear
            />
            <Select
              style={{ width: 120 }}
              placeholder="跟进状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Select.Option value="investigating">调研中</Select.Option>
              <Select.Option value="calculating">测算中</Select.Option>
              <Select.Option value="approving">审批中</Select.Option>
              <Select.Option value="signed">已签约</Select.Option>
              <Select.Option value="abandoned">已放弃</Select.Option>
            </Select>
            <Select
              style={{ width: 100 }}
              placeholder="优先级"
              value={selectedPriority}
              onChange={setSelectedPriority}
              allowClear
            >
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="业务大区"
              value={selectedRegion}
              onChange={setSelectedRegion}
              allowClear
            >
              {regions.map(region => (
                <Select.Option key={region.id} value={region.id}>
                  {region.name}
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

        {/* 跟进单列表表格 */}
        <Table
          columns={columns}
          data={followUps}
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
        title={editingFollowUp ? '编辑跟进单' : '新建跟进单'}
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <FollowUpForm
          followUp={editingFollowUp}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormVisible(false)}
        />
      </Modal>
    </div>
  )
}

export default FollowUpList