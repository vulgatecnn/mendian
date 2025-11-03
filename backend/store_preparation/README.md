# 开店筹备管理模块 (store_preparation)

## 模块概述

开店筹备管理模块负责管理门店从签约后到开业前的施工和交付过程，包括工程管理、里程碑跟踪和交付清单管理。

## 核心功能

### 1. 工程管理
- 工程单创建和管理
- 设计图纸上传
- 施工计划管理
- 工程验收
- 整改项跟踪

### 2. 里程碑管理
- 自定义工程里程碑
- 里程碑进度跟踪
- 到期提醒通知

### 3. 交付管理
- 交付清单创建
- 交付文档管理
- 交付状态跟踪

## 数据模型

### ConstructionOrder (工程单)
记录门店施工和验收的完整信息。

**主要字段**：
- `order_no`: 工程单号
- `store_name`: 门店名称
- `follow_up_record`: 关联跟进单
- `design_files`: 设计图纸
- `construction_start_date`: 开工日期
- `construction_end_date`: 预计完工日期
- `supplier`: 施工供应商
- `status`: 工程状态
- `acceptance_result`: 验收结果
- `rectification_items`: 整改项

### Milestone (工程里程碑)
记录工程的关键节点和进度。

**主要字段**：
- `construction_order`: 关联工程单
- `name`: 里程碑名称
- `planned_date`: 计划日期
- `actual_date`: 实际完成日期
- `status`: 状态
- `reminder_sent`: 是否已发送提醒

### DeliveryChecklist (交付清单)
记录门店交付时的资料和物品清单。

**主要字段**：
- `checklist_no`: 清单编号
- `construction_order`: 关联工程单
- `store_name`: 门店名称
- `delivery_items`: 交付项
- `documents`: 交付文档
- `status`: 交付状态
- `delivery_date`: 交付日期

## API 接口

### 工程管理 API
```
POST   /api/v1/preparation/construction/          # 创建工程单
GET    /api/v1/preparation/construction/          # 查询工程单列表
GET    /api/v1/preparation/construction/{id}/     # 获取工程单详情
PUT    /api/v1/preparation/construction/{id}/     # 更新工程单
POST   /api/v1/preparation/construction/{id}/milestones/ # 添加里程碑
PUT    /api/v1/preparation/construction/{id}/milestones/{mid}/ # 更新里程碑
POST   /api/v1/preparation/construction/{id}/acceptance/ # 执行验收
POST   /api/v1/preparation/construction/{id}/rectification/ # 标记整改项
```

### 交付管理 API
```
POST   /api/v1/preparation/delivery/              # 创建交付清单
GET    /api/v1/preparation/delivery/              # 查询交付清单列表
GET    /api/v1/preparation/delivery/{id}/         # 获取交付清单详情
PUT    /api/v1/preparation/delivery/{id}/         # 更新交付清单
POST   /api/v1/preparation/delivery/{id}/upload/  # 上传交付文档
```

## 服务类

### MilestoneReminderService
里程碑提醒服务，通过 Celery 定时任务检查即将到期的里程碑并发送通知。

**主要方法**：
- `check_and_send_reminders()`: 检查并发送里程碑提醒

## 业务流程

### 工程管理流程
1. 商务人员创建工程单，上传设计图纸
2. 录入施工计划和里程碑
3. 系统自动监控里程碑到期并发送提醒
4. 商务人员执行验收操作
5. 标记待整改项并跟踪整改进度
6. 验收通过后进入交付阶段

### 交付管理流程
1. 商务人员创建交付清单
2. 上传交付相关文档和图片
3. 确认交付完成
4. 门店进入运营阶段

## 权限控制

- 工程单创建：商务人员
- 工程单查看：根据数据权限范围
- 工程单编辑：创建人或商务负责人
- 验收操作：商务人员
- 交付管理：商务人员

## 依赖关系

- **store_expansion**: 关联跟进单
- **base_data**: 关联供应商
- **system_management**: 关联用户和部门
- **notification**: 发送里程碑提醒

## 使用示例

### 创建工程单
```python
from store_preparation.models import ConstructionOrder

order = ConstructionOrder.objects.create(
    order_no='GC202311030001',
    store_name='好饭碗北京朝阳店',
    follow_up_record=follow_up_record,
    construction_start_date='2023-11-10',
    construction_end_date='2023-12-31',
    supplier=supplier,
    status='planning',
    created_by=user
)
```

### 添加里程碑
```python
from store_preparation.models import Milestone

milestone = Milestone.objects.create(
    construction_order=order,
    name='水电改造完成',
    planned_date='2023-11-20',
    status='pending'
)
```

### 发送里程碑提醒
```python
from store_preparation.services.reminder_service import MilestoneReminderService

service = MilestoneReminderService()
service.check_and_send_reminders()
```

## 注意事项

1. 工程单号自动生成，格式：GC + 年月日 + 4位序号
2. 里程碑提醒提前3天发送
3. 验收操作需要记录验收结果和整改项
4. 交付清单编号自动生成，格式：JF + 年月日 + 4位序号
5. 所有文件上传需要验证文件类型和大小

## 测试

运行测试：
```bash
python manage.py test store_preparation
```

## 相关文档

- [需求文档](../../.kiro/specs/phase-one-core-modules/requirements.md)
- [设计文档](../../.kiro/specs/phase-one-core-modules/design.md)
- [任务列表](../../.kiro/specs/phase-one-core-modules/tasks.md)
