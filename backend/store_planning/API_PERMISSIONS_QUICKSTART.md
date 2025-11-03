# API权限验证快速参考

## 概述

本文档提供开店计划管理模块API权限验证的快速参考指南。

## 权限装饰器使用

### 1. 基础权限验证

```python
from .permissions import plan_permission_required

@plan_permission_required('store_planning.plan.view')
def list(self, request, *args, **kwargs):
    """获取计划列表"""
    return super().list(request, *args, **kwargs)
```

### 2. 敏感操作二次确认

```python
@plan_permission_required('store_planning.plan.delete', require_confirmation=True)
def destroy(self, request, *args, **kwargs):
    """删除计划（需要二次确认）"""
    # 客户端需要在请求中包含 confirmation=true
    return super().destroy(request, *args, **kwargs)
```

### 3. 状态检查

```python
@plan_permission_required(
    'store_planning.plan.update',
    check_plan_status=['draft', 'published']
)
def update(self, request, *args, **kwargs):
    """只有草稿或已发布状态的计划才能更新"""
    return super().update(request, *args, **kwargs)
```

### 4. 数据范围权限检查

```python
from .permissions import check_data_scope_permission

def retrieve(self, request, *args, **kwargs):
    """获取计划详情"""
    instance = self.get_object()
    
    # 检查数据范围权限
    if not check_data_scope_permission(request.user, instance, 'view'):
        return Response(
            {'error': '权限不足', 'message': '您没有权限查看此计划'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    return super().retrieve(request, *args, **kwargs)
```

### 5. 批量操作权限验证

```python
from .permissions import batch_permission_required

@batch_permission_required('store_planning.approval.approve', max_batch_size=50)
@plan_permission_required('store_planning.approval.approve', require_confirmation=True)
def batch_approve(self, request):
    """批量审批（最多50条）"""
    approval_ids = request.data.get('approval_ids', [])
    # 处理批量审批逻辑
```

### 6. API访问频率限制

```python
from .permissions import rate_limit_permission

@rate_limit_permission(max_requests=60, time_window=60)
@plan_permission_required('store_planning.dashboard.view')
def dashboard(self, request):
    """获取仪表板数据（每分钟最多60次）"""
    # 处理仪表板数据逻辑
```

### 7. 审计日志记录

```python
from .permissions import audit_sensitive_operation

@plan_permission_required('store_planning.plan.create')
@audit_sensitive_operation('plan_create', 'plan')
def create(self, request, *args, **kwargs):
    """创建计划（自动记录审计日志）"""
    return super().create(request, *args, **kwargs)
```

## 客户端请求示例

### 1. 基础API请求

```javascript
// GET请求
fetch('/api/store-planning/plans/', {
    headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    }
})

// POST请求
fetch('/api/store-planning/plans/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: '2024年开店计划',
        plan_type: 'annual',
        // ...其他字段
    })
})
```

### 2. 敏感操作请求（需要二次确认）

```javascript
// 删除计划
fetch('/api/store-planning/plans/123/', {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        confirmation: true  // 必须包含确认参数
    })
})

// 发布计划
fetch('/api/store-planning/plans/123/publish/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        confirmation: true  // 必须包含确认参数
    })
})
```

### 3. 批量操作请求

```javascript
// 批量审批
fetch('/api/store-planning/approvals/batch_approve/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        approval_ids: [1, 2, 3, 4, 5],  // 最多50个
        approval_notes: '批准',
        confirmation: true
    })
})
```

## 错误响应

### 1. 未认证 (401)

```json
{
    "error": "未认证",
    "message": "请先登录"
}
```

### 2. 权限不足 (403)

```json
{
    "error": "权限不足",
    "message": "您没有权限执行此操作"
}
```

### 3. 需要二次确认 (400)

```json
{
    "error": "需要确认",
    "message": "此操作需要二次确认，请在请求中包含 confirmation=true 参数",
    "require_confirmation": true,
    "operation": "destroy"
}
```

### 4. 状态不符合要求 (400)

```json
{
    "error": "状态不符合要求",
    "message": "只有草稿状态的计划才能执行此操作",
    "current_status": "已发布"
}
```

### 5. 批量操作数量超限 (400)

```json
{
    "error": "批量操作数量超限",
    "message": "单次批量操作最多支持50条记录",
    "current_count": 100,
    "max_count": 50
}
```

### 6. 访问频率超限 (429)

```json
{
    "error": "访问频率超限",
    "message": "您在60秒内最多可以访问60次此接口",
    "retry_after": 60
}
```

## 权限检查流程

```
客户端请求
    ↓
认证检查（是否登录）
    ↓
权限验证（是否有权限）
    ↓
状态检查（如果需要）
    ↓
二次确认（如果需要）
    ↓
数据范围权限（如果需要）
    ↓
频率限制（如果需要）
    ↓
执行业务逻辑
    ↓
记录审计日志（如果需要）
    ↓
返回响应
```

## 常用权限编码

