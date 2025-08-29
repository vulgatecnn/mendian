# 开店计划管理模块API设计文档

## 1. 模块概览

### 1.1 功能描述
开店计划管理模块是好饭碗门店生命周期管理系统的核心功能之一，负责管理企业的年度、季度门店开设计划。本模块支持创建、查询、更新和删除开店计划，并提供统计分析功能。

### 1.2 业务范围
- 创建年度/季度开店计划
- 管理不同区域和主体的开店计划
- 支持不同门店类型的计划
- 提供开店计划的全面统计和分析

### 1.3 核心实体
- `StorePlan`：开店计划主实体
- 关联实体：`Region`、`CompanyEntity`、`User`

## 2. API接口清单

### 2.1 开店计划CRUD操作
| 接口名称 | HTTP方法 | 路径 | 权限要求 |
|----------|----------|------|----------|
| 创建开店计划 | POST | `/api/v1/store-plans` | `store-plan:create` |
| 查询开店计划列表 | GET | `/api/v1/store-plans` | `store-plan:read` |
| 获取开店计划详情 | GET | `/api/v1/store-plans/:id` | `store-plan:read` |
| 更新开店计划 | PUT | `/api/v1/store-plans/:id` | `store-plan:update` |
| 删除开店计划 | DELETE | `/api/v1/store-plans/:id` | `store-plan:delete` |

### 2.2 统计分析接口
| 接口名称 | HTTP方法 | 路径 | 权限要求 |
|----------|----------|------|----------|
| 按地区统计 | GET | `/api/v1/store-plans/statistics/by-region` | `store-plan:statistics` |
| 按时间统计 | GET | `/api/v1/store-plans/statistics/by-time` | `store-plan:statistics` |
| 进度统计 | GET | `/api/v1/store-plans/statistics/progress` | `store-plan:statistics` |

## 3. 接口详细设计

### 3.1 创建开店计划 `POST /api/v1/store-plans`

#### 请求体结构
```json
{
  "planCode": "string", // 计划编号
  "title": "string", // 计划标题
  "year": "number", // 年份
  "quarter": "number?", // 季度(可选)
  "regionId": "string", // 区域ID
  "entityId": "string", // 主体ID
  "storeType": "string", // 门店类型
  "plannedCount": "number", // 计划开店数量
  "budget": "number?", // 预算
  "priority": "string", // 优先级
  "startDate": "string?", // 开始日期
  "endDate": "string?", // 结束日期
  "description": "string?" // 描述
}
```

#### 响应体结构
```json
{
  "id": "string",
  "planCode": "string",
  "status": "string", // 审批状态
  "createdAt": "string"
}
```

### 3.2 查询开店计划列表 `GET /api/v1/store-plans`

#### 查询参数
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `year`: 筛选年份
- `quarter`: 筛选季度
- `regionId`: 筛选区域
- `entityId`: 筛选主体
- `storeType`: 筛选门店类型
- `status`: 筛选审批状态

#### 响应体结构
```json
{
  "total": "number",
  "page": "number",
  "pageSize": "number",
  "data": [
    {
      "id": "string",
      "planCode": "string",
      "title": "string",
      "year": "number",
      "quarter": "number?",
      "plannedCount": "number",
      "completedCount": "number",
      "status": "string"
    }
  ]
}
```

### 3.3 获取开店计划详情 `GET /api/v1/store-plans/:id`

#### 响应体结构
```json
{
  "id": "string",
  "planCode": "string",
  "title": "string",
  "year": "number",
  "quarter": "number?",
  "regionId": "string",
  "region": {
    "id": "string", 
    "name": "string"
  },
  "entityId": "string",
  "entity": {
    "id": "string",
    "name": "string"
  },
  "storeType": "string",
  "plannedCount": "number",
  "completedCount": "number",
  "budget": "number?",
  "actualBudget": "number?",
  "priority": "string",
  "status": "string",
  "startDate": "string?",
  "endDate": "string?",
  "description": "string?",
  "remark": "string?"
}
```

### 3.4 更新开店计划 `PUT /api/v1/store-plans/:id`

#### 请求体结构
同创建接口，但所有字段均为可选

### 3.5 删除开店计划 `DELETE /api/v1/store-plans/:id`

#### 响应
- 成功：HTTP 204 No Content
- 失败：错误信息

### 3.6 按地区统计 `GET /api/v1/store-plans/statistics/by-region`

#### 响应体结构
```json
{
  "total": "number",
  "byRegion": [
    {
      "regionId": "string",
      "regionName": "string", 
      "plannedCount": "number",
      "completedCount": "number",
      "progressRate": "number"
    }
  ]
}
```

### 3.7 按时间统计 `GET /api/v1/store-plans/statistics/by-time`

#### 响应体结构
```json
{
  "byYear": [
    {
      "year": "number",
      "plannedCount": "number", 
      "completedCount": "number",
      "progressRate": "number"
    }
  ],
  "byQuarter": [
    {
      "year": "number", 
      "quarter": "number",
      "plannedCount": "number",
      "completedCount": "number", 
      "progressRate": "number"
    }
  ]
}
```

### 3.8 进度统计 `GET /api/v1/store-plans/statistics/progress`

#### 响应体结构
```json
{
  "total": {
    "plannedCount": "number",
    "completedCount": "number", 
    "progressRate": "number"
  },
  "byStatus": [
    {
      "status": "string",
      "count": "number",
      "percentage": "number"
    }
  ]
}
```

## 4. 数据模型定义

### 4.1 开店计划状态枚举
- `DRAFT`: 草稿
- `SUBMITTED`: 已提交
- `PENDING`: 待审批
- `APPROVED`: 已批准
- `REJECTED`: 已拒绝
- `CANCELLED`: 已取消

### 4.2 门店类型枚举
- `DIRECT`: 直营店
- `FRANCHISE`: 加盟店
- `FLAGSHIP`: 旗舰店
- `POPUP`: 快闪店

### 4.3 优先级枚举
- `LOW`: 低
- `MEDIUM`: 中
- `HIGH`: 高
- `URGENT`: 紧急

## 5. 业务规则

### 5.1 数据验证规则
- `planCode`必须唯一
- `year`必须在有效范围内
- `quarter`可为空或1-4之间的整数
- `plannedCount`必须为正整数
- `budget`必须为非负数

### 5.2 权限控制规则
- 不同角色对开店计划的操作权限不同
  - 商务人员：可创建、编辑草稿
  - 运营人员：可查看、提交审批
  - 总裁办人员：可审批、查看统计

### 5.3 业务逻辑约束
- 删除开店计划不能影响已关联的候选点位
- 更新已批准的计划需要重新提交审批
- 计划状态变更将触发审批流程
- 完成数量不能超过计划数量

## 6. 错误码定义

| 错误码 | 描述 | HTTP状态码 |
|--------|------|------------|
| `STORE_PLAN_NOT_FOUND` | 开店计划不存在 | 404 |
| `STORE_PLAN_ALREADY_EXISTS` | 开店计划已存在 | 409 |
| `INVALID_STORE_PLAN_DATA` | 数据验证失败 | 400 |
| `UNAUTHORIZED_OPERATION` | 未授权的操作 | 403 |

*本文档为草稿版本，随项目发展将持续更新。*