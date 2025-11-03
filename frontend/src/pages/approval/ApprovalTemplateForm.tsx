/**
 * 审批模板表单页面（创建/编辑）
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Message,
  Spin,
  Tabs,
  Switch,
} from '@arco-design/web-react'
import { useParams, useNavigate } from 'react-router-dom'
import ApprovalService from '../../api/approvalService'
import { FormDesigner, FlowDesigner } from './components'
import type { ApprovalTemplateFormData } from '../../types'

const FormItem = Form.Item
const TabPane = Tabs.TabPane

const ApprovalTemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formSchema, setFormSchema] = useState<any>({ fields: [] })
  const [flowConfig, setFlowConfig] = useState<any>({ nodes: [] })

  const isEdit = !!id

  useEffect(() => {
    if (isEdit) {
      loadTemplate()
    }
  }, [id])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const data = await ApprovalService.getTemplate(Number(id))

      form.setFieldsValue({
        template_code: data.template_code,
        template_name: data.template_name,
        description: data.description,
        is_active: data.is_active,
      })

      setFormSchema(data.form_schema || { fields: [] })
      setFlowConfig(data.flow_config || { nodes: [] })
    } catch (error) {
      Message.error('加载模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()

      // 验证表单设计
      if (!formSchema.fields || formSchema.fields.length === 0) {
        Message.warning('请设计表单字段')
        return
      }

      // 验证流程设计
      if (!flowConfig.nodes || flowConfig.nodes.length === 0) {
        Message.warning('请设计审批流程')
        return
      }

      setSubmitting(true)

      const data: ApprovalTemplateFormData = {
        template_code: values.template_code,
        template_name: values.template_name,
        description: values.description,
        form_schema: formSchema,
        flow_config: flowConfig,
        is_active: values.is_active !== undefined ? values.is_active : true,
      }

      if (isEdit) {
        await ApprovalService.updateTemplate(Number(id), data)
        Message.success('模板更新成功')
      } else {
        await ApprovalService.createTemplate(data)
        Message.success('模板创建成功')
      }

      navigate('/approval/template/list')
    } catch (error) {
      Message.error(isEdit ? '模板更新失败' : '模板创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title={isEdit ? '编辑审批模板' : '新建审批模板'}
        bordered={false}
      >
        <Spin loading={loading}>
          <Form
            form={form}
            layout="vertical"
            style={{ maxWidth: 1200 }}
            autoComplete="off"
          >
            <FormItem
              label="模板编码"
              field="template_code"
              rules={[{ required: true, message: '请输入模板编码' }]}
            >
              <Input
                placeholder="请输入模板编码"
                disabled={isEdit}
              />
            </FormItem>

            <FormItem
              label="模板名称"
              field="template_name"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="请输入模板名称" />
            </FormItem>

            <FormItem
              label="模板描述"
              field="description"
              rules={[{ required: true, message: '请输入模板描述' }]}
            >
              <Input.TextArea
                placeholder="请输入模板描述"
                rows={3}
              />
            </FormItem>

            <FormItem label="启用状态" field="is_active">
              <Switch defaultChecked />
            </FormItem>

            <Tabs defaultActiveTab="form" style={{ marginTop: 20 }}>
              <TabPane key="form" title="表单设计">
                <FormDesigner
                  value={formSchema}
                  onChange={setFormSchema}
                />
              </TabPane>
              <TabPane key="flow" title="流程设计">
                <FlowDesigner
                  value={flowConfig}
                  onChange={setFlowConfig}
                />
              </TabPane>
            </Tabs>

            <FormItem style={{ marginTop: 20 }}>
              <Space>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  {isEdit ? '更新' : '创建'}
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

export default ApprovalTemplateForm
