import React from 'react'
import { Card } from 'antd'
import PageHeader from '@/components/common/PageHeader'

const ApprovalList: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="审批中心"
        description="管理待办审批、审批历史、审批模板等审批相关事务"
        breadcrumbs={[{ title: '审批中心' }]}
      />

      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>审批中心功能开发中...</p>
        </div>
      </Card>
    </div>
  )
}

export default ApprovalList
