/**
 * 法人主体管理页面
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
  Space,
  Popconfirm,
  Tag,
  Typography,
} from '@arco-design/web-react'
import { IconPlus, IconEdit, IconDelete, IconSearch } from '@arco-design/web-react/icon'
import BaseDataService from '../../api/baseDataService'
import type { LegalEntity, LegalEntityFormData } from '../../types'
import styles from './BaseDataManagement.module.css'

const { Title } = Typography
const FormItem = Form.Item

const LegalEntityManagement: React.FC = () => {
  const [data, setData] = useState<LegalEntity[]>([])
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

  // 加载数据
  const loadData = async (page = 1, pageSize = 10, searchParams = {}) => {
    try {
      setLoading(true)
      const response = await BaseDataService.getLegalEntities({
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
  const handleOpenModal = async (record?: LegalEntity) => {
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
      const formData: LegalEntityFormData = values

      if (editingId) {
        await BaseDataService.updateLegalEntity(editingId, formData)
        Message.success('更新成功')
      } else {
        await BaseDataService.createLegalEntity(formData)
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
      await BaseDataService.deleteLegalEntity(id)
      Message.success('删除成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除失败，该主体可能已被引用')
    }
  }

  // 切换状态
  const handleToggleStatus = async (record: LegalEntity) => {
    try {
      const newStatus = record.status === 'active' ? 'inactive' : 'active'
      await BaseDataService.toggleLegalEntityStatus(record.id, newStatus)
      Message.success('状态更新成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '状态更新失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '主体名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '主体编码',
      dataIndex: 'code',
      width: 120,
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'registration_number',
      width: 180,
    },
    {
      title: '法定代表人',
      dataIndex: 'legal_representative',
      width: 100,
    },
    {
      title: '注册资本(万元)',
      dataIndex: 'registered_capital',
      width: 120,
      render: (value: number) => value?.toLocaleString(),
    },
    {
      title: '营运状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '营运中' : '已注销'}
        </Tag>
      ),
    },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: LegalEntity) => (
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
            status={record.status === 'active' ? 'warning' : 'success'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '注销' : '恢复'}
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
          <Title heading={3}>法人主体管理</Title>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => handleOpenModal()}
          >
            新建主体
          </Button>
        </div>

        <Form
          form={searchForm}
          layout="inline"
          className={styles.searchForm}
        >
          <FormItem field="name">
            <Input placeholder="主体名称" style={{ width: 200 }} />
          </FormItem>
          <FormItem field="registration_number">
            <Input placeholder="统一社会信用代码" style={{ width: 200 }} />
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
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑法人主体' : '新建法人主体'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        style={{ width: 700 }}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="主体名称"
            field="name"
            rules={[{ required: true, message: '请输入主体名称' }]}
          >
            <Input placeholder="请输入主体名称" />
          </FormItem>
          <FormItem
            label="主体编码"
            field="code"
            rules={[{ required: true, message: '请输入主体编码' }]}
          >
            <Input placeholder="请输入主体编码" />
          </FormItem>
          <FormItem
            label="统一社会信用代码"
            field="registration_number"
            rules={[
              { required: true, message: '请输入统一社会信用代码' },
              { length: 18, message: '统一社会信用代码应为18位' }
            ]}
          >
            <Input placeholder="请输入统一社会信用代码" maxLength={18} />
          </FormItem>
          <FormItem
            label="法定代表人"
            field="legal_representative"
            rules={[{ required: true, message: '请输入法定代表人' }]}
          >
            <Input placeholder="请输入法定代表人" />
          </FormItem>
          <FormItem
            label="注册资本(万元)"
            field="registered_capital"
            rules={[{ required: true, message: '请输入注册资本' }]}
          >
            <InputNumber
              placeholder="请输入注册资本"
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </FormItem>
          <FormItem
            label="经营范围"
            field="business_scope"
            rules={[{ required: true, message: '请输入经营范围' }]}
          >
            <Input.TextArea placeholder="请输入经营范围" rows={4} />
          </FormItem>
          <FormItem
            label="注册地址"
            field="address"
            rules={[{ required: true, message: '请输入注册地址' }]}
          >
            <Input.TextArea placeholder="请输入注册地址" rows={2} />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default LegalEntityManagement
