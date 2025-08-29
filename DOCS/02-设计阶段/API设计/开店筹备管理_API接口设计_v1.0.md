# 开店筹备管理 - API接口设计文档

## 文档信息

- **版本**: v1.0
- **创建日期**: 2025-08-29
- **作者**: 后端架构师
- **文档类型**: API接口设计

## 1. 概述

本文档定义了开店筹备管理模块的RESTful API接口设计，包括筹备项目、工程任务、设备采购、证照办理、人员招聘和里程碑跟踪等核心功能的完整API规范。

### 1.1 设计原则

- **RESTful风格**: 遵循REST架构原则，使用HTTP方法语义
- **统一响应格式**: 统一的成功/错误响应结构
- **版本控制**: 使用URL路径进行API版本管理
- **安全认证**: 基于JWT的身份认证和权限控制
- **数据验证**: 完整的请求参数验证和错误处理
- **分页支持**: 列表接口统一支持分页和排序

### 1.2 基础信息

- **Base URL**: `https://api.mendian.com/api/v1`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8
- **时区**: UTC (前端转换为本地时间)

## 2. 统一响应格式

### 2.1 成功响应

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo; // 仅列表接口
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### 2.2 错误响应

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string; // 验证错误时的字段名
  };
}
```

### 2.3 HTTP状态码规范

- `200 OK`: 成功获取资源
- `201 Created`: 成功创建资源
- `204 No Content`: 成功删除资源或无内容返回
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或认证失败
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突（如重复创建）
- `422 Unprocessable Entity`: 数据验证错误
- `500 Internal Server Error`: 服务器内部错误

## 3. 筹备项目管理 API

### 3.1 创建筹备项目

```http
POST /preparation/projects
Content-Type: application/json
Authorization: Bearer <token>

