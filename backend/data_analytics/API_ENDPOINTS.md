# 数据分析模块 API 接口文档

## 概述

本文档描述了数据分析模块提供的API接口，包括经营大屏数据、开店地图、跟进漏斗、计划进度等功能。

## 基础信息

- **基础URL**: `/api/analytics/`
- **认证方式**: Bearer Token (需要登录)
- **响应格式**: JSON

## API 接口列表

### 1. 经营大屏数据接口

**接口地址**: `GET /api/analytics/dashboard/`

**功能描述**: 获取经营大屏的综合数据，包括开店地图、跟进漏斗、计划进度等

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "message": "获取成功",
    "data": {
        "store_map": {
            "stores": [],
            "region_statistics": [],
            "status_statistics": {},
            "total_count": 0
        },
        "follow_up_funnel": {
            "stages": {},
            "conversion_rates": [],
            "total_count": 0,
            "warning_stages": []
        },
        "plan_progress": {
            "plans": [],
            "overall_statistics": {}
        },
        "key_metrics": {
            "total_stores": 0,
            "operating_stores": 0,
            "follow_up_count": 0,
            "construction_count": 0,
            "new_stores_this_month": 0
        },
        "last_updated": "2024-01-01T10:00:00Z"
    }
}
```

### 2. 开店地图数据接口

**接口地址**: `GET /api/analytics/store-map/`

**功能描述**: 获取门店地理分布和状态数据

**请求参数**:
- `region` (可选): 区域ID筛选
- `time_range` (可选): 时间范围，格式：YYYY-MM-DD,YYYY-MM-DD

**响应示例**:
```json
{
    "code": 0,
    "message": "获取成功",
    "data": {
        "stores": [
            {
                "id": 1,
                "name": "门店名称",
                "code": "STORE001",
                "province": "广东省",
                "city": "深圳市",
                "district": "南山区",
                "address": "详细地址",
                "status": "opened",
                "store_type": "直营店",
                "operation_mode": "自营",
                "business_region": {
                    "id": 1,
                    "name": "华南区",
                    "code": "HN"
                },
                "opening_date": "2024-01-01",
                "created_at": "2024-01-01T10:00:00Z"
            }
        ],
        "region_statistics": [
            {
                "region_id": 1,
                "region_name": "华南区",
                "region_code": "HN",
                "total_stores": 10,
                "status_breakdown": {
                    "operating": 8,
                    "preparing": 2
                }
            }
        ],
        "status_statistics": {
            "operating": 50,
            "preparing": 20,
            "planned": 30
        },
        "total_count": 100,
        "last_updated": "2024-01-01T10:00:00Z"
    }
}
```

### 3. 跟进漏斗数据接口

**接口地址**: `GET /api/analytics/follow-up-funnel/`

**功能描述**: 获取拓店流程各环节的转化数据

**请求参数**:
- `start_date` (可选): 开始日期，格式：YYYY-MM-DD
- `end_date` (可选): 结束日期，格式：YYYY-MM-DD
- `region` (可选): 区域ID筛选

**响应示例**:
```json
{
    "code": 0,
    "message": "获取成功",
    "data": {
        "stages": {
            "investigating": {
                "name": "调研中",
                "count": 100,
                "percentage": 40.0
            },
            "calculating": {
                "name": "测算中",
                "count": 80,
                "percentage": 32.0
            },
            "approving": {
                "name": "审批中",
                "count": 50,
                "percentage": 20.0
            },
            "signing": {
                "name": "签约中",
                "count": 20,
                "percentage": 8.0
            },
            "signed": {
                "name": "已签约",
                "count": 10,
                "percentage": 4.0
            }
        },
        "conversion_rates": [
            {
                "from_stage": "调研中",
                "to_stage": "测算中",
                "rate": 80.0,
                "from_count": 100,
                "to_count": 80
            }
        ],
        "total_count": 250,
        "warning_stages": [],
        "last_updated": "2024-01-01T10:00:00Z"
    }
}
```

### 4. 计划完成进度接口

**接口地址**: `GET /api/analytics/plan-progress/`

**功能描述**: 获取开店计划的执行进度分析

**请求参数**:
- `plan_id` (可选): 计划ID，不传则获取当前活跃计划
- `contribution_rate_type` (可选): 贡献率类型筛选，支持：high/medium/low

**响应示例**:
```json
{
    "code": 0,
    "message": "获取成功",
    "data": {
        "plans": [
            {
                "plan_id": 1,
                "plan_name": "2024年开店计划",
                "plan_type": "annual",
                "status": "executing",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "total_target_count": 100,
                "total_completed_count": 45,
                "completion_rate": 45.0,
                "grouped_progress": {
                    "high": {
                        "name": "高贡献率(≥80%)",
                        "target_count": 30,
                        "completed_count": 15,
                        "completion_rate": 50.0
                    },
                    "medium": {
                        "name": "中贡献率(50-80%)",
                        "target_count": 50,
                        "completed_count": 25,
                        "completion_rate": 50.0
                    },
                    "low": {
                        "name": "低贡献率(<50%)",
                        "target_count": 20,
                        "completed_count": 5,
                        "completion_rate": 25.0
                    }
                }
            }
        ],
        "overall_statistics": {
            "total_plans": 1,
            "total_target_count": 100,
            "total_completed_count": 45,
            "overall_completion_rate": 45.0
        },
        "last_updated": "2024-01-01T10:00:00Z"
    }
}
```

### 5. 缓存刷新接口

**接口地址**: `POST /api/analytics/cache/refresh/`

**功能描述**: 手动触发数据缓存刷新

**请求参数**:
```json
{
    "cache_type": "dashboard"  // 可选，支持：dashboard/store_map/funnel/plan_progress，不传则刷新全部
}
```

**响应示例**:
```json
{
    "code": 0,
    "message": "缓存刷新成功: dashboard",
    "data": {
        "cache_type": "dashboard",
        "refreshed_at": "2024-01-01T10:00:00Z"
    }
}
```

### 6. 数据更新状态接口

**接口地址**: `GET /api/analytics/update-status/`

**功能描述**: 获取各模块数据的最后更新时间和状态

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "message": "获取成功",
    "data": {
        "modules": {
            "dashboard": {
                "last_updated": "2024-01-01T10:00:00Z",
                "next_update": "2024-01-01T10:05:00Z",
                "is_expired": false,
                "status": "fresh"
            },
            "store_map": {
                "last_updated": "2024-01-01T09:55:00Z",
                "next_update": "2024-01-01T10:05:00Z",
                "is_expired": false,
                "status": "fresh"
            },
            "follow_up_funnel": {
                "last_updated": "2024-01-01T09:50:00Z",
                "next_update": "2024-01-01T09:55:00Z",
                "is_expired": true,
                "status": "expired"
            },
            "plan_progress": {
                "last_updated": "2024-01-01T10:00:00Z",
                "next_update": "2024-01-01T10:10:00Z",
                "is_expired": false,
                "status": "fresh"
            }
        },
        "overall_status": "needs_update",
        "checked_at": "2024-01-01T10:00:00Z"
    }
}
```

## 错误响应格式

所有接口在出错时都会返回统一的错误格式：

```json
{
    "code": 400,  // 错误代码
    "message": "错误描述信息",
    "data": {}
}
```

常见错误代码：
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 权限控制

所有接口都需要用户登录认证，并根据用户的部门和角色进行数据权限控制：

- **总裁办**: 可查看所有数据
- **商务部**: 可查看拓店相关数据
- **运营部**: 可查看运营相关数据
- **财务部**: 可查看财务相关数据
- **IT部**: 可查看系统监控数据

## 实时数据更新

系统通过以下机制实现实时数据更新：

1. **自动刷新**: 每5分钟自动更新大屏数据
2. **手动刷新**: 通过缓存刷新接口手动触发更新
3. **状态监控**: 通过数据更新状态接口监控各模块更新情况

## 性能优化

- **多层缓存**: Redis + 数据库缓存
- **数据预计算**: 后台定时计算常用统计指标
- **权限过滤**: 根据用户权限过滤数据范围
- **分页查询**: 大数据量支持分页和懒加载