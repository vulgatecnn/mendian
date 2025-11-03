/**
 * 审批发起页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Space,
  Message,
  Spin,
} from '@arco-design/web-react'
import { useNavigate } from 'react-router-dom'
import ApprovalService from '../../api/approvalService'
import type { ApprovalTemplate, ApprovalInstanceFormData } from '../../types'

const FormItem = Form.Item

interface ApprovalInitiateProps {
  businessType?: string
  businessId?: number
  onSuccess?: () => void
}

const ApprovalInitiate: React.FC<ApprovalInitiateProps> = ({
  businessType,
  businessId,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 加载审批模板列表
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await ApprovalService.getTemplates({ is_active: true })
      setTemplates(response.results)
    } catch (error) {
      Message.error('加载审批模板失败')
    } finally {
      setLoading(false)
    }
  }

  // 选择模板时加载模板详情
  const handleTemplateChange = async (templateId: number) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      // 清空表单数据
      form.resetFields(['form_data'])
    }
  }

  // 提交审批
  const handleSubmit = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()

      setSubmitting(true)

      const data: ApprovalInstanceFormData = {
        template_id: values.template_id,
        title: values.title,
        form_data: values.form_data || {},
        business_type: businessType || values.business_type,
        business_id: businessId || values.business_id,
      }

      const instance = await ApprovalService.createInstance(data)
      Message.success('审批发起成功')

      if (onSuccess) {
        onSuccess()
      } else {
        navigate(`/approval/detail/${instance.id}`)
      }
    } catch (error) {
      Message.error('审批发起失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 渲染动态表单字段
  const renderFormFields = () => {
    if (!selectedTemplate || !selectedTemplate.form_schema) {
      return null
    }

    const { fields } = selectedTemplate.form_schema

    return fields?.map((field: any) => {
      const { name, label, type, required, options, placeholder } = field

      let component

      switch (type) {
        case 'input':
          component = <Input placeholder={placeholder} />
          break
        case 'textarea':
          component = <Input.TextArea placeholder={placeholder} rows={4} />
          break
        case 'select':
          component = (
            <Select placeholder={placeholder}>
              {options?.map((opt: any) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          )
          break
        case 'number':
          component = <Input type="number" placeholder={placeholder} />
          break
        default:
          component = <Input placeholder={placeholder} />
      }

      return (
        <FormItem
          key={name}
          label={label}
          field={`form_data.${name}`}
          rules={[{ required, message: `请输入${label}` }]}
        >
          {component}
        </FormItem>
      )
    })
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card title="发起审批" bordered={false}>
        <Spin loading={loading}>
          <Form
            form={form}
            layout="vertical"
            style={{ maxWidth: 800 }}
            autoComplete="off"
          >
            <FormItem
              label="审批模板"
              field="template_id"
              rules={[{ required: true, message: '请选择审批模板' }]}
            >
              <Select
                placeholder="请选择审批模板"
                onChange={handleTemplateChange}
                showSearch
                filterOption={(inputValue, option) =>
                  option.props.children.toLowerCase().includes(inputValue.toLowerCase())
                }
              >
                {templates.map((template) => (
                  <Select.Option key={template.id} value={template.id}>
                    {template.template_name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>

            <FormItem
              label="审批标题"
              field="title"
              rules={[{ required: true, message: '请输入审批标题' }]}
            >
              <Input placeholder="请输入审批标题" />
            </FormItem>

            {!businessType && (
              <FormItem
                label="业务类型"
                field="business_type"
                rules={[{ required: true, message: '请输入业务类型' }]}
              >
                <Input placeholder="请输入业务类型" />
              </FormItem>
            )}

            {!businessId && (
              <FormItem
                label="业务ID"
                field="business_id"
                rules={[{ required: true, message: '请输入业务ID' }]}
              >
                <Input type="number" placeholder="请输入业务ID" />
              </FormItem>
            )}

            {selectedTemplate && (
              <>
                <div style={{ marginBottom: 16, fontWeight: 'bold' }}>
                  表单信息
                </div>
                {renderFormFields()}
              </>
            )}

            <FormItem>
              <Space>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!selectedTemplate}
                >
                  提交审批
                </Button>
                <Button onClick={() => navigate(-1)}>取消</Button>
              </Space>
            </FormItem>
          </Form>
        </Spin>
      </Card>
    </div>
  )
}

export default ApprovalInitiate
