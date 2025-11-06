# 报表生成服务API文档

## 概述

报表生成服务提供异步的报表生成功能，支持多种报表类型和导出格式。

## 功能特性

- ✅ 异步报表生成（使用Celery）
- ✅ 支持4种报表类型：开店计划、拓店跟进、筹备进度、门店资产
- ✅ 支持Excel和PDF格式导出
- ✅ 任务状态跟踪和进度显示
- ✅ 权限控制和数据过滤
- ✅ 自动文件清理

## API端点

### 1. 创建报表生成任务

**POST** `/api/analytics/reports/generate/`

#### 请求参数

```json
{
  "report_type": "plan",  // 必需：报表类型 (plan|follow_up|preparation|assets)
  "filters": {            // 可选：筛选条件
    "date_range": "2024-01-01,2024-12-31",
    "regions": [1, 2, 3],
    "store_types": ["standard", "flagship"],
    "statuses": ["active", "completed"],
    "assigned_users": [1, 2]
  },
  "format": "excel"       // 可选：导出格式 (excel|pdf)，默认excel
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "报表任务创建成功",
  "data": {
    "task_id": "123e4567-e89b-12d3-a456-426614174000",
    "report_type": "plan",
    "format": "excel",
    "estimated_time": 30,
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

### 2. 查询报表任务状态

**GET** `/api/analytics/reports/status/{task_id}/`

#### 响应示例

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "task_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "completed",  // pending|processing|completed|failed
    "progress": 100,
    "created_at": "2024-01-01T10:00:00Z",
    "download_url": "/api/analytics/reports/download/123e4567-e89b-12d3-a456-426614174000/"
  }
}
```

### 3. 下载报表文件

**GET** `/api/analytics/reports/download/{task_id}/`

返回文件下载响应，文件名格式：`{报表类型}_{时间戳}.xlsx`

## 报表类型说明

### 1. 开店计划报表 (plan)

包含字段：
- 计划名称、计划类型、业务区域
- 门店类型、目标数量、完成数量、完成率
- 贡献率、计划日期、状态等

统计汇总：
- 总计划数、总目标数量、总完成数量
- 平均完成率、整体完成率

### 2. 拓店跟进进度报表 (follow_up)

包含字段：
- 跟进单号、点位信息、跟进状态
- 负责人、投资预测、ROI预测
- 跟进天数、是否超期等

统计汇总：
- 总跟进数、超期数量、超期率
- 平均跟进天数、平均预计ROI

### 3. 筹备进度报表 (preparation)

包含字段：
- 工程单号、门店名称、施工供应商
- 工程状态、施工日期、进度情况
- 验收结果、整改项、交付状态等

统计汇总：
- 总工程数、已完成数、延期数量
- 延期率、按时完工率、平均进度

### 4. 门店资产报表 (assets)

包含字段：
- 门店信息、资产类型、资产名称
- 数量、价值、状态、购置日期等

统计汇总：
- 涉及门店数、资产总数量、总价值
- 平均单店资产价值

## 筛选条件说明

### 通用筛选条件

- `date_range`: 日期范围，格式：`YYYY-MM-DD,YYYY-MM-DD`
- `regions`: 业务区域ID数组
- `store_types`: 门店类型数组
- `statuses`: 状态数组

### 特定筛选条件

- `assigned_users`: 负责人ID数组（适用于跟进报表）

## 权限控制

- 用户只能生成有权限访问的数据报表
- 基础级别用户无法生成报表
- 报表数据会根据用户权限进行过滤
- 用户只能下载自己创建的报表

## 任务状态说明

- `pending`: 等待处理
- `processing`: 正在生成
- `completed`: 生成完成
- `failed`: 生成失败

## 错误码说明

- `400`: 请求参数错误
- `403`: 权限不足
- `404`: 任务或文件不存在
- `500`: 服务器内部错误

## 使用示例

### JavaScript示例

```javascript
// 创建报表任务
const createReport = async () => {
  const response = await fetch('/api/analytics/reports/generate/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      report_type: 'plan',
      filters: {
        date_range: '2024-01-01,2024-12-31',
        regions: [1, 2]
      },
      format: 'excel'
    })
  });
  
  const result = await response.json();
  return result.data.task_id;
};

// 轮询任务状态
const pollTaskStatus = async (taskId) => {
  const response = await fetch(`/api/analytics/reports/status/${taskId}/`);
  const result = await response.json();
  
  if (result.data.status === 'completed') {
    // 下载文件
    window.open(result.data.download_url);
  } else if (result.data.status === 'failed') {
    console.error('报表生成失败');
  } else {
    // 继续轮询
    setTimeout(() => pollTaskStatus(taskId), 2000);
  }
};
```

### Python示例

```python
import requests
import time

# 创建报表任务
def create_report():
    url = 'http://localhost:8000/api/analytics/reports/generate/'
    data = {
        'report_type': 'follow_up',
        'filters': {
            'date_range': '2024-01-01,2024-12-31',
            'statuses': ['investigating', 'calculating']
        },
        'format': 'excel'
    }
    
    response = requests.post(url, json=data, headers={'Authorization': f'Bearer {token}'})
    return response.json()['data']['task_id']

# 等待任务完成
def wait_for_completion(task_id):
    while True:
        url = f'http://localhost:8000/api/analytics/reports/status/{task_id}/'
        response = requests.get(url, headers={'Authorization': f'Bearer {token}'})
        data = response.json()['data']
        
        if data['status'] == 'completed':
            return data['download_url']
        elif data['status'] == 'failed':
            raise Exception('报表生成失败')
        
        time.sleep(2)
```

## 注意事项

1. 报表文件会在7天后自动清理
2. 大量数据的报表生成可能需要较长时间
3. 建议使用轮询方式检查任务状态
4. PDF格式目前返回Excel格式（待完善）
5. 资产报表目前使用示例数据（待完善资产管理模块）