# 开店筹备管理模块 API 文档

## 概述

开店筹备管理模块提供工程管理、里程碑跟踪和交付清单管理的 RESTful API 接口。

**基础 URL**: `/api/preparation/`

## 认证

所有 API 接口都需要认证。请在请求头中包含有效的认证令牌：

```
Authorization: Bearer <your_token>
```

## 工程管理 API

### 1. 创建工程单

**接口**: `POST /api/preparation/construction/`

**请求体**:
```json
{
  "store_name": "好饭碗北京朝阳店",
  "follow_up_record": 1,
  "construction_start_date": "2023-11-10",
  "construction_end_date": "2023-12-31",
  "supplier": 1,
  "design_files": [],
  "remark": "备注信息"
}
```

**响应** (201 Created):
```json
{
  "id": 1,
  "order_no": "GC202311030001",
  "store_name": "好饭碗北京朝阳店",
  "follow_up_record": 1,
  "follow_up_record_info": {
    "id": 1,
    "record_no": "GJ202311010001",
    "location_name": "朝阳大悦城"
  },
  "design_files": [],
  "construction_start_date": "2023-11-10",
  "construction_end_date": "2023-12-31",
  "actual_end_date": null,
  "supplier": 1,
  "supplier_info": {
    "id": 1,
    "supplier_name": "XX装修公司",
    "contact_person": "张三",
    "contact_phone": "13800138000"
  },
  "status": "planning",
  "acceptance_date": null,
  "acceptance_result": "pending",
  "acceptance_notes": "",
  "rectification_items": [],
  "remark": "备注信息",
  "milestones": [],
  "created_by": 1,
  "created_by_info": {
    "id": 1,
    "username": "admin",
    "real_name": "管理员"
  },
  "created_at": "2023-11-03T10:00:00Z",
  "updated_at": "2023-11-03T10:00:00Z"
}
```

### 2. 查询工程单列表

**接口**: `GET /api/preparation/construction/`

**查询参数**:
- `status`: 工程状态（planning, in_progress, acceptance, rectification, completed, cancelled）
- `acceptance_result`: 验收结果（pending, passed, failed）
- `supplier`: 供应商 ID
- `search`: 搜索关键词（工程单号、门店名称）
- `ordering`: 排序字段（created_at, construction_start_date, construction_end_date）

**示例**: `GET /api/preparation/construction/?status=in_progress&ordering=-created_at`

