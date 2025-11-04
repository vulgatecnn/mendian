# 数据权限端到端测试

## 概述

本目录包含数据权限功能的端到端（E2E）测试，验证数据权限在实际API请求中的工作情况。

## 测试文件

### test_data_permissions_e2e.py

包含三个测试类，共18个测试用例：

#### 1. DataPermissionE2ETestCase（数据权限端到端测试）

测试数据权限在实际API调用中的表现：

- **test_candidate_location_list_as_admin**: 测试管理员查看候选点位列表
- **test_candidate_location_list_as_manager**: 测试部门经理查看候选点位列表
- **test_candidate_location_list_as_staff**: 测试普通员工查看候选点位列表
- **test_candidate_location_list_as_other_dept_staff**: 测试其他部门员工查看候选点位列表
- **test_candidate_location_retrieve_own**: 测试查看自己创建的点位详情
- **test_candidate_location_retrieve_others_forbidden**: 测试查看他人创建的点位详情（应该被禁止）
- **test_candidate_location_create**: 测试创建候选点位
- **test_construction_order_list_permissions**: 测试工程单列表的数据权限
- **test_store_profile_list_permissions**: 测试门店档案列表的数据权限
- **test_unauthorized_access**: 测试未认证用户访问
- **test_filter_by_region**: 测试按区域过滤
- **test_search_with_permissions**: 测试搜索功能结合数据权限
- **test_ordering_with_permissions**: 测试排序功能结合数据权限
- **test_pagination_with_permissions**: 测试分页功能结合数据权限

#### 2. DataPermissionCacheTestCase（数据权限缓存测试）

测试权限缓存的一致性：

- **test_permission_cache_consistency**: 测试权限缓存的一致性

#### 3. DataPermissionEdgeCaseTestCase（数据权限边界情况测试）

测试边界情况和特殊场景：

- **test_user_without_department**: 测试没有部门的用户
- **test_empty_queryset**: 测试空查询集
- **test_deleted_creator**: 测试创建者被删除的情况

## 运行测试

### 运行所有e2e测试

```bash
cd backend
python manage.py test tests.e2e.test_data_permissions_e2e
```

### 运行特定测试类

```bash
python manage.py test tests.e2e.test_data_permissions_e2e.DataPermissionE2ETestCase
```

### 运行特定测试用例

```bash
python manage.py test tests.e2e.test_data_permissions_e2e.DataPermissionE2ETestCase.test_candidate_location_list_as_admin
```

### 使用详细输出

```bash
python manage.py test tests.e2e.test_data_permissions_e2e --verbosity=2
```

## 测试覆盖的功能

### 1. 数据权限过滤

- ✅ 超级管理员可以查看所有数据
- ✅ 有全局查看权限的用户可以查看所有数据
- ✅ 部门经理可以查看本部门及下级部门的数据
- ✅ 普通员工只能查看自己创建的数据
- ✅ 其他部门员工无法查看本部门的数据

### 2. 区域权限过滤

- ✅ 按业务大区过滤数据
- ✅ 区域权限与数据权限的组合使用

### 3. API功能

- ✅ 列表查询（list）
- ✅ 详情查询（retrieve）
- ✅ 创建（create）
- ✅ 搜索（search）
- ✅ 过滤（filter）
- ✅ 排序（ordering）
- ✅ 分页（pagination）

### 4. 认证和授权

- ✅ 未认证用户被拒绝访问
- ✅ 无权限用户无法访问他人数据
- ✅ 权限缓存正常工作

### 5. 边界情况

- ✅ 没有部门的用户只能看到自己的数据
- ✅ 空查询集正常处理
- ✅ 创建者被删除后的数据访问

## 测试数据设置

每个测试用例都会创建以下测试数据：

### 部门结构
```
销售部 (dept1)
├── 销售一部 (dept1_sub)
运营部 (dept2)
```

### 用户角色
- **系统管理员** (user_admin): 拥有全局查看权限
- **部门经理** (user_manager): 拥有本部门及下级查看权限
- **普通员工** (user_staff1, user_staff2, user_staff_sub): 只能查看自己的数据

### 业务数据
- 业务大区：华东大区、华南大区
- 候选点位：分布在不同区域，由不同用户创建
- 工程单：关联到跟进单
- 门店档案：关联到业务大区

## 测试结果

所有18个测试用例均通过 ✅

```
Ran 18 tests in 41.102s

OK
```

## 注意事项

1. **测试隔离**: 每个测试用例都在独立的数据库事务中运行，测试之间互不影响
2. **权限配置**: 测试会创建必要的权限和角色，确保权限系统正常工作
3. **API格式**: 不同模块的API返回格式可能不同，测试已适配各种格式
4. **缓存**: 测试会验证权限缓存的正确性

## 扩展测试

如果需要添加新的数据权限测试，可以参考现有测试用例的结构：

```python
def test_new_permission_scenario(self):
    """测试新的权限场景"""
    # 1. 创建测试数据
    # 2. 设置用户认证
    # 3. 发起API请求
    # 4. 验证响应结果
    # 5. 验证数据权限过滤
```

## 相关文档

- [数据权限实施文档](../../DATA_PERMISSIONS_IMPLEMENTATION.md)
- [数据权限单元测试](../test_data_permissions.py)
- [通用权限混入类](../../common/permissions.py)
