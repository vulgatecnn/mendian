/**
 * 开店地图可视化组件
 */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Card, Select, Button, Space, Typography, Alert, Spin } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StoreMapData, DataFilters } from '../../api/analyticsService'
import styles from './StoreMapVisualization.module.css'

const { Text } = Typography

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// 门店状态图标配置
const storeStatusIcons = {
  planned: {
    color: '#1890ff',
    icon: '📋',
    label: '计划中'
  },
  expanding: {
    color: '#faad14',
    icon: '🔍',
    label: '拓店中'
  },
  preparing: {
    color: '#722ed1',
    icon: '🏗️',
    label: '筹备中'
  },
  opened: {
    color: '#52c41a',
    icon: '🏪',
    label: '已开店'
  }
}

// 创建自定义图标
const createCustomIcon = (status: keyof typeof storeStatusIcons) => {
  const config = storeStatusIcons[status]
  return L.divIcon({
    html: `
      <div style="
        background-color: ${config.color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${config.icon}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

interface StoreMapVisualizationProps {
  data?: StoreMapData
  loading?: boolean
  error?: Error | null
  filters?: DataFilters
  onFiltersChange?: (filters: DataFilters) => void
  onRefresh?: () => void
  className?: string
}

/**
 * 地图控制组件 - 用于动态调整地图视图
 */
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  
  return null
}

/**
 * 开店地图可视化组件
 */
const StoreMapVisualization: React.FC<StoreMapVisualizationProps> = ({
  data,
  loading = false,
  error,
  filters,
  onFiltersChange,
  onRefresh,
  className
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>()
  const [selectedStatus, setSelectedStatus] = useState<string>()
  const mapRef = useRef<L.Map | null>(null)

  // 处理筛选变化
  const handleFilterChange = (key: string, value: any) => {
    if (!onFiltersChange) return

    const newFilters = { ...filters }
    
    if (key === 'region') {
      setSelectedRegion(value)
      if (value) {
        newFilters.regionIds = [parseInt(value)]
      } else {
        delete newFilters.regionIds
      }
    } else if (key === 'status') {
      setSelectedStatus(value)
      if (value) {
        newFilters.storeTypes = [value]
      } else {
        delete newFilters.storeTypes
      }
    }
    
    onFiltersChange(newFilters)
  }

  // 过滤门店数据
  const filteredStores = useMemo(() => {
    if (!data?.stores) return []
    
    return data.stores.filter(store => {
      if (selectedRegion && store.region !== selectedRegion) {
        return false
      }
      if (selectedStatus && store.status !== selectedStatus) {
        return false
      }
      return true
    })
  }, [data?.stores, selectedRegion, selectedStatus])

  // 计算统计数据
  const statistics = useMemo(() => {
    const stats = {
      total: filteredStores.length,
      planned: 0,
      expanding: 0,
      preparing: 0,
      opened: 0
    }
    
    filteredStores.forEach(store => {
      stats[store.status]++
    })
    
    return stats
  }, [filteredStores])

  // 获取可用区域列表
  const availableRegions = useMemo(() => {
    if (!data?.regions) return []
    return data.regions.map(region => ({
      label: region.regionName,
      value: region.regionId
    }))
  }, [data?.regions])

  // 渲染统计图例
  const renderLegend = () => (
    <div className={styles.legend}>
      <div className={styles.legendTitle}>门店状态统计</div>
      <div className={styles.legendItems}>
        {Object.entries(storeStatusIcons).map(([status, config]) => (
          <div key={status} className={styles.legendItem}>
            <div 
              className={styles.legendIcon}
              style={{ backgroundColor: config.color }}
            >
              {config.icon}
            </div>
            <span className={styles.legendLabel}>{config.label}</span>
            <span className={styles.legendCount}>
              {statistics[status as keyof typeof statistics]}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.legendTotal}>
        <Text style={{ fontWeight: 'bold' }}>总计: {statistics.total} 家</Text>
      </div>
    </div>
  )

  // 渲染筛选器
  const renderFilters = () => (
    <div className={styles.filters}>
      <Space>
        <Select
          placeholder="选择区域"
          allowClear
          style={{ width: 150 }}
          value={selectedRegion}
          onChange={(value) => handleFilterChange('region', value)}
        >
          {availableRegions.map(region => (
            <Select.Option key={region.value} value={region.value}>
              {region.label}
            </Select.Option>
          ))}
        </Select>
        
        <Select
          placeholder="门店状态"
          allowClear
          style={{ width: 120 }}
          value={selectedStatus}
          onChange={(value) => handleFilterChange('status', value)}
        >
          {Object.entries(storeStatusIcons).map(([status, config]) => (
            <Select.Option key={status} value={status}>
              {config.label}
            </Select.Option>
          ))}
        </Select>
        
        <Button
          icon={<IconRefresh />}
          onClick={onRefresh}
          loading={loading}
        >
          刷新
        </Button>
      </Space>
    </div>
  )

  // 错误状态
  if (error) {
    return (
      <Card className={className}>
        <Alert
          type="error"
          title="地图数据加载失败"
          content={error.message}
          showIcon
          action={
            <Button size="small" onClick={onRefresh}>
              重试
            </Button>
          }
        />
      </Card>
    )
  }

  // 加载状态
  if (loading && !data) {
    return (
      <Card className={className}>
        <div className={styles.loadingContainer}>
          <Spin size={40} />
          <Text style={{ marginTop: 16 }}>正在加载地图数据...</Text>
        </div>
      </Card>
    )
  }

  // 无数据状态
  if (!data || !data.stores.length) {
    return (
      <Card className={className}>
        <div className={styles.emptyContainer}>
          <Text>暂无门店数据</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card 
      className={`${styles.mapCard} ${className || ''}`}
      title="开店地图"
      extra={renderFilters()}
    >
      <div className={styles.mapContainer}>
        <div className={styles.mapWrapper}>
          <MapContainer
            center={data.mapCenter}
            zoom={data.zoomLevel}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={data.mapCenter} zoom={data.zoomLevel} />
            
            {filteredStores.map((store) => (
              <Marker
                key={store.id}
                position={store.coordinates}
                icon={createCustomIcon(store.status)}
              >
                <Popup>
                  <div className={styles.popup}>
                    <div className={styles.popupTitle}>{store.name}</div>
                    <div className={styles.popupContent}>
                      <div className={styles.popupItem}>
                        <Text>状态: </Text>
                        <Text style={{ color: storeStatusIcons[store.status].color }}>
                          {storeStatusIcons[store.status].label}
                        </Text>
                      </div>
                      <div className={styles.popupItem}>
                        <Text>区域: {store.region}</Text>
                      </div>
                      <div className={styles.popupItem}>
                        <Text>类型: {store.storeType}</Text>
                      </div>
                      <div className={styles.popupItem}>
                        <Text>地址: {store.address}</Text>
                      </div>
                      {store.openDate && (
                        <div className={styles.popupItem}>
                          <Text>开业日期: {store.openDate}</Text>
                        </div>
                      )}
                      {store.progress !== undefined && (
                        <div className={styles.popupItem}>
                          <Text>进度: {store.progress}%</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        <div className={styles.sidebar}>
          {renderLegend()}
          
          {data.lastUpdated && (
            <div className={styles.updateTime}>
              <Text type="secondary">
                最后更新: {new Date(data.lastUpdated).toLocaleString()}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StoreMapVisualization