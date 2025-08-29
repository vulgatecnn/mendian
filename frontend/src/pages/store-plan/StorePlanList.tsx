import React, { useState, useEffect } from 'react'
import {
  Button,
  Table,
  Tag,
  Space,
  Card,
  Modal,
  message,
  Dropdown,
  Progress,
  Statistic,
  Divider,
  Badge,
  Row,
  Col
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  MoreOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import { useStorePlanStore } from '@/stores/storePlanStore'
import StatusTag from './components/StatusTag'
import FilterPanel from './components/FilterPanel'
import type { StorePlan, StorePlanQueryParams } from '@/services/types'
import dayjs from 'dayjs'

const StorePlanList: React.FC = () => {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)
  
  const { 
    storePlans,
    stats,
    selectedIds,
    queryParams,
    pagination,
    isLoading,
    isStatsLoading,
    fetchStorePlans,
    fetchStats,
    batchDeleteStorePlans,
    cloneStorePlan,
    deleteStorePlan,
    setSelectedIds,
    setQueryParams,
    clearSelection
  } = useStorePlanStore()

  useEffect(() => {
    fetchStorePlans()
    fetchStats()
  }, [fetchStorePlans, fetchStats])

  // 状态和类型映射（与后端保持一致）
  const statusMap = {
    DRAFT: { color: 'default', text: '草稿', icon: <FileTextOutlined /> },
    SUBMITTED: { color: 'processing', text: '已提交', icon: <ExportOutlined /> },
    PENDING: { color: 'processing', text: '待审批', icon: <ClockCircleOutlined /> },
    APPROVED: { color: 'success', text: '已批准', icon: <CheckCircleOutlined /> },
    REJECTED: { color: 'error', text: '已拒绝', icon: <CloseCircleOutlined /> },
    IN_PROGRESS: { color: 'warning', text: '进行中', icon: <SyncOutlined spin /> },
    COMPLETED: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
    CANCELLED: { color: 'error', text: '已取消', icon: <ExclamationCircleOutlined /> }
  }

  const typeMap = {
    DIRECT: { color: 'blue', text: '直营' },
    FRANCHISE: { color: 'green', text: '加盟' },
    FLAGSHIP: { color: 'purple', text: '旗舰店' },
    POPUP: { color: 'orange', text: '快闪店' }
  }

  // 计算统计数据
  const statsCards = [
    {
      title: '总计划数',
      value: stats?.total?.count || 0,
      precision: 0,
      valueStyle: { color: '#1890ff' },
      prefix: <BarChartOutlined />
    },
    {
      title: '进行中',
      value: stats?.byStatus?.in_progress || 0,
      precision: 0,
      valueStyle: { color: '#faad14' },
      prefix: <SyncOutlined spin />
    },
    {
      title: '已完成',
      value: stats?.byStatus?.completed || 0,
      precision: 0,
      valueStyle: { color: '#52c41a' },
      prefix: <CheckCircleOutlined />
    },
    {
      title: '总预算(万)',
      value: (stats?.total?.totalBudget || 0) / 10000,
      precision: 1,
      valueStyle: { color: '#722ed1' }
    }
  ]

  // 表格列定义
  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string, record: StorePlan) => (
        <Space>
          <a onClick={() => handleView(record.id)}>{text}</a>
          {record.priority === 'urgent' && <Badge color="red" text="紧急" />}
        </Space>
      )
    },
    {
      title: '门店类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: StorePlan['type']) => {
        const config = typeMap[type]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: StorePlan['status'], record: StorePlan) => (
        <StatusTag status={status} priority={record.priority} />
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number) => (
        <Progress
          percent={progress}
          size="small"
          status={progress === 100 ? 'success' : 'active'}
        />
      )
    },
    {
      title: '地区',
      dataIndex: ['region', 'name'],
      key: 'region',
      width: 100,
      ellipsis: true
    },
    {
      title: '目标开店日期',
      dataIndex: 'targetOpenDate',
      key: 'targetOpenDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '预算(万)',
      dataIndex: 'budget',
      key: 'budget',
      width: 100,
      align: 'right' as const,
      render: (budget: number) => `¥${(budget / 10000).toFixed(1)}`
    },
    {
      title: '负责人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 100,
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: StorePlan) => {
        const items = [
          {
            key: 'view',
            label: '查看详情',
            icon: <EyeOutlined />,
            onClick: () => handleView(record.id)
          },
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record.id),
            disabled: record.status === 'completed'
          },
          {
            key: 'clone',
            label: '复制',
            onClick: () => handleClone(record.id)
          },
          {
            type: 'divider' as const
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record.id),
            danger: true,
            disabled: record.status !== 'draft'
          }
        ]

        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            >
              查看
            </Button>
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        )
      }
    }
  ]

  // 事件处理函数
  const handleView = (id: string) => {
    navigate(`/store-plan/${id}`)
  }

  const handleEdit = (id: string) => {
    navigate(`/store-plan/${id}/edit`)
  }

  const handleCreate = () => {
    navigate('/store-plan/create')
  }

  const handleClone = async (id: string) => {
    const plan = storePlans.find(p => p.id === id)
    if (!plan) return
    
    const result = await cloneStorePlan(id, {
      name: `${plan.name} - 副本`,
      description: plan.description,
      targetOpenDate: dayjs().add(30, 'days').toISOString()
    })
    
    if (result) {
      message.success('计划复制成功')
    }
  }

  const handleDelete = (id: string) => {
    const plan = storePlans.find(p => p.id === id)
    if (!plan) return

    if (plan.status !== 'draft') {
      message.warning('只有草稿状态的计划可以删除')
      return
    }

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个开店计划吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteStorePlan(id)
      }
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要删除的项目')
      return
    }

    // 检查是否都是草稿状态
    const selectedPlans = storePlans.filter(plan => selectedIds.includes(plan.id))
    const nonDraftPlans = selectedPlans.filter(plan => plan.status !== 'draft')
    
    if (nonDraftPlans.length > 0) {
      message.warning('选中的项目中包含非草稿状态的计划，只有草稿状态可以删除')
      return
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedIds.length} 个计划吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await batchDeleteStorePlans(selectedIds)
      }
    })
  }

  const handleFilter = (params: StorePlanQueryParams) => {
    setQueryParams(params)
    fetchStorePlans(params)
  }

  const handleTableChange = (paginationInfo: any) => {
    const newParams = {
      ...queryParams,
      page: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    }
    setQueryParams(newParams)
    fetchStorePlans(newParams)
  }

  const handleRefresh = () => {
    fetchStorePlans()
    fetchStats()
  }

  const handleExport = async () => {
    try {
      message.loading({ content: '正在导出数据...', key: 'export' })
      
      // 动态导入xlsx库
      const XLSX = await import('xlsx')
      
      // 准备导出数据
      const exportData = storePlans.map((plan, index) => ({
        序号: index + 1,
        计划名称: plan.name,
        门店类型: typeMap[plan.type as keyof typeof typeMap]?.text || plan.type,
        状态: statusMap[plan.status as keyof typeof statusMap]?.text || plan.status,
        优先级: plan.priority === 'urgent' ? '紧急' : 
                plan.priority === 'high' ? '高' :
                plan.priority === 'medium' ? '中' : '低',
        进度: `${plan.progress}%`,
        地区: plan.region?.name || '-',
        目标开店日期: plan.targetOpenDate ? dayjs(plan.targetOpenDate).format('YYYY-MM-DD') : '-',
        预算万元: (plan.budget / 10000).toFixed(1),
        负责人: plan.createdByName,
        创建时间: dayjs(plan.createdAt).format('YYYY-MM-DD HH:mm'),
        描述: plan.description || '-'
      }))
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new()
      
      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // 设置列宽
      const columnWidths = [
        { wch: 6 },   // 序号
        { wch: 20 },  // 计划名称
        { wch: 10 },  // 门店类型
        { wch: 10 },  // 状态
        { wch: 8 },   // 优先级
        { wch: 8 },   // 进度
        { wch: 12 },  // 地区
        { wch: 15 },  // 目标开店日期
        { wch: 12 },  // 预算
        { wch: 10 },  // 负责人
        { wch: 18 },  // 创建时间
        { wch: 30 }   // 描述
      ]
      worksheet['!cols'] = columnWidths
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, '开店计划')
      
      // 生成文件名（包含时间戳）
      const timestamp = dayjs().format('YYYYMMDD_HHmm')
      const filename = `开店计划列表_${timestamp}.xlsx`
      
      // 导出文件
      XLSX.writeFile(workbook, filename)
      
      message.success({ content: `成功导出 ${exportData.length} 条记录`, key: 'export' })
    } catch (error) {
      console.error('导出失败:', error)
      message.error({ content: '导出失败，请重试', key: 'export' })
    }
  }

  const handleImport = () => {
    // 实现导入逻辑
    message.info('导入功能开发中')
  }

  const handleStatistics = () => {
    navigate('/store-plan/statistics')
  }

  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: setSelectedIds,
    onSelectAll: (selected: boolean, selectedRows: StorePlan[], changeRows: StorePlan[]) => {
      if (selected) {
        const allIds = storePlans.map(plan => plan.id)
        setSelectedIds(allIds)
      } else {
        clearSelection()
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="开店计划管理"
        description="管理门店开店计划，包括直营店、加盟店等不同类型的开店规划"
        breadcrumbs={[{ title: '开店计划' }]}
        extra={[
          <Button key="statistics" icon={<BarChartOutlined />} onClick={handleStatistics}>
            统计分析
          </Button>,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>,
          <Button key="export" icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>,
          <Button key="import" icon={<ImportOutlined />} onClick={handleImport}>
            导入
          </Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建计划
          </Button>
        ]}
      />

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statsCards.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={stat.precision}
                valueStyle={stat.valueStyle}
                prefix={stat.prefix}
                loading={isStatsLoading}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 搜索和筛选 */}
      <FilterPanel 
        onFilter={handleFilter}
        showSaveFilter={false}
        compact={false}
      />

      {/* 操作栏 */}
      {selectedIds.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>已选择 {selectedIds.length} 项</span>
            <Divider type="vertical" />
            <Button danger onClick={handleBatchDelete}>
              批量删除
            </Button>
            <Button onClick={clearSelection}>取消选择</Button>
          </Space>
        </Card>
      )}

      {/* 主表格 */}
      <Card>
        <Table<StorePlan>
          rowKey="id"
          columns={columns}
          dataSource={storePlans}
          rowSelection={rowSelection}
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default StorePlanList
