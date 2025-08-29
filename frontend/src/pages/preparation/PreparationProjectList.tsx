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
  Drawer,
  Divider,
  Row,
  Col,
  Statistic,
  Typography,
  Dropdown,
  Popconfirm,
  Checkbox,
  InputNumber,
  Switch
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { SelectProps } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  ExportOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  MoreOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import PageContainer from '@/components/common/PageContainer'
import { usePreparationStore } from '@/stores/preparationStore'
import { PREPARATION_STATUS_COLORS, PRIORITY_COLORS } from '@/constants/colors'
import type {
  PreparationProject,
  PreparationStatusType,
  Priority,
  PreparationProjectFilters
} from '@/constants/colors'

const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select
const { Text, Title } = Typography

// 状态选项配置
const STATUS_OPTIONS = [
  { value: 'PLANNING', label: '规划中', color: PREPARATION_STATUS_COLORS.PLANNING },
  { value: 'APPROVED', label: '已批准', color: PREPARATION_STATUS_COLORS.APPROVED },
  { value: 'IN_PROGRESS', label: '进行中', color: PREPARATION_STATUS_COLORS.IN_PROGRESS },
  { value: 'SUSPENDED', label: '已暂停', color: PREPARATION_STATUS_COLORS.SUSPENDED },
  { value: 'COMPLETED', label: '已完成', color: PREPARATION_STATUS_COLORS.COMPLETED },
  { value: 'CANCELLED', label: '已取消', color: PREPARATION_STATUS_COLORS.CANCELLED },
  { value: 'OVERDUE', label: '已逾期', color: PREPARATION_STATUS_COLORS.OVERDUE },
]

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: '紧急', color: PRIORITY_COLORS.URGENT },
  { value: 'HIGH', label: '高', color: PRIORITY_COLORS.HIGH },
  { value: 'MEDIUM', label: '中', color: PRIORITY_COLORS.MEDIUM },
  { value: 'LOW', label: '低', color: PRIORITY_COLORS.LOW },
]