**响应** (200 OK):
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "order_no": "GC202311030001",
      "store_name": "好饭碗北京朝阳店",
      "supplier_name": "XX装修公司",
      "construction_start_date": "2023-11-10",
      "construction_end_date": "2023-12-31",
      "status": "in_progress",
      "acceptance_result": "pending",
      "milestone_count": 5,
      "created_by_name": "管理员",
      "created_at": "2023-11-03T10:00:00Z"
    }
  ]
}
```

### 3. 获取工程单详情

**接口**: `GET /api/preparation/construction/{id}/`

**响应** (200 OK): 同创建工程单的响应格式

### 4. 更新工程单

**接口**: `PUT /api/preparation/construction/{id}/` 或 `PATCH /api/preparation/construction/{id}/`

**请求体**: 同创建工程单，支持部分更新

### 5. 删除工程单

**接口**: `DELETE /api/preparation/construction/{id}/`

**响应** (204 No Content)

### 6. 添加里程碑

**接口**: `POST /api/preparation/construction/{id}/milestones/`

**请求体**:
```json
{
  "name": "水电改造完成",
  "description": "完成水电线路改造",
  "planned_date": "2023-11-20",
  "status": "pending"
}
```

**响应** (201 Created):
```json
{
  "id": 1,
  "construction_order": 1,
  "name": "水电改造完成",
  "description": "完成水电线路改造",
  "planned_date": "2023-11-20",
  "actual_date": null,
  "status": "pending",
  "reminder_sent": false,
  "remark": "",
  "created_at": "2023-11-03T10:00:00Z",
  "updated_at": "2023-11-03T10:00:00Z"
}
```

### 7. 更新里程碑

**接口**: `PUT /api/preparation/construction/{id}/milestones/{milestone_id}/`

**请求体**:
```json
{
  "actual_date": "2023-11-19",
  "status": "completed"
}
```

**响应** (200 OK): 同添加里程碑的响应格式

### 8. 执行验收

**接口**: `POST /api/preparation/construction/{id}/acceptance/`

**请求体**:
```json
{
  "acceptance_date": "2023-12-30",
  "acceptance_result": "passed",
  "acceptance_notes": "验收通过，质量良好",
  "rectification_items": []
}
```

**验收不通过示例**:
```json
{
  "acceptance_date": "2023-12-30",
  "acceptance_result": "failed",
  "acceptance_notes": "存在质量问题",
  "rectification_items": [
    {
      "description": "墙面需要重新粉刷",
      "status": "pending",
      "deadline": "2024-01-10",
      "responsible_person": "张三"
    }
  ]
}
```

**响应** (200 OK):
```json
{
  "message": "验收操作成功",
  "data": {
    // 工程单完整信息
  }
}
```

### 9. 标记整改项

**接口**: `POST /api/preparation/construction/{id}/rectification/`

**请求体**:
```json
{
  "rectification_items": [
    {
      "description": "墙面需要重新粉刷",
      "status": "pending",
      "deadline": "2024-01-10",
      "responsible_person": "张三"
    },
    {
      "description": "地板需要修复",
      "status": "in_progress",
      "deadline": "2024-01-15",
      "responsible_person": "李四"
    }
  ]
}
```

**响应** (200 OK):
```json
{
  "message": "整改项标记成功",
  "data": {
    // 工程单完整信息
  }
}
```

### 10. 上传设计图纸

**接口**: `POST /api/preparation/construction/{id}/upload-design/`

**请求体**:
```json
{
  "file_name": "设计图纸.pdf",
  "file_url": "https://example.com/files/design.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf"
}
```

**响应** (200 OK):
```json
{
  "message": "设计图纸上传成功",
  "data": {
    // 工程单完整信息
  }
}
```

## 里程碑管理 API

### 1. 查询里程碑列表

**接口**: `GET /api/preparation/milestones/`

**查询参数**:
- `construction_order`: 工程单 ID
- `status`: 状态（pending, in_progress, completed, delayed）
- `reminder_sent`: 是否已发送提醒（true, false）
- `ordering`: 排序字段（planned_date, created_at）

**示例**: `GET /api/preparation/milestones/?construction_order=1&status=pending`

**响应** (200 OK):
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "construction_order": 1,
      "name": "水电改造完成",
      "description": "完成水电线路改造",
      "planned_date": "2023-11-20",
      "actual_date": null,
      "status": "pending",
      "reminder_sent": false,
      "remark": "",
      "created_at": "2023-11-03T10:00:00Z",
      "updated_at": "2023-11-03T10:00:00Z"
    }
  ]
}
```

### 2. 获取里程碑详情

**接口**: `GET /api/preparation/milestones/{id}/`

### 3. 更新里程碑

**接口**: `PUT /api/preparation/milestones/{id}/` 或 `PATCH /api/preparation/milestones/{id}/`

### 4. 删除里程碑

**接口**: `DELETE /api/preparation/milestones/{id}/`

## 交付管理 API

### 1. 创建交付清单

**接口**: `POST /api/preparation/delivery/`

**请求体**:
```json
{
  "construction_order": 1,
  "store_name": "好饭碗北京朝阳店",
  "delivery_items": [
    {
      "name": "营业执照",
      "type": "document",
      "status": "pending",
      "required": true
    },
    {
      "name": "消防验收报告",
      "type": "document",
      "status": "pending",
      "required": true
    }
  ],
  "documents": [],
  "remark": "备注信息"
}
```

**响应** (201 Created):
```json
{
  "id": 1,
  "checklist_no": "JF202311030001",
  "construction_order": 1,
  "construction_order_info": {
    "id": 1,
    "order_no": "GC202311030001",
    "store_name": "好饭碗北京朝阳店",
    "status": "completed"
  },
  "store_name": "好饭碗北京朝阳店",
  "delivery_items": [
    {
      "name": "营业执照",
      "type": "document",
      "status": "pending",
      "required": true
    }
  ],
  "documents": [],
  "status": "draft",
  "delivery_date": null,
  "remark": "备注信息",
  "created_by": 1,
  "created_by_info": {
    "id": 1,
    "username": "admin",
    "real_name": "管理员"
  },
  "created_at": "2023-11-03T10:00:00Z",
  "updated_at": "2023-11-03T10:00:00Z"
}
```

### 2. 查询交付清单列表

**接口**: `GET /api/preparation/delivery/`

**查询参数**:
- `status`: 状态（draft, in_progress, completed）
- `construction_order`: 工程单 ID
- `search`: 搜索关键词（清单编号、门店名称）
- `ordering`: 排序字段（created_at, delivery_date）

**示例**: `GET /api/preparation/delivery/?status=in_progress`

