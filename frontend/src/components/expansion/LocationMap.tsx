import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Select,
  Input,
  Tooltip,
  Tag,
  Badge,
  Typography,
  Drawer,
  Rate,
  Switch,
  Slider,
  message
} from 'antd'
import {
  EnvironmentOutlined,
  SearchOutlined,
  FilterOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  AimOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useExpansionStore } from '@/stores/expansionStore'
import type { CandidateLocation } from '@/services/types'

const { Text, Title } = Typography
const { Search } = Input

interface LocationMapProps {
  height?: number
  showControls?: boolean
  onLocationClick?: (location: CandidateLocation) => void
  selectedLocationId?: string
}

const LocationMap: React.FC<LocationMapProps> = ({
  height = 600,
  showControls = true,
  onLocationClick,
  selectedLocationId
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<CandidateLocation | null>(null)
  const [mapType, setMapType] = useState<'normal' | 'satellite'>('normal')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [clusterMarkers, setClusterMarkers] = useState(true)
  const [filterRadius, setFilterRadius] = useState(5) // km

  const {
    candidateLocations,
    mapData: _mapData,
    isMapLoading,
    fetchMapData,
    fetchNearbyLocations
  } = useExpansionStore()

  // 初始化地图
  useEffect(() => {
    if (mapRef.current && !map) {
      // 这里应该集成实际的地图服务（如百度地图、高德地图等）
      // 为了演示，我们创建一个模拟的地图实例
      const mockMap = {
        center: { lat: 39.915, lng: 116.404 }, // 北京
        zoom: 12,
        setCenter: (center: any) => console.log('Set center:', center),
        setZoom: (zoom: number) => console.log('Set zoom:', zoom),
        addMarker: (marker: any) => console.log('Add marker:', marker),
        removeMarker: (marker: any) => console.log('Remove marker:', marker),
        clearMarkers: () => console.log('Clear all markers')
      }
      
      setMap(mockMap)
      loadMapData()
    }
  }, [mapRef.current])

  // 加载地图数据
  const loadMapData = async () => {
    try {
      await fetchMapData({
        longitude: 116.404,
        latitude: 39.915,
        radius: filterRadius * 1000,
        limit: 100
      })
    } catch (error) {
      message.error('加载地图数据失败')
    }
  }

  // 更新地图标记
  useEffect(() => {
    if (map && candidateLocations) {
      updateMapMarkers()
    }
  }, [map, candidateLocations, selectedLocationId])

  const updateMapMarkers = () => {
    // 清除现有标记
    markers.forEach(marker => map.removeMarker(marker))
    
    // 添加新标记
    const newMarkers = candidateLocations.map(location => {
      const marker = {
        id: location.id,
        position: location.coordinates,
        icon: getMarkerIcon(location),
        title: location.name,
        content: location,
        isSelected: location.id === selectedLocationId
      }
      
      map.addMarker(marker)
      return marker
    })
    
    setMarkers(newMarkers)
  }

  // 获取标记图标
  const getMarkerIcon = (location: CandidateLocation) => {
    const statusColors = {
      DISCOVERED: '#d9d9d9',
      INVESTIGATING: '#1890ff',
      NEGOTIATING: '#faad14',
      APPROVED: '#52c41a',
      REJECTED: '#f5222d',
      SIGNED: '#722ed1'
    }

    const prioritySize = {
      LOW: 'small',
      MEDIUM: 'normal',
      HIGH: 'large',
      URGENT: 'xlarge'
    }

    return {
      color: statusColors[location.status],
      size: prioritySize[location.priority],
      isSelected: location.id === selectedLocationId
    }
  }

  // 地图控制功能
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.zoom + 1)
    }
  }

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.zoom - 1)
    }
  }

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map?.setCenter({ lat: latitude, lng: longitude })
          fetchNearbyLocations({ longitude, latitude, radius: filterRadius * 1000 })
        },
        () => {
          message.error('无法获取您的位置')
        }
      )
    } else {
      message.error('您的浏览器不支持地理定位')
    }
  }

  const handleSearch = async (address: string) => {
    if (!address.trim()) return
    
    try {
      // 这里应该调用地图服务的地址解析API
      // const coords = await geocodeAddress(address)
      // map?.setCenter(coords)
      message.info(`搜索: ${address}`)
    } catch (error) {
      message.error('地址搜索失败')
    }
  }

  const handleLocationClick = (location: CandidateLocation) => {
    setSelectedLocation(location)
    onLocationClick?.(location)
  }

  // 状态映射
  const statusMap = {
    DISCOVERED: { color: 'default', text: '已发现' },
    INVESTIGATING: { color: 'processing', text: '调研中' },
    NEGOTIATING: { color: 'warning', text: '谈判中' },
    APPROVED: { color: 'success', text: '已通过' },
    REJECTED: { color: 'error', text: '已拒绝' },
    SIGNED: { color: 'success', text: '已签约' }
  }

  const renderMapControls = () => (
    <div style={{ 
      position: 'absolute', 
      top: 16, 
      left: 16, 
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      borderRadius: 8,
      padding: 8
    }}>
      <Space direction="vertical" size="small">
        {/* 搜索框 */}
        <Search
          placeholder="搜索地址"
          onSearch={handleSearch}
          style={{ width: 250 }}
          enterButton={<SearchOutlined />}
        />
        
        {/* 图层控制 */}
        <Space wrap>
          <Select
            value={mapType}
            onChange={setMapType}
            style={{ width: 100 }}
            size="small"
          >
            <Select.Option value="normal">标准</Select.Option>
            <Select.Option value="satellite">卫星</Select.Option>
          </Select>
          
          <Tooltip title="热力图">
            <Button 
              size="small"
              type={showHeatmap ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setShowHeatmap(!showHeatmap)}
            />
          </Tooltip>
          
          <Tooltip title="筛选">
            <Button 
              size="small"
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(true)}
            />
          </Tooltip>
          
          <Tooltip title="设置">
            <Button 
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(true)}
            />
          </Tooltip>
        </Space>
      </Space>
    </div>
  )

  const renderZoomControls = () => (
    <div style={{ 
      position: 'absolute', 
      top: 16, 
      right: 16, 
      zIndex: 1000 
    }}>
      <Space direction="vertical">
        <Tooltip title="放大" placement="left">
          <Button 
            shape="circle" 
            icon={<ZoomInOutlined />} 
            onClick={handleZoomIn}
            style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
          />
        </Tooltip>
        <Tooltip title="缩小" placement="left">
          <Button 
            shape="circle" 
            icon={<ZoomOutOutlined />} 
            onClick={handleZoomOut}
            style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
          />
        </Tooltip>
        <Tooltip title="定位" placement="left">
          <Button 
            shape="circle" 
            icon={<AimOutlined />} 
            onClick={handleLocateMe}
            style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
          />
        </Tooltip>
        <Tooltip title="全屏" placement="left">
          <Button 
            shape="circle" 
            icon={<FullscreenOutlined />} 
            onClick={() => {
              if (mapRef.current) {
                if (mapRef.current.requestFullscreen) {
                  mapRef.current.requestFullscreen()
                }
              }
            }}
            style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
          />
        </Tooltip>
      </Space>
    </div>
  )

  const renderStatusLegend = () => (
    <div style={{ 
      position: 'absolute', 
      bottom: 16, 
      left: 16, 
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      borderRadius: 8,
      padding: 12
    }}>
      <Title level={5} style={{ margin: 0, marginBottom: 8 }}>图例</Title>
      <Space direction="vertical" size="small">
        {Object.entries(statusMap).map(([status, config]) => (
          <Space key={status} size="small">
            <Badge color={config.color === 'default' ? '#d9d9d9' : undefined} />
            <Text style={{ fontSize: 12 }}>{config.text}</Text>
          </Space>
        ))}
      </Space>
    </div>
  )

  const renderStatistics = () => {
    const stats = candidateLocations.reduce((acc, location) => {
      acc[location.status] = (acc[location.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return (
      <div style={{ 
        position: 'absolute', 
        bottom: 16, 
        right: 16, 
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: 12,
        minWidth: 200
      }}>
        <Title level={5} style={{ margin: 0, marginBottom: 8 }}>统计信息</Title>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>总数</Text>
            <Text strong>{candidateLocations.length}</Text>
          </div>
          {Object.entries(stats).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{statusMap[status as keyof typeof statusMap]?.text}</Text>
              <Text>{count}</Text>
            </div>
          ))}
        </Space>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <Card 
        style={{ height: height + 40 }}
        bodyStyle={{ padding: 0, height }}
        loading={isMapLoading}
      >
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            background: '#f0f2f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: '#999'
          }}
        >
          {/* 这里应该是实际的地图组件 */}
          <div>
            <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>地图组件 ({candidateLocations.length} 个候选点位)</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              集成地图服务后将显示实际地图内容
            </div>
          </div>
        </div>

        {/* 地图控件 */}
        {showControls && (
          <>
            {renderMapControls()}
            {renderZoomControls()}
            {renderStatusLegend()}
            {renderStatistics()}
          </>
        )}
      </Card>

      {/* 筛选抽屉 */}
      <Drawer
        title="地图筛选"
        placement="left"
        open={showFilters}
        onClose={() => setShowFilters(false)}
        width={320}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>状态筛选</Text>
            <Select
              mode="multiple"
              placeholder="选择状态"
              style={{ width: '100%', marginTop: 8 }}
              options={Object.entries(statusMap).map(([value, config]) => ({
                label: config.text,
                value
              }))}
            />
          </div>

          <div>
            <Text strong>优先级筛选</Text>
            <Select
              mode="multiple"
              placeholder="选择优先级"
              style={{ width: '100%', marginTop: 8 }}
              options={[
                { label: '紧急', value: 'URGENT' },
                { label: '高', value: 'HIGH' },
                { label: '中', value: 'MEDIUM' },
                { label: '低', value: 'LOW' }
              ]}
            />
          </div>

          <div>
            <Text strong>搜索半径 ({filterRadius}km)</Text>
            <Slider
              min={1}
              max={20}
              value={filterRadius}
              onChange={setFilterRadius}
              marks={{
                1: '1km',
                5: '5km',
                10: '10km',
                20: '20km'
              }}
              style={{ marginTop: 16 }}
            />
          </div>

          <Button type="primary" block onClick={loadMapData}>
            应用筛选
          </Button>
        </Space>
      </Drawer>

      {/* 设置抽屉 */}
      <Drawer
        title="地图设置"
        placement="right"
        open={showSettings}
        onClose={() => setShowSettings(false)}
        width={320}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>聚合标记</Text>
            <Switch checked={clusterMarkers} onChange={setClusterMarkers} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>显示热力图</Text>
            <Switch checked={showHeatmap} onChange={setShowHeatmap} />
          </div>

          <div>
            <Text strong>地图类型</Text>
            <Select
              value={mapType}
              onChange={setMapType}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="normal">标准地图</Select.Option>
              <Select.Option value="satellite">卫星地图</Select.Option>
            </Select>
          </div>

          <Button block onClick={loadMapData} loading={isMapLoading}>
            <ReloadOutlined /> 刷新地图
          </Button>
        </Space>
      </Drawer>

      {/* 选中点位详情 */}
      {selectedLocation && (
        <Card
          size="small"
          style={{
            position: 'absolute',
            top: 100,
            right: 16,
            width: 300,
            zIndex: 1000
          }}
          title={selectedLocation.name}
          extra={
            <Button 
              type="text" 
              size="small"
              onClick={() => setSelectedLocation(null)}
            >
              ×
            </Button>
          }
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">状态</Text>
              <Tag color={statusMap[selectedLocation.status]?.color}>
                {statusMap[selectedLocation.status]?.text}
              </Tag>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">面积</Text>
              <Text>{selectedLocation.area}㎡</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">租金</Text>
              <Text>¥{selectedLocation.rent ? (selectedLocation.rent / 10000).toFixed(1) : '待定'}万/月</Text>
            </div>

            {selectedLocation.score && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">评分</Text>
                <Rate disabled value={selectedLocation.score / 2} allowHalf />
              </div>
            )}

            <Button 
              type="primary" 
              block 
              size="small"
              onClick={() => handleLocationClick(selectedLocation)}
            >
              查看详情
            </Button>
          </Space>
        </Card>
      )}
    </div>
  )
}

export default LocationMap