{
  "candidateLocationId": "clx123...",
  "projectName": "北京海淀店筹备项目",
  "storeCode": "BJ001",
  "storeName": "好饭碗北京海淀店",
  "priority": "HIGH",
  "plannedStartDate": "2024-01-15T00:00:00Z",
  "plannedEndDate": "2024-03-15T00:00:00Z",
  "budget": 500000.00,
  "description": "北京海淀区新店筹备项目",
  "notes": "重点项目，需要加快进度",
  "managerId": "clx456..."
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "clx789...",
    "projectCode": "PREP-2024-001",
    "projectName": "北京海淀店筹备项目",
    "candidateLocationId": "clx123...",
    "storeCode": "BJ001",
    "storeName": "好饭碗北京海淀店",
    "status": "PLANNING",
    "priority": "HIGH",
    "plannedStartDate": "2024-01-15T00:00:00Z",
    "plannedEndDate": "2024-03-15T00:00:00Z",
    "actualStartDate": null,
    "actualEndDate": null,
    "budget": 500000.00,
    "actualBudget": null,
    "progressPercentage": 0,
    "description": "北京海淀区新店筹备项目",
    "notes": "重点项目，需要加快进度",
    "managerId": "clx456...",
    "approvalFlowId": null,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-10T08:00:00Z"
  },
  "message": "筹备项目创建成功"
}
```

### 3.2 获取筹备项目列表

```http
GET /preparation/projects?page=1&limit=20&status=IN_PROGRESS&priority=HIGH&keyword=北京&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认20，最大100
- `candidateLocationId`: 候选点位ID筛选
- `status`: 状态筛选（PLANNING, APPROVED, IN_PROGRESS, SUSPENDED, COMPLETED, CANCELLED, OVERDUE）
- `priority`: 优先级筛选（URGENT, HIGH, MEDIUM, LOW）
- `managerId`: 项目经理ID筛选
- `plannedStartDateStart`: 计划开始日期起始
- `plannedStartDateEnd`: 计划开始日期结束
- `plannedEndDateStart`: 计划结束日期起始
- `plannedEndDateEnd`: 计划结束日期结束
- `minBudget`: 最小预算
- `maxBudget`: 最大预算
- `minProgress`: 最小进度
- `maxProgress`: 最大进度
- `keyword`: 关键词搜索（项目名称、编号）
- `sortBy`: 排序字段
- `sortOrder`: 排序顺序（asc, desc）

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx789...",
      "projectCode": "PREP-2024-001",
      "projectName": "北京海淀店筹备项目",
      "candidateLocation": {
        "id": "clx123...",
        "name": "海淀区中关村店址",
        "address": "北京市海淀区中关村大街123号"
      },
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "plannedStartDate": "2024-01-15T00:00:00Z",
      "plannedEndDate": "2024-03-15T00:00:00Z",
      "budget": 500000.00,
      "progressPercentage": 35,
      "manager": {
        "id": "clx456...",
        "name": "张项目经理",
        "phone": "13800138000"
      },
      "_count": {
        "engineeringTasks": 5,
        "equipmentProcurements": 12,
        "licenseApplications": 3,
        "staffRecruitments": 2,
        "milestones": 8
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3.3 获取筹备项目详情

```http
GET /preparation/projects/:id
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "clx789...",
    "projectCode": "PREP-2024-001",
    "projectName": "北京海淀店筹备项目",
    "candidateLocation": {
      "id": "clx123...",
      "name": "海淀区中关村店址",
      "address": "北京市海淀区中关村大街123号",
      "coordinates": "39.9042,116.4074"
    },
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "plannedStartDate": "2024-01-15T00:00:00Z",
    "plannedEndDate": "2024-03-15T00:00:00Z",
    "actualStartDate": "2024-01-16T00:00:00Z",
    "actualEndDate": null,
    "budget": 500000.00,
    "actualBudget": 520000.00,
    "progressPercentage": 35,
    "description": "北京海淀区新店筹备项目",
    "notes": "重点项目，需要加快进度",
    "manager": {
      "id": "clx456...",
      "name": "张项目经理",
      "phone": "13800138000",
      "email": "zhang@company.com"
    },
    "approvalFlow": {
      "id": "clx999...",
      "flowNumber": "AF-2024-001",
      "status": "APPROVED",
      "completedAt": "2024-01-14T10:30:00Z"
    },
    "engineeringTasks": [
      {
        "id": "clx111...",
        "projectName": "装修工程",
        "status": "IN_PROGRESS",
        "progressPercentage": 40,
        "supplier": {
          "name": "华美装饰公司",
          "contactPhone": "010-12345678"
        }
      }
    ],
    "equipmentProcurements": [
      {
        "id": "clx222...",
        "equipmentName": "商用冰箱",
        "status": "ORDERED",
        "quantity": 2,
        "totalPrice": 15000.00
      }
    ],
    "licenseApplications": [
      {
        "id": "clx333...",
        "licenseName": "营业执照",
        "status": "UNDER_REVIEW",
        "issuingAuthority": "海淀区市场监督管理局"
      }
    ],
    "staffRecruitments": [
      {
        "id": "clx444...",
        "positionTitle": "店长",
        "status": "INTERVIEWING",
        "plannedCount": 1,
        "recruitedCount": 0
      }
    ],
    "milestones": [
      {
        "id": "clx555...",
        "name": "装修完成",
        "status": "IN_PROGRESS",
        "plannedDate": "2024-02-20T00:00:00Z",
        "actualDate": null
      }
    ],
    "_count": {
      "engineeringTasks": 5,
      "equipmentProcurements": 12,
      "licenseApplications": 3,
      "staffRecruitments": 2,
      "milestones": 8
    },
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

### 3.4 更新筹备项目

```http
PUT /preparation/projects/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "projectName": "北京海淀店筹备项目（更新）",
  "priority": "URGENT",
  "actualBudget": 520000.00,
  "notes": "预算略有超支，但项目进展顺利"
}
```

### 3.5 更新项目进度

```http
PATCH /preparation/projects/:id/progress
Content-Type: application/json
Authorization: Bearer <token>

{
  "progressPercentage": 45,
  "notes": "装修工程已完成40%，设备采购进展顺利",
  "actualBudget": 530000.00
}
```

### 3.6 变更项目状态

```http
PATCH /preparation/projects/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "IN_PROGRESS",
  "reason": "审批通过，项目正式启动",
  "comments": "已通知所有相关人员"
}
```

### 3.7 删除筹备项目

```http
DELETE /preparation/projects/:id
Authorization: Bearer <token>
```

## 4. 设备采购管理 API

### 4.1 创建设备采购

```http
POST /preparation/equipment-procurements
Content-Type: application/json
Authorization: Bearer <token>

