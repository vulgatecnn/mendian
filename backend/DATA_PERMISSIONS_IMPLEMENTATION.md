# 数据权限实施文档

## 概述

本文档描述了数据权限混入类在各业务模块中的应用情况。数据权限控制确保用户只能访问其权限范围内的数据，实现了基于角色和部门的细粒度数据访问控制。

## 数据权限混入类

### DataPermissionMixin

**位置**: `backend/common/permissions.py`

**功能**: 实现基于角色的数据范围过滤

**支持的数据范围**:
- `all`: 全部数据（需要 `{module}.view_all` 权限）
- `department_and_sub`: 本部门及下级部门数据（需要 `{module}.view_department_and_sub` 权限）
- `department`: 本部门数据（需要 `{module}.view_department` 权限）
- `self`: 仅本人数据（默认）

**配置项**:
- `data_permission_field`: 数据权限字段，默认为 `created_by`
- `department_field`: 部门字段，默认为 `created_by__department`

### RegionPermissionMixin

**位置**: `backend/common/permissions.py`

**功能**: 实现基于区域的数据过滤

**支持的区域范围**:
- 全部区域（需要 `{module}.view_all_regions` 权限）
- 用户负责的区域（从用户配置中获取）

**配置项**:
- `region_field`: 区域字段，默认为 `business_region`

## 业务模块应用情况

### 1. 拓店管理模块 (store_expansion)

#### CandidateLocationViewSet (候选点位)

**应用的混入类**:
- `DataPermissionMixin`: 基于创建者的数据权限
- `RegionPermissionMixin`: 基于业务大区的区域权限

**权限过滤逻辑**:
1. 超级管理员可以查看所有点位
2. 有 `store_expansion.view_all` 权限的用户可以查看所有点位
3. 有 `store_expansion.view_all_regions` 权限的用户可以查看所有区域的点位
4. 有 `store_expansion.view_department_and_sub` 权限的用户可以查看本部门及下级部门创建的点位
5. 有 `store_expansion.view_department` 权限的用户可以查看本部门创建的点位
6. 普通用户只能查看自己创建的点位

**代码示例**:
```python
class CandidateLocationViewSet(DataPermissionMixin, RegionPermissionMixin, viewsets.ModelViewSet):
    queryset = CandidateLocation.objects.all()
    # 使用默认配置
```

#### FollowUpRecordViewSet (铺位跟进单)

**应用的混入类**:
- `DataPermissionMixin`: 基于创建者的数据权限
- `RegionPermissionMixin`: 基于关联点位的业务大区的区域权限

**特殊配置**:
```python
region_field = 'location__business_region'  # 通过关联的点位获取区域
```

**权限过滤逻辑**:
与候选点位类似，但区域过滤基于关联点位的业务大区。

### 2. 开店筹备模块 (store_preparation)

#### ConstructionOrderViewSet (工程单)

**应用的混入类**:
- `DataPermissionMixin`: 基于创建者的数据权限

**权限过滤逻辑**:
1. 超级管理员可以查看所有工程单
2. 有 `store_preparation.view_all` 权限的用户可以查看所有工程单
3. 有 `store_preparation.view_department_and_sub` 权限的用户可以查看本部门及下级部门创建的工程单
4. 有 `store_preparation.view_department` 权限的用户可以查看本部门创建的工程单
5. 普通用户只能查看自己创建的工程单

**代码示例**:
```python
class ConstructionOrderViewSet(DataPermissionMixin, viewsets.ModelViewSet):
    queryset = ConstructionOrder.objects.all()
    # 使用默认配置
```

#### DeliveryChecklistViewSet (交付清单)

**应用的混入类**:
- `DataPermissionMixin`: 基于创建者的数据权限

**权限过滤逻辑**:
与工程单相同。

### 3. 门店档案模块 (store_archive)

#### StoreProfileViewSet (门店档案)

**应用的混入类**:
- `DataPermissionMixin`: 基于创建者的数据权限
- `RegionPermissionMixin`: 基于业务大区的区域权限

