/**
 * 工程单表单组件
 */
import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Message
} from '@arco-design/web-react'
import { PreparationService } from '../../api'
import {
  ConstructionOrder,
  ConstructionOrderFormData,
  Supplier
} from '../../types'

const FormItem = Form.Item

interface ConstructionFormProps {
  order: ConstructionOrder | null
  onSuccess: () => void
  onCancel: () => void
}

const ConstructionForm: React.FC<ConstructionFormProps> = ({
  order,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [followUps, setFollowUps] = useState<any[]>([])

  // 加载供应商列表
  const loadSuppliers = async () => {
    try {
      const response = await PreparationService.getSuppliers()
      setSuppliers(response.filter(s => s.cooperation_status === 'active'))
    } catch (error: any) {
      Message.error('加载供应商列表失败')
    }
  }

  // 加载可用的跟进单列表
  const loadFollowUps = async () => {
    try {
      const response = await PreparationService.getAvailableFollowUps()
      setFollowUps(response)
    } catch (error: any) {
      Message.error('加载跟进单列表失败')
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate()
      setLoading(true)

      const formData: ConstructionOrderFormData = {
        store_name: values.store_name,
        follow_up_record_id: values.follow_up_record_id,
        supplier_id: values.supplier_id,
        construction_start_date: values.construction_start_date,
        construction_end_date: values.construction_end_date
      }

      if (order) {
        await PreparationService.updateConstructionOrder(order.id, formData)
        Message.success('更新工程单成功')
      } else {
        await PreparationService.createConstructionOrder(formData)
        Message.success('创建工程单成功')
      }

      onSuccess()
    } catch (error: any) {
      if (error.errors) {
        // 表单验证错误
        return
      }
      Message.error(error?.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化表单
  useEffect(() => {
    loadSuppliers()
    loadFollowUps()

    if (order) {
      form.setFieldsValue({
        store_name: order.store_name,
        follow_up_record_id: order.follow_up_record_id,
        supplier_id: order.supplier_id,
        construction_start_date: order.construction_start_date,
        construction_end_date: order.construction_end_date
      })
    }
  }, [order])

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
    >
      <FormItem
        label="门店名称"
        field="store_name"
        rules={[{ required: true, message: '请输入门店名称' }]}
      >
        <Input placeholder="请输入门店名称" />
      </FormItem>

      <FormItem
        label="关联跟进单"
        field="follow_up_record_id"
        rules={[{ required: true, message: '请选择关联跟进单' }]}
      >
        <Select
          placeholder="请选择关联跟进单"
          showSearch
          filterOption={(inputValue, option) =>
            option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
          }
        >
          {followUps.map(followUp => (
            <Select.Option key={followUp.id} value={followUp.id}>
              {followUp.record_no} - {followUp.location?.name}
            </Select.Option>
          ))}
        </Select>
      </FormItem>

      <FormItem
        label="施工供应商"
        field="supplier_id"
      >
        <Select
          placeholder="请选择施工供应商"
          allowClear
        >
          {suppliers.map(supplier => (
            <Select.Option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </Select.Option>
          ))}
        </Select>
      </FormItem>

      <FormItem
        label="开工日期"
        field="construction_start_date"
      >
        <DatePicker style={{ width: '100%' }} />
      </FormItem>

      <FormItem
        label="预计完工日期"
        field="construction_end_date"
      >
        <DatePicker style={{ width: '100%' }} />
      </FormItem>

      <FormItem>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {order ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </FormItem>
    </Form>
  )
}

export default ConstructionForm
