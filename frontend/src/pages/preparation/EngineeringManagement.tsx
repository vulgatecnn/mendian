import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Form,
  Modal,
  message,
  Tooltip,
  Progress,
  Tag,
  Badge,
  Drawer,
  Divider,
  Row,
  Col,
  Statistic,
  Typography,
  Dropdown,
  Popconfirm,
  Checkbox,
  InputNumber,
  Upload,
  Image,
  Timeline,
  Tabs,
  Rate,
  Alert
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  CameraOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  MoreOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import PageContainer from '@/components/common/PageContainer'
import { usePreparationStore } from '@/stores/preparationStore'
import { ENGINEERING_STATUS_COLORS, PRIORITY_COLORS } from '@/constants/colors'
import type {
  EngineeringTask,
  EngineeringStatusType,
  Priority,
  EngineeringTaskFilters,
  ProjectTypeType,
  QualityCheck,
  SafetyRecord,
  MaterialUsage
} from '@/constants/colors'

const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select
const { Text, Title } = Typography
const { TabPane } = Tabs

// 工程状态选项配置
const STATUS_OPTIONS = [
  { value: 'PLANNED', label: '已计划', color: ENGINEERING_STATUS_COLORS.PLANNED },
  { value: 'APPROVED', label: '已批准', color: ENGINEERING_STATUS_COLORS.APPROVED },
  { value: 'IN_PROGRESS', label: '施工中', color: ENGINEERING_STATUS_COLORS.IN_PROGRESS },
  { value: 'SUSPENDED', label: '已暂停', color: ENGINEERING_STATUS_COLORS.SUSPENDED },
  { value: 'COMPLETED', label: '已完成', color: ENGINEERING_STATUS_COLORS.COMPLETED },
  { value: 'CANCELLED', label: '已取消', color: ENGINEERING_STATUS_COLORS.CANCELLED },
  { value: 'ACCEPTED', label: '已验收', color: ENGINEERING_STATUS_COLORS.ACCEPTED },
  { value: 'WARRANTY', label: '保修期', color: ENGINEERING_STATUS_COLORS.WARRANTY },
]

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: '紧急', color: PRIORITY_COLORS.URGENT },
  { value: 'HIGH', label: '高', color: PRIORITY_COLORS.HIGH },
  { value: 'MEDIUM', label: '中', color: PRIORITY_COLORS.MEDIUM },
  { value: 'LOW', label: '低', color: PRIORITY_COLORS.LOW },
]

const PROJECT_TYPE_OPTIONS = [
  { value: 'CONSTRUCTION', label: '基础建设', icon: <ToolOutlined /> },
  { value: 'DECORATION', label: '装修装饰', icon: <ToolOutlined /> },
  { value: 'EQUIPMENT', label: '设备安装', icon: <ToolOutlined /> },
  { value: 'ELECTRICAL', label: '电气工程', icon: <ToolOutlined /> },
  { value: 'PLUMBING', label: '管道工程', icon: <ToolOutlined /> },
  { value: 'HVAC', label: '暖通空调', icon: <ToolOutlined /> },
  { value: 'FIRE_SAFETY', label: '消防工程', icon: <SafetyCertificateOutlined /> },
  { value: 'SECURITY', label: '安防工程', icon: <SafetyCertificateOutlined /> },
  { value: 'NETWORK', label: '网络工程', icon: <ToolOutlined /> },
  { value: 'OTHER', label: '其他', icon: <ToolOutlined /> },
]

// 状态徽章组件
const StatusBadge: React.FC<{ status: EngineeringStatusType }> = ({ status }) => {
  const option = STATUS_OPTIONS.find(opt => opt.value === status)
  return (
    <Badge
      color={option?.color}
      text={option?.label || status}
    />
  )
}

// 优先级标签组件
const PriorityTag: React.FC<{ priority: Priority }> = ({ priority }) => {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === priority)
  return (
    <Tag color={option?.color} style={{ margin: 0 }}>
      {option?.label || priority}
    </Tag>
  )
}

