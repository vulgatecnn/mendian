# 报表管理API接口文档

## 概述

报表管理API提供了完整的报表生成、状态查询、下载和定时报表管理功能。支持开店计划、拓店跟进、筹备进度和门店资产四种类型的报表。

## 接口列表

### 1. 报表生成任务API

#### 创建报表生成任务
- **接口**: `POST /api/analytics/reports/generate/`
- **描述**: 创建新的报表生成任务
- **权限**: 需要登录，需要报表生成权限

**请求参数**:
```json
{
    "report_type": "plan",  // 必需，报表类型：plan/follow_up/preparation/assets
    "filters": {            // 可选，筛选条件
        "date_range": "2024-01-01,2024-12-31",
        "regions": [1, 2, 3],
        "store_types": ["直营店", "加盟店"],
        "statuses": ["active", "planning"],
        "assigned_users": [1, 2, 3]
    },
    "format": "excel"       // 可选，导出格式：excel/pdf，默认excel
}
```

**响应示例**:
```json
{
    "code": 0,
    "message": "报表任务创建成功",
    "data": {
        "task_id": "550e8400-e29b-41d4-a716-446655440000",
        "report_type": "plan",
        "format": "excel",
        "estimated_time": 30,
        "created_at": "2024-01-01T10:00:00Z"
    }
}
```

#### 查询报表任务状态
- **接口**: `GET /api/analytics/reports/status/{task_id}/`
- **描述**: 查询报表生成任务的状态和进度
- **权限**: 需要登录，只能查询自己创建的任务

**响应示例**:
```json
{
    "code": 0,
    "message": "获取成功",
    "data": {
        "task_id": "550e8400-e29b-41d4-a716-446655440000",
        "status": "completed",      // pending/processing/completed/failed
        "progress": 100,
        "created_at": "2024-01-01T10:00:00Z",
        "download_url": "/api/analytics/reports/download/550e8400-e29b-41d4-a716-446655440000/",
        "error_message": ""         // 失败时的错误信息
    }
}
```

#### 下载报表文件
- **接口**: `GET /api/analytics/reports/download/{task_id}/`
- **描述**: 下载已生成的报表文件
- **权限**: 需要登录，只能下载自己创建的报表

**响应**: 直接返回文件流，浏览器会自动下载文件

### 2. 定时报表管理API

#### 获取定时报表列表
- **接口**: `GET /api/analytics/reports/scheduled/`
- **描述**: 获取用户创建的定时报表配置列表
- **权限**: 需要登录

**响应示例**:
```json
{
    "code": 0,
    "message": "获取成功",
    "data": {
        "reports": [
            {
                "id": 1,
                "name": "每日开店计划报表",
                "report_type": "plan",
                "report_type_display": "开店计划报表",
                "frequency": "daily",
                "frequency_display": "每日",
                "format": "excel",
                "is_active": true,
                "recipients": ["manager@example.com"],
                "created_at": "2024-01-01T10:00:00Z",
                "last_generated": "2024-01-02T08:00:00Z"
            }
        ],
        "total": 1
    }
}
```

#### 创建定时报表
- **接口**: `POST /api/analytics/reports/scheduled/`
- **描述**: 创建新的定时报表配置
- **权限**: 需要登录

**请求参数**:
```json
{
    "name": "每日开店计划报表",        // 必需，报表名称
    "report_type": "plan",           // 必需，报表类型
    "frequency": "daily",            // 必需，生成频率：daily/weekly/monthly
    "filters": {                     // 可选，筛选条件
        "date_range": "2024-01-01,2024-12-31",
        "regions": [1, 2, 3]
    },
    "format": "excel",               // 可选，导出格式，默认excel
    "recipients": [                  // 可选，收件人邮箱列表
        "manager@example.com",
        "admin@example.com"
    ]
}
```

**响应示例**:
```json
{
    "code": 0,
    "message": "定时报表创建成功",
    "data": {
        "id": 1,
        "name": "每日开店计划报表",
        "report_type": "plan",
        "frequency": "daily",
        "created_at": "2024-01-01T10:00:00Z"
    }
}
```

