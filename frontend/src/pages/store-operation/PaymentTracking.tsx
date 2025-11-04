/**
 * 付款追踪页面
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
  Drawer
} from '@arco-design/web-react'
import { 
  IconPlus, 
  IconSearch, 
  IconRefresh, 
  IconEye, 
  IconEdit, 
  IconDelete,
  IconDownload
} from '@arco-design/web-react/icon'

import type { ColumnProps } from '@arco-design/web-react/es/Table'
import type {
  PaymentRecord,
  PaymentRecordFormData,
  PaymentQueryParams,
  PaymentStatus,
  PaymentType
} from '../../types'
import operationService from '../../api/operationService'

const FormItem = Form.Item
const Option = Select.Option
const { RangePicker } = DatePicker

// 付款状态配置
const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { text: string; color: string }> = {
  pending: { text: '待付款', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  paid: { text: '已付款', color: 'green' },
  overdue: { text: '已逾期', color: 'red' },
  cancelled: { text: '已取消', color: 'gray' }
}

// 付款类型配置
const PAYMENT_TYPE_CONFIG: Record<PaymentType, string> = {
  rent: '租金',
  decoration: '装修费',
  equipment: '设备费',
  deposit: '保证金',
  other: '其他'
}

const PaymentTracking: React.FC = () => {
  const [form] = Form.useForm()
  const [paymentForm] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PaymentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  // 查询参数
  const [queryParams, setQueryParams] = useState<PaymentQueryParams>({})
  
  // 弹窗状态
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<PaymentRecord | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // 统计数据
  const [statistics, setStatistics] = useState({
    total_amount: 0,
    pending_amount: 0,
    paid_amount: 0,
    overdue_count: 0
  })

  // 加载数据
  const loadData = async (params?: PaymentQueryParams) => {
    setLoading(true)
    try {
      const response = await operationService.getPaymentRecords({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...queryParams,
        ...params
      })
      setDataSource(response.data.results)
      setTotal(response.data.count)
      
      // 加载统计数据
      const statsResponse = await operationService.getPaymentStatistics()
      setStatistics(statsResponse.data)
    } catch (error: any) {
      Message.error(error.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  // 搜索
  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: PaymentQueryParams = {}

    if (values.store_name) params.store_name = values.store_name
    if (values.store_code) params.store_code = values.store_code
    if (values.payment_type) params.payment_type = values.payment_type
    if (values.status) params.status = values.status
    if (values.supplier_name) params.supplier_name = values.supplier_name
    if (values.contract_no) params.contract_no = values.contract_no
    if (values.due_date_range) {
      params.due_date_start = values.due_date_range[0]
      params.due_date_end = values.due_date_range[1]
    }
    if (values.amount_range) {
      params.amount_min = values.amount_range[0]
      params.amount_max = values.amount_range[1]
    }

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

  // 新建付款记录
  const handleCreate = () => {
    setModalMode('create')
    setCurrentRecord(null)
    paymentForm.resetFields()
    setPaymentModalVisible(true)
  }

  // 编辑付款记录
  const handleEdit = (record: PaymentRecord) => {
    setModalMode('edit')
    setCurrentRecord(record)
    paymentForm.setFieldsValue({
      ...record,
      due_date: record.due_date,
      payment_date: record.payment_date
    })
    setPaymentModalVisible(true)
  }

  // 查看详情
  const handleView = (record: PaymentRecord) => {
    setCurrentRecord(record)
    setDetailDrawerVisible(true)
  }

  // 删除付款记录
  const handleDelete = (record: PaymentRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除付款记录"${record.payment_no}"吗？`,
      onOk: async () => {
        try {
          await operationService.deletePaymentRecord(record.id)
          Message.success('删除成功')
          loadData()
        } catch (error: any) {
          Message.error(error.message || '删除失败')
        }
      }
    })
  }

  // 标记付款
  const handleMarkPaid = (record: PaymentRecord) => {
    Modal.confirm({
      title: '确认付款',
      content: `确定要标记"${record.payment_no}"为已付款吗？`,
      onOk: async () => {
        try {
          const today = new Date().toISOString().split('T')[0]
          await operationService.markPaymentPaid(record.id, today)
          Message.success('标记成功')
          loadData()
        } catch (error: any) {
          Message.error(error.message || '操作失败')
        }
      }
    })
  }

  // 保存付款记录
  const handleSavePayment = async () => {
    try {
      const values = await paymentForm.validate()
      
      if (modalMode === 'create') {
        await operationService.createPaymentRecord(values as PaymentRecordFormData)
      } else if (currentRecord) {
        await operationService.updatePaymentRecord(currentRecord.id, values)
      }
      
      Message.success(modalMode === 'create' ? '创建成功' : '更新成功')
      setPaymentModalVisible(false)
      loadData()
    } catch (error: any) {
      console.error('保存失败:', error)
      Message.error(error.message || '保存失败')
    }
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const blob = await operationService.exportPaymentRecords(queryParams)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `付款记录_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      Message.success('导出成功')
    } catch (error: any) {
      Message.error(error.message || '导出失败')
    }
  }

  // 表格列配置
  const columns: ColumnProps<PaymentRecord>[] = [
    {
      title: '付款单号',
      dataIndex: 'payment_no',
      width: 140,
      fixed: 'left'
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
      width: 180,
      fixed: 'left'
    },
    {
      title: '门店编码',
      dataIndex: 'store_code',
      width: 120
    },
    {
      title: '付款类型',
      dataIndex: 'payment_type',
      width: 100,
      render: (type: PaymentType) => PAYMENT_TYPE_CONFIG[type]
    },
    {
      title: '付款金额',
      dataIndex: 'amount',
      width: 120,
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '到期日期',
      dataIndex: 'due_date',
      width: 120
    },
    {
      title: '付款日期',
      dataIndex: 'payment_date',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '付款状态',
      dataIndex: 'status',
      width: 100,
      render: (status: PaymentStatus) => {
        const config = PAYMENT_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      width: 140
    },
    {
      title: '说明',
      dataIndex: 'description',
      width: 200,
      ellipsis: true
    },
    {
      title: '创建人',
      dataIndex: 'created_by',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_: any, record: PaymentRecord) => (
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
          {record.status === 'pending' && (
            <Button
              type="text"
              size="small"
              status="success"
              onClick={() => handleMarkPaid(record)}
            >
              标记付款
            </Button>
          )}
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
        <Breadcrumb.Item>付款追踪</Breadcrumb.Item>
      </Breadcrumb>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              ¥{statistics.total_amount.toLocaleString()}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>总付款金额</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
              ¥{statistics.pending_amount.toLocaleString()}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>待付款金额</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              ¥{statistics.paid_amount.toLocaleString()}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>已付款金额</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
              {statistics.overdue_count}
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>逾期笔数</div>
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
              style={{ width: 150 }}
            />
          </FormItem>
          <FormItem field="payment_type" label="付款类型">
            <Select
              placeholder="请选择付款类型"
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(PAYMENT_TYPE_CONFIG).map(([value, text]) => (
                <Option key={value} value={value}>
                  {text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="status" label="付款状态">
            <Select
              placeholder="请选择付款状态"
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="supplier_name" label="供应商">
            <Input
              placeholder="请输入供应商名称"
              allowClear
              style={{ width: 200 }}
            />
          </FormItem>
          <FormItem field="contract_no" label="合同编号">
            <Input
              placeholder="请输入合同编号"
              allowClear
              style={{ width: 150 }}
            />
          </FormItem>
          <FormItem field="due_date_range" label="到期日期">
            <RangePicker style={{ width: 250 }} />
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
              新建付款记录
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
          scroll={{ x: 2200 }}
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

      {/* 付款记录表单弹窗 */}
      <Modal
        title={modalMode === 'create' ? '新建付款记录' : '编辑付款记录'}
        visible={paymentModalVisible}
        onOk={handleSavePayment}
        onCancel={() => setPaymentModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        style={{ width: '600px' }}
      >
        <Form
          form={paymentForm}
          layout="vertical"
        >
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
          <FormItem
            field="payment_type"
            label="付款类型"
            rules={[{ required: true, message: '请选择付款类型' }]}
          >
            <Select placeholder="请选择付款类型">
              {Object.entries(PAYMENT_TYPE_CONFIG).map(([value, text]) => (
                <Option key={value} value={value}>
                  {text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            field="amount"
            label="付款金额"
            rules={[{ required: true, message: '请输入付款金额' }]}
          >
            <InputNumber
              placeholder="请输入付款金额"
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </FormItem>
          <FormItem
            field="due_date"
            label="到期日期"
            rules={[{ required: true, message: '请选择到期日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </FormItem>
          <FormItem field="supplier_name" label="供应商">
            <Input placeholder="请输入供应商名称" />
          </FormItem>
          <FormItem field="contract_no" label="合同编号">
            <Input placeholder="请输入合同编号" />
          </FormItem>
          <FormItem field="description" label="说明">
            <Input.TextArea
              placeholder="请输入说明"
              rows={3}
            />
          </FormItem>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        width={600}
        title="付款记录详情"
        visible={detailDrawerVisible}
        onOk={() => setDetailDrawerVisible(false)}
        onCancel={() => setDetailDrawerVisible(false)}
      >
        {currentRecord && (
          <Descriptions
            column={1}
            data={[
              {
                label: '付款单号',
                value: currentRecord.payment_no
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
                label: '付款类型',
                value: PAYMENT_TYPE_CONFIG[currentRecord.payment_type]
              },
              {
                label: '付款金额',
                value: `¥${currentRecord.amount.toLocaleString()}`
              },
              {
                label: '到期日期',
                value: currentRecord.due_date
              },
              {
                label: '付款日期',
                value: currentRecord.payment_date || '-'
              },
              {
                label: '付款状态',
                value: (
                  <Tag color={PAYMENT_STATUS_CONFIG[currentRecord.status].color}>
                    {PAYMENT_STATUS_CONFIG[currentRecord.status].text}
                  </Tag>
                )
              },
              {
                label: '供应商',
                value: currentRecord.supplier_name || '-'
              },
              {
                label: '合同编号',
                value: currentRecord.contract_no || '-'
              },
              {
                label: '说明',
                value: currentRecord.description || '-'
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
        )}
      </Drawer>
    </div>
  )
}

export default PaymentTracking