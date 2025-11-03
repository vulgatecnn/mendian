/**
 * 验收操作表单组件
 */
import React, { useState } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Message,
  Upload,
  Card,
  Divider
} from '@arco-design/web-react'
import { IconPlus, IconDelete } from '@arco-design/web-react/icon'
import { PreparationService } from '../../api'
import { AcceptanceParams, RectificationItem, RectificationStatus } from '../../types'

const FormItem = Form.Item

interface AcceptanceFormProps {
  constructionOrderId: number
  onSuccess: () => void
  onCancel: () => void
}

const AcceptanceForm: React.FC<AcceptanceFormProps> = ({
  constructionOrderId,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rectificationItems, setRectificationItems] = useState<RectificationItem[]>([])
  const [fileList, setFileList] = useState<any[]>([])

  // 添加整改项
  const handleAddRectification = () => {
    setRectificationItems([
      ...rectificationItems,
      {
        description: '',
        responsible_person: '',
        status: 'pending' as RectificationStatus
      }
    ])
  }

  // 删除整改项
  const handleRemoveRectification = (index: number) => {
    const newItems = rectificationItems.filter((_, i) => i !== index)
    setRectificationItems(newItems)
  }

  // 更新整改项
  const handleUpdateRectification = (index: number, field: string, value: any) => {
    const newItems = [...rectificationItems]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setRectificationItems(newItems)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate()
      setLoading(true)

      // 验证整改项
      if (values.acceptance_result !== 'passed' && rectificationItems.length === 0) {
        Message.warning('验收不通过时需要添加整改项')
        setLoading(false)
        return
      }

      for (const item of rectificationItems) {
        if (!item.description || !item.responsible_person) {
          Message.warning('请完善整改项信息')
          setLoading(false)
          return
        }
      }

      const params: AcceptanceParams = {
        acceptance_date: values.acceptance_date,
        acceptance_result: values.acceptance_result,
        remarks: values.remarks,
        rectification_items: rectificationItems.length > 0 ? rectificationItems : undefined,
        photos: fileList.map(file => file.url || file.response?.url)
      }

      await PreparationService.performAcceptance(constructionOrderId, params)
      Message.success('验收操作成功')
      onSuccess()
    } catch (error: any) {
      if (error.errors) {
        return
      }
      Message.error(error?.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
      initialValues={{
        acceptance_date: new Date().toISOString().split('T')[0],
        acceptance_result: 'passed'
      }}
    >
      <FormItem
        label="验收日期"
        field="acceptance_date"
        rules={[{ required: true, message: '请选择验收日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </FormItem>

      <FormItem
        label="验收结果"
        field="acceptance_result"
        rules={[{ required: true, message: '请选择验收结果' }]}
      >
        <Select>
          <Select.Option value="passed">通过</Select.Option>
          <Select.Option value="conditional">有条件通过</Select.Option>
          <Select.Option value="failed">不通过</Select.Option>
        </Select>
      </FormItem>

      <FormItem
        label="验收备注"
        field="remarks"
      >
        <Input.TextArea
          placeholder="请输入验收备注"
          rows={3}
        />
      </FormItem>

      <FormItem label="验收照片">
        <Upload
          multiple
          accept="image/*"
          fileList={fileList}
          onChange={setFileList}
          listType="picture-card"
        />
      </FormItem>

      <Divider />

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 500 }}>整改项</div>
        <Button
          type="primary"
          size="small"
          icon={<IconPlus />}
          onClick={handleAddRectification}
        >
          添加整改项
        </Button>
      </div>

      {rectificationItems.map((item, index) => (
        <Card
          key={index}
          style={{ marginBottom: '12px' }}
          extra={
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
              onClick={() => handleRemoveRectification(index)}
            >
              删除
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="问题描述"
              value={item.description}
              onChange={(value) => handleUpdateRectification(index, 'description', value)}
            />
            <Input
              placeholder="责任人"
              value={item.responsible_person}
              onChange={(value) => handleUpdateRectification(index, 'responsible_person', value)}
            />
            <DatePicker
              style={{ width: '100%' }}
              placeholder="整改期限"
              value={item.deadline}
              onChange={(value) => handleUpdateRectification(index, 'deadline', value)}
            />
            <Input.TextArea
              placeholder="备注"
              rows={2}
              value={item.remarks}
              onChange={(value) => handleUpdateRectification(index, 'remarks', value)}
            />
          </Space>
        </Card>
      ))}

      <FormItem>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            提交验收
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </FormItem>
    </Form>
  )
}

export default AcceptanceForm
