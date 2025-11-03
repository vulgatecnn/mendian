/**
 * 商务预算管理页面
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
  InputNumber,
  Select,
  Space,
  Popconfirm,
  Tag,
  Typography,
} from '@arco-design/web-react'
import { IconPlus, IconEdit, IconDelete, IconSearch } from '@arco-design/web-react/icon'
import BaseDataService from '../../api/baseDataService'
import type { Budget, BudgetFormData } from '../../types'
import styles from './BaseDataManagement.module.css'

const { Title } = Typography
const FormItem = Form.Item
const Option = Select.Option

const BudgetManagement: React.FC = () => {
  const [data, setData] = useState<Budget[]>([])
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

  // 生成年份选项（当前年份前后5年）
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  // 加载数据
  const loadData = async (page = 1, pageSize = 10, searchParams = {}) => {
    try {
      setLoading(true)
      const response = await BaseDataService.getBudgets({
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
  const handleOpenModal = async (record?: Budget) => {
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue(record)
    } else {
      setEditingId(null)
      form.resetFields()
      // 默认设置为当前年份
      form.setFieldValue('year', currentYear)
    }
    setModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate()
      const formData: BudgetFormData = values

      if (editingId) {
        await BaseDataService.updateBudget(editingId, formData)
        Message.success('更新成功')
      } else {
        await BaseDataService.createBudget(formData)
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
      await BaseDataService.deleteBudget(id)
      Message.success('删除成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除失败，该预算可能已被引用')
    }
  }

  // 切换状态
  const handleToggleStatus = async (record: Budget) => {
    try {
      await BaseDataService.toggleBudgetStatus(record.id, !record.is_active)
      Message.success('状态更新成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '状态更新失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '预算名称',
      dataIndex: 'name',
    },
    {
      title: '预算编码',
      dataIndex: 'code',
    },
    {
      title: '年份',
      dataIndex: 'year',
    },
    {
      title: '预算金额(万元)',
      dataIndex: 'amount',
      render: (value: number) => value?.toLocaleString(),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      render: (_: any, record: Budget) => (
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
            status={record.is_active ? 'warning' : 'success'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.is_active ? '停用' : '启用'}
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
          <Title heading={3}>商务预算管理</Title>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => handleOpenModal()}
          >
            新建预算
          </Button>
        </div>

        <Form
          form={searchForm}
          layout="inline"
          className={styles.searchForm}
        >
          <FormItem field="name">
            <Input placeholder="预算名称" style={{ width: 200 }} />
          </FormItem>
          <FormItem field="year">
            <Select placeholder="年份" style={{ width: 120 }} allowClear>
              {years.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </FormItem>
          <FormItem field="is_active">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="true">启用</Option>
              <Option value="false">停用</Option>
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
        title={editingId ? '编辑商务预算' : '新建商务预算'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="预算名称"
            field="name"
            rules={[{ required: true, message: '请输入预算名称' }]}
          >
            <Input placeholder="请输入预算名称" />
          </FormItem>
          <FormItem
            label="预算编码"
            field="code"
            rules={[{ required: true, message: '请输入预算编码' }]}
          >
            <Input placeholder="请输入预算编码" />
          </FormItem>
          <FormItem
            label="年份"
            field="year"
            rules={[{ required: true, message: '请选择年份' }]}
          >
            <Select placeholder="请选择年份">
              {years.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            label="预算金额(万元)"
            field="amount"
            rules={[{ required: true, message: '请输入预算金额' }]}
          >
            <InputNumber
              placeholder="请输入预算金额"
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </FormItem>
          <FormItem label="描述" field="description">
            <Input.TextArea placeholder="请输入描述" rows={4} />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default BudgetManagement
