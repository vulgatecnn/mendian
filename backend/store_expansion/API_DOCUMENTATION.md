# 拓店管理模块 API 文档

## 概述

拓店管理模块提供了从候选点位管理到铺位跟进、盈利测算、签约的完整业务流程支持。

## 基础 URL

```
/api/expansion/
```

## 认证

所有 API 接口都需要用户登录认证。

---

## 候选点位管理 API

### 1. 创建候选点位

**接口地址：** `POST /api/expansion/locations/`

**请求参数：**

```json
{
  "name": "XX商场一楼",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "address": "科技园南区XX路XX号",
  "area": 150.00,
  "rent": 30000.00,
  "business_region": 1,
  "remark": "备注信息"
}
```

**响应示例：**

```json
{
  "id": 1,
  "name": "XX商场一楼",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "address": "科技园南区XX路XX号",
  "area": "150.00",
  "rent": "30000.00",
  "business_region": 1,
  "business_region_name": "华南大区",
  "status": "available",
  "remark": "备注信息",
  "created_by": 1,
  "created_by_name": "张三",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

### 2. 查询候选点位列表

**接口地址：** `GET /api/expansion/locations/`

**查询参数：**

- `status`: 状态筛选（available/following/signed/abandoned）
- `business_region`: 业务大区ID
- `province`: 省份
- `city`: 城市
- `district`: 区县
- `search`: 搜索关键词（点位名称、地址）
- `ordering`: 排序字段（created_at/-created_at/area/-area/rent/-rent）
- `page`: 页码
- `page_size`: 每页数量

**响应示例：**

```json
{
  "count": 100,
  "next": "http://api.example.com/api/expansion/locations/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "XX商场一楼",
      "city": "深圳市",
      "district": "南山区",
      "area": "150.00",
      "rent": "30000.00",
      "business_region_name": "华南大区",
      "status": "available",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### 3. 获取候选点位详情

**接口地址：** `GET /api/expansion/locations/{id}/`

### 4. 更新候选点位

**接口地址：** `PUT /api/expansion/locations/{id}/`

### 5. 删除候选点位

**接口地址：** `DELETE /api/expansion/locations/{id}/`

**注意：** 如果点位已关联跟进单，将无法删除。

---

## 铺位跟进管理 API

### 1. 创建跟进单

**接口地址：** `POST /api/expansion/follow-ups/`

**请求参数：**

```json
{
  "location": 1,
  "priority": "high",
  "remark": "重点跟进"
}
```

**响应示例：**

```json
{
  "id": 1,
  "record_no": "FU202401010001",
  "location": 1,
  "location_name": "XX商场一楼",
  "location_address": "深圳市南山区科技园南区XX路XX号",
  "business_region_name": "华南大区",
  "status": "investigating",
  "priority": "high",
  "survey_data": {},
  "survey_date": null,
  "business_terms": {},
  "profit_calculation": null,
  "contract_info": {},
  "contract_date": null,
  "contract_reminders": [],
  "legal_entity": null,
  "is_abandoned": false,
  "abandon_reason": "",
  "abandon_date": null,
  "remark": "重点跟进",
  "created_by": 1,
  "created_by_name": "张三",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

### 2. 查询跟进单列表

**接口地址：** `GET /api/expansion/follow-ups/`

**查询参数：**

- `status`: 状态筛选
- `priority`: 优先级筛选
- `is_abandoned`: 是否放弃
- `location__business_region`: 业务大区ID
- `search`: 搜索关键词（跟进单号、点位名称、地址）
- `ordering`: 排序字段
- `page`: 页码
- `page_size`: 每页数量

### 3. 获取跟进单详情

**接口地址：** `GET /api/expansion/follow-ups/{id}/`

### 4. 更新跟进单

**接口地址：** `PUT /api/expansion/follow-ups/{id}/`

### 5. 录入调研信息

**接口地址：** `POST /api/expansion/follow-ups/{id}/survey/`

**请求参数：**

```json
{
  "survey_date": "2024-01-05",
  "survey_data": {
    "traffic": "人流量大",
    "competition": "周边竞争较少",
    "environment": "商业环境良好"
  }
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "调研信息录入成功",
  "data": {
    // 完整的跟进单信息
  }
}
```

### 6. 执行盈利测算

**接口地址：** `POST /api/expansion/follow-ups/{id}/calculate/`

**请求参数：**

```json
{
  "business_terms": {
    "rent_cost": 30000.00,
    "decoration_cost": 200000.00,
    "equipment_cost": 150000.00,
    "other_cost": 50000.00
  },
  "sales_forecast": {
    "daily_sales": 8000.00,
    "monthly_sales": 240000.00
  }
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "盈利测算完成",
  "data": {
    "follow_up": {
      // 跟进单信息
    },
    "calculation": {
      "id": 1,
      "rent_cost": "30000.00",
      "decoration_cost": "200000.00",
      "equipment_cost": "150000.00",
      "other_cost": "50000.00",
      "daily_sales": "8000.00",
      "monthly_sales": "240000.00",
      "total_investment": "430000.00",
      "roi": "25.50",
      "payback_period": 48,
      "contribution_rate": "12.50",
      "formula_version": "v1.0",
      "calculation_params": {
        "cost_rate": 0.35,
        "expense_rate": 0.25,
        "tax_rate": 0.06,
        "months_per_year": 12
      },
      "calculated_at": "2024-01-05T14:30:00Z"
    }
  }
}
```

### 7. 录入签约信息

**接口地址：** `POST /api/expansion/follow-ups/{id}/contract/`

**请求参数：**

```json
{
  "contract_date": "2024-01-10",
  "contract_info": {
    "contract_no": "HT202401100001",
    "contract_amount": 430000.00,
    "contract_period": "5年",
    "payment_terms": "按季度支付"
  },
  "contract_reminders": [
    {
      "type": "renewal",
      "remind_date": "2028-12-10",
      "description": "合同到期提醒"
    }
  ],
  "legal_entity": 1
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "签约信息录入成功",
  "data": {
    // 完整的跟进单信息
  }
}
```

### 8. 标记放弃跟进

**接口地址：** `POST /api/expansion/follow-ups/{id}/abandon/`

**请求参数：**

```json
{
  "abandon_reason": "租金过高，超出预算"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "已标记为放弃跟进",
  "data": {
    // 完整的跟进单信息
  }
}
```

### 9. 发起报店审批

**接口地址：** `POST /api/expansion/follow-ups/{id}/submit-approval/`

**响应示例：**

```json
{
  "code": 0,
  "message": "报店审批发起成功",
  "data": {
    "follow_up": {
      // 跟进单信息
    },
    "warning": {
      "has_warning": false,
      "current_count": 3,
      "max_count": 5,
      "threshold": 10.0,
      "new_contribution_rate": 12.5,
      "message": "该大区当前有 3 家低贡献率门店，未达到预警红线（5 家）。",
      "warning_level": "low"
    }
  }
}
```

---

## 盈利测算公式配置 API

### 1. 获取当前公式配置

**接口地址：** `GET /api/expansion/profit-formulas/`

**响应示例：**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "version": "v1.0",
    "params": {
      "cost_rate": 0.35,
      "expense_rate": 0.25,
      "tax_rate": 0.06,
      "months_per_year": 12
    }
  }
}
```

### 2. 更新公式配置

**接口地址：** `PUT /api/expansion/profit-formulas/current/`

**请求参数：**

```json
{
  "version": "v1.1",
  "params": {
    "cost_rate": 0.36,
    "expense_rate": 0.24,
    "tax_rate": 0.06,
    "months_per_year": 12
  }
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "公式配置更新成功",
  "data": {
    "version": "v1.1",
    "params": {
      "cost_rate": 0.36,
      "expense_rate": 0.24,
      "tax_rate": 0.06,
      "months_per_year": 12
    }
  }
}
```

### 3. 重置为默认配置

**接口地址：** `POST /api/expansion/profit-formulas/reset/`

**响应示例：**

```json
{
  "code": 0,
  "message": "已重置为默认配置",
  "data": {
    "version": "v1.0",
    "params": {
      "cost_rate": 0.35,
      "expense_rate": 0.25,
      "tax_rate": 0.06,
      "months_per_year": 12
    }
  }
}
```

---

## 错误码说明

- `0`: 成功
- `1000`: 未知错误
- `1001`: 参数错误

---

## 业务流程示例

### 完整的拓店流程

1. **创建候选点位**
   ```
   POST /api/expansion/locations/
   ```

2. **创建跟进单**
   ```
   POST /api/expansion/follow-ups/
   ```

3. **录入调研信息**
   ```
   POST /api/expansion/follow-ups/{id}/survey/
   ```

4. **执行盈利测算**
   ```
   POST /api/expansion/follow-ups/{id}/calculate/
   ```

5. **发起报店审批**
   ```
   POST /api/expansion/follow-ups/{id}/submit-approval/
   ```

6. **录入签约信息**
   ```
   POST /api/expansion/follow-ups/{id}/contract/
   ```

---

## 注意事项

1. 所有金额字段使用 Decimal 类型，保留两位小数
2. 跟进单号自动生成，格式为：FU + 年月日 + 4位序号
3. 删除候选点位前会检查是否已关联跟进单
4. 盈利测算公式可配置，修改后只影响新创建的测算
5. 低贡献率预警会在发起报店审批时自动检查
6. 签约后会自动更新候选点位状态为"已签约"
7. 放弃跟进后会自动更新候选点位状态为"已放弃"
