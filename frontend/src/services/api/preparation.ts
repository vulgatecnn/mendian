import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse,
  PreparationProject,
  ProjectPhase,
  ProjectTask,
  ProjectVendor,
  ProjectDocument
} from '../types'

// 筹备项目查询参数
export interface PreparationProjectQueryParams {
  page?: number
  pageSize?: number
  storePlanId?: string
  candidateLocationId?: string
  projectManager?: string
  status?: PreparationProject['status']
  startDate?: string
  endDate?: string
  keyword?: string
}

// 项目任务查询参数
export interface ProjectTaskQueryParams {
  page?: number
  pageSize?: number
  projectId?: string
  phaseId?: string
  assignee?: string
  status?: ProjectTask['status']
  priority?: ProjectTask['priority']
  dueDate?: string
  keyword?: string
}

// 项目供应商查询参数
export interface ProjectVendorQueryParams {
  page?: number
  pageSize?: number
  projectId?: string
  category?: ProjectVendor['category']
  status?: ProjectVendor['status']
  keyword?: string
}

/**
 * 开店筹备管理API服务
 */
export class PreparationApiService {
  // ==================== 筹备项目管理 ====================

  /**
   * 获取筹备项目列表
   */
  static async getPreparationProjects(
    params?: PreparationProjectQueryParams
  ): Promise<PaginationResponse<PreparationProject>> {
    return httpClient.get<PreparationProject[]>(
      buildUrl(API_PATHS.PREPARATION.PROJECTS, undefined, params)
    )
  }

  /**
   * 获取筹备项目详情
   */
  static async getPreparationProject(id: string): Promise<BaseResponse<PreparationProject>> {
    return httpClient.get<PreparationProject>(
      buildUrl(API_PATHS.PREPARATION.PROJECT_DETAIL, { id })
    )
  }

  /**
   * 创建筹备项目
   */
  static async createPreparationProject(data: {
    storePlanId: string
    candidateLocationId: string
    projectManager: string
    startDate: string
    targetCompletionDate: string
    budget: number
    description?: string
  }): Promise<BaseResponse<PreparationProject>> {
    return httpClient.post<PreparationProject>(API_PATHS.PREPARATION.CREATE_PROJECT, data, {
      timeout: 15000
    })
  }

  /**
   * 更新筹备项目
   */
  static async updatePreparationProject(
    id: string,
    data: {
      projectManager?: string
      startDate?: string
      targetCompletionDate?: string
      actualCompletionDate?: string
      budget?: number
      actualCost?: number
      status?: PreparationProject['status']
      description?: string
    }
  ): Promise<BaseResponse<PreparationProject>> {
    return httpClient.put<PreparationProject>(
      buildUrl(API_PATHS.PREPARATION.UPDATE_PROJECT, { id }),
      data
    )
  }

