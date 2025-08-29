import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Statistic,
  Descriptions,
  Image,
  Tag,
  Timeline,
  Table,
  Tabs,
  Progress,
  Button,
  Space,
  Avatar,
  Badge,
  Tooltip,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  message
} from 'antd'
import {
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  CalendarOutlined,
  FileImageOutlined,
  EditOutlined,
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PictureOutlined
} from '@ant-design/icons'
import { Area, Column, Pie } from '@ant-design/plots'
import type { ColumnsType } from 'antd/es/table'

const { TabPane } = Tabs
const { TextArea } = Input

const StoreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const [uploadVisible, setUploadVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [form] = Form.useForm()

  // 模拟门店详细信息
  const storeDetail = {
    id: '1',
    storeCode: 'HFW001',
    storeName: '好饭碗(国贸店)',
    region: '华北大区',
    address: '北京市朝阳区国贸CBD核心区建外SOHO 1号楼1层',
    storeType: '直营店',
    businessFormat: '快餐',
    openDate: '2023-03-15',
    status: '正常营业',
    area: 180,
    manager: '张经理',
    phone: '010-85951234',
    businessLicense: '91110105123456789X',
    operatingStatus: '营业中',
    monthlyRevenue: 285000,
    customerFlow: 3200,
    rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    description: '位于国贸CBD核心区域，周边写字楼密集，客流量稳定，主要服务商务人群。',
    rentCost: 45000,
    decorationCost: 350000,
    equipmentCost: 180000,
    staff: 12,
    operatingHours: '07:00-22:00'
  }

  // 运营数据趋势
  const revenueData = [
    { month: '2023-03', revenue: 180000 },
    { month: '2023-04', revenue: 220000 },
    { month: '2023-05', revenue: 250000 },
    { month: '2023-06', revenue: 285000 },
    { month: '2023-07', revenue: 295000 },
    { month: '2023-08', revenue: 285000 }
  ]

  // 客流数据
  const customerData = [
    { day: '周一', flow: 280 },
    { day: '周二', flow: 320 },
    { day: '周三', flow: 350 },
    { day: '周四', flow: 380 },
    { day: '周五', flow: 450 },
    { day: '周六', flow: 520 },
    { day: '周日', flow: 480 }
  ]

  // 门店文件列表
  const documentColumns: ColumnsType<any> = [
    {
      title: '文件名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          {record.type === 'image' ? <PictureOutlined /> : <FileTextOutlined />}
          {name}
        </Space>
      )
    },
    {
      title: '文件类型',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime'
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />}>
            预览
          </Button>
          <Button type="text" size="small" icon={<DownloadOutlined />}>
            下载
          </Button>
        </Space>
      )
    }
  ]

  const documents = [
    {
      id: '1',
      name: '营业执照.jpg',
      category: '证照文件',
      type: 'image',
      uploadTime: '2023-03-10 10:30',
      size: '2.1MB'
    },
    {
      id: '2',
      name: '食品经营许可证.pdf',
      category: '证照文件',
      type: 'document',
      uploadTime: '2023-03-10 10:32',
      size: '1.8MB'
    },
    {
      id: '3',
      name: '门店设计图.dwg',
      category: '装修资料',
      type: 'document',
      uploadTime: '2023-02-15 14:20',
      size: '5.2MB'
    },
    {
      id: '4',
      name: '门店照片集.zip',
      category: '现场照片',
      type: 'archive',
      uploadTime: '2023-03-16 09:15',
      size: '12.5MB'
    }
  ]

  // 变更历史
  const changeHistory = [
    {
      date: '2023-08-15 14:30',
      type: '信息更新',
      content: '更新店长联系方式',
      operator: '系统管理员'
    },
    {
      date: '2023-07-20 10:00',
      type: '状态变更',
      content: '营业状态变更为正常营业',
      operator: '张经理'
    },
    {
      date: '2023-03-15 08:00',
      type: '门店开业',
      content: '门店正式开业',
      operator: '张经理'
    },
    {
      date: '2023-03-10 16:00',
      type: '信息录入',
      content: '门店基础信息录入完成',
      operator: '李专员'
    }
  ]

  const handleUpload = (values: any) => {
    console.log('上传文件:', values)
    message.success('文件上传成功')
    setUploadVisible(false)
  }

  const handleEdit = (values: any) => {
    console.log('更新门店信息:', values)
    message.success('门店信息更新成功')
    setEditVisible(false)
  }

  return (
    <div>
      {/* 门店基本信息卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={120}
                src={storeDetail.avatar}
                icon={<ShopOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>{storeDetail.storeName}</h3>
              <Tag color="blue">{storeDetail.storeType}</Tag>
              <Badge 
                status="success" 
                text={storeDetail.operatingStatus} 
                style={{ marginLeft: 8 }}
              />
            </div>
          </Col>
          <Col span={18}>
            <Descriptions column={3}>
              <Descriptions.Item label="门店编码">{storeDetail.storeCode}</Descriptions.Item>
              <Descriptions.Item label="所属大区">{storeDetail.region}</Descriptions.Item>
              <Descriptions.Item label="业态">{storeDetail.businessFormat}</Descriptions.Item>
              <Descriptions.Item label="开业时间">{storeDetail.openDate}</Descriptions.Item>
              <Descriptions.Item label="营业面积">{storeDetail.area}㎡</Descriptions.Item>
              <Descriptions.Item label="员工数量">{storeDetail.staff}人</Descriptions.Item>
              <Descriptions.Item label="店长">
                <UserOutlined /> {storeDetail.manager}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <PhoneOutlined /> {storeDetail.phone}
              </Descriptions.Item>
              <Descriptions.Item label="营业时间">{storeDetail.operatingHours}</Descriptions.Item>
              <Descriptions.Item label="门店地址" span={3}>
                <EnvironmentOutlined /> {storeDetail.address}
              </Descriptions.Item>
              <Descriptions.Item label="门店简介" span={3}>
                {storeDetail.description}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button icon={<EditOutlined />} onClick={() => setEditVisible(true)}>
                  编辑信息
                </Button>
                <Button icon={<UploadOutlined />} onClick={() => setUploadVisible(true)}>
                  上传文件
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          {/* 运营概览 */}
          <TabPane 
            tab={
              <span>
                <ShopOutlined />
                运营概览
              </span>
            } 
            key="overview"
          >
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="月营收"
                    value={storeDetail.monthlyRevenue}
                    precision={0}
                    valueStyle={{ color: '#3f8600' }}
                    prefix="¥"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="月客流"
                    value={storeDetail.customerFlow}
                    valueStyle={{ color: '#1890ff' }}
                    suffix="人次"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="综合评分"
                    value={storeDetail.rating}
                    precision={1}
                    valueStyle={{ color: '#faad14' }}
                    suffix="分"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="月租金"
                    value={storeDetail.rentCost}
                    precision={0}
                    valueStyle={{ color: '#722ed1' }}
                    prefix="¥"
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="营收趋势" size="small">
                  <Area
                    data={revenueData}
                    xField="month"
                    yField="revenue"
                    height={200}
                    smooth
                    yAxis={{
                      label: {
                        formatter: (v: string) => `${Number(v) / 10000}万`
                      }
                    }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="每周客流" size="small">
                  <Column
                    data={customerData}
                    xField="day"
                    yField="flow"
                    height={200}
                    columnWidthRatio={0.6}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 门店档案 */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                门店档案
              </span>
            } 
            key="documents"
          >
            <Table
              columns={documentColumns}
              dataSource={documents}
              rowKey="id"
              pagination={false}
            />
          </TabPane>

          {/* 变更历史 */}
          <TabPane 
            tab={
              <span>
                <CalendarOutlined />
                变更历史
              </span>
            } 
            key="history"
          >
            <Timeline>
              {changeHistory.map((item, index) => (
                <Timeline.Item 
                  key={index}
                  color={index === 0 ? 'green' : 'blue'}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {item.type}: {item.content}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      {item.date} - 操作人: {item.operator}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      {/* 上传文件模态框 */}
      <Modal
        title="上传门店文件"
        open={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        footer={null}
      >
        <Form onFinish={handleUpload} layout="vertical">
          <Form.Item
            name="category"
            label="文件类别"
            rules={[{ required: true, message: '请选择文件类别' }]}
          >
            <Select placeholder="请选择文件类别">
              <Select.Option value="证照文件">证照文件</Select.Option>
              <Select.Option value="装修资料">装修资料</Select.Option>
              <Select.Option value="现场照片">现场照片</Select.Option>
              <Select.Option value="其他资料">其他资料</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="文件描述"
          >
            <TextArea rows={3} placeholder="请输入文件描述" />
          </Form.Item>

          <Form.Item
            name="files"
            label="选择文件"
            rules={[{ required: true, message: '请选择文件' }]}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setUploadVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">上传</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑门店信息模态框 */}
      <Modal
        title="编辑门店信息"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          onFinish={handleEdit}
          layout="vertical"
          initialValues={storeDetail}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storeName"
                label="门店名称"
                rules={[{ required: true, message: '请输入门店名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="manager"
                label="店长"
                rules={[{ required: true, message: '请输入店长姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="operatingHours"
                label="营业时间"
                rules={[{ required: true, message: '请输入营业时间' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="门店地址"
            rules={[{ required: true, message: '请输入门店地址' }]}
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="description"
            label="门店简介"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setEditVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default StoreDetail