{
  "preparationProjectId": "clx789...",
  "category": "KITCHEN",
  "equipmentName": "商用燃气灶",
  "brand": "方太",
  "model": "GT-850",
  "specifications": {
    "power": "8.5kW",
    "size": "800×600×300mm",
    "material": "不锈钢"
  },
  "quantity": 2,
  "unitPrice": 2800.00,
  "totalPrice": 5600.00,
  "priority": "HIGH",
  "plannedDeliveryDate": "2024-02-15T00:00:00Z",
  "warrantyPeriod": 24,
  "supplier": "北京厨具供应商",
  "supplierContact": "李经理 13900139000",
  "deliveryAddress": "北京市海淀区中关村大街123号",
  "installationRequirements": "需要专业燃气管道连接",
  "notes": "优选品牌，质量可靠"
}
```

### 4.2 获取设备采购列表

```http
GET /preparation/equipment-procurements?preparationProjectId=clx789...&category=KITCHEN&status=PENDING&page=1&limit=20
Authorization: Bearer <token>
```

### 4.3 更新设备采购状态

```http
PATCH /preparation/equipment-procurements/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "DELIVERED",
  "actualDeliveryDate": "2024-02-14T14:30:00Z",
  "comments": "设备已送达，外观完好"
}
```

## 5. 证照办理管理 API

### 5.1 创建证照申请

```http
POST /preparation/license-applications
Content-Type: application/json
Authorization: Bearer <token>

{
  "preparationProjectId": "clx789...",
  "licenseType": "BUSINESS",
  "licenseName": "营业执照",
  "issuingAuthority": "海淀区市场监督管理局",
  "priority": "URGENT",
  "applicationFee": 0.00,
  "applicant": "北京好饭碗餐饮有限公司",
  "contactPerson": "王经理",
  "contactPhone": "13800138001",
  "applicationAddress": "北京市海淀区中关村大街123号",
  "requiredDocuments": [
    "公司章程",
    "股东身份证复印件",
    "注册地址证明",
    "法定代表人身份证"
  ],
  "notes": "新店开业必需证照，需加急处理"
}
```

### 5.2 更新证照状态

```http
PATCH /preparation/license-applications/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "ISSUED",
  "issuanceDate": "2024-02-10T00:00:00Z",
  "licenseNumber": "91110108123456789X",
  "expiryDate": "2034-02-09T00:00:00Z",
  "comments": "证照已成功发放"
}
```

## 6. 人员招聘管理 API

### 6.1 创建招聘计划

```http
POST /preparation/staff-recruitments
Content-Type: application/json
Authorization: Bearer <token>

{
  "preparationProjectId": "clx789...",
  "positionType": "MANAGER",
  "positionTitle": "店长",
  "department": "运营部",
  "plannedCount": 1,
  "priority": "HIGH",
  "startDate": "2024-01-20T00:00:00Z",
  "endDate": "2024-02-20T00:00:00Z",
  "salaryRange": {
    "min": 8000,
    "max": 12000,
    "currency": "CNY"
  },
  "workLocation": "北京市海淀区中关村大街123号",
  "workSchedule": "周一到周日，轮休制",
  "qualificationRequirements": "3年以上餐饮管理经验，熟悉门店运营",
  "jobDescription": "负责门店日常运营管理，团队建设，客户服务质量监督",
  "benefits": "五险一金，包工作餐，年终奖",
  "recruitmentChannels": ["智联招聘", "前程无忧", "内部推荐"],
  "recruiters": ["clx456..."],
  "interviewers": ["clx456...", "clx789..."],
  "notes": "优秀候选人可适当提高薪资"
}
```

### 6.2 添加候选人

```http
POST /preparation/staff-recruitments/:id/candidates
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "李明",
  "phone": "13700137000",
  "email": "liming@email.com",
  "resumeUrl": "https://files.company.com/resume_liming.pdf",
  "source": "智联招聘",
  "expectedSalary": 10000,
  "notes": "经验丰富，沟通能力强"
}
```

## 7. 里程碑跟踪管理 API

### 7.1 创建里程碑

```http
POST /preparation/milestones
Content-Type: application/json
Authorization: Bearer <token>

