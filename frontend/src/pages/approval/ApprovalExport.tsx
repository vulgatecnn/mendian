/**
 * 审批台账导出页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Message,
  Progress,
  Alert,
} from '@arco-design/web-react'
import { IconDownload } from '@arco-design/web-react/icon'
import ApprovalService from '../../api/approvalService'
import type { ApprovalTemplate, ApprovalExportParams } from '../../types'

const FormItem = Form.Item
const RangePicker = DatePicker.RangePicker

const ApprovalExport: React.FC = () => {
  const [form] = Form.useForm()
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

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

  const handleExport = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()

      setExporting(true)
      setExportProgress(0)

      const params: ApprovalExportParams = {}

      if (values.template_id) {
        params.template_id = values.template_id
      }
      if (values.status) {
        params.status = values.status
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.start_date = values.dateRange[0]
        params.end_date = values.dateRange[1]
      }

      // 模拟导出进度
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const blob = await ApprovalService.exportApprovals(params)

      clearInterval(progressInterval)
      setExportProgress(100)

      // 生成文件名
      const template = templates.find((t) => t.id === values.template_id)
      const templateName = template ? template.template_name : '全部'
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `审批台账_${templateName}_${dateStr}.xlsx`

      // 下载文件
      ApprovalService.downloadApprovalExport(blob, filename)

      Message.success('导出成功')

      // 重置进度
      setTimeout(() => {
        setExportProgress(0)
        setExporting(false)
      }, 1000)
    } catch (error) {
      Message.error('导出失败')
      setExporting(false)
      setExportProgress(0)
    }
  }

  const handleReset = () => {
    form.resetFields()
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card title="审批台账导出" bordered={false}>
        <Alert
          type="info"
          content="导出审批台账数据为 Excel 文件，可按模板、状态、时间范围进行筛选。"
          style={{ marginBottom: 20 }}
        />

        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 600 }}
          autoComplete="off"
        >
          <FormItem label="审批模板" field="template_id">
            <Select
              placeholder="请选择审批模板（不选则导出全部）"
              allowClear
              showSearch
              loading={loading}
            >
              {templates.map((template) => (
                <Select.Option key={template.id} value={template.id}>
                  {template.template_name}
                </Select.Option>
              ))}
            </Select>
          </FormItem>

          <FormItem label="审批状态" field="status">
            <Select placeholder="请选择审批状态（不选则导出全部）" allowClear>
              <Select.Option value="pending">待审批</Select.Option>
              <Select.Option value="in_progress">审批中</Select.Option>
              <Select.Option value="approved">已通过</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
              <Select.Option value="withdrawn">已撤销</Select.Option>
            </Select>
          </FormItem>

          <FormItem label="时间范围" field="dateRange">
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%' }}
            />
          </FormItem>

          {exporting && (
            <FormItem>
              <Progress
                percent={exportProgress}
                status={exportProgress === 100 ? 'success' : 'normal'}
              />
            </FormItem>
          )}

          <FormItem>
            <Space>
              <Button
                type="primary"
                icon={<IconDownload />}
                onClick={handleExport}
                loading={exporting}
              >
                导出
              </Button>
              <Button onClick={handleReset} disabled={exporting}>
                重置
              </Button>
            </Space>
          </FormItem>
        </Form>

        <div style={{ marginTop: 40, padding: 20, background: '#f7f8fa', borderRadius: 4 }}>
          <h4>导出说明</h4>
          <ul style={{ marginTop: 10, paddingLeft: 20 }}>
            <li>导出的 Excel 文件包含审批单号、标题、模板、发起人、状态、发起时间等信息</li>
            <li>如果选择了具体模板，还会包含该模板的表单数据</li>
            <li>导出数据受当前用户的数据权限限制</li>
            <li>大量数据导出可能需要较长时间，请耐心等待</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default ApprovalExport
