# 开店计划管理模块权限配置文档

## 权限编码规范

权限编码格式：`store_planning.<模块>.<操作>`

## 权限列表

### 1. 经营区域管理权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.region.view` | 查看经营区域 | 查看经营区域列表和详情 | 低 |
| `store_planning.region.create` | 创建经营区域 | 创建新的经营区域 | 中 |
| `store_planning.region.update` | 更新经营区域 | 修改经营区域信息 | 中 |
| `store_planning.region.delete` | 删除经营区域 | 删除经营区域（需要二次确认） | 高 |

### 2. 门店类型管理权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.store_type.view` | 查看门店类型 | 查看门店类型列表和详情 | 低 |
| `store_planning.store_type.create` | 创建门店类型 | 创建新的门店类型 | 中 |
| `store_planning.store_type.update` | 更新门店类型 | 修改门店类型信息 | 中 |
| `store_planning.store_type.delete` | 删除门店类型 | 删除门店类型（需要二次确认） | 高 |

### 3. 开店计划管理权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.plan.view` | 查看计划 | 查看自己创建的计划 | 低 |
| `store_planning.plan.view_all` | 查看所有计划 | 查看所有用户创建的计划 | 中 |
| `store_planning.plan.create` | 创建计划 | 创建新的开店计划 | 中 |
| `store_planning.plan.update` | 更新计划 | 修改自己创建的计划 | 中 |
| `store_planning.plan.update_all` | 更新所有计划 | 修改任何用户创建的计划 | 高 |
| `store_planning.plan.delete` | 删除计划 | 删除自己创建的计划（需要二次确认） | 高 |
| `store_planning.plan.delete_all` | 删除所有计划 | 删除任何用户创建的计划（需要二次确认） | 高 |
| `store_planning.plan.publish` | 发布计划 | 发布开店计划（需要二次确认） | 高 |
| `store_planning.plan.cancel` | 取消计划 | 取消开店计划（需要二次确认） | 高 |
| `store_planning.plan.execute` | 执行计划 | 开始执行计划 | 中 |
| `store_planning.plan.complete` | 完成计划 | 标记计划为完成 | 中 |
| `store_planning.plan.update_progress` | 更新进度 | 更新计划执行进度 | 中 |
| `store_planning.plan.submit_approval` | 提交审批 | 提交计划审批申请 | 中 |

### 4. 区域计划管理权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.regional_plan.view` | 查看区域计划 | 查看区域计划列表和详情 | 低 |
| `store_planning.regional_plan.create` | 创建区域计划 | 创建新的区域计划（通过主计划创建） | 中 |
| `store_planning.regional_plan.update` | 更新区域计划 | 修改区域计划信息 | 中 |
| `store_planning.regional_plan.delete` | 删除区域计划 | 删除区域计划（需要二次确认） | 高 |
| `store_planning.regional_plan.update_progress` | 更新区域进度 | 更新区域计划执行进度 | 中 |

### 5. 审批管理权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.approval.view` | 查看审批 | 查看自己提交或需要审批的申请 | 低 |
| `store_planning.approval.view_all` | 查看所有审批 | 查看所有审批申请 | 中 |
| `store_planning.approval.create` | 创建审批 | 提交审批申请 | 中 |
| `store_planning.approval.approve` | 审批通过 | 审批通过申请（需要二次确认） | 高 |
| `store_planning.approval.reject` | 审批拒绝 | 审批拒绝申请（需要二次确认） | 高 |
| `store_planning.approval.cancel` | 取消审批 | 取消审批申请 | 中 |

### 6. 统计分析权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.statistics.view` | 查看统计 | 查看统计分析数据 | 低 |
| `store_planning.dashboard.view` | 查看仪表板 | 查看仪表板数据 | 低 |

### 7. 数据导入导出权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.import.view` | 查看导入 | 查看导入模板和指南 | 低 |
| `store_planning.import.create` | 执行导入 | 执行数据导入操作 | 高 |
| `store_planning.export.create` | 执行导出 | 执行数据导出操作 | 中 |

### 8. 系统管理权限

| 权限编码 | 权限名称 | 说明 | 敏感级别 |
|---------|---------|------|---------|
| `store_planning.system.config` | 系统配置 | 系统级配置和管理权限 | 高 |
| `store_planning.regional_manager` | 区域管理员 | 区域管理员特殊权限 | 高 |

## 角色权限配置建议

### 1. 计划管理员（Plan Manager）
**职责**：负责创建和管理开店计划

**推荐权限**：
- `store_planning.region.view`
- `store_planning.store_type.view`
- `store_planning.plan.view`
- `store_planning.plan.create`
- `store_planning.plan.update`
- `store_planning.plan.delete`
- `store_planning.plan.submit_approval`
- `store_planning.regional_plan.view`
- `store_planning.regional_plan.update`
- `store_planning.statistics.view`
- `store_planning.dashboard.view`
- `store_planning.import.view`
- `store_planning.import.create`
- `store_planning.export.create`

### 2. 区域管理员（Regional Manager）
**职责**：管理特定区域的开店计划

**推荐权限**：
- `store_planning.region.view`
- `store_planning.store_type.view`
- `store_planning.plan.view_all`
- `store_planning.plan.update_progress`
- `store_planning.regional_plan.view`
- `store_planning.regional_plan.update_progress`
- `store_planning.statistics.view`
- `store_planning.dashboard.view`
- `store_planning.regional_manager`

### 3. 审批人员（Approver）
**职责**：审批开店计划