// 进度条组件
const ProgressColumn: React.FC<{ percent: number; status: EngineeringStatusType }> = ({ 
  percent, 
  status 
}) => {
  const getProgressColor = (status: EngineeringStatusType, percent: number) => {
    if (status === 'COMPLETED') return '#52c41a'
    if (status === 'CANCELLED') return '#d9d9d9'
    if (status === 'SUSPENDED') return '#faad14'
    if (percent < 30) return '#ff7875'
    if (percent < 70) return '#1890ff'
    return '#52c41a'
  }

  return (
    <div style={{ minWidth: 120 }}>
      <Progress
        percent={percent}
        size="small"
        strokeColor={getProgressColor(status, percent)}
        showInfo={true}
      />
    </div>
  )
}

// 质量检查弹窗组件
const QualityCheckModal: React.FC<{
  visible: boolean
  task: EngineeringTask | null
  onClose: () => void
  onSubmit: (taskId: string, qualityData: any) => void
}> = ({ visible, task, onClose, onSubmit }) => {
  const [form] = Form.useForm()
  const [checkPoints, setCheckPoints] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])

  useEffect(() => {
    if (visible && task) {
      // 初始化质量检查项
      const defaultCheckPoints = [
        { name: '施工质量', standard: '符合设计要求和行业标准', score: 0, result: 'PASS', notes: '' },
        { name: '材料质量', standard: '使用合格材料，符合规范要求', score: 0, result: 'PASS', notes: '' },
        { name: '安全规范', standard: '严格遵守安全操作规程', score: 0, result: 'PASS', notes: '' },
        { name: '进度控制', standard: '按计划推进，及时完成', score: 0, result: 'PASS', notes: '' },
      ]
      setCheckPoints(defaultCheckPoints)
      
      form.setFieldsValue({
        checkDate: dayjs(),
        checkType: '定期检查',
        inspector: '质检员'
      })
    }
  }, [visible, task, form])

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const overallScore = Math.round(
        checkPoints.reduce((sum, point) => sum + point.score, 0) / checkPoints.length
      )
      
      const qualityData = {
        ...values,
        checkDate: values.checkDate.format('YYYY-MM-DD'),
        checkPoints,
        overallScore,
        result: overallScore >= 80 ? 'PASSED' : overallScore >= 60 ? 'CONDITIONAL' : 'FAILED',
        photos: photos.map(photo => photo.response?.url || photo.url)
      }
      
      onSubmit(task!.id, qualityData)
      onClose()
    } catch (error) {
      console.error('Quality check submit failed:', error)
    }
  }, [form, checkPoints, photos, task, onSubmit, onClose])

  const updateCheckPoint = (index: number, field: string, value: any) => {
    const newCheckPoints = [...checkPoints]
    newCheckPoints[index] = { ...newCheckPoints[index], [field]: value }
    setCheckPoints(newCheckPoints)
  }

  return (
    <Modal
      title={`质量检查 - ${task?.projectName}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="checkDate"
              label="检查日期"
              rules={[{ required: true, message: '请选择检查日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="checkType"
              label="检查类型"
              rules={[{ required: true, message: '请输入检查类型' }]}
            >
              <Select>
                <Option value="定期检查">定期检查</Option>
                <Option value="专项检查">专项检查</Option>
                <Option value="验收检查">验收检查</Option>
                <Option value="整改复查">整改复查</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="inspector"
              label="检查员"
              rules={[{ required: true, message: '请输入检查员' }]}
            >
              <Input placeholder="请输入检查员姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>检查项目</Divider>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {checkPoints.map((point, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Text strong>{point.name}</Text>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {point.standard}
                  </div>
                </Col>
                <Col span={4}>
                  <Rate
                    value={point.score / 20}
                    onChange={(value) => updateCheckPoint(index, 'score', value * 20)}
                    style={{ fontSize: 16 }}
                  />
                  <div style={{ fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                    {point.score}分
                  </div>
                </Col>
                <Col span={4}>
                  <Select
                    value={point.result}
                    onChange={(value) => updateCheckPoint(index, 'result', value)}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value="PASS">
                      <Tag color="green">合格</Tag>
                    </Option>
                    <Option value="FAIL">
                      <Tag color="red">不合格</Tag>
                    </Option>
                  </Select>
                </Col>
                <Col span={10}>
                  <Input.TextArea
                    value={point.notes}
                    onChange={(e) => updateCheckPoint(index, 'notes', e.target.value)}
                    placeholder="检查备注"
                    rows={2}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </div>

        <Divider>检查照片</Divider>
        <Upload
          listType="picture-card"
          fileList={photos}
          onChange={({ fileList }) => setPhotos(fileList)}
          beforeUpload={() => false} // 阻止自动上传
          multiple
        >
          {photos.length < 9 && (
            <div>
              <CameraOutlined />
              <div style={{ marginTop: 8 }}>上传照片</div>
            </div>
          )}
        </Upload>

        <Form.Item
          name="issues"
          label="发现问题"
        >
          <Input.TextArea rows={3} placeholder="请描述发现的问题..." />
        </Form.Item>

        <Form.Item
          name="correctionPlan"
          label="整改计划"
        >
          <Input.TextArea rows={3} placeholder="请描述整改计划和要求..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// 安全记录弹窗组件
const SafetyRecordModal: React.FC<{
  visible: boolean
  task: EngineeringTask | null
  onClose: () => void
  onSubmit: (taskId: string, safetyData: any) => void
}> = ({ visible, task, onClose, onSubmit }) => {
  const [form] = Form.useForm()
  const [photos, setPhotos] = useState<any[]>([])

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        recordDate: dayjs(),
        type: 'INSPECTION',
        severity: 'LOW',
        status: 'OPEN'
      })
    }
  }, [visible, form])

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const safetyData = {
        ...values,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
        photos: photos.map(photo => photo.response?.url || photo.url)
      }
      
      onSubmit(task!.id, safetyData)
      onClose()
    } catch (error) {
      console.error('Safety record submit failed:', error)
    }
  }, [form, photos, task, onSubmit, onClose])

  return (
    <Modal
      title={`安全记录 - ${task?.projectName}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="recordDate"
              label="记录日期"
              rules={[{ required: true, message: '请选择记录日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="记录类型"
              rules={[{ required: true, message: '请选择记录类型' }]}
            >
              <Select>
                <Option value="INSPECTION">安全检查</Option>
                <Option value="INCIDENT">安全事故</Option>
                <Option value="TRAINING">安全培训</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="记录描述"
          rules={[{ required: true, message: '请输入记录描述' }]}
        >
          <Input.TextArea rows={4} placeholder="请详细描述安全检查情况或事故经过..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="severity"
              label="严重程度"
            >
              <Select>
                <Option value="LOW"><Tag color="green">低</Tag></Option>
                <Option value="MEDIUM"><Tag color="orange">中</Tag></Option>
                <Option value="HIGH"><Tag color="red">高</Tag></Option>
                <Option value="CRITICAL"><Tag color="#f50">严重</Tag></Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="状态"
            >
              <Select>
                <Option value="OPEN"><Tag color="blue">处理中</Tag></Option>
                <Option value="CLOSED"><Tag color="green">已关闭</Tag></Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="involvedPersons"
          label="涉及人员"
        >
          <Select mode="tags" placeholder="请输入涉及人员姓名" />
        </Form.Item>

        <Form.Item
          name="correctionActions"
          label="纠正措施"
        >
          <Input.TextArea rows={3} placeholder="请描述已采取或计划采取的纠正措施..." />
        </Form.Item>

        <Form.Item
          name="followUpDate"
          label="跟进日期"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="reporter"
          label="记录人"
          rules={[{ required: true, message: '请输入记录人' }]}
        >
          <Input placeholder="请输入记录人姓名" />
        </Form.Item>

        <Form.Item label="相关照片">
          <Upload
            listType="picture-card"
            fileList={photos}
            onChange={({ fileList }) => setPhotos(fileList)}
            beforeUpload={() => false}
            multiple
          >
            {photos.length < 6 && (
              <div>
                <CameraOutlined />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  )
}

// 材料使用记录弹窗组件
const MaterialUsageModal: React.FC<{
  visible: boolean
  task: EngineeringTask | null
  onClose: () => void
  onSubmit: (taskId: string, materialData: any) => void
}> = ({ visible, task, onClose, onSubmit }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        deliveryDate: dayjs(),
        quality: 'GOOD'
      })
    }
  }, [visible, form])

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const materialData = {
        ...values,
        deliveryDate: values.deliveryDate.format('YYYY-MM-DD'),
        acceptanceDate: values.acceptanceDate?.format('YYYY-MM-DD'),
        totalCost: values.actualQuantity * values.unitPrice
      }
      
      onSubmit(task!.id, materialData)
      onClose()
    } catch (error) {
      console.error('Material usage submit failed:', error)
    }
  }, [form, task, onSubmit, onClose])

  return (
    <Modal
      title={`材料使用记录 - ${task?.projectName}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="materialName"
              label="材料名称"
              rules={[{ required: true, message: '请输入材料名称' }]}
            >
              <Input placeholder="请输入材料名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="specification"
              label="规格型号"
              rules={[{ required: true, message: '请输入规格型号' }]}
            >
              <Input placeholder="请输入规格型号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="unit"
              label="单位"
              rules={[{ required: true, message: '请输入单位' }]}
            >
              <Select>
                <Option value="个">个</Option>
                <Option value="台">台</Option>
                <Option value="套">套</Option>
                <Option value="米">米</Option>
                <Option value="平方米">平方米</Option>
                <Option value="立方米">立方米</Option>
                <Option value="吨">吨</Option>
                <Option value="千克">千克</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="plannedQuantity"
              label="计划用量"
              rules={[{ required: true, message: '请输入计划用量' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="计划用量"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="actualQuantity"
              label="实际用量"
              rules={[{ required: true, message: '请输入实际用量' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="实际用量"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="unitPrice"
              label="单价（元）"
              rules={[{ required: true, message: '请输入单价' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                placeholder="单价"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="supplier"
              label="供应商"
              rules={[{ required: true, message: '请输入供应商' }]}
            >
              <Input placeholder="请输入供应商" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="deliveryDate"
              label="交付日期"
              rules={[{ required: true, message: '请选择交付日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="acceptanceDate"
              label="验收日期"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quality"
              label="质量评级"
            >
              <Select>
                <Option value="EXCELLENT"><Tag color="gold">优秀</Tag></Option>
                <Option value="GOOD"><Tag color="green">良好</Tag></Option>
                <Option value="FAIR"><Tag color="orange">一般</Tag></Option>
                <Option value="POOR"><Tag color="red">差</Tag></Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="wastageRate"
              label="损耗率(%)"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                precision={2}
                placeholder="损耗率"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="备注"
        >
          <Input.TextArea rows={3} placeholder="请输入备注信息..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const EngineeringManagement: React.FC = () => {
  const navigate = useNavigate()
  
  // Store状态
  const {
    engineeringTasks,
    selectedTaskIds,
    taskFilters,
    taskPagination,
    isLoading,
    isSubmitting,
    
    // 方法
    fetchEngineeringTasks,
    setSelectedTaskIds,
    setTaskFilters,
    setTaskPagination,
    deleteEngineeringTask,
    batchDeleteEngineeringTasks,
    updateTaskStatus,
    clearAllSelections
  } = usePreparationStore()

  // 本地状态
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [quickStatusFilter, setQuickStatusFilter] = useState<EngineeringStatusType | undefined>()
  const [qualityCheckModalVisible, setQualityCheckModalVisible] = useState(false)
  const [safetyRecordModalVisible, setSafetyRecordModalVisible] = useState(false)
  const [materialUsageModalVisible, setMaterialUsageModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<EngineeringTask | null>(null)
  
  // 初始化数据
  useEffect(() => {
    fetchEngineeringTasks()
  }, [fetchEngineeringTasks])

  // 搜索处理
  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword)
    const newFilters = { ...taskFilters, keyword, page: 1 }
    setTaskFilters(newFilters)
    fetchEngineeringTasks(newFilters)
  }, [taskFilters, setTaskFilters, fetchEngineeringTasks])

  // 快速状态筛选
  const handleQuickStatusFilter = useCallback((status?: EngineeringStatusType) => {
    setQuickStatusFilter(status)
    const newFilters = { ...taskFilters, status, page: 1 }
    setTaskFilters(newFilters)
    fetchEngineeringTasks(newFilters)
  }, [taskFilters, setTaskFilters, fetchEngineeringTasks])

  // 分页处理
  const handleTableChange: TableProps<EngineeringTask>['onChange'] = useCallback((pagination) => {
    const newPagination = {
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 20
    }
    setTaskPagination(newPagination)
    
    const newFilters = {
      ...taskFilters,
      page: newPagination.current,
      limit: newPagination.pageSize
    }
    fetchEngineeringTasks(newFilters)
  }, [taskFilters, setTaskPagination, fetchEngineeringTasks])

  // 选择处理
  const rowSelection: TableProps<EngineeringTask>['rowSelection'] = {
    selectedRowKeys: selectedTaskIds,
    onChange: (selectedKeys) => {
      setSelectedTaskIds(selectedKeys as string[])
    },
  }

  // 状态变更处理
  const handleStatusChange = useCallback(async (record: EngineeringTask, status: EngineeringStatusType) => {
    await updateTaskStatus(record.id, status)
  }, [updateTaskStatus])

  // 删除处理
  const handleDelete = useCallback(async (record: EngineeringTask) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除工程任务"${record.projectName}"吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        await deleteEngineeringTask(record.id)
      }
    })
  }, [deleteEngineeringTask])

  // 质量检查提交
  const handleQualityCheckSubmit = useCallback(async (taskId: string, qualityData: any) => {
    try {
      // 这里应该调用API提交质量检查数据
      message.success('质量检查记录已提交')
      console.log('Quality check data:', { taskId, qualityData })
    } catch (error) {
      message.error('质量检查记录提交失败')
    }
  }, [])

  // 安全记录提交
  const handleSafetyRecordSubmit = useCallback(async (taskId: string, safetyData: any) => {
    try {
      // 这里应该调用API提交安全记录数据
      message.success('安全记录已提交')
      console.log('Safety record data:', { taskId, safetyData })
    } catch (error) {
      message.error('安全记录提交失败')
    }
  }, [])

  // 材料使用记录提交
  const handleMaterialUsageSubmit = useCallback(async (taskId: string, materialData: any) => {
    try {
      // 这里应该调用API提交材料使用数据
      message.success('材料使用记录已提交')
      console.log('Material usage data:', { taskId, materialData })
    } catch (error) {
      message.error('材料使用记录提交失败')
    }
  }, [])

  // 表格列配置
  const columns: ColumnsType<EngineeringTask> = useMemo(() => [
    {
      title: '工程信息',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 280,
      fixed: 'left',
      render: (text: string, record: EngineeringTask) => {
        const typeOption = PROJECT_TYPE_OPTIONS.find(opt => opt.value === record.taskType)
        return (
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto', fontWeight: 500 }}
                onClick={() => navigate(`/preparation/engineering/${record.id}`)}
              >
                {text}
              </Button>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
              合同编号：{record.contractNumber || '未设置'}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              <Space>
                {typeOption?.icon}
                {typeOption?.label}
              </Space>
            </div>
          </div>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EngineeringStatusType, record) => (
        <Dropdown
          menu={{
            items: STATUS_OPTIONS.map(opt => ({
              key: opt.value,
              label: <StatusBadge status={opt.value as EngineeringStatusType} />,
              onClick: () => handleStatusChange(record, opt.value as EngineeringStatusType),
              disabled: opt.value === status
            }))
          }}
          trigger={['click']}
        >
          <div style={{ cursor: 'pointer' }}>
            <StatusBadge status={status} />
          </div>
        </Dropdown>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progressPercentage',
      key: 'progressPercentage',
      width: 150,
      render: (percent: number, record) => (
        <ProgressColumn percent={percent} status={record.status as EngineeringStatusType} />
      ),
    },
    {
      title: '合同金额',
      key: 'contractAmount',
      width: 150,
      render: (_, record: EngineeringTask) => (
        <div>
          <div style={{ fontSize: 13 }}>
            合同：{(record.contractAmount / 10000).toFixed(1)}万
          </div>
          {record.actualAmount && (
            <div style={{ 
              fontSize: 12, 
              color: record.actualAmount > record.contractAmount ? '#ff4d4f' : '#52c41a' 
            }}>
              实际：{(record.actualAmount / 10000).toFixed(1)}万
            </div>
          )}
        </div>
      ),
    },
    {
      title: '施工时间',
      key: 'timeline',
      width: 180,
      render: (_, record: EngineeringTask) => (
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>
            计划：{dayjs(record.plannedStartDate).format('MM/DD')} ~ {dayjs(record.plannedEndDate).format('MM/DD')}
          </div>
          {record.actualStartDate && (
            <div style={{ fontSize: 12, color: '#666' }}>
              实际：{dayjs(record.actualStartDate).format('MM/DD')} ~ {record.actualEndDate ? dayjs(record.actualEndDate).format('MM/DD') : '进行中'}
            </div>
          )}
          <div style={{ fontSize: 12, color: dayjs().isAfter(record.plannedEndDate) ? '#ff4d4f' : '#52c41a' }}>
            {dayjs().isAfter(record.plannedEndDate) ? '已逾期' : `剩余${dayjs(record.plannedEndDate).diff(dayjs(), 'day')}天`}
          </div>
        </div>
      ),
    },
    {
      title: '质量评分',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      width: 100,
      render: (score: number) => (
        <div style={{ textAlign: 'center' }}>
          <Rate
            disabled
            allowHalf
            value={score / 2}
            style={{ fontSize: 14 }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {score?.toFixed(1) || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record: EngineeringTask) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/preparation/engineering/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/preparation/engineering/${record.id}/edit`)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'quality',
                  label: '质量检查',
                  icon: <CheckCircleOutlined />,
                  onClick: () => {
                    setSelectedTask(record)
                    setQualityCheckModalVisible(true)
                  }
                },
                {
                  key: 'safety',
                  label: '安全记录',
                  icon: <SafetyCertificateOutlined />,
                  onClick: () => {
                    setSelectedTask(record)
                    setSafetyRecordModalVisible(true)
                  }
                },
                {
                  key: 'material',
                  label: '材料管理',
                  icon: <ToolOutlined />,
                  onClick: () => {
                    setSelectedTask(record)
                    setMaterialUsageModalVisible(true)
                  }
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  label: <Text type="danger">删除</Text>,
                  icon: <DeleteOutlined />,
                  onClick: () => handleDelete(record)
                }
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ], [navigate, handleStatusChange, handleDelete])

  return (
    <PageContainer
      title="工程施工管理"
      breadcrumb={{
        routes: [
          { path: '/', breadcrumbName: '首页' },
          { path: '/preparation', breadcrumbName: '开店筹备' },
          { path: '/preparation/engineering', breadcrumbName: '工程施工' },
        ]
      }}
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总工程数"
              value={taskPagination.total}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="施工中"
              value={engineeringTasks.filter(t => t.status === 'IN_PROGRESS').length}
              valueStyle={{ color: ENGINEERING_STATUS_COLORS.IN_PROGRESS }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={engineeringTasks.filter(t => t.status === 'COMPLETED').length}
              valueStyle={{ color: ENGINEERING_STATUS_COLORS.COMPLETED }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已验收"
              value={engineeringTasks.filter(t => t.status === 'ACCEPTED').length}
              valueStyle={{ color: ENGINEERING_STATUS_COLORS.ACCEPTED }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索工程名称、合同编号"
                allowClear
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 300 }}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                value={quickStatusFilter}
                onChange={handleQuickStatusFilter}
                style={{ width: 150 }}
              >
                {STATUS_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    <StatusBadge status={option.value as EngineeringStatusType} />
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col flex="none">
            <Space>
              {selectedTaskIds.length > 0 && (
                <>
                  <Text type="secondary">
                    已选择 {selectedTaskIds.length} 项
                  </Text>
                  <Button onClick={clearAllSelections}>取消选择</Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/preparation/engineering/create')}
              >
                新建工程
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
              >
                筛选
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => message.info('导出功能开发中')}
              >
                导出
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchEngineeringTasks()}
                loading={isLoading}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 表格 */}
        <Table<EngineeringTask>
          rowKey="id"
          columns={columns}
          dataSource={engineeringTasks}
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{
            current: taskPagination.current,
            pageSize: taskPagination.pageSize,
            total: taskPagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1200 }}
          onChange={handleTableChange}
          size="small"
        />
      </Card>

      {/* 质量检查弹窗 */}
      <QualityCheckModal
        visible={qualityCheckModalVisible}
        task={selectedTask}
        onClose={() => {
          setQualityCheckModalVisible(false)
          setSelectedTask(null)
        }}
        onSubmit={handleQualityCheckSubmit}
      />

      {/* 安全记录弹窗 */}
      <SafetyRecordModal
        visible={safetyRecordModalVisible}
        task={selectedTask}
        onClose={() => {
          setSafetyRecordModalVisible(false)
          setSelectedTask(null)
        }}
        onSubmit={handleSafetyRecordSubmit}
      />

      {/* 材料使用记录弹窗 */}
      <MaterialUsageModal
        visible={materialUsageModalVisible}
        task={selectedTask}
        onClose={() => {
          setMaterialUsageModalVisible(false)
          setSelectedTask(null)
        }}
        onSubmit={handleMaterialUsageSubmit}
      />
    </PageContainer>
  )
}

export default EngineeringManagement