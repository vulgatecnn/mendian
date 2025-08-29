import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Select,
  Tag,
  Drawer,
  Descriptions,
  Rate,
  Typography,
  Row,
  Col,
  Statistic,
  Switch,
  Slider,
  Badge,
  Modal,
  message,
  Tooltip,
  Avatar,
  Timeline
} from 'antd'
import {
  EnvironmentOutlined,
  FilterOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  PhoneOutlined,
  HomeOutlined,
  DollarOutlined,
  StarOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  SearchOutlined,
  LayersOutlined,
  HeatMapOutlined,
  AimOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { Option } = Select

// 定义地图点位数据结构
interface MapLocation {
  id: string
  name: string
  address: string
  coordinates: [number, number] // [经度, 纬度]
  status: 'PENDING' | 'EVALUATING' | 'FOLLOWING' | 'NEGOTIATING' | 'CONTRACTED' | 'REJECTED' | 'SUSPENDED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  evaluationScore?: number
  rentPrice?: number
  area?: number
  regionName: string
  storePlanTitle?: string
  followUpCount: number
  discoveryDate: string
  expectedSignDate?: string
  landlordName?: string
  landlordPhone?: string
  notes?: string
}

// 地图配置
interface MapConfig {
  showHeatmap: boolean
  showClusters: boolean
  showCompetitors: boolean
  showTraffic: boolean
  filterByStatus: string[]
  filterByPriority: string[]
  scoreRange: [number, number]
  rentRange: [number, number]
}

const ExpansionMap: React.FC = () => {
  const navigate = useNavigate()
  const mapRef = useRef<any>(null)
  const [map, setMap] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [mapConfig, setMapConfig] = useState<MapConfig>({
    showHeatmap: false,
    showClusters: true,
    showCompetitors: false,
    showTraffic: false,
    filterByStatus: [],
    filterByPriority: [],
    scoreRange: [0, 10],
    rentRange: [0, 100000]
  })

  // Mock 数据
  const mockLocations: MapLocation[] = [
    {
      id: '1',
      name: '万达广场A区候选点位',
      address: '北京市海淀区中关村大街1号万达广场A区1F-08',
      coordinates: [116.311, 39.9775], // 中关村坐标
      status: 'FOLLOWING',
      priority: 'HIGH',
      evaluationScore: 8.5,
      rentPrice: 25000,
      area: 120,
      regionName: '海淀区',
      storePlanTitle: '2024年北京地区扩张计划',
      followUpCount: 5,
      discoveryDate: '2024-01-15T10:30:00Z',
      expectedSignDate: '2024-03-15T00:00:00Z',
      landlordName: '王老板',
      landlordPhone: '13800138001',
      notes: '人流量大，但租金偏高，需要进一步谈判'
    },
    {
      id: '2',
      name: '银泰城B座潜力点位',
      address: '北京市东城区王府井大街100号银泰城B座2F-15',
      coordinates: [116.4074, 39.9093], // 王府井坐标
      status: 'NEGOTIATING',
      priority: 'URGENT',
      evaluationScore: 9.2,
      rentPrice: 18000,
      area: 85,
      regionName: '东城区',
      storePlanTitle: '2024年北京地区扩张计划',
      followUpCount: 8,
      discoveryDate: '2024-01-20T14:20:00Z',
      expectedSignDate: '2024-02-28T00:00:00Z',
      landlordName: '李经理',
      landlordPhone: '13800138002',
      notes: '地理位置极佳，正在商务谈判中'
    },
    {
      id: '3',
      name: '朝阳大悦城潜在店铺',
      address: '北京市朝阳区朝阳北路101号朝阳大悦城3F',
      coordinates: [116.4871, 39.9171], // 朝阳大悦城坐标
      status: 'EVALUATING',
      priority: 'MEDIUM',
      evaluationScore: 7.8,
      rentPrice: 22000,
      area: 95,
      regionName: '朝阳区',
      followUpCount: 3,
      discoveryDate: '2024-02-01T09:15:00Z',
      landlordName: '张总',
      landlordPhone: '13800138003',
      notes: '新开发商圈，潜力较大'
    },
    {
      id: '4',
      name: '西单大悦城商铺',
      address: '北京市西城区西单北大街131号西单大悦城4F',
      coordinates: [116.3732, 39.9059], // 西单坐标
      status: 'CONTRACTED',
      priority: 'HIGH',
      evaluationScore: 9.5,
      rentPrice: 35000,
      area: 150,
      regionName: '西城区',
      storePlanTitle: '2024年北京地区扩张计划',
      followUpCount: 12,
      discoveryDate: '2023-12-10T16:30:00Z',
      expectedSignDate: '2024-01-30T00:00:00Z',
      landlordName: '陈女士',
      landlordPhone: '13800138004',
      notes: '已成功签约，准备进入装修阶段'
    }
  ]

  // 状态映射
  const statusMap = {
    PENDING: { color: '#d9d9d9', text: '待评估', icon: <SearchOutlined /> },
    EVALUATING: { color: '#1890ff', text: '评估中', icon: <SearchOutlined /> },
    FOLLOWING: { color: '#faad14', text: '跟进中', icon: <PhoneOutlined /> },
    NEGOTIATING: { color: '#fa8c16', text: '谈判中', icon: <TeamOutlined /> },
    CONTRACTED: { color: '#52c41a', text: '已签约', icon: <CheckCircleOutlined /> },
    REJECTED: { color: '#ff4d4f', text: '已拒绝', icon: <CloseCircleOutlined /> },
    SUSPENDED: { color: '#722ed1', text: '已暂停', icon: <PauseCircleOutlined /> }
  }

  const priorityMap = {
    LOW: { color: '#52c41a', text: '低' },
    MEDIUM: { color: '#1890ff', text: '中' },
    HIGH: { color: '#fa8c16', text: '高' },
    URGENT: { color: '#ff4d4f', text: '紧急' }
  }

  // 初始化地图
  useEffect(() => {
    // 这里应该初始化高德地图
    // 由于没有实际的高德地图SDK，我们模拟初始化过程
    console.log('初始化高德地图...')
    
    // 模拟地图初始化
    setTimeout(() => {
      setLoading(false)
      console.log('地图初始化完成')
    }, 1000)
  }, [])

  // 筛选后的点位数据
  const filteredLocations = mockLocations.filter(location => {
    // 状态筛选
    if (mapConfig.filterByStatus.length > 0 && !mapConfig.filterByStatus.includes(location.status)) {
      return false
    }
    
    // 优先级筛选
    if (mapConfig.filterByPriority.length > 0 && !mapConfig.filterByPriority.includes(location.priority)) {
      return false
    }
    
    // 评分筛选
    if (location.evaluationScore && (location.evaluationScore < mapConfig.scoreRange[0] || location.evaluationScore > mapConfig.scoreRange[1])) {
      return false
    }
    
    // 租金筛选
    if (location.rentPrice && (location.rentPrice < mapConfig.rentRange[0] || location.rentPrice > mapConfig.rentRange[1])) {
      return false
    }
    
    return true
  })

  // 统计数据
  const stats = {
    total: filteredLocations.length,
    pending: filteredLocations.filter(l => l.status === 'PENDING').length,
    following: filteredLocations.filter(l => l.status === 'FOLLOWING').length,
    negotiating: filteredLocations.filter(l => l.status === 'NEGOTIATING').length,
    contracted: filteredLocations.filter(l => l.status === 'CONTRACTED').length,
    avgScore: filteredLocations.reduce((sum, l) => sum + (l.evaluationScore || 0), 0) / filteredLocations.length,
    avgRent: filteredLocations.reduce((sum, l) => sum + (l.rentPrice || 0), 0) / filteredLocations.length
  }

  // 处理点位点击
  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location)
    setShowDrawer(true)
  }

  // 处理地图配置变更
  const handleConfigChange = (key: keyof MapConfig, value: any) => {
    setMapConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 重置筛选条件
  const handleResetFilters = () => {
    setMapConfig({
      showHeatmap: false,
      showClusters: true,
      showCompetitors: false,
      showTraffic: false,
      filterByStatus: [],
      filterByPriority: [],
      scoreRange: [0, 10],
      rentRange: [0, 100000]
    })
  }

  // 导航到点位详情
  const handleViewDetail = () => {
    if (selectedLocation) {
      navigate(`/expansion/candidates/${selectedLocation.id}`)
    }
  }

  // 添加跟进
  const handleAddFollow = () => {
    if (selectedLocation) {
      navigate(`/expansion/candidates/${selectedLocation.id}/follow-up/create`)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="拓店地图"
        description="在地图上查看候选点位分布，进行可视化分析"
        breadcrumbs={[
          { title: '拓店管理', path: '/expansion' },
          { title: '拓店地图' }
        ]}
        extra={[
          <Button
            key="filter"
            icon={<FilterOutlined />}
            onClick={() => setShowFilterPanel(true)}
          >
            筛选设置
          </Button>,
          <Button
            key="fullscreen"
            icon={<FullscreenOutlined />}
            onClick={() => message.info('全屏功能开发中')}
          >
            全屏
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1000)
            }}
          >
            刷新
          </Button>
        ]}
      />

      {/* 地图统计面板 */}
      <Card size="small" style={{ margin: '0 16px 16px 16px', flexShrink: 0 }}>
        <Row gutter={16}>
          <Col span={3}>
            <Statistic
              title="总点位"
              value={stats.total}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title="跟进中"
              value={stats.following}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title="谈判中"
              value={stats.negotiating}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title="已签约"
              value={stats.contracted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title="平均评分"
              value={stats.avgScore}
              precision={1}
              suffix="分"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title="平均租金"
              value={stats.avgRent / 1000}
              precision={1}
              suffix="k/月"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Text>图层控制：</Text>
              <Switch
                size="small"
                checked={mapConfig.showHeatmap}
                onChange={(checked) => handleConfigChange('showHeatmap', checked)}
                checkedChildren="热力"
                unCheckedChildren="热力"
              />
              <Switch
                size="small"
                checked={mapConfig.showClusters}
                onChange={(checked) => handleConfigChange('showClusters', checked)}
                checkedChildren="聚合"
                unCheckedChildren="聚合"
              />
              <Switch
                size="small"
                checked={mapConfig.showTraffic}
                onChange={(checked) => handleConfigChange('showTraffic', checked)}
                checkedChildren="交通"
                unCheckedChildren="交通"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 地图容器 */}
      <div style={{ flex: 1, margin: '0 16px', position: 'relative' }}>
        <Card style={{ height: '100%', padding: 0 }}>
          {/* 地图容器 - 这里应该是高德地图组件 */}
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              background: '#f0f2f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={3}>地图区域</Title>
              <Text type="secondary">这里集成高德地图展示候选点位</Text>
              
              {/* 模拟点位列表 */}
              <div style={{ marginTop: '20px' }}>
                <Row gutter={16}>
                  {filteredLocations.map(location => (
                    <Col span={6} key={location.id} style={{ marginBottom: '16px' }}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => handleLocationClick(location)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <Badge
                            color={statusMap[location.status].color}
                            text={statusMap[location.status].text}
                          />
                          <Tag
                            color={priorityMap[location.priority].color}
                            size="small"
                            style={{ marginLeft: '8px' }}
                          >
                            {priorityMap[location.priority].text}
                          </Tag>
                        </div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {location.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          <EnvironmentOutlined /> {location.regionName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px' }}>
                            {location.area}㎡
                          </span>
                          <span style={{ fontSize: '12px', color: '#1890ff' }}>
                            ¥{location.rentPrice ? (location.rentPrice / 1000).toFixed(1) : '-'}k/月
                          </span>
                        </div>
                        {location.evaluationScore && (
                          <div style={{ marginTop: '4px' }}>
                            <Rate
                              disabled
                              value={location.evaluationScore / 2}
                              allowHalf
                              style={{ fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                              {location.evaluationScore.toFixed(1)}分
                            </span>
                          </div>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 筛选设置面板 */}
      <Modal
        title="地图筛选设置"
        open={showFilterPanel}
        onCancel={() => setShowFilterPanel(false)}
        footer={[
          <Button key="reset" onClick={handleResetFilters}>
            重置
          </Button>,
          <Button key="cancel" onClick={() => setShowFilterPanel(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={() => setShowFilterPanel(false)}>
            确定
          </Button>
        ]}
        width={600}
      >
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>状态筛选</Text>
            <div style={{ marginTop: '8px' }}>
              <Select
                mode="multiple"
                placeholder="选择状态"
                style={{ width: '100%' }}
                value={mapConfig.filterByStatus}
                onChange={(value) => handleConfigChange('filterByStatus', value)}
              >
                {Object.entries(statusMap).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Badge color={value.color} text={value.text} />
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Text strong>优先级筛选</Text>
            <div style={{ marginTop: '8px' }}>
              <Select
                mode="multiple"
                placeholder="选择优先级"
                style={{ width: '100%' }}
                value={mapConfig.filterByPriority}
                onChange={(value) => handleConfigChange('filterByPriority', value)}
              >
                {Object.entries(priorityMap).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Tag color={value.color}>{value.text}</Tag>
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Text strong>评分范围</Text>
            <div style={{ marginTop: '8px' }}>
              <Slider
                range
                min={0}
                max={10}
                step={0.1}
                value={mapConfig.scoreRange}
                onChange={(value) => handleConfigChange('scoreRange', value)}
                tooltip={{ formatter: (value) => `${value}分` }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Text strong>租金范围（元/月）</Text>
            <div style={{ marginTop: '8px' }}>
              <Slider
                range
                min={0}
                max={100000}
                step={1000}
                value={mapConfig.rentRange}
                onChange={(value) => handleConfigChange('rentRange', value)}
                tooltip={{ formatter: (value) => `¥${(value! / 1000).toFixed(1)}k` }}
              />
            </div>
          </div>

          <div>
            <Text strong>图层设置</Text>
            <div style={{ marginTop: '8px' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div>
                    <Switch
                      checked={mapConfig.showHeatmap}
                      onChange={(checked) => handleConfigChange('showHeatmap', checked)}
                    />
                    <span style={{ marginLeft: '8px' }}>热力图</span>
                  </div>
                </Col>
                <Col span={6}>
                  <div>
                    <Switch
                      checked={mapConfig.showClusters}
                      onChange={(checked) => handleConfigChange('showClusters', checked)}
                    />
                    <span style={{ marginLeft: '8px' }}>点位聚合</span>
                  </div>
                </Col>
                <Col span={6}>
                  <div>
                    <Switch
                      checked={mapConfig.showCompetitors}
                      onChange={(checked) => handleConfigChange('showCompetitors', checked)}
                    />
                    <span style={{ marginLeft: '8px' }}>竞争对手</span>
                  </div>
                </Col>
                <Col span={6}>
                  <div>
                    <Switch
                      checked={mapConfig.showTraffic}
                      onChange={(checked) => handleConfigChange('showTraffic', checked)}
                    />
                    <span style={{ marginLeft: '8px' }}>交通信息</span>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </Modal>

      {/* 点位详情抽屉 */}
      <Drawer
        title="候选点位详情"
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        width={500}
        extra={
          <Space>
            <Button type="primary" onClick={handleViewDetail}>
              查看详情
            </Button>
            <Button onClick={handleAddFollow}>
              添加跟进
            </Button>
          </Space>
        }
      >
        {selectedLocation && (
          <div>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="点位名称">
                  {selectedLocation.name}
                </Descriptions.Item>
                <Descriptions.Item label="地址">
                  <div>
                    <EnvironmentOutlined style={{ marginRight: '4px' }} />
                    {selectedLocation.address}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Badge
                    color={statusMap[selectedLocation.status].color}
                    text={statusMap[selectedLocation.status].text}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  <Tag color={priorityMap[selectedLocation.priority].color}>
                    {priorityMap[selectedLocation.priority].text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="地区">
                  {selectedLocation.regionName}
                </Descriptions.Item>
                {selectedLocation.storePlanTitle && (
                  <Descriptions.Item label="关联计划">
                    {selectedLocation.storePlanTitle}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 商业信息 */}
            <Card title="商业信息" size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="面积"
                    value={selectedLocation.area}
                    suffix="㎡"
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="租金"
                    value={selectedLocation.rentPrice ? selectedLocation.rentPrice / 1000 : 0}
                    precision={1}
                    suffix="k/月"
                    valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                  />
                </Col>
              </Row>
              {selectedLocation.evaluationScore && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>综合评分</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Rate
                      disabled
                      value={selectedLocation.evaluationScore / 2}
                      allowHalf
                    />
                    <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                      {selectedLocation.evaluationScore.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* 联系信息 */}
            {(selectedLocation.landlordName || selectedLocation.landlordPhone) && (
              <Card title="联系信息" size="small" style={{ marginBottom: '16px' }}>
                <Descriptions column={1} size="small">
                  {selectedLocation.landlordName && (
                    <Descriptions.Item label="房东">
                      <Avatar size="small" style={{ marginRight: '8px' }}>
                        {selectedLocation.landlordName[0]}
                      </Avatar>
                      {selectedLocation.landlordName}
                    </Descriptions.Item>
                  )}
                  {selectedLocation.landlordPhone && (
                    <Descriptions.Item label="联系电话">
                      <PhoneOutlined style={{ marginRight: '4px' }} />
                      {selectedLocation.landlordPhone}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* 时间信息 */}
            <Card title="时间信息" size="small" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="发现时间">
                  {dayjs(selectedLocation.discoveryDate).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                {selectedLocation.expectedSignDate && (
                  <Descriptions.Item label="预计签约">
                    {dayjs(selectedLocation.expectedSignDate).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="跟进记录">
                  <Badge count={selectedLocation.followUpCount} style={{ backgroundColor: '#52c41a' }} />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 备注信息 */}
            {selectedLocation.notes && (
              <Card title="备注" size="small">
                <Text>{selectedLocation.notes}</Text>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ExpansionMap