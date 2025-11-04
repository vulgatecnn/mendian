# 阶段一剩余任务清单

## 概述

根据 `.kiro/specs/phase-one-core-modules/tasks.md` 的检查，阶段一的核心功能已基本完成，仅剩 **1个未完成任务** 和一些需要修复的测试问题。

## 未完成任务

### 1. 数据权限应用 (优先级：高)

**任务编号**: 11.2  
**任务名称**: 应用数据权限到业务模块  
**状态**: ❌ 未完成

**详细说明**:
虽然已经实现了数据权限混入类（DataPermissionMixin 和 RegionPermissionMixin），但尚未在所有业务模块中应用。

**需要完成的工作**:

1. **在拓店管理模块应用数据权限**
   - 文件: `backend/store_expansion/views.py`
   - 为 CandidateLocationViewSet 添加 DataPermissionMixin
   - 为 FollowUpRecordViewSet 添加 DataPermissionMixin 和 RegionPermissionMixin
   - 确保用户只能看到权限范围内的数据

2. **在开店筹备模块应用数据权限**
   - 文件: `backend/store_preparation/views.py`
   - 为 ConstructionOrderViewSet 添加 DataPermissionMixin
   - 为 DeliveryChecklistViewSet 添加 DataPermissionMixin
   - 确保施工和交付数据的访问控制

3. **在门店档案模块应用数据权限**
   - 文件: `backend/store_archive/views.py`
   - 为 StoreProfileViewSet 添加 DataPermissionMixin 和 RegionPermissionMixin
   - 确保门店档案的数据隔离

4. **在审批中心模块应用数据权限**
   - 文件: `backend/approval/views.py`
   - 为 ApprovalInstanceViewSet 添加数据权限控制
   - 确保用户只能看到与自己相关的审批（发起人、审批人、抄送人、关注人）

**实施步骤**:
```python
# 示例：在 ViewSet 中应用数据权限
from common.permissions import DataPermissionMixin, RegionPermissionMixin

class CandidateLocationViewSet(DataPermissionMixin, RegionPermissionMixin, viewsets.ModelViewSet):
    """候选点位视图集"""
    queryset = CandidateLocation.objects.all()
    serializer_class = CandidateLocationSerializer
    permission_classes = [IsAuthenticated]
    
    # 配置数据权限
    data_permission_field = 'created_by'  # 数据所有者字段
    region_permission_field = 'business_region'  # 区域字段
```

**验证方法**:
- 创建不同角色和部门的测试用户
- 测试每个用户只能看到权限范围内的数据
- 测试跨部门和跨区域的数据访问控制

**需求关联**: 19.1, 19.2, 19.3, 19.4, 19.5

---

## 测试修复任务 (优先级：高)

### 2. 后端 E2E 测试修复

**状态**: ⚠️ 需要修复 (0/14 通过)

**问题清单**:

#### 2.1 ApprovalTemplate 模型字段问题 (8个测试)
- **影响文件**: 
  - `backend/tests/e2e/test_approval_flow.py`
  - `backend/tests/e2e/test_store_expansion_flow.py`
- **错误**: `TypeError: ApprovalTemplate() got unexpected keyword arguments: 'code', 'name', 'is_active'`
- **原因**: 测试代码使用的字段与实际模型定义不匹配
- **修复方案**:
  1. 检查 `backend/approval/models.py` 中 ApprovalTemplate 的实际字段定义
  2. 更新测试代码以使用正确的字段名
  3. 或者更新模型定义以匹配测试预期

#### 2.2 StoreArchive 字段选项值问题 (4个测试)
- **影响文件**: `backend/tests/e2e/test_store_archive_flow.py`
- **错误**: `"直营店" 不是合法选项`, `"自营" 不是合法选项`
- **原因**: 测试使用中文值，但模型期望英文值
- **修复方案**:
  1. 检查 `backend/store_archive/models.py` 中 store_type 和 operation_mode 的 choices 定义
  2. 更新测试数据使用正确的选项值（如 'direct' 而不是 '直营店'）
  3. 或者更新模型的 choices 以支持中文值

#### 2.3 Serializer 字段名称问题 (1个测试)
- **影响文件**: `backend/tests/e2e/test_store_preparation_flow.py`
- **错误**: `AttributeError: 'Supplier' object has no attribute 'supplier_name'`
- **原因**: Serializer 使用了不存在的字段名
- **修复方案**:
  1. 打开 `backend/store_preparation/serializers.py` 第85行
  2. 将 `obj.supplier.supplier_name` 改为 `obj.supplier.name`

