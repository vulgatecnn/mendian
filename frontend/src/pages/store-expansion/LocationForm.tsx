/**
 * 候选点位表单组件
 */
import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Message,
  Grid
} from '@arco-design/web-react'
import { ExpansionService } from '../../api'
import { 
  CandidateLocation, 
  CandidateLocationFormData, 
  BusinessRegion 
} from '../../types'

const { Row, Col } = Grid

interface LocationFormProps {
  location?: CandidateLocation | null
  regions: BusinessRegion[]
  onSuccess: () => void
  onCancel: () => void
}

const LocationForm: React.FC<LocationFormProps> = ({
  location,
  regions,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (location) {
      form.setFieldsValue({
        name: location.name,
        province: location.province,
        city: location.city,
        district: location.district,
        address: location.address,
        area: location.area,
        rent: location.rent,
        business_region_id: location.business_region_id
      })
    } else {
      form.resetFields()
    }
  }, [location, form])

  // 提交表单
  const handleSubmit = async (values: CandidateLocationFormData) => {
    try {
      setLoading(true)
      
      if (location) {
        // 编辑模式
        await ExpansionService.updateLocation(location.id, values)
        Message.success('更新候选点位成功')
      } else {
        // 新建模式
        await ExpansionService.createLocation(values)
        Message.success('创建候选点位成功')
      }
      
      onSuccess()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="点位名称"
            field="name"
            rules={[
              { required: true, message: '请输入点位名称' },
              { maxLength: 200, message: '点位名称不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入点位名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="业务大区"
            field="business_region_id"
            rules={[{ required: true, message: '请选择业务大区' }]}
          >
            <Select placeholder="请选择业务大区">
              {regions.map(region => (
                <Select.Option key={region.id} value={region.id}>
                  {region.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="省份"
            field="province"
            rules={[{ required: true, message: '请选择省份' }]}
          >
            <Select placeholder="请选择省份">
              <Select.Option value="北京市">北京市</Select.Option>
              <Select.Option value="上海市">上海市</Select.Option>
              <Select.Option value="天津市">天津市</Select.Option>
              <Select.Option value="重庆市">重庆市</Select.Option>
              <Select.Option value="广东省">广东省</Select.Option>
              <Select.Option value="江苏省">江苏省</Select.Option>
              <Select.Option value="浙江省">浙江省</Select.Option>
              <Select.Option value="山东省">山东省</Select.Option>
              <Select.Option value="河南省">河南省</Select.Option>
              <Select.Option value="四川省">四川省</Select.Option>
              <Select.Option value="湖北省">湖北省</Select.Option>
              <Select.Option value="湖南省">湖南省</Select.Option>
              <Select.Option value="河北省">河北省</Select.Option>
              <Select.Option value="福建省">福建省</Select.Option>
              <Select.Option value="安徽省">安徽省</Select.Option>
              <Select.Option value="辽宁省">辽宁省</Select.Option>
              <Select.Option value="江西省">江西省</Select.Option>
              <Select.Option value="陕西省">陕西省</Select.Option>
              <Select.Option value="黑龙江省">黑龙江省</Select.Option>
              <Select.Option value="吉林省">吉林省</Select.Option>
              <Select.Option value="山西省">山西省</Select.Option>
              <Select.Option value="广西壮族自治区">广西壮族自治区</Select.Option>
              <Select.Option value="内蒙古自治区">内蒙古自治区</Select.Option>
              <Select.Option value="宁夏回族自治区">宁夏回族自治区</Select.Option>
              <Select.Option value="新疆维吾尔自治区">新疆维吾尔自治区</Select.Option>
              <Select.Option value="西藏自治区">西藏自治区</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="城市"
            field="city"
            rules={[{ required: true, message: '请输入城市' }]}
          >
            <Input placeholder="请输入城市" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="区县"
            field="district"
            rules={[{ required: true, message: '请输入区县' }]}
          >
            <Input placeholder="请输入区县" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label="详细地址"
        field="address"
        rules={[
          { required: true, message: '请输入详细地址' },
          { maxLength: 500, message: '详细地址不能超过500个字符' }
        ]}
      >
        <Input.TextArea
          placeholder="请输入详细地址"
          rows={3}
          showWordLimit
          maxLength={500}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="面积(㎡)"
            field="area"
            rules={[
              { required: true, message: '请输入面积' },
              { 
                type: 'number', 
                min: 0.01, 
                message: '面积必须大于0' 
              }
            ]}
          >
            <InputNumber
              placeholder="请输入面积"
              precision={2}
              min={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="租金(元/月)"
            field="rent"
            rules={[
              { required: true, message: '请输入租金' },
              { 
                type: 'number', 
                min: 0, 
                message: '租金不能为负数' 
              }
            ]}
          >
            <InputNumber
              placeholder="请输入租金"
              precision={2}
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            {location ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default LocationForm