{
  "preparationProjectId": "clx789...",
  "name": "装修工程完成",
  "description": "门店装修工程全部完成，具备开业条件",
  "category": "工程建设",
  "priority": "HIGH",
  "plannedDate": "2024-02-20T00:00:00Z",
  "dependencies": [],
  "relatedTasks": ["clx111..."],
  "deliverables": ["装修验收报告", "消防验收证明"],
  "criteria": "装修质量达到设计要求，通过相关验收",
  "ownerId": "clx456...",
  "stakeholders": ["clx456...", "clx789..."],
  "riskLevel": "MEDIUM",
  "notes": "关键里程碑，直接影响开业时间"
}
```

### 7.2 完成里程碑

```http
PATCH /preparation/milestones/:id/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "actualDate": "2024-02-18T00:00:00Z",
  "notes": "装修工程提前2天完成，质量优秀"
}
```

## 8. 统计和报表 API

### 8.1 筹备项目仪表板

```http
GET /preparation/dashboard
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalProjects": 25,
      "inProgressProjects": 12,
      "completedProjects": 8,
      "overdueProjects": 2,
      "totalBudget": 12500000.00,
      "actualBudget": 13200000.00,
      "avgProgress": 68.5,
      "onTimeDeliveryRate": 85.2
    },
    "charts": {
      "statusDistribution": [
        { "status": "IN_PROGRESS", "count": 12, "percentage": 48.0 },
        { "status": "COMPLETED", "count": 8, "percentage": 32.0 },
        { "status": "PLANNING", "count": 3, "percentage": 12.0 },
        { "status": "OVERDUE", "count": 2, "percentage": 8.0 }
      ],
      "progressTrend": [
        { "date": "2024-01", "planned": 15, "actual": 12 },
        { "date": "2024-02", "planned": 25, "actual": 23 },
        { "date": "2024-03", "planned": 35, "actual": 31 }
      ],
      "budgetAnalysis": [
        { "category": "工程建设", "planned": 8000000, "actual": 8500000 },
        { "category": "设备采购", "planned": 3000000, "actual": 3200000 },
        { "category": "证照办理", "planned": 50000, "actual": 45000 },
        { "category": "人员招聘", "planned": 200000, "actual": 180000 }
      ]
    },
    "alerts": [
      {
        "type": "overdue",
        "message": "上海浦东店筹备项目已逾期3天",
        "projectId": "clx999...",
        "projectName": "上海浦东店筹备项目",
        "urgency": "HIGH"
      }
    ]
  }
}
```

### 8.2 设备采购统计

```http
GET /preparation/equipment-procurements/statistics?preparationProjectId=clx789...
Authorization: Bearer <token>
```

### 8.3 导出筹备项目数据

```http
GET /preparation/projects/export?format=xlsx&status=COMPLETED&startDate=2024-01-01&endDate=2024-03-31
Authorization: Bearer <token>
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

## 9. 批量操作 API

### 9.1 批量更新项目状态

```http
PATCH /preparation/projects/batch
Content-Type: application/json
Authorization: Bearer <token>

{
  "ids": ["clx789...", "clx888...", "clx999..."],
  "action": "changeStatus",
  "actionData": {
    "status": "IN_PROGRESS",
    "reason": "批量启动项目"
  }
}
```

### 9.2 批量分配项目经理

```http
PATCH /preparation/projects/batch
Content-Type: application/json
Authorization: Bearer <token>

{
  "ids": ["clx789...", "clx888..."],
  "action": "assignManager",
  "actionData": {
    "managerId": "clx456...",
    "reason": "统一项目管理"
  }
}
```

## 10. 文件上传 API

### 10.1 上传附件

```http
POST /preparation/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

files: [File1, File2, ...]
category: "equipment" | "license" | "recruitment" | "milestone"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "url": "https://files.company.com/equipment/image_001.jpg",
        "filename": "设备照片1.jpg",
        "size": 1048576,
        "mimeType": "image/jpeg"
      }
    ]
  }
}
```

## 11. 错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| PREP_001 | 400 | 筹备项目参数错误 |
| PREP_002 | 404 | 筹备项目不存在 |
| PREP_003 | 409 | 筹备项目编号已存在 |
| PREP_004 | 422 | 项目状态转换不合法 |
| PREP_005 | 403 | 无权限访问该筹备项目 |
| EQUIP_001 | 400 | 设备采购参数错误 |
| EQUIP_002 | 404 | 设备采购记录不存在 |
| EQUIP_003 | 422 | 设备状态转换不合法 |
| LICENSE_001 | 400 | 证照申请参数错误 |
| LICENSE_002 | 404 | 证照申请不存在 |
| LICENSE_003 | 422 | 证照状态转换不合法 |
| RECRUIT_001 | 400 | 招聘计划参数错误 |
| RECRUIT_002 | 404 | 招聘计划不存在 |
| RECRUIT_003 | 422 | 招聘状态转换不合法 |
| MILESTONE_001 | 400 | 里程碑参数错误 |
| MILESTONE_002 | 404 | 里程碑不存在 |
| MILESTONE_003 | 422 | 里程碑依赖关系错误 |

## 12. 权限控制

### 12.1 接口权限

| 接口类型 | 所需权限 | 角色要求 |
|----------|----------|----------|
| 创建筹备项目 | preparation:create | 商务人员、运营人员 |
| 查看筹备项目 | preparation:read | 所有相关人员 |
| 更新筹备项目 | preparation:update | 项目经理、管理员 |
| 删除筹备项目 | preparation:delete | 管理员 |
| 状态变更 | preparation:status | 项目经理、审批人员 |
| 批量操作 | preparation:batch | 管理员 |
| 导出数据 | preparation:export | 管理员、总裁办人员 |

### 12.2 数据访问控制

- **项目经理**: 只能访问自己管理的项目
- **部门负责人**: 可访问部门内所有项目
- **管理员**: 可访问所有项目
- **只读用户**: 只能查看，不能修改

## 13. 接口安全

### 13.1 认证机制

```typescript
// JWT Token格式
interface JWTPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  departmentId: string;
  exp: number;
  iat: number;
}
```

### 13.2 请求限流

- **通用接口**: 每用户100次/分钟
- **查询接口**: 每用户200次/分钟
- **文件上传**: 每用户10次/分钟

### 13.3 数据验证

- **参数验证**: 使用Zod schema验证所有输入参数
- **SQL注入防护**: 使用ORM防止SQL注入
- **XSS防护**: 对用户输入进行转义
- **文件上传验证**: 限制文件类型和大小

## 14. 性能优化

### 14.1 缓存策略

- **查询缓存**: 复杂统计查询结果缓存5分钟
- **静态数据缓存**: 枚举值、配置项缓存1小时
- **用户信息缓存**: 用户权限信息缓存15分钟

### 14.2 分页优化

- **游标分页**: 大数据量列表使用游标分页
- **索引优化**: 为常用查询条件创建复合索引
- **懒加载**: 关联数据按需加载

## 15. 监控和日志

### 15.1 接口监控

- **响应时间**: 监控P95响应时间
- **错误率**: 监控4xx/5xx错误率
- **QPS**: 监控每秒请求数
- **可用性**: 监控接口可用性

### 15.2 审计日志

```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}
```

## 16. API文档和测试

### 16.1 文档生成

- **OpenAPI**: 自动生成OpenAPI 3.0规范
- **Swagger UI**: 提供交互式API文档
- **PostMan**: 提供PostMan集合文件

### 16.2 测试覆盖

- **单元测试**: API接口逻辑测试覆盖率>90%
- **集成测试**: 端到端接口测试
- **性能测试**: 压力测试和负载测试
- **安全测试**: 权限控制和数据安全测试

---

本API接口设计文档提供了开店筹备管理模块的完整API规范，支持前端应用和移动端的所有功能需求。API设计遵循RESTful原则，具有良好的扩展性和维护性。