#### 2.4 缺少服务类 (1个测试)
- **影响文件**: `backend/tests/e2e/test_store_preparation_flow.py`
- **错误**: `ImportError: cannot import name 'MilestoneReminderService'`
- **原因**: 服务类未在 `__init__.py` 中导出
- **修复方案**:
  1. 检查 `backend/store_preparation/services/reminder_service.py` 是否存在 MilestoneReminderService
  2. 在 `backend/store_preparation/services/__init__.py` 中添加导出
  3. 或者创建该服务类（如果不存在）

**修复优先级**:
1. 高优先级: 2.3 Serializer 字段名称（简单修复）
2. 高优先级: 2.4 缺少服务类（简单修复）
3. 中优先级: 2.2 字段选项值（需要确认业务逻辑）
4. 中优先级: 2.1 模型字段定义（需要检查模型设计）

---

## 优化和增强任务 (优先级：中)

### 3. 性能优化增强

**建议任务**:

1. **数据库查询优化**
   - 为常用查询字段添加复合索引
   - 优化 N+1 查询问题（使用 select_related 和 prefetch_related）
   - 添加数据库查询性能监控

2. **缓存策略优化**
   - 为基础数据（大区、供应商等）添加缓存
   - 为用户权限信息添加缓存
   - 实现缓存预热机制

3. **API 响应优化**
   - 实现分页优化（游标分页）
   - 添加字段选择功能（只返回需要的字段）
   - 实现 API 响应压缩

### 4. 安全加固增强

**建议任务**:

1. **API 安全**
   - 实现 API 限流（基于用户和 IP）
   - 添加 CSRF 保护
   - 实现敏感数据脱敏

2. **数据安全**
   - 实现敏感字段加密存储
   - 添加数据备份机制
   - 实现数据访问审计

3. **认证安全**
   - 实现双因素认证（可选）
   - 添加异常登录检测
   - 实现会话管理优化

### 5. 文档完善

**建议任务**:

1. **API 文档**
   - 完善 Swagger/OpenAPI 文档
   - 添加 API 使用示例
   - 创建 Postman Collection

2. **部署文档**
   - 完善部署指南
   - 添加环境配置说明
   - 创建故障排查指南

3. **开发文档**
   - 完善代码注释
   - 添加架构设计文档
   - 创建开发规范文档

---

## 任务优先级总结

### 必须完成（阻塞上线）
1. ✅ 数据权限应用到所有业务模块
2. ✅ 修复所有 E2E 测试问题

### 建议完成（提升质量）
3. 性能优化增强
4. 安全加固增强
5. 文档完善

---

## 完成标准

### 数据权限应用
- [ ] 所有业务模块的 ViewSet 都应用了数据权限混入类
- [ ] 数据权限测试全部通过
- [ ] 不同角色用户的数据访问符合预期

### E2E 测试修复
- [ ] 所有 14 个 E2E 测试通过
- [ ] 测试覆盖率达到 80% 以上
- [ ] 测试数据与模型定义一致

### 整体质量
- [ ] 后端集成测试：100% 通过 ✅
- [ ] 后端 E2E 测试：100% 通过
- [ ] 前端测试：100% 通过 ✅
- [ ] 代码审查通过
- [ ] 性能测试通过

---

## 预估工作量

| 任务 | 预估时间 | 难度 |
|------|---------|------|
| 数据权限应用 | 4-6 小时 | 中 |
| E2E 测试修复 | 6-8 小时 | 中 |
| 性能优化 | 8-12 小时 | 中-高 |
| 安全加固 | 6-8 小时 | 中 |
| 文档完善 | 4-6 小时 | 低 |

**总计**: 28-40 小时

---

## 下一步行动

### 立即执行
1. 修复 Serializer 字段名称问题（15分钟）
2. 修复缺少的服务类导出（15分钟）
3. 应用数据权限到拓店管理模块（1小时）

### 本周完成
4. 应用数据权限到其他业务模块（3-4小时）
5. 修复 StoreArchive 字段选项值问题（1-2小时）
6. 修复 ApprovalTemplate 模型字段问题（2-3小时）

### 下周完成
7. 性能优化和安全加固
8. 文档完善

---

## 备注

- 所有修改应该提交到 Git 并推送到远程仓库
- 每完成一个任务应该运行相关测试确保没有破坏现有功能
- 建议使用 TDD 方法：先写测试，再实现功能
- 代码审查应该在合并到主分支前完成
