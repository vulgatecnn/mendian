import React, { useState } from 'react'
import {
  Card,
  Timeline,
  Select,
  Input,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Avatar,
  Descriptions,
  Modal,
  Table,
  DatePicker,
  Form,
  message
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  EditOutlined,
  ShopOutlined,
  FileTextOutlined,
  BankOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

interface HistoryRecord {
  id: string
  storeCode: string
  storeName: string
  changeType: string
  changeContent: string
  beforeValue?: string
  afterValue?: string
  changeDate: string
  operator: string
  approver?: string
  status: string
  reason?: string
  attachments?: string[]
}

const StoreHistory: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [dateRange, setDateRange] = useState<any[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)

  // 模拟变更历史数据
  const mockHistory: HistoryRecord[] = [
    {
      id: '1',
      storeCode: 'HFW001',
      storeName: '好饭碗(国贸店)',
      changeType: '基础信息变更',
      changeContent: '更新门店联系电话',
      beforeValue: '010-85951234',
      afterValue: '010-85951235',
      changeDate: '2023-08-15 14:30:00',
      operator: '张经理',
      approver: '李主管',
      status: '已生效',
      reason: '原电话故障，更换新号码'
    },
    {
      id: '2',
      storeCode: 'HFW002',
      storeName: '好饭碗(三里屯店)',
      changeType: '营业状态变更',
      changeContent: '门店状态从装修中变更为试营业',
      beforeValue: '装修中',
      afterValue: '试营业',
      changeDate: '2023-08-10 09:00:00',
      operator: '李经理',
      approver: '王总监',
      status: '已生效',
      reason: '装修完成，开始试营业'
    },
    {
      id: '3',
      storeCode: 'HFW003',
      storeName: '好饭碗(陆家嘴店)',
      changeType: '人员变更',
      changeContent: '更换店长',
      beforeValue: '王经理',
      afterValue: '赵经理',
      changeDate: '2023-08-05 16:20:00',
      operator: '人事部',
      approver: '李总监',
      status: '已生效',
      reason: '人员调动'
    },
    {
      id: '4',
      storeCode: 'HFW001',
      storeName: '好饭碗(国贸店)',
      changeType: '证照更新',
      changeContent: '营业执照续期',
      beforeValue: '有效期至2023-06-30',
      afterValue: '有效期至2024-06-30',
      changeDate: '2023-07-28 11:15:00',
      operator: '财务部',
      approver: '张主管',
      status: '已生效',
      reason: '营业执照到期续期'
    },
    {
      id: '5',
      storeCode: 'HFW004',
      storeName: '好饭碗(天河店)',
      changeType: '基础信息变更',
      changeContent: '营业面积调整',
      beforeValue: '150㎡',
      afterValue: '165㎡',
      changeDate: '2023-07-20 10:30:00',
      operator: '陈经理',
      approver: '刘总监',
      status: '审核中',
      reason: '扩大经营面积'
    },
    {
      id: '6',
      storeCode: 'HFW002',
      storeName: '好饭碗(三里屯店)',
      changeType: '开业信息',
      changeContent: '门店正式开业',
      changeDate: '2023-07-15 08:00:00',
      operator: '李经理',
      status: '已生效',
      reason: '筹备完成，正式开业'
    }
  ]

  // 过滤数据
  const filteredHistory = mockHistory.filter(record => {
    const matchesSearch = 
      record.storeName.toLowerCase().includes(searchText.toLowerCase()) ||
      record.storeCode.toLowerCase().includes(searchText.toLowerCase()) ||
      record.changeContent.toLowerCase().includes(searchText.toLowerCase())
    
    const matchesStore = selectedStore === 'all' || record.storeCode === selectedStore
    const matchesType = selectedType === 'all' || record.changeType === selectedType
    
    let matchesDate = true
    if (dateRange.length === 2) {
      const recordDate = dayjs(record.changeDate)
      matchesDate = recordDate.isAfter(dateRange[0]) && recordDate.isBefore(dateRange[1])
    }
    
    return matchesSearch && matchesStore && matchesType && matchesDate
  })

  const columns: ColumnsType<HistoryRecord> = [
    {
      title: '门店信息',
      key: 'storeInfo',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.storeName}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.storeCode}</div>
        </div>
      )
    },
    {
      title: '变更类型',
      dataIndex: 'changeType',
      key: 'changeType',
      width: 120,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '基础信息变更': 'blue',
          '营业状态变更': 'green',
          '人员变更': 'orange',
          '证照更新': 'purple',
          '开业信息': 'gold'
        }
        return <Tag color={colorMap[type]}>{type}</Tag>
      }
    },
    {
      title: '变更内容',
      dataIndex: 'changeContent',
      key: 'changeContent',
      ellipsis: true
    },
    {
      title: '变更时间',
      dataIndex: 'changeDate',
      key: 'changeDate',
      width: 150,
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('YYYY-MM-DD')}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      render: (operator: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {operator}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; icon: any }> = {
          '已生效': { color: 'success', icon: <CheckCircleOutlined /> },
          '审核中': { color: 'processing', icon: <ClockCircleOutlined /> },
          '已拒绝': { color: 'error', icon: <ExclamationCircleOutlined /> }
        }
        const config = statusConfig[status] || { color: 'default', icon: null }
        return (
          <Space>
            {config.icon}
            <Tag color={config.color}>{status}</Tag>
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      )
    }
  ]

  const handleViewDetail = (record: HistoryRecord) => {
    setSelectedRecord(record)
    setDetailVisible(true)
  }

  const storeOptions = Array.from(new Set(mockHistory.map(h => h.storeCode)))
  const typeOptions = Array.from(new Set(mockHistory.map(h => h.changeType)))

  return (
    <div>
      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item>
            <Input
              placeholder="搜索门店名称、编码或变更内容"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Form.Item>
          <Form.Item>
            <Select
              value={selectedStore}
              onChange={setSelectedStore}
              style={{ width: 150 }}
              placeholder="选择门店"
            >
              <Option value="all">全部门店</Option>
              {storeOptions.map(code => {
                const store = mockHistory.find(h => h.storeCode === code)
                return (
                  <Option key={code} value={code}>
                    {store?.storeName}
                  </Option>
                )
              })}
            </Select>
          </Form.Item>
          <Form.Item>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 150 }}
              placeholder="变更类型"
            >
              <Option value="all">全部类型</Option>
              {typeOptions.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
        </Form>
      </Card>

      {/* 时间线视图切换 */}
      <Row gutter={16}>
        <Col span={16}>
          <Card title="变更记录表格">
            <Table
              columns={columns}
              dataSource={filteredHistory}
              rowKey="id"
              pagination={{
                total: filteredHistory.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
              }}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="变更时间线">
            <Timeline>
              {filteredHistory.slice(0, 10).map(record => (
                <Timeline.Item
                  key={record.id}
                  color={record.status === '已生效' ? 'green' : 
                         record.status === '审核中' ? 'blue' : 'red'}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {record.storeName}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px', marginBottom: 4 }}>
                      {record.changeContent}
                    </div>
                    <div style={{ color: '#999', fontSize: '11px' }}>
                      {dayjs(record.changeDate).format('MM-DD HH:mm')} · {record.operator}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* 变更详情模态框 */}
      <Modal
        title="变更记录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="门店信息">
                <Space>
                  <Avatar icon={<ShopOutlined />} size="small" />
                  {selectedRecord.storeName} ({selectedRecord.storeCode})
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="变更类型">
                <Tag color="blue">{selectedRecord.changeType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="变更内容">
                {selectedRecord.changeContent}
              </Descriptions.Item>
              {selectedRecord.beforeValue && (
                <Descriptions.Item label="变更前">
                  <span style={{ color: '#ff4d4f' }}>{selectedRecord.beforeValue}</span>
                </Descriptions.Item>
              )}
              {selectedRecord.afterValue && (
                <Descriptions.Item label="变更后">
                  <span style={{ color: '#52c41a' }}>{selectedRecord.afterValue}</span>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="变更时间">
                {dayjs(selectedRecord.changeDate).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {selectedRecord.operator}
                </Space>
              </Descriptions.Item>
              {selectedRecord.approver && (
                <Descriptions.Item label="审批人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {selectedRecord.approver}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="当前状态">
                {selectedRecord.status === '已生效' && (
                  <Tag icon={<CheckCircleOutlined />} color="success">已生效</Tag>
                )}
                {selectedRecord.status === '审核中' && (
                  <Tag icon={<ClockCircleOutlined />} color="processing">审核中</Tag>
                )}
                {selectedRecord.status === '已拒绝' && (
                  <Tag icon={<ExclamationCircleOutlined />} color="error">已拒绝</Tag>
                )}
              </Descriptions.Item>
              {selectedRecord.reason && (
                <Descriptions.Item label="变更原因">
                  {selectedRecord.reason}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>相关附件:</div>
                <Space>
                  {selectedRecord.attachments.map((file, index) => (
                    <Button key={index} size="small" icon={<FileTextOutlined />}>
                      {file}
                    </Button>
                  ))}
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StoreHistory