**响应** (200 OK):
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "checklist_no": "JF202311030001",
      "store_name": "好饭碗北京朝阳店",
      "construction_order_no": "GC202311030001",
      "status": "in_progress",
      "delivery_date": null,
      "item_count": 5,
      "document_count": 3,
      "created_by_name": "管理员",
      "created_at": "2023-11-03T10:00:00Z"
    }
  ]
}
```

### 3. 获取交付清单详情

**接口**: `GET /api/preparation/delivery/{id}/`

**响应** (200 OK): 同创建交付清单的响应格式

### 4. 更新交付清单

**接口**: `PUT /api/preparation/delivery/{id}/` 或 `PATCH /api/preparation/delivery/{id}/`

### 5. 删除交付清单

**接口**: `DELETE /api/preparation/delivery/{id}/`

### 6. 上传交付文档

**接口**: `POST /api/preparation/delivery/{id}/upload/`

**请求体**:
```json
{
  "document_name": "营业执照",
  "document_url": "https://example.com/files/license.pdf",
  "document_type": "application/pdf",
  "file_size": 1024000,
  "description": "门店营业执照"
}
```

**响应** (200 OK):
```json
{
  "message": "文档上传成功",
  "data": {
    // 交付清单完整信息
  }
}
```

### 7. 完成交付

**接口**: `POST /api/preparation/delivery/{id}/complete/`

**请求体**:
```json
{
  "delivery_date": "2024-01-01"
}
```

**响应** (200 OK):
```json
{
  "message": "交付完成",
  "data": {
    // 交付清单完整信息
  }
}
```

## 状态说明

### 工程单状态 (status)
- `planning`: 计划中
- `in_progress`: 施工中
- `acceptance`: 验收中
- `rectification`: 整改中
- `completed`: 已完成
- `cancelled`: 已取消

### 验收结果 (acceptance_result)
- `pending`: 待验收
- `passed`: 验收通过
- `failed`: 验收不通过

### 里程碑状态 (status)
- `pending`: 待开始
- `in_progress`: 进行中
- `completed`: 已完成
- `delayed`: 已延期

### 交付清单状态 (status)
- `draft`: 草稿
- `in_progress`: 进行中
- `completed`: 已完成

## 错误响应

所有 API 在发生错误时返回统一的错误格式：

```json
{
  "field_name": ["错误信息"]
}
```

或

```json
{
  "detail": "错误描述"
}
```

常见 HTTP 状态码：
- `200 OK`: 请求成功
- `201 Created`: 创建成功
- `204 No Content`: 删除成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证
- `403 Forbidden`: 无权限
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器错误

## 使用示例

### Python 示例

```python
import requests

# 设置认证令牌
headers = {
    'Authorization': 'Bearer your_token_here',
    'Content-Type': 'application/json'
}

# 创建工程单
data = {
    'store_name': '好饭碗北京朝阳店',
    'follow_up_record': 1,
    'construction_start_date': '2023-11-10',
    'construction_end_date': '2023-12-31',
    'supplier': 1
}

response = requests.post(
    'http://localhost:8000/api/preparation/construction/',
    json=data,
    headers=headers
)

if response.status_code == 201:
    construction_order = response.json()
    print(f"工程单创建成功: {construction_order['order_no']}")
```

### JavaScript 示例

```javascript
// 设置认证令牌
const headers = {
    'Authorization': 'Bearer your_token_here',
    'Content-Type': 'application/json'
};

// 查询工程单列表
fetch('http://localhost:8000/api/preparation/construction/?status=in_progress', {
    method: 'GET',
    headers: headers
})
.then(response => response.json())
.then(data => {
    console.log('工程单列表:', data.results);
})
.catch(error => {
    console.error('错误:', error);
});
```

## 注意事项

1. **工程单号自动生成**: 创建工程单时，系统会自动生成唯一的工程单号（格式：GC + 年月日 + 4位序号）
2. **交付清单编号自动生成**: 创建交付清单时，系统会自动生成唯一的清单编号（格式：JF + 年月日 + 4位序号）
3. **里程碑提醒**: 系统会在里程碑计划日期前3天自动发送提醒通知
4. **验收逻辑**: 验收通过时，工程单状态自动更新为已完成；验收不通过时，状态更新为整改中
5. **文件上传**: 设计图纸和交付文档的上传需要先通过文件上传服务获取文件 URL，然后调用相应接口保存文件信息
6. **数据权限**: 用户只能查看和操作自己权限范围内的数据

## 相关文档

- [需求文档](../../.kiro/specs/phase-one-core-modules/requirements.md)
- [设计文档](../../.kiro/specs/phase-one-core-modules/design.md)
- [模块 README](./README.md)
