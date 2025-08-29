import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Steps,
  Row,
  Col,
  Divider,
  Typography,
  Alert,
  message,
  Spin,
  Modal,
  Checkbox,
  Radio,
  Upload,
  Progress,
  Tag
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'

import PageContainer from '@/components/common/PageContainer'
import { usePreparationStore } from '@/stores/preparationStore'
import { PRIORITY_OPTIONS } from '@/constants/colors'
import type {
  CreatePreparationProjectRequest,
  UpdatePreparationProjectRequest,
  Priority
} from '@/constants/colors'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { Step } = Steps

// 表单步骤配置
const FORM_STEPS = [
  {
    title: '基本信息',
    description: '填写项目基本信息'
  },
  {
    title: '任务配置',
    description: '配置项目任务和模板'
  },
  {
    title: '确认提交',
    description: '确认信息并提交'
  }
]

// 项目模板配置
const PROJECT_TEMPLATES = [
  {
    id: 'restaurant_standard',
    name: '标准餐厅模板',
    description: '适用于一般餐厅的标准开店筹备流程',
    tasks: [
      { name: '基础建设', category: 'engineering' },
      { name: '装修装饰', category: 'engineering' },
      { name: '厨房设备采购', category: 'equipment' },
      { name: '餐厅设备采购', category: 'equipment' },
      { name: '营业执照办理', category: 'license' },
      { name: '食品经营许可证', category: 'license' },
      { name: '店长招聘', category: 'staff' },
      { name: '服务员招聘', category: 'staff' }
    ]
  },
  {
    id: 'fast_food',
    name: '快餐店模板',
    description: '适用于快餐、简餐类门店',
    tasks: [
      { name: '基础设施改造', category: 'engineering' },
      { name: '快餐设备采购', category: 'equipment' },
      { name: '营业执照办理', category: 'license' },
      { name: '店长招聘', category: 'staff' }
    ]
  },
  {
    id: 'custom',
    name: '自定义配置',
    description: '根据实际需求自定义任务配置',
    tasks: []
  }
]

