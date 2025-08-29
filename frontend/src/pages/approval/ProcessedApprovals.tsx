import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Drawer,
  Descriptions,
  Timeline,
  DatePicker,
  message,
  Tooltip,
  Progress,
  Divider
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ApprovalRecord, ApprovalQuery } from '../../types/approval'
import { approvalService } from '../../services/approvalService'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

const ProcessedApprovals: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedResult, setSelectedResult] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ApprovalRecord | null>(null)
  const [processedRecords, setProcessedRecords] = useState<ApprovalRecord[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 模拟已办审批数据
  const mockProcessedRecords: ApprovalRecord[] = [
    {
      id: '1',
      instanceId: 'inst1',
      nodeId: 'n2',
      nodeName: '运营总监审批',
      approver: {
        id: 'u2',
        name: '李总监',
        position: '运营总监',
        department: '运营中心'
      },
      action: 'approve',
      result: 'approved',
      comment: '选址位置优秀，预期收益良好，同意开设门店',
      attachments: ['location_analysis.pdf'],
      createTime: '2023-12-01 16:30:00',
      deadline: '2023-12-03 18:00:00'
    },
    {
      id: '2',
      instanceId: 'inst2',
      nodeId: 'n1',
      nodeName: '初级审批',
      approver: {
        id: 'u2',
        name: '李总监',
        position: '运营总监',
        department: '运营中心'
      },
      action: 'reject',
      result: 'rejected',
      comment: '营业执照资料不完整，请补充相关证明文件后重新申请',
      createTime: '2023-12-01 17:45:00',
      deadline: '2023-12-05 18:00:00'
    },
    {
      id: '3',
      instanceId: 'inst3',
      nodeId: 'n3',
      nodeName: '财务经理审批',
      approver: {
        id: 'u2',
        name: '李总监',
        position: '运营总监',
        department: '运营中心'
      },
      action: 'transfer',
      result: 'pending',
      comment: '此类设备采购需要设备部门专业评估，转交给设备管理部',
      transferTo: {
        id: 'u8',
        name: '设备管理',
        position: '设备主管',
        department: '设备部'
      },
      createTime: '2023-12-01 18:20:00',
      deadline: '2023-12-02 12:00:00'
    },
    {
      id: '4',
      instanceId: 'inst4',
      nodeId: 'n2',
      nodeName: '区域经理审批',
      approver: {
        id: 'u2',
        name: '李总监',
        position: '运营总监',
        department: '运营中心'
      },
      action: 'approve',
      result: 'approved',
      comment: '合同条款合理，租金在预算范围内，同意签署',
      createTime: '2023-11-30 14:15:00',
      deadline: '2023-12-02 18:00:00'
    },
    {
      id: '5',
      instanceId: 'inst5',
      nodeId: 'n1',
      nodeName: '部门主管审批',
      approver: {
        id: 'u2',
        name: '李总监',
        position: '运营总监',
        department: '运营中心'
      },
      action: 'add_sign',
      result: 'pending',
      comment: '需要法务部门参与合同条款审查',
      addSignUsers: [
        {
          id: 'u9',
          name: '法务专员',
          position: '法务专员',
          department: '法务部'
        }
      ],
      createTime: '2023-11-29 15:30:00',
      deadline: '2023-12-01 18:00:00'
    }
  ]

  // 筛选处理后的审批记录
  const filteredRecords = mockProcessedRecords.filter(record => {
    const matchesSearch = 
      record.comment.toLowerCase().includes(searchText.toLowerCase()) ||
      record.approver.name.toLowerCase().includes(searchText.toLowerCase()) ||
      record.nodeName.toLowerCase().includes(searchText.toLowerCase())
    
    const matchesResult = selectedResult === 'all' || record.result === selectedResult
    
    const matchesDateRange = !selectedDateRange || (
      dayjs(record.createTime).isAfter(selectedDateRange[0].startOf('day')) &&
      dayjs(record.createTime).isBefore(selectedDateRange[1].endOf('day'))
    )
    
    return matchesSearch && matchesResult && matchesDateRange
  })

  const columns: ColumnsType<ApprovalRecord> = [
    {
      title: '审批信息',
      key: 'approvalInfo',
      width: 280,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: 4 }}>
            {record.nodeName}
          </div>
          <div style={{ color: '#666', fontSize: '12px', marginBottom: 2 }}>
            实例ID: {record.instanceId}
          </div>
          <Space size="small">
            <Tag 
              color={
                record.result === 'approved' ? 'green' :
                record.result === 'rejected' ? 'red' :
                'orange'
              }
            >
              {record.result === 'approved' ? '已同意' :
               record.result === 'rejected' ? '已拒绝' :
               '处理中'}
            </Tag>
            <Tag color="blue">
              {record.action === 'approve' ? '审批通过' :
               record.action === 'reject' ? '审批拒绝' :
               record.action === 'transfer' ? '转交' :
               record.action === 'add_sign' ? '加签' : '其他'}
            </Tag>
          </Space>
        </div>
      )
    },
    {
      title: '处理人',
      key: 'approver',
      width: 120,
      render: (_, record) => (
        <div>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{record.approver.name}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>{record.approver.department}</div>
            </div>
          </Space>
        </div>
      )
    },
    {
      title: '处理结果',
      key: 'result',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div>
          <Badge 
            status={
              record.result === 'approved' ? 'success' :
              record.result === 'rejected' ? 'error' :
              'processing'
            }
          />
          <div style={{ marginTop: 4 }}>
            {record.result === 'approved' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            {record.result === 'rejected' && <CloseCircleOutlined style={{ color: '#f5222d' }} />}
            {record.result === 'pending' && <ClockCircleOutlined style={{ color: '#faad14' }} />}
          </div>
        </div>
      )
    },
    {
      title: '处理时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120,
      sorter: (a, b) => dayjs(a.createTime).unix() - dayjs(b.createTime).unix(),
      render: (time: string) => (
        <div>
          <div>{dayjs(time).format('YYYY-MM-DD')}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {dayjs(time).format('HH:mm:ss')}
          </div>
        </div>
      )
    },
    {
      title: '处理意见',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: {
        showTitle: false,
      },
      render: (comment: string) => (
        <Tooltip title={comment} placement="topLeft">
          <div style={{ 
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {comment}
          </div>
        </Tooltip>
      )
    },
    {
      title: '特殊操作',
      key: 'specialAction',
      width: 120,
      render: (_, record) => (
        <div>
          {record.transferTo && (
            <Tag color="orange">
              转交给 {record.transferTo.name}
            </Tag>
          )}
          {record.addSignUsers && record.addSignUsers.length > 0 && (
            <Tag color="purple">
              加签 {record.addSignUsers.length} 人
            </Tag>
          )}
          {record.attachments && record.attachments.length > 0 && (
            <Tag color="blue">
              附件 {record.attachments.length}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
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

  const handleViewDetail = (record: ApprovalRecord) => {
    setSelectedRecord(record)
    setDetailDrawerVisible(true)
  }

  const handleExport = () => {
    message.success('导出功能开发中...')
  }

  const handleRefresh = () => {
    setLoading(true)
    // 模拟刷新
    setTimeout(() => {
      setLoading(false)
      message.success('数据已刷新')
    }, 1000)
  }

  const handleReset = () => {
    setSearchText('')
    setSelectedCategory('all')
    setSelectedResult('all')
    setSelectedDateRange(null)
  }

  // 统计数据
  const stats = {
    totalProcessed: filteredRecords.length,
    approvedCount: filteredRecords.filter(r => r.result === 'approved').length,
    rejectedCount: filteredRecords.filter(r => r.result === 'rejected').length,
    todayCount: filteredRecords.filter(r => 
      dayjs(r.createTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已办总数"
              value={stats.totalProcessed}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已同意"
              value={stats.approvedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已拒绝"
              value={stats.rejectedCount}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="今日处理"
              value={stats.todayCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Input
                placeholder="搜索处理意见、审批人、节点名称"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 280 }}
              />
              <Select
                value={selectedResult}
                onChange={setSelectedResult}
                style={{ width: 120 }}
                placeholder="处理结果"
              >
                <Option value="all">全部结果</Option>
                <Option value="approved">已同意</Option>
                <Option value="rejected">已拒绝</Option>
                <Option value="pending">处理中</Option>
              </Select>
              <RangePicker
                value={selectedDateRange}
                onChange={setSelectedDateRange}
                placeholder={['开始日期', '结束日期']}
                style={{ width: 240 }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 已办列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredRecords.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: setCurrentPage,
            onShowSizeChange: (current, size) => {
              setCurrentPage(current)
              setPageSize(size)
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 审批详情抽屉 */}
      <Drawer
        title="审批处理详情"
        width={800}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedRecord && (
          <div>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="实例ID">
                  {selectedRecord.instanceId}
                </Descriptions.Item>
                <Descriptions.Item label="审批节点">
                  {selectedRecord.nodeName}
                </Descriptions.Item>
                <Descriptions.Item label="处理人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {selectedRecord.approver.name} ({selectedRecord.approver.position})
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="所属部门">
                  {selectedRecord.approver.department}
                </Descriptions.Item>
                <Descriptions.Item label="处理动作">
                  <Tag color="blue">
                    {selectedRecord.action === 'approve' ? '审批通过' :
                     selectedRecord.action === 'reject' ? '审批拒绝' :
                     selectedRecord.action === 'transfer' ? '转交' :
                     selectedRecord.action === 'add_sign' ? '加签' : '其他'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="处理结果">
                  <Badge 
                    status={
                      selectedRecord.result === 'approved' ? 'success' :
                      selectedRecord.result === 'rejected' ? 'error' :
                      'processing'
                    }
                    text={
                      selectedRecord.result === 'approved' ? '已同意' :
                      selectedRecord.result === 'rejected' ? '已拒绝' :
                      '处理中'
                    }
                  />
                </Descriptions.Item>
                <Descriptions.Item label="处理时间">
                  {selectedRecord.createTime}
                </Descriptions.Item>
                <Descriptions.Item label="截止时间">
                  <span style={{
                    color: selectedRecord.deadline && dayjs(selectedRecord.deadline).isBefore(dayjs()) ? '#f50' : '#666'
                  }}>
                    {selectedRecord.deadline || '无'}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 处理意见 */}
            <Card title="处理意见" size="small" style={{ marginBottom: 16 }}>
              <div style={{ 
                background: '#fafafa', 
                padding: '12px', 
                borderRadius: '4px',
                minHeight: '60px',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedRecord.comment}
              </div>
            </Card>

            {/* 特殊操作信息 */}
            {(selectedRecord.transferTo || selectedRecord.addSignUsers) && (
              <Card title="特殊操作" size="small" style={{ marginBottom: 16 }}>
                {selectedRecord.transferTo && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>转交信息:</div>
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <div>{selectedRecord.transferTo.name}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {selectedRecord.transferTo.position} · {selectedRecord.transferTo.department}
                        </div>
                      </div>
                    </Space>
                  </div>
                )}
                
                {selectedRecord.addSignUsers && selectedRecord.addSignUsers.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>加签人员:</div>
                    <Space wrap>
                      {selectedRecord.addSignUsers.map((user, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                          <div>
                            <div style={{ fontSize: '13px' }}>{user.name}</div>
                            <div style={{ color: '#666', fontSize: '11px' }}>
                              {user.position} · {user.department}
                            </div>
                          </div>
                        </div>
                      ))}
                    </Space>
                  </div>
                )}
              </Card>
            )}

            {/* 相关附件 */}
            {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
              <Card title="相关附件" size="small">
                <Space direction="vertical">
                  {selectedRecord.attachments.map((attachment, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                      <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      <a href={`#${attachment}`} style={{ fontSize: '13px' }}>
                        {attachment}
                      </a>
                    </div>
                  ))}
                </Space>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ProcessedApprovals