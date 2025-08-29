import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Drawer,
  List,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Transfer,
  Badge
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ShopOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  SwapOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import type { TransferDirection } from 'antd/es/transfer'
import PageHeader from '@/components/common/PageHeader'
import SearchForm from '@/components/common/SearchForm'
import { BasicDataApiService } from '@/services/api/basicData'
import type {
  BusinessRegion,
  BusinessRegionQueryParams,
  CreateBusinessRegionDto,
  UpdateBusinessRegionDto,
  City,
  BusinessRegionStats,
  CityTransferDto
} from '@/services/types'

const { Title, Text } = Typography
const { Option } = Select

interface RegionFormData {
  name: string
  code: string
  description?: string
  managerId: string
  managerName: string
  status: 'active' | 'inactive'
}

interface CityTransferData {
  regionId: string
  targetKeys: string[]
  availableCities: City[]
  regionCities: City[]
}

const RegionManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<BusinessRegion[]>([])
  const [stats, setStats] = useState<BusinessRegionStats | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 表单和弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRegion, setEditingRegion] = useState<BusinessRegion | null>(null)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<BusinessRegion | null>(null)
  const [cityTransferVisible, setCityTransferVisible] = useState(false)
  const [cityTransferData, setCityTransferData] = useState<CityTransferData | null>(null)

  // 选中行状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 表单实例
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  // 查询参数
  const [queryParams, setQueryParams] = useState<BusinessRegionQueryParams>({
    page: 1,
    pageSize: 10
  })

  // 加载数据
  const loadRegions = async () => {
    try {
      setLoading(true)
      const response = await BasicDataApiService.getBusinessRegions(queryParams)
      if (response.code === 200) {
        setRegions(response.data)
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.pageSize,
          total: response.pagination.total
        })
      }
    } catch (error) {
      console.error('加载业务大区列表失败:', error)
      message.error('加载业务大区列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await BasicDataApiService.getBusinessRegionStats()
      if (response.code === 200) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadRegions()
    loadStats()
  }, [queryParams])

  // 搜索处理
  const handleSearch = (values: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      ...values
    })
  }

  // 重置搜索
  const handleSearchReset = () => {
    searchForm.resetFields()
    setQueryParams({
      page: 1,
      pageSize: 10
    })
  }

  // 分页处理
  const handleTableChange = (page: number, pageSize: number) => {
    setQueryParams({
      ...queryParams,
      page,
      pageSize
    })
  }

  // 新建大区
  const handleCreate = () => {
    setEditingRegion(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑大区
  const handleEdit = (record: BusinessRegion) => {
    setEditingRegion(record)
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      managerId: record.managerId,
      managerName: record.managerName,
      status: record.status
    })
    setModalVisible(true)
  }

  // 查看详情
  const handleDetail = async (record: BusinessRegion) => {
    setSelectedRegion(record)
    setDetailDrawerVisible(true)
  }

  // 删除大区
  const handleDelete = async (id: string) => {
    try {
      const response = await BasicDataApiService.deleteBusinessRegion(id)
      if (response.code === 200) {
        message.success('删除成功')
        loadRegions()
        loadStats()
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 保存大区
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const formData: RegionFormData = values

      if (editingRegion) {
        // 更新
        const updateData: UpdateBusinessRegionDto = {
          name: formData.name,
          description: formData.description,
          managerId: formData.managerId,
          managerName: formData.managerName,
          status: formData.status,
          updatedBy: 'current-user', // 实际应用中从用户状态获取
          updatedByName: '当前用户'
        }
        const response = await BasicDataApiService.updateBusinessRegion(editingRegion.id, updateData)
        if (response.code === 200) {
          message.success('更新成功')
        }
      } else {
        // 新建
        const createData: CreateBusinessRegionDto = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          managerId: formData.managerId,
          managerName: formData.managerName,
          status: formData.status,
          createdBy: 'current-user', // 实际应用中从用户状态获取
          updatedBy: 'current-user'
        }
        const response = await BasicDataApiService.createBusinessRegion(createData)
        if (response.code === 200) {
          message.success('创建成功')
        }
      }

      setModalVisible(false)
      loadRegions()
      loadStats()
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  // 批量操作
  const handleBatchStatusUpdate = async (status: 'active' | 'inactive') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的大区')
      return
    }

    try {
      const response = await BasicDataApiService.batchUpdateBusinessRegionStatus(
        selectedRowKeys as string[],
        status
      )
      if (response.code === 200) {
        message.success(`批量${status === 'active' ? '启用' : '禁用'}成功`)
        setSelectedRowKeys([])
        loadRegions()
        loadStats()
      }
    } catch (error) {
      console.error('批量操作失败:', error)
      message.error('批量操作失败')
    }
  }

  // 城市管理
  const handleCityManagement = async (record: BusinessRegion) => {
    try {
      // 获取可用城市和当前大区城市
      const [availableCitiesRes, regionCitiesRes] = await Promise.all([
        BasicDataApiService.getAvailableCities(),
        BasicDataApiService.getRegionCities(record.id)
      ])

      if (availableCitiesRes.code === 200 && regionCitiesRes.code === 200) {
        setCityTransferData({
          regionId: record.id,
          targetKeys: regionCitiesRes.data.map(city => city.id),
          availableCities: availableCitiesRes.data,
          regionCities: regionCitiesRes.data
        })
        setCityTransferVisible(true)
      }
    } catch (error) {
      console.error('加载城市数据失败:', error)
      message.error('加载城市数据失败')
    }
  }

  // 城市转移
  const handleCityTransfer = async (
    targetKeys: string[],
    direction: TransferDirection,
    moveKeys: string[]
  ) => {
    if (!cityTransferData) return

    try {
      if (direction === 'right') {
        // 添加城市到大区
        await BasicDataApiService.addCitiesToRegion(cityTransferData.regionId, moveKeys)
      } else {
        // 从大区移除城市
        await BasicDataApiService.removeCitiesFromRegion(cityTransferData.regionId, moveKeys)
      }

      message.success('城市分配成功')
      setCityTransferVisible(false)
      loadRegions()
      loadStats()
    } catch (error) {
      console.error('城市分配失败:', error)
      message.error('城市分配失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<BusinessRegion> = [
    {
      title: '大区名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: BusinessRegion) => (
        <Space>
          <Text strong>{text}</Text>
          <Text type="secondary">({record.code})</Text>
        </Space>
      )
    },
    {
      title: '负责人',
      dataIndex: 'managerName',
      key: 'managerName',
      width: 120
    },
    {
      title: '城市数量',
      dataIndex: 'cityCount',
      key: 'cityCount',
      width: 100,
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '门店数量',
      dataIndex: 'storeCount',
      key: 'storeCount',
      width: 100,
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: BusinessRegion) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="城市管理">
            <Button
              type="text"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => handleCityManagement(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除这个业务大区吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 行选择配置
  const rowSelection: TableRowSelection<BusinessRegion> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record: BusinessRegion) => ({
      disabled: record.status === 'inactive' // 已禁用的不能选择
    })
  }

  // 搜索表单字段
  const searchFields = [
    {
      name: 'keyword',
      label: '关键字',
      type: 'input' as const,
      placeholder: '搜索大区名称、编码或负责人'
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' }
      ]
    }
  ]

  return (
    <div>
      <PageHeader
        title="业务大区管理"
        description="管理业务大区信息，包括大区基本信息、负责人分配和城市关联等"
        breadcrumbs={[{ title: '基础数据' }, { title: '业务大区管理' }]}
      />

      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总大区数"
                value={stats.totalRegions}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="启用大区"
                value={stats.activeRegions}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="管理城市"
                value={stats.totalCities}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="管理门店"
                value={stats.totalStores}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {/* 搜索表单 */}
        <SearchForm
          form={searchForm}
          fields={searchFields}
          onSearch={handleSearch}
          onReset={handleSearchReset}
        />

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建大区
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadRegions()
                loadStats()
              }}
            >
              刷新
            </Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchStatusUpdate('active')}
            >
              批量启用
            </Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchStatusUpdate('inactive')}
            >
              批量禁用
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={regions}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange
          }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={editingRegion ? '编辑业务大区' : '新建业务大区'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="大区名称"
                rules={[{ required: true, message: '请输入大区名称' }]}
              >
                <Input placeholder="请输入大区名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="大区编码"
                rules={[{ required: true, message: '请输入大区编码' }]}
              >
                <Input placeholder="请输入大区编码" disabled={!!editingRegion} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="managerId"
                label="负责人ID"
                rules={[{ required: true, message: '请选择负责人' }]}
              >
                <Select placeholder="请选择负责人">
                  <Option value="user-1">张三</Option>
                  <Option value="user-2">李四</Option>
                  <Option value="user-3">王五</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="managerName"
                label="负责人姓名"
                rules={[{ required: true, message: '请输入负责人姓名' }]}
              >
                <Input placeholder="请输入负责人姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入大区描述" />
          </Form.Item>

          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
              defaultChecked
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="业务大区详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={600}
      >
        {selectedRegion && (
          <div>
            <Title level={4}>基本信息</Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Text strong>大区名称：</Text>
                <Text>{selectedRegion.name}</Text>
              </Col>
              <Col span={12}>
                <Text strong>大区编码：</Text>
                <Text>{selectedRegion.code}</Text>
              </Col>
              <Col span={12}>
                <Text strong>负责人：</Text>
                <Text>{selectedRegion.managerName}</Text>
              </Col>
              <Col span={12}>
                <Text strong>状态：</Text>
                <Tag color={selectedRegion.status === 'active' ? 'green' : 'red'}>
                  {selectedRegion.status === 'active' ? '启用' : '禁用'}
                </Tag>
              </Col>
              <Col span={24}>
                <Text strong>描述：</Text>
                <br />
                <Text>{selectedRegion.description || '暂无描述'}</Text>
              </Col>
            </Row>

            <Title level={4}>统计信息</Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic title="城市数量" value={selectedRegion.cityCount} />
              </Col>
              <Col span={8}>
                <Statistic title="门店数量" value={selectedRegion.storeCount} />
              </Col>
            </Row>

            <Title level={4}>关联城市</Title>
            <List
              dataSource={selectedRegion.cities}
              renderItem={(city: City) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{city.name.charAt(0)}</Avatar>}
                    title={city.name}
                    description={`${city.provinceName} · 门店数量: ${city.storeCount}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      {/* 城市管理Transfer */}
      <Modal
        title="城市分配管理"
        open={cityTransferVisible}
        onCancel={() => setCityTransferVisible(false)}
        width={800}
        footer={null}
      >
        {cityTransferData && (
          <Transfer
            dataSource={[...cityTransferData.availableCities, ...cityTransferData.regionCities]}
            titles={['可用城市', '已分配城市']}
            targetKeys={cityTransferData.targetKeys}
            onChange={handleCityTransfer}
            render={item => `${item.name} (${item.provinceName})`}
            rowKey={item => item.id}
            showSearch
            filterOption={(inputValue, option) =>
              option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
              option.provinceName.toLowerCase().includes(inputValue.toLowerCase())
            }
          />
        )}
      </Modal>
    </div>
  )
}

export default RegionManagement