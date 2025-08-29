import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Space,
  Divider,
  Alert,
  Upload,
  message,
  AutoComplete,
  Switch
} from 'antd'
import {
  SaveOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  InboxOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useStorePlanStore } from '@/stores/storePlanStore'
import type { StorePlan, CreateStorePlanDto, UpdateStorePlanDto } from '@/services/types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

interface PlanFormProps {
  initialValues?: Partial<StorePlan>
  isEdit?: boolean
  onSubmit?: (values: CreateStorePlanDto | UpdateStorePlanDto) => Promise<void>
  loading?: boolean
}

interface FormValues {
  name: string
  description?: string
  type: StorePlan['type']
  priority: StorePlan['priority']
  regionId: string
  targetOpenDate: dayjs.Dayjs
  budget: number
  storeCount?: number
  address?: string
  responsibleUser?: string
  notes?: string
  isUrgent?: boolean
  milestones?: Array<{
    name: string
    targetDate: dayjs.Dayjs
    responsible: string
  }>
}

const PlanForm: React.FC<PlanFormProps> = ({
  initialValues,
  isEdit = false,
  onSubmit,
  loading = false
}) => {
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const [isDraft, setIsDraft] = useState(true)
  const [fileList, setFileList] = useState<any[]>([])
  const [milestones, setMilestones] = useState<FormValues['milestones']>([])

  // 模拟选项数据 - 实际项目中应从API获取
  const regionOptions = [
    { value: '1', label: '华北大区' },
    { value: '2', label: '华南大区' },
    { value: '3', label: '华东大区' },
    { value: '4', label: '西南大区' },
    { value: '5', label: '西北大区' }
  ]

  const userOptions = [
    { value: 'user1', label: '张三' },
    { value: 'user2', label: '李四' },
    { value: 'user3', label: '王五' },
    { value: 'user4', label: '赵六' }
  ]

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        targetOpenDate: initialValues.targetOpenDate ? dayjs(initialValues.targetOpenDate) : undefined,
        milestones: initialValues.milestones?.map(milestone => ({
          name: milestone.name,
          targetDate: dayjs(milestone.targetDate),
          responsible: milestone.responsible
        }))
      }
      form.setFieldsValue(formValues)
      setMilestones(formValues.milestones || [])
      setIsDraft(initialValues.status === 'draft')
    }
  }, [initialValues, form])

  const handleSubmit = async (values: FormValues) => {
    try {
      const submitData = {
        ...values,
        targetOpenDate: values.targetOpenDate.toISOString(),
        regionId: values.regionId,
        milestones: milestones?.map(milestone => ({
          ...milestone,
          targetDate: milestone.targetDate.toISOString()
        })),
        status: isDraft ? 'draft' as const : 'pending' as const
      }

      if (onSubmit) {
        await onSubmit(submitData)
      }
    } catch (error) {
      message.error('保存失败，请重试')
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const handleAddMilestone = () => {
    setMilestones(prev => [
      ...(prev || []),
      {
        name: '',
        targetDate: dayjs().add(30, 'days'),
        responsible: ''
      }
    ])
  }

  const handleRemoveMilestone = (index: number) => {
    setMilestones(prev => prev?.filter((_, i) => i !== index))
  }

  const handleMilestoneChange = (index: number, field: string, value: any) => {
    setMilestones(prev => {
      const newMilestones = [...(prev || [])]
      newMilestones[index] = {
        ...newMilestones[index],
        [field]: value
      }
      return newMilestones
    })
  }

  const uploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    onChange: (info: any) => {
      setFileList(info.fileList)
    },
    beforeUpload: () => false, // 阻止自动上传
    onRemove: (file: any) => {
      setFileList(prev => prev.filter(item => item.uid !== file.uid))
    }
  }

  const validateMessages = {
    required: '${label}是必填项',
    string: {
      range: '${label}长度必须在${min}-${max}之间'
    },
    number: {
      range: '${label}必须在${min}-${max}之间'
    }
  }

  return (
    <div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          validateMessages={validateMessages}
          initialValues={{
            type: 'direct',
            priority: 'medium',
            budget: 50,
            storeCount: 1,
            isUrgent: false
          }}
        >
          {/* 基础信息 */}
          <Card title="基础信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="计划名称"
                  rules={[
                    { required: true },
                    { min: 2, max: 100 }
                  ]}
                >
                  <Input
                    placeholder="请输入计划名称"
                    showCount
                    maxLength={100}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="type"
                  label="门店类型"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="请选择门店类型">
                    <Option value="direct">直营</Option>
                    <Option value="franchise">加盟</Option>
                    <Option value="joint_venture">合营</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="priority"
                  label="优先级"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="请选择优先级">
                    <Option value="low">低</Option>
                    <Option value="medium">中</Option>
                    <Option value="high">高</Option>
                    <Option value="urgent">紧急</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="regionId"
                  label="所属大区"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="请选择所属大区"
                    options={regionOptions}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="responsibleUser"
                  label="负责人"
                  rules={[{ required: true }]}
                >
                  <AutoComplete
                    placeholder="请选择或输入负责人"
                    options={userOptions}
                    filterOption={(inputValue, option) =>
                      (option?.label ?? '').toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="计划描述"
            >
              <TextArea
                placeholder="请描述开店计划的详细信息、目标和要求"
                rows={4}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Card>

          {/* 目标设置 */}
          <Card title="目标设置" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="storeCount"
                  label="计划开店数量"
                  rules={[
                    { required: true },
                    { type: 'number', min: 1, max: 100 }
                  ]}
                >
                  <InputNumber
                    placeholder="门店数量"
                    min={1}
                    max={100}
                    style={{ width: '100%' }}
                    addonAfter="家"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="budget"
                  label="预算金额"
                  rules={[
                    { required: true },
                    { type: 'number', min: 1 }
                  ]}
                >
                  <InputNumber
                    placeholder="预算金额"
                    min={1}
                    max={10000}
                    style={{ width: '100%' }}
                    addonAfter="万元"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/,/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="targetOpenDate"
                  label="目标开业时间"
                  rules={[{ required: true }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="请选择目标开业时间"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item
                  name="isUrgent"
                  label="紧急项目"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="address"
              label="预选地址/区域"
            >
              <Input
                placeholder="如有预选的门店地址或目标区域，请填写"
                maxLength={200}
              />
            </Form.Item>
          </Card>

          {/* 里程碑设置 */}
          <Card 
            title="里程碑设置" 
            size="small" 
            style={{ marginBottom: 16 }}
            extra={
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                size="small"
                onClick={handleAddMilestone}
              >
                添加里程碑
              </Button>
            }
          >
            {milestones && milestones.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {milestones.map((milestone, index) => (
                  <Card 
                    key={index} 
                    size="small" 
                    style={{ backgroundColor: '#fafafa' }}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleRemoveMilestone(index)}
                      />
                    }
                  >
                    <Row gutter={12}>
                      <Col span={8}>
                        <Input
                          placeholder="里程碑名称"
                          value={milestone.name}
                          onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                        />
                      </Col>
                      <Col span={8}>
                        <DatePicker
                          style={{ width: '100%' }}
                          placeholder="目标完成时间"
                          value={milestone.targetDate}
                          onChange={(date) => handleMilestoneChange(index, 'targetDate', date)}
                          disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                      </Col>
                      <Col span={8}>
                        <AutoComplete
                          placeholder="负责人"
                          options={userOptions}
                          value={milestone.responsible}
                          onChange={(value) => handleMilestoneChange(index, 'responsible', value)}
                          filterOption={(inputValue, option) =>
                            (option?.label ?? '').toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                          }
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            ) : (
              <Alert
                message="暂无里程碑"
                description="添加关键里程碑有助于更好地跟踪项目进度"
                type="info"
                showIcon
                style={{ margin: '16px 0' }}
              />
            )}
          </Card>

          {/* 附件上传 */}
          <Card title="相关附件" size="small" style={{ marginBottom: 24 }}>
            <Form.Item name="attachments" label="上传文件">
              <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持单个或批量上传，建议上传计划相关的文档、图片等材料
                </p>
              </Dragger>
            </Form.Item>

            <Form.Item
              name="notes"
              label="备注说明"
            >
              <TextArea
                placeholder="其他需要说明的情况"
                rows={3}
                showCount
                maxLength={300}
              />
            </Form.Item>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <Row justify="end">
              <Col>
                <Space>
                  <Button onClick={handleCancel}>
                    <CloseOutlined />
                    取消
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDraft(true)
                      form.submit()
                    }}
                    loading={loading && isDraft}
                    icon={<SaveOutlined />}
                  >
                    保存草稿
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setIsDraft(false)
                      form.submit()
                    }}
                    loading={loading && !isDraft}
                    icon={<CheckOutlined />}
                  >
                    {isEdit ? '保存并提交' : '创建并提交'}
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Form>
      </Card>
    </div>
  )
}

export default PlanForm