/**
 * 资产管理页面
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
  Form,
  DatePicker,
  InputNumber,
  Descriptions,
  Drawer,
  Tabs,
  Timeline
} from '@arco-design/web-react'
import { 
  IconPlus, 
  IconSearch, 
  IconRefresh, 
  IconEye, 
  IconEdit, 
  IconDelete,
  IconDownload,
  IconTool
} from '@arco-design/web-react/icon'

import type { ColumnProps } from '@arco-design/web-react/es/Table'
import type {
  AssetRecord,
  AssetRecordFormData,
  AssetQueryParams,
  AssetStatus,
  AssetType,
  MaintenanceRecord,
  MaintenanceRecordFormData,
  MaintenanceType
} from '../../types'
import operationService from '../../api/operationService'

const FormItem = Form.Item
const Option = Select.Option
const TabPane = Tabs.TabPane

// 资产状态配置
const ASSET_STATUS_CONFIG: Record<AssetStatus, { text: string; color: string }> = {
  normal: { text: '正常', color: 'green' },
  maintenance: { text: '维护中', color: 'blue' },
  repair: { text: '维修中', color: 'orange' },
  scrapped: { text: '已报废', color: 'red' },
  lost: { text: '丢失', color: 'gray' }
}

// 资产类型配置
const ASSET_TYPE_CONFIG: Record<AssetType, string> = {
  equipment: '设备',
  furniture: '家具',
  decoration: '装修',
  electronics: '电子设备',
  other: '其他'
}

// 维护类型配置
const MAINTENANCE_TYPE_CONFIG: Record<MaintenanceType, string> = {
  routine: '例行维护',
  repair: '故障维修',
  upgrade: '升级改造'
}

const AssetManagement: React.FC = () => {
  const [form] = Form.useForm()
  const [assetForm] = Form.useForm()
  const [maintenanceForm] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<AssetRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  // 查询参数
  const [queryParams, setQueryParams] = useState<AssetQueryParams>({})
  
  // 弹窗状态
  const [assetModalVisible, setAssetModalVisible] = useState(false)
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<AssetRecord | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // 维护记录
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])

  // 统计数据
  const [statistics, setStatistics] = useState({
    total_count: 0,
    total_value: 0,
    normal_count: 0,
    maintenance_count: 0,
    repair_count: 0
  })

  // 加载数据
  const loadData = async (params?: AssetQueryParams) => {
    setLoading(true)
    try {
      const response = await operationService.getAssetRecords({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...queryParams,
        ...params
      })
      setDataSource(response.data.results)
      setTotal(response.data.count)
      
      // 加载统计数据
      const statsResponse = await operationService.getAssetStatistics()
      setStatistics(statsResponse.data)
    } catch (error: any) {
      Message.error(error.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载维护记录
  const loadMaintenanceRecords = async (assetId: number) => {
    try {
      const response = await operationService.getMaintenanceRecords(assetId)
      setMaintenanceRecords(response.data)
    } catch (error: any) {
      console.error('加载维护记录失败:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  // 搜索
  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: AssetQueryParams = {}

    if (values.asset_name) params.asset_name = values.asset_name
    if (values.asset_no) params.asset_no = values.asset_no
    if (values.asset_type) params.asset_type = values.asset_type
    if (values.status) params.status = values.status
    if (values.store_name) params.store_name = values.store_name
    if (values.store_code) params.store_code = values.store_code
    if (values.responsible_person) params.responsible_person = values.responsible_person
    if (values.brand) params.brand = values.brand

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

  // 新建资产
  const handleCreate = () => {
    setModalMode('create')
    setCurrentRecord(null)
    assetForm.resetFields()
    setAssetModalVisible(true)
  }

  // 编辑资产
  const handleEdit = (record: AssetRecord) => {
    setModalMode('edit')
    setCurrentRecord(record)
    assetForm.setFieldsValue({
      ...record,
      purchase_date: record.purchase_date,
      warranty_end_date: record.warranty_end_date
    })
    setAssetModalVisible(true)
  }

  // 查看详情
  const handleView = (record: AssetRecord) => {
    setCurrentRecord(record)
    loadMaintenanceRecords(record.id)
    setDetailDrawerVisible(true)
  }

  // 删除资产
  const handleDelete = (record: AssetRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除资产"${record.asset_name}"吗？`,
      onOk: async () => {
        try {
          await operationService.deleteAssetRecord(record.id)
          Message.success('删除成功')
          loadData()
        } catch (error: any) {
          Message.error(error.message || '删除失败')
        }
      }
    })
  }

  // 维护记录
  const handleMaintenance = (record: AssetRecord) => {
    setCurrentRecord(record)
    maintenanceForm.resetFields()
    maintenanceForm.setFieldValue('asset_name', record.asset_name)
    setMaintenanceModalVisible(true)
  }

  // 保存资产
  const handleSaveAsset = async () => {
    try {
      const values = await assetForm.validate()
      
      if (modalMode === 'create') {
        await operationService.createAssetRecord(values as AssetRecordFormData)
      } else if (currentRecord) {
        await operationService.updateAssetRecord(currentRecord.id, values)
      }
      
      Message.success(modalMode === 'create' ? '创建成功' : '更新成功')
      setAssetModalVisible(false)
      loadData()
    } catch (error: any) {
      console.error('保存失败:', error)
      Message.error(error.message || '保存失败')
    }
  }

  // 保存维护记录
  const handleSaveMaintenance = async () => {
    try {
      const values = await maintenanceForm.validate()
      
      if (currentRecord) {
        const maintenanceData: MaintenanceRecordFormData = {
          ...values,
          asset_id: currentRecord.id
        }
        await operationService.createMaintenanceRecord(maintenanceData)
      }
      
      Message.success('维护记录保存成功')
      setMaintenanceModalVisible(false)
      loadData()
    } catch (error: any) {
      console.error('保存失败:', error)
      Message.error(error.message || '保存失败')
    }
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const blob = await operationService.exportAssetRecords(queryParams)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `资产记录_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      Message.success('导出成功')
    } catch (error: any) {
      Message.error(error.message || '导出失败')
    }
  }

  // 生成二维码
  const handleGenerateQR = async (record: AssetRecord) => {
    try {
      const response = await operationService.generateAssetQRCode(record.id)
      Message.success('二维码生成成功')
      // 这里可以显示二维码或下载二维码图片
      console.log('QR Code:', response.data.qr_code_url)
    } catch (error: any) {
      Message.error(error.message || '二维码生成失败')
    }
  }

  // 表格列配置
  const columns: ColumnProps<AssetRecord>[] = [
    {
      title: '资产编号',
      dataIndex: 'asset_no',
      width: 140,
      fixed: 'left'
    },
    {
      title: '资产名称',
      dataIndex: 'asset_name',
      width: 150,
      fixed: 'left'
    },
    {
      title: '资产类型',
      dataIndex: 'asset_type',
      width: 100,
      render: (type: AssetType) => ASSET_TYPE_CONFIG[type]
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
      width: 180
    },
    {
      title: '门店编码',
      dataIndex: 'store_code',
      width: 120
    },
    {
      title: '品牌型号',
      width: 150,
      render: (_: any, record: AssetRecord) => 
        `${record.brand || '-'} ${record.model || ''}`.trim()
    },
    {
      title: '购买价格',
      dataIndex: 'purchase_price',
      width: 120,
      render: (price: number) => `¥${price.toLocaleString()}`
    },
    {
      title: '当前价值',
      dataIndex: 'current_value',
      width: 120,
      render: (value: number) => `¥${value.toLocaleString()}`
    },
    {
      title: '资产状态',
      dataIndex: 'status',
      width: 100,
      render: (status: AssetStatus) => {
        const config = ASSET_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      width: 120
    },
    {
      title: '责任人',
      dataIndex: 'responsible_person',
      width: 100
    },
    {
      title: '保修到期',
      dataIndex: 'warranty_end_date',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '购买日期',
      dataIndex: 'purchase_date',
      width: 120
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      width: 320,
      fixed: 'right',
      render: (_: any, record: AssetRecord) => (
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
            icon={<IconTool />}
            onClick={() => handleMaintenance(record)}
          >
            维护
          </Button>
          <Button
            type="text"
            size="small"
            onClick={() => handleGenerateQR(record)}
          >
            二维码
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
        <Breadcrumb.Item>门店运营管理</Breadcrumb.Item>
        <Breadcrumb.Item>资产管理</Breadcrumb.Item>
      </Breadcrumb>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {statistics.total_count}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>资产总数</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              ¥{statistics.total_value.toLocaleString()}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>资产总值</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {statistics.normal_count}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>正常资产</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {statistics.maintenance_count}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>维护中</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
              {statistics.repair_count}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>维修中</div>
          </div>
        </Card>
      </div>

      <Card>
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="inline"
          style={{ marginBottom: '20px' }}
        >
          <FormItem field="asset_name" label="资产名称">
            <Input
              placeholder="请输入资产名称"
              allowClear
              style={{ width: 200 }}
            />
          </FormItem>
          <FormItem field="asset_no" label="资产编号">
            <Input
              placeholder="请输入资产编号"
              allowClear
              style={{ width: 150 }}
            />
          </FormItem>
          <FormItem field="asset_type" label="资产类型">
            <Select
              placeholder="请选择资产类型"
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(ASSET_TYPE_CONFIG).map(([value, text]) => (
                <Option key={value} value={value}>
                  {text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="status" label="资产状态">
            <Select
              placeholder="请选择资产状态"
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(ASSET_STATUS_CONFIG).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="store_name" label="门店名称">
            <Input
              placeholder="请输入门店名称"
              allowClear
              style={{ width: 200 }}
            />
          </FormItem>
          <FormItem field="responsible_person" label="责任人">
            <Input
              placeholder="请输入责任人"
              allowClear
              style={{ width: 150 }}
            />
          </FormItem>
          <FormItem field="brand" label="品牌">
            <Input
              placeholder="请输入品牌"
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
              onClick={handleCreate}
            >
              新建资产
            </Button>
            <Button
              icon={<IconDownload />}
              onClick={handleExport}
            >
              导出数据
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
          scroll={{ x: 2400 }}
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

      {/* 资产表单弹窗 */}
      <Modal
        title={modalMode === 'create' ? '新建资产' : '编辑资产'}
        visible={assetModalVisible}
        onOk={handleSaveAsset}
        onCancel={() => setAssetModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        style={{ width: '800px' }}
      >
        <Form
          form={assetForm}
          layout="vertical"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormItem
              field="asset_name"
              label="资产名称"
              rules={[{ required: true, message: '请输入资产名称' }]}
            >
              <Input placeholder="请输入资产名称" />
            </FormItem>
            <FormItem
              field="asset_type"
              label="资产类型"
              rules={[{ required: true, message: '请选择资产类型' }]}
            >
              <Select placeholder="请选择资产类型">
                {Object.entries(ASSET_TYPE_CONFIG).map(([value, text]) => (
                  <Option key={value} value={value}>
                    {text}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              field="store_name"
              label="门店名称"
              rules={[{ required: true, message: '请输入门店名称' }]}
            >
              <Input placeholder="请输入门店名称" />
            </FormItem>
            <FormItem
              field="store_code"
              label="门店编码"
              rules={[{ required: true, message: '请输入门店编码' }]}
            >
              <Input placeholder="请输入门店编码" />
            </FormItem>
            <FormItem field="brand" label="品牌">
              <Input placeholder="请输入品牌" />
            </FormItem>
            <FormItem field="model" label="型号">
              <Input placeholder="请输入型号" />
            </FormItem>
            <FormItem
              field="purchase_price"
              label="购买价格"
              rules={[{ required: true, message: '请输入购买价格' }]}
            >
              <InputNumber
                placeholder="请输入购买价格"
                min={0}
                precision={2}
                style={{ width: '100%' }}
              />
            </FormItem>
            <FormItem
              field="current_value"
              label="当前价值"
              rules={[{ required: true, message: '请输入当前价值' }]}
            >
              <InputNumber
                placeholder="请输入当前价值"
                min={0}
                precision={2}
                style={{ width: '100%' }}
              />
            </FormItem>
            <FormItem
              field="purchase_date"
              label="购买日期"
              rules={[{ required: true, message: '请选择购买日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </FormItem>
            <FormItem
              field="status"
              label="资产状态"
              rules={[{ required: true, message: '请选择资产状态' }]}
            >
              <Select placeholder="请选择资产状态">
                {Object.entries(ASSET_STATUS_CONFIG).map(([value, config]) => (
                  <Option key={value} value={value}>
                    {config.text}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              field="location"
              label="存放位置"
              rules={[{ required: true, message: '请输入存放位置' }]}
            >
              <Input placeholder="请输入存放位置" />
            </FormItem>
            <FormItem
              field="responsible_person"
              label="责任人"
              rules={[{ required: true, message: '请输入责任人' }]}
            >
              <Input placeholder="请输入责任人" />
            </FormItem>
            <FormItem field="supplier_name" label="供应商">
              <Input placeholder="请输入供应商名称" />
            </FormItem>
            <FormItem field="warranty_period" label="保修期(月)">
              <InputNumber
                placeholder="请输入保修期"
                min={0}
                style={{ width: '100%' }}
              />
            </FormItem>
          </div>
          <FormItem field="description" label="描述">
            <Input.TextArea
              placeholder="请输入资产描述"
              rows={3}
            />
          </FormItem>
        </Form>
      </Modal>

      {/* 维护记录弹窗 */}
      <Modal
        title="添加维护记录"
        visible={maintenanceModalVisible}
        onOk={handleSaveMaintenance}
        onCancel={() => setMaintenanceModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        style={{ width: '600px' }}
      >
        <Form
          form={maintenanceForm}
          layout="vertical"
        >
          <FormItem field="asset_name" label="资产名称">
            <Input disabled />
          </FormItem>
          <FormItem
            field="maintenance_type"
            label="维护类型"
            rules={[{ required: true, message: '请选择维护类型' }]}
          >
            <Select placeholder="请选择维护类型">
              {Object.entries(MAINTENANCE_TYPE_CONFIG).map(([value, text]) => (
                <Option key={value} value={value}>
                  {text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            field="maintenance_date"
            label="维护日期"
            rules={[{ required: true, message: '请选择维护日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </FormItem>
          <FormItem
            field="cost"
            label="维护费用"
            rules={[{ required: true, message: '请输入维护费用' }]}
          >
            <InputNumber
              placeholder="请输入维护费用"
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </FormItem>
          <FormItem
            field="technician"
            label="维护人员"
            rules={[{ required: true, message: '请输入维护人员' }]}
          >
            <Input placeholder="请输入维护人员" />
          </FormItem>
          <FormItem field="next_maintenance_date" label="下次维护日期">
            <DatePicker style={{ width: '100%' }} />
          </FormItem>
          <FormItem
            field="description"
            label="维护说明"
            rules={[{ required: true, message: '请输入维护说明' }]}
          >
            <Input.TextArea
              placeholder="请输入维护说明"
              rows={3}
            />
          </FormItem>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        width={800}
        title="资产详情"
        visible={detailDrawerVisible}
        onOk={() => setDetailDrawerVisible(false)}
        onCancel={() => setDetailDrawerVisible(false)}
      >
        {currentRecord && (
          <Tabs defaultActiveTab="basic">
            <TabPane key="basic" title="基本信息">
              <Descriptions
                column={2}
                data={[
                  {
                    label: '资产编号',
                    value: currentRecord.asset_no
                  },
                  {
                    label: '资产名称',
                    value: currentRecord.asset_name
                  },
                  {
                    label: '资产类型',
                    value: ASSET_TYPE_CONFIG[currentRecord.asset_type]
                  },
                  {
                    label: '门店名称',
                    value: currentRecord.store_name
                  },
                  {
                    label: '门店编码',
                    value: currentRecord.store_code
                  },
                  {
                    label: '品牌',
                    value: currentRecord.brand || '-'
                  },
                  {
                    label: '型号',
                    value: currentRecord.model || '-'
                  },
                  {
                    label: '购买价格',
                    value: `¥${currentRecord.purchase_price.toLocaleString()}`
                  },
                  {
                    label: '当前价值',
                    value: `¥${currentRecord.current_value.toLocaleString()}`
                  },
                  {
                    label: '折旧率',
                    value: `${currentRecord.depreciation_rate}%`
                  },
                  {
                    label: '资产状态',
                    value: (
                      <Tag color={ASSET_STATUS_CONFIG[currentRecord.status].color}>
                        {ASSET_STATUS_CONFIG[currentRecord.status].text}
                      </Tag>
                    )
                  },
                  {
                    label: '存放位置',
                    value: currentRecord.location
                  },
                  {
                    label: '责任人',
                    value: currentRecord.responsible_person
                  },
                  {
                    label: '供应商',
                    value: currentRecord.supplier_name || '-'
                  },
                  {
                    label: '保修期',
                    value: currentRecord.warranty_period ? `${currentRecord.warranty_period}个月` : '-'
                  },
                  {
                    label: '保修到期',
                    value: currentRecord.warranty_end_date || '-'
                  },
                  {
                    label: '购买日期',
                    value: currentRecord.purchase_date
                  },
                  {
                    label: '创建人',
                    value: currentRecord.created_by
                  },
                  {
                    label: '创建时间',
                    value: new Date(currentRecord.created_at).toLocaleString('zh-CN')
                  },
                  {
                    label: '更新时间',
                    value: new Date(currentRecord.updated_at).toLocaleString('zh-CN')
                  }
                ]}
              />
              {currentRecord.description && (
                <div style={{ marginTop: '20px' }}>
                  <h4>资产描述</h4>
                  <p>{currentRecord.description}</p>
                </div>
              )}
            </TabPane>
            
            <TabPane key="maintenance" title="维护记录">
              <Timeline>
                {maintenanceRecords.map(record => (
                  <Timeline.Item key={record.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {MAINTENANCE_TYPE_CONFIG[record.maintenance_type]} - ¥{record.cost}
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        {record.maintenance_date} | 维护人员：{record.technician}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        {record.description}
                      </div>
                      {record.next_maintenance_date && (
                        <div style={{ color: '#1890ff', fontSize: '12px', marginTop: '4px' }}>
                          下次维护：{record.next_maintenance_date}
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
              {maintenanceRecords.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  暂无维护记录
                </div>
              )}
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  )
}

export default AssetManagement