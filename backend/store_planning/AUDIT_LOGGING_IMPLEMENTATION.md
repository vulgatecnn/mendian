# 审计日志实现文档

## 概述

本文档描述了开店计划管理模块的审计日志实现，包括记录的操作类型、日志内容和使用方法。

## 实现的审计日志功能

### 1. 计划管理操作

#### 1.1 计划创建 (Plan Create)
- **操作类型**: `create`
- **目标类型**: `store_plan`
- **记录内容**:
  - 计划名称
  - 计划类型（年度/季度）
  - 开始日期和结束日期
  - 计划描述
  - 目标总数
  - 预算总额
  - 区域计划详情列表

#### 1.2 计划更新 (Plan Update)
- **操作类型**: `update`
- **目标类型**: `store_plan`
- **记录内容**:
  - 更新前的数据（old_data）
  - 更新后的数据（new_data）
  - 变更的字段列表（changed_fields）

#### 1.3 计划删除 (Plan Delete)
- **操作类型**: `delete`
- **目标类型**: `store_plan`
- **记录内容**:
  - 删除前的完整计划数据
  - 计划名称、类型、状态
  - 目标数量和预算金额

#### 1.4 计划发布 (Plan Publish)
- **操作类型**: `publish`
- **目标类型**: `store_plan`
- **记录内容**:
  - 计划名称
  - 旧状态和新状态
  - 发布时间
  - 目标总数和预算总额

#### 1.5 计划取消 (Plan Cancel)
- **操作类型**: `cancel`
- **目标类型**: `store_plan`
- **记录内容**:
  - 计划名称
  - 旧状态和新状态
  - 取消原因
  - 取消时间
  - 目标总数和已完成数量

### 2. 审批管理操作

#### 2.1 提交审批 (Approval Submit)
- **操作类型**: `submit`
- **目标类型**: `plan_approval`
- **记录内容**:
  - 计划ID和计划名称
  - 审批类型
  - 提交人
  - 提交时间
  - 附加数据

#### 2.2 审批通过 (Approval Approve)
- **操作类型**: `approve`
- **目标类型**: `plan_approval`
- **记录内容**:
  - 计划ID和计划名称
  - 审批类型
  - 旧状态和新状态
  - 审批人
  - 审批意见
  - 审批时间

#### 2.3 审批拒绝 (Approval Reject)
- **操作类型**: `reject`
- **目标类型**: `plan_approval`
- **记录内容**:
  - 计划ID和计划名称
  - 审批类型
  - 旧状态和新状态
  - 拒绝人
  - 拒绝原因
  - 拒绝时间

#### 2.4 取消审批申请 (Approval Cancel)
- **操作类型**: `cancel`
- **目标类型**: `plan_approval`
- **记录内容**:
  - 计划ID和计划名称
  - 审批类型
  - 旧状态和新状态
  - 取消人

#### 2.5 批量审批通过 (Batch Approve)
- **操作类型**: `approve`
- **目标类型**: `plan_approval`
- **目标ID**: 0（批量操作标识）
- **记录内容**:
  - 操作类型（batch_approve）
  - 总数量
  - 成功数量和失败数量
  - 审批ID列表
  - 成功的审批ID列表
  - 审批意见
  - 审批人

#### 2.6 批量审批拒绝 (Batch Reject)
- **操作类型**: `reject`
- **目标类型**: `plan_approval`
- **目标ID**: 0（批量操作标识）
- **记录内容**:
  - 操作类型（batch_reject）
  - 总数量
  - 成功数量和失败数量
  - 审批ID列表
  - 成功的审批ID列表
  - 拒绝原因
  - 拒绝人

### 3. 基础数据管理操作

#### 3.1 经营区域操作
- **创建**: 记录区域名称、编码、描述、启用状态
- **更新**: 记录更新前后的数据对比
- **删除**: 记录删除前的完整数据
- **启用/禁用**: 记录状态变更

#### 3.2 门店类型操作
- **创建**: 记录类型名称、编码、描述、启用状态
- **更新**: 记录更新前后的数据对比
- **删除**: 记录删除前的完整数据
- **启用/禁用**: 记录状态变更

### 4. 数据导入导出操作

#### 4.1 数据导入 (Data Import)
- **操作类型**: `import`
- **目标类型**: `store_plan`
- **目标ID**: 0（批量操作标识）
- **记录内容**:
  - 文件名
  - 文件大小
  - 导入是否成功
  - 总行数
  - 成功数量和失败数量
  - 创建的计划列表
  - 错误信息（前5个）

#### 4.2 数据导出 (Data Export)
- **操作类型**: `export`
- **目标类型**: `store_plan`
- **目标ID**: 0（批量操作标识）
- **记录内容**:
  - 文件名
  - 导出参数（计划ID、日期范围、类型、状态等）
  - 文件大小

## 审计日志字段说明

每条审计日志记录包含以下标准字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 日志记录ID |
| user | ForeignKey | 操作用户 |
| action | String | 操作类型（create/update/delete/publish/cancel等） |
| target_type | String | 操作对象类型（store_plan/plan_approval等） |
| target_id | Integer | 操作对象ID |
| details | JSON | 操作详情（JSON格式） |
| ip_address | String | 客户端IP地址 |
| created_at | DateTime | 创建时间 |

