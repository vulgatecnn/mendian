# 开店计划审批流程API文档

## 概述

本文档描述了开店计划审批流程集成的API接口，包括审批申请提交、审批处理、外部系统集成和通知机制。

## API端点

### 1. 审批管理API

#### 1.1 提交审批申请

**端点**: `POST /api/store-planning/approvals/`

**描述**: 提交计划审批申请

**请求参数**:
```json
{
  "plan_id": 1,
  "approval_type": "plan_publish",
  "additional_data": {
    "cancel_reason": "业务调整",
    "modification_reason": "目标调整"
  }
}
```

**响应示例**:
```json
{
  "message": "审批申请提交成功",
  "data": {
    "id": 1,
    "plan": 1,
    "approval_type": "plan_publish",
    "status": "pending",
    "submitted_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 1.2 审批通过

**端点**: `POST /api/store-planning/approvals/{id}/approve/`

**描述**: 审批通过

**请求参数**:
```json
{
  "approval_notes": "审批通过，同意发布计划"
}
```

#### 1.3 审批拒绝

**端点**: `POST /api/store-planning/approvals/{id}/reject/`

**描述**: 审批拒绝

**请求参数**:
```json
{
  "rejection_reason": "计划目标不合理，需要重新制定"
}
```

#### 1.4 取消审批申请

**端点**: `POST /api/store-planning/approvals/{id}/cancel_approval/`

**描述**: 取消审批申请

#### 1.5 获取待审批列表

**端点**: `GET /api/store-planning/approvals/pending_approvals/`

**描述**: 获取待审批列表

**查询参数**:
- `approval_type`: 审批类型过滤

#### 1.6 获取我的审批申请

**端点**: `GET /api/store-planning/approvals/my_approvals/`

**描述**: 获取当前用户提交的审批申请

**查询参数**:
- `status`: 状态过滤

#### 1.7 获取审批状态

**端点**: `GET /api/store-planning/approvals/approval_status/`

**描述**: 获取计划的审批状态

**查询参数**:
- `plan_id`: 计划ID（必填）
- `approval_type`: 审批类型过滤

#### 1.8 检查审批超时

**端点**: `GET /api/store-planning/approvals/timeout_check/`

**描述**: 检查审批超时情况

#### 1.9 获取审批统计

**端点**: `GET /api/store-planning/approvals/statistics/`

**描述**: 获取审批统计数据

**查询参数**:
- `start_date`: 开始日期（YYYY-MM-DD）
- `end_date`: 结束日期（YYYY-MM-DD）

#### 1.10 批量审批

**端点**: `POST /api/store-planning/approvals/batch_approve/`

**描述**: 批量审批通过

**请求参数**:
```json
{
  "approval_ids": [1, 2, 3],
  "approval_notes": "批量审批通过"
}
```

#### 1.11 批量拒绝

**端点**: `POST /api/store-planning/approvals/batch_reject/`

**描述**: 批量审批拒绝

**请求参数**:
```json
{
  "approval_ids": [1, 2, 3],
  "rejection_reason": "批量拒绝原因"
}
```

### 2. 外部审批系统集成API

#### 2.1 同步外部审批结果

**端点**: `POST /api/store-planning/approvals/sync_external_results/`

**描述**: 同步外部审批系统的审批结果

**请求参数**:
```json
{
  "approval_ids": [1, 2, 3]  // 可选，不提供则同步所有
}
```

#### 2.2 外部审批回调

**端点**: `POST /api/store-planning/approvals/external_callback/`

**描述**: 处理外部审批系统的回调

**请求参数**:
```json
{
  "external_approval_id": "ext_123456",
  "callback_data": {
    "status": "approved",
    "approval_notes": "外部系统审批通过",
    "approved_by": "external_user",
    "approved_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 2.3 获取外部系统状态

**端点**: `GET /api/store-planning/approvals/external_system_status/`

**描述**: 获取外部审批系统的连接状态和配置信息

### 3. 通知管理API

#### 3.1 手动发送通知

**端点**: `POST /api/store-planning/approvals/send_notification/`

**描述**: 手动发送审批通知

**请求参数**:
```json
{
  "approval_id": 1,
  "action": "submitted"  // submitted, approved, rejected, cancelled, timeout
}
```

#### 3.2 检查超时通知

**端点**: `POST /api/store-planning/approvals/check_timeout_notifications/`

**描述**: 检查并发送超时通知

#### 3.3 获取通知配置

**端点**: `GET /api/store-planning/approvals/notification_config/`

**描述**: 获取通知系统的配置信息

### 4. 计划审批相关API

#### 4.1 提交计划审批

**端点**: `POST /api/store-planning/plans/{id}/submit_for_approval/`

**描述**: 为指定计划提交审批申请

**请求参数**:
```json
{
  "approval_type": "plan_publish",
  "additional_data": {
    "cancel_reason": "业务调整"
  }
}
```

## 审批类型

- `plan_publish`: 计划发布审批
- `plan_cancel`: 计划取消审批
- `plan_modify`: 计划修改审批

## 审批状态

- `pending`: 待审批
- `approved`: 已通过
- `rejected`: 已拒绝
- `cancelled`: 已取消

## 通知渠道

系统支持多种通知渠道：

1. **邮件通知**: 发送邮件到用户邮箱
2. **企业微信通知**: 通过企业微信API发送消息
3. **短信通知**: 发送短信到用户手机
4. **Webhook通知**: 发送HTTP请求到指定URL

## 配置说明

### 外部审批系统配置

在Django settings中配置：

```python
EXTERNAL_APPROVAL_SYSTEM = {
    'enabled': True,
    'base_url': 'https://approval.company.com',
    'api_key': 'your_api_key',
    'timeout': 30
}
```

### 通知系统配置

```python
NOTIFICATION_CONFIG = {
    'enabled_channels': ['email', 'wechat'],
    'email': {
        'enabled': True,
        'from_email': 'noreply@company.com'
    },
    'wechat': {
        'enabled': True,
        'corp_id': 'your_corp_id',
        'corp_secret': 'your_corp_secret',
        'agent_id': 'your_agent_id'
    }
}
```

### 审批超时配置

```python
# 审批超时天数
PLAN_APPROVAL_TIMEOUT_DAYS = 7

# 审批日志清理天数
APPROVAL_LOG_CLEANUP_DAYS = 90
```

## Celery定时任务

系统包含以下定时任务：

1. **审批超时检查**: 每小时检查一次审批超时情况
2. **外部审批结果同步**: 每30分钟同步一次外部审批结果
3. **旧日志清理**: 每天凌晨2点清理旧的审批日志
4. **统计报告生成**: 每周一上午9点生成审批统计报告

## 管理命令

### 检查审批超时

```bash
python manage.py check_approval_timeout --timeout-days 7 --send-notification
```

参数说明：
- `--timeout-days`: 超时天数（默认7天）
- `--send-notification`: 发送超时通知
- `--dry-run`: 仅检查不发送通知

## 错误处理

所有API都遵循统一的错误响应格式：

```json
{
  "error": "错误描述",
  "details": {
    "field": "具体错误信息"
  }
}
```

常见错误码：
- `400`: 请求参数错误
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 权限控制

审批相关操作需要相应的权限：

- `can_submit_approval`: 提交审批申请
- `can_approve_plan_publish`: 审批计划发布
- `can_approve_plan_cancel`: 审批计划取消
- `can_approve_plan_modify`: 审批计划修改
- `can_view_all_approvals`: 查看所有审批申请

## 日志记录

系统会记录所有审批相关的操作日志，包括：

- 审批申请提交
- 审批通过/拒绝
- 外部审批结果同步
- 通知发送记录

日志可通过计划执行记录API查询：`GET /api/store-planning/plans/{id}/execution_logs/`