/**
 * 数据筛选组件
 */
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Typography,
  Grid,
  Collapse
} from '@arco-design/web-react'
import { IconFilter, IconRefresh, IconDown } from '@arco-design/web-react/icon'
import dayjs from 'dayjs'
import type { DataFilters } from '../../api/analyticsService'
import { useBaseDataService } from '../../hooks/useBaseDataService'
import styles from './DataFilters.module.css'

const { RangePicker } = DatePicker
const { Text } = Typography
const { Row, Col } = Grid

interface DataFiltersProps {
  filters?: DataFilters
  onFiltersChange?: (filters: DataFilters) => void
  onReset?: () => void
  loading?: boolean
  className?: string
  collapsed?: boolean
}

/**
 * 数据筛选组件
 */
const DataFilters: React.FC<DataFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  loading = false,
  className,
  collapsed = false
}) => {
  const [form] = Form.useForm()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  
  // 基础数据
  const { 
    regions, 
    storeTypes,
    loading: baseDataLoading 
  } = useBaseDataService()

  // 预设时间范围选项
  const timeRangePresets = [
    {
      label: '最近7天',
      value: () => [dayjs().subtract(7, 'day'), dayjs()]
    },
    {
      label: '最近30天',
      value: () => [dayjs().subtract(30, 'day'), dayjs()]
    },
    {
      label: '最近3个月',
      value: () => [dayjs().subtract(3, 'month'), dayjs()]
    },
    {
      label: '最近6个月',
      value: () => [dayjs().subtract(6, 'month'), dayjs()]
    },
    {
      label: '本年度',
      value: () => [dayjs().startOf('year'), dayjs()]
    },
    {
      label: '上年度',
      value: () => [
        dayjs().subtract(1, 'year').startOf('year'),
        dayjs().subtract(1, 'year').endOf('year')
      ]
    }
  ]

  // 贡献率类型选项
  const contributionTypeOptions = [
    { label: '高贡献率', value: 'high' },
    { label: '中贡献率', value: 'medium' },
    { label: '低贡献率', value: 'low' },
    { label: '战略性', value: 'strategic' }
  ]

  // 初始化表单值
  useEffect(() => {
    if (filters) {
      const formValues: any = {}
      
      if (filters.dateRange) {
        formValues.dateRange = [
          dayjs(filters.dateRange.startDate),
          dayjs(filters.dateRange.endDate)
        ]
      }
      
      if (filters.regionIds) {
        formValues.regionIds = filters.regionIds
      }
      
      if (filters.storeTypes) {
        formValues.storeTypes = filters.storeTypes
      }
      
      if (filters.contributionTypes) {
        formValues.contributionTypes = filters.contributionTypes
      }
      
      form.setFieldsValue(formValues)
    }
  }, [filters, form])

  // 处理筛选变化
  const handleFiltersChange = (_changedFields: any, allFields: any) => {
    if (!onFiltersChange) return

    const newFilters: DataFilters = {}

    // 时间范围
    if (allFields.dateRange && allFields.dateRange.length === 2) {
      newFilters.dateRange = {
        startDate: allFields.dateRange[0].format('YYYY-MM-DD'),
        endDate: allFields.dateRange[1].format('YYYY-MM-DD')
      }
    }

    // 区域
    if (allFields.regionIds && allFields.regionIds.length > 0) {
      newFilters.regionIds = allFields.regionIds
    }

    // 门店类型
    if (allFields.storeTypes && allFields.storeTypes.length > 0) {
      newFilters.storeTypes = allFields.storeTypes
    }

    // 贡献率类型
    if (allFields.contributionTypes && allFields.contributionTypes.length > 0) {
      newFilters.contributionTypes = allFields.contributionTypes
    }

    onFiltersChange(newFilters)
  }

  // 重置筛选
  const handleReset = () => {
    form.resetFields()
    onReset?.()
  }

  // 应用预设时间范围
  const applyTimeRangePreset = (preset: any) => {
    const [startDate, endDate] = preset.value()
    form.setFieldValue('dateRange', [startDate, endDate])
    
    // 触发筛选变化
    const allFields = form.getFieldsValue()
    allFields.dateRange = [startDate, endDate]
    handleFiltersChange({}, allFields)
  }

  // 渲染时间范围预设按钮
  const renderTimeRangePresets = () => (
    <div className={styles.presets}>
      <Text className={styles.presetsLabel}>快速选择:</Text>
      <Space wrap>
        {timeRangePresets.map((preset, index) => (
          <Button
            key={index}
            size="small"
            type="text"
            onClick={() => applyTimeRangePreset(preset)}
            className={styles.presetButton}
          >
            {preset.label}
          </Button>
        ))}
      </Space>
    </div>
  )

  // 渲染筛选表单
  const renderFiltersForm = () => (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleFiltersChange}
      className={styles.form}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="时间范围" field="dateRange">
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              allowClear
            />
          </Form.Item>
          {renderTimeRangePresets()}
        </Col>
        
        <Col span={6}>
          <Form.Item label="业务区域" field="regionIds">
            <Select
              placeholder="选择区域"
              mode="multiple"
              allowClear
              loading={baseDataLoading}
              maxTagCount={2}
            >
              {regions?.map(region => (
                <Select.Option key={region.id} value={region.id}>
                  {region.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={6}>
          <Form.Item label="门店类型" field="storeTypes">
            <Select
              placeholder="选择类型"
              mode="multiple"
              allowClear
              loading={baseDataLoading}
              maxTagCount={2}
            >
              {storeTypes?.map(type => (
                <Select.Option key={type.id} value={type.code}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="贡献率类型" field="contributionTypes">
            <Select
              placeholder="选择贡献率类型"
              mode="multiple"
              allowClear
              maxTagCount={2}
            >
              {contributionTypeOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <div className={styles.actions}>
            <Space>
              <Button
                type="primary"
                icon={<IconFilter />}
                loading={loading}
                onClick={() => {
                  const allFields = form.getFieldsValue()
                  handleFiltersChange({}, allFields)
                }}
              >
                应用筛选
              </Button>
              <Button
                icon={<IconRefresh />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </Form>
  )

  return (
    <Card className={`${styles.filtersCard} ${className || ''}`}>
      <Collapse 
        activeKey={isCollapsed ? [] : ['filters']}
        onChange={(keys) => setIsCollapsed(!keys.includes('filters'))}
        className={styles.collapse}
      >
        <Collapse.Item
          header={
            <div className={styles.header}>
              <Space>
                <IconFilter />
                <Text style={{ fontWeight: 'bold' }}>数据筛选</Text>
              </Space>
              <IconDown 
                className={`${styles.arrow} ${isCollapsed ? styles.collapsed : ''}`}
              />
            </div>
          }
          key="filters"
          showExpandIcon={false}
        >
          {renderFiltersForm()}
        </Collapse.Item>
      </Collapse>
    </Card>
  )
}

export default DataFilters