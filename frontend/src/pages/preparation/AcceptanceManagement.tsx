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
  Row,
  Col,
  Statistic,
  Typography,
  Dropdown,
  Steps,
  Rate,
  Upload,
  Image,
  Timeline,
  Tabs,
  List,
  Divider,
  Alert,
  Checkbox,
  Radio
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  CameraOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  HomeOutlined,
  StarOutlined,
  MoreOutlined,
  FormOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import PageContainer from '@/components/common/PageContainer'
import { usePreparationStore } from '@/stores/preparationStore'
import type {
  EngineeringTask,
  EquipmentProcurement,
  QualityCheck,
  EngineeringStatusType,
  EquipmentStatusType,
  Priority
} from '@/constants/colors'

const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select
const { Text, Title } = Typography
const { TabPane } = Tabs
const { Step } = Steps

// 验收阶段配置
const ACCEPTANCE_STAGES = [
  {
    key: 'design',
    title: '设计验收',
    description: '设计方案、图纸等验收确认',
    icon: <FormOutlined />,
    color: '#1890ff'
  },
  {
    key: 'construction',
    title: '施工验收',
    description: '工程质量、施工工艺验收',
    icon: <ToolOutlined />,
    color: '#faad14'
  },
  {
    key: 'equipment',
    title: '设备验收',
    description: '设备安装、调试验收',
    icon: <SafetyCertificateOutlined />,
    color: '#13c2c2'
  },
  {
    key: 'final',
    title: '最终验收',
    description: '整体工程最终验收',
    icon: <CheckCircleOutlined />,
    color: '#52c41a'
  }
]

