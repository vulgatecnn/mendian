/**
 * 审批列表组件
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
  DatePicker,
} from '@arco-design/web-react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconRefresh } from '@arco-design/web-react/icon'
import ApprovalService from '../../../api/approvalService'
import type {
  ApprovalInstance,
  ApprovalInstanceQueryParams,
  PaginatedResponse,
} from '../../../types'

const FormItem = Form.Item
const RangePicker = DatePicker.RangePicker

interface ApprovalListProps {
  type: 'pending' | 'processed' | 'cc' | 'followed' | 'all' | 'initiated'
  title: string
}

const ApprovalList: React.FC<ApprovalListProps> = ({ type, title }) => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApprovalInstance[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    loadData()
  }, [type, pagination.current, pagination.pageSize])

  const loadData = async (params?: ApprovalInstanceQueryParams) => {
    try {
      setLoading(true)

      const queryParams: ApprovalInstanceQueryParams = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...params,
      }

      let response: PaginatedResponse<ApprovalInstance>

      switch (type) {
        case 'pending':
          response = await ApprovalService.getPendingInstances(queryParams)
          break
        case 'processed':
          response = await ApprovalService.getProcessedInstances(queryParams)
          break
        case 'cc':
          response = await ApprovalService.getCCInstances(queryParams)
          break
        case 'followed':
          response = await ApprovalService.getFollowedInstances(queryParams)
          break
        case 'initiated':
          response = await ApprovalService.getInitiatedInstances(queryParams)
          break
        case 'all':
          response = await ApprovalService.getAllInstances(queryParams)
          break
        default:
          response = await ApprovalService.getInstances(queryParams)
      }

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
    const params: ApprovalInstanceQueryParams = {}

    if (values.instance_no) {
      params.instance_no = values.instance_no
    }
    if (values.title) {
      params.title = values.title
    }
    if (values.status) {
      params.status = values.status
    }
    if (values.dateRange && values.dateRange.length === 2) {
      params.start_date = values.dateRange[0]
      params.end_date = values.dateRange[1]
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

  const handleViewDetail = (record: ApprovalInstance) => {
    navigate(`/approval/detail/${record.id}`)
  }

  // 渲染状态标签
  const renderStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'gray', text: '待审批' },
      in_progress: { color: 'blue', text: '审批中' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' },
      cancelled: { color: 'orange', text: '已取消' },
      withdrawn: { color: 'gray', text: '已撤销' },
    }
    const config = statusMap[status] || { color: 'gray', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns: any[] = [
    {
      title: '审批单号',
      dataIndex: 'instance_no',
      width: 180,
    },
    {
      title: '审批标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '审批模板',
      dataIndex: ['template', 'template_name'],
      width: 150,
    },
    {
      title: '发起人',
      dataIndex: ['initiator', 'full_name'],
      width: 100,
    },
    {
      title: '发起部门',
      dataIndex: ['initiator', 'department_name'],
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: '当前节点',
      dataIndex: ['current_node', 'node_name'],
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '发起时间',
      dataIndex: 'initiated_at',
      width: 180,
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: ApprovalInstance) => (
        <Space>
          <Button
            type="text"
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {type === 'pending' && record.status === 'in_progress' && (
            <Button
              type="text"
              size="small"
              status="success"
              onClick={() => handleViewDetail(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Card title={title} bordered={false}>
        <Form
          form={form}
          layout="inline"
          style={{ marginBottom: 20 }}
          autoComplete="off"
        >
          <FormItem field="instance_no">
            <Input
              placeholder="审批单号"
              style={{ width: 180 }}
              allowClear
            />
          </FormItem>
          <FormItem field="title">
            <Input
              placeholder="审批标题"
              style={{ width: 200 }}
              allowClear
            />
          </FormItem>
          <FormItem field="status">
            <Select
              placeholder="审批状态"
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value="pending">待审批</Select.Option>
              <Select.Option value="in_progress">审批中</Select.Option>
              <Select.Option value="approved">已通过</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
              <Select.Option value="withdrawn">已撤销</Select.Option>
            </Select>
          </FormItem>
          <FormItem field="dateRange">
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 260 }}
            />
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
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}

export default ApprovalList
