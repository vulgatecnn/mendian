/**
 * 门店档案表单页面
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Message,
  Breadcrumb,
  DatePicker,
  Grid
} from '@arco-design/web-react'
import { useNavigate, useParams } from 'react-router-dom'
import type { StoreProfileFormData } from '../../types'
import {
  getStoreProfile,
  createStoreProfile,
  updateStoreProfile
} from '../../api/archiveService'

const FormItem = Form.Item
const Option = Select.Option
const Row = Grid.Row
const Col = Grid.Col

// 门店类型选项
const STORE_TYPE_OPTIONS = [
  { value: 'direct', label: '直营店' },
  { value: 'franchise', label: '加盟店' },
  { value: 'joint', label: '联营店' }
]

// 经营模式选项
const OPERATION_MODE_OPTIONS = [
  { value: 'self_operated', label: '自营' },
  { value: 'franchised', label: '加盟' },
  { value: 'joint_venture', label: '联营' }
]

const StoreForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!id

  // 加载门店数据
  useEffect(() => {
    if (isEdit) {
      loadStoreData()
    }
  }, [id])

  const loadStoreData = async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await getStoreProfile(Number(id))
      
      // 填充表单
      form.setFieldsValue({
        store_code: response.data.store_code,
        store_name: response.data.store_name,
        province: response.data.province,
        city: response.data.city,
        district: response.data.district,
        address: response.data.address,
        business_region_id: response.data.business_region_id,
        store_type: response.data.store_type,
        operation_mode: response.data.operation_mode,
        follow_up_record_id: response.data.follow_up_record_id,
        construction_order_id: response.data.construction_order_id,
        opening_date: response.data.opening_date,
        store_manager_id: response.data.store_manager_id,
        business_manager_id: response.data.business_manager_id
      })
    } catch (error: any) {
      Message.error(error.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue() as StoreProfileFormData

      setSubmitting(true)

      if (isEdit) {
        await updateStoreProfile(Number(id), values)
        Message.success('更新成功')
      } else {
        await createStoreProfile(values)
        Message.success('创建成功')
      }

      navigate('/store-archive')
    } catch (error: any) {
      if (error.message) {
        Message.error(error.message || '操作失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 取消
  const handleCancel = () => {
    navigate('/store-archive')
  }

  return (
    <div style={{ padding: '20px' }}>
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item>门店档案</Breadcrumb.Item>
        <Breadcrumb.Item>档案列表</Breadcrumb.Item>
        <Breadcrumb.Item>{isEdit ? '编辑档案' : '新建档案'}</Breadcrumb.Item>
      </Breadcrumb>

      <Card
        title={isEdit ? '编辑门店档案' : '新建门店档案'}
        loading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Row gutter={24}>
            {/* 基本信息 */}
            <Col span={24}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                基本信息
              </div>
            </Col>

            <Col span={12}>
              <FormItem
                label="门店编码"
                field="store_code"
                rules={[{ required: true, message: '请输入门店编码' }]}
              >
                <Input placeholder="请输入门店编码" />
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem
                label="门店名称"
                field="store_name"
                rules={[{ required: true, message: '请输入门店名称' }]}
              >
                <Input placeholder="请输入门店名称" />
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem
                label="门店类型"
                field="store_type"
                rules={[{ required: true, message: '请选择门店类型' }]}
              >
                <Select placeholder="请选择门店类型">
                  {STORE_TYPE_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem
                label="经营模式"
                field="operation_mode"
                rules={[{ required: true, message: '请选择经营模式' }]}
              >
                <Select placeholder="请选择经营模式">
                  {OPERATION_MODE_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem
                label="开业日期"
                field="opening_date"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择开业日期"
                />
              </FormItem>
            </Col>

            {/* 地址信息 */}
            <Col span={24}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '24px 0 16px' }}>
                地址信息
              </div>
            </Col>

            <Col span={8}>
              <FormItem
                label="省份"
                field="province"
                rules={[{ required: true, message: '请输入省份' }]}
              >
                <Input placeholder="请输入省份" />
              </FormItem>
            </Col>

            <Col span={8}>
              <FormItem
                label="城市"
                field="city"
                rules={[{ required: true, message: '请输入城市' }]}
              >
                <Input placeholder="请输入城市" />
              </FormItem>
            </Col>

            <Col span={8}>
              <FormItem
                label="区县"
                field="district"
                rules={[{ required: true, message: '请输入区县' }]}
              >
                <Input placeholder="请输入区县" />
              </FormItem>
            </Col>

            <Col span={24}>
              <FormItem
                label="详细地址"
                field="address"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input.TextArea
                  placeholder="请输入详细地址"
                  rows={3}
                />
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem
                label="业务大区"
                field="business_region_id"
                rules={[{ required: true, message: '请选择业务大区' }]}
              >
                <Select placeholder="请选择业务大区">
                  {/* TODO: 从后端加载业务大区列表 */}
                </Select>
              </FormItem>
            </Col>

            {/* 负责人信息 */}
            <Col span={24}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '24px 0 16px' }}>
                负责人信息
              </div>
            </Col>

            <Col span={12}>
              <FormItem
                label="店长"
                field="store_manager_id"
              >
                <Select
                  placeholder="请选择店长"
                  allowClear
                  showSearch
                >
                  {/* TODO: 从后端加载用户列表 */}
                </Select>
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem
                label="商务负责人"
                field="business_manager_id"
              >
                <Select
                  placeholder="请选择商务负责人"
                  allowClear
                  showSearch
                >
                  {/* TODO: 从后端加载用户列表 */}
                </Select>
              </FormItem>
            </Col>

            {/* 关联信息 */}
            <Col span={24}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '24px 0 16px' }}>
                关联信息（可选）
              </div>
            </Col>

            <Col span={12}>
              <FormItem
                label="关联跟进单"
                field="follow_up_record_id"
              >
                <Select
                  placeholder="请选择关联跟进单"
                  allowClear
                  showSearch
                >
                  {/* TODO: 从后端加载跟进单列表 */}
                </Select>
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem
                label="关联工程单"
                field="construction_order_id"
              >
                <Select
                  placeholder="请选择关联工程单"
                  allowClear
                  showSearch
                >
                  {/* TODO: 从后端加载工程单列表 */}
                </Select>
              </FormItem>
            </Col>
          </Row>

          {/* 操作按钮 */}
          <FormItem>
            <Space>
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
              >
                {isEdit ? '保存' : '创建'}
              </Button>
              <Button onClick={handleCancel}>
                取消
              </Button>
            </Space>
          </FormItem>
        </Form>
      </Card>
    </div>
  )
}

export default StoreForm
