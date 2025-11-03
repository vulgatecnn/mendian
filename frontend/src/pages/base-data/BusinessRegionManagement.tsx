/**
 * 业务大区管理页面
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
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-react/icon'
import BaseDataService from '../../api/baseDataService'
import type { BusinessRegion, BusinessRegionFormData } from '../../types'
import styles from './BaseDataManagement.module.css'

const { Title } = Typography
const FormItem = Form.Item
const Option = Select.Option

const BusinessRegionManagement: React.FC = () => {
  const [data, setData] = useState<BusinessRegion[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 省份列表（简化版，实际应该从配置获取）
  const provinces = [
    '北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
    '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南',
    '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾',
    '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门'
  ]

  // 加载数据
  const loadData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const response = await BaseDataService.getBusinessRegions({
        page,
        page_size: pageSize,
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

  // 打开新建/编辑对话框
  const handleOpenModal = async (record?: BusinessRegion) => {
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue({
        name: record.name,
        code: record.code,
        description: record.description,
        provinces: [], // 需要从后端获取关联的省份
      })
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
      const formData: BusinessRegionFormData = values

      if (editingId) {
        await BaseDataService.updateBusinessRegion(editingId, formData)
        Message.success('更新成功')
      } else {
        await BaseDataService.createBusinessRegion(formData)
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
      await BaseDataService.deleteBusinessRegion(id)
      Message.success('删除成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除失败，该大区可能已被引用')
    }
  }

  // 切换状态
  const handleToggleStatus = async (record: BusinessRegion) => {
    try {
      await BaseDataService.toggleBusinessRegionStatus(record.id, !record.is_active)
      Message.success('状态更新成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '状态更新失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '大区名称',
      dataIndex: 'name',
    },
    {
      title: '大区编码',
      dataIndex: 'code',
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
      render: (_: any, record: BusinessRegion) => (
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
            content="删除后无法恢复，且该大区不能被业务数据引用"
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
          <Title heading={3}>业务大区管理</Title>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => handleOpenModal()}
          >
            新建大区
          </Button>
        </div>

        <Table
          loading={loading}
          columns={columns}
          data={data}
          pagination={{
            ...pagination,
            showTotal: true,
            sizeCanChange: true,
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingId ? '编辑业务大区' : '新建业务大区'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        autoFocus={false}
        focusLock={true}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="大区名称"
            field="name"
            rules={[{ required: true, message: '请输入大区名称' }]}
          >
            <Input placeholder="请输入大区名称" />
          </FormItem>
          <FormItem
            label="大区编码"
            field="code"
            rules={[{ required: true, message: '请输入大区编码' }]}
          >
            <Input placeholder="请输入大区编码" />
          </FormItem>
          <FormItem label="描述" field="description">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </FormItem>
          <FormItem
            label="关联省份"
            field="provinces"
            rules={[{ required: true, message: '请选择关联省份' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择关联省份"
              allowClear
            >
              {provinces.map(province => (
                <Option key={province} value={province}>
                  {province}
                </Option>
              ))}
            </Select>
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default BusinessRegionManagement
