import React from 'react'
import { Card } from 'antd'
import PageHeader from '@/components/common/PageHeader'

const PreparationList: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="开店筹备"
        description="管理工程管理、交付管理、筹备进度等开店筹备相关事务"
        breadcrumbs={[{ title: '开店筹备' }]}
      />

      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>开店筹备功能开发中...</p>
        </div>
      </Card>
    </div>
  )
}

export default PreparationList
