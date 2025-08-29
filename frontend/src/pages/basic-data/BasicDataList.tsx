import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Space, Badge, Tag } from 'antd'
import {
  AppstoreOutlined,
  TeamOutlined,
  ShopOutlined,
  UserOutlined,
  BankOutlined,
  GlobalOutlined,
  SettingOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import RegionManagement from './RegionManagement'
import SupplierManagement from './SupplierManagement'
import AdminRegionManagement from './AdminRegionManagement'
import OrganizationManagement from './OrganizationManagement'
import CustomerManagement from './CustomerManagement'

const { Title, Text } = Typography

interface BasicDataModule {
  key: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  status: 'active' | 'developing' | 'planned'
  badge?: number
  component?: React.ComponentType
}

const BasicDataList: React.FC = () => {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<string | null>(null)

  // 基础数据模块配置
  const modules: BasicDataModule[] = [
    {
      key: 'business-regions',
      title: '业务大区管理',
      description: '管理业务大区信息，包括大区基本信息、负责人分配和城市关联',
      icon: <AppstoreOutlined style={{ fontSize: 24 }} />,
      color: '#1890ff',
      status: 'active',
      badge: 8,
      component: RegionManagement
    },
    {
      key: 'suppliers',
      title: '供应商管理',
      description: '管理供应商信息、资质证书、合同协议和评估记录',
      icon: <TeamOutlined style={{ fontSize: 24 }} />,
      color: '#52c41a',
      status: 'active',
      badge: 156,
      component: SupplierManagement
    },
    {
      key: 'organizations',
      title: '组织架构',
      description: '管理公司组织架构、部门信息和层级关系',
      icon: <BankOutlined style={{ fontSize: 24 }} />,
      color: '#722ed1',
      status: 'active',
      badge: 23,
      component: OrganizationManagement
    },
    {
      key: 'customers',
      title: '客户管理',
      description: '管理客户信息、联系方式、业务关系和合作历史',
      icon: <UserOutlined style={{ fontSize: 24 }} />,
      color: '#fa8c16',
      status: 'active',
      badge: 89,
      component: CustomerManagement
    },
    {
      key: 'admin-regions',
      title: '行政区域',
      description: '管理省市区县等行政区域信息和层级关系',
      icon: <GlobalOutlined style={{ fontSize: 24 }} />,
      color: '#13c2c2',
      status: 'active',
      badge: 3456,
      component: AdminRegionManagement
    },
    {
      key: 'dictionary',
      title: '数据字典',
      description: '管理系统数据字典、枚举值和配置参数',
      icon: <SettingOutlined style={{ fontSize: 24 }} />,
      color: '#eb2f96',
      status: 'planned'
    }
  ]

  // 状态标签渲染
  const renderStatusTag = (status: BasicDataModule['status']) => {
    const statusConfig = {
      active: { color: 'green', text: '可用' },
      developing: { color: 'orange', text: '开发中' },
      planned: { color: 'default', text: '规划中' }
    }
    const config = statusConfig[status]
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 处理模块点击
  const handleModuleClick = (module: BasicDataModule) => {
    if (module.status === 'active' && module.component) {
      setActiveModule(module.key)
    } else if (module.status === 'developing') {
      // 可以跳转到开发中的页面或显示提示
      console.log(`${module.title} 功能正在开发中`)
    } else {
      console.log(`${module.title} 功能正在规划中`)
    }
  }

  // 返回模块列表
  const handleBackToList = () => {
    setActiveModule(null)
  }

  // 如果选择了活动模块，渲染对应组件
  if (activeModule) {
    const activeModuleConfig = modules.find(m => m.key === activeModule)
    if (activeModuleConfig && activeModuleConfig.component) {
      const Component = activeModuleConfig.component
      return (
        <div>
          <PageHeader
            title={activeModuleConfig.title}
            description={activeModuleConfig.description}
            breadcrumbs={[
              { title: '基础数据', path: '/basic-data' },
              { title: activeModuleConfig.title }
            ]}
            extra={
              <Button onClick={handleBackToList}>
                返回列表
              </Button>
            }
          />
          <Component />
        </div>
      )
    }
  }

  return (
    <div>
      <PageHeader
        title="基础数据管理"
        description="管理业务大区、组织架构、供应商、客户等基础数据信息"
        breadcrumbs={[{ title: '基础数据' }]}
      />

      {/* 概览统计 */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>数据概览</Title>
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>8</div>
              <div style={{ color: '#666', fontSize: 14 }}>业务大区</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>156</div>
              <div style={{ color: '#666', fontSize: 14 }}>供应商</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>23</div>
              <div style={{ color: '#666', fontSize: 14 }}>组织架构</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>89</div>
              <div style={{ color: '#666', fontSize: 14 }}>客户</div>
            </div>
          </Col>
        </Row>
        <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#13c2c2' }}>3456</div>
              <div style={{ color: '#666', fontSize: 14 }}>行政区域</div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#eb2f96' }}>12</div>
              <div style={{ color: '#666', fontSize: 14 }}>数据字典</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 功能模块 */}
      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col span={8} key={module.key}>
            <Card
              hoverable={module.status === 'active'}
              style={{
                height: 200,
                cursor: module.status === 'active' ? 'pointer' : 'default',
                opacity: module.status === 'planned' ? 0.6 : 1
              }}
              onClick={() => handleModuleClick(module)}
              bodyStyle={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: `${module.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: module.color,
                    marginRight: 12
                  }}
                >
                  {module.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Title level={5} style={{ margin: 0 }}>
                      {module.title}
                    </Title>
                    {module.badge && (
                      <Badge
                        count={module.badge}
                        style={{ backgroundColor: module.color }}
                      />
                    )}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {renderStatusTag(module.status)}
                  </div>
                </div>
              </div>

              <Text type="secondary" style={{ fontSize: 13, lineHeight: '20px', flex: 1 }}>
                {module.description}
              </Text>

              {module.status === 'active' && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button type="link" size="small" icon={<ArrowRightOutlined />}>
                    进入管理
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginTop: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<AppstoreOutlined />}
            onClick={() => handleModuleClick(modules[0])}
          >
            管理业务大区
          </Button>
          <Button
            icon={<TeamOutlined />}
            onClick={() => handleModuleClick(modules[1])}
          >
            管理供应商
          </Button>
          <Button
            icon={<BankOutlined />}
            onClick={() => handleModuleClick(modules[2])}
          >
            组织架构管理
          </Button>
          <Button
            icon={<UserOutlined />}
            onClick={() => handleModuleClick(modules[3])}
          >
            客户管理
          </Button>
          <Button
            icon={<GlobalOutlined />}
            onClick={() => handleModuleClick(modules[4])}
          >
            行政区域管理
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default BasicDataList
