/**
 * 审批项工厂函数
 */
import { faker } from '@faker-js/faker'

interface ApprovalItem {
  id: string
  title: string
  code: string
  type: 'store_report' | 'license_application' | 'price_comparison' | 'contract_approval' | 'budget_approval' | 'supplier_approval' | 'other'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  content: Record<string, any>
  submittedAt: string
  submittedBy: string
  submittedByName: string
  submittedByDepartment: string
  completedAt: string | null
  approvalFlow: Array<{
    id: string
    stepName: string
    approver: string
    approverName: string
    approverDepartment: string
    status: 'pending' | 'approved' | 'rejected' | 'waiting'
    order: number
    requiredApprovals: number
    actualApprovals: number
    comment?: string
    processedAt?: string
    processor?: string
    processorName?: string
    createdAt: string | null
    deadline: string | null
  }>
  attachments: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
    uploadedAt: string
  }>
  relatedStoreId?: string
  relatedStoreName?: string
  amount?: number
  urgencyReason?: string
  createdAt: string
  updatedAt: string
}

const approvalTypes = [
  'store_report', 'license_application', 'price_comparison', 
  'contract_approval', 'budget_approval', 'supplier_approval', 'other'
]
const statuses = ['pending', 'approved', 'rejected', 'cancelled']
const priorities = ['high', 'medium', 'low']
const departments = ['运营部', '财务部', '法务部', '采购部', '工程部', '人力资源部']

const approvalSteps = {
  store_report: [
    { name: '区域经理审批', department: '运营部' },
    { name: '运营总监审批', department: '运营部' },
    { name: '总经理审批', department: '总裁办' }
  ],
  license_application: [
    { name: '部门经理审批', department: '运营部' },
    { name: '法务审批', department: '法务部' },
    { name: '财务总监审批', department: '财务部' }
  ],
  price_comparison: [
    { name: '采购经理审批', department: '采购部' },
    { name: '财务审批', department: '财务部' }
  ],
  contract_approval: [
    { name: '法务审批', department: '法务部' },
    { name: '财务审批', department: '财务部' },
    { name: '总经理审批', department: '总裁办' }
  ],
  budget_approval: [
    { name: '部门经理审批', department: '财务部' },
    { name: '财务总监审批', department: '财务部' }
  ],
  supplier_approval: [
    { name: '采购经理审批', department: '采购部' },
    { name: '质量部审批', department: '质量部' },
    { name: '财务审批', department: '财务部' }
  ],
  other: [
    { name: '部门经理审批', department: '运营部' },
    { name: '总监审批', department: '运营部' }
  ]
}

const generateApprovalContent = (type: string) => {
  switch (type) {
    case 'store_report':
      return {
        storeName: `好饭碗${faker.location.city()}店`,
        location: faker.location.streetAddress(),
        area: Math.floor(Math.random() * 300) + 100,
        rentCost: Math.floor(Math.random() * 20000) + 5000,
        expectedRevenue: Math.floor(Math.random() * 100000) + 80000,
        investmentAmount: Math.floor(Math.random() * 500000) + 200000,
        reason: '该地段人流量大，商业氛围浓厚，具有良好的发展前景'
      }
    case 'license_application':
      return {
        licenseType: faker.helpers.arrayElement(['食品经营许可证', '营业执照', '消防许可证']),
        applicationReason: '新店开业需要办理相关证照',
        urgencyLevel: faker.helpers.arrayElement(['高', '中', '低']),
        expectedDate: faker.date.future().toISOString().split('T')[0]
      }
    case 'price_comparison':
      return {
        purchaseItem: faker.helpers.arrayElement(['厨房设备', '餐具用品', '装修材料', '收银系统']),
        suppliers: Array.from({ length: 3 }, (_, i) => ({
          name: `${faker.company.name()}有限公司`,
          price: Math.floor(Math.random() * 50000) + 10000,
          quality: faker.helpers.arrayElement(['优', '良', '一般']),
          deliveryTime: Math.floor(Math.random() * 15) + 5
        })),
        recommendedSupplier: 0,
        totalAmount: Math.floor(Math.random() * 100000) + 20000
      }
    case 'budget_approval':
      return {
        projectName: faker.helpers.arrayElement(['门店装修', '设备采购', '营销推广', '人员培训']),
        budgetAmount: Math.floor(Math.random() * 200000) + 50000,
        category: faker.helpers.arrayElement(['固定资产', '运营费用', '营销费用', '人员费用']),
        urgencyLevel: faker.helpers.arrayElement(['紧急', '一般', '不紧急']),
        expectedStartDate: faker.date.future().toISOString().split('T')[0],
        justification: '项目对业务发展具有重要意义，需要及时执行'
      }
    default:
      return {
        description: faker.lorem.sentences(3),
        amount: Math.floor(Math.random() * 50000),
        reason: faker.lorem.sentence()
      }
  }
}

