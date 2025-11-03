/**
 * 盈利测算公式配置页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  InputNumber,
  Button,
  Space,
  Message,
  Typography,
  Grid,
  Divider,
  Alert,
  Table,
  Tag,
  Modal
} from '@arco-design/web-react'
import {
  IconSave,
  IconRefresh,
  IconHistory,
  IconInfo
} from '@arco-design/web-react/icon'
import { ExpansionService } from '../../api'
import { ProfitFormulaConfig } from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import styles from './ProfitFormulaConfig.module.css'

const { Title, Text, Paragraph } = Typography
const { Row, Col } = Grid

const ProfitFormulaConfigPage: React.FC = () => {
  // 状态管理
  const [form] = Form.useForm()
  const [, setConfigLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<ProfitFormulaConfig | null>(null)
  const [historyConfigs, setHistoryConfigs] = useState<ProfitFormulaConfig[]>([])
  const [historyModalVisible, setHistoryModalVisible] = useState(false)

  // 加载当前配置
  const loadCurrentConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await ExpansionService.getProfitFormulas()
      const activeConfig = response.find(config => config.is_active)
      
      if (activeConfig) {
        setCurrentConfig(activeConfig)
        form.setFieldsValue({
          cost_rate: activeConfig.params.cost_rate * 100, // 转换为百分比显示
          expense_rate: activeConfig.params.expense_rate * 100,
          tax_rate: activeConfig.params.tax_rate * 100,
          management_fee_rate: activeConfig.params.management_fee_rate * 100,
          profit_margin: activeConfig.params.profit_margin * 100,
          depreciation_rate: activeConfig.params.depreciation_rate * 100
        })
      }
      
      setHistoryConfigs(response.filter(config => !config.is_active))
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载配置失败')
    } finally {
      setConfigLoading(false)
    }
  }

  // 保存配置
  const handleSave = async (values: any) => {
    try {
      setSaveLoading(true)
      
      // 转换百分比为小数
      const params = {
        cost_rate: values.cost_rate / 100,
        expense_rate: values.expense_rate / 100,
        tax_rate: values.tax_rate / 100,
        management_fee_rate: values.management_fee_rate / 100,
        profit_margin: values.profit_margin / 100,
        depreciation_rate: values.depreciation_rate / 100
      }
      
      const configData = {
        version: `v${Date.now()}`, // 简单的版本号生成
        params,
        description: `更新于 ${new Date().toLocaleString('zh-CN')}`,
        is_active: true
      }
      
      await ExpansionService.updateProfitFormula(configData)
      Message.success('配置保存成功')
      loadCurrentConfig()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '保存失败')
    } finally {
      setSaveLoading(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    if (currentConfig) {
      form.setFieldsValue({
        cost_rate: currentConfig.params.cost_rate * 100,
        expense_rate: currentConfig.params.expense_rate * 100,
        tax_rate: currentConfig.params.tax_rate * 100,
        management_fee_rate: currentConfig.params.management_fee_rate * 100,
        profit_margin: currentConfig.params.profit_margin * 100,
        depreciation_rate: currentConfig.params.depreciation_rate * 100
      })
    }
  }

  // 历史版本表格列配置
  const historyColumns = [
    {
      title: '版本',
      dataIndex: 'version',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'gray'}>
          {isActive ? '当前' : '历史'}
        </Tag>
      )
    },
    {
      title: '成本率',
      dataIndex: 'params',
      width: 100,
      render: (params: any) => `${(params.cost_rate * 100).toFixed(1)}%`
    },
    {
      title: '费用率',
      dataIndex: 'params',
      width: 100,
      render: (params: any) => `${(params.expense_rate * 100).toFixed(1)}%`
    },
    {
      title: '税率',
      dataIndex: 'params',
      width: 80,
      render: (params: any) => `${(params.tax_rate * 100).toFixed(1)}%`
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN')
    }
  ]

  // 初始加载
  useEffect(() => {
    loadCurrentConfig()
  }, [])

  return (
    <div className={styles.container}>
      <Card>
        {/* 页面标题和操作按钮 */}
        <div className={styles.header}>
          <Title heading={3}>盈利测算公式配置</Title>
          <Space>
            <Button
              icon={<IconHistory />}
              onClick={() => setHistoryModalVisible(true)}
            >
              历史版本
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={loadCurrentConfig}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 说明信息 */}
        <Alert
          type="info"
          icon={<IconInfo />}
          title="配置说明"
          content={
            <div>
              <Paragraph>
                盈利测算公式用于计算门店的预期收益指标，包括投资回报率(ROI)、回本周期和贡献率等。
              </Paragraph>
              <Paragraph>
                <Text style={{ fontWeight: 'bold' }}>计算公式：</Text>
                <br />
                • 月均利润 = 月销售额 × (1 - 成本率 - 费用率 - 税率) - 月租金 - 管理费
                <br />
                • 投资回报率 = (月均利润 × 12) / 总投资 × 100%
                <br />
                • 回本周期 = 总投资 / 月均利润 (月)
                <br />
                • 贡献率 = 月均利润 / 月销售额 × 100%
              </Paragraph>
            </div>
          }
          style={{ marginBottom: 24 }}
        />

        {/* 当前配置信息 */}
        {currentConfig && (
          <Card size="small" className={styles.currentConfig}>
            <Title heading={5}>当前配置版本</Title>
            <Row gutter={16}>
              <Col span={6}>
                <Text type="secondary">版本号：</Text>
                <Text>{currentConfig.version}</Text>
              </Col>
              <Col span={6}>
                <Text type="secondary">更新时间：</Text>
                <Text>{new Date(currentConfig.updated_at).toLocaleString('zh-CN')}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">描述：</Text>
                <Text>{currentConfig.description}</Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* 配置表单 */}
        <PermissionGuard permission="expansion.formula.edit">
          <Card title="参数配置" className={styles.configForm}>
            <Form
              form={form}
              layout="vertical"
              onSubmit={handleSave}
            >
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="成本率 (%)"
                    field="cost_rate"
                    rules={[
                      { required: true, message: '请输入成本率' },
                      { type: 'number', min: 0, max: 100, message: '成本率应在0-100%之间' }
                    ]}
                    extra="商品采购成本占销售额的比例"
                  >
                    <InputNumber
                      placeholder="请输入成本率"
                      precision={1}
                      min={0}
                      max={100}
                      suffix="%"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="费用率 (%)"
                    field="expense_rate"
                    rules={[
                      { required: true, message: '请输入费用率' },
                      { type: 'number', min: 0, max: 100, message: '费用率应在0-100%之间' }
                    ]}
                    extra="运营费用占销售额的比例"
                  >
                    <InputNumber
                      placeholder="请输入费用率"
                      precision={1}
                      min={0}
                      max={100}
                      suffix="%"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="税率 (%)"
                    field="tax_rate"
                    rules={[
                      { required: true, message: '请输入税率' },
                      { type: 'number', min: 0, max: 100, message: '税率应在0-100%之间' }
                    ]}
                    extra="税费占销售额的比例"
                  >
                    <InputNumber
                      placeholder="请输入税率"
                      precision={1}
                      min={0}
                      max={100}
                      suffix="%"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="管理费率 (%)"
                    field="management_fee_rate"
                    rules={[
                      { required: true, message: '请输入管理费率' },
                      { type: 'number', min: 0, max: 100, message: '管理费率应在0-100%之间' }
                    ]}
                    extra="总部管理费占销售额的比例"
                  >
                    <InputNumber
                      placeholder="请输入管理费率"
                      precision={1}
                      min={0}
                      max={100}
                      suffix="%"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="利润率 (%)"
                    field="profit_margin"
                    rules={[
                      { required: true, message: '请输入利润率' },
                      { type: 'number', min: 0, max: 100, message: '利润率应在0-100%之间' }
                    ]}
                    extra="目标利润率"
                  >
                    <InputNumber
                      placeholder="请输入利润率"
                      precision={1}
                      min={0}
                      max={100}
                      suffix="%"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="折旧率 (%)"
                    field="depreciation_rate"
                    rules={[
                      { required: true, message: '请输入折旧率' },
                      { type: 'number', min: 0, max: 100, message: '折旧率应在0-100%之间' }
                    ]}
                    extra="设备折旧占投资的比例"
                  >
                    <InputNumber
                      placeholder="请输入折旧率"
                      precision={1}
                      min={0}
                      max={100}
                      suffix="%"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saveLoading}
                    icon={<IconSave />}
                  >
                    保存配置
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </PermissionGuard>

        {/* 配置预览 */}
        <Card title="配置预览" className={styles.preview}>
          <Alert
            type="warning"
            content="配置修改后将影响所有新创建的盈利测算，已完成的测算不会受到影响。"
            style={{ marginBottom: 16 }}
          />
          
          <div className={styles.previewContent}>
            <Title heading={6}>示例计算</Title>
            <Paragraph>
              假设门店月销售额为 100,000 元，月租金为 10,000 元，总投资为 500,000 元：
            </Paragraph>
            
            <div className={styles.calculation}>
              <Text>月均利润 = 100,000 × (1 - 成本率 - 费用率 - 税率 - 管理费率) - 10,000</Text>
              <br />
              <Text>投资回报率 = (月均利润 × 12) / 500,000 × 100%</Text>
              <br />
              <Text>回本周期 = 500,000 / 月均利润 (月)</Text>
            </div>
          </div>
        </Card>
      </Card>

      {/* 历史版本弹窗 */}
      <Modal
        title="历史版本"
        visible={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        style={{ width: 1000 }}
      >
        <Table
          columns={historyColumns}
          data={[currentConfig, ...historyConfigs].filter(Boolean)}
          pagination={false}
          rowKey="version"
        />
      </Modal>
    </div>
  )
}

export default ProfitFormulaConfigPage