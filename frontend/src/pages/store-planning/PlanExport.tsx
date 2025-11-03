/**
 * 开店计划数据导出页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Button,
  Message,
  DatePicker,
  Select,
  Space,
  Typography,
  Divider,
  Alert,
  Spin
} from '@arco-design/web-react'
import { IconDownload } from '@arco-design/web-react/icon'
import { useImportExportService } from '../../api/importExportService'
import { usePlanService } from '../../api/planService'
import { ExportParams, PlanStatus, BusinessRegion, StoreType } from '../../types'
import styles from './PlanExport.module.css'

const { Title, Paragraph } = Typography
const { RangePicker } = DatePicker
const FormItem = Form.Item

/**
 * 计划状态选项
 */
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '执行中', value: 'executing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

/**
 * 数据导出页面组件
 */
const PlanExport: React.FC = () => {
  const [form] = Form.useForm()
  const { loading: exportLoading, exportAndDownload } = useImportExportService()
  const { getRegions, getStoreTypes } = usePlanService()

  const [regions, setRegions] = useState<BusinessRegion[]>([])
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([])
  const [loadingData, setLoadingData] = useState(false)

  /**
   * 加载基础数据
   */
  useEffect(() => {
    loadBaseData()
  }, [])

  const loadBaseData = async () => {
    setLoadingData(true)
    try {
      const [regionsData, storeTypesData] = await Promise.all([
        getRegions(),
        getStoreTypes()
      ])
      
      if (regionsData) {
        setRegions(regionsData.filter(r => r.is_active))
      }
      if (storeTypesData) {
        setStoreTypes(storeTypesData.filter(t => t.is_active))
      }
    } catch (error) {
      Message.error('加载基础数据失败')
    } finally {
      setLoadingData(false)
    }
  }

  /**
   * 处理导出
   */
  const handleExport = async () => {
    try {
      const values = await form.validate()
      
      // 构建导出参数
      const params: ExportParams = {}
      
      if (values.dateRange && values.dateRange.length === 2) {
        params.start_date = values.dateRange[0]
        params.end_date = values.dateRange[1]
      }
      
      if (values.region_id) {
        params.region_id = values.region_id
      }
      
      if (values.store_type_id) {
        params.store_type_id = values.store_type_id
      }
      
      if (values.status) {
        params.status = values.status as PlanStatus
      }

      // 生成文件名
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `开店计划导出_${timestamp}.xlsx`

      // 执行导出
      await exportAndDownload(params, filename, {
        onSuccess: () => {
          Message.success('导出成功')
        },
        onError: (error) => {
          Message.error(`导出失败：${error.message}`)
        }
      })
    } catch (error) {
      // 表单验证失败
      console.error('表单验证失败:', error)
    }
  }

  /**
   * 重置表单
   */
  const handleReset = () => {
    form.resetFields()
  }

  return (
    <div className={styles.container}>
      <Card>
        <Title heading={4}>数据导出</Title>
        <Paragraph>
          根据筛选条件导出开店计划数据到 Excel 文件。
        </Paragraph>

        <Divider />

        {/* 导出说明 */}
        <Alert
          type="info"
          content={
            <div>
              <div><strong>导出说明：</strong></div>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>可以根据时间范围、区域、门店类型和状态筛选数据</li>
                <li>不设置筛选条件将导出所有计划数据</li>
                <li>导出文件为 Excel 格式（.xlsx）</li>
                <li>导出内容包含计划基本信息和区域计划详情</li>
                <li>大量数据导出可能需要较长时间，请耐心等待</li>
              </ul>
            </div>
          }
          style={{ marginBottom: 24 }}
        />

        <Divider />

        {/* 导出参数配置表单 */}
        <Spin loading={loadingData}>
          <Form
            form={form}
            layout="vertical"
            className={styles.exportForm}
          >
            <FormItem label="时间范围" field="dateRange">
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['开始日期', '结束日期']}
                allowClear
              />
            </FormItem>

            <FormItem label="经营区域" field="region_id">
              <Select
                placeholder="请选择经营区域"
                allowClear
                showSearch
                filterOption={(inputValue, option) =>
                  option.props.children.toLowerCase().includes(inputValue.toLowerCase())
                }
              >
                {regions.map(region => (
                  <Select.Option key={region.id} value={region.id}>
                    {region.name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>

            <FormItem label="门店类型" field="store_type_id">
              <Select
                placeholder="请选择门店类型"
                allowClear
                showSearch
                filterOption={(inputValue, option) =>
                  option.props.children.toLowerCase().includes(inputValue.toLowerCase())
                }
              >
                {storeTypes.map(type => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>

            <FormItem label="计划状态" field="status">
              <Select
                placeholder="请选择计划状态"
                allowClear
              >
                {statusOptions.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>

            <FormItem>
              <Space>
                <Button
                  type="primary"
                  icon={<IconDownload />}
                  onClick={handleExport}
                  loading={exportLoading}
                >
                  导出数据
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </FormItem>
          </Form>
        </Spin>

        {/* 导出进度提示 */}
        {exportLoading && (
          <div className={styles.exportProgress}>
            <Spin />
            <div style={{ marginTop: 16 }}>
              正在导出数据，请稍候...
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default PlanExport