#### 更新定时报表
- **接口**: `PUT /api/analytics/reports/scheduled/{report_id}/`
- **描述**: 更新定时报表配置
- **权限**: 需要登录，只能更新自己创建的定时报表

**请求参数**:
```json
{
    "name": "更新后的报表名称",
    "frequency": "weekly",
    "is_active": false,
    "recipients": ["new@example.com"]
}
```

#### 删除定时报表
- **接口**: `DELETE /api/analytics/reports/scheduled/{report_id}/`
- **描述**: 删除定时报表配置
- **权限**: 需要登录，只能删除自己创建的定时报表

**响应示例**:
```json
{
    "code": 0,
    "message": "定时报表删除成功",
    "data": {}
}
```

## 报表类型说明

### 1. 开店计划报表 (plan)
包含字段：
- 计划名称、计划类型、业务区域、门店类型
- 目标数量、完成数量、完成率、贡献率
- 计划开始日期、结束日期、状态、创建时间

### 2. 拓店跟进进度报表 (follow_up)
包含字段：
- 跟进单号、点位名称、详细地址、业务区域
- 跟进状态、负责人、预计投资额、预计年收入
- 预计ROI、回本周期、跟进天数、是否超期
- 创建时间、最后更新时间

### 3. 筹备进度报表 (preparation)
包含字段：
- 工程单号、门店名称、业务区域、施工供应商
- 工程状态、开工日期、预计完工日期、实际完工日期
- 工程进度、是否延期、延期天数、验收结果
- 整改项数量、交付状态、交付完成率

### 4. 门店资产报表 (assets)
包含字段：
- 门店编码、门店名称、业务区域、门店状态
- 资产类型、资产名称、资产数量、单价、总价值
- 资产状态、购置日期、最后盘点日期

## 筛选条件说明

### 通用筛选条件
- `date_range`: 日期范围，格式："YYYY-MM-DD,YYYY-MM-DD"
- `regions`: 区域ID列表，数组格式
- `store_types`: 门店类型列表，数组格式
- `statuses`: 状态列表，数组格式

### 特定筛选条件
- `assigned_users`: 负责人ID列表（适用于跟进报表）
- `contribution_rate_type`: 贡献率类型（适用于计划报表）

## 定时报表生成机制

### 生成频率
- **daily**: 每日生成，在每天的固定时间执行
- **weekly**: 每周生成，在每周一的固定时间执行
- **monthly**: 每月生成，在每月1号的固定时间执行

### 生成逻辑
1. 系统定时任务检查需要生成的定时报表
2. 为每个定时报表创建报表生成任务
3. 异步执行报表生成
4. 生成完成后可选择发送邮件通知

### 邮件通知
- 支持配置收件人邮箱列表
- 报表生成完成后自动发送通知邮件
- 邮件包含报表下载链接

## 错误码说明

- `0`: 成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用示例

### 生成开店计划报表
```bash
curl -X POST "http://localhost:8000/api/analytics/reports/generate/" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "plan",
    "filters": {
      "date_range": "2024-01-01,2024-12-31",
      "regions": [1, 2]
    },
    "format": "excel"
  }'
```

### 创建每日定时报表
```bash
curl -X POST "http://localhost:8000/api/analytics/reports/scheduled/" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "每日开店计划报表",
    "report_type": "plan",
    "frequency": "daily",
    "recipients": ["manager@example.com"]
  }'
```

### 查询报表状态
```bash
curl -X GET "http://localhost:8000/api/analytics/reports/status/550e8400-e29b-41d4-a716-446655440000/" \
  -H "Authorization: Bearer your-token"
```

## 注意事项

1. **权限控制**: 用户只能操作自己创建的报表任务和定时报表
2. **文件清理**: 系统会自动清理7天前的报表文件
3. **任务重试**: 报表生成失败时会自动重试最多3次
4. **并发限制**: 建议控制同时生成的报表任务数量
5. **文件大小**: 大数据量报表可能需要较长生成时间
6. **格式支持**: 目前主要支持Excel格式，PDF格式为预留功能