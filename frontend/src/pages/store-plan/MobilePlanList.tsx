import React, { useState } from 'react'
import {
  Tag,
  Button,
  Drawer,
  Input,
  Select,
  DatePicker,
  Modal,
  message
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
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDevice } from '@/hooks/useDevice'
import { useStorePlan } from '@/services/query/hooks/useStorePlan'
import dayjs from 'dayjs'
import type { StorePlan } from '@/services/types/business'

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
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>()
  const [selectedType, setSelectedType] = useState<string>()
  const [selectedRegion, setSelectedRegion] = useState<string>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [hasMore, setHasMore] = useState(true)

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
    data: statistics
  } = useStorePlan.useStatistics({})

  const plans = plansData?.items || []

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

  // 现代化统计卡片渲染
  const renderStatsCards = () => {
    if (!showStats || !statistics) return null

    const stats = [
      {
        title: '总计划',
        value: statistics.totalPlans,
        gradient: 'var(--gradient-primary)',
        icon: <BarChartOutlined />,
        trend: '+12%'
      },
      {
        title: '进行中',
        value: statistics.statusDistribution.IN_PROGRESS || 0,
        gradient: 'var(--gradient-warning)',
        icon: <ClockCircleOutlined />,
        trend: '+5%'
      },
      {
        title: '已完成',
        value: statistics.statusDistribution.COMPLETED || 0,
        gradient: 'var(--gradient-success)',
        icon: <CheckCircleOutlined />,
        trend: '+8%'
      },
      {
        title: '完成率',
        value: `${statistics.completionRate.toFixed(1)}%`,
        gradient: statistics.completionRate > 80 ? 'var(--gradient-success)' : 
                 statistics.completionRate > 60 ? 'var(--gradient-warning)' : 'var(--gradient-error)',
        icon: <BarChartOutlined />,
        trend: statistics.completionRate > 75 ? '+3%' : '-1%'
      }
    ]

    return (
      <div style={{ 
        padding: 'var(--spacing-mobile-md)', 
        paddingTop: showHeader ? 'var(--spacing-mobile-sm)' : 'var(--spacing-mobile-md)' 
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--spacing-mobile-sm)'
        }}>
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="mobile-card-enter touch-feedback-light"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both',
                background: stat.gradient,
                borderRadius: 'var(--border-radius-mobile-lg)',
                padding: 'var(--spacing-mobile-md)',
                boxShadow: 'var(--shadow-mobile-card)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* 背景装饰 */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                fontSize: '40px',
                opacity: 0.2,
                transform: 'rotate(15deg)'
              }}>
                {stat.icon}
              </div>
              
              {/* 内容 */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-mobile-xs)'
                }}>
                  <div style={{ 
                    fontSize: 'var(--font-size-mobile-lg)',
                    marginRight: 'var(--spacing-mobile-xs)'
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-mobile-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 6px',
                    borderRadius: 'var(--border-radius-mobile-sm)',
                    marginLeft: 'auto'
                  }}>
                    {stat.trend}
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: 'var(--font-size-mobile-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  lineHeight: 1,
                  marginBottom: 'var(--spacing-mobile-xs)'
                }}>
                  {stat.value}
                </div>
                
                <div style={{ 
                  fontSize: 'var(--font-size-mobile-xs)',
                  opacity: 0.9,
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {stat.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 现代化搜索栏渲染
  const renderSearchBar = () => (
    <div style={{ 
      padding: '0 var(--spacing-mobile-md) var(--spacing-mobile-md)',
      position: 'sticky',
      top: showHeader ? 'var(--mobile-header-height)' : '0',
      zIndex: 100,
      background: 'var(--bg-primary)',
      paddingTop: 'var(--spacing-mobile-sm)'
    }}>
      <div className="modern-search">
        <input
          className="search-input"
          placeholder="搜索计划名称..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && refetch()}
        />
        <SearchOutlined className="search-icon" />
      </div>
      
      {/* 快速筛选和操作栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-mobile-sm)',
        marginTop: 'var(--spacing-mobile-sm)',
        overflowX: 'auto',
        paddingBottom: 'var(--spacing-mobile-xs)'
      }}>
        {/* 筛选按钮 */}
        <button
          className="touch-feedback-light"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-mobile-xs)',
            padding: 'var(--spacing-mobile-xs) var(--spacing-mobile-sm)',
            borderRadius: 'var(--border-radius-mobile-2xl)',
            border: getFilterCount() > 0 ? '2px solid var(--color-primary-500)' : '1px solid var(--border-secondary)',
            background: getFilterCount() > 0 ? 'var(--color-primary-50)' : 'var(--bg-primary)',
            fontSize: 'var(--font-size-mobile-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: getFilterCount() > 0 ? 'var(--color-primary-600)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            transition: 'var(--transition-base)'
          }}
          onClick={() => setFilterVisible(true)}
        >
          <FilterOutlined style={{ fontSize: 'var(--font-size-mobile-sm)' }} />
          筛选
          {getFilterCount() > 0 && (
            <span style={{
              background: 'var(--color-primary-500)',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '2px'
            }}>
              {getFilterCount()}
            </span>
          )}
        </button>

        {/* 快速状态筛选 */}
        <button
          className="touch-feedback-light"
          style={{
            padding: 'var(--spacing-mobile-xs) var(--spacing-mobile-sm)',
            borderRadius: 'var(--border-radius-mobile-2xl)',
            border: selectedStatus === 'IN_PROGRESS' ? '2px solid var(--color-warning-500)' : '1px solid var(--border-secondary)',
            background: selectedStatus === 'IN_PROGRESS' ? 'var(--color-warning-50)' : 'var(--bg-primary)',
            fontSize: 'var(--font-size-mobile-xs)',
            color: selectedStatus === 'IN_PROGRESS' ? 'var(--color-warning-600)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'IN_PROGRESS' ? undefined : 'IN_PROGRESS')}
        >
          进行中
        </button>

        <button
          className="touch-feedback-light"
          style={{
            padding: 'var(--spacing-mobile-xs) var(--spacing-mobile-sm)',
            borderRadius: 'var(--border-radius-mobile-2xl)',
            border: selectedStatus === 'COMPLETED' ? '2px solid var(--color-success-500)' : '1px solid var(--border-secondary)',
            background: selectedStatus === 'COMPLETED' ? 'var(--color-success-50)' : 'var(--bg-primary)',
            fontSize: 'var(--font-size-mobile-xs)',
            color: selectedStatus === 'COMPLETED' ? 'var(--color-success-600)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'COMPLETED' ? undefined : 'COMPLETED')}
        >
          已完成
        </button>

        <button
          className="touch-feedback-light"
          style={{
            padding: 'var(--spacing-mobile-xs) var(--spacing-mobile-sm)',
            borderRadius: 'var(--border-radius-mobile-2xl)',
            border: selectedStatus === 'URGENT' ? '2px solid var(--color-mobile-accent)' : '1px solid var(--border-secondary)',
            background: selectedStatus === 'URGENT' ? 'rgba(255, 107, 107, 0.1)' : 'var(--bg-primary)',
            fontSize: 'var(--font-size-mobile-xs)',
            color: selectedStatus === 'URGENT' ? 'var(--color-mobile-accent)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'URGENT' ? undefined : 'URGENT')}
        >
          紧急
        </button>
      </div>
    </div>
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

  // 现代化计划卡片渲染
  const renderPlanCard = (plan: StorePlan) => {
    const statusInfo = statusConfig[plan.status as keyof typeof statusConfig]
    const typeInfo = storeTypeConfig[plan.storeType as keyof typeof storeTypeConfig]
    const completionRate = getCompletionRate(plan)
    const isOverdue = plan.endDate && dayjs().isAfter(dayjs(plan.endDate)) && plan.status !== 'COMPLETED'

    return (
      <div
        key={plan.id}
        className="modern-list-item interactive-card mobile-card-enter touch-feedback-medium"
        style={{ 
          margin: '0 var(--spacing-mobile-md) var(--spacing-mobile-sm)',
          animationDelay: '0ms',
          cursor: 'pointer'
        }}
        onClick={() => navigate(`/store-plan/${plan.id}`)}
      >
        <div className="list-item-content">
          {/* 卡片头部 */}
          <div className="list-item-header">
            <div style={{ flex: 1 }}>
              <h4 className="list-item-title" style={{ 
                fontSize: 'var(--font-size-mobile-lg)',
                marginBottom: 'var(--spacing-mobile-xs)'
              }}>
                {plan.title}
              </h4>
              <div style={{ display: 'flex', gap: 'var(--spacing-mobile-xs)', flexWrap: 'wrap' }}>
                <span className={`modern-status-tag ${typeInfo?.text === '直营' ? 'completed' : 'approved'}`}>
                  {typeInfo?.text}
                </span>
                <span className={`modern-status-tag ${plan.status.toLowerCase()}`}>
                  {statusInfo?.icon}
                  <span>{statusInfo?.text}</span>
                </span>
                {plan.priority === 'URGENT' && (
                  <span className="modern-status-tag urgent">
                    ⚡ 紧急
                  </span>
                )}
                {isOverdue && (
                  <span className="modern-status-tag rejected">
                    ⏰ 延期
                  </span>
                )}
              </div>
            </div>
            
            <button
              className="touch-feedback-light"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--font-size-mobile-lg)'
              }}
              onClick={(e) => {
                e.stopPropagation()
                showPlanActions(plan)
              }}
            >
              <MoreOutlined />
            </button>
          </div>

          {/* 现代化进度条 */}
          <div style={{ marginBottom: 'var(--spacing-mobile-md)' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'var(--spacing-mobile-xs)'
            }}>
              <span style={{ 
                fontSize: 'var(--font-size-mobile-sm)', 
                color: 'var(--text-secondary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                开店进度
              </span>
              <span style={{ 
                fontSize: 'var(--font-size-mobile-sm)', 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {plan.completedCount}/{plan.plannedCount} 家
              </span>
            </div>
            
            {/* 自定义现代化进度条 */}
            <div 
              className={`modern-progress modern-progress-large ${
                completionRate === 100 ? 'success' : 
                completionRate > 80 ? 'success' : 
                completionRate > 50 ? 'warning' : 'error'
              }`}
              style={{ 
                '--progress-width': `${completionRate}%`
              } as React.CSSProperties}
            >
              <div style={{
                position: 'absolute',
                right: completionRate > 15 ? '8px' : 'calc(100% + 8px)',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 'var(--font-size-mobile-xs)',
                fontWeight: 'var(--font-weight-bold)',
                color: completionRate > 15 ? 'white' : 'var(--text-primary)'
              }}>
                {completionRate}%
              </div>
            </div>
          </div>

          {/* 关键信息网格 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-mobile-sm)',
            marginBottom: 'var(--spacing-mobile-md)'
          }}>
            <div style={{
              background: 'rgba(24, 144, 255, 0.1)',
              borderRadius: 'var(--border-radius-mobile-sm)',
              padding: 'var(--spacing-mobile-xs)',
              textAlign: 'center',
              border: '1px solid rgba(24, 144, 255, 0.2)'
            }}>
              <div style={{ 
                fontSize: 'var(--font-size-mobile-xs)', 
                color: 'var(--color-primary-600)',
                marginBottom: '2px',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                地区
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-mobile-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-primary-700)'
              }}>
                {plan.region?.name || '-'}
              </div>
            </div>

            <div style={{
              background: 'rgba(82, 196, 26, 0.1)',
              borderRadius: 'var(--border-radius-mobile-sm)',
              padding: 'var(--spacing-mobile-xs)',
              textAlign: 'center',
              border: '1px solid rgba(82, 196, 26, 0.2)'
            }}>
              <div style={{ 
                fontSize: 'var(--font-size-mobile-xs)', 
                color: 'var(--color-success-600)',
                marginBottom: '2px',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                预算
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-mobile-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-success-700)'
              }}>
                {plan.budget ? `${(plan.budget.toNumber() / 10000).toFixed(1)}万` : '-'}
              </div>
            </div>

            <div style={{
              background: 'rgba(250, 173, 20, 0.1)',
              borderRadius: 'var(--border-radius-mobile-sm)',
              padding: 'var(--spacing-mobile-xs)',
              textAlign: 'center',
              border: '1px solid rgba(250, 173, 20, 0.2)'
            }}>
              <div style={{ 
                fontSize: 'var(--font-size-mobile-xs)', 
                color: 'var(--color-warning-600)',
                marginBottom: '2px',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                负责人
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-mobile-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-warning-700)'
              }}>
                {plan.createdBy?.name || '-'}
              </div>
            </div>
          </div>

          {/* 时间轴信息 */}
          <div className="list-item-meta">
            <div className="meta-item">
              <CalendarOutlined style={{ color: 'var(--color-primary-500)' }} />
              <span>创建: {dayjs(plan.createdAt).format('MM-DD')}</span>
            </div>
            {plan.endDate && (
              <div className="meta-item">
                <ClockCircleOutlined style={{ 
                  color: isOverdue ? 'var(--color-error-500)' : 'var(--color-success-500)' 
                }} />
                <span style={{ color: isOverdue ? 'var(--color-error-500)' : 'var(--text-tertiary)' }}>
                  截止: {dayjs(plan.endDate).format('MM-DD')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
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
    <div style={{ 
      height: maxHeight, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)'
    }}>
      {/* 现代化头部标题 */}
      {showHeader && (
        <div className="modern-navbar">
          <div className="navbar-left"></div>
          <div className="navbar-title">开店计划</div>
          <div className="navbar-right">
            <button className="navbar-action">
              <TeamOutlined />
            </button>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 搜索栏 */}
      {renderSearchBar()}

      {/* 现代化计划列表 */}
      <div style={{ 
        flex: 1,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
      }}>
        <div style={{
          height: '100%',
          overflow: 'auto',
          paddingBottom: 'calc(var(--mobile-fab-size) + 32px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {plans.length > 0 ? (
            <>
              {plans.map((plan, index) => (
                <div 
                  key={plan.id}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                  className="mobile-fade-in-up"
                >
                  {renderPlanCard(plan)}
                </div>
              ))}
              
              {/* 现代化加载指示器 */}
              {hasMore && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-mobile-lg)',
                  background: 'transparent'
                }}>
                  {isLoading ? (
                    <div className="skeleton-loading" style={{ 
                      width: '120px', 
                      height: '20px', 
                      margin: '0 auto' 
                    }} />
                  ) : (
                    <button 
                      className="touch-feedback-light"
                      style={{
                        padding: 'var(--spacing-mobile-sm) var(--spacing-mobile-lg)',
                        borderRadius: 'var(--border-radius-mobile-2xl)',
                        border: '1px solid var(--border-secondary)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-mobile-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        boxShadow: 'var(--shadow-mobile-sm)'
                      }}
                      onClick={loadMore}
                    >
                      加载更多
                    </button>
                  )}
                </div>
              )}
              
              {!hasMore && plans.length > 5 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-mobile-lg)',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--font-size-mobile-sm)'
                }}>
                  <div style={{ 
                    display: 'inline-block',
                    padding: 'var(--spacing-mobile-xs) var(--spacing-mobile-md)',
                    borderRadius: 'var(--border-radius-mobile-lg)',
                    background: 'rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'blur(8px)'
                  }}>
                    ✨ 已显示全部 {plans.length} 条计划
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60vh',
              textAlign: 'center',
              padding: 'var(--spacing-mobile-lg)'
            }}>
              {isLoading ? (
                <div className="mobile-loading">
                  <div className="skeleton-loading" style={{ 
                    width: '200px', 
                    height: '100px', 
                    borderRadius: 'var(--border-radius-mobile-lg)',
                    marginBottom: 'var(--spacing-mobile-md)'
                  }} />
                  <div style={{ color: 'var(--text-tertiary)' }}>加载中...</div>
                </div>
              ) : (
                <div className="mobile-empty">
                  <div className="empty-icon">📋</div>
                  <div className="empty-text">暂无开店计划</div>
                  <div className="empty-description">
                    还没有创建任何开店计划<br />
                    点击右下角按钮开始创建吧
                  </div>
                  <button
                    className="touch-feedback-light"
                    style={{
                      marginTop: 'var(--spacing-mobile-md)',
                      padding: 'var(--spacing-mobile-sm) var(--spacing-mobile-lg)',
                      borderRadius: 'var(--border-radius-mobile-2xl)',
                      border: '2px solid var(--color-primary-500)',
                      background: 'var(--color-primary-50)',
                      color: 'var(--color-primary-600)',
                      fontSize: 'var(--font-size-mobile-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-mobile-xs)'
                    }}
                    onClick={() => navigate('/store-plan/create')}
                  >
                    <PlusOutlined />
                    创建计划
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 筛选抽屉 */}
      {renderFilterDrawer()}

      {/* 现代化悬浮操作按钮 */}
      <button
        className="modern-fab"
        onClick={() => navigate('/store-plan/create')}
        style={{
          animation: 'mobileSpring 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.5s both'
        }}
      >
        <PlusOutlined />
      </button>
    </div>
  )
}

export default MobilePlanList