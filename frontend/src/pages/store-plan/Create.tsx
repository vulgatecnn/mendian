import React from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import { useStorePlanStore } from '@/stores/storePlanStore'
import PlanForm from './components/PlanForm'
import type { CreateStorePlanDto } from '@/services/types'

const StorePlanCreate: React.FC = () => {
  const navigate = useNavigate()
  const { createStorePlan, isSubmitting } = useStorePlanStore()

  const handleSubmit = async (values: CreateStorePlanDto) => {
    const result = await createStorePlan(values)
    if (result) {
      navigate('/store-plan')
    }
  }

  return (
    <div>
      <PageHeader
        title="创建开店计划"
        breadcrumbs={[
          { title: '开店计划', path: '/store-plan' },
          { title: '创建计划' }
        ]}
        onBack={() => navigate('/store-plan')}
      />

      <PlanForm
        onSubmit={handleSubmit}
        loading={isSubmitting}
      />
    </div>
  )
}

export default StorePlanCreate