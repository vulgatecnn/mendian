import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  Upload,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  message,
  Steps,
  Modal,
  Tag,
  AutoComplete,
  Cascader
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  DollarOutlined,
  TeamOutlined,
  CameraOutlined,
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useExpansionStore } from '@/stores/expansionStore'
import type { CandidateLocation } from '@/services/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { Step } = Steps

interface FormData {
  // 基本信息
  name: string
  address: string
  businessCircle: string
  coordinates?: { latitude: number; longitude: number }
  
  // 物业信息
  propertyType: string
  area: number
  usableArea?: number
  floorLevel: number
  hasElevator: boolean
  parkingSpaces?: number
  
  // 租赁信息
  rentPrice: number
  rentUnit: string
  depositAmount?: number
  transferFee?: number
  propertyFee?: number
  
  // 业主信息
  landlordName?: string
  landlordPhone?: string
  landlordEmail?: string
  
  // 中介信息
  intermediaryName?: string
  intermediaryContact?: string
  intermediaryPhone?: string
  intermediaryCommission?: number
  
  // 评估信息
  priority: string
  expectedSignDate?: any
  evaluationScore?: number
  
  // 附件信息
  photos?: any[]
  floorPlans?: any[]
  documents?: any[]
  
  // 交通信息
  nearbySubway?: string
  subwayDistance?: number
  nearbyBus?: string
  busDistance?: number
  
  // 竞品信息
  competitors?: Array<{
    name: string
    distance: number
    businessType: string
  }>
  
  // 其他信息
  notes?: string
  tags?: string[]
}

const CandidateLocationForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  
  const [form] = Form.useForm<FormData>()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [fileList, setFileList] = useState<any[]>([])
  
  const { 
    currentCandidateLocation,
    isSubmitting,
    fetchCandidateLocation,
    createCandidateLocation,
    updateCandidateLocation,
    geocodeAddress
  } = useExpansionStore()

  useEffect(() => {
    if (isEdit && id) {
      fetchCandidateLocation(id)
    }
  }, [isEdit, id, fetchCandidateLocation])

  useEffect(() => {
    if (isEdit && currentCandidateLocation) {
      form.setFieldsValue({
        name: currentCandidateLocation.name,
        address: currentCandidateLocation.address,
        businessCircle: currentCandidateLocation.businessCircle,
        propertyType: currentCandidateLocation.propertyType,
        area: currentCandidateLocation.area,
        rentPrice: currentCandidateLocation.rent,
        rentUnit: 'monthly',
        priority: currentCandidateLocation.priority,
        expectedSignDate: currentCandidateLocation.expectedSignDate 
          ? dayjs(currentCandidateLocation.expectedSignDate) 
          : undefined,
        evaluationScore: currentCandidateLocation.score,
        notes: currentCandidateLocation.notes,
        hasElevator: false, // 默认值
        floorLevel: 1, // 默认值
      })
    }
  }, [isEdit, currentCandidateLocation, form])

  // 表单步骤定义
  const steps = [
    { title: '基本信息', description: '点位名称、地址等基本信息' },
    { title: '物业详情', description: '面积、租金、物业类型等' },
    { title: '附件资料', description: '照片、文档等资料上传' },
    { title: '确认提交', description: '检查信息并提交' }
  ]

  const handleBack = () => {
    navigate('/expansion/candidates')
  }

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleAddressChange = async (address: string) => {
    if (address && address.length > 10) {
      try {
        const coords = await geocodeAddress(address)
        if (coords) {
          form.setFieldValue('coordinates', coords)
        }
      } catch (error) {
        console.log('地址解析失败', error)
      }
    }
  }

  const handleSubmit = async (values: FormData) => {
    setLoading(true)
    
    try {
      const formData = {
        ...values,
        coordinates: values.coordinates 
          ? `${values.coordinates.latitude},${values.coordinates.longitude}`
          : undefined,
        expectedSignDate: values.expectedSignDate?.toISOString(),
        photos: fileList.filter(file => file.type?.startsWith('image/')).map(file => file.url || file.response?.url),
        documents: fileList.filter(file => !file.type?.startsWith('image/')).map(file => file.url || file.response?.url),
        rent: values.rentPrice,
        discoveredAt: new Date().toISOString()
      }

      let result
      if (isEdit && id) {
        result = await updateCandidateLocation(id, formData)
      } else {
        result = await createCandidateLocation(formData)
      }

      if (result) {
        message.success(`候选点位${isEdit ? '更新' : '创建'}成功`)
        navigate(`/expansion/candidates/${result.id}`)
      }
    } catch (error) {
      message.error(`${isEdit ? '更新' : '创建'}失败`)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()
      await handleSubmit(values)
    } catch (error) {
      message.error('请检查表单填写')
    }
  }

  // 文件上传处理
  const handleUploadChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList)
  }

  const handlePreview = (file: any) => {
    setPreviewImage(file.url || file.thumbUrl)
    setPreviewVisible(true)
  }

  const handleRemove = (file: any) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid)
    setFileList(newFileList)
  }

  // 渲染基本信息步骤
  const renderBasicInfo = () => (
    <Card title="基本信息" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="点位名称"
            rules={[
              { required: true, message: '请输入点位名称' },
              { min: 2, max: 100, message: '点位名称长度为2-100个字符' }
            ]}
          >
            <Input placeholder="请输入候选点位名称" />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            name="businessCircle"
            label="商圈名称"
            rules={[{ required: true, message: '请输入商圈名称' }]}
          >
            <Input placeholder="请输入所属商圈名称" />
          </Form.Item>
        </Col>
        
        <Col span={24}>
          <Form.Item
            name="address"
            label="详细地址"
            rules={[
              { required: true, message: '请输入详细地址' },
              { min: 5, max: 200, message: '地址长度为5-200个字符' }
            ]}
          >
            <Input.TextArea
              placeholder="请输入详细地址"
              rows={2}
              onChange={(e) => handleAddressChange(e.target.value)}
            />
          </Form.Item>
        </Col>
        
        <Col span={8}>
          <Form.Item
            name="propertyType"
            label="物业类型"
            rules={[{ required: true, message: '请选择物业类型' }]}
          >
            <Select placeholder="请选择物业类型">
              <Option value="STREET_SHOP">临街商铺</Option>
              <Option value="MALL_SHOP">商场店铺</Option>
              <Option value="OFFICE_BUILDING">写字楼</Option>
              <Option value="RESIDENTIAL">住宅底商</Option>
              <Option value="STANDALONE">独立建筑</Option>
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={8}>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              <Option value="LOW">
                <Tag color="default">低</Tag>
              </Option>
              <Option value="MEDIUM">
                <Tag color="blue">中</Tag>
              </Option>
              <Option value="HIGH">
                <Tag color="orange">高</Tag>
              </Option>
              <Option value="URGENT">
                <Tag color="red">紧急</Tag>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={8}>
          <Form.Item
            name="expectedSignDate"
            label="预计签约日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择预计签约日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )

  // 渲染物业详情步骤
  const renderPropertyDetails = () => (
    <>
      <Card title="面积租金信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="area"
              label="建筑面积(㎡)"
              rules={[
                { required: true, message: '请输入建筑面积' },
                { type: 'number', min: 1, message: '面积必须大于0' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入建筑面积"
                min={1}
                max={100000}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="usableArea"
              label="使用面积(㎡)"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入使用面积"
                min={1}
                max={100000}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="floorLevel"
              label="楼层"
              rules={[{ required: true, message: '请输入楼层' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="楼层"
                min={-3}
                max={100}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="rentPrice"
              label="月租金(元)"
              rules={[
                { required: true, message: '请输入月租金' },
                { type: 'number', min: 0, message: '租金必须大于等于0' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入月租金"
                min={0}
                max={10000000}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value?.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="depositAmount"
              label="押金(元)"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入押金"
                min={0}
                max={10000000}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value?.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="transferFee"
              label="转让费(元)"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入转让费"
                min={0}
                max={10000000}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value?.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="物业配置" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="hasElevator"
              label="电梯"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="有"
                unCheckedChildren="无"
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="parkingSpaces"
              label="停车位(个)"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="停车位数量"
                min={0}
                max={1000}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="业主信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="landlordName"
              label="业主姓名"
            >
              <Input placeholder="请输入业主姓名" />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="landlordPhone"
              label="联系电话"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="landlordEmail"
              label="邮箱地址"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱地址" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="中介信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="intermediaryName"
              label="中介公司"
            >
              <Input placeholder="中介公司名称" />
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item
              name="intermediaryContact"
              label="中介联系人"
            >
              <Input placeholder="联系人姓名" />
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item
              name="intermediaryPhone"
              label="联系电话"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
              ]}
            >
              <Input placeholder="联系电话" />
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item
              name="intermediaryCommission"
              label="佣金比例(%)"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="佣金比例"
                min={0}
                max={100}
                formatter={value => `${value}%`}
                parser={value => value?.replace('%', '') as any}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  )

  // 渲染附件上传步骤
  const renderAttachments = () => (
    <Card title="附件资料" style={{ marginBottom: 16 }}>
      <Form.Item label="现场照片/文档">
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={handleUploadChange}
          onPreview={handlePreview}
          onRemove={handleRemove}
          multiple
          accept="image/*,.pdf,.doc,.docx"
          beforeUpload={(file) => {
            const isValidType = 
              file.type.startsWith('image/') ||
              file.type === 'application/pdf' ||
              file.type.includes('document')
            
            if (!isValidType) {
              message.error('只支持上传图片、PDF或Word文档')
              return false
            }
            
            const isLt10M = file.size / 1024 / 1024 < 10
            if (!isLt10M) {
              message.error('文件大小不能超过10MB')
              return false
            }
            
            return false // 阻止自动上传，由组件统一处理
          }}
        >
          {fileList.length >= 20 ? null : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </div>
          )}
        </Upload>
      </Form.Item>
      
      <Form.Item
        name="notes"
        label="备注说明"
      >
        <TextArea
          rows={4}
          placeholder="请输入备注信息，如特殊情况、注意事项等..."
          maxLength={2000}
          showCount
        />
      </Form.Item>
      
      <Form.Item
        name="tags"
        label="标签"
      >
        <Select
          mode="tags"
          placeholder="添加标签，按回车确认"
          maxTagCount={10}
        >
          <Option value="核心商圈">核心商圈</Option>
          <Option value="地铁沿线">地铁沿线</Option>
          <Option value="商场内铺">商场内铺</Option>
          <Option value="临街门面">临街门面</Option>
          <Option value="写字楼底商">写字楼底商</Option>
          <Option value="社区配套">社区配套</Option>
        </Select>
      </Form.Item>
    </Card>
  )

  // 渲染确认信息步骤
  const renderConfirmation = () => {
    const values = form.getFieldsValue()
    
    return (
      <Card title="信息确认" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="基本信息">
              <p><strong>点位名称：</strong>{values.name}</p>
              <p><strong>地址：</strong>{values.address}</p>
              <p><strong>商圈：</strong>{values.businessCircle}</p>
              <p><strong>物业类型：</strong>{values.propertyType}</p>
              <p><strong>优先级：</strong>{values.priority}</p>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card size="small" title="物业信息">
              <p><strong>建筑面积：</strong>{values.area}㎡</p>
              <p><strong>月租金：</strong>¥{values.rentPrice?.toLocaleString()}</p>
              <p><strong>楼层：</strong>{values.floorLevel}层</p>
              <p><strong>电梯：</strong>{values.hasElevator ? '有' : '无'}</p>
              <p><strong>停车位：</strong>{values.parkingSpaces || 0}个</p>
            </Card>
          </Col>
          
          {values.landlordName && (
            <Col span={12}>
              <Card size="small" title="业主信息">
                <p><strong>业主姓名：</strong>{values.landlordName}</p>
                <p><strong>联系电话：</strong>{values.landlordPhone}</p>
                <p><strong>邮箱：</strong>{values.landlordEmail}</p>
              </Card>
            </Col>
          )}
          
          {fileList.length > 0 && (
            <Col span={12}>
              <Card size="small" title="附件信息">
                <p><strong>文件数量：</strong>{fileList.length}个</p>
                <p><strong>文件类型：</strong>
                  {fileList.some(f => f.type?.startsWith('image/')) && ' 图片'}
                  {fileList.some(f => f.type?.includes('pdf')) && ' PDF'}
                  {fileList.some(f => f.type?.includes('document')) && ' 文档'}
                </p>
              </Card>
            </Col>
          )}
        </Row>
        
        {values.notes && (
          <Card size="small" title="备注信息" style={{ marginTop: 16 }}>
            <Text>{values.notes}</Text>
          </Card>
        )}
      </Card>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo()
      case 1:
        return renderPropertyDetails()
      case 2:
        return renderAttachments()
      case 3:
        return renderConfirmation()
      default:
        return renderBasicInfo()
    }
  }

  return (
    <div>
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          <Divider type="vertical" />
          <Title level={3} style={{ margin: 0 }}>
            {isEdit ? '编辑候选点位' : '新增候选点位'}
          </Title>
        </Space>
      </div>

      {/* 步骤导航 */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </Card>

      {/* 表单内容 */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        autoComplete="off"
      >
        {renderStepContent()}
        
        {/* 底部操作按钮 */}
        <Card>
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              {currentStep > 0 && (
                <Button size="large" onClick={handlePrev}>
                  上一步
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button type="primary" size="large" onClick={handleNext}>
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading || isSubmitting}
                  onClick={handleFinish}
                >
                  {isEdit ? '保存' : '创建'}
                </Button>
              )}
              
              <Button size="large" onClick={handleBack}>
                取消
              </Button>
            </Space>
          </div>
        </Card>
      </Form>

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  )
}

export default CandidateLocationForm