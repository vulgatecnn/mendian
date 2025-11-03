/**
 * 供应商管理页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Message,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Tag,
  Typography,
} from '@arco-design/web-react'
import { IconPlus, IconEdit, IconDelete, IconSearch } from '@arco-design/web-react/icon'
import BaseDataService from '../../api/baseDataService'
import type { Supplier, SupplierFormData } from '../../types'
import styles from './BaseDataManagement.module.css'

const { Title } = Typography
const FormItem = Form.Item
const Option = Select.Option

const SupplierManagement: React.FC = () => {
  const [data, setData] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 供应商类型
  const supplierTypes = ['施工供应商', '设备供应商', '材料供应商', '服务供应商', '其他']

  // 加载数据
  const loadData = async (page = 1, pageSize = 10, searchParams = {}) => {
    try {
      setLoading(true)
      const response = await BaseDataService.getSuppliers({
        page,
        page_size: pageSize,
        ...searchParams,
      })
      setData(response.results)
      setPagination({
        current: page,
        pageSize,
        total: response.count,
      })
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    loadData(1, pagination.pageSize, values)
  }

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields()
    loadData(1, pagination.pageSize)
  }

  // 打开新建/编辑对话框
  const handleOpenModal = async (record?: Supplier) => {
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue(record)
    } else {
      setEditingId(null)
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate()
      const formData: SupplierFormData = values

      if (editingId) {
        await BaseDataService.updateSupplier(editingId, formData)
        Message.success('更新成功')
      } else {
        await BaseDataService.createSupplier(formData)
        Message.success('创建成功')
      }

      setModalVisible(false)
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      if (error?.response?.data?.message) {
        Message.error(error.response.data.message)
      }
    }
  }

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await BaseDataService.deleteSupplier(id)
      Message.success('删除成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除失败，该供应商可能已被引用')
    }
  }

  // 切换状态
  const handleToggleStatus = async (record: Supplier) => {
    try {
      const newStatus = record.cooperation_status === 'active' ? 'inactive' : 'active'
      await BaseDataService.toggleSupplierStatus(record.id, newStatus)
      Message.success('状态更新成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '状态更新失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '供应商名称',
      dataIndex: 'name',
    },
    {
      title: '供应商编码',
      dataIndex: 'code',
    },
    {
      title: '类型',
      dataIndex: 'type',
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
    },
    {
      title: '合作状态',
      dataIndex: 'cooperation_status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '合作中' : '已停止'}
        </Tag>
      ),
    },
    {
      title: '操作',
      render: (_: any, record: Supplier) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            status={record.cooperation_status === 'active' ? 'warning' : 'success'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.cooperation_status === 'active' ? '停止合作' : '恢复合作'}
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            content="删除后无法恢复"
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
        </Space>
      ),
    },
  ]

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title heading={3}>供应商管理</Title>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => handleOpenModal()}
          >
            新建供应商
          </Button>
        </div>

        <Form
          form={searchForm}
          layout="inline"
          className={styles.searchForm}
        >
          <FormItem field="name">
            <Input placeholder="供应商名称" style={{ width: 200 }} />
          </FormItem>
          <FormItem field="type">
            <Select placeholder="供应商类型" style={{ width: 150 }} allowClear>
              {supplierTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="cooperation_status">
            <Select placeholder="合作状态" style={{ width: 120 }} allowClear>
              <Option value="active">合作中</Option>
              <Option value="inactive">已停止</Option>
            </Select>
          </FormItem>
          <FormItem>
            <Space>
              <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </FormItem>
        </Form>

        <Table
          loading={loading}
          columns={columns}
          data={data}
          pagination={{
            ...pagination,
            showTotal: true,
            sizeCanChange: true,
            onChange: (page, pageSize) => {
              const searchParams = searchForm.getFieldsValue()
              loadData(page, pageSize, searchParams)
            },
          }}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingId ? '编辑供应商' : '新建供应商'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="供应商名称"
            field="name"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </FormItem>
          <FormItem
            label="供应商编码"
            field="code"
            rules={[{ required: true, message: '请输入供应商编码' }]}
          >
            <Input placeholder="请输入供应商编码" />
          </FormItem>
          <FormItem
            label="供应商类型"
            field="type"
            rules={[{ required: true, message: '请选择供应商类型' }]}
          >
            <Select placeholder="请选择供应商类型">
              {supplierTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            label="联系人"
            field="contact_person"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人" />
          </FormItem>
          <FormItem
            label="联系电话"
            field="contact_phone"
            rules={[
              { required: true, message: '请输入联系电话' },
              { match: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </FormItem>
          <FormItem label="联系邮箱" field="contact_email">
            <Input placeholder="请输入联系邮箱" />
          </FormItem>
          <FormItem label="地址" field="address">
            <Input.TextArea placeholder="请输入地址" rows={2} />
          </FormItem>
          <FormItem label="业务范围" field="business_scope">
            <Input.TextArea placeholder="请输入业务范围" rows={3} />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierManagement
