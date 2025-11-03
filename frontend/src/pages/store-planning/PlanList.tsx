/**
 * 开店计划列表页面
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
  Popconfirm,
  Typography
} from '@arco-design/web-react'
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconEye,
  IconDelete,
  IconSearch
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import { PlanService } from '../../api'
import { StorePlan, PlanStatus, PlanType, StorePlanQueryParams } from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import styles from './PlanList.module.css'

const { Title } = Typography
const { RangePicker } = DatePicker

// 计划状态配置
const PLAN_STATUS_CONFIG: Record<PlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'gray' },
  published: { text: '已发布', color: 'blue' },
  executing: { text: '执行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' }
}

// 计划类型配置
const PLAN_TYPE_CONFIG: Record<PlanType, string> = {
  annual: '年度计划',
  quarterly: '季度计划'
}

const PlanList: React.FC = () => {
  const navigate = useNavigate()
  
  // 状态管理
  const [plans, setPlans] = useState<StorePlan[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // 筛选条件
  const [filters, setFilters] = useState<StorePlanQueryParams>({})
  const [searchName, setSearchName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<PlanStatus | undefined>()
  const [selectedType, setSelectedType] = useState<PlanType | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  // 加载计划列表
  const loadPlans = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const params: StorePlanQueryParams = {
        page,
        page_size: pageSize,
        ...filters
      }
      
      const response = await PlanService.getPlans(params)
      setPlans(response.results)
      setPagination({
        current: page,
        pageSize,
        total: response.count
      })
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载计划列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 应用筛选
  const handleSearch = () => {
    const newFilters: StorePlanQueryParams = {}
    
    if (searchName) {
      newFilters.name = searchName
    }
    if (selectedStatus) {
      newFilters.status = selectedStatus
    }
    if (selectedType) {
      newFilters.plan_type = selectedType
    }
    if (dateRange && dateRange.length === 2) {
      newFilters.start_date = dateRange[0]
      newFilters.end_date = dateRange[1]
    }
    
    setFilters(newFilters)
    loadPlans(1, pagination.pageSize)
  }

  // 重置筛选
  const handleReset = () => {
    setSearchName('')
    setSelectedStatus(undefined)
    setSelectedType(undefined)
    setDateRange(undefined)
    setFilters({})
    loadPlans(1, pagination.pageSize)
  }

  // 删除计划
  const handleDelete = async (id: number) => {
    try {
      await PlanService.deletePlan(id)
      Message.success('删除成功')
      loadPlans(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除失败')
    }
  }

  // 表格列配置
  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      width: 250,
      render: (name: string, record: StorePlan) => (
        <a onClick={() => navigate(`/store-planning/plans/${record.id}`)}>
          {name}
        </a>
      )
    },
    {
      title: '计划类型',
      dataIndex: 'plan_type',
      width: 120,
      render: (type: PlanType) => PLAN_TYPE_CONFIG[type]
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: PlanStatus) => {
        const config = PLAN_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '计划周期',
      dataIndex: 'start_date',
      width: 220,
      render: (_: string, record: StorePlan) => (
        <span>{record.start_date} 至 {record.end_date}</span>
      )
    },
    {
      title: '目标数量',
      dataIndex: 'total_target_count',
      width: 100,
      align: 'right' as const
    },
    {
      title: '完成数量',
      dataIndex: 'total_completed_count',
      width: 100,
      align: 'right' as const
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: StorePlan) => {
        const rate = record.total_target_count > 0
          ? ((record.total_completed_count / record.total_target_count) * 100).toFixed(1)
          : '0.0'
        return `${rate}%`
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
      render: (_: any, record: StorePlan) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => navigate(`/store-planning/plans/${record.id}`)}
          >
            查看
          </Button>
          
          {record.status === 'draft' && (
            <PermissionGuard permission="store_planning.plan.edit">
              <Button
                type="text"
                size="small"
                icon={<IconEdit />}
                onClick={() => navigate(`/store-planning/plans/${record.id}/edit`)}
              >
                编辑
              </Button>
            </PermissionGuard>
          )}
          
          {record.status === 'draft' && (
            <PermissionGuard permission="store_planning.plan.delete">
              <Popconfirm
                title="确认删除"
                content="删除后无法恢复，确定要删除这个计划吗？"
                onOk={() => handleDelete(record.id)}
              >
                <Button
                  type="text"
                  size="small"
                  status="danger"
                  icon={<IconDelete />}
                >
                  删除
                </Button>
              </Popconfirm>
            </PermissionGuard>
          )}
        </Space>
      )
    }
  ]

  // 分页变化处理
  const handleTableChange = (pagination: any) => {
    loadPlans(pagination.current, pagination.pageSize)
  }

  // 初始加载
  useEffect(() => {
    loadPlans()
  }, [])

  return (
    <div className={styles.container}>
      <Card>
        {/* 页面标题和操作按钮 */}
        <div className={styles.header}>
          <Title heading={3}>开店计划管理</Title>
          <Space>
            <PermissionGuard permission="store_planning.plan.create">
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={() => navigate('/store-planning/plans/create')}
              >
                新建计划
              </Button>
            </PermissionGuard>
            <Button
              icon={<IconRefresh />}
              onClick={() => loadPlans(pagination.current, pagination.pageSize)}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 筛选条件 */}
        <div className={styles.filters}>
          <Space wrap>
            <Input
              style={{ width: 200 }}
              placeholder="搜索计划名称"
              value={searchName}
              onChange={setSearchName}
              allowClear
            />
            <Select
              style={{ width: 150 }}
              placeholder="计划类型"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
            >
              <Select.Option value="annual">年度计划</Select.Option>
              <Select.Option value="quarterly">季度计划</Select.Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="计划状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="published">已发布</Select.Option>
              <Select.Option value="executing">执行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
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

        {/* 计划列表表格 */}
        <Table
          columns={columns}
          data={plans}
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
    </div>
  )
}

export default PlanList