export function createMockApprovalItems(config: { count: number }): ApprovalItem[] {
  return Array.from({ length: config.count }, (_, index) => {
    const type = faker.helpers.arrayElement(approvalTypes)
    const status = faker.helpers.arrayElement(statuses)
    const priority = faker.helpers.arrayElement(priorities)
    const submittedDate = faker.date.between({ 
      from: new Date('2024-06-01'), 
      to: new Date() 
    })
    
    const steps = approvalSteps[type as keyof typeof approvalSteps] || approvalSteps.other
    const currentStepIndex = status === 'pending' ? 
                            Math.floor(Math.random() * steps.length) : 
                            status === 'approved' ? steps.length : 
                            Math.floor(Math.random() * steps.length)

    const approvalFlow = steps.map((step, idx) => {
      const isCompleted = idx < currentStepIndex || status === 'approved'
      const isCurrent = idx === currentStepIndex && status === 'pending'
      const isPending = status === 'pending' && idx === currentStepIndex
      const isWaiting = idx > currentStepIndex

      return {
        id: faker.string.uuid(),
        stepName: step.name,
        approver: faker.string.uuid(),
        approverName: faker.person.fullName(),
        approverDepartment: step.department,
        status: isCompleted ? 'approved' : 
                isPending ? 'pending' : 
                status === 'rejected' && isCurrent ? 'rejected' : 'waiting',
        order: idx + 1,
        requiredApprovals: 1,
        actualApprovals: isCompleted || (isPending && Math.random() > 0.7) ? 1 : 0,
        comment: isCompleted ? faker.helpers.arrayElement(['同意', '批准', '通过']) : 
                status === 'rejected' && isCurrent ? '需要补充更多信息' : undefined,
        processedAt: isCompleted ? 
                     faker.date.between({ from: submittedDate, to: new Date() }).toISOString() : 
                     undefined,
        processor: isCompleted ? faker.string.uuid() : undefined,
        processorName: isCompleted ? faker.person.fullName() : undefined,
        createdAt: idx === 0 ? submittedDate.toISOString() : 
                  isCompleted || isCurrent ? 
                  faker.date.between({ from: submittedDate, to: new Date() }).toISOString() : 
                  null,
        deadline: isPending || isCurrent ? 
                 new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : 
                 null
      }
    })

    const content = generateApprovalContent(type)

    return {
      id: faker.string.uuid(),
      title: `${type === 'store_report' ? '新店报备' :
              type === 'license_application' ? '执照办理' :
              type === 'price_comparison' ? '供应商比价' :
              type === 'contract_approval' ? '合同审批' :
              type === 'budget_approval' ? '预算审批' :
              type === 'supplier_approval' ? '供应商审批' : '其他审批'} - ${faker.lorem.words(2)}`,
      code: `APPROVAL${String(index + 1).padStart(6, '0')}`,
      type,
      status,
      priority,
      content,
      submittedAt: submittedDate.toISOString(),
      submittedBy: faker.string.uuid(),
      submittedByName: faker.person.fullName(),
      submittedByDepartment: faker.helpers.arrayElement(departments),
      completedAt: status === 'approved' || status === 'rejected' ? 
                   faker.date.between({ from: submittedDate, to: new Date() }).toISOString() : 
                   null,
      approvalFlow,
      attachments: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
        id: faker.string.uuid(),
        name: `${faker.system.fileName()}.pdf`,
        type: 'application/pdf',
        size: Math.floor(Math.random() * 5000000) + 100000,
        url: faker.internet.url(),
        uploadedAt: faker.date.between({ from: submittedDate, to: new Date() }).toISOString()
      })),
      relatedStoreId: Math.random() > 0.3 ? faker.string.uuid() : undefined,
      relatedStoreName: Math.random() > 0.3 ? `好饭碗${faker.location.city()}店` : undefined,
      amount: 'amount' in content ? content.amount : Math.floor(Math.random() * 100000),
      urgencyReason: priority === 'high' ? '业务急需，请尽快处理' : undefined,
      createdAt: submittedDate.toISOString(),
      updatedAt: faker.date.between({ from: submittedDate, to: new Date() }).toISOString()
    }
  })
}