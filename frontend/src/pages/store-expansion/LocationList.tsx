/**
 * 候选点位列表页面
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
  Popconfirm,
  Typography,
  Modal
} from '@arco-design/web-react'
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconEye,
  IconDelete,
  IconSearch
} from '@arco-design/web-react/icon'
import { ExpansionService, PlanService } from '../../api'
import { 
  CandidateLocation, 
  CandidateLocationQueryParams, 
  LocationStatus,
  BusinessRegion 
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import LocationForm from './LocationForm'
import styles from './LocationList.module.css'

const { Title } = Typography

// 点位状态配置
const LOCATION_STATUS_CONFIG: Record<LocationStatus, { text: string; color: string }> = {
  available: { text: '可用', color: 'green' },
  following: { text: '跟进中', color: 'orange' },
  signed: { text: '已签约', color: 'blue' },
  abandoned: { text: '已放弃', color: 'gray' }
}

const LocationList: React.FC = () => {
  // 状态管理
  const [locations, setLocations] = useState<CandidateLocation[]>([])
  const [regions, setRegions] = useState<BusinessRegion[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // 筛选条件
  const [filters, setFilters] = useState<CandidateLocationQueryParams>({})
  const [searchName, setSearchName] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<number | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<LocationStatus | undefined>()
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>()
  const [selectedCity, setSelectedCity] = useState<string | undefined>()

  // 表单弹窗
  const [formVisible, setFormVisible] = useState(false)
  const [editingLocation, setEditingLocation] = useState<CandidateLocation | null>(null)

  // 加载候选点位列表
  const loadLocations = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const params: CandidateLocationQueryParams = {
        page,
        page_size: pageSize,
        ...filters
      }
      
      const response = await ExpansionService.getLocations(params)
      setLocations(response.results)
      setPagination({
        current: page,
        pageSize,
        total: response.count
      })
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载候选点位列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载业务大区列表
  const loadRegions = async () => {
    try {
      const response = await PlanService.getRegions()
      setRegions(response)
    } catch (error: any) {
      Message.error('加载业务大区失败')
    }
  }

  // 应用筛选
  const handleSearch = () => {
    const newFilters: CandidateLocationQueryParams = {}
    
    if (searchName) {
      newFilters.name = searchName
    }
    if (searchAddress) {
      newFilters.address = searchAddress
    }
    if (selectedRegion) {
      newFilters.business_region_id = selectedRegion
    }
    if (selectedStatus) {
      newFilters.status = selectedStatus
    }
    if (selectedProvince) {
      newFilters.province = selectedProvince
    }
    if (selectedCity) {
      newFilters.city = selectedCity
    }
    
    setFilters(newFilters)
    loadLocations(1, pagination.pageSize)
  }

  // 重置筛选
  const handleReset = () => {
    setSearchName('')
    setSearchAddress('')
    setSelectedRegion(undefined)
    setSelectedStatus(undefined)
    setSelectedProvince(undefined)
    setSelectedCity(undefined)
    setFilters({})
    loadLocations(1, pagination.pageSize)
  }

  // 删除候选点位
  const handleDelete = async (id: number) => {
    try {
      await ExpansionService.deleteLocation(id)
      Message.success('删除成功')
      loadLocations(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除失败')
    }
  }

  // 打开新建表单
  const handleCreate = () => {
    setEditingLocation(null)
    setFormVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (location: CandidateLocation) => {
    setEditingLocation(location)
    setFormVisible(true)
  }

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingLocation(null)
    loadLocations(pagination.current, pagination.pageSize)
  }

  // 表格列配置
  const columns = [
    {
      title: '点位名称',
      dataIndex: 'name',
      width: 200,
      render: (name: string) => (
        <span className={styles.locationName}>{name}</span>
      )
    },
    {
      title: '地址',
      dataIndex: 'address',
      width: 300,
      render: (_: string, record: CandidateLocation) => (
        <span>
          {record.province} {record.city} {record.district} {record.address}
        </span>
      )
    },
    {
      title: '业务大区',
      dataIndex: 'business_region',
      width: 120,
      render: (region: BusinessRegion) => region?.name || '-'
    },
    {
      title: '面积(㎡)',
      dataIndex: 'area',
      width: 100,
      align: 'right' as const,
      render: (area: number) => area?.toLocaleString() || '-'
    },
    {
      title: '租金(元/月)',
      dataIndex: 'rent',
      width: 120,
      align: 'right' as const,
      render: (rent: number) => rent?.toLocaleString() || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: LocationStatus) => {
        const config = LOCATION_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
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
      render: (_: any, record: CandidateLocation) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => {
              // TODO: 查看详情
              Message.info('查看详情功能待实现')
            }}
          >
            查看
          </Button>
          
          {record.status === 'available' && (
            <PermissionGuard permission="expansion.location.edit">
              <Button
                type="text"
                size="small"
                icon={<IconEdit />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </PermissionGuard>
          )}
          
          {record.status === 'available' && (
            <PermissionGuard permission="expansion.location.delete">
              <Popconfirm
                title="确认删除"
                content="删除后无法恢复，确定要删除这个候选点位吗？"
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
    loadLocations(pagination.current, pagination.pageSize)
  }

  // 初始加载
  useEffect(() => {
    loadLocations()
    loadRegions()
  }, [])

  return (
    <div className={styles.container}>
      <Card>
        {/* 页面标题和操作按钮 */}
        <div className={styles.header}>
          <Title heading={3}>候选点位管理</Title>
          <Space>
            <PermissionGuard permission="expansion.location.create">
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={handleCreate}
              >
                新建点位
              </Button>
            </PermissionGuard>
            <Button
              icon={<IconRefresh />}
              onClick={() => loadLocations(pagination.current, pagination.pageSize)}
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
              placeholder="搜索点位名称"
              value={searchName}
              onChange={setSearchName}
              allowClear
            />
            <Input
              style={{ width: 200 }}
              placeholder="搜索地址"
              value={searchAddress}
              onChange={setSearchAddress}
              allowClear
            />
            <Select
              style={{ width: 150 }}
              placeholder="省份"
              value={selectedProvince}
              onChange={setSelectedProvince}
              allowClear
            >
              <Select.Option value="北京市">北京市</Select.Option>
              <Select.Option value="上海市">上海市</Select.Option>
              <Select.Option value="广东省">广东省</Select.Option>
              <Select.Option value="江苏省">江苏省</Select.Option>
              <Select.Option value="浙江省">浙江省</Select.Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="城市"
              value={selectedCity}
              onChange={setSelectedCity}
              allowClear
            >
              <Select.Option value="北京市">北京市</Select.Option>
              <Select.Option value="上海市">上海市</Select.Option>
              <Select.Option value="广州市">广州市</Select.Option>
              <Select.Option value="深圳市">深圳市</Select.Option>
              <Select.Option value="南京市">南京市</Select.Option>
              <Select.Option value="杭州市">杭州市</Select.Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="业务大区"
              value={selectedRegion}
              onChange={setSelectedRegion}
              allowClear
            >
              {regions.map(region => (
                <Select.Option key={region.id} value={region.id}>
                  {region.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder="状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Select.Option value="available">可用</Select.Option>
              <Select.Option value="following">跟进中</Select.Option>
              <Select.Option value="signed">已签约</Select.Option>
              <Select.Option value="abandoned">已放弃</Select.Option>
            </Select>
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

        {/* 候选点位列表表格 */}
        <Table
          columns={columns}
          data={locations}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: true,
            showJumper: true,
            sizeCanChange: true
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 新建/编辑表单弹窗 */}
      <Modal
        title={editingLocation ? '编辑候选点位' : '新建候选点位'}
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <LocationForm
          location={editingLocation}
          regions={regions}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormVisible(false)}
        />
      </Modal>
    </div>
  )
}

export default LocationList