// 状态徽章组件
const StatusBadge: React.FC<{ status: PreparationStatusType }> = ({ status }) => {
  const option = STATUS_OPTIONS.find(opt => opt.value === status)
  return (
    <Badge
      color={option?.color}
      text={option?.label || status}
    />
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

// 进度条组件
const ProgressColumn: React.FC<{ percent: number; status: PreparationStatusType }> = ({ 
  percent, 
  status 
}) => {
  const getProgressColor = (status: PreparationStatusType, percent: number) => {
    if (status === 'COMPLETED') return '#52c41a'
    if (status === 'OVERDUE') return '#ff4d4f'
    if (status === 'CANCELLED') return '#d9d9d9'
    if (percent < 30) return '#faad14'
    if (percent < 70) return '#1890ff'
    return '#52c41a'
  }

  return (
    <div style={{ minWidth: 120 }}>
      <Progress
        percent={percent}
        size="small"
        strokeColor={getProgressColor(status, percent)}
        showInfo={true}
      />
    </div>
  )
}

// 筛选抽屉组件
const FilterDrawer: React.FC<{
  visible: boolean
  onClose: () => void
  filters: PreparationProjectFilters
  onFilterChange: (filters: PreparationProjectFilters) => void
  onReset: () => void
}> = ({ visible, onClose, filters, onFilterChange, onReset }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        ...filters,
        plannedDateRange: filters.plannedStartDateStart && filters.plannedStartDateEnd ? [
          dayjs(filters.plannedStartDateStart),
          dayjs(filters.plannedStartDateEnd)
        ] : undefined,
        budgetRange: filters.minBudget && filters.maxBudget ? [
          filters.minBudget,
          filters.maxBudget
        ] : undefined,
        progressRange: filters.minProgress && filters.maxProgress ? [
          filters.minProgress,
          filters.maxProgress
        ] : undefined
      })
    }
  }, [visible, filters, form])

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const newFilters: PreparationProjectFilters = {
        ...values,
        plannedStartDateStart: values.plannedDateRange?.[0]?.format('YYYY-MM-DD'),
        plannedStartDateEnd: values.plannedDateRange?.[1]?.format('YYYY-MM-DD'),
        minBudget: values.budgetRange?.[0],
        maxBudget: values.budgetRange?.[1],
        minProgress: values.progressRange?.[0],
        maxProgress: values.progressRange?.[1],
        page: 1, // 重置到第一页
      }
      
      // 清理空值
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key as keyof PreparationProjectFilters] === undefined || 
            newFilters[key as keyof PreparationProjectFilters] === '') {
          delete newFilters[key as keyof PreparationProjectFilters]
        }
      })
      
      onFilterChange(newFilters)
      onClose()
    })
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
    onClose()
  }

  return (
    <Drawer
      title="筛选条件"
      placement="right"
      width={400}
      open={visible}
      onClose={onClose}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" onClick={handleSubmit}>
            确定
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="status" label="项目状态">
          <Select placeholder="请选择状态" allowClear>
            {STATUS_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <StatusBadge status={option.value as PreparationStatusType} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="优先级">
          <Select placeholder="请选择优先级" allowClear>
            {PRIORITY_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <PriorityTag priority={option.value as Priority} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="plannedDateRange" label="计划日期范围">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="budgetRange" label="预算范围（万元）">
          <Input.Group compact>
            <InputNumber
              style={{ width: '45%' }}
              placeholder="最小预算"
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
            <Input
              style={{ width: '10%', textAlign: 'center', border: 'none', pointerEvents: 'none' }}
              placeholder="~"
              disabled
            />
            <InputNumber
              style={{ width: '45%' }}
              placeholder="最大预算"
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Input.Group>
        </Form.Item>

        <Form.Item name="progressRange" label="进度范围（%）">
          <Input.Group compact>
            <InputNumber
              style={{ width: '45%' }}
              placeholder="最小进度"
              min={0}
              max={100}
            />
            <Input
              style={{ width: '10%', textAlign: 'center', border: 'none', pointerEvents: 'none' }}
              placeholder="~"
              disabled
            />
            <InputNumber
              style={{ width: '45%' }}
              placeholder="最大进度"
              min={0}
              max={100}
            />
          </Input.Group>
        </Form.Item>

        <Form.Item name="managerId" label="项目经理">
          <Select placeholder="请选择项目经理" allowClear>
            {/* 这里应该从接口获取用户列表 */}
            <Option value="user1">张三</Option>
            <Option value="user2">李四</Option>
            <Option value="user3">王五</Option>
          </Select>
        </Form.Item>

        <Form.Item name="candidateLocationId" label="候选点位">
          <Select placeholder="请选择候选点位" allowClear>
            {/* 这里应该从接口获取候选点位列表 */}
            <Option value="location1">北京朝阳区点位A</Option>
            <Option value="location2">上海浦东区点位B</Option>
            <Option value="location3">深圳南山区点位C</Option>
          </Select>
        </Form.Item>
      </Form>
    </Drawer>
  )
}

const PreparationProjectList: React.FC = () => {
  const navigate = useNavigate()
  
  // Store状态
  const {
    projects,
    selectedProjectIds,
    projectFilters,
    projectPagination,
    isLoading,
    isSubmitting,
    
    // 方法
    fetchProjects,
    setSelectedProjectIds,
    setProjectFilters,
    setProjectPagination,
    deleteProject,
    batchDeleteProjects,
    batchUpdateProjects,
    updateProjectStatus,
    updateProjectPriority,
    clearAllSelections
  } = usePreparationStore()

  // 本地状态
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [quickStatusFilter, setQuickStatusFilter] = useState<PreparationStatusType | undefined>()
  
  // 初始化数据
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 搜索处理
  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword)
    const newFilters = { ...projectFilters, keyword, page: 1 }
    setProjectFilters(newFilters)
    fetchProjects(newFilters)
  }, [projectFilters, setProjectFilters, fetchProjects])

  // 快速状态筛选
  const handleQuickStatusFilter = useCallback((status?: PreparationStatusType) => {
    setQuickStatusFilter(status)
    const newFilters = { ...projectFilters, status, page: 1 }
    setProjectFilters(newFilters)
    fetchProjects(newFilters)
  }, [projectFilters, setProjectFilters, fetchProjects])

  // 筛选变更处理
  const handleFilterChange = useCallback((filters: PreparationProjectFilters) => {
    setProjectFilters(filters)
    fetchProjects(filters)
  }, [setProjectFilters, fetchProjects])

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    const defaultFilters = { page: 1, limit: 20 }
    setProjectFilters(defaultFilters)
    setSearchKeyword('')
    setQuickStatusFilter(undefined)
    fetchProjects(defaultFilters)
  }, [setProjectFilters, fetchProjects])

  // 分页处理
  const handleTableChange: TableProps<PreparationProject>['onChange'] = useCallback((pagination) => {
    const newPagination = {
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 20
    }
    setProjectPagination(newPagination)
    
    const newFilters = {
      ...projectFilters,
      page: newPagination.current,
      limit: newPagination.pageSize
    }
    fetchProjects(newFilters)
  }, [projectFilters, setProjectPagination, fetchProjects])

  // 选择处理
  const rowSelection: TableProps<PreparationProject>['rowSelection'] = {
    selectedRowKeys: selectedProjectIds,
    onChange: (selectedKeys) => {
      setSelectedProjectIds(selectedKeys as string[])
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      if (selected) {
        const allIds = projects.map(project => project.id)
        setSelectedProjectIds(allIds)
      } else {
        setSelectedProjectIds([])
      }
    },
  }

  // 批量操作
  const handleBatchDelete = useCallback(async () => {
    if (selectedProjectIds.length === 0) {
      message.warning('请选择要删除的项目')
      return
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedProjectIds.length} 个项目吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        await batchDeleteProjects(selectedProjectIds)
      }
    })
  }, [selectedProjectIds, batchDeleteProjects])

  const handleBatchStatusChange = useCallback(async (status: PreparationStatusType) => {
    if (selectedProjectIds.length === 0) {
      message.warning('请选择要操作的项目')
      return
    }

    await batchUpdateProjects({
      ids: selectedProjectIds,
      action: 'changeStatus',
      actionData: { status }
    })
  }, [selectedProjectIds, batchUpdateProjects])

  // 单个操作
  const handleStatusChange = useCallback(async (record: PreparationProject, status: PreparationStatusType) => {
    await updateProjectStatus(record.id, status)
  }, [updateProjectStatus])

  const handlePriorityChange = useCallback(async (record: PreparationProject, priority: Priority) => {
    await updateProjectPriority(record.id, priority)
  }, [updateProjectPriority])

  const handleDelete = useCallback(async (record: PreparationProject) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目"${record.projectName}"吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        await deleteProject(record.id)
      }
    })
  }, [deleteProject])

  // 表格列配置
  const columns: ColumnsType<PreparationProject> = useMemo(() => [
    {
      title: '项目信息',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 280,
      fixed: 'left',
      render: (text: string, record: PreparationProject) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', fontWeight: 500 }}
              onClick={() => navigate(`/preparation/projects/${record.id}`)}
            >
              {text}
            </Button>
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            编号：{record.projectCode}
          </div>
          {record.storeName && (
            <div style={{ fontSize: 12, color: '#666' }}>
              门店：{record.storeName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: STATUS_OPTIONS.map(opt => ({ text: opt.label, value: opt.value })),
      filteredValue: quickStatusFilter ? [quickStatusFilter] : undefined,
      render: (status: PreparationStatusType, record) => (
        <Dropdown
          menu={{
            items: STATUS_OPTIONS.map(opt => ({
              key: opt.value,
              label: <StatusBadge status={opt.value as PreparationStatusType} />,
              onClick: () => handleStatusChange(record, opt.value as PreparationStatusType),
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
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      filters: PRIORITY_OPTIONS.map(opt => ({ text: opt.label, value: opt.value })),
      render: (priority: Priority, record) => (
        <Dropdown
          menu={{
            items: PRIORITY_OPTIONS.map(opt => ({
              key: opt.value,
              label: <PriorityTag priority={opt.value as Priority} />,
              onClick: () => handlePriorityChange(record, opt.value as Priority),
              disabled: opt.value === priority
            }))
          }}
          trigger={['click']}
        >
          <div style={{ cursor: 'pointer' }}>
            <PriorityTag priority={priority} />
          </div>
        </Dropdown>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progressPercentage',
      key: 'progressPercentage',
      width: 150,
      render: (percent: number, record) => (
        <ProgressColumn percent={percent} status={record.status} />
      ),
    },
    {
      title: '预算信息',
      key: 'budget',
      width: 150,
      render: (_, record: PreparationProject) => (
        <div>
          <div style={{ fontSize: 13 }}>
            预算：{(record.budget / 10000).toFixed(1)}万
          </div>
          {record.actualBudget && (
            <div style={{ fontSize: 12, color: '#666' }}>
              实际：{(record.actualBudget / 10000).toFixed(1)}万
            </div>
          )}
        </div>
      ),
    },
    {
      title: '时间进度',
      key: 'timeline',
      width: 180,
      render: (_, record: PreparationProject) => (
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>
            计划：{dayjs(record.plannedStartDate).format('MM/DD')} ~ {dayjs(record.plannedEndDate).format('MM/DD')}
          </div>
          {record.actualStartDate && (
            <div style={{ fontSize: 12, color: '#666' }}>
              实际：{dayjs(record.actualStartDate).format('MM/DD')} ~ {record.actualEndDate ? dayjs(record.actualEndDate).format('MM/DD') : '进行中'}
            </div>
          )}
          <div style={{ fontSize: 12, color: dayjs().isAfter(record.plannedEndDate) ? '#ff4d4f' : '#52c41a' }}>
            {dayjs().isAfter(record.plannedEndDate) ? '已逾期' : `剩余${dayjs(record.plannedEndDate).diff(dayjs(), 'day')}天`}
          </div>
        </div>
      ),
    },
    {
      title: '项目经理',
      dataIndex: 'managerId',
      key: 'managerId',
      width: 100,
      render: (managerId: string) => (
        <div style={{ fontSize: 13 }}>
          {/* 这里应该根据managerId查找用户名 */}
          {managerId || '-'}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: PreparationProject) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/preparation/projects/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/preparation/projects/${record.id}/edit`)}
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
                    label: <StatusBadge status={opt.value as PreparationStatusType} />,
                    onClick: () => handleStatusChange(record, opt.value as PreparationStatusType),
                    disabled: opt.value === record.status
                  }))
                },
                {
                  key: 'priority',
                  label: '更改优先级',
                  children: PRIORITY_OPTIONS.map(opt => ({
                    key: `priority-${opt.value}`,
                    label: <PriorityTag priority={opt.value as Priority} />,
                    onClick: () => handlePriorityChange(record, opt.value as Priority),
                    disabled: opt.value === record.priority
                  }))
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  label: (
                    <Text type="danger">删除项目</Text>
                  ),
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
  ], [navigate, quickStatusFilter, handleStatusChange, handlePriorityChange, handleDelete])

  // 批量操作菜单
  const batchActionItems = [
    {
      key: 'status',
      label: '批量更改状态',
      children: STATUS_OPTIONS.map(opt => ({
        key: `batch-status-${opt.value}`,
        label: <StatusBadge status={opt.value as PreparationStatusType} />,
        onClick: () => handleBatchStatusChange(opt.value as PreparationStatusType)
      }))
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      label: <Text type="danger">批量删除</Text>,
      onClick: handleBatchDelete
    }
  ]

  return (
    <PageContainer
      title="筹备项目管理"
      breadcrumb={{
        routes: [
          { path: '/', breadcrumbName: '首页' },
          { path: '/preparation', breadcrumbName: '开店筹备' },
          { path: '/preparation/projects', breadcrumbName: '筹备项目' },
        ]
      }}
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={projectPagination.total}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={projects.filter(p => p.status === 'IN_PROGRESS').length}
              valueStyle={{ color: PREPARATION_STATUS_COLORS.IN_PROGRESS }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={projects.filter(p => p.status === 'COMPLETED').length}
              valueStyle={{ color: PREPARATION_STATUS_COLORS.COMPLETED }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已逾期"
              value={projects.filter(p => p.status === 'OVERDUE').length}
              valueStyle={{ color: PREPARATION_STATUS_COLORS.OVERDUE }}
              prefix={<ExclamationCircleOutlined />}
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
                placeholder="搜索项目名称、编号"
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
                    <StatusBadge status={option.value as PreparationStatusType} />
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col flex="none">
            <Space>
              {selectedProjectIds.length > 0 && (
                <>
                  <Text type="secondary">
                    已选择 {selectedProjectIds.length} 项
                  </Text>
                  <Dropdown menu={{ items: batchActionItems }} trigger={['click']}>
                    <Button>
                      批量操作 <DownOutlined />
                    </Button>
                  </Dropdown>
                  <Button onClick={clearAllSelections}>取消选择</Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/preparation/projects/create')}
              >
                新建项目
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
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
                onClick={() => fetchProjects()}
                loading={isLoading}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 表格 */}
        <Table<PreparationProject>
          rowKey="id"
          columns={columns}
          dataSource={projects}
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{
            current: projectPagination.current,
            pageSize: projectPagination.pageSize,
            total: projectPagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1200 }}
          onChange={handleTableChange}
          size="small"
        />
      </Card>

      {/* 筛选抽屉 */}
      <FilterDrawer
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        filters={projectFilters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />
    </PageContainer>
  )
}

export default PreparationProjectList