## 使用示例

### 1. 在视图中记录审计日志

```python
from system_management.services.audit_service import audit_logger

# 记录计划创建
audit_logger.log_store_plan_create(
    request=request,
    plan_id=plan.id,
    details={
        'plan_name': plan.name,
        'plan_type': plan.plan_type,
        # ... 其他详情
    }
)

# 记录计划更新
audit_logger.log_store_plan_update(
    request=request,
    plan_id=plan.id,
    details={
        'old_data': old_data,
        'new_data': new_data,
        'changed_fields': ['name', 'description']
    }
)

# 记录自定义操作
audit_logger.log(
    request=request,
    action=audit_logger.ACTION_CUSTOM,
    target_type=audit_logger.TARGET_STORE_PLAN,
    target_id=plan.id,
    details={'custom_field': 'custom_value'}
)
```

### 2. 查询审计日志

```python
from system_management.models import AuditLog

# 查询特定计划的所有操作日志
plan_logs = AuditLog.objects.filter(
    target_type='store_plan',
    target_id=plan_id
).order_by('-created_at')

# 查询特定用户的操作日志
user_logs = AuditLog.objects.filter(
    user=user
).order_by('-created_at')

# 查询特定时间范围的日志
from datetime import datetime, timedelta
start_date = datetime.now() - timedelta(days=7)
recent_logs = AuditLog.objects.filter(
    created_at__gte=start_date
).order_by('-created_at')

# 查询特定操作类型的日志
create_logs = AuditLog.objects.filter(
    action='create',
    target_type='store_plan'
).order_by('-created_at')
```

### 3. 分析审计日志

```python
# 统计各操作类型的数量
from django.db.models import Count

action_stats = AuditLog.objects.filter(
    target_type='store_plan'
).values('action').annotate(
    count=Count('id')
).order_by('-count')

# 统计各用户的操作数量
user_stats = AuditLog.objects.filter(
    target_type='store_plan'
).values('user__username').annotate(
    count=Count('id')
).order_by('-count')

# 查找异常操作（如短时间内大量删除）
from datetime import datetime, timedelta
suspicious_deletes = AuditLog.objects.filter(
    action='delete',
    target_type='store_plan',
    created_at__gte=datetime.now() - timedelta(hours=1)
).count()
```

## 权限控制

审计日志的查看权限由系统管理模块控制：

- **普通用户**: 只能查看自己的操作日志
- **管理员**: 可以查看所有用户的操作日志
- **审计员**: 具有完整的审计日志查看和分析权限

## 数据保留策略

- **保留期限**: 审计日志默认保留3年
- **归档策略**: 超过1年的日志自动归档到冷存储
- **清理策略**: 超过3年的日志可以根据合规要求进行清理

## 性能优化

### 1. 数据库索引

审计日志表已创建以下索引以优化查询性能：

```sql
CREATE INDEX idx_audit_log_user ON audit_logs(user_id);
CREATE INDEX idx_audit_log_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_log_action ON audit_logs(action);
CREATE INDEX idx_audit_log_created_at ON audit_logs(created_at);
```

### 2. 异步记录

对于非关键操作，可以考虑使用异步任务记录审计日志：

```python
from celery import shared_task

@shared_task
def log_audit_async(user_id, action, target_type, target_id, details, ip_address):
    """异步记录审计日志"""
    from system_management.models import AuditLog
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    user = User.objects.get(id=user_id)
    
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address
    )
```

## 安全考虑

1. **敏感信息脱敏**: 审计日志中的敏感信息（如密码、密钥）应该脱敏处理
2. **防篡改**: 审计日志一旦创建不允许修改或删除（除非有特殊权限）
3. **访问控制**: 严格控制审计日志的访问权限
4. **完整性校验**: 定期对审计日志进行完整性校验

## 合规性

审计日志实现符合以下合规要求：

- **ISO 27001**: 信息安全管理体系
- **等保2.0**: 网络安全等级保护
- **GDPR**: 欧盟通用数据保护条例（如适用）

## 故障排查

### 常见问题

1. **审计日志未记录**
   - 检查用户是否已认证
   - 检查数据库连接是否正常
   - 检查审计日志服务是否正常运行

2. **审计日志查询慢**
   - 检查数据库索引是否存在
   - 考虑添加时间范围限制
   - 使用分页查询

3. **审计日志占用空间大**
   - 执行归档操作
   - 清理过期日志
   - 优化details字段内容

## 测试

审计日志功能包含完整的单元测试，位于：
- `backend/store_planning/tests/test_audit_logging.py`

运行测试：
```bash
python manage.py test store_planning.tests.test_audit_logging
```

## 未来改进

1. **实时监控**: 实现审计日志的实时监控和告警
2. **可视化分析**: 提供审计日志的可视化分析界面
3. **智能分析**: 使用机器学习检测异常操作模式
4. **区块链存证**: 将关键审计日志上链存证，确保不可篡改

## 相关文档

- [系统管理模块文档](../system_management/README.md)
- [权限控制文档](./PERMISSIONS_CONFIG.md)
- [API文档](./API_DOCUMENTATION.md)
