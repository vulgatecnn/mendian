/**
 * 跟进单详情页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Button,
  Space,
  Tag,
  Message,
  Descriptions,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Modal,
  Typography,
  Grid,
  Statistic,
  Progress,
  Timeline,
  Divider
} from '@arco-design/web-react'
import {
  IconEdit,
  IconFile,
  IconClose,
  IconArrowLeft
} from '@arco-design/web-react/icon'
import { useParams, useNavigate } from 'react-router-dom'
import { ExpansionService } from '../../api'
import { 
  FollowUpRecord, 
  SurveyDataParams,
  ProfitCalculationParams,
  ContractInfoParams,
  AbandonFollowUpParams,
  LegalEntity
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import styles from './FollowUpDetail.module.css'

const { Title, Text } = Typography
const { Row, Col } = Grid
const { TabPane } = Tabs

const FollowUpDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // 状态管理
  const [followUp, setFollowUp] = useState<FollowUpRecord | null>(null)
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([])
  const [, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // 表单状态
  const [surveyForm] = Form.useForm()
  const [businessForm] = Form.useForm()
  const [contractForm] = Form.useForm()
  const [abandonForm] = Form.useForm()
  
  // 弹窗状态
  const [surveyModalVisible, setSurveyModalVisible] = useState(false)
  const [businessModalVisible, setBusinessModalVisible] = useState(false)
  const [contractModalVisible, setContractModalVisible] = useState(false)
  const [abandonModalVisible, setAbandonModalVisible] = useState(false)

  // 加载跟进单详情
  const loadFollowUpDetail = async () => {
    if (!id) return
    
    try {
      setDetailLoading(true)
      const response = await ExpansionService.getFollowUpDetail(parseInt(id))
      setFollowUp(response)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载跟进单详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  // 加载法人主体列表
  const loadLegalEntities = async () => {
    try {
      const response = await ExpansionService.getLegalEntities()
      setLegalEntities(response)
    } catch (error: any) {
      Message.error('加载法人主体失败')
    }
  }

  // 录入调研信息
  const handleSubmitSurvey = async (values: any) => {
    if (!followUp) return
    
    try {
      const params: SurveyDataParams = {
        survey_data: {
          foot_traffic: values.foot_traffic,
          competitor_count: values.competitor_count,
          rent_negotiation: values.rent_negotiation,
          decoration_requirements: values.decoration_requirements,
          lease_term: values.lease_term,
          notes: values.notes
        },
        survey_date: values.survey_date
      }
      
      await ExpansionService.submitSurveyData(followUp.id, params)
      Message.success('调研信息录入成功')
      setSurveyModalVisible(false)
      loadFollowUpDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '录入失败')
    }
  }

  // 执行盈利测算
  const handleCalculateProfit = async (values: any) => {
    if (!followUp) return
    
    try {
      const params: ProfitCalculationParams = {
        business_terms: {
          rent_cost: values.rent_cost,
          decoration_cost: values.decoration_cost,
          equipment_cost: values.equipment_cost,
          other_cost: values.other_cost || 0
        },
        sales_forecast: {
          daily_sales: values.daily_sales,
          monthly_sales: values.monthly_sales
        }
      }
      
      await ExpansionService.calculateProfit(followUp.id, params)
      Message.success('盈利测算完成')
      setBusinessModalVisible(false)
      loadFollowUpDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '测算失败')
    }
  }

  // 录入签约信息
  const handleSubmitContract = async (values: any) => {
    if (!followUp) return
    
    try {
      const params: ContractInfoParams = {
        contract_info: {
          contract_number: values.contract_number,
          contract_amount: values.contract_amount,
          lease_start_date: values.lease_start_date,
          lease_end_date: values.lease_end_date,
          deposit_amount: values.deposit_amount,
          notes: values.contract_notes
        },
        contract_date: values.contract_date,
        legal_entity_id: values.legal_entity_id,
        contract_reminders: values.reminders || []
      }
      
      await ExpansionService.submitContractInfo(followUp.id, params)
      Message.success('签约信息录入成功')
      setContractModalVisible(false)
      loadFollowUpDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '录入失败')
    }
  }

  // 放弃跟进
  const handleAbandonFollowUp = async (values: any) => {
    if (!followUp) return
    
    try {
      const params: AbandonFollowUpParams = {
        abandon_reason: values.abandon_reason
      }
      
      await ExpansionService.abandonFollowUp(followUp.id, params)
      Message.success('已标记为放弃跟进')
      setAbandonModalVisible(false)
      loadFollowUpDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '操作失败')
    }
  }

  // 发起审批
  const handleSubmitApproval = async () => {
    if (!followUp) return
    
    try {
      await ExpansionService.submitApproval(followUp.id)
      Message.success('报店审批已发起')
      loadFollowUpDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '发起审批失败')
    }
  }

  // 计算跟进进度
  const calculateProgress = () => {
    if (!followUp) return 0
    
    const statusProgress: Record<string, number> = {
      investigating: 25,
      calculating: 50,
      approving: 75,
      signed: 100,
      abandoned: 0
    }
    return statusProgress[followUp.status] || 0
  }

  // 初始加载
  useEffect(() => {
    loadFollowUpDetail()
    loadLegalEntities()
  }, [id])

  if (!followUp) {
    return <div>加载中...</div>
  }

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <Card className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={<IconArrowLeft />}
              onClick={() => navigate('/store-expansion/follow-ups')}
            >
              返回列表
            </Button>
            <Divider type="vertical" />
            <div>
              <Title heading={4} style={{ margin: 0 }}>
                {followUp.record_no}
              </Title>
              <Text type="secondary">
                {followUp.location?.name} - {followUp.location?.address}
              </Text>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Space>
              <Tag color="blue">
                {followUp.status === 'investigating' && '调研中'}
                {followUp.status === 'calculating' && '测算中'}
                {followUp.status === 'approving' && '审批中'}
                {followUp.status === 'signed' && '已签约'}
                {followUp.status === 'abandoned' && '已放弃'}
              </Tag>
              <Tag color="orange">
                优先级: {followUp.priority === 'low' && '低'}
                {followUp.priority === 'medium' && '中'}
                {followUp.priority === 'high' && '高'}
                {followUp.priority === 'urgent' && '紧急'}
              </Tag>
            </Space>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className={styles.progressSection}>
          <Progress
            percent={calculateProgress()}
            status={followUp.is_abandoned ? 'error' : undefined}
            showText={false}
          />
          <div className={styles.progressLabels}>
            <span className={followUp.status === 'investigating' ? styles.active : ''}>调研</span>
            <span className={followUp.status === 'calculating' ? styles.active : ''}>测算</span>
            <span className={followUp.status === 'approving' ? styles.active : ''}>审批</span>
            <span className={followUp.status === 'signed' ? styles.active : ''}>签约</span>
          </div>
        </div>
      </Card>

      {/* 主要内容 */}
      <Card>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          {/* 基本信息 */}
          <TabPane key="basic" title="基本信息">
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions
                  title="点位信息"
                  column={1}
                  data={[
                    { label: '点位名称', value: followUp.location?.name || '-' },
                    { label: '详细地址', value: followUp.location?.address || '-' },
                    { label: '面积', value: followUp.location?.area ? `${followUp.location.area}㎡` : '-' },
                    { label: '租金', value: followUp.location?.rent ? `${followUp.location.rent.toLocaleString()}元/月` : '-' },
                    { label: '业务大区', value: followUp.location?.business_region?.name || '-' }
                  ]}
                />
              </Col>
              <Col span={12}>
                <Descriptions
                  title="跟进信息"
                  column={1}
                  data={[
                    { label: '跟进单号', value: followUp.record_no },
                    { label: '跟进状态', value: followUp.status },
                    { label: '优先级', value: followUp.priority },
                    { label: '创建人', value: followUp.created_by_info?.full_name || '-' },
                    { label: '创建时间', value: new Date(followUp.created_at).toLocaleString('zh-CN') }
                  ]}
                />
              </Col>
            </Row>
          </TabPane>

          {/* 调研信息 */}
          <TabPane key="survey" title="调研信息">
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <Title heading={5}>调研信息</Title>
                {!followUp.survey_data && !followUp.is_abandoned && (
                  <PermissionGuard permission="expansion.followup.survey">
                    <Button
                      type="primary"
                      icon={<IconEdit />}
                      onClick={() => setSurveyModalVisible(true)}
                    >
                      录入调研信息
                    </Button>
                  </PermissionGuard>
                )}
              </div>
              
              {followUp.survey_data ? (
                <Descriptions
                  column={2}
                  data={[
                    { label: '调研日期', value: followUp.survey_date || '-' },
                    { label: '人流量', value: followUp.survey_data.foot_traffic || '-' },
                    { label: '竞争对手数量', value: followUp.survey_data.competitor_count || '-' },
                    { label: '租金谈判情况', value: followUp.survey_data.rent_negotiation || '-' },
                    { label: '装修要求', value: followUp.survey_data.decoration_requirements || '-' },
                    { label: '租期', value: followUp.survey_data.lease_term || '-' },
                    { label: '备注', value: followUp.survey_data.notes || '-', span: 2 }
                  ]}
                />
              ) : (
                <div className={styles.emptyState}>
                  <Text type="secondary">暂无调研信息</Text>
                </div>
              )}
            </div>
          </TabPane>

          {/* 盈利测算 */}
          <TabPane key="calculation" title="盈利测算">
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <Title heading={5}>盈利测算</Title>
                {followUp.survey_data && !followUp.profit_calculation && !followUp.is_abandoned && (
                  <PermissionGuard permission="expansion.followup.calculate">
                    <Button
                      type="primary"
                      icon={<IconEdit />}
                      onClick={() => setBusinessModalVisible(true)}
                    >
                      执行盈利测算
                    </Button>
                  </PermissionGuard>
                )}
              </div>
              
              {followUp.profit_calculation ? (
                <div>
                  <Row gutter={24}>
                    <Col span={8}>
                      <Statistic
                        title="投资回报率"
                        value={followUp.profit_calculation.roi}
                        suffix="%"
                        precision={2}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="回本周期"
                        value={followUp.profit_calculation.payback_period}
                        suffix="月"
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="贡献率"
                        value={followUp.profit_calculation.contribution_rate}
                        suffix="%"
                        precision={2}
                      />
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <Row gutter={24}>
                    <Col span={12}>
                      <Descriptions
                        title="投资成本"
                        column={1}
                        data={[
                          { label: '租金成本', value: `${followUp.profit_calculation.rent_cost.toLocaleString()}元` },
                          { label: '装修成本', value: `${followUp.profit_calculation.decoration_cost.toLocaleString()}元` },
                          { label: '设备成本', value: `${followUp.profit_calculation.equipment_cost.toLocaleString()}元` },
                          { label: '其他成本', value: `${followUp.profit_calculation.other_cost.toLocaleString()}元` },
                          { label: '总投资', value: `${followUp.profit_calculation.total_investment.toLocaleString()}元` }
                        ]}
                      />
                    </Col>
                    <Col span={12}>
                      <Descriptions
                        title="销售预测"
                        column={1}
                        data={[
                          { label: '日均销售额', value: `${followUp.profit_calculation.daily_sales.toLocaleString()}元` },
                          { label: '月均销售额', value: `${followUp.profit_calculation.monthly_sales.toLocaleString()}元` },
                          { label: '公式版本', value: followUp.profit_calculation.formula_version },
                          { label: '计算时间', value: new Date(followUp.profit_calculation.calculated_at).toLocaleString('zh-CN') }
                        ]}
                      />
                    </Col>
                  </Row>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Text type="secondary">
                    {followUp.survey_data ? '暂无盈利测算数据' : '请先完成调研信息录入'}
                  </Text>
                </div>
              )}
            </div>
          </TabPane>

          {/* 签约信息 */}
          <TabPane key="contract" title="签约信息">
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <Title heading={5}>签约信息</Title>
                {followUp.status === 'signed' && !followUp.contract_info && (
                  <PermissionGuard permission="expansion.followup.contract">
                    <Button
                      type="primary"
                      icon={<IconFile />}
                      onClick={() => setContractModalVisible(true)}
                    >
                      录入签约信息
                    </Button>
                  </PermissionGuard>
                )}
              </div>
              
              {followUp.contract_info ? (
                <div>
                  <Descriptions
                    column={2}
                    data={[
                      { label: '合同编号', value: followUp.contract_info.contract_number || '-' },
                      { label: '签约日期', value: followUp.contract_date || '-' },
                      { label: '合同金额', value: followUp.contract_info.contract_amount ? `${followUp.contract_info.contract_amount.toLocaleString()}元` : '-' },
                      { label: '法人主体', value: followUp.legal_entity?.name || '-' },
                      { label: '租期开始', value: followUp.contract_info.lease_start_date || '-' },
                      { label: '租期结束', value: followUp.contract_info.lease_end_date || '-' },
                      { label: '押金金额', value: followUp.contract_info.deposit_amount ? `${followUp.contract_info.deposit_amount.toLocaleString()}元` : '-' },
                      { label: '备注', value: followUp.contract_info.notes || '-', span: 2 }
                    ]}
                  />
                  
                  {followUp.contract_reminders && followUp.contract_reminders.length > 0 && (
                    <div>
                      <Divider />
                      <Title heading={6}>合同提醒</Title>
                      <Timeline>
                        {followUp.contract_reminders.map((reminder, index) => (
                          <Timeline.Item key={index}>
                            <div>
                              <Text style={{ fontWeight: 'bold' }}>{reminder.type}</Text>
                              <br />
                              <Text type="secondary">{reminder.date}</Text>
                              <br />
                              <Text>{reminder.message}</Text>
                            </div>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Text type="secondary">暂无签约信息</Text>
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 操作按钮 */}
      {!followUp.is_abandoned && (
        <Card className={styles.actions}>
          <Space>
            {followUp.status === 'calculating' && followUp.profit_calculation && (
              <PermissionGuard permission="expansion.followup.approve">
                <Button
                  type="primary"
                  icon={<IconFile />}
                  onClick={handleSubmitApproval}
                >
                  发起报店审批
                </Button>
              </PermissionGuard>
            )}
            
            {followUp.status !== 'signed' && (
              <PermissionGuard permission="expansion.followup.abandon">
                <Button
                  status="danger"
                  icon={<IconClose />}
                  onClick={() => setAbandonModalVisible(true)}
                >
                  放弃跟进
                </Button>
              </PermissionGuard>
            )}
          </Space>
        </Card>
      )}

      {/* 调研信息录入弹窗 */}
      <Modal
        title="录入调研信息"
        visible={surveyModalVisible}
        onCancel={() => setSurveyModalVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <Form
          form={surveyForm}
          layout="vertical"
          onSubmit={handleSubmitSurvey}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="调研日期"
                field="survey_date"
                rules={[{ required: true, message: '请选择调研日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="人流量评估"
                field="foot_traffic"
                rules={[{ required: true, message: '请输入人流量评估' }]}
              >
                <Select placeholder="请选择人流量等级">
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="low">低</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="竞争对手数量"
                field="competitor_count"
              >
                <InputNumber placeholder="请输入竞争对手数量" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="租期(月)"
                field="lease_term"
              >
                <InputNumber placeholder="请输入租期" min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="租金谈判情况"
            field="rent_negotiation"
          >
            <Input.TextArea placeholder="请描述租金谈判情况" rows={3} />
          </Form.Item>
          
          <Form.Item
            label="装修要求"
            field="decoration_requirements"
          >
            <Input.TextArea placeholder="请描述装修要求" rows={3} />
          </Form.Item>
          
          <Form.Item
            label="备注"
            field="notes"
          >
            <Input.TextArea placeholder="其他备注信息" rows={3} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setSurveyModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 盈利测算弹窗 */}
      <Modal
        title="盈利测算"
        visible={businessModalVisible}
        onCancel={() => setBusinessModalVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <Form
          form={businessForm}
          layout="vertical"
          onSubmit={handleCalculateProfit}
        >
          <Title heading={6}>投资成本</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="租金成本(元)"
                field="rent_cost"
                rules={[{ required: true, message: '请输入租金成本' }]}
              >
                <InputNumber placeholder="请输入租金成本" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="装修成本(元)"
                field="decoration_cost"
                rules={[{ required: true, message: '请输入装修成本' }]}
              >
                <InputNumber placeholder="请输入装修成本" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="设备成本(元)"
                field="equipment_cost"
                rules={[{ required: true, message: '请输入设备成本' }]}
              >
                <InputNumber placeholder="请输入设备成本" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="其他成本(元)"
                field="other_cost"
              >
                <InputNumber placeholder="请输入其他成本" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Title heading={6}>销售预测</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="日均销售额(元)"
                field="daily_sales"
                rules={[{ required: true, message: '请输入日均销售额' }]}
              >
                <InputNumber placeholder="请输入日均销售额" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="月均销售额(元)"
                field="monthly_sales"
                rules={[{ required: true, message: '请输入月均销售额' }]}
              >
                <InputNumber placeholder="请输入月均销售额" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                执行测算
              </Button>
              <Button onClick={() => setBusinessModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 签约信息录入弹窗 */}
      <Modal
        title="录入签约信息"
        visible={contractModalVisible}
        onCancel={() => setContractModalVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <Form
          form={contractForm}
          layout="vertical"
          onSubmit={handleSubmitContract}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="合同编号"
                field="contract_number"
                rules={[{ required: true, message: '请输入合同编号' }]}
              >
                <Input placeholder="请输入合同编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="签约日期"
                field="contract_date"
                rules={[{ required: true, message: '请选择签约日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="合同金额(元)"
                field="contract_amount"
                rules={[{ required: true, message: '请输入合同金额' }]}
              >
                <InputNumber placeholder="请输入合同金额" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="法人主体"
                field="legal_entity_id"
                rules={[{ required: true, message: '请选择法人主体' }]}
              >
                <Select placeholder="请选择法人主体">
                  {legalEntities.map(entity => (
                    <Select.Option key={entity.id} value={entity.id}>
                      {entity.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="租期开始"
                field="lease_start_date"
                rules={[{ required: true, message: '请选择租期开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="租期结束"
                field="lease_end_date"
                rules={[{ required: true, message: '请选择租期结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="押金金额(元)"
            field="deposit_amount"
          >
            <InputNumber placeholder="请输入押金金额" min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="备注"
            field="contract_notes"
          >
            <Input.TextArea placeholder="合同备注信息" rows={3} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setContractModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 放弃跟进弹窗 */}
      <Modal
        title="放弃跟进"
        visible={abandonModalVisible}
        onCancel={() => setAbandonModalVisible(false)}
        footer={null}
      >
        <Form
          form={abandonForm}
          layout="vertical"
          onSubmit={handleAbandonFollowUp}
        >
          <Form.Item
            label="放弃原因"
            field="abandon_reason"
            rules={[{ required: true, message: '请输入放弃原因' }]}
          >
            <Input.TextArea
              placeholder="请详细说明放弃跟进的原因"
              rows={4}
              showWordLimit
              maxLength={500}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" status="danger">
                确认放弃
              </Button>
              <Button onClick={() => setAbandonModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FollowUpDetail