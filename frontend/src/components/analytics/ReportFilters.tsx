/**
 * 报表数据筛选组件 - 多维度筛选
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Grid,
  Select,
  DatePicker,
  Button,
  Space,
  Collapse,
  Checkbox,
  InputNumber,
  Typography,
  Divider,
  Tag,
  Tooltip
} from '@arco-design/web-react'
import {
  IconFilter,
  IconRefresh,
  IconDown,
  IconUp,
  IconClose
} from '@arco-design/web-react/icon'
import type { ReportFilters as ReportFiltersType } from '../../api/reportService'
import styles from './ReportFilters.module.css'

const { Row, Col } = Grid
const { RangePicker } = DatePicker
const { Text } = Typography
const { Option } = Select

// 筛选选项接口
export interface FilterOptions {
  regions: Array<{ id: number; name: string }>
  storeTypes: Array<{ code: string; name: string }>
  statuses: Array<{ code: string; name: string }>
  contributionTypes: Array<{ code: string; name: string }>
  businessRegions: Array<{ id: number; name: string }>
}

// 组件属性
export interface ReportFiltersProps {
  filters: ReportFiltersType
  options: FilterOptions
  loading?: boolean
  collapsed?: boolean
  showAdvanced?: boolean
  onFiltersChange: (filters: ReportFiltersType) => void
  onReset: () => void
  onCollapse?: (collapsed: boolean) => void
}

// 预设时间范围
const TIME_PRESETS = [
  {
    label: '今天',
    value: () => {
      const today = new Date()
      return [today, today]
    }
  },
  {
    label: '昨天',
    value: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return [yesterday, yesterday]
    }
  },
  {
    label: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    label: '最近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    }
  },
  {
    label: '本月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return [start, end]
    }
  },
  {
    label: '上月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [start, end]
    }
  },
  {
    label: '本季度',
    value: () => {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), quarter * 3, 1)
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      return [start, end]
    }
  },
  {
    label: '本年',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31)
      return [start, end]
    }
  }
]

/**
 * 报表筛选组件
 */
