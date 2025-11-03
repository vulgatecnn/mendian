/**
 * 审批模板列表页面
 */
import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Message,
  Modal,
  Switch,
} from '@arco-design/web-react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconDelete,
  IconEye,
} from '@arco-design/web-react/icon'
import ApprovalService from '../../api/approvalService'
import type {
  ApprovalTemplate,
  ApprovalTemplateQueryParams,
} from '../../types'

const FormItem = Form.Item

const ApprovalTemplateList: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApprovalTemplate[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const loadData = async (params?: ApprovalTemplateQueryParams) => {
    try {
      setLoading(true)

      const queryParams: ApprovalTemplateQueryParams = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...params,
      }

      const response = await ApprovalService.getTemplates(queryParams)

      setData(response.results)
      setPagination({
        ...pagination,
        total: response.count,
      })
    } catch (error) {
      Message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: ApprovalTemplateQueryParams = {}

    if (values.template_code) {
      params.template_code = values.template_code
    }
    if (values.template_name) {
      params.template_name = values.template_name
    }
    if (values.is_active !== undefined) {
      params.is_active = values.is_active === 'true'
    }

    setPagination({ ...pagination, current: 1 })
    loadData(params)
  }

  const handleReset = () => {
    form.resetFields()
    setPagination({ ...pagination, current: 1 })
    loadData()
  }

  const handleTableChange = (pagination: any) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
    })
  }

  const handleCreate = () => {
    navigate('/approval/template/create')
  }

  const handleEdit = (record: ApprovalTemplate) => {
    navigate(`/approval/template/edit/${record.id}`)
  }

  const handleView = (record: ApprovalTemplate) => {
    navigate(`/approval/template/view/${record.id}`)
  }

  const handleToggleStatus = async (record: ApprovalTemplate) => {
    try {
      await ApprovalService.toggleTemplateStatus(record.id, !record.is_active)
      Message.success(record.is_active ? '模板已停用' : '模板已启用')
      loadData()
    } catch (error) {
      Message.error('操作失败')
    }
  }

  const handleDelete = (record: ApprovalTemplate) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模板"${record.template_name}"吗？`,
      onOk: async () => {
        try {
          await ApprovalService.deleteTemplate(record.id)
          Message.success('删除成功')
          loadData()
        } catch (error) {
          Message.error('删除失败')
        }
      },
    })
  }

  const columns: any[] = [
    {
      title: '模板编码',
      dataIndex: 'template_code',
      width: 150,
    },
    {
      title: '模板名称',
      dataIndex: 'template_name',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'green' : 'gray'}>
          {is_active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: ['created_by_info', 'full_name'],
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: ApprovalTemplate) => (
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
          <Switch
            size="small"
            checked={record.is_active}
            onChange={() => handleToggleStatus(record)}
          />
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
      ),
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title="审批模板管理"
        extra={
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={handleCreate}
          >
            新建模板
          </Button>
        }
        bordered={false}
      >
        <Form
          form={form}
          layout="inline"
          style={{ marginBottom: 20 }}
          autoComplete="off"
        >
          <FormItem field="template_code">
            <Input
              placeholder="模板编码"
              style={{ width: 180 }}
              allowClear
            />
          </FormItem>
          <FormItem field="template_name">
            <Input
              placeholder="模板名称"
              style={{ width: 200 }}
              allowClear
            />
          </FormItem>
          <FormItem field="is_active">
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value="true">启用</Select.Option>
              <Select.Option value="false">停用</Select.Option>
            </Select>
          </FormItem>
          <FormItem>
            <Space>
              <Button
                type="primary"
                icon={<IconSearch />}
                onClick={handleSearch}
              >
                查询
              </Button>
              <Button icon={<IconRefresh />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </FormItem>
        </Form>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: true,
            showJumper: true,
            sizeCanChange: true,
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}

export default ApprovalTemplateList
