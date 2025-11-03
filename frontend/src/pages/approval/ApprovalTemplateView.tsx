/**
 * 审批模板预览页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  Message,
  Tag,
  Divider,
  Table,
} from '@arco-design/web-react'
import { useParams, useNavigate } from 'react-router-dom'
import ApprovalService from '../../api/approvalService'
import type { ApprovalTemplate } from '../../types'

const ApprovalTemplateView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState<ApprovalTemplate | null>(null)

  useEffect(() => {
    if (id) {
      loadTemplate()
    }
  }, [id])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const data = await ApprovalService.getTemplate(Number(id))
      setTemplate(data)
    } catch (error) {
      Message.error('加载模板失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin />
      </div>
    )
  }

  if (!template) {
    return null
  }

  const formColumns = [
    {
      title: '字段名称',
      dataIndex: 'name',
    },
    {
      title: '字段标签',
      dataIndex: 'label',
    },
    {
      title: '字段类型',
      dataIndex: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          input: '单行文本',
          textarea: '多行文本',
          select: '下拉选择',
          number: '数字',
          date: '日期',
          radio: '单选',
          checkbox: '多选',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      render: (required: boolean) => (required ? '是' : '否'),
    },
  ]

  const flowColumns = [
    {
      title: '序号',
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '节点名称',
      dataIndex: 'name',
    },
    {
      title: '节点类型',
      dataIndex: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          approval: '审批',
          cc: '抄送',
          condition: '条件',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '审批人配置',
      dataIndex: 'approvers',
      render: (approvers: any) => {
        const typeMap: Record<string, string> = {
          fixed_users: '固定人员',
          role: '角色',
          department_manager: '部门负责人',
          initiator_manager: '发起人上级',
        }
        return typeMap[approvers.type] || approvers.type
      },
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title="审批模板详情"
        extra={
          <Space>
            <Button onClick={() => navigate(`/approval/template/edit/${id}`)}>
              编辑
            </Button>
            <Button onClick={() => navigate(-1)}>返回</Button>
          </Space>
        }
        bordered={false}
      >
        <Descriptions
          column={2}
          data={[
            { label: '模板编码', value: template.template_code },
            {
              label: '状态',
              value: (
                <Tag color={template.is_active ? 'green' : 'gray'}>
                  {template.is_active ? '启用' : '停用'}
                </Tag>
              ),
            },
            { label: '模板名称', value: template.template_name },
            { label: '创建人', value: template.created_by_info?.full_name },
            { label: '模板描述', value: template.description, span: 2 },
            { label: '创建时间', value: template.created_at },
            { label: '更新时间', value: template.updated_at },
          ]}
        />

        <Divider />

        <div style={{ marginBottom: 20 }}>
          <h3>表单设计</h3>
          <Table
            columns={formColumns}
            data={template.form_schema?.fields || []}
            pagination={false}
            rowKey="name"
          />
        </div>

        <Divider />

        <div>
          <h3>流程设计</h3>
          <Table
            columns={flowColumns}
            data={template.flow_config?.nodes || []}
            pagination={false}
            rowKey={(_record: any, index?: number) => String(index)}
          />
        </div>
      </Card>
    </div>
  )
}

export default ApprovalTemplateView
