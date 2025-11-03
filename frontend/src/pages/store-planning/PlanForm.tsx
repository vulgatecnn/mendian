/**
 * 开店计划创建/编辑表单页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Message,
  Typography,
  Divider,
  InputNumber,
  Table,
  Modal
} from '@arco-design/web-react'
import {
  IconPlus,
  IconDelete,
  IconSave,
  IconClose
} from '@arco-design/web-react/icon'
import { useNavigate, useParams } from 'react-router-dom'
import { PlanService } from '../../api'
import {
  StorePlanFormData,
  BusinessRegion,
  StoreType
} from '../../types'
import styles from './PlanForm.module.css'

const { Title } = Typography
const { RangePicker } = DatePicker
const FormItem = Form.Item

// 区域计划表单数据
interface RegionalPlanFormData {
  key: string
  region_id?: number
  store_type_id?: number
  target_count?: number
  contribution_rate?: number
  budget_amount?: number
}

const PlanForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  // 基础数据
  const [regions, setRegions] = useState<BusinessRegion[]>([])
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([])
  
  // 区域计划列表
  const [regionalPlans, setRegionalPlans] = useState<RegionalPlanFormData[]>([])
  const [regionalPlanCounter, setRegionalPlanCounter] = useState(0)

  // 加载基础数据
  const loadBaseData = async () => {
    try {
      // 这里应该调用实际的API获取区域和门店类型
      // 暂时使用模拟数据
      const mockRegions: BusinessRegion[] = [
        { id: 1, name: '华东区', code: 'HD', description: '', is_active: true, created_at: '', updated_at: '' },
        { id: 2, name: '华南区', code: 'HN', description: '', is_active: true, created_at: '', updated_at: '' },
        { id: 3, name: '华北区', code: 'HB', description: '', is_active: true, created_at: '', updated_at: '' }
      ]
      
      const mockStoreTypes: StoreType[] = [
        { id: 1, name: '直营店', code: 'ZY', description: '', is_active: true, created_at: '', updated_at: '' },
        { id: 2, name: '加盟店', code: 'JM', description: '', is_active: true, created_at: '', updated_at: '' },
        { id: 3, name: '旗舰店', code: 'QJ', description: '', is_active: true, created_at: '', updated_at: '' }
      ]
      
      setRegions(mockRegions)
      setStoreTypes(mockStoreTypes)
    } catch (error: any) {
      Message.error('加载基础数据失败')
    }
  }

  // 加载计划详情（编辑模式）
  const loadPlanDetail = async (planId: string) => {
    try {
      setLoading(true)
      const plan = await PlanService.getPlanDetail(parseInt(planId))
      
      // 设置表单值
      form.setFieldsValue({
        name: plan.name,
        plan_type: plan.plan_type,
        date_range: [plan.start_date, plan.end_date],
        description: plan.description
      })
      
      // 设置区域计划
      const regionalPlanData = plan.regional_plans.map((rp, index) => ({
        key: `regional-plan-${index}`,
        region_id: rp.region_id,
        store_type_id: rp.store_type_id,
        target_count: rp.target_count,
        contribution_rate: rp.contribution_rate,
        budget_amount: rp.budget_amount
      }))
      
      setRegionalPlans(regionalPlanData)
      setRegionalPlanCounter(regionalPlanData.length)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载计划详情失败')
      navigate('/store-planning/plans')
    } finally {
      setLoading(false)
    }
  }

  // 添加区域计划
  const handleAddRegionalPlan = () => {
    const newPlan: RegionalPlanFormData = {
      key: `regional-plan-${regionalPlanCounter}`
    }
    setRegionalPlans([...regionalPlans, newPlan])
    setRegionalPlanCounter(regionalPlanCounter + 1)
  }

  // 删除区域计划
  const handleDeleteRegionalPlan = (key: string) => {
    setRegionalPlans(regionalPlans.filter(plan => plan.key !== key))
  }

  // 更新区域计划
  const handleUpdateRegionalPlan = (key: string, field: string, value: any) => {
    setRegionalPlans(regionalPlans.map(plan => 
      plan.key === key ? { ...plan, [field]: value } : plan
    ))
  }

  // 计算总目标数量和总预算
  const calculateTotals = () => {
    const totalTarget = regionalPlans.reduce((sum, plan) => sum + (plan.target_count || 0), 0)
    const totalBudget = regionalPlans.reduce((sum, plan) => sum + (plan.budget_amount || 0), 0)
    const totalContribution = regionalPlans.reduce((sum, plan) => sum + (plan.contribution_rate || 0), 0)
    
    return { totalTarget, totalBudget, totalContribution }
  }

  // 表单提交
  const handleSubmit = async () => {
    try {
      // 验证基本信息
      await form.validate()
      
      // 验证区域计划
      if (regionalPlans.length === 0) {
        Message.error('请至少添加一个区域计划')
        return
      }
      
      // 验证区域计划完整性
      for (const plan of regionalPlans) {
        if (!plan.region_id || !plan.store_type_id || !plan.target_count) {
          Message.error('请完善所有区域计划的必填信息')
          return
        }
      }
      
      // 验证贡献率总和
      const { totalContribution } = calculateTotals()
      if (totalContribution > 100) {
        Modal.warning({
          title: '贡献率警告',
          content: `区域计划总贡献率为 ${totalContribution.toFixed(1)}%，超过了100%，建议调整`
        })
      }
      
      // 构建提交数据
      const formValues = form.getFieldsValue()
      const submitData: StorePlanFormData = {
        name: formValues.name,
        plan_type: formValues.plan_type,
        start_date: formValues.date_range[0],
        end_date: formValues.date_range[1],
        description: formValues.description || '',
        regional_plans: regionalPlans.map(plan => ({
          region_id: plan.region_id!,
          store_type_id: plan.store_type_id!,
          target_count: plan.target_count!,
          contribution_rate: plan.contribution_rate || 0,
          budget_amount: plan.budget_amount || 0
        }))
      }
      
      setSubmitLoading(true)
      
      if (isEdit) {
        await PlanService.updatePlan(parseInt(id!), submitData)
        Message.success('更新计划成功')
      } else {
        await PlanService.createPlan(submitData)
        Message.success('创建计划成功')
      }
      
      navigate('/store-planning/plans')
    } catch (error: any) {
      if (error?.response?.data?.message) {
        Message.error(error.response.data.message)
      } else if (error?.message) {
        // 表单验证错误
        Message.error('请检查表单填写是否完整')
      } else {
        Message.error(isEdit ? '更新计划失败' : '创建计划失败')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  // 区域计划表格列配置
  const regionalPlanColumns = [
    {
      title: '经营区域 *',
      dataIndex: 'region_id',
      width: 150,
      render: (_: any, record: RegionalPlanFormData) => (
        <Select
          placeholder="选择区域"
          value={record.region_id}
          onChange={(value) => handleUpdateRegionalPlan(record.key, 'region_id', value)}
          style={{ width: '100%' }}
        >
          {regions.map(region => (
            <Select.Option key={region.id} value={region.id}>
              {region.name}
            </Select.Option>
          ))}
        </Select>
      )
    },
    {
      title: '门店类型 *',
      dataIndex: 'store_type_id',
      width: 150,
      render: (_: any, record: RegionalPlanFormData) => (
        <Select
          placeholder="选择类型"
          value={record.store_type_id}
          onChange={(value) => handleUpdateRegionalPlan(record.key, 'store_type_id', value)}
          style={{ width: '100%' }}
        >
          {storeTypes.map(type => (
            <Select.Option key={type.id} value={type.id}>
              {type.name}
            </Select.Option>
          ))}
        </Select>
      )
    },
    {
      title: '目标数量 *',
      dataIndex: 'target_count',
      width: 120,
      render: (_: any, record: RegionalPlanFormData) => (
        <InputNumber
          placeholder="目标数量"
          value={record.target_count}
          onChange={(value) => handleUpdateRegionalPlan(record.key, 'target_count', value)}
          min={1}
          precision={0}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '贡献率 (%)',
      dataIndex: 'contribution_rate',
      width: 120,
      render: (_: any, record: RegionalPlanFormData) => (
        <InputNumber
          placeholder="贡献率"
          value={record.contribution_rate}
          onChange={(value) => handleUpdateRegionalPlan(record.key, 'contribution_rate', value)}
          min={0}
          max={100}
          precision={2}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '预算金额 (元)',
      dataIndex: 'budget_amount',
      width: 150,
      render: (_: any, record: RegionalPlanFormData) => (
        <InputNumber
          placeholder="预算金额"
          value={record.budget_amount}
          onChange={(value) => handleUpdateRegionalPlan(record.key, 'budget_amount', value)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '操作',
      dataIndex: 'actions',
      width: 80,
      render: (_: any, record: RegionalPlanFormData) => (
        <Button
          type="text"
          status="danger"
          size="small"
          icon={<IconDelete />}
          onClick={() => handleDeleteRegionalPlan(record.key)}
        >
          删除
        </Button>
      )
    }
  ]

  // 初始化
  useEffect(() => {
    loadBaseData()
    
    if (isEdit && id) {
      loadPlanDetail(id)
    }
  }, [id])

  const { totalTarget, totalBudget, totalContribution } = calculateTotals()

  return (
    <div className={styles.container}>
      <Card loading={loading}>
        <div className={styles.header}>
          <Title heading={3}>
            {isEdit ? '编辑开店计划' : '新建开店计划'}
          </Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          {/* 基本信息 */}
          <Title heading={5}>基本信息</Title>
          <Divider />
          
          <FormItem
            label="计划名称"
            field="name"
            rules={[
              { required: true, message: '请输入计划名称' },
              { maxLength: 200, message: '计划名称不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入计划名称" />
          </FormItem>

          <FormItem
            label="计划类型"
            field="plan_type"
            rules={[{ required: true, message: '请选择计划类型' }]}
          >
            <Select placeholder="请选择计划类型">
              <Select.Option value="annual">年度计划</Select.Option>
              <Select.Option value="quarterly">季度计划</Select.Option>
            </Select>
          </FormItem>

          <FormItem
            label="计划周期"
            field="date_range"
            rules={[{ required: true, message: '请选择计划周期' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </FormItem>

          <FormItem
            label="计划描述"
            field="description"
          >
            <Input.TextArea
              placeholder="请输入计划描述"
              rows={4}
              maxLength={1000}
              showWordLimit
            />
          </FormItem>

          {/* 区域计划 */}
          <div style={{ marginTop: 32 }}>
            <div className={styles.sectionHeader}>
              <Title heading={5}>区域计划</Title>
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={handleAddRegionalPlan}
              >
                添加区域计划
              </Button>
            </div>
            <Divider />

            <Table
              columns={regionalPlanColumns}
              data={regionalPlans}
              pagination={false}
              rowKey="key"
              noDataElement={
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  暂无区域计划，请点击"添加区域计划"按钮添加
                </div>
              }
            />

            {/* 统计信息 */}
            {regionalPlans.length > 0 && (
              <div className={styles.summary}>
                <Space size="large">
                  <span>总目标数量: <strong>{totalTarget}</strong> 家</span>
                  <span>总预算金额: <strong>{totalBudget.toLocaleString()}</strong> 元</span>
                  <span>
                    总贡献率: 
                    <strong style={{ color: totalContribution > 100 ? '#f53f3f' : '#00b42a' }}>
                      {totalContribution.toFixed(1)}%
                    </strong>
                    {totalContribution > 100 && <span style={{ color: '#f53f3f' }}> (超过100%)</span>}
                  </span>
                </Space>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<IconSave />}
                loading={submitLoading}
                onClick={handleSubmit}
              >
                {isEdit ? '保存' : '创建'}
              </Button>
              <Button
                size="large"
                icon={<IconClose />}
                onClick={() => navigate('/store-planning/plans')}
              >
                取消
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default PlanForm
