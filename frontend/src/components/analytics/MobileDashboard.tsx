/**
 * 移动端经营大屏组件
 * 专为移动设备优化的数据可视化界面
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Grid,
  Statistic,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Empty,
  Tabs,
  Badge,
  Drawer,
  Message
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconFullscreen,
  IconFilter,
  IconHome,
  IconLocation
} from '@arco-design/web-react/icon'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useMobileNotification } from '../../hooks/useMobileNotification'
import { offlineCache, CACHE_STORES, CACHE_EXPIRY } from '../../utils/offlineCache'
import MobileStoreMap from './MobileStoreMap'
import MobileFunnelChart from './MobileFunnelChart'
import MobilePlanProgress from './MobilePlanProgress'
import './MobileDashboard.css'

const { Row, Col } = Grid
const { Title, Text } = Typography
const TabPane = Tabs.TabPane

/**
 * 数据筛选条件接口
 */
interface DataFilters {
  region?: number
  timeRange?: [string, string]
  storeType?: string
}

/**
 * 大屏数据接口
 */
interface DashboardData {
  store_map: any
  follow_up_funnel: any
  plan_progress: any
  key_metrics: {
    total_stores: number
    operating_stores: number
    follow_up_count: number
    construction_count: number
    new_stores_this_month: number
  }
  last_updated: string
}

/**
 * 组件属性接口
 */
interface MobileDashboardProps {
  refreshInterval?: number // 自动刷新间隔（毫秒）
  enableNotifications?: boolean // 是否启用通知
}

/**
 * 移动端经营大屏组件
 */
