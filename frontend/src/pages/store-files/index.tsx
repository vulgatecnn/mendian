import React, { useState } from 'react'
import { Tabs, Card } from 'antd'
import {
  ShopOutlined,
  FileTextOutlined,
  LineChartOutlined,
  HistoryOutlined,
  TeamOutlined
} from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import StoreList from './StoreList'
import StoreDetail from './StoreDetail'
import StoreHistory from './StoreHistory'
import StoreStats from './StoreStats'

interface StoreFilesIndexProps {
  embedded?: boolean
}

const StoreFilesIndex: React.FC<StoreFilesIndexProps> = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('stores')

  const tabs = [
    {
      key: 'stores',
      label: (
        <span>
          <ShopOutlined />
          门店列表
        </span>
      ),
      children: <StoreList />
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          变更历史
        </span>
      ),
      children: <StoreHistory />
    },
    {
      key: 'stats',
      label: (
        <span>
          <LineChartOutlined />
          数据统计
        </span>
      ),
      children: <StoreStats />
    }
  ]

  if (embedded) {
    return (
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        tabBarGutter={32}
        items={tabs}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="门店档案管理"
        description="管理门店基础信息、档案资料、变更历史等门店全生命周期数据"
        breadcrumbs={[{ title: '门店档案' }]}
      />

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarGutter={32}
          items={tabs}
        />
      </Card>
    </div>
  )
}

export default StoreFilesIndex