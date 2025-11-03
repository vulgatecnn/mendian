# 拓店管理模块 (Store Expansion)

## 模块概述

拓店管理模块负责管理门店从选址到签约的全过程，包括候选点位管理、铺位跟进、盈利测算等核心功能。

## 主要功能

### 1. 候选点位管理
- 候选点位信息录入和维护
- 点位查询和筛选
- 点位删除前关联检查

### 2. 铺位跟进管理
- 跟进单创建和管理
- 调研信息录入
- 盈利测算
- 签约信息录入
- 合同提醒设置
- 放弃跟进标记

### 3. 盈利测算
- 可配置的计算公式
- 投资回报率（ROI）计算
- 回本周期计算
- 贡献率计算

### 4. 低贡献率预警
- 低贡献率门店统计
- 报店审批预警

## 数据模型

### CandidateLocation（候选点位）
- 点位基本信息（名称、地址、面积、租金等）
- 所属业务大区
- 点位状态

### FollowUpRecord（铺位跟进单）
- 跟进单号
- 关联候选点位
- 调研信息
- 商务条件
- 盈利测算
- 签约信息
- 合同提醒

### ProfitCalculation（盈利测算）
- 投资成本（租金、装修、设备等）
- 销售预测
- 计算结果（ROI、回本周期、贡献率）
- 计算公式版本

## API 接口

### 候选点位管理
- `POST /api/expansion/locations/` - 创建候选点位
- `GET /api/expansion/locations/` - 查询候选点位列表
- `GET /api/expansion/locations/{id}/` - 获取点位详情
- `PUT /api/expansion/locations/{id}/` - 更新点位信息
- `DELETE /api/expansion/locations/{id}/` - 删除点位

### 铺位跟进管理
- `POST /api/expansion/follow-ups/` - 创建跟进单
- `GET /api/expansion/follow-ups/` - 查询跟进单列表
- `GET /api/expansion/follow-ups/{id}/` - 获取跟进单详情
- `PUT /api/expansion/follow-ups/{id}/` - 更新跟进单
- `POST /api/expansion/follow-ups/{id}/survey/` - 录入调研信息
- `POST /api/expansion/follow-ups/{id}/calculate/` - 执行盈利测算
- `POST /api/expansion/follow-ups/{id}/contract/` - 录入签约信息
- `POST /api/expansion/follow-ups/{id}/abandon/` - 标记放弃
- `POST /api/expansion/follow-ups/{id}/submit-approval/` - 发起报店审批

### 盈利测算配置
- `GET /api/expansion/profit-formulas/` - 获取盈利测算公式配置
- `PUT /api/expansion/profit-formulas/` - 更新公式配置

## 目录结构

```
store_expansion/
├── __init__.py
├── apps.py              # 应用配置
├── models.py            # 数据模型
├── serializers.py       # 序列化器
├── views.py             # 视图
├── urls.py              # URL 配置
├── admin.py             # 管理后台配置
├── services/            # 业务逻辑服务
│   ├── __init__.py
│   ├── profit_calculation_engine.py    # 盈利测算引擎
│   └── warning_service.py              # 预警服务
├── tests/               # 测试
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_views.py
│   └── test_services.py
└── migrations/          # 数据库迁移文件
```

## 依赖关系

### 依赖的模块
- `system_management` - 用户、部门、权限管理
- `base_data` - 业务大区、供应商、法人主体等基础数据

### 被依赖的模块
- `store_preparation` - 开店筹备模块（使用跟进单信息）
- `store_archive` - 门店档案模块（使用跟进单信息）
- `approval` - 审批中心模块（报店审批）

## 使用说明

### 1. 创建候选点位
```python
from store_expansion.models import CandidateLocation

location = CandidateLocation.objects.create(
    name="XX商场一楼",
    province="广东省",
    city="深圳市",
    district="南山区",
    address="科技园南区XX路XX号",
    area=150.00,
    rent=30000.00,
    business_region=region,
    status="available",
    created_by=user
)
```

### 2. 创建跟进单
```python
from store_expansion.models import FollowUpRecord

follow_up = FollowUpRecord.objects.create(
    location=location,
    status="investigating",
    priority="high",
    created_by=user
)
```

### 3. 执行盈利测算
```python
from store_expansion.services.profit_calculation_engine import ProfitCalculationEngine

engine = ProfitCalculationEngine(formula_config)
calculation = engine.calculate(business_terms, sales_forecast)
follow_up.profit_calculation = calculation
follow_up.save()
```

## 注意事项

1. 删除候选点位前需要检查是否已关联跟进单
2. 盈利测算公式可配置，修改后只影响新创建的测算
3. 低贡献率预警需要配置大区的计划参数
4. 合同提醒需要配置 Celery 定时任务