// 验收状态配置
const ACCEPTANCE_STATUS = {
  PENDING: { label: '待验收', color: '#d9d9d9', icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { label: '验收中', color: '#1890ff', icon: <AuditOutlined /> },
  PASSED: { label: '验收通过', color: '#52c41a', icon: <CheckCircleOutlined /> },
  FAILED: { label: '验收不通过', color: '#ff4d4f', icon: <CloseCircleOutlined /> },
  CONDITIONAL: { label: '条件通过', color: '#faad14', icon: <WarningOutlined /> },
}

// 验收项目类型
const ACCEPTANCE_TYPES = [
  { value: 'ENGINEERING', label: '工程验收', icon: <ToolOutlined /> },
  { value: 'EQUIPMENT', label: '设备验收', icon: <SafetyCertificateOutlined /> },
  { value: 'INTEGRATED', label: '综合验收', icon: <HomeOutlined /> },
]

// 验收记录表单弹窗
const AcceptanceRecordModal: React.FC<{
  visible: boolean
  acceptanceType: 'ENGINEERING' | 'EQUIPMENT' | 'INTEGRATED'
  item: any
  onClose: () => void
  onSubmit: (data: any) => void
}> = ({ visible, acceptanceType, item, onClose, onSubmit }) => {
  const [form] = Form.useForm()
  const [checkItems, setCheckItems] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    if (visible && item) {
      // 根据验收类型初始化检查项
      let defaultCheckItems = []
      
      if (acceptanceType === 'ENGINEERING') {
        defaultCheckItems = [
          { name: '施工质量', standard: '符合设计要求和施工规范', score: 0, result: 'PASS', notes: '' },
          { name: '材料使用', standard: '材料质量符合要求，使用规范', score: 0, result: 'PASS', notes: '' },
          { name: '安全措施', standard: '安全措施到位，符合安全规范', score: 0, result: 'PASS', notes: '' },
          { name: '工艺标准', standard: '施工工艺符合行业标准', score: 0, result: 'PASS', notes: '' },
          { name: '进度控制', standard: '按计划完成，进度可控', score: 0, result: 'PASS', notes: '' },
        ]
      } else if (acceptanceType === 'EQUIPMENT') {
        defaultCheckItems = [
          { name: '设备外观', standard: '外观完好，无损伤', score: 0, result: 'PASS', notes: '' },
          { name: '功能测试', standard: '设备功能正常，运行稳定', score: 0, result: 'PASS', notes: '' },
          { name: '安装质量', standard: '安装到位，连接牢固', score: 0, result: 'PASS', notes: '' },
          { name: '调试情况', standard: '调试完成，参数正确', score: 0, result: 'PASS', notes: '' },
          { name: '文档资料', standard: '技术文档齐全，操作手册完整', score: 0, result: 'PASS', notes: '' },
        ]
      } else {
        defaultCheckItems = [
          { name: '整体协调', standard: '各系统协调运行，无冲突', score: 0, result: 'PASS', notes: '' },
          { name: '功能完整', standard: '功能完整，满足使用要求', score: 0, result: 'PASS', notes: '' },
          { name: '安全可靠', standard: '安全可靠，符合安全标准', score: 0, result: 'PASS', notes: '' },
          { name: '环境适应', standard: '适应使用环境，无不良影响', score: 0, result: 'PASS', notes: '' },
          { name: '验收资料', standard: '验收资料齐全，符合要求', score: 0, result: 'PASS', notes: '' },
        ]
      }
      
      setCheckItems(defaultCheckItems)
      
      form.setFieldsValue({
        acceptanceDate: dayjs(),
        acceptanceType,
        inspector: '验收专员',
        stage: 'final'
      })
    }
  }, [visible, acceptanceType, item, form])

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const overallScore = Math.round(
        checkItems.reduce((sum, item) => sum + item.score, 0) / checkItems.length
      )
      
      const acceptanceData = {
        ...values,
        acceptanceDate: values.acceptanceDate.format('YYYY-MM-DD'),
        checkItems,
        overallScore,
        result: overallScore >= 80 ? 'PASSED' : overallScore >= 60 ? 'CONDITIONAL' : 'FAILED',
        photos: photos.map(photo => photo.response?.url || photo.url),
        documents: documents.map(doc => doc.response?.url || doc.url),
        itemId: item.id,
        itemType: acceptanceType
      }
      
      onSubmit(acceptanceData)
      onClose()
    } catch (error) {
      console.error('Acceptance submit failed:', error)
    }
  }, [form, checkItems, photos, documents, item, acceptanceType, onSubmit, onClose])

  const updateCheckItem = (index: number, field: string, value: any) => {
    const newCheckItems = [...checkItems]
    newCheckItems[index] = { ...newCheckItems[index], [field]: value }
    setCheckItems(newCheckItems)
  }

  return (
    <Modal
      title={`${ACCEPTANCE_TYPES.find(t => t.value === acceptanceType)?.label} - ${item?.projectName || item?.equipmentName}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={900}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="acceptanceDate"
              label="验收日期"
              rules={[{ required: true, message: '请选择验收日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="stage"
              label="验收阶段"
              rules={[{ required: true, message: '请选择验收阶段' }]}
            >
              <Select>
                {ACCEPTANCE_STAGES.map(stage => (
                  <Option key={stage.key} value={stage.key}>
                    <Space>
                      {stage.icon}
                      {stage.title}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="inspector"
              label="验收人员"
              rules={[{ required: true, message: '请输入验收人员' }]}
            >
              <Input placeholder="请输入验收人员姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>验收检查项</Divider>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {checkItems.map((item, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16} align="middle">
                <Col span={5}>
                  <Text strong>{item.name}</Text>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {item.standard}
                  </div>
                </Col>
                <Col span={4}>
                  <div style={{ textAlign: 'center' }}>
                    <Rate
                      value={item.score / 20}
                      onChange={(value) => updateCheckItem(index, 'score', value * 20)}
                      style={{ fontSize: 16 }}
                    />
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {item.score}分
                    </div>
                  </div>
                </Col>
                <Col span={3}>
                  <Radio.Group
                    value={item.result}
                    onChange={(e) => updateCheckItem(index, 'result', e.target.value)}
                  >
                    <Radio.Button value="PASS">
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    </Radio.Button>
                    <Radio.Button value="FAIL">
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    </Radio.Button>
                  </Radio.Group>
                </Col>
                <Col span={12}>
                  <Input.TextArea
                    value={item.notes}
                    onChange={(e) => updateCheckItem(index, 'notes', e.target.value)}
                    placeholder="验收备注"
                    rows={2}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </div>

        <Divider>验收照片</Divider>
        <Upload
          listType="picture-card"
          fileList={photos}
          onChange={({ fileList }) => setPhotos(fileList)}
          beforeUpload={() => false}
          multiple
        >
          {photos.length < 12 && (
            <div>
              <CameraOutlined />
              <div style={{ marginTop: 8 }}>上传照片</div>
            </div>
          )}
        </Upload>

        <Divider>验收文档</Divider>
        <Upload
          listType="text"
          fileList={documents}
          onChange={({ fileList }) => setDocuments(fileList)}
          beforeUpload={() => false}
          multiple
        >
          <Button icon={<FileTextOutlined />}>上传文档</Button>
        </Upload>

        <Divider>验收意见</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="issues"
              label="发现问题"
            >
              <Input.TextArea rows={4} placeholder="请描述发现的问题..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="recommendations"
              label="处理建议"
            >
              <Input.TextArea rows={4} placeholder="请提出处理建议..." />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="conclusion"
          label="验收结论"
          rules={[{ required: true, message: '请输入验收结论' }]}
        >
          <Input.TextArea rows={3} placeholder="请输入验收结论..." />
        </Form.Item>

        <Form.Item
          name="nextSteps"
          label="后续工作"
        >
          <Input.TextArea rows={2} placeholder="请描述需要跟进的后续工作..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// 验收详情查看弹窗
const AcceptanceDetailModal: React.FC<{
  visible: boolean
  acceptance: any
  onClose: () => void
}> = ({ visible, acceptance, onClose }) => {
  if (!acceptance) return null

  return (
    <Modal
      title={`验收详情 - ${acceptance.itemName}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      {/* 验收基本信息 */}
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>验收类型：</Text>
            <div>{ACCEPTANCE_TYPES.find(t => t.value === acceptance.acceptanceType)?.label}</div>
          </Col>
          <Col span={8}>
            <Text strong>验收阶段：</Text>
            <div>{ACCEPTANCE_STAGES.find(s => s.key === acceptance.stage)?.title}</div>
          </Col>
          <Col span={8}>
            <Text strong>验收日期：</Text>
            <div>{dayjs(acceptance.acceptanceDate).format('YYYY-MM-DD')}</div>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col span={8}>
            <Text strong>验收人员：</Text>
            <div>{acceptance.inspector}</div>
          </Col>
          <Col span={8}>
            <Text strong>总体评分：</Text>
            <div>
              <Rate disabled value={acceptance.overallScore / 20} style={{ fontSize: 16 }} />
              <span style={{ marginLeft: 8 }}>{acceptance.overallScore}分</span>
            </div>
          </Col>
          <Col span={8}>
            <Text strong>验收结果：</Text>
            <div>
              <Tag color={ACCEPTANCE_STATUS[acceptance.result as keyof typeof ACCEPTANCE_STATUS].color}>
                {ACCEPTANCE_STATUS[acceptance.result as keyof typeof ACCEPTANCE_STATUS].icon}
                <span style={{ marginLeft: 4 }}>
                  {ACCEPTANCE_STATUS[acceptance.result as keyof typeof ACCEPTANCE_STATUS].label}
                </span>
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 检查项详情 */}
      <Card title="检查项详情" size="small" style={{ marginBottom: 16 }}>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {acceptance.checkItems?.map((item: any, index: number) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Text strong>{item.name}</Text>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {item.standard}
                  </div>
                </Col>
                <Col span={4}>
                  <div style={{ textAlign: 'center' }}>
                    <Rate disabled value={item.score / 20} style={{ fontSize: 14 }} />
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      {item.score}分
                    </div>
                  </div>
                </Col>
                <Col span={3}>
                  <Tag color={item.result === 'PASS' ? 'green' : 'red'}>
                    {item.result === 'PASS' ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )}
                    <span style={{ marginLeft: 4 }}>
                      {item.result === 'PASS' ? '合格' : '不合格'}
                    </span>
                  </Tag>
                </Col>
                <Col span={11}>
                  <Text type="secondary">{item.notes || '无备注'}</Text>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      </Card>

      {/* 验收照片 */}
      {acceptance.photos && acceptance.photos.length > 0 && (
        <Card title="验收照片" size="small" style={{ marginBottom: 16 }}>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {acceptance.photos.map((photo: string, index: number) => (
                <Image
                  key={index}
                  width={100}
                  height={100}
                  src={photo}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </div>
          </Image.PreviewGroup>
        </Card>
      )}

      {/* 验收意见 */}
      <Card title="验收意见" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>发现问题：</Text>
            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
              {acceptance.issues || '无问题'}
            </div>
          </Col>
          <Col span={12}>
            <Text strong>处理建议：</Text>
            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
              {acceptance.recommendations || '无建议'}
            </div>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Text strong>验收结论：</Text>
            <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
              {acceptance.conclusion}
            </div>
          </Col>
        </Row>
        {acceptance.nextSteps && (
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Text strong>后续工作：</Text>
              <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
                {acceptance.nextSteps}
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* 验收文档 */}
      {acceptance.documents && acceptance.documents.length > 0 && (
        <Card title="验收文档" size="small">
          <List
            size="small"
            dataSource={acceptance.documents}
            renderItem={(doc: string, index: number) => (
              <List.Item
                actions={[
                  <Button 
                    key="download" 
                    type="link" 
                    size="small" 
                    icon={<FileTextOutlined />}
                    onClick={() => window.open(doc, '_blank')}
                  >
                    查看
                  </Button>
                ]}
              >
                <Text>验收文档 {index + 1}</Text>
              </List.Item>
            )}
          />
        </Card>
      )}
    </Modal>
  )
}

const AcceptanceManagement: React.FC = () => {
  const navigate = useNavigate()
  
  // Store状态
  const {
    engineeringTasks,
    equipmentList,
    acceptanceRecords,
    isLoading,
    
    // 方法
    fetchEngineeringTasks,
    fetchEquipmentList,
    fetchAcceptanceRecords
  } = usePreparationStore()

  // 本地状态
  const [activeTab, setActiveTab] = useState('pending')
  const [acceptanceModalVisible, setAcceptanceModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [acceptanceType, setAcceptanceType] = useState<'ENGINEERING' | 'EQUIPMENT' | 'INTEGRATED'>('ENGINEERING')
  const [selectedAcceptance, setSelectedAcceptance] = useState<any>(null)
  
  // 初始化数据
  useEffect(() => {
    fetchEngineeringTasks()
    fetchEquipmentList()
    fetchAcceptanceRecords()
  }, [fetchEngineeringTasks, fetchEquipmentList, fetchAcceptanceRecords])

  // 提交验收记录
  const handleAcceptanceSubmit = useCallback(async (data: any) => {
    try {
      // 这里应该调用API提交验收数据
      message.success('验收记录已提交')
      console.log('Acceptance data:', data)
      fetchAcceptanceRecords() // 刷新验收记录列表
    } catch (error) {
      message.error('验收记录提交失败')
    }
  }, [fetchAcceptanceRecords])

  // 开始验收
  const handleStartAcceptance = useCallback((item: any, type: 'ENGINEERING' | 'EQUIPMENT' | 'INTEGRATED') => {
    setSelectedItem(item)
    setAcceptanceType(type)
    setAcceptanceModalVisible(true)
  }, [])

  // 查看验收详情
  const handleViewDetail = useCallback((acceptance: any) => {
    setSelectedAcceptance(acceptance)
    setDetailModalVisible(true)
  }, [])

  // 待验收项目列表
  const pendingItems = useMemo(() => {
    const engineeringItems = engineeringTasks
      .filter(task => task.status === 'COMPLETED')
      .map(task => ({
        ...task,
        type: 'ENGINEERING',
        typeName: '工程验收',
        name: task.projectName,
        completedDate: task.actualEndDate || task.plannedEndDate
      }))
    
    const equipmentItems = equipmentList
      .filter(equipment => equipment.status === 'INSTALLED')
      .map(equipment => ({
        ...equipment,
        type: 'EQUIPMENT',
        typeName: '设备验收',
        name: equipment.equipmentName,
        completedDate: equipment.installationDate
      }))
    
    return [...engineeringItems, ...equipmentItems].sort((a, b) => 
      dayjs(a.completedDate).valueOf() - dayjs(b.completedDate).valueOf()
    )
  }, [engineeringTasks, equipmentList])

  // 待验收表格列配置
  const pendingColumns: ColumnsType<any> = useMemo(() => [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            类型：{record.typeName}
          </div>
          {record.contractNumber && (
            <div style={{ fontSize: 12, color: '#666' }}>
              合同：{record.contractNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '验收类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeConfig = ACCEPTANCE_TYPES.find(t => t.value === type)
        return (
          <Tag icon={typeConfig?.icon} color={type === 'ENGINEERING' ? 'blue' : 'green'}>
            {typeConfig?.label}
          </Tag>
        )
      },
    },
    {
      title: '完成时间',
      dataIndex: 'completedDate',
      key: 'completedDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '等待天数',
      key: 'waitingDays',
      width: 100,
      render: (_, record: any) => {
        const days = dayjs().diff(record.completedDate, 'day')
        return (
          <Text type={days > 7 ? 'danger' : days > 3 ? 'warning' : undefined}>
            {days}天
          </Text>
        )
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: Priority) => {
        const colors = {
          URGENT: 'red',
          HIGH: 'orange',
          MEDIUM: 'blue',
          LOW: 'green'
        }
        return <Tag color={colors[priority]}>{priority}</Tag>
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleStartAcceptance(record, record.type)}
          >
            开始验收
          </Button>
        </Space>
      ),
    },
  ], [handleStartAcceptance])

  // 已验收记录表格列配置
  const completedColumns: ColumnsType<any> = useMemo(() => [
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            类型：{ACCEPTANCE_TYPES.find(t => t.value === record.acceptanceType)?.label}
          </div>
        </div>
      ),
    },
    {
      title: '验收阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 120,
      render: (stage: string) => {
        const stageConfig = ACCEPTANCE_STAGES.find(s => s.key === stage)
        return (
          <Tag icon={stageConfig?.icon} color={stageConfig?.color}>
            {stageConfig?.title}
          </Tag>
        )
      },
    },
    {
      title: '验收日期',
      dataIndex: 'acceptanceDate',
      key: 'acceptanceDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '验收人员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 100,
    },
    {
      title: '评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 120,
      render: (score: number) => (
        <div style={{ textAlign: 'center' }}>
          <Rate disabled value={score / 20} style={{ fontSize: 14 }} />
          <div style={{ fontSize: 12, marginTop: 2 }}>{score}分</div>
        </div>
      ),
    },
    {
      title: '验收结果',
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (result: string) => {
        const status = ACCEPTANCE_STATUS[result as keyof typeof ACCEPTANCE_STATUS]
        return (
          <Tag color={status.color}>
            {status.icon}
            <span style={{ marginLeft: 4 }}>{status.label}</span>
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ], [handleViewDetail])

  return (
    <PageContainer
      title="验收确认管理"
      breadcrumb={{
        routes: [
          { path: '/', breadcrumbName: '首页' },
          { path: '/preparation', breadcrumbName: '开店筹备' },
          { path: '/preparation/acceptance', breadcrumbName: '验收确认' },
        ]
      }}
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待验收项目"
              value={pendingItems.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月已验收"
              value={acceptanceRecords.filter(r => 
                dayjs(r.acceptanceDate).month() === dayjs().month()
              ).length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="验收通过率"
              value={acceptanceRecords.length > 0 ? Math.round(
                (acceptanceRecords.filter(r => r.result === 'PASSED').length / 
                 acceptanceRecords.length) * 100
              ) : 0}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={acceptanceRecords.length > 0 ? (
                acceptanceRecords.reduce((sum, r) => sum + r.overallScore, 0) / 
                acceptanceRecords.length
              ).toFixed(1) : 0}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <ClockCircleOutlined />
                待验收项目 {pendingItems.length > 0 && <Badge count={pendingItems.length} />}
              </span>
            } 
            key="pending"
          >
            {pendingItems.length > 0 ? (
              <Table
                columns={pendingColumns}
                dataSource={pendingItems}
                rowKey="id"
                loading={isLoading}
                size="small"
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                }}
              />
            ) : (
              <Alert
                message="暂无待验收项目"
                description="当工程完工或设备安装完成后，将自动出现在此处等待验收。"
                type="info"
                showIcon
                style={{ margin: '40px 0' }}
              />
            )}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined />
                验收记录
              </span>
            } 
            key="completed"
          >
            <Table
              columns={completedColumns}
              dataSource={acceptanceRecords}
              rowKey="id"
              loading={isLoading}
              size="small"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                验收统计
              </span>
            } 
            key="statistics"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card title="验收阶段分布" size="small">
                  {/* 这里可以添加图表组件 */}
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
                    验收阶段分布图表
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="验收通过率趋势" size="small">
                  {/* 这里可以添加图表组件 */}
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
                    验收通过率趋势图表
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 验收记录弹窗 */}
      <AcceptanceRecordModal
        visible={acceptanceModalVisible}
        acceptanceType={acceptanceType}
        item={selectedItem}
        onClose={() => {
          setAcceptanceModalVisible(false)
          setSelectedItem(null)
        }}
        onSubmit={handleAcceptanceSubmit}
      />

      {/* 验收详情弹窗 */}
      <AcceptanceDetailModal
        visible={detailModalVisible}
        acceptance={selectedAcceptance}
        onClose={() => {
          setDetailModalVisible(false)
          setSelectedAcceptance(null)
        }}
      />
    </PageContainer>
  )
}

export default AcceptanceManagement