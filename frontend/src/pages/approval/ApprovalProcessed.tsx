/**
 * 已办审批列表页面
 */
import React from 'react'
import ApprovalList from './components/ApprovalList'

const ApprovalProcessed: React.FC = () => {
  return <ApprovalList type="processed" title="已办审批" />
}

export default ApprovalProcessed