  /**
   * 删除筹备项目
   */
  static async deletePreparationProject(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.PREPARATION.DELETE_PROJECT, { id }))
  }

  /**
   * 更新项目进度
   */
  static async updateProjectProgress(
    id: string,
    data: {
      currentPhaseId?: string
      completedPhases: string[]
      notes?: string
    }
  ): Promise<BaseResponse<PreparationProject>> {
    return httpClient.patch<PreparationProject>(
      `${buildUrl(API_PATHS.PREPARATION.PROJECT_DETAIL, { id })}/progress`,
      data
    )
  }

  // ==================== 项目阶段管理 ====================

  /**
   * 获取项目阶段列表
   */
  static async getProjectPhases(projectId: string): Promise<BaseResponse<ProjectPhase[]>> {
    return httpClient.get<ProjectPhase[]>(`/preparation/projects/${projectId}/phases`)
  }

  /**
   * 创建项目阶段
   */
  static async createProjectPhase(
    projectId: string,
    data: {
      name: string
      description?: string
      startDate: string
      endDate: string
      responsible: string
      dependencies?: string[] // 依赖的前置阶段ID
    }
  ): Promise<BaseResponse<ProjectPhase>> {
    return httpClient.post<ProjectPhase>(`/preparation/projects/${projectId}/phases`, data)
  }

  /**
   * 更新项目阶段
   */
  static async updateProjectPhase(
    projectId: string,
    phaseId: string,
    data: {
      name?: string
      description?: string
      startDate?: string
      endDate?: string
      actualEndDate?: string
      status?: ProjectPhase['status']
      responsible?: string
      notes?: string
    }
  ): Promise<BaseResponse<ProjectPhase>> {
    return httpClient.put<ProjectPhase>(
      `/preparation/projects/${projectId}/phases/${phaseId}`,
      data
    )
  }

  /**
   * 删除项目阶段
   */
  static async deleteProjectPhase(projectId: string, phaseId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/preparation/projects/${projectId}/phases/${phaseId}`)
  }

  /**
   * 开始阶段
   */
  static async startPhase(projectId: string, phaseId: string): Promise<BaseResponse<ProjectPhase>> {
    return httpClient.post<ProjectPhase>(
      `/preparation/projects/${projectId}/phases/${phaseId}/start`
    )
  }

  /**
   * 完成阶段
   */
  static async completePhase(
    projectId: string,
    phaseId: string,
    data?: {
      actualEndDate?: string
      notes?: string
      attachments?: string[]
    }
  ): Promise<BaseResponse<ProjectPhase>> {
    return httpClient.post<ProjectPhase>(
      `/preparation/projects/${projectId}/phases/${phaseId}/complete`,
      data
    )
  }

  // ==================== 项目任务管理 ====================

  /**
   * 获取项目任务列表
   */
  static async getProjectTasks(
    params?: ProjectTaskQueryParams
  ): Promise<PaginationResponse<ProjectTask>> {
    return httpClient.get<ProjectTask[]>(buildUrl('/preparation/tasks', undefined, params))
  }

  /**
   * 获取阶段任务列表
   */
  static async getPhaseTask(
    projectId: string,
    phaseId: string
  ): Promise<BaseResponse<ProjectTask[]>> {
    return httpClient.get<ProjectTask[]>(
      `/preparation/projects/${projectId}/phases/${phaseId}/tasks`
    )
  }

  /**
   * 创建项目任务
   */
  static async createProjectTask(
    projectId: string,
    phaseId: string,
    data: {
      name: string
      description?: string
      priority: ProjectTask['priority']
      assignee: string
      dueDate: string
      estimatedHours?: number
      dependencies?: string[] // 依赖的前置任务ID
    }
  ): Promise<BaseResponse<ProjectTask>> {
    return httpClient.post<ProjectTask>(
      `/preparation/projects/${projectId}/phases/${phaseId}/tasks`,
      data
    )
  }

  /**
   * 更新项目任务
   */
  static async updateProjectTask(
    taskId: string,
    data: {
      name?: string
      description?: string
      priority?: ProjectTask['priority']
      assignee?: string
      dueDate?: string
      status?: ProjectTask['status']
      completedAt?: string
      actualHours?: number
      notes?: string
    }
  ): Promise<BaseResponse<ProjectTask>> {
    return httpClient.put<ProjectTask>(`/preparation/tasks/${taskId}`, data)
  }

  /**
   * 删除项目任务
   */
  static async deleteProjectTask(taskId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/preparation/tasks/${taskId}`)
  }

  /**
   * 完成任务
   */
  static async completeTask(
    taskId: string,
    data?: {
      completedAt?: string
      actualHours?: number
      notes?: string
      attachments?: string[]
    }
  ): Promise<BaseResponse<ProjectTask>> {
    return httpClient.post<ProjectTask>(`/preparation/tasks/${taskId}/complete`, data)
  }

  /**
   * 分配任务
   */
  static async assignTask(
    taskId: string,
    assignee: string,
    notes?: string
  ): Promise<BaseResponse<ProjectTask>> {
    return httpClient.post<ProjectTask>(`/preparation/tasks/${taskId}/assign`, {
      assignee,
      notes
    })
  }

  // ==================== 项目供应商管理 ====================

  /**
   * 获取项目供应商列表
   */
  static async getProjectVendors(
    params?: ProjectVendorQueryParams
  ): Promise<PaginationResponse<ProjectVendor>> {
    return httpClient.get<ProjectVendor[]>(buildUrl('/preparation/vendors', undefined, params))
  }

  /**
   * 添加项目供应商
   */
  static async addProjectVendor(
    projectId: string,
    data: {
      name: string
      contact: string
      phone: string
      email?: string
      category: ProjectVendor['category']
      contractAmount: number
      description?: string
    }
  ): Promise<BaseResponse<ProjectVendor>> {
    return httpClient.post<ProjectVendor>(`/preparation/projects/${projectId}/vendors`, data)
  }

  /**
   * 更新项目供应商
   */
  static async updateProjectVendor(
    projectId: string,
    vendorId: string,
    data: {
      name?: string
      contact?: string
      phone?: string
      email?: string
      category?: ProjectVendor['category']
      contractAmount?: number
      status?: ProjectVendor['status']
      description?: string
    }
  ): Promise<BaseResponse<ProjectVendor>> {
    return httpClient.put<ProjectVendor>(
      `/preparation/projects/${projectId}/vendors/${vendorId}`,
      data
    )
  }

  /**
   * 删除项目供应商
   */
  static async deleteProjectVendor(
    projectId: string,
    vendorId: string
  ): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/preparation/projects/${projectId}/vendors/${vendorId}`)
  }

  /**
   * 供应商报价
   */
  static async submitVendorQuote(
    projectId: string,
    vendorId: string,
    data: {
      quotedAmount: number
      validUntil: string
      notes?: string
      attachments?: string[]
    }
  ): Promise<
    BaseResponse<{
      id: string
      quotedAmount: number
      validUntil: string
      submittedAt: string
    }>
  > {
    return httpClient.post<{
      id: string
      quotedAmount: number
      validUntil: string
      submittedAt: string
    }>(`/preparation/projects/${projectId}/vendors/${vendorId}/quote`, data)
  }

  /**
   * 选择供应商
   */
  static async selectVendor(
    projectId: string,
    vendorId: string,
    notes?: string
  ): Promise<BaseResponse<ProjectVendor>> {
    return httpClient.post<ProjectVendor>(
      `/preparation/projects/${projectId}/vendors/${vendorId}/select`,
      {
        notes
      }
    )
  }

  // ==================== 项目文档管理 ====================

  /**
   * 获取项目文档列表
   */
  static async getProjectDocuments(
    projectId: string,
    params?: {
      type?: ProjectDocument['type']
      keyword?: string
    }
  ): Promise<BaseResponse<ProjectDocument[]>> {
    return httpClient.get<ProjectDocument[]>(
      buildUrl(`/preparation/projects/${projectId}/documents`, undefined, params)
    )
  }

  /**
   * 上传项目文档
   */
  static async uploadProjectDocument(
    projectId: string,
    file: File,
    data: {
      name: string
      type: ProjectDocument['type']
      description?: string
      category?: string
    }
  ): Promise<BaseResponse<ProjectDocument>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', data.name)
    formData.append('type', data.type)
    if (data.description) formData.append('description', data.description)
    if (data.category) formData.append('category', data.category)

    return httpClient.upload<ProjectDocument>(
      `/preparation/projects/${projectId}/documents`,
      formData
    )
  }

  /**
   * 更新项目文档
   */
  static async updateProjectDocument(
    projectId: string,
    documentId: string,
    data: {
      name?: string
      type?: ProjectDocument['type']
      description?: string
      category?: string
    }
  ): Promise<BaseResponse<ProjectDocument>> {
    return httpClient.put<ProjectDocument>(
      `/preparation/projects/${projectId}/documents/${documentId}`,
      data
    )
  }

  /**
   * 删除项目文档
   */
  static async deleteProjectDocument(
    projectId: string,
    documentId: string
  ): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/preparation/projects/${projectId}/documents/${documentId}`)
  }

  /**
   * 下载项目文档
   */
  static async downloadProjectDocument(
    projectId: string,
    documentId: string,
    filename?: string
  ): Promise<void> {
    await httpClient.download(
      `/preparation/projects/${projectId}/documents/${documentId}/download`,
      filename
    )
  }

  // ==================== 工程管理 ====================

  /**
   * 获取工程信息
   */
  static async getEngineering(projectId: string): Promise<
    BaseResponse<{
      id: string
      projectId: string
      contractor: string
      contractorContact: string
      contractAmount: number
      startDate: string
      targetEndDate: string
      actualEndDate?: string
      status: 'planning' | 'in_progress' | 'completed' | 'suspended'
      progress: number
      qualityScore?: number
      safetyScore?: number
      inspections: Array<{
        id: string
        type: 'quality' | 'safety' | 'progress'
        result: 'passed' | 'failed' | 'conditional'
        score?: number
        issues?: string[]
        inspectedBy: string
        inspectedAt: string
      }>
      milestones: Array<{
        id: string
        name: string
        targetDate: string
        actualDate?: string
        status: 'pending' | 'completed' | 'delayed'
      }>
    }>
  > {
    return httpClient.get<{
      id: string
      projectId: string
      contractor: string
      contractorContact: string
      contractAmount: number
      startDate: string
      targetEndDate: string
      actualEndDate?: string
      status: 'planning' | 'in_progress' | 'completed' | 'suspended'
      progress: number
      qualityScore?: number
      safetyScore?: number
      inspections: Array<{
        id: string
        type: 'quality' | 'safety' | 'progress'
        result: 'passed' | 'failed' | 'conditional'
        score?: number
        issues?: string[]
        inspectedBy: string
        inspectedAt: string
      }>
      milestones: Array<{
        id: string
        name: string
        targetDate: string
        actualDate?: string
        status: 'pending' | 'completed' | 'delayed'
      }>
    }>(`/preparation/projects/${projectId}/engineering`)
  }

  /**
   * 更新工程进度
   */
  static async updateEngineeringProgress(
    projectId: string,
    data: {
      progress: number
      notes?: string
      photos?: string[]
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.patch<null>(`/preparation/projects/${projectId}/engineering/progress`, data)
  }

  /**
   * 创建工程检查
   */
  static async createEngineeeringInspection(
    projectId: string,
    data: {
      type: 'quality' | 'safety' | 'progress'
      result: 'passed' | 'failed' | 'conditional'
      score?: number
      issues?: string[]
      notes?: string
      photos?: string[]
    }
  ): Promise<
    BaseResponse<{
      id: string
      type: string
      result: string
      score?: number
      inspectedBy: string
      inspectedAt: string
    }>
  > {
    return httpClient.post<{
      id: string
      type: string
      result: string
      score?: number
      inspectedBy: string
      inspectedAt: string
    }>(`/preparation/projects/${projectId}/engineering/inspections`, data)
  }

  // ==================== 验收管理 ====================

  /**
   * 获取验收信息
   */
  static async getAcceptance(projectId: string): Promise<
    BaseResponse<{
      id: string
      projectId: string
      status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional'
      overallScore?: number
      acceptanceItems: Array<{
        id: string
        category: string
        name: string
        standard: string
        actualValue?: string
        result: 'passed' | 'failed' | 'not_tested'
        notes?: string
        photos?: string[]
      }>
      issues: Array<{
        id: string
        severity: 'low' | 'medium' | 'high' | 'critical'
        description: string
        location?: string
        status: 'open' | 'resolved' | 'deferred'
        assignee?: string
        dueDate?: string
        resolvedAt?: string
      }>
      acceptedBy?: string
      acceptedAt?: string
    }>
  > {
    return httpClient.get<{
      id: string
      projectId: string
      status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional'
      overallScore?: number
      acceptanceItems: Array<{
        id: string
        category: string
        name: string
        standard: string
        actualValue?: string
        result: 'passed' | 'failed' | 'not_tested'
        notes?: string
        photos?: string[]
      }>
      issues: Array<{
        id: string
        severity: 'low' | 'medium' | 'high' | 'critical'
        description: string
        location?: string
        status: 'open' | 'resolved' | 'deferred'
        assignee?: string
        dueDate?: string
        resolvedAt?: string
      }>
      acceptedBy?: string
      acceptedAt?: string
    }>(`/preparation/projects/${projectId}/acceptance`)
  }

  /**
   * 开始验收
   */
  static async startAcceptance(projectId: string): Promise<BaseResponse<null>> {
    return httpClient.post<null>(`/preparation/projects/${projectId}/acceptance/start`)
  }

  /**
   * 提交验收项结果
   */
  static async submitAcceptanceItem(
    projectId: string,
    itemId: string,
    data: {
      actualValue?: string
      result: 'passed' | 'failed' | 'not_tested'
      notes?: string
      photos?: string[]
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.patch<null>(
      `/preparation/projects/${projectId}/acceptance/items/${itemId}`,
      data
    )
  }

  /**
   * 创建验收问题
   */
  static async createAcceptanceIssue(
    projectId: string,
    data: {
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      location?: string
      assignee?: string
      dueDate?: string
      photos?: string[]
    }
  ): Promise<
    BaseResponse<{
      id: string
      severity: string
      description: string
      status: string
      createdAt: string
    }>
  > {
    return httpClient.post<{
      id: string
      severity: string
      description: string
      status: string
      createdAt: string
    }>(`/preparation/projects/${projectId}/acceptance/issues`, data)
  }

  /**
   * 解决验收问题
   */
  static async resolveAcceptanceIssue(
    projectId: string,
    issueId: string,
    data: {
      resolution: string
      photos?: string[]
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.patch<null>(
      `/preparation/projects/${projectId}/acceptance/issues/${issueId}/resolve`,
      data
    )
  }

  /**
   * 完成验收
   */
  static async completeAcceptance(
    projectId: string,
    data: {
      passed: boolean
      overallScore?: number
      notes?: string
      conditions?: string[] // 有条件通过的条件
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.post<null>(`/preparation/projects/${projectId}/acceptance/complete`, data)
  }

  // ==================== 交付管理 ====================

  /**
   * 获取交付信息
   */
  static async getDelivery(projectId: string): Promise<
    BaseResponse<{
      id: string
      projectId: string
      status: 'preparing' | 'ready' | 'delivered' | 'rejected'
      deliverables: Array<{
        id: string
        name: string
        type: 'document' | 'equipment' | 'key' | 'certificate' | 'other'
        description?: string
        status: 'pending' | 'ready' | 'delivered'
        url?: string
      }>
      deliveredTo?: string
      deliveredToName?: string
      deliveredAt?: string
      receivedBy?: string
      receivedByName?: string
      receivedAt?: string
      notes?: string
    }>
  > {
    return httpClient.get<{
      id: string
      projectId: string
      status: 'preparing' | 'ready' | 'delivered' | 'rejected'
      deliverables: Array<{
        id: string
        name: string
        type: 'document' | 'equipment' | 'key' | 'certificate' | 'other'
        description?: string
        status: 'pending' | 'ready' | 'delivered'
        url?: string
      }>
      deliveredTo?: string
      deliveredToName?: string
      deliveredAt?: string
      receivedBy?: string
      receivedByName?: string
      receivedAt?: string
      notes?: string
    }>(`/preparation/projects/${projectId}/delivery`)
  }

  /**
   * 准备交付
   */
  static async prepareDelivery(
    projectId: string,
    data: {
      deliverables: Array<{
        name: string
        type: 'document' | 'equipment' | 'key' | 'certificate' | 'other'
        description?: string
        url?: string
      }>
      deliveredTo: string
      notes?: string
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.post<null>(`/preparation/projects/${projectId}/delivery/prepare`, data)
  }

  /**
   * 确认交付
   */
  static async confirmDelivery(projectId: string): Promise<BaseResponse<null>> {
    return httpClient.post<null>(`/preparation/projects/${projectId}/delivery/confirm`)
  }

  /**
   * 接收交付
   */
  static async receiveDelivery(
    projectId: string,
    data: {
      received: boolean
      notes?: string
      issues?: string[]
    }
  ): Promise<BaseResponse<null>> {
    return httpClient.post<null>(`/preparation/projects/${projectId}/delivery/receive`, data)
  }

  // ==================== 统计分析 ====================

  /**
   * 获取筹备统计
   */
  static async getPreparationStats(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    projectManager?: string
    status?: PreparationProject['status']
    startDate?: string
    endDate?: string
  }): Promise<
    BaseResponse<{
      total: number
      byStatus: Record<PreparationProject['status'], number>
      averageDuration: number
      averageBudget: number
      averageActualCost: number
      budgetVariance: number
      timeline: Array<{
        date: string
        started: number
        completed: number
      }>
      topDelayReasons: Array<{
        reason: string
        count: number
      }>
    }>
  > {
    return httpClient.get<{
      total: number
      byStatus: Record<PreparationProject['status'], number>
      averageDuration: number
      averageBudget: number
      averageActualCost: number
      budgetVariance: number
      timeline: Array<{
        date: string
        started: number
        completed: number
      }>
      topDelayReasons: Array<{
        reason: string
        count: number
      }>
    }>(buildUrl('/preparation/stats', undefined, params))
  }

  /**
   * 获取相关数据选项
   */
  static async getOptions(): Promise<
    BaseResponse<{
      statuses: Array<{ value: PreparationProject['status']; label: string }>
      taskStatuses: Array<{ value: ProjectTask['status']; label: string }>
      taskPriorities: Array<{ value: ProjectTask['priority']; label: string }>
      vendorCategories: Array<{ value: ProjectVendor['category']; label: string }>
      vendorStatuses: Array<{ value: ProjectVendor['status']; label: string }>
      documentTypes: Array<{ value: ProjectDocument['type']; label: string }>
      users: Array<{ id: string; name: string; department: string }>
      contractors: Array<{ id: string; name: string; contact: string }>
    }>
  > {
    return httpClient.get<{
      statuses: Array<{ value: PreparationProject['status']; label: string }>
      taskStatuses: Array<{ value: ProjectTask['status']; label: string }>
      taskPriorities: Array<{ value: ProjectTask['priority']; label: string }>
      vendorCategories: Array<{ value: ProjectVendor['category']; label: string }>
      vendorStatuses: Array<{ value: ProjectVendor['status']; label: string }>
      documentTypes: Array<{ value: ProjectDocument['type']; label: string }>
      users: Array<{ id: string; name: string; department: string }>
      contractors: Array<{ id: string; name: string; contact: string }>
    }>('/preparation/options')
  }
}
