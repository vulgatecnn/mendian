import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Alert, Spin } from 'antd'
import PageHeader from '@/components/common/PageHeader'
import { useStorePlanStore } from '@/stores/storePlanStore'
import PlanForm from './components/PlanForm'
import type { UpdateStorePlanDto } from '@/services/types'

const StorePlanEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    currentStorePlan, 
    fetchStorePlan, 
    updateStorePlan, 
    isLoading, 
    isSubmitting 
  } = useStorePlanStore()

  useEffect(() => {
    if (id) {
      fetchStorePlan(id)
    }
  }, [id, fetchStorePlan])

  const handleSubmit = async (values: UpdateStorePlanDto) => {
    if (id) {
      const result = await updateStorePlan(id, values)
      if (result) {
        navigate(`/store-plan/${id}`)
      }
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!currentStorePlan) {
    return (
      <Card>
        <Alert
          message="计划不存在"
          description="您访问的开店计划不存在或已被删除"
          type="error"
          showIcon
        />
      </Card>
    )
  }

  // 检查是否可编辑
  const canEdit = currentStorePlan.status === 'draft' || currentStorePlan.status === 'pending'
  if (!canEdit) {
    return (
      <div>
        <PageHeader
          title="编辑开店计划"
          breadcrumbs={[
            { title: '开店计划', path: '/store-plan' },
            { title: currentStorePlan.name, path: `/store-plan/${id}` },
            { title: '编辑' }
          ]}
          onBack={() => navigate(`/store-plan/${id}`)}
        />
        <Card>
          <Alert
            message="无法编辑"
            description={`当前计划状态为"${
              currentStorePlan.status === 'approved' ? '已批准' : 
              currentStorePlan.status === 'in_progress' ? '进行中' : 
              currentStorePlan.status === 'completed' ? '已完成' : '未知状态'
            }"，无法进行编辑`}
            type="warning"
            showIcon
          />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="编辑开店计划"
        description={`编辑计划：${currentStorePlan.name}`}
        breadcrumbs={[
          { title: '开店计划', path: '/store-plan' },
          { title: currentStorePlan.name, path: `/store-plan/${id}` },
          { title: '编辑' }
        ]}
        onBack={() => navigate(`/store-plan/${id}`)}
      />

      <PlanForm
        initialValues={currentStorePlan}
        isEdit={true}
        onSubmit={handleSubmit}
        loading={isSubmitting}
      />
    </div>
  )
}

export default StorePlanEdit