**权限过滤逻辑**:
1. 超级管理员可以查看所有门店档案
2. 有 `store_archive.view_all` 权限的用户可以查看所有门店档案
3. 有 `store_archive.view_all_regions` 权限的用户可以查看所有区域的门店档案
4. 有 `store_archive.view_department_and_sub` 权限的用户可以查看本部门及下级部门创建的门店档案
5. 有 `store_archive.view_department` 权限的用户可以查看本部门创建的门店档案
6. 普通用户只能查看自己创建的门店档案

**代码示例**:
```python
class StoreProfileViewSet(DataPermissionMixin, RegionPermissionMixin, viewsets.ModelViewSet):
    queryset = StoreProfile.objects.all()
    # 使用默认配置
```

### 4. 审批中心模块 (approval)

#### ApprovalInstanceViewSet (审批实例)

**特殊说明**: 审批模块使用自定义的数据权限过滤逻辑，不使用通用的 `DataPermissionMixin`。

**权限过滤逻辑**:
审批数据的访问权限基于多个维度：
1. 超级管理员可以查看所有审批
2. 审批发起人可以查看自己发起的审批
3. 审批人可以查看需要自己审批的审批
4. 抄送人可以查看抄送给自己的审批
5. 关注人可以查看自己关注的审批

**代码示例**:
```python
def get_queryset(self):
    queryset = super().get_queryset()
    user = self.request.user
    
    if user.is_superuser:
        return queryset
    
    return queryset.filter(
        Q(initiator=user) |  # 自己发起的
        Q(nodes__approvers__user=user) |  # 自己需要审批的
        Q(nodes__cc_users__user=user) |  # 抄送给自己的
        Q(follows__user=user)  # 自己关注的
    ).distinct()
```

## 权限配置

### 权限编码规范

数据权限相关的权限编码遵循以下规范：

```
{module}.view_all                    # 查看所有数据
{module}.view_all_regions            # 查看所有区域的数据
{module}.view_department_and_sub     # 查看本部门及下级部门的数据
{module}.view_department             # 查看本部门的数据
{module}.edit_all                    # 编辑所有数据
{module}.edit_department_and_sub     # 编辑本部门及下级部门的数据
{module}.edit_department             # 编辑本部门的数据
{module}.delete_all                  # 删除所有数据
{module}.delete_department_and_sub   # 删除本部门及下级部门的数据
{module}.delete_department           # 删除本部门的数据
```

### 示例权限配置

#### 区域管理员角色
```python
permissions = [
    'store_expansion.view_all_regions',      # 可以查看所有区域的拓店数据
    'store_expansion.view_department_and_sub', # 可以查看本部门及下级的数据
    'store_archive.view_all_regions',        # 可以查看所有区域的门店档案
]
```

#### 部门经理角色
```python
permissions = [
    'store_expansion.view_department_and_sub',    # 可以查看本部门及下级的拓店数据
    'store_preparation.view_department_and_sub',  # 可以查看本部门及下级的筹备数据
    'store_archive.view_department_and_sub',      # 可以查看本部门及下级的门店档案
]
```

#### 普通员工角色
```python
permissions = [
    'store_expansion.view',      # 只能查看自己创建的拓店数据
    'store_preparation.view',    # 只能查看自己创建的筹备数据
    'store_archive.view',        # 只能查看自己创建的门店档案
]
```

## 区域权限配置

### 配置用户负责的区域

目前区域权限支持以下配置方式：

1. **通过部门关联区域**（推荐）
   - 在部门模型中添加 `business_regions` 字段
   - 关联用户所在部门负责的业务大区

2. **通过角色关联区域**
   - 在角色模型中添加区域关联字段
   - 用户通过角色获得区域权限

3. **通过用户扩展配置**
   - 在用户模型中添加 `managed_regions` 字段
   - 直接配置用户负责的区域

**注意**: 如果用户没有配置区域权限，`RegionPermissionMixin` 将不进行区域过滤，只应用 `DataPermissionMixin` 的过滤逻辑。

