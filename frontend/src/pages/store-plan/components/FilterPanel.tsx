import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Collapse,
  Tag,
  Checkbox,
  Slider,
  AutoComplete
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { useStorePlanStore } from '@/stores/storePlanStore'
import type { StorePlan, StorePlanQueryParams } from '@/services/types'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker
const { Panel } = Collapse
const { Search } = Input

interface FilterPanelProps {
  onFilter?: (params: StorePlanQueryParams) => void
  showSaveFilter?: boolean
  compact?: boolean
}

interface FilterFormValues {
  keyword?: string
  name?: string
  type?: StorePlan['type'][]
  status?: StorePlan['status'][]
  priority?: StorePlan['priority'][]
  regionId?: string[]
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
  budgetRange?: [number, number]
  createdBy?: string
  responsibleUser?: string
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilter,
  showSaveFilter = false,
  compact = false
}) => {
  const [form] = Form.useForm<FilterFormValues>()
  const [collapsed, setCollapsed] = useState(compact)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
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

  const typeOptions = [
    { label: '直营', value: 'direct', color: 'blue' },
    { label: '加盟', value: 'franchise', color: 'green' },
    { label: '合营', value: 'joint_venture', color: 'orange' }
  ]

  const statusOptions = [
    { label: '草稿', value: 'draft', color: 'default' },
    { label: '待审批', value: 'pending', color: 'processing' },
    { label: '已批准', value: 'approved', color: 'success' },
    { label: '进行中', value: 'in_progress', color: 'warning' },
    { label: '已完成', value: 'completed', color: 'success' },
    { label: '已取消', value: 'cancelled', color: 'error' }
  ]

  const priorityOptions = [
    { label: '低', value: 'low', color: 'default' },
    { label: '中', value: 'medium', color: 'blue' },
    { label: '高', value: 'high', color: 'orange' },
    { label: '紧急', value: 'urgent', color: 'red' }
  ]

  // 保存的筛选条件
  const savedFilters = [
    { name: '我的待审批', params: { status: ['pending'], createdBy: 'current_user' } },
    { name: '进行中项目', params: { status: ['in_progress'] } },
    { name: '本月到期', params: { dateRange: [dayjs().startOf('month'), dayjs().endOf('month')] } },
    { name: '高优先级', params: { priority: ['high', 'urgent'] } }
  ]

  const handleSubmit = (values: FilterFormValues) => {
    const params: StorePlanQueryParams = {
      page: 1,
      pageSize: 10
    }

    // 处理关键词搜索
    if (values.keyword?.trim()) {
      params.keyword = values.keyword.trim()
    }

    // 处理具体字段
    if (values.name?.trim()) {
      params.name = values.name.trim()
    }

    if (values.type && values.type.length > 0) {
      params.type = values.type[0] // API可能只支持单选，根据实际情况调整
    }

    if (values.status && values.status.length > 0) {
      params.status = values.status[0] // API可能只支持单选，根据实际情况调整
    }

    if (values.priority && values.priority.length > 0) {
      params.priority = values.priority[0] // API可能只支持单选，根据实际情况调整
    }

    if (values.regionId && values.regionId.length > 0) {
      params.regionId = values.regionId[0] // API可能只支持单选，根据实际情况调整
    }

    // 处理日期范围
    if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }

    // 处理负责人
    if (values.createdBy?.trim()) {
      params.createdBy = values.createdBy.trim()
    }

    onFilter?.(params)
    
    // 更新激活的筛选器
    updateActiveFilters(values)
  }

  const handleReset = () => {
    form.resetFields()
    setActiveFilters([])
    onFilter?.({ page: 1, pageSize: 10 })
  }

  const handleQuickFilter = (filterParams: any) => {
    form.setFieldsValue(filterParams)
    handleSubmit(filterParams)
  }

  const updateActiveFilters = (values: FilterFormValues) => {
    const active = []
    
    if (values.keyword) active.push('关键词')
    if (values.name) active.push('计划名称')
    if (values.type && values.type.length > 0) active.push('门店类型')
    if (values.status && values.status.length > 0) active.push('状态')
    if (values.priority && values.priority.length > 0) active.push('优先级')
    if (values.regionId && values.regionId.length > 0) active.push('大区')
    if (values.dateRange) active.push('日期范围')
    if (values.budgetRange) active.push('预算范围')
    if (values.createdBy) active.push('创建人')

    setActiveFilters(active)
  }

  // 渲染快速筛选标签
  const renderQuickFilters = () => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
        快速筛选:
      </div>
      <Space wrap>
        {savedFilters.map((filter, index) => (
          <Tag.CheckableTag
            key={index}
            onChange={() => handleQuickFilter(filter.params)}
          >
            {filter.name}
          </Tag.CheckableTag>
        ))}
      </Space>
    </div>
  )

  // 渲染激活的筛选器
  const renderActiveFilters = () => {
    if (activeFilters.length === 0) return null

    return (
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <span style={{ color: '#666' }}>已启用筛选:</span>
          {activeFilters.map((filter, index) => (
            <Tag key={index} color="blue" closable={false}>
              {filter}
            </Tag>
          ))}
          <Button type="link" size="small" onClick={handleReset}>
            清除全部
          </Button>
        </Space>
      </div>
    )
  }

  // 渲染基础筛选表单
  const renderBasicForm = () => (
    <Row gutter={16}>
      <Col span={compact ? 12 : 8}>
        <Form.Item name="keyword" label={compact ? '' : '关键词搜索'}>
          <Search
            placeholder="搜索计划名称、地区、负责人"
            allowClear
            onSearch={() => form.submit()}
            enterButton={<SearchOutlined />}
          />
        </Form.Item>
      </Col>
      <Col span={compact ? 6 : 4}>
        <Form.Item name="type" label={compact ? '' : '门店类型'}>
          <Select
            placeholder="门店类型"
            allowClear
            mode="multiple"
            maxTagCount={1}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
          >
            {typeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={compact ? 6 : 4}>
        <Form.Item name="status" label={compact ? '' : '状态'}>
          <Select
            placeholder="状态"
            allowClear
            mode="multiple"
            maxTagCount={1}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
          >
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      {!compact && (
        <Col span={8}>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset} icon={<ClearOutlined />}>
                重置
              </Button>
              <Button
                type="dashed"
                icon={collapsed ? <DownOutlined /> : <UpOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? '更多筛选' : '收起'}
              </Button>
            </Space>
          </Form.Item>
        </Col>
      )}
    </Row>
  )

  // 渲染高级筛选表单
  const renderAdvancedForm = () => {
    if (collapsed && !compact) return null

    return (
      <>
        <Divider />
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="priority" label="优先级">
              <Checkbox.Group options={priorityOptions.map(opt => ({ 
                label: opt.label, 
                value: opt.value 
              }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="regionId" label="所属大区">
              <Select
                placeholder="请选择大区"
                allowClear
                mode="multiple"
                options={regionOptions}
                maxTagCount={2}
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dateRange" label="目标日期">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="budgetRange" label="预算范围(万元)">
              <Slider
                range
                min={0}
                max={1000}
                marks={{
                  0: '0',
                  200: '200',
                  500: '500',
                  1000: '1000+'
                }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="createdBy" label="创建人">
              <AutoComplete
                placeholder="输入创建人姓名"
                options={userOptions}
                filterOption={(inputValue, option) =>
                  (option?.label ?? '').toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="responsibleUser" label="负责人">
              <AutoComplete
                placeholder="输入负责人姓名"
                options={userOptions}
                filterOption={(inputValue, option) =>
                  (option?.label ?? '').toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {compact && (
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Space style={{ float: 'right' }}>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ClearOutlined />}>
                  重置
                </Button>
                {showSaveFilter && (
                  <Button icon={<SaveOutlined />}>
                    保存筛选
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </>
    )
  }

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          筛选条件
          {activeFilters.length > 0 && (
            <Tag color="blue">{activeFilters.length}</Tag>
          )}
        </Space>
      }
      size="small"
    >
      {!compact && renderQuickFilters()}
      {renderActiveFilters()}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {renderBasicForm()}
        {renderAdvancedForm()}
      </Form>
    </Card>
  )
}

export default FilterPanel