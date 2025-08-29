import React, { useState, useEffect } from 'react'
import {
  Card,
  List,
  Tag,
  Space,
  Button,
  Progress,
  Drawer,
  Tabs,
  Badge,
  Avatar,
  Statistic,
  Row,
  Col,
  FloatButton,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Empty
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDevice } from '@/hooks/useDevice'
import { useStorePlan } from '@/services/query/hooks/useStorePlan'
import StatusTag from './components/StatusTag'
import dayjs from 'dayjs'
import type { StorePlan } from '@/services/types/business'

const { Search } = Input
const { Option } = Select

interface MobilePlanListProps {
  showHeader?: boolean
  showStats?: boolean
  maxHeight?: string | number
}

const MobilePlanList: React.FC<MobilePlanListProps> = ({
  showHeader = true,
  showStats = true,
  maxHeight = '100vh'
}) => {
  const navigate = useNavigate()
  const { isMobile } = useDevice()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>()
  const [selectedType, setSelectedType] = useState<string>()
  const [selectedRegion, setSelectedRegion] = useState<string>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // 查询开店计划列表
  const { 
    data: plansData, 
    isLoading,
    refetch 
  } = useStorePlan.useList({
    page: 1,
    limit: 20,
    filters: {
      status: selectedStatus as any,
      storeType: selectedType as any,
      regionId: selectedRegion,
      startDate: dateRange?.[0]?.toISOString(),
      endDate: dateRange?.[1]?.toISOString()
    }
  })

  // 查询统计数据
  const { 
    data: statistics,
    isLoading: statsLoading 
  } = useStorePlan.useStatistics({})

  const plans = plansData?.items || []
  const pagination = plansData?.pagination

  // 状态配置
  const statusConfig = {
    DRAFT: { color: 'default', text: '草稿', icon: <EditOutlined /> },
    SUBMITTED: { color: 'processing', text: '已提交', icon: <ExclamationCircleOutlined /> },
    PENDING: { color: 'warning', text: '待审批', icon: <ClockCircleOutlined /> },
    APPROVED: { color: 'success', text: '已批准', icon: <CheckCircleOutlined /> },
    REJECTED: { color: 'error', text: '已拒绝', icon: <ExclamationCircleOutlined /> },
    IN_PROGRESS: { color: 'processing', text: '进行中', icon: <ClockCircleOutlined /> },
    COMPLETED: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
    CANCELLED: { color: 'default', text: '已取消', icon: <ExclamationCircleOutlined /> }
  }

  // 门店类型配置
  const storeTypeConfig = {
    DIRECT: { color: 'blue', text: '直营' },
    FRANCHISE: { color: 'green', text: '加盟' },
    FLAGSHIP: { color: 'purple', text: '旗舰店' },
    POPUP: { color: 'orange', text: '快闪店' }
  }

  // 计算完成率
  const getCompletionRate = (plan: StorePlan) => {
    if (plan.plannedCount === 0) return 0
    return Math.round((plan.completedCount / plan.plannedCount) * 100)
  }

  // 渲染统计卡片（移动端优化）
  const renderStatsCards = () => {
    if (!showStats || !statistics) return null

    const stats = [
      {
        title: '总计划',
        value: statistics.totalPlans,
        color: '#1890ff',
        icon: <BarChartOutlined />
      },
      {
        title: '进行中',
        value: statistics.statusDistribution.IN_PROGRESS || 0,
        color: '#faad14',
        icon: <ClockCircleOutlined />
      },
      {
        title: '已完成',
        value: statistics.statusDistribution.COMPLETED || 0,
        color: '#52c41a',
        icon: <CheckCircleOutlined />
      },
      {
        title: '完成率',
        value: `${statistics.completionRate.toFixed(1)}%`,
        color: statistics.completionRate > 80 ? '#52c41a' : statistics.completionRate > 60 ? '#faad14' : '#f5222d',
        icon: <BarChartOutlined />
      }
    ]

    return (
      <Card 
        style={{ margin: '16px', marginTop: showHeader ? 0 : 16 }}
        bodyStyle={{ padding: '12px' }}
      >
        <Row gutter={[8, 8]}>
          {stats.map((stat, index) => (
            <Col span={6} key={index}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: stat.color, fontSize: '20px', marginBottom: 4 }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {stat.title}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    )
  }

  // 渲染搜索栏
  const renderSearchBar = () => (
    <Card 
      style={{ margin: '16px', marginTop: 0 }}
      bodyStyle={{ padding: '12px' }}
    >
      <Row gutter={8} align="middle">
        <Col flex={1}>
          <Search
            placeholder="搜索计划名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={() => refetch()}
            size="small"
          />
        </Col>
        <Col>
          <Badge count={getFilterCount()} size="small">
            <Button
              icon={<FilterOutlined />}
              size="small"
              onClick={() => setFilterVisible(true)}
            >
              筛选
            </Button>
          </Badge>
        </Col>
      </Row>
    </Card>
  )

  // 计算筛选条件数量
  const getFilterCount = () => {
    let count = 0
    if (selectedStatus) count++
    if (selectedType) count++
    if (selectedRegion) count++
    if (dateRange) count++
    return count
  }

  // 渲染计划卡片
  const renderPlanCard = (plan: StorePlan) => {
    const statusInfo = statusConfig[plan.status as keyof typeof statusConfig]
    const typeInfo = storeTypeConfig[plan.storeType as keyof typeof storeTypeConfig]
    const completionRate = getCompletionRate(plan)
    const isOverdue = plan.endDate && dayjs().isAfter(dayjs(plan.endDate)) && plan.status !== 'COMPLETED'

    return (
      <Card 
        key={plan.id}
        style={{ margin: '8px 16px' }}
        bodyStyle={{ padding: '12px' }}
        onClick={() => navigate(`/store-plan/${plan.id}`)}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: 8 }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 4 }}>
                {plan.title}
              </div>
              <Space size="small" wrap>
                <Tag color={typeInfo?.color}>{typeInfo?.text}</Tag>
                <Tag 
                  color={statusInfo?.color}
                  icon={statusInfo?.icon}
                >
                  {statusInfo?.text}
                </Tag>
                {plan.priority === 'URGENT' && (
                  <Tag color="red">紧急</Tag>
                )}
                {isOverdue && (
                  <Tag color="red">延期</Tag>
                )}
              </Space>
            </div>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                showPlanActions(plan)
              }}
            />
          </div>
        </div>

        {/* 进度条 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: '12px', color: '#666' }}>开店进度</Text>
            <Text style={{ fontSize: '12px', color: '#666' }}>
              {plan.completedCount}/{plan.plannedCount} 家
            </Text>
          </div>
          <Progress
            percent={completionRate}
            size="small"
            status={completionRate === 100 ? 'success' : 'active'}
            strokeColor={completionRate > 80 ? '#52c41a' : completionRate > 50 ? '#faad14' : '#f5222d'}
          />
        </div>

        {/* 详细信息 */}
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', fontSize: '12px' }}>地区</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                {plan.region?.name || '-'}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', fontSize: '12px' }}>预算</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1890ff' }}>
                {plan.budget ? `${(plan.budget.toNumber() / 10000).toFixed(1)}万` : '-'}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', fontSize: '12px' }}>负责人</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                {plan.createdBy?.name || '-'}
              </div>
            </div>
          </Col>
        </Row>

        {/* 时间信息 */}
        <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
          <Row>
            <Col span={12}>
              <Space size="small">
                <CalendarOutlined style={{ color: '#999', fontSize: '12px' }} />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  创建: {dayjs(plan.createdAt).format('MM-DD')}
                </Text>
              </Space>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              {plan.endDate && (
                <Space size="small">
                  <Text style={{ fontSize: '12px', color: isOverdue ? '#f5222d' : '#666' }}>
                    截止: {dayjs(plan.endDate).format('MM-DD')}
                  </Text>
                </Space>
              )}
            </Col>
          </Row>
        </div>
      </Card>
    )
  }

  // 显示计划操作菜单
  const showPlanActions = (plan: StorePlan) => {
    const items = [
      {
        key: 'view',
        label: '查看详情',
        icon: <EyeOutlined />
      },
      {
        key: 'edit',
        label: '编辑',
        icon: <EditOutlined />,
        disabled: plan.status === 'COMPLETED'
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        disabled: plan.status !== 'DRAFT'
      }
    ]

    Modal.confirm({
      title: plan.title,
      content: (
        <div style={{ marginTop: 16 }}>
          {items.map(item => (
            <Button
              key={item.key}
              type={item.danger ? 'primary' : 'default'}
              danger={item.danger}
              icon={item.icon}
              disabled={item.disabled}
              onClick={() => handlePlanAction(plan, item.key)}
              style={{ 
                width: '100%', 
                marginBottom: 8, 
                textAlign: 'left',
                justifyContent: 'flex-start'
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      ),
      footer: null,
      centered: true
    })
  }

  // 处理计划操作
  const handlePlanAction = (plan: StorePlan, action: string) => {
    Modal.destroyAll()
    
    switch (action) {
      case 'view':
        navigate(`/store-plan/${plan.id}`)
        break
      case 'edit':
        navigate(`/store-plan/${plan.id}/edit`)
        break
      case 'delete':
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除计划"${plan.title}"吗？`,
          onOk: async () => {
            try {
              // 调用删除API
              message.success('删除成功')
              refetch()
            } catch (error) {
              message.error('删除失败')
            }
          }
        })
        break
    }
  }

  // 加载更多数据
  const loadMore = async () => {
    if (!hasMore || isLoading) return
    
    setLoading(true)
    try {
      // 这里应该调用加载更多的API
      // 模拟延迟
      setTimeout(() => {
        setLoading(false)
        setHasMore(false) // 模拟没有更多数据
      }, 1000)
    } catch (error) {
      setLoading(false)
      message.error('加载失败')
    }
  }

  // 渲染筛选抽屉
  const renderFilterDrawer = () => (
    <Drawer
      title="筛选条件"
      placement="bottom"
      height="60%"
      open={filterVisible}
      onClose={() => setFilterVisible(false)}
      extra={
        <Button 
          size="small" 
          onClick={() => {
            setSelectedStatus(undefined)
            setSelectedType(undefined)
            setSelectedRegion(undefined)
            setDateRange(null)
          }}
        >
          重置
        </Button>
      }
    >
      <div style={{ padding: '0 8px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>状态</div>
          <Select
            placeholder="选择状态"
            style={{ width: '100%' }}
            value={selectedStatus}
            onChange={setSelectedStatus}
            allowClear
          >
            {Object.entries(statusConfig).map(([key, config]) => (
              <Option key={key} value={key}>
                <Tag color={config.color} icon={config.icon}>
                  {config.text}
                </Tag>
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>门店类型</div>
          <Select
            placeholder="选择类型"
            style={{ width: '100%' }}
            value={selectedType}
            onChange={setSelectedType}
            allowClear
          >
            {Object.entries(storeTypeConfig).map(([key, config]) => (
              <Option key={key} value={key}>
                <Tag color={config.color}>{config.text}</Tag>
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>创建时间</div>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
        </div>

        <Button
          type="primary"
          block
          onClick={() => {
            setFilterVisible(false)
            refetch()
          }}
        >
          应用筛选
        </Button>
      </div>
    </Drawer>
  )

  return (
    <div style={{ height: maxHeight, overflow: 'hidden' }}>
      {/* 头部标题 */}
      {showHeader && (
        <div style={{ 
          padding: '16px', 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            开店计划
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 搜索栏 */}
      {renderSearchBar()}

      {/* 计划列表 */}
      <div style={{ 
        height: showHeader ? 'calc(100vh - 200px)' : 'calc(100vh - 150px)', 
        overflow: 'auto',
        paddingBottom: 80
      }}>
        {plans.length > 0 ? (
          <>
            {plans.map(renderPlanCard)}
            
            {/* 无限滚动加载 */}
            <InfiniteScroll
              dataLength={plans.length}
              next={loadMore}
              hasMore={hasMore}
              loader={
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div>加载中...</div>
                </div>
              }
              endMessage={
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  <div>没有更多数据了</div>
                </div>
              }
            />
          </>
        ) : (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Empty 
              description={isLoading ? '加载中...' : '暂无开店计划'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>

      {/* 筛选抽屉 */}
      {renderFilterDrawer()}

      {/* 悬浮按钮 */}
      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => navigate('/store-plan/create')}
      />
    </div>
  )
}

export default MobilePlanList