| 操作 | 权限编码 | 说明 |
|-----|---------|------|
| 查看计划列表 | `store_planning.plan.view` | 查看自己创建的计划 |
| 查看所有计划 | `store_planning.plan.view_all` | 查看所有计划 |
| 创建计划 | `store_planning.plan.create` | 创建新计划 |
| 更新计划 | `store_planning.plan.update` | 更新自己的计划 |
| 删除计划 | `store_planning.plan.delete` | 删除自己的计划（需确认） |
| 发布计划 | `store_planning.plan.publish` | 发布计划（需确认） |
| 取消计划 | `store_planning.plan.cancel` | 取消计划（需确认） |
| 审批通过 | `store_planning.approval.approve` | 审批通过（需确认） |
| 审批拒绝 | `store_planning.approval.reject` | 审批拒绝（需确认） |
| 查看统计 | `store_planning.statistics.view` | 查看统计数据 |
| 查看仪表板 | `store_planning.dashboard.view` | 查看仪表板 |
| 执行导入 | `store_planning.import.create` | 导入数据 |
| 执行导出 | `store_planning.export.create` | 导出数据 |

## 测试权限

### 使用Python测试

```python
from django.test import TestCase
from system_management.models import User, Permission, Role

class PermissionTestCase(TestCase):
    def setUp(self):
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            phone='13800138000',
            wechat_user_id='test_wechat_id'
        )
        
        # 创建权限
        self.permission = Permission.objects.create(
            code='store_planning.plan.view',
            name='查看计划',
            module='开店计划管理'
        )
        
        # 创建角色并分配权限
        self.role = Role.objects.create(
            name='计划管理员',
            code='plan_manager'
        )
        self.role.permissions.add(self.permission)
        self.user.roles.add(self.role)
    
    def test_user_has_permission(self):
        """测试用户是否有权限"""
        self.assertTrue(
            self.user.has_permission('store_planning.plan.view')
        )
    
    def test_user_no_permission(self):
        """测试用户没有权限"""
        self.assertFalse(
            self.user.has_permission('store_planning.plan.delete')
        )
```

### 使用API测试

```bash
# 测试查看计划列表（需要权限）
curl -X GET http://localhost:8000/api/store-planning/plans/ \
  -H "Authorization: Bearer <token>"

# 测试删除计划（需要权限和二次确认）
curl -X DELETE http://localhost:8000/api/store-planning/plans/123/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": true}'

# 测试批量审批（需要权限、二次确认和批量限制）
curl -X POST http://localhost:8000/api/store-planning/approvals/batch_approve/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "approval_ids": [1, 2, 3],
    "approval_notes": "批准",
    "confirmation": true
  }'
```

## 最佳实践

### 1. 前端权限控制

```javascript
// 检查用户是否有权限
function hasPermission(permissionCode) {
    const userPermissions = getUserPermissions(); // 从后端获取
    return userPermissions.includes(permissionCode) || 
           userPermissions.includes('*');
}

// 根据权限显示/隐藏按钮
if (hasPermission('store_planning.plan.create')) {
    showCreateButton();
}

// 根据权限启用/禁用操作
if (hasPermission('store_planning.plan.delete')) {
    enableDeleteButton();
} else {
    disableDeleteButton();
}
```

### 2. 敏感操作确认

```javascript
// 删除前确认
function deletePlan(planId) {
    if (confirm('确定要删除此计划吗？此操作不可恢复。')) {
        fetch(`/api/store-planning/plans/${planId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                confirmation: true
            })
        })
        .then(response => {
            if (response.ok) {
                alert('删除成功');
            } else {
                return response.json().then(data => {
                    alert(`删除失败: ${data.message}`);
                });
            }
        });
    }
}
```

### 3. 错误处理

```javascript
async function apiRequest(url, options) {
    try {
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            // 未认证，跳转到登录页
            window.location.href = '/login';
            return;
        }
        
        if (response.status === 403) {
            // 权限不足
            const data = await response.json();
            alert(`权限不足: ${data.message}`);
            return;
        }
        
        if (response.status === 429) {
            // 访问频率超限
            const data = await response.json();
            alert(`访问频率超限，请${data.retry_after}秒后重试`);
            return;
        }
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || '请求失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API请求错误:', error);
        alert(`操作失败: ${error.message}`);
    }
}
```

## 故障排查

### 问题1: 权限验证失败但用户确实有权限

**可能原因**：
- 权限缓存未更新
- 用户角色未激活
- 权限编码拼写错误

**解决方法**：
```python
# 清除用户权限缓存
user.clear_permission_cache()

# 检查用户角色是否激活
user.roles.filter(is_active=True)

# 检查权限编码
Permission.objects.filter(code='store_planning.plan.view')
```

### 问题2: 二次确认总是失败

**可能原因**：
- 请求中未包含confirmation参数
- confirmation参数值不正确

**解决方法**：
```javascript
// 确保包含正确的confirmation参数
body: JSON.stringify({
    confirmation: true  // 或 'true', '1', 'yes', 'confirm'
})
```

### 问题3: 批量操作数量超限

**可能原因**：
- 一次性操作的记录数超过限制

**解决方法**：
```javascript
// 分批处理
function batchProcess(ids, batchSize = 50) {
    const batches = [];
    for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
    }
    
    return Promise.all(
        batches.map(batch => processBatch(batch))
    );
}
```

## 相关文档

- [权限配置文档](./PERMISSIONS_CONFIG.md)
- [审计日志文档](../system_management/AUDIT_LOG.md)
- [API文档](./API_DOCUMENTATION.md)