// 基本信息表单组件
const BasicInfoForm: React.FC<{
  form: any
  isEdit: boolean
}> = ({ form, isEdit }) => {
  return (
    <Card title="项目基本信息">
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="candidateLocationId"
            label="候选点位"
            rules={[{ required: true, message: '请选择候选点位' }]}
          >
            <Select
              placeholder="请选择候选点位"
              showSearch
              optionFilterProp="children"
            >
              {/* 这里应该从接口获取候选点位列表 */}
              <Option value="location1">北京朝阳区点位A - 朝阳公园店</Option>
              <Option value="location2">上海浦东区点位B - 陆家嘴店</Option>
              <Option value="location3">深圳南山区点位C - 科技园店</Option>
              <Option value="location4">广州天河区点位D - 珠江新城店</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[
              { required: true, message: '请输入项目名称' },
              { min: 2, max: 200, message: '项目名称长度为2-200个字符' }
            ]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="storeCode"
            label="门店编码"
            rules={[{ max: 50, message: '门店编码不超过50个字符' }]}
          >
            <Input placeholder="请输入门店编码" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="storeName"
            label="门店名称"
            rules={[{ max: 200, message: '门店名称不超过200个字符' }]}
          >
            <Input placeholder="请输入门店名称" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              {PRIORITY_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color} style={{ margin: 0 }}>
                    {option.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="managerId"
            label="项目经理"
          >
            <Select
              placeholder="请选择项目经理"
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {/* 这里应该从接口获取用户列表 */}
              <Option value="user1">张三 - 项目经理</Option>
              <Option value="user2">李四 - 高级项目经理</Option>
              <Option value="user3">王五 - 项目总监</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="dateRange"
            label="计划时间"
            rules={[{ required: true, message: '请选择计划时间范围' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['计划开始日期', '计划结束日期']}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="budget"
            label="预算金额（元）"
            rules={[
              { required: true, message: '请输入预算金额' },
              { type: 'number', min: 1, message: '预算金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入预算金额"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
              min={0}
              max={100000000}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={24}>
          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ max: 2000, message: '项目描述不超过2000个字符' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入项目描述，包括项目背景、目标、特殊要求等..."
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={24}>
          <Form.Item
            name="notes"
            label="备注"
            rules={[{ max: 2000, message: '备注不超过2000个字符' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入其他备注信息..."
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

// 任务配置表单组件
const TaskConfigForm: React.FC<{
  form: any
}> = ({ form }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customTasks, setCustomTasks] = useState<any[]>([])

  // 模板选择处理
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId)
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setCustomTasks(template.tasks.map((task, index) => ({
        id: `task_${index}`,
        ...task,
        enabled: true
      })))
    }
  }, [])

  // 自定义任务管理
  const addCustomTask = useCallback(() => {
    const newTask = {
      id: `custom_${Date.now()}`,
      name: '',
      category: 'engineering',
      enabled: true
    }
    setCustomTasks([...customTasks, newTask])
  }, [customTasks])

  const removeCustomTask = useCallback((taskId: string) => {
    setCustomTasks(customTasks.filter(task => task.id !== taskId))
  }, [customTasks])

  const updateCustomTask = useCallback((taskId: string, field: string, value: any) => {
    setCustomTasks(customTasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ))
  }, [customTasks])

  return (
    <Card title="任务配置">
      <Alert
        message="项目模板"
        description="选择合适的项目模板可以快速配置标准的筹备任务，您也可以选择自定义配置来添加特定的任务。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form.Item label="选择项目模板">
        <Radio.Group
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          {PROJECT_TEMPLATES.map(template => (
            <Radio.Button 
              key={template.id} 
              value={template.id}
              style={{ marginBottom: 8, display: 'block', height: 'auto', padding: '12px 16px' }}
            >
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {template.name}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {template.description}
                </div>
              </div>
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>

      {selectedTemplate && (
        <>
          <Divider />
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>任务配置</Title>
            <Text type="secondary">
              以下是根据所选模板生成的默认任务，您可以调整任务配置
            </Text>
          </div>

          <div style={{ marginBottom: 16 }}>
            {customTasks.map((task) => (
              <Card
                key={task.id}
                size="small"
                style={{ marginBottom: 8 }}
                bodyStyle={{ padding: '12px 16px' }}
                extra={
                  <Space>
                    <Checkbox
                      checked={task.enabled}
                      onChange={(e) => updateCustomTask(task.id, 'enabled', e.target.checked)}
                    />
                    {selectedTemplate === 'custom' && (
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeCustomTask(task.id)}
                      />
                    )}
                  </Space>
                }
              >
                <Row gutter={16} align="middle">
                  <Col span={8}>
                    {selectedTemplate === 'custom' ? (
                      <Input
                        value={task.name}
                        placeholder="任务名称"
                        onChange={(e) => updateCustomTask(task.id, 'name', e.target.value)}
                      />
                    ) : (
                      <Text strong>{task.name}</Text>
                    )}
                  </Col>
                  <Col span={4}>
                    <Select
                      value={task.category}
                      onChange={(value) => updateCustomTask(task.id, 'category', value)}
                      size="small"
                      style={{ width: '100%' }}
                    >
                      <Option value="engineering">工程管理</Option>
                      <Option value="equipment">设备采购</Option>
                      <Option value="license">证照办理</Option>
                      <Option value="staff">人员招聘</Option>
                    </Select>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {task.category === 'engineering' && '包括基础建设、装修装饰等工程项目'}
                      {task.category === 'equipment' && '包括设备采购、安装调试等设备管理'}
                      {task.category === 'license' && '包括证照申请、办理等合规事项'}
                      {task.category === 'staff' && '包括招聘、培训等人员管理'}
                    </Text>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>

          {selectedTemplate === 'custom' && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addCustomTask}
              style={{ width: '100%' }}
            >
              添加自定义任务
            </Button>
          )}
        </>
      )}
    </Card>
  )
}

// 确认信息组件
const ConfirmStep: React.FC<{
  form: any
  formData: any
}> = ({ form, formData }) => {
  const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === formData.priority)

  return (
    <Card title="确认信息">
      <Alert
        message="请确认以下信息"
        description="请仔细检查项目信息，确认无误后提交创建项目。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={24}>
        <Col span={12}>
          <Card title="基本信息" size="small">
            <div style={{ lineHeight: '28px' }}>
              <Text strong>项目名称：</Text>
              <Text>{formData.projectName}</Text>
              <br />
              <Text strong>门店编码：</Text>
              <Text>{formData.storeCode || '未填写'}</Text>
              <br />
              <Text strong>门店名称：</Text>
              <Text>{formData.storeName || '未填写'}</Text>
              <br />
              <Text strong>优先级：</Text>
              <Tag color={priorityOption?.color}>{priorityOption?.label}</Tag>
              <br />
              <Text strong>预算金额：</Text>
              <Text>{formData.budget?.toLocaleString()} 元</Text>
              <br />
              <Text strong>计划时间：</Text>
              <Text>
                {formData.dateRange?.[0]?.format('YYYY-MM-DD')} ~ {formData.dateRange?.[1]?.format('YYYY-MM-DD')}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="项目描述" size="small">
            <Paragraph style={{ margin: 0, minHeight: 100 }}>
              {formData.description || '暂无描述'}
            </Paragraph>
            {formData.notes && (
              <>
                <Divider />
                <Text strong>备注：</Text>
                <Paragraph style={{ margin: 0 }}>
                  {formData.notes}
                </Paragraph>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  )
}

const PreparationProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  // 判断是否为编辑模式
  const isEdit = Boolean(id)

  // Store状态
  const {
    currentProject,
    isLoading,
    isSubmitting,
    fetchProject,
    createProject,
    updateProject
  } = usePreparationStore()

  // 本地状态
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})

  // 初始化数据
  useEffect(() => {
    if (isEdit && id) {
      fetchProject(id)
    }
  }, [isEdit, id, fetchProject])

  // 编辑模式数据回填
  useEffect(() => {
    if (isEdit && currentProject) {
      const initialValues = {
        candidateLocationId: currentProject.candidateLocationId,
        projectName: currentProject.projectName,
        storeCode: currentProject.storeCode,
        storeName: currentProject.storeName,
        priority: currentProject.priority,
        managerId: currentProject.managerId,
        dateRange: [
          dayjs(currentProject.plannedStartDate),
          dayjs(currentProject.plannedEndDate)
        ],
        budget: currentProject.budget,
        description: currentProject.description,
        notes: currentProject.notes
      }
      form.setFieldsValue(initialValues)
      setFormData(initialValues)
    }
  }, [isEdit, currentProject, form])

  // 步骤导航
  const nextStep = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setFormData({ ...formData, ...values })
      setCurrentStep(currentStep + 1)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }, [form, formData, currentStep])

  const prevStep = useCallback(() => {
    setCurrentStep(currentStep - 1)
  }, [currentStep])

  // 提交处理
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const finalData = { ...formData, ...values }

      const submitData = {
        candidateLocationId: finalData.candidateLocationId,
        projectName: finalData.projectName,
        storeCode: finalData.storeCode,
        storeName: finalData.storeName,
        priority: finalData.priority as Priority,
        plannedStartDate: finalData.dateRange[0].format('YYYY-MM-DD'),
        plannedEndDate: finalData.dateRange[1].format('YYYY-MM-DD'),
        budget: finalData.budget,
        description: finalData.description,
        notes: finalData.notes,
        managerId: finalData.managerId
      }

      let result
      if (isEdit && id) {
        result = await updateProject(id, submitData)
      } else {
        result = await createProject(submitData)
      }

      if (result) {
        message.success(isEdit ? '项目更新成功' : '项目创建成功')
        navigate('/preparation/projects')
      }
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }, [form, formData, isEdit, id, updateProject, createProject, navigate])

  // 保存草稿
  const handleSaveDraft = useCallback(async () => {
    try {
      const values = await form.validateFields()
      // 这里可以实现保存草稿的逻辑
      message.success('草稿保存成功')
    } catch (error) {
      console.error('Save draft failed:', error)
    }
  }, [form])

  if (isEdit && isLoading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/preparation/projects')}
          >
            返回列表
          </Button>
          <Divider type="vertical" />
          <Title level={4} style={{ margin: 0 }}>
            {isEdit ? '编辑项目' : '新建项目'}
          </Title>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<CopyOutlined />}
            onClick={handleSaveDraft}
          >
            保存草稿
          </Button>
        </Space>
      }
      breadcrumb={{
        routes: [
          { path: '/', breadcrumbName: '首页' },
          { path: '/preparation', breadcrumbName: '开店筹备' },
          { path: '/preparation/projects', breadcrumbName: '筹备项目' },
          { path: isEdit ? `/preparation/projects/${id}/edit` : '/preparation/projects/create', 
            breadcrumbName: isEdit ? '编辑项目' : '新建项目' },
        ]
      }}
    >
      {/* 步骤条 */}
      {!isEdit && (
        <Card style={{ marginBottom: 24 }}>
          <Steps current={currentStep} style={{ maxWidth: 600, margin: '0 auto' }}>
            {FORM_STEPS.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                description={step.description}
              />
            ))}
          </Steps>
        </Card>
      )}

      {/* 表单内容 */}
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={handleSubmit}
      >
        {/* 基本信息步骤或编辑模式 */}
        {(currentStep === 0 || isEdit) && (
          <BasicInfoForm form={form} isEdit={isEdit} />
        )}

        {/* 任务配置步骤 */}
        {currentStep === 1 && !isEdit && (
          <TaskConfigForm form={form} />
        )}

        {/* 确认步骤 */}
        {currentStep === 2 && !isEdit && (
          <ConfirmStep form={form} formData={formData} />
        )}

        {/* 操作按钮 */}
        <Card style={{ marginTop: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              {/* 编辑模式或第一步 */}
              {(isEdit || currentStep === 0) && (
                <Button
                  onClick={() => navigate('/preparation/projects')}
                >
                  取消
                </Button>
              )}

              {/* 非第一步的上一步 */}
              {currentStep > 0 && !isEdit && (
                <Button onClick={prevStep}>
                  上一步
                </Button>
              )}

              {/* 非最后一步的下一步 */}
              {currentStep < FORM_STEPS.length - 1 && !isEdit && (
                <Button type="primary" onClick={nextStep}>
                  下一步
                </Button>
              )}

              {/* 最后一步的提交或编辑模式的保存 */}
              {(currentStep === FORM_STEPS.length - 1 || isEdit) && (
                <Button
                  type="primary"
                  icon={isEdit ? <SaveOutlined /> : <CheckOutlined />}
                  loading={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isEdit ? '保存修改' : '创建项目'}
                </Button>
              )}
            </Space>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default PreparationProjectForm