## 测试

### 测试文件

**位置**: `backend/tests/test_data_permissions.py`

### 测试用例

1. **test_candidate_location_data_permission_self**: 测试候选点位的数据权限 - 仅本人
2. **test_candidate_location_data_permission_superuser**: 测试候选点位的数据权限 - 超级管理员
3. **test_candidate_location_region_permission**: 测试候选点位的区域权限
4. **test_construction_order_data_permission**: 测试工程单的数据权限
5. **test_store_profile_data_permission**: 测试门店档案的数据权限
6. **test_department_hierarchy_permission**: 测试部门层级权限
7. **test_data_permission_field_default**: 测试数据权限字段默认值
8. **test_region_permission_field_default**: 测试区域权限字段默认值

### 运行测试

```bash
cd backend
python manage.py test tests.test_data_permissions --verbosity=2
```

### 测试结果

所有测试用例均通过，验证了数据权限在各业务模块中的正确应用。

## 使用指南

### 在新模块中应用数据权限

1. **导入混入类**:
```python
from common.permissions import DataPermissionMixin, RegionPermissionMixin
```

2. **应用到 ViewSet**:
```python
class MyViewSet(DataPermissionMixin, RegionPermissionMixin, viewsets.ModelViewSet):
    queryset = MyModel.objects.all()
    # 如果需要自定义字段，可以覆盖默认配置
    data_permission_field = 'owner'  # 默认为 'created_by'
    region_field = 'region'  # 默认为 'business_region'
```

3. **配置权限编码**:
在权限配置中添加相应的权限编码，如 `mymodule.view_all`、`mymodule.view_department` 等。

### 检查对象级权限

如果需要在视图中检查特定对象的权限，可以使用混入类提供的方法：

```python
def retrieve(self, request, *args, **kwargs):
    instance = self.get_object()
    
    # 检查数据权限
    if not self.check_object_permission(instance):
        return Response(
            {'error': '权限不足', 'message': '您没有权限访问此数据'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 检查区域权限
    if not self.check_region_permission(instance):
        return Response(
            {'error': '权限不足', 'message': '您没有权限访问此区域的数据'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    return super().retrieve(request, *args, **kwargs)
```

### 使用通用权限检查函数

对于不使用 ViewSet 的场景，可以使用通用的权限检查函数：

```python
from common.permissions import check_data_permission

# 检查用户是否有权限访问对象
if check_data_permission(user, obj, permission_type='view'):
    # 有权限
    pass
else:
    # 无权限
    pass
```

## 注意事项

1. **混入类顺序**: 数据权限混入类应该放在 ViewSet 继承链的最前面，以确保 `get_queryset` 方法被正确调用。

2. **性能优化**: 数据权限过滤会增加查询的复杂度，建议：
   - 在相关字段上添加数据库索引
   - 使用 `select_related` 和 `prefetch_related` 优化关联查询
   - 合理使用缓存

3. **权限缓存**: 用户权限信息会被缓存 30 分钟，如果修改了用户权限，需要清除缓存或等待缓存过期。

4. **区域权限配置**: 如果业务需要区域权限控制，需要先配置用户与区域的关联关系。

5. **审批模块特殊性**: 审批模块由于其特殊的业务逻辑，使用自定义的权限过滤，不使用通用混入类。

## 总结

数据权限混入类已成功应用到以下业务模块：

- ✅ 拓店管理模块 (store_expansion)
  - CandidateLocationViewSet
  - FollowUpRecordViewSet
  
- ✅ 开店筹备模块 (store_preparation)
  - ConstructionOrderViewSet
  - DeliveryChecklistViewSet
  
- ✅ 门店档案模块 (store_archive)
  - StoreProfileViewSet
  
- ✅ 审批中心模块 (approval)
  - ApprovalInstanceViewSet (使用自定义权限逻辑)

所有模块的数据权限控制均已通过测试验证，确保了数据访问的安全性和合规性。
