/**
 * 交付清单表单组件
 */
import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Message
} from '@arco-design/web-react'
import { PreparationService } from '../../api'
import {
  DeliveryChecklist,
  DeliveryChecklistFormData,
  ConstructionOrder
} from '../../types'

const FormItem = Form.Item

interface DeliveryFormProps {
  checklist: DeliveryChecklist | null
  onSuccess: () => void
  onCancel: () => void
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({
  checklist,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [constructionOrders, setConstructionOrders] = useState<ConstructionOrder[]>([])

  // 加载工程单列表
  const loadConstructionOrders = async () => {
    try {
      const response = await PreparationService.getConstructionOrders({
        status: 'completed',
        page_size: 1000
      })
      setConstructionOrders(response.results)
    } catch (error: any) {
      Message.error('加载工程单列表失败')
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate()
      setLoading(true)

      const formData: DeliveryChecklistFormData = {
        construction_order_id: values.construction_order_id,
        store_name: values.store_name
      }

      if (checklist) {
        await PreparationService.updateDeliveryChecklist(checklist.id, formData)
        Message.success('更新交付清单成功')
      } else {
        await PreparationService.createDeliveryChecklist(formData)
        Message.success('创建交付清单成功')
      }

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

  // 初始化表单
  useEffect(() => {
    loadConstructionOrders()

    if (checklist) {
      form.setFieldsValue({
        construction_order_id: checklist.construction_order_id,
        store_name: checklist.store_name
      })
    }
  }, [checklist])

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
    >
      <FormItem
        label="关联工程单"
        field="construction_order_id"
        rules={[{ required: true, message: '请选择关联工程单' }]}
      >
        <Select
          placeholder="请选择关联工程单"
          showSearch
          filterOption={(inputValue, option) =>
            option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
          }
        >
          {constructionOrders.map(order => (
            <Select.Option key={order.id} value={order.id}>
              {order.order_no} - {order.store_name}
            </Select.Option>
          ))}
        </Select>
      </FormItem>

      <FormItem
        label="门店名称"
        field="store_name"
        rules={[{ required: true, message: '请输入门店名称' }]}
      >
        <Input placeholder="请输入门店名称" />
      </FormItem>

      <FormItem>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {checklist ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </FormItem>
    </Form>
  )
}

export default DeliveryForm
