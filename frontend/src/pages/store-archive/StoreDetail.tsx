/**
 * 门店档案详情页面
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Message,
  Breadcrumb,
  Tabs,
  Tag,
  Timeline,
  Empty,
  Grid,
  Modal,
  Form,
  Select,
  Input
} from '@arco-design/web-react'
import { IconEdit, IconLeft, IconSwap } from '@arco-design/web-react/icon'
import { useNavigate, useParams } from 'react-router-dom'
import type {
  StoreFullInfo,
  StoreStatus,
  StoreTypeCode,
  OperationMode,
  StoreStatusChangeParams
} from '../../types'
import {
  getStoreFullInfo,
  changeStoreStatus
} from '../../api/archiveService'

const TabPane = Tabs.TabPane
const Row = Grid.Row
const Col = Grid.Col
const FormItem = Form.Item
const Option = Select.Option

// 门店状态配置
const STORE_STATUS_CONFIG: Record<StoreStatus, { text: string; color: string }> = {
  preparing: { text: '筹备中', color: 'blue' },
  opening: { text: '开业中', color: 'cyan' },
  operating: { text: '营业中', color: 'green' },
  closed: { text: '已闭店', color: 'gray' },
  cancelled: { text: '已取消', color: 'red' }
}

// 门店类型配置
const STORE_TYPE_CONFIG: Record<StoreTypeCode, string> = {
  direct: '直营店',
  franchise: '加盟店',
  joint: '联营店'
}

// 经营模式配置
const OPERATION_MODE_CONFIG: Record<OperationMode, string> = {
  self_operated: '自营',
  franchised: '加盟',
  joint_venture: '联营'
}

const StoreDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [storeInfo, setStoreInfo] = useState<StoreFullInfo | null>(null)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)

  // 加载门店完整档案
  useEffect(() => {
    if (id) {
      loadStoreInfo()
    }
  }, [id])

  const loadStoreInfo = async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await getStoreFullInfo(Number(id))
      setStoreInfo(response.data)
    } catch (error: any) {
      Message.error(error.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 编辑
  const handleEdit = () => {
    navigate(`/store-archive/${id}/edit`)
  }

  // 返回列表
  const handleBack = () => {
    navigate('/store-archive')
  }

  // 变更状态
  const handleStatusChange = () => {
    setStatusModalVisible(true)
    form.resetFields()
  }

  // 提交状态变更
  const handleStatusSubmit = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue() as StoreStatusChangeParams

      setStatusChanging(true)
      await changeStoreStatus(Number(id), values)
      Message.success('状态变更成功')
      setStatusModalVisible(false)
      loadStoreInfo()
    } catch (error: any) {
      if (error.message) {
        Message.error(error.message || '状态变更失败')
      }
    } finally {
      setStatusChanging(false)
    }
  }

  if (!storeInfo) {
    return null
  }

  const { basic_info, follow_up_info, construction_info } = storeInfo

  return (
    <div style={{ padding: '20px' }}>
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item>门店档案</Breadcrumb.Item>
        <Breadcrumb.Item>档案列表</Breadcrumb.Item>
        <Breadcrumb.Item>档案详情</Breadcrumb.Item>
      </Breadcrumb>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <Space>
          <Button icon={<IconLeft />} onClick={handleBack}>
            返回
          </Button>
          <Button type="primary" icon={<IconEdit />} onClick={handleEdit}>
            编辑
          </Button>
          <Button icon={<IconSwap />} onClick={handleStatusChange}>
            变更状态
          </Button>
        </Space>
      </div>

      {/* Tab 页展示不同信息 */}
      <Tabs defaultActiveTab="basic">
        {/* 基本信息 */}
        <TabPane key="basic" title="基本信息">
          <Card loading={loading}>
            <Descriptions
              column={2}
              data={[
                {
                  label: '门店编码',
                  value: basic_info.store_code
                },
                {
                  label: '门店名称',
                  value: basic_info.store_name
                },
                {
                  label: '门店状态',
                  value: (
                    <Tag color={STORE_STATUS_CONFIG[basic_info.status].color}>
                      {STORE_STATUS_CONFIG[basic_info.status].text}
                    </Tag>
                  )
                },
                {
                  label: '门店类型',
                  value: STORE_TYPE_CONFIG[basic_info.store_type]
                },
                {
                  label: '经营模式',
                  value: OPERATION_MODE_CONFIG[basic_info.operation_mode]
                },
                {
                  label: '业务大区',
                  value: basic_info.business_region?.name || '-'
                },
                {
                  label: '省份',
                  value: basic_info.province
                },
                {
                  label: '城市',
                  value: basic_info.city
                },
                {
                  label: '区县',
                  value: basic_info.district
                },
                {
                  label: '详细地址',
                  value: basic_info.address
                },
                {
                  label: '店长',
                  value: basic_info.store_manager?.full_name || '-'
                },
                {
                  label: '商务负责人',
                  value: basic_info.business_manager?.full_name || '-'
                },
                {
                  label: '开业日期',
                  value: basic_info.opening_date || '-'
                },
                {
                  label: '闭店日期',
                  value: basic_info.closing_date || '-'
                },
                {
                  label: '创建人',
                  value: basic_info.created_by_info?.full_name || '-'
                },
                {
                  label: '创建时间',
                  value: basic_info.created_at
                    ? new Date(basic_info.created_at).toLocaleString('zh-CN')
                    : '-'
                }
              ]}
            />
          </Card>
        </TabPane>

        {/* 跟进历史 */}
        <TabPane key="follow-up" title="跟进历史">
          <Card loading={loading}>
            {follow_up_info ? (
              <div>
                {/* 商务条件 */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>商务条件</h3>
                  {follow_up_info.business_terms ? (
                    <Descriptions
                      column={2}
                      data={Object.entries(follow_up_info.business_terms).map(
                        ([key, value]) => ({
                          label: key,
                          value: String(value)
                        })
                      )}
                    />
                  ) : (
                    <Empty description="暂无商务条件信息" />
                  )}
                </div>

                {/* 盈利测算 */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>盈利测算</h3>
                  {follow_up_info.profit_calculation ? (
                    <Row gutter={16}>
                      <Col span={6}>
                        <Card>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#165DFF' }}>
                              {follow_up_info.profit_calculation.roi.toFixed(2)}%
                            </div>
                            <div style={{ marginTop: '8px', color: '#86909C' }}>
                              投资回报率
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00B42A' }}>
                              {follow_up_info.profit_calculation.payback_period}
                            </div>
                            <div style={{ marginTop: '8px', color: '#86909C' }}>
                              回本周期（月）
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF7D00' }}>
                              {follow_up_info.profit_calculation.contribution_rate.toFixed(2)}%
                            </div>
                            <div style={{ marginTop: '8px', color: '#86909C' }}>
                              贡献率
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ED1' }}>
                              ¥{follow_up_info.profit_calculation.total_investment.toLocaleString()}
                            </div>
                            <div style={{ marginTop: '8px', color: '#86909C' }}>
                              总投资
                            </div>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  ) : (
                    <Empty description="暂无盈利测算信息" />
                  )}
                </div>

                {/* 合同信息 */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>合同信息</h3>
                  {follow_up_info.contract_info ? (
                    <Descriptions
                      column={2}
                      data={Object.entries(follow_up_info.contract_info).map(
                        ([key, value]) => ({
                          label: key,
                          value: String(value)
                        })
                      )}
                    />
                  ) : (
                    <Empty description="暂无合同信息" />
                  )}
                </div>

                {/* 法人主体 */}
                <div>
                  <h3 style={{ marginBottom: '16px' }}>法人主体</h3>
                  {follow_up_info.legal_entity ? (
                    <Descriptions
                      column={2}
                      data={[
                        {
                          label: '主体名称',
                          value: follow_up_info.legal_entity.name
                        },
                        {
                          label: '主体编码',
                          value: follow_up_info.legal_entity.code
                        },
                        {
                          label: '统一社会信用代码',
                          value: follow_up_info.legal_entity.registration_number
                        },
                        {
                          label: '法定代表人',
                          value: follow_up_info.legal_entity.legal_representative
                        }
                      ]}
                    />
                  ) : (
                    <Empty description="暂无法人主体信息" />
                  )}
                </div>
              </div>
            ) : (
              <Empty description="暂无跟进历史信息" />
            )}
          </Card>
        </TabPane>

        {/* 工程历史 */}
        <TabPane key="construction" title="工程历史">
          <Card loading={loading}>
            {construction_info ? (
              <div>
                {/* 施工进度 */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>施工进度</h3>
                  <Descriptions
                    column={2}
                    data={[
                      {
                        label: '开工日期',
                        value: construction_info.construction_timeline.start_date || '-'
                      },
                      {
                        label: '预计完工日期',
                        value: construction_info.construction_timeline.end_date || '-'
                      },
                      {
                        label: '实际完工日期',
                        value: construction_info.construction_timeline.actual_end_date || '-'
                      }
                    ]}
                  />
                </div>

                {/* 里程碑 */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>工程里程碑</h3>
                  {construction_info.milestones && construction_info.milestones.length > 0 ? (
                    <Timeline>
                      {construction_info.milestones.map((milestone) => (
                        <Timeline.Item
                          key={milestone.id}
                          label={milestone.planned_date}
                          dotColor={
                            milestone.status === 'completed'
                              ? 'green'
                              : milestone.status === 'delayed'
                              ? 'red'
                              : 'blue'
                          }
                        >
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{milestone.name}</div>
                            {milestone.actual_date && (
                              <div style={{ color: '#86909C', fontSize: '12px' }}>
                                实际完成：{milestone.actual_date}
                              </div>
                            )}
                            {milestone.description && (
                              <div style={{ marginTop: '4px', color: '#86909C' }}>
                                {milestone.description}
                              </div>
                            )}
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <Empty description="暂无里程碑信息" />
                  )}
                </div>

                {/* 设计图纸 */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>设计图纸</h3>
                  {construction_info.design_files && construction_info.design_files.length > 0 ? (
                    <div>
                      {construction_info.design_files.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px',
                            border: '1px solid #E5E6EB',
                            borderRadius: '4px',
                            marginBottom: '8px'
                          }}
                        >
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            {file.name}
                          </a>
                          <span style={{ marginLeft: '12px', color: '#86909C' }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="暂无设计图纸" />
                  )}
                </div>

                {/* 交付清单 */}
                <div>
                  <h3 style={{ marginBottom: '16px' }}>交付清单</h3>
                  {construction_info.delivery_checklist ? (
                    <Descriptions
                      column={2}
                      data={[
                        {
                          label: '清单编号',
                          value: construction_info.delivery_checklist.checklist_no
                        },
                        {
                          label: '交付状态',
                          value: construction_info.delivery_checklist.status
                        },
                        {
                          label: '交付日期',
                          value: construction_info.delivery_checklist.delivery_date || '-'
                        }
                      ]}
                    />
                  ) : (
                    <Empty description="暂无交付清单信息" />
                  )}
                </div>
              </div>
            ) : (
              <Empty description="暂无工程历史信息" />
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* 状态变更弹窗 */}
      <Modal
        title="变更门店状态"
        visible={statusModalVisible}
        onOk={handleStatusSubmit}
        onCancel={() => setStatusModalVisible(false)}
        confirmLoading={statusChanging}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="新状态"
            field="status"
            rules={[{ required: true, message: '请选择新状态' }]}
          >
            <Select placeholder="请选择新状态">
              {Object.entries(STORE_STATUS_CONFIG).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            label="变更原因"
            field="reason"
          >
            <Input.TextArea
              placeholder="请输入变更原因"
              rows={4}
            />
          </FormItem>
          <FormItem
            label="生效日期"
            field="effective_date"
          >
            <Input placeholder="请输入生效日期（YYYY-MM-DD）" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default StoreDetail
