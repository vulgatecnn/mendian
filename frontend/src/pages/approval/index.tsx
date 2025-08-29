import React, { useState } from 'react'
import { Tabs, Card } from 'antd'
import {
  AuditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import PendingApprovals from './PendingApprovals'
import ProcessedApprovals from './ProcessedApprovals'
import ApprovalTemplates from './ApprovalTemplates'
import ApprovalStats from './ApprovalStats'

interface ApprovalIndexProps {
  embedded?: boolean
}

const ApprovalIndex: React.FC<ApprovalIndexProps> = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('pending')

  const tabs = [
    {
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined />
          待办审批
        </span>
      ),
      children: <PendingApprovals />
    },
    {
      key: 'processed',
      label: (
        <span>
          <CheckCircleOutlined />
          已办审批
        </span>
      ),
      children: <ProcessedApprovals />
    },
    {
      key: 'templates',
      label: (
        <span>
          <SettingOutlined />
          审批模板
        </span>
      ),
      children: <ApprovalTemplates />
    },
    {
      key: 'stats',
      label: (
        <span>
          <BarChartOutlined />
          审批统计
        </span>
      ),
      children: <ApprovalStats />
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
        title="审批中心"
        description="管理各类业务审批流程，包括报店审批、执照审批、比价审批等全流程审批管理"
        breadcrumbs={[{ title: '审批中心' }]}
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

export default ApprovalIndex