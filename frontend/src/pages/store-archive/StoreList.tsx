/**
 * 门店档案列表页面
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Message,
  Modal,
  Tag,
  Breadcrumb,
  Form
} from '@arco-design/web-react'
import { IconPlus, IconSearch, IconRefresh, IconEye, IconEdit, IconDelete } from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import type { ColumnProps } from '@arco-design/web-react/es/Table'
import type {
  StoreProfile,
  StoreProfileQueryParams,
  StoreStatus,
  StoreTypeCode,
  OperationMode,
  BusinessRegion
} from '../../types'
import { getStoreProfiles, deleteStoreProfile } from '../../api/archiveService'
import baseDataService from '../../api/baseDataService'

const FormItem = Form.Item
const Option = Select.Option

// 门店状态配置
const STORE_STATUS_CONFIG: Record<StoreStatus, { text: string; color: string }> = {
  preparing: { text: '筹备中', color: 'blue' },
  opening: { text: '开业中', color: 'cyan' },
  operating: { text: '营业中', color: 'green' },
  closed: { text: '已闭店', color: 'gray' },
  cancelled: { text: '已取消', color: 'red' }
}

// 门店类型配置
const STORE_TYPE_CONFIG: Record<StoreTypeCode, string> = {
  direct: '直营店',
  franchise: '加盟店',
  joint: '联营店'
}

// 经营模式配置
const OPERATION_MODE_CONFIG: Record<OperationMode, string> = {
  self_operated: '自营',
  franchised: '加盟',
  joint_venture: '联营'
}

const StoreList: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<StoreProfile[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  // 查询参数
  const [queryParams, setQueryParams] = useState<StoreProfileQueryParams>({})
  
  // 业务大区列表
  const [businessRegions, setBusinessRegions] = useState<BusinessRegion[]>([])
  const [regionsLoading, setRegionsLoading] = useState(false)

  // 加载数据
  const loadData = async (params?: StoreProfileQueryParams) => {
    setLoading(true)
    try {
      const response = await getStoreProfiles({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...queryParams,
        ...params
      })
      setDataSource(response.data.results)
      setTotal(response.data.count)
    } catch (error: any) {
      Message.error(error.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadBusinessRegions()
  }, [pagination.current, pagination.pageSize])

  // 加载业务大区列表
  const loadBusinessRegions = async () => {
    setRegionsLoading(true)
    try {
      const response = await baseDataService.getBusinessRegions({ 
        is_active: true,
        page_size: 1000 
      })
      setBusinessRegions(response.results)
    } catch (error: any) {
      console.error('加载业务大区失败:', error)
    } finally {
      setRegionsLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: StoreProfileQueryParams = {}

    if (values.store_name) params.store_name = values.store_name
    if (values.store_code) params.store_code = values.store_code
    if (values.business_region_id) params.business_region_id = values.business_region_id
    if (values.status) params.status = values.status
    if (values.store_type) params.store_type = values.store_type
    if (values.operation_mode) params.operation_mode = values.operation_mode
    if (values.province) params.province = values.province
    if (values.city) params.city = values.city

    setQueryParams(params)
    setPagination({ ...pagination, current: 1 })
    loadData(params)
  }

  // 重置
  const handleReset = () => {
    form.resetFields()
    setQueryParams({})
    setPagination({ ...pagination, current: 1 })
    loadData({})
  }

  // 查看详情
  const handleView = (record: StoreProfile) => {
    navigate(`/store-archive/${record.id}`)
  }

  // 编辑
  const handleEdit = (record: StoreProfile) => {
    navigate(`/store-archive/${record.id}/edit`)
  }

  // 删除
  const handleDelete = (record: StoreProfile) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除门店档案"${record.store_name}"吗？`,
      onOk: async () => {
        try {
          await deleteStoreProfile(record.id)
          Message.success('删除成功')
          loadData()
        } catch (error: any) {
          Message.error(error.message || '删除失败')
        }
      }
    })
  }

  // 表格列配置
  const columns: ColumnProps<StoreProfile>[] = [
    {
      title: '门店编码',
      dataIndex: 'store_code',
      width: 120,
      fixed: 'left'
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
      width: 200,
      fixed: 'left'
    },
    {
      title: '门店状态',
      dataIndex: 'status',
      width: 100,
      render: (status: StoreStatus) => {
        const config = STORE_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '门店类型',
      dataIndex: 'store_type',
      width: 100,
      render: (type: StoreTypeCode) => STORE_TYPE_CONFIG[type]
    },
    {
      title: '经营模式',
      dataIndex: 'operation_mode',
      width: 100,
      render: (mode: OperationMode) => OPERATION_MODE_CONFIG[mode]
    },
    {
      title: '业务大区',
      dataIndex: 'business_region',
      width: 120,
      render: (_: any, record: StoreProfile) => record.business_region?.name || '-'
    },
    {
      title: '省份',
      dataIndex: 'province',
      width: 100
    },
    {
      title: '城市',
      dataIndex: 'city',
      width: 100
    },
    {
      title: '详细地址',
      dataIndex: 'address',
      width: 200,
      ellipsis: true
    },
    {
      title: '店长',
      dataIndex: 'store_manager',
      width: 100,
      render: (_: any, record: StoreProfile) => record.store_manager?.full_name || '-'
    },
    {
      title: '商务负责人',
      dataIndex: 'business_manager',
      width: 120,
      render: (_: any, record: StoreProfile) => record.business_manager?.full_name || '-'
    },
    {
      title: '开业日期',
      dataIndex: 'opening_date',
      width: 120
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_: any, record: StoreProfile) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item>门店档案</Breadcrumb.Item>
        <Breadcrumb.Item>档案列表</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="inline"
          style={{ marginBottom: '20px' }}
        >
          <FormItem field="store_name" label="门店名称">
            <Input
              placeholder="请输入门店名称"
              allowClear
              style={{ width: 200 }}
            />
          </FormItem>
          <FormItem field="store_code" label="门店编码">
            <Input
              placeholder="请输入门店编码"
              allowClear
              style={{ width: 200 }}
            />
          </FormItem>
          <FormItem field="status" label="门店状态">
            <Select
              placeholder="请选择门店状态"
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(STORE_STATUS_CONFIG).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="store_type" label="门店类型">
            <Select
              placeholder="请选择门店类型"
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(STORE_TYPE_CONFIG).map(([value, text]) => (
                <Option key={value} value={value}>
                  {text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="operation_mode" label="经营模式">
            <Select
              placeholder="请选择经营模式"
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(OPERATION_MODE_CONFIG).map(([value, text]) => (
                <Option key={value} value={value}>
                  {text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="business_region_id" label="业务大区">
            <Select
              placeholder="请选择业务大区"
              allowClear
              loading={regionsLoading}
              style={{ width: 150 }}
              showSearch
              filterOption={(inputValue, option) =>
                option?.props?.children?.toString().toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              {businessRegions.map(region => (
                <Option key={region.id} value={region.id}>
                  {region.name}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="province" label="省份">
            <Input
              placeholder="请输入省份"
              allowClear
              style={{ width: 150 }}
            />
          </FormItem>
          <FormItem field="city" label="城市">
            <Input
              placeholder="请输入城市"
              allowClear
              style={{ width: 150 }}
            />
          </FormItem>
          <FormItem>
            <Space>
              <Button
                type="primary"
                icon={<IconSearch />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button icon={<IconRefresh />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </FormItem>
        </Form>

        {/* 操作按钮 */}
        <div style={{ marginBottom: '20px' }}>
          <Space>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={() => navigate('/store-archive/create')}
            >
              新建门店档案
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={() => loadData()}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 数据表格 */}
        <Table
          loading={loading}
          columns={columns}
          data={dataSource}
          rowKey="id"
          scroll={{ x: 2000 }}
          pagination={{
            ...pagination,
            total,
            showTotal: true,
            sizeCanChange: true,
            onChange: (current, pageSize) => {
              setPagination({ current, pageSize })
            }
          }}
        />
      </Card>
    </div>
  )
}

export default StoreList