const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  options,
  loading = false,
  collapsed = false,
  showAdvanced = true,
  onFiltersChange,
  onReset,
  onCollapse
}) => {
  const [form] = Form.useForm()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // 同步表单值
  useEffect(() => {
    form.setFieldsValue({
      dateRange: filters.dateRange ? [
        new Date(filters.dateRange.startDate),
        new Date(filters.dateRange.endDate)
      ] : undefined,
      regions: filters.regions,
      storeTypes: filters.storeTypes,
      statuses: filters.statuses,
      contributionTypes: filters.contributionTypes,
      businessRegions: filters.businessRegions
    })
  }, [filters, form])

  // 计算活跃筛选条件数量
  useEffect(() => {
    let count = 0
    if (filters.dateRange) count++
    if (filters.regions?.length) count++
    if (filters.storeTypes?.length) count++
    if (filters.statuses?.length) count++
    if (filters.contributionTypes?.length) count++
    if (filters.businessRegions?.length) count++
    setActiveFiltersCount(count)
  }, [filters])

  /**
   * 处理筛选条件变化
   */
  const handleFiltersChange = (_changedFields: any, allFields: any) => {
    const newFilters: ReportFiltersType = {}

    // 处理日期范围
    if (allFields.dateRange && allFields.dateRange.length === 2) {
      newFilters.dateRange = {
        startDate: allFields.dateRange[0].toISOString().split('T')[0],
        endDate: allFields.dateRange[1].toISOString().split('T')[0]
      }
    }

    // 处理其他筛选条件
    if (allFields.regions?.length) {
      newFilters.regions = allFields.regions
    }
    if (allFields.storeTypes?.length) {
      newFilters.storeTypes = allFields.storeTypes
    }
    if (allFields.statuses?.length) {
      newFilters.statuses = allFields.statuses
    }
    if (allFields.contributionTypes?.length) {
      newFilters.contributionTypes = allFields.contributionTypes
    }
    if (allFields.businessRegions?.length) {
      newFilters.businessRegions = allFields.businessRegions
    }

    onFiltersChange(newFilters)
  }

  /**
   * 重置筛选条件
   */
  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  /**
   * 切换折叠状态
   */
  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapse?.(newCollapsed)
  }

  /**
   * 快速选择时间范围
   */
  const handleTimePresetClick = (preset: typeof TIME_PRESETS[0]) => {
    const [start, end] = preset.value()
    form.setFieldValue('dateRange', [start, end])
    
    const newFilters = {
      ...filters,
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    }
    onFiltersChange(newFilters)
  }

  /**
   * 移除单个筛选条件
   */
  const handleRemoveFilter = (filterKey: keyof ReportFiltersType, value?: any) => {
    const newFilters = { ...filters }
    
    if (filterKey === 'dateRange') {
      delete newFilters.dateRange
      form.setFieldValue('dateRange', undefined)
    } else if (value !== undefined) {
      // 移除数组中的特定值
      const currentValues = newFilters[filterKey] as any[]
      if (currentValues) {
        const newValues = currentValues.filter(v => v !== value)
        if (newValues.length === 0) {
          delete newFilters[filterKey]
        } else {
          (newFilters as any)[filterKey] = newValues
        }
        form.setFieldValue(filterKey, newValues.length > 0 ? newValues : undefined)
      }
    } else {
      // 移除整个筛选条件
      delete newFilters[filterKey]
      form.setFieldValue(filterKey, undefined)
    }
    
    onFiltersChange(newFilters)
  }

  /**
   * 渲染活跃筛选标签
   */
  const renderActiveFilters = () => {
    const tags: React.ReactNode[] = []

    // 日期范围标签
    if (filters.dateRange) {
      tags.push(
        <Tag
          key="dateRange"
          closable
          onClose={() => handleRemoveFilter('dateRange')}
          className={styles.filterTag}
        >
          时间: {filters.dateRange.startDate} ~ {filters.dateRange.endDate}
        </Tag>
      )
    }

    // 区域标签
    filters.regions?.forEach(regionId => {
      const region = options.regions.find(r => r.id === regionId)
      if (region) {
        tags.push(
          <Tag
            key={`region-${regionId}`}
            closable
            onClose={() => handleRemoveFilter('regions', regionId)}
            className={styles.filterTag}
          >
            区域: {region.name}
          </Tag>
        )
      }
    })

    // 门店类型标签
    filters.storeTypes?.forEach(typeCode => {
      const storeType = options.storeTypes.find(t => t.code === typeCode)
      if (storeType) {
        tags.push(
          <Tag
            key={`storeType-${typeCode}`}
            closable
            onClose={() => handleRemoveFilter('storeTypes', typeCode)}
            className={styles.filterTag}
          >
            类型: {storeType.name}
          </Tag>
        )
      }
    })

    // 状态标签
    filters.statuses?.forEach(statusCode => {
      const status = options.statuses.find(s => s.code === statusCode)
      if (status) {
        tags.push(
          <Tag
            key={`status-${statusCode}`}
            closable
            onClose={() => handleRemoveFilter('statuses', statusCode)}
            className={styles.filterTag}
          >
            状态: {status.name}
          </Tag>
        )
      }
    })

    return tags.length > 0 ? (
      <div className={styles.activeFilters}>
        <Text className={styles.activeFiltersLabel}>当前筛选:</Text>
        <Space wrap>{tags}</Space>
        <Button
          type="text"
          size="small"
          onClick={handleReset}
          className={styles.clearAllButton}
        >
          清空全部
        </Button>
      </div>
    ) : null
  }

  /**
   * 渲染时间预设按钮
   */
  const renderTimePresets = () => (
    <div className={styles.timePresets}>
      <Text className={styles.presetsLabel}>快速选择:</Text>
      <Space wrap>
        {TIME_PRESETS.map(preset => (
          <Button
            key={preset.label}
            size="small"
            type="text"
            onClick={() => handleTimePresetClick(preset)}
            className={styles.presetButton}
          >
            {preset.label}
          </Button>
        ))}
      </Space>
    </div>
  )

  return (
    <Card className={styles.filtersCard}>
      {/* 筛选器头部 */}
      <div className={styles.filtersHeader}>
        <div className={styles.headerLeft}>
          <Space>
            <IconFilter />
            <Text className={styles.title}>数据筛选</Text>
            {activeFiltersCount > 0 && (
              <Tag color="blue" size="small">
                {activeFiltersCount} 个筛选条件
              </Tag>
            )}
          </Space>
        </div>
        
        <div className={styles.headerRight}>
          <Space>
            <Button
              type="text"
              size="small"
              icon={<IconRefresh />}
              onClick={handleReset}
              disabled={loading}
            >
              重置
            </Button>
            <Button
              type="text"
              size="small"
              icon={isCollapsed ? <IconDown /> : <IconUp />}
              onClick={handleToggleCollapse}
            >
              {isCollapsed ? '展开' : '收起'}
            </Button>
          </Space>
        </div>
      </div>

      {/* 活跃筛选标签 */}
      {!isCollapsed && renderActiveFilters()}

      {/* 筛选表单 */}
      {!isCollapsed && (
        <div className={styles.filtersContent}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFiltersChange}
            disabled={loading}
          >
            {/* 基础筛选 */}
            <div className={styles.basicFilters}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="时间范围" field="dateRange">
                    <RangePicker
                      style={{ width: '100%' }}
                      placeholder={['开始日期', '结束日期']}
                      allowClear
                    />
                  </Form.Item>
                  {renderTimePresets()}
                </Col>
                
                <Col span={8}>
                  <Form.Item label="业务区域" field="regions">
                    <Select
                      placeholder="请选择区域"
                      mode="multiple"
                      allowClear
                      maxTagCount={2}
                    >
                      {options.regions.map(region => (
                        <Option key={region.id} value={region.id}>
                          {region.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item label="门店类型" field="storeTypes">
                    <Select
                      placeholder="请选择类型"
                      mode="multiple"
                      allowClear
                      maxTagCount={2}
                    >
                      {options.storeTypes.map(type => (
                        <Option key={type.code} value={type.code}>
                          {type.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 高级筛选 */}
            {showAdvanced && (
              <Collapse className={styles.advancedFilters}>
                <Collapse.Item key="advanced" header="高级筛选">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="状态" field="statuses">
                        <Select
                          placeholder="请选择状态"
                          mode="multiple"
                          allowClear
                          maxTagCount={2}
                        >
                          {options.statuses.map(status => (
                            <Option key={status.code} value={status.code}>
                              {status.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item label="贡献率类型" field="contributionTypes">
                        <Select
                          placeholder="请选择贡献率类型"
                          mode="multiple"
                          allowClear
                          maxTagCount={2}
                        >
                          {options.contributionTypes.map(type => (
                            <Option key={type.code} value={type.code}>
                              {type.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item label="经营区域" field="businessRegions">
                        <Select
                          placeholder="请选择经营区域"
                          mode="multiple"
                          allowClear
                          maxTagCount={2}
                        >
                          {options.businessRegions.map(region => (
                            <Option key={region.id} value={region.id}>
                              {region.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Collapse.Item>
              </Collapse>
            )}
          </Form>
        </div>
      )}
    </Card>
  )
}

export default ReportFilters