/**
 * 跟进单表单组件
 */
import React, { useState, useEffect } from 'react'
import {
  Form,
  Select,
  Button,
  Space,
  Message,
  Grid
} from '@arco-design/web-react'
import { ExpansionService } from '../../api'
import { 
  FollowUpRecord, 
  FollowUpRecordFormData, 
  CandidateLocation
} from '../../types'

const { Row, Col } = Grid

interface FollowUpFormProps {
  followUp?: FollowUpRecord | null
  onSuccess: () => void
  onCancel: () => void
}

const FollowUpForm: React.FC<FollowUpFormProps> = ({
  followUp,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<CandidateLocation[]>([])

  // 加载可用的候选点位
  const loadAvailableLocations = async () => {
    try {
      const response = await ExpansionService.getLocations({
        status: 'available',
        page_size: 100
      })
      setLocations(response.results)
    } catch (error: any) {
      Message.error('加载候选点位失败')
    }
  }

  // 初始化表单数据
  useEffect(() => {
    if (followUp) {
      form.setFieldsValue({
        location_id: followUp.location_id,
        priority: followUp.priority
      })
    } else {
      form.resetFields()
    }
    
    loadAvailableLocations()
  }, [followUp, form])

  // 提交表单
  const handleSubmit = async (values: FollowUpRecordFormData) => {
    try {
      setLoading(true)
      
      if (followUp) {
        // 编辑模式
        await ExpansionService.updateFollowUp(followUp.id, values)
        Message.success('更新跟进单成功')
      } else {
        // 新建模式
        await ExpansionService.createFollowUp(values)
        Message.success('创建跟进单成功')
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
            label="候选点位"
            field="location_id"
            rules={[{ required: true, message: '请选择候选点位' }]}
          >
            <Select 
              placeholder="请选择候选点位"
              disabled={!!followUp} // 编辑时不允许修改点位
              showSearch
              filterOption={(inputValue, option) =>
                option?.props?.children?.toString().toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              {locations.map(location => (
                <Select.Option key={location.id} value={location.id}>
                  {location.name} - {location.province} {location.city} {location.district}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="优先级"
            field="priority"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
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
            {followUp ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default FollowUpForm