/**
 * 移动端门店地图组件
 * 优化的地图可视化，支持触摸交互
 */
import React, { useState, useEffect } from 'react'
import { Card, Tag, Space, Typography, Empty, List, Drawer } from '@arco-design/web-react'
import { IconLocation, IconCheckCircle, IconClockCircle } from '@arco-design/web-react/icon'
import './MobileStoreMap.css'

const { Text, Title } = Typography

/**
 * 门店位置数据接口
 */
interface StoreLocation {
  id: number
  name: string
  code: string
  province: string
  city: string
  district: string
  address: string
  status: string
  store_type: string
  operation_mode: string
  opening_date?: string
  created_at: string
}

/**
 * 地图数据接口
 */
interface StoreMapData {
  stores: StoreLocation[]
  region_statistics: any[]
  status_statistics: Record<string, number>
  total_count: number
  last_updated: string
}

/**
 * 组件属性接口
 */
interface MobileStoreMapProps {
  data: StoreMapData
  filters?: any
}

/**
 * 状态配置
 */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  opened: { label: '已开业', color: 'green', icon: <IconCheckCircle /> },
  preparing: { label: '筹备中', color: 'orange', icon: <IconClockCircle /> },
  following: { label: '跟进中', color: 'blue', icon: <IconClockCircle /> },
  planned: { label: '计划中', color: 'gray', icon: <IconClockCircle /> },
}

/**
 * 移动端门店地图组件
 */
const MobileStoreMap: React.FC<MobileStoreMapProps> = ({ data, filters }) => {
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null)
  const [groupBy, setGroupBy] = useState<'province' | 'status'>('province')
  const [showDetail, setShowDetail] = useState(false)
  
  // 按省份分组
  const groupByProvince = () => {
    const grouped: Record<string, StoreLocation[]> = {}
    data.stores.forEach(store => {
      if (!grouped[store.province]) {
        grouped[store.province] = []
      }
      grouped[store.province].push(store)
    })
    return grouped
  }
  
  // 按状态分组
  const groupByStatus = () => {
    const grouped: Record<string, StoreLocation[]> = {}
    data.stores.forEach(store => {
      if (!grouped[store.status]) {
        grouped[store.status] = []
      }
      grouped[store.status].push(store)
    })
    return grouped
  }
  
  // 获取分组数据
  const getGroupedData = () => {
    return groupBy === 'province' ? groupByProvince() : groupByStatus()
  }
  
  // 处理门店点击
  const handleStoreClick = (store: StoreLocation) => {
    setSelectedStore(store)
    setShowDetail(true)
  }
  
  // 渲染状态统计
  const renderStatusStats = () => {
    return (
      <Card className="status-stats-card" bordered={false}>
        <Space wrap>
          {Object.entries(data.status_statistics).map(([status, count]) => {
            const config = STATUS_CONFIG[status] || { label: status, color: 'default', icon: null }
            return (
              <Tag key={status} color={config.color} icon={config.icon}>
                {config.label}: {count}
              </Tag>
            )
          })}
        </Space>
      </Card>
    )
  }
  
  // 渲染门店列表
  const renderStoreList = () => {
    const groupedData = getGroupedData()
    
    if (Object.keys(groupedData).length === 0) {
      return <Empty description="暂无门店数据" />
    }
    
    return (
      <div className="mobile-store-list">
        {Object.entries(groupedData).map(([groupKey, stores]) => (
          <Card 
            key={groupKey}
            className="store-group-card"
            title={
              <Space>
                <Text strong>{groupKey}</Text>
                <Tag>{stores.length}家</Tag>
              </Space>
            }
            bordered={false}
          >
            <List
              dataSource={stores}
              render={(store) => (
                <List.Item
                  key={store.id}
                  onClick={() => handleStoreClick(store)}
                  className="store-list-item"
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <IconLocation style={{ color: '#165DFF' }} />
                      <Text strong>{store.name}</Text>
                      <Tag color={STATUS_CONFIG[store.status]?.color || 'default'} size="small">
                        {STATUS_CONFIG[store.status]?.label || store.status}
                      </Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {store.city} {store.district} · {store.store_type}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        ))}
      </div>
    )
  }
  
  // 渲染门店详情抽屉
  const renderStoreDetail = () => {
    if (!selectedStore) return null
    
    return (
      <Drawer
        width="90%"
        title="门店详情"
        visible={showDetail}
        onCancel={() => setShowDetail(false)}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">门店名称</Text>
            <Title heading={6} style={{ margin: '4px 0' }}>{selectedStore.name}</Title>
          </div>
          
          <div>
            <Text type="secondary">门店编码</Text>
            <Text style={{ display: 'block', marginTop: 4 }}>{selectedStore.code}</Text>
          </div>
          
          <div>
            <Text type="secondary">门店状态</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color={STATUS_CONFIG[selectedStore.status]?.color || 'default'}>
                {STATUS_CONFIG[selectedStore.status]?.label || selectedStore.status}
              </Tag>
            </div>
          </div>
          
          <div>
            <Text type="secondary">门店地址</Text>
            <Text style={{ display: 'block', marginTop: 4 }}>
              {selectedStore.province} {selectedStore.city} {selectedStore.district}
            </Text>
            <Text style={{ display: 'block', marginTop: 4 }}>
              {selectedStore.address}
            </Text>
          </div>
          
          <div>
            <Text type="secondary">门店类型</Text>
            <Text style={{ display: 'block', marginTop: 4 }}>{selectedStore.store_type}</Text>
          </div>
          
          <div>
            <Text type="secondary">经营模式</Text>
            <Text style={{ display: 'block', marginTop: 4 }}>{selectedStore.operation_mode}</Text>
          </div>
          
          {selectedStore.opening_date && (
            <div>
              <Text type="secondary">开业日期</Text>
              <Text style={{ display: 'block', marginTop: 4 }}>
                {new Date(selectedStore.opening_date).toLocaleDateString('zh-CN')}
              </Text>
            </div>
          )}
        </Space>
      </Drawer>
    )
  }
  
  return (
    <div className="mobile-store-map">
      {/* 状态统计 */}
      {renderStatusStats()}
      
      {/* 分组切换 */}
      <Card bordered={false} style={{ marginTop: 12 }}>
        <Space>
          <Text>分组方式：</Text>
          <Tag 
            checkable 
            checked={groupBy === 'province'}
            onClick={() => setGroupBy('province')}
          >
            按省份
          </Tag>
          <Tag 
            checkable 
            checked={groupBy === 'status'}
            onClick={() => setGroupBy('status')}
          >
            按状态
          </Tag>
        </Space>
      </Card>
      
      {/* 门店列表 */}
      {renderStoreList()}
      
      {/* 门店详情 */}
      {renderStoreDetail()}
    </div>
  )
}

export default MobileStoreMap