**推荐权限**：
- `store_planning.plan.view_all`
- `store_planning.approval.view`
- `store_planning.approval.approve`
- `store_planning.approval.reject`
- `store_planning.statistics.view`

### 4. 高级管理员（Senior Manager）
**职责**：全面管理开店计划系统

**推荐权限**：
- `store_planning.region.*`（所有区域管理权限）
- `store_planning.store_type.*`（所有门店类型管理权限）
- `store_planning.plan.*`（所有计划管理权限）
- `store_planning.regional_plan.*`（所有区域计划管理权限）
- `store_planning.approval.*`（所有审批管理权限）
- `store_planning.statistics.view`
- `store_planning.dashboard.view`
- `store_planning.import.*`（所有导入权限）
- `store_planning.export.*`（所有导出权限）

### 5. 系统管理员（System Admin）
**职责**：系统级配置和管理

**推荐权限**：
- `store_planning.system.config`
- 所有其他权限

### 6. 数据分析师（Data Analyst）
**职责**：查看和分析数据

**推荐权限**：
- `store_planning.region.view`
- `store_planning.store_type.view`
- `store_planning.plan.view_all`
- `store_planning.regional_plan.view`
- `store_planning.approval.view_all`
- `store_planning.statistics.view`
- `store_planning.dashboard.view`
- `store_planning.export.create`

## 权限验证机制

### 1. 基础权限验证
所有API端点都需要通过`@plan_permission_required`装饰器进行权限验证。

```python
@plan_permission_required('store_planning.plan.view')
def list(self, request, *args, **kwargs):
    """获取计划列表"""
    return super().list(request, *args, **kwargs)
```

### 2. 数据范围权限控制
对于涉及数据访问的操作，使用`check_data_scope_permission`函数进行数据范围权限检查。

```python
# 检查数据范围权限
if not check_data_scope_permission(request.user, instance, 'view'):
    return Response(
        {'error': '权限不足', 'message': '您没有权限查看此计划'},
        status=status.HTTP_403_FORBIDDEN
    )
```

**数据范围权限规则**：
- 超级管理员和系统管理员：可以访问所有数据
- 计划创建者：可以访问自己创建的计划
- 区域管理员：可以查看所有计划，编辑/删除自己负责区域的计划
- 拥有全局权限（如`plan.view_all`）：可以访问所有数据
- 拥有基础权限（如`plan.view`）：只能访问自己创建的数据

### 3. 敏感操作二次确认
对于敏感操作（如删除、发布、审批），需要在请求中包含确认参数。

```python
@plan_permission_required('store_planning.plan.delete', require_confirmation=True)
def destroy(self, request, *args, **kwargs):
    """删除开店计划"""
    # 需要在请求中包含 confirmation=true
```

**确认参数格式**：
- `confirmation=true`
- `confirmation=1`
- `confirmation=yes`
- `confirm=true`

### 4. 批量操作权限验证
批量操作使用`@batch_permission_required`装饰器，限制批量操作的数量。

```python
@batch_permission_required('store_planning.approval.approve', max_batch_size=50)
def batch_approve(self, request):
    """批量审批"""
```

### 5. API访问频率限制
对于高频访问的API，使用`@rate_limit_permission`装饰器限制访问频率。

```python
@rate_limit_permission(max_requests=60, time_window=60)
def dashboard(self, request):
    """获取仪表板数据"""
```

## 审计日志

所有敏感操作都会记录审计日志，包括：
- 操作类型
- 操作用户
- 操作时间
- 操作对象
- 操作详情
- 客户端IP
- 用户代理

使用`@audit_sensitive_operation`装饰器自动记录审计日志：

```python
@audit_sensitive_operation('plan_create', 'plan')
def create(self, request, *args, **kwargs):
    """创建开店计划"""
```

## 权限缓存

用户权限信息会被缓存30分钟，以提高性能。当用户角色或权限发生变化时，需要清除缓存：

```python
user.clear_permission_cache()
```

## 权限初始化

系统提供权限初始化脚本，用于创建所有必要的权限记录：

```bash
python manage.py init_store_planning_permissions
```

## 常见问题

### Q1: 如何为新用户分配权限？
A: 通过为用户分配角色来授予权限。每个角色包含一组权限。

### Q2: 如何检查用户是否有某个权限？
A: 使用`user.has_permission('permission_code')`方法。

### Q3: 权限验证失败会返回什么错误？
A: 返回403 Forbidden错误，包含错误信息。

### Q4: 如何实现自定义权限逻辑？
A: 可以在视图中使用`check_data_scope_permission`函数或自定义权限检查逻辑。

### Q5: 批量操作的最大数量是多少？
A: 默认为50条记录，可以通过`max_batch_size`参数调整。

### Q6: API访问频率限制是多少？
A: 根据不同的API端点设置不同的限制，一般为60-120次/分钟。

## 安全建议

1. **最小权限原则**：只授予用户完成工作所需的最小权限集
2. **定期审查**：定期审查用户权限，移除不再需要的权限
3. **敏感操作确认**：对于删除、发布等敏感操作，始终要求二次确认
4. **审计日志监控**：定期检查审计日志，发现异常操作
5. **权限分离**：将创建、审批、执行等权限分配给不同的角色
6. **数据范围控制**：严格控制用户可以访问的数据范围
7. **频率限制**：对高频API设置合理的访问频率限制
8. **批量操作限制**：限制批量操作的数量，防止系统过载

## 更新日志

### 2024-01-15
- 初始版本
- 定义所有权限编码
- 实现基础权限验证
- 实现数据范围权限控制
- 实现敏感操作二次确认
- 实现批量操作权限验证
- 实现API访问频率限制