const MobileDashboard: React.FC<MobileDashboardProps> = ({
  refreshInterval = 300000, // 默认5分钟
  enableNotifications = true
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [filters] = useState<DataFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const refreshTimerRef = useRef<ReturnType<typeof setInterval>>()
  
  // 网络状态
  const { isOnline } = useNetworkStatus()
  
  // 通知服务
  const { notifyDataUpdate, notifyWarning } = useMobileNotification({
    autoRequestPermission: enableNotifications,
    enableDataUpdateNotification: enableNotifications
  })
  
  // 从缓存加载数据
  const loadFromCache = async () => {
    try {
      const cachedData = await offlineCache.get<DashboardData>(
        CACHE_STORES.STATISTICS,
        'mobile_dashboard_data'
      )
      if (cachedData) {
        setDashboardData(cachedData)
        setFromCache(true)
        setLastUpdated(new Date().toISOString())
        return true
      }
      return false
    } catch (error) {
      console.error('从缓存加载数据失败:', error)
      return false
    }
  }
  
  // 从网络获取数据
  const fetchFromNetwork = async () => {
    if (!isOnline) {
      Message.warning('网络未连接，使用缓存数据')
      return false
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/analytics/dashboard/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (!response.ok) throw new Error('获取数据失败')
      const result = await response.json()
      
      setDashboardData(result.data)
      setFromCache(false)
      setLastUpdated(new Date().toISOString())
      
      // 保存到缓存
      await offlineCache.set(
        CACHE_STORES.STATISTICS,
        'mobile_dashboard_data',
        result.data,
        CACHE_EXPIRY.MEDIUM
      )
      
      // 发送数据更新通知
      if (enableNotifications) {
        await notifyDataUpdate('经营大屏', '数据已更新')
      }
      
      // 检查预警
      if (result.data.follow_up_funnel?.warning_stages?.length > 0) {
        await notifyWarning(
          '转化率预警',
          `${result.data.follow_up_funnel.warning_stages.length}个阶段转化率异常`
        )
      }
      
      return true
    } catch (error) {
      console.error('从网络获取数据失败:', error)
      // 网络请求失败，尝试使用缓存
      const hasCachedData = await loadFromCache()
      if (hasCachedData) {
        Message.info('网络请求失败，已加载缓存数据')
      } else {
        Message.error('加载数据失败')
      }
      return false
    } finally {
      setLoading(false)
    }
  }
  
  // 刷新数据
  const refresh = async () => {
    if (isOnline) {
      return await fetchFromNetwork()
    } else {
      return await loadFromCache()
    }
  }
  
  // 初始化数据加载
  useEffect(() => {
    const initData = async () => {
      // 先尝试从缓存加载
      await loadFromCache()
      // 如果在线，尝试从网络获取最新数据
      if (isOnline) {
        await fetchFromNetwork()
      }
    }
    initData()
  }, [isOnline])
  
  // 自动刷新
  useEffect(() => {
    if (refreshInterval > 0 && isOnline) {
      refreshTimerRef.current = setInterval(() => {
        refresh()
      }, refreshInterval)
      
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current)
        }
      }
    }
  }, [refreshInterval, isOnline, refresh])
  
  // 手动刷新
  const handleRefresh = async () => {
    try {
      await refresh()
      Message.success('数据已更新')
    } catch (error) {
      Message.error('刷新失败，请稍后重试')
    }
  }
  
  // 切换全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
  
  // 渲染关键指标卡片
  const renderKeyMetrics = () => {
    if (!dashboardData?.key_metrics) return null
    
    const { key_metrics } = dashboardData
    
    return (
      <div className="mobile-dashboard-metrics">
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Card className="metric-card" bordered={false}>
              <Statistic
                title="门店总数"
                value={key_metrics.total_stores}
                suffix="家"
                style={{ color: '#165DFF' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="metric-card" bordered={false}>
              <Statistic
                title="运营中"
                value={key_metrics.operating_stores}
                suffix="家"
                style={{ color: '#00B42A' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="metric-card" bordered={false}>
              <Statistic
                title="跟进中"
                value={key_metrics.follow_up_count}
                suffix="个"
                style={{ color: '#FF7D00' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="metric-card" bordered={false}>
              <Statistic
                title="筹备中"
                value={key_metrics.construction_count}
                suffix="个"
                style={{ color: '#722ED1' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Card className="highlight-card" bordered={false} style={{ marginTop: 8 }}>
          <Space>
            <Badge status="success" />
            <Text>本月新增门店：</Text>
            <Text style={{ fontSize: 18, color: '#00B42A', fontWeight: 'bold' }}>
              {key_metrics.new_stores_this_month}
            </Text>
            <Text>家</Text>
          </Space>
        </Card>
      </div>
    )
  }
  
  // 渲染概览标签页
  const renderOverviewTab = () => {
    return (
      <div className="mobile-dashboard-overview">
        {renderKeyMetrics()}
        
        {dashboardData?.plan_progress && (
          <Card 
            title="计划完成进度" 
            bordered={false}
            style={{ marginTop: 12 }}
          >
            <MobilePlanProgress data={dashboardData.plan_progress} />
          </Card>
        )}
        
        {dashboardData?.follow_up_funnel && (
          <Card 
            title="跟进漏斗" 
            bordered={false}
            style={{ marginTop: 12 }}
          >
            <MobileFunnelChart data={dashboardData.follow_up_funnel} />
          </Card>
        )}
      </div>
    )
  }
  
  // 渲染地图标签页
  const renderMapTab = () => {
    if (!dashboardData?.store_map) return <Empty description="暂无地图数据" />
    
    return (
      <div className="mobile-dashboard-map">
        <MobileStoreMap 
          data={dashboardData.store_map}
          filters={filters}
        />
      </div>
    )
  }
  
  // 渲染筛选抽屉
  const renderFilterDrawer = () => {
    return (
      <Drawer
        width="80%"
        title="数据筛选"
        visible={showFilters}
        onCancel={() => setShowFilters(false)}
        footer={
          <Space>
            <Button onClick={() => setShowFilters(false)}>取消</Button>
            <Button 
              type="primary" 
              onClick={() => {
                setShowFilters(false)
                refresh()
              }}
            >
              应用筛选
            </Button>
          </Space>
        }
      >
        {/* 筛选表单内容 */}
        <div>筛选功能待实现</div>
      </Drawer>
    )
  }
  
  // 加载状态
  if (loading && !dashboardData) {
    return (
      <div className="mobile-dashboard-loading">
        <Spin size={40} />
        <Text style={{ marginTop: 16 }}>加载中...</Text>
      </div>
    )
  }
  
  // 无数据状态
  if (!dashboardData) {
    return (
      <div className="mobile-dashboard-empty">
        <Empty description="暂无数据" />
        <Button 
          type="primary" 
          onClick={handleRefresh}
          style={{ marginTop: 16 }}
        >
          重新加载
        </Button>
      </div>
    )
  }
  
  return (
    <div className="mobile-dashboard">
      {/* 顶部工具栏 */}
      <div className="mobile-dashboard-header">
        <Space>
          <Title heading={5} style={{ margin: 0 }}>经营大屏</Title>
          {fromCache && (
            <Badge status="warning" text="离线数据" />
          )}
          {!isOnline && (
            <Badge status="error" text="离线模式" />
          )}
        </Space>
        
        <Space>
          <Button 
            icon={<IconRefresh />} 
            onClick={handleRefresh}
            loading={loading}
            size="small"
          />
          <Button 
            icon={<IconFilter />} 
            onClick={() => setShowFilters(true)}
            size="small"
          />
          <Button 
            icon={<IconFullscreen />} 
            onClick={toggleFullscreen}
            size="small"
          />
        </Space>
      </div>
      
      {/* 更新时间提示 */}
      {lastUpdated && (
        <Alert
          type="info"
          content={`最后更新：${new Date(lastUpdated).toLocaleString('zh-CN')}`}
          closable
          style={{ margin: '8px 0' }}
        />
      )}
      
      {/* 标签页内容 */}
      <Tabs 
        activeTab={activeTab} 
        onChange={setActiveTab}
        type="rounded"
      >
        <TabPane key="overview" title={
          <span>
            <IconHome style={{ marginRight: 4 }} />
            概览
          </span>
        }>
          {renderOverviewTab()}
        </TabPane>
        
        <TabPane key="map" title={
          <span>
            <IconLocation style={{ marginRight: 4 }} />
            地图
          </span>
        }>
          {renderMapTab()}
        </TabPane>
      </Tabs>
      
      {/* 筛选抽屉 */}
      {renderFilterDrawer()}
    </div>
  )
}

export default MobileDashboard
