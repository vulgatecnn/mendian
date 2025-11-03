# 开店计划导入导出API使用指南

## 概述

开店计划导入导出功能提供了完整的Excel数据导入导出解决方案，支持批量导入计划数据和灵活的数据导出功能。

## API端点

### 基础URL
```
/api/store-planning/import-export/
```

## 导入功能

### 1. Excel数据导入
**POST** `/import-excel/`

上传Excel文件批量导入开店计划数据。

**请求参数：**
- `file`: Excel文件（.xlsx或.xls格式）

**响应示例：**
```json
{
  "message": "数据导入完成",
  "data": {
    "success": true,
    "total_processed": 10,
    "success_count": 8,
    "error_count": 2,
    "created_plans": [
      {
        "id": 1,
        "name": "2024年华东区开店计划",
        "plan_type": "年度计划",
        "total_target_count": 50
      }
    ],
    "errors": [
      {
        "type": "data_error",
        "message": "计划名称不能为空",
        "row": 3
      }
    ],
    "warnings": [
      {
        "type": "duplicate_warning",
        "message": "区域和门店类型组合重复"
      }
    ]
  }
}
```

### 2. 下载导入模板
**GET** `/download-template/`

下载Excel导入模板文件。

**查询参数：**
- `type`: 模板类型（standard/quarterly/bulk/empty，默认：standard）
- `include_sample`: 是否包含示例数据（true/false，默认：true）

**响应：** Excel文件下载

### 3. 获取模板类型
**GET** `/template-types/`

获取可用的模板类型列表。

**响应示例：**
```json
{
  "message": "获取模板类型成功",
  "data": [
    {
      "type": "standard",
      "name": "标准模板",
      "description": "包含基本示例数据的标准导入模板",
      "sample_count": 2
    },
    {
      "type": "quarterly",
      "name": "季度计划模板",
      "description": "专门用于季度计划的导入模板",
      "sample_count": 1
    }
  ]
}
```

### 4. 获取导入指南
**GET** `/import-guide/`

获取详细的导入指南和字段说明。

## 导出功能

### 1. Excel数据导出
**POST** `/export-excel/`

导出计划数据到Excel文件。

**请求参数：**
```json
{
  "plan_ids": [1, 2, 3],
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "plan_type": "annual",
  "status": "executing"
}
```

**响应：** Excel文件下载

### 2. 获取导出统计
**GET** `/export-statistics/`

获取导出数据的统计信息。

**查询参数：**
- `plan_ids[]`: 计划ID列表
- `start_date`: 开始日期过滤
- `end_date`: 结束日期过滤
- `plan_type`: 计划类型过滤
- `status`: 计划状态过滤

**响应示例：**
```json
{
  "message": "获取导出统计信息成功",
  "data": {
    "total_plans": 5,
    "total_regional_plans": 15,
    "status_distribution": {
      "执行中": 3,
      "已完成": 2
    },
    "type_distribution": {
      "年度计划": 4,
      "季度计划": 1
    },
    "date_range": {
      "earliest_start": "2024-01-01",
      "latest_end": "2024-12-31"
    }
  }
}
```

## Excel文件格式

### 导入文件必需列

| 列名 | 说明 | 必填 | 示例 |
|------|------|------|------|
| 计划名称 | 开店计划的名称 | 是 | 2024年华东区开店计划 |
| 计划类型 | 计划类型 | 是 | 年度计划 |
| 开始日期 | 计划开始日期 | 是 | 2024-01-01 |
| 结束日期 | 计划结束日期 | 是 | 2024-12-31 |
| 计划描述 | 计划的详细描述 | 否 | 2024年华东区域开店计划 |
| 经营区域 | 经营区域名称 | 是 | 华东区 |
| 区域编码 | 经营区域编码 | 否 | HD |
| 门店类型 | 门店类型名称 | 是 | 直营店 |
| 类型编码 | 门店类型编码 | 否 | ZY |
| 目标数量 | 目标开店数量 | 是 | 50 |
| 贡献率(%) | 贡献率百分比 | 否 | 30.5 |
| 预算金额 | 预算金额 | 否 | 5000000 |

### 导出文件包含列

导出文件包含所有导入列，另外还包括：
- 计划状态
- 完成数量
- 完成率(%)
- 创建人
- 创建时间
- 发布时间
- 取消时间
- 取消原因

## 业务规则

1. **唯一性约束**
   - 同一计划中，相同区域和门店类型的组合不能重复
   - 计划名称不能与现有计划重复

2. **数据验证**
   - 结束日期必须晚于开始日期
   - 目标数量必须大于0
   - 贡献率必须在0-100之间
   - 预算金额不能为负数

3. **业务约束**
   - 同一计划的总贡献率不能超过100%
   - 经营区域和门店类型必须在系统中已存在且启用

## 错误处理

### 常见错误类型

1. **文件格式错误**
   - 不支持的文件格式
   - 文件大小超限（>10MB）
   - 文件结构不正确

2. **数据验证错误**
   - 必填字段缺失
   - 数据格式不正确
   - 数据范围超出限制

3. **业务规则错误**
   - 违反唯一性约束
   - 违反业务逻辑规则
   - 引用的基础数据不存在

### 错误响应格式

```json
{
  "message": "数据导入失败",
  "data": {
    "success": false,
    "errors": [
      {
        "type": "data_error",
        "message": "计划名称不能为空",
        "row": 3
      },
      {
        "type": "business_rule_error",
        "message": "计划名称已存在",
        "row": null
      }
    ]
  }
}
```

## 使用示例

### Python示例

```python
import requests

# 1. 下载导入模板
response = requests.get(
    'http://localhost:8000/api/store-planning/import-export/download-template/',
    params={'type': 'standard', 'include_sample': 'true'}
)
with open('template.xlsx', 'wb') as f:
    f.write(response.content)

# 2. 导入数据
with open('data.xlsx', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/store-planning/import-export/import-excel/',
        files={'file': f}
    )
    result = response.json()
    print(f"导入结果: {result['data']['success_count']} 成功, {result['data']['error_count']} 失败")

# 3. 导出数据
response = requests.post(
    'http://localhost:8000/api/store-planning/import-export/export-excel/',
    json={
        'plan_type': 'annual',
        'status': 'executing'
    }
)
with open('export.xlsx', 'wb') as f:
    f.write(response.content)
```

### JavaScript示例

```javascript
// 1. 上传文件导入
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/store-planning/import-export/import-excel/', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('导入结果:', data);
});

// 2. 导出数据
fetch('/api/store-planning/import-export/export-excel/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        plan_type: 'annual',
        status: 'executing'
    })
})
.then(response => response.blob())
.then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.xlsx';
    a.click();
});
```

## 性能建议

1. **批量导入**
   - 建议每次导入不超过1000行数据
   - 大量数据可分批次导入

2. **导出优化**
   - 使用过滤条件减少导出数据量
   - 避免导出过大的数据集

3. **错误处理**
   - 导入前先验证数据格式
   - 及时处理导入错误并重试

## 权限要求

- 导入功能：需要计划创建权限
- 导出功能：需要计划查看权限
- 模板下载：需要基本访问权限