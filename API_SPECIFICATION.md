# 好饭碗门店管理系统 - API接口规范

## 版本信息
- **API版本**: v1.0
- **文档版本**: 1.0.0
- **最后更新**: 2025-08-29
- **基础URL**: `https://api.mendian.com/api/v1`

---

## 1. 通用规范

### 1.1 请求格式

#### HTTP方法约定
- `GET`: 查询数据，幂等操作
- `POST`: 创建资源，非幂等操作
- `PUT`: 完整更新资源，幂等操作
- `PATCH`: 部分更新资源
- `DELETE`: 删除资源，幂等操作

#### 请求头
```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
X-Request-ID: {uuid} # 可选，用于请求追踪
X-Client-Version: {version} # 客户端版本
```

#### 请求体格式
```json
{
  "data": {
    // 业务数据
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-08-29T10:00:00Z",
    "version": "1.0.0"
  }
}
```

### 1.2 响应格式

#### 成功响应
```json
{
  "code": 200,
  "success": true,
  "message": "操作成功",
  "data": {
    // 业务数据
  },
  "meta": {
    "timestamp": "2025-08-29T10:00:00Z",
    "requestId": "uuid",
    "version": "1.0.0"
  }
}
```

#### 分页响应
```json
{
  "code": 200,
  "success": true,
  "message": "查询成功",
  "data": {
    "items": [
      // 数据列表
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### 错误响应
```json
{
  "code": 400,
  "success": false,
  "message": "请求参数错误",
  "error": {
    "type": "VALIDATION_ERROR",
    "details": [
      {
        "field": "name",
        "message": "名称不能为空"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-08-29T10:00:00Z",
    "requestId": "uuid"
  }
}
```

### 1.3 状态码规范

| HTTP状态码 | 业务码 | 含义 | 说明 |
|-----------|-------|------|------|
| 200 | 200 | 成功 | 请求处理成功 |
| 201 | 201 | 创建成功 | 资源创建成功 |
| 400 | 400 | 参数错误 | 请求参数不合法 |
| 401 | 401 | 未认证 | 需要用户登录 |
| 403 | 403 | 无权限 | 用户权限不足 |
| 404 | 404 | 未找到 | 资源不存在 |
| 422 | 422 | 业务错误 | 业务逻辑处理失败 |
| 429 | 429 | 频率限制 | 请求过于频繁 |
| 500 | 500 | 服务器错误 | 内部服务器错误 |

---

## 2. 认证与授权

### 2.1 JWT认证
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password",
  "loginType": "password" // password | wechat | mobile
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 7200,
    "user": {
      "id": "user_id",
      "username": "admin",
      "name": "管理员",
      "avatar": "avatar_url",
      "roles": ["admin"],
      "permissions": ["store:read", "store:write"]
    }
  }
}
```

### 2.2 令牌刷新
```http
POST /auth/refresh
Authorization: Bearer {refresh_token}
```

---

## 3. 核心业务模块API

### 3.1 开店计划管理

#### 3.1.1 查询开店计划列表
```http
GET /store-plans?page=1&pageSize=20&status=draft&year=2025
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20, 最大: 100)
- `status`: 状态筛选 (draft | pending | approved | in_progress | completed)
- `year`: 年度筛选
- `quarter`: 季度筛选 (1-4)
- `keyword`: 关键词搜索

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "plan_001",
        "name": "2025年Q1华北区开店计划",
        "year": 2025,
        "quarter": 1,
        "type": "direct",
        "status": "approved",
        "priority": "high",
        "startDate": "2025-01-01",
        "endDate": "2025-03-31",
        "totalStores": 15,
        "totalBudget": 1500000,
        "progress": 65,
        "creator": {
          "id": "user_001",
          "name": "张三"
        },
        "createTime": "2024-12-01T10:00:00Z",
        "updateTime": "2025-01-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### 3.1.2 创建开店计划
```http
POST /store-plans
Content-Type: application/json

{
  "name": "2025年Q2华南区开店计划",
  "year": 2025,
  "quarter": 2,
  "type": "franchise",
  "priority": "normal",
  "startDate": "2025-04-01",
  "endDate": "2025-06-30",
  "description": "华南区重点城市扩张计划",
  "targets": [
    {
      "regionId": "region_001",
      "regionName": "华南大区",
      "storeType": "franchise",
      "targetCount": 8,
      "budget": 800000,
      "description": "重点开发广州、深圳市场"
    }
  ]
}
```

#### 3.1.3 获取计划详情
```http
GET /store-plans/{planId}
```

#### 3.1.4 更新计划
```http
PUT /store-plans/{planId}
```

#### 3.1.5 删除计划
```http
DELETE /store-plans/{planId}
```

### 3.2 拓店管理

#### 3.2.1 候选点位管理
```http
GET /expansion/candidates?page=1&status=evaluating&region=huanan

POST /expansion/candidates
{
  "name": "万达广场店铺",
  "region": "华南大区",
  "city": "深圳",
  "address": "南山区深南大道万达广场L1-001",
  "area": 120,
  "rentPrice": 15000,
  "deposit": 45000,
  "businessType": "shopping_mall",
  "evaluationScore": 85,
  "advantages": ["人流量大", "交通便利"],
  "disadvantages": ["租金较高"],
  "riskLevel": "medium"
}
```

### 3.3 审批中心

#### 3.3.1 审批模板管理
```http
GET /approval/templates?category=store_application&businessType=direct

POST /approval/templates
{
  "name": "直营店审批模板",
  "category": "门店审批",
  "businessType": "direct",
  "description": "适用于直营门店的标准审批流程",
  "nodes": [
    {
      "id": "node_001",
      "name": "部门经理审批",
      "type": "approval",
      "nodeConfig": {
        "approvers": [{"id": "user_001", "name": "张经理"}],
        "approvalType": "single",
        "timeLimit": 24,
        "allowReject": true
      }
    }
  ],
  "formConfig": {
    "fields": [
      {
        "id": "storeName",
        "name": "storeName",
        "label": "门店名称",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

#### 3.3.2 审批实例管理
```http
GET /approval/instances?status=pending&approver=current_user

POST /approval/instances
{
  "templateId": "template_001",
  "title": "华南大区新店审批",
  "priority": "normal",
  "formData": {
    "storeName": "深圳万达店",
    "budget": 500000
  },
  "deadline": "2025-09-05T18:00:00Z"
}

POST /approval/instances/{instanceId}/process
{
  "nodeId": "node_001",
  "action": "approve",
  "comment": "同意开设此店铺，预算合理"
}
```

### 3.4 基础数据管理

#### 3.4.1 业务大区管理
```http
GET /basic-data/regions?status=active

POST /basic-data/regions
{
  "name": "华北大区",
  "code": "HB001",
  "managerId": "user_001",
  "managerName": "李经理",
  "description": "负责北京、天津、河北等地区",
  "status": "active"
}

GET /basic-data/regions/{regionId}/cities
POST /basic-data/regions/{regionId}/cities
{
  "cityIds": ["city_001", "city_002"]
}
```

#### 3.4.2 供应商管理
```http
GET /basic-data/suppliers?type=equipment&status=active

POST /basic-data/suppliers
{
  "name": "美的商用设备有限公司",
  "code": "SUP001",
  "type": "equipment",
  "contactPerson": "王总",
  "contactPhone": "13800138000",
  "contactEmail": "wang@midea.com",
  "address": "广东省佛山市顺德区美的总部",
  "businessLicense": "440681000000001",
  "qualifications": ["ISO9001", "CCC认证"],
  "cooperationStatus": "active",
  "paymentTerms": "月结30天",
  "description": "主要提供厨房设备和制冷设备"
}
```

---

## 4. 高级功能

### 4.1 文件上传
```http
POST /files/upload
Content-Type: multipart/form-data

{
  "file": "binary_data",
  "category": "store_image", // store_image | document | avatar
  "businessId": "store_001" // 关联的业务ID
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "fileId": "file_001",
    "filename": "store_image.jpg",
    "url": "https://cdn.mendian.com/files/store_image.jpg",
    "size": 1024576,
    "mimeType": "image/jpeg",
    "uploadTime": "2025-08-29T10:00:00Z"
  }
}
```

### 4.2 数据导出
```http
POST /data/export
{
  "module": "store-plans", // 模块名称
  "format": "excel", // excel | pdf | csv
  "filters": {
    "year": 2025,
    "status": ["approved", "in_progress"]
  },
  "fields": ["name", "status", "progress", "budget"] // 可选，导出字段
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "taskId": "export_001",
    "status": "processing",
    "estimatedTime": 30 // 预估完成时间（秒）
  }
}
```

查询导出状态:
```http
GET /data/export/{taskId}
```

### 4.3 数据统计
```http
GET /statistics/dashboard?dateRange=2025-01-01,2025-08-29

GET /statistics/store-plans?groupBy=quarter&year=2025

GET /statistics/approval?dateRange=2025-08-01,2025-08-29&category=store_application
```

---

## 5. WebSocket实时通信

### 5.1 连接建立
```javascript
const ws = new WebSocket('wss://api.mendian.com/ws?token={jwt_token}');
```

### 5.2 消息格式
```json
{
  "type": "notification",
  "channel": "approval.pending",
  "data": {
    "instanceId": "instance_001",
    "title": "新的审批待办",
    "message": "您有一个新的审批待办：华南大区新店审批",
    "timestamp": "2025-08-29T10:00:00Z"
  }
}
```

### 5.3 支持的频道
- `approval.pending` - 审批待办通知
- `system.announcement` - 系统公告
- `task.status` - 任务状态更新

---

## 6. 错误处理

### 6.1 业务错误码
| 错误码 | 含义 | 说明 |
|-------|------|------|
| 10001 | 参数缺失 | 必填参数未提供 |
| 10002 | 参数格式错误 | 参数格式不正确 |
| 20001 | 资源不存在 | 请求的资源未找到 |
| 20002 | 资源已存在 | 尝试创建已存在的资源 |
| 30001 | 业务规则冲突 | 违反业务逻辑规则 |
| 30002 | 状态不允许 | 当前状态不允许此操作 |

### 6.2 错误响应示例
```json
{
  "code": 422,
  "success": false,
  "message": "业务处理失败",
  "error": {
    "type": "BUSINESS_ERROR",
    "code": 30001,
    "message": "该区域已存在进行中的开店计划",
    "details": {
      "conflictPlan": {
        "id": "plan_002",
        "name": "2025年Q1华南区开店计划"
      }
    }
  }
}
```

---

## 7. 性能与限制

### 7.1 频率限制
- **普通接口**: 1000次/小时
- **查询接口**: 5000次/小时  
- **上传接口**: 100次/小时

### 7.2 数据限制
- **单次查询最大数量**: 100条
- **文件上传大小**: 10MB
- **批量操作数量**: 50条

### 7.3 超时设置
- **API请求超时**: 30秒
- **文件上传超时**: 300秒
- **数据导出超时**: 600秒

---

## 8. SDK与工具

### 8.1 JavaScript SDK
```javascript
import { MendianAPI } from '@mendian/api-sdk';

const api = new MendianAPI({
  baseURL: 'https://api.mendian.com/api/v1',
  token: 'your_jwt_token'
});

// 使用示例
const plans = await api.storePlans.list({ year: 2025 });
const plan = await api.storePlans.create(planData);
```

### 8.2 Postman集合
提供完整的Postman API集合，包含所有接口的示例请求。

---

## 9. 更新日志

### v1.0.0 (2025-08-29)
- 初始版本发布
- 支持开店计划、拓店管理、审批中心、基础数据管理
- JWT认证体系
- 文件上传/下载功能
- WebSocket实时通信

---

## 10. 技术支持

- **API文档**: https://docs.mendian.com/api
- **SDK下载**: https://github.com/mendian-tech/api-sdk
- **技术支持**: tech@mendian.com
- **问题反馈**: https://github.com/mendian-tech/api-issues

---

*本文档持续更新，请关注版本变更通知*