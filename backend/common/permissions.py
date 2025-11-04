"""
通用数据权限混入类
实现基于角色和区域的数据访问控制
"""
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)


class DataPermissionMixin:
    """
    数据权限混入类
    实现基于角色的数据范围过滤（全部/本部门/本部门及下级/仅本人）
    
    使用方法:
        class MyViewSet(DataPermissionMixin, viewsets.ModelViewSet):
            queryset = MyModel.objects.all()
            data_permission_field = 'created_by'  # 指定用于权限过滤的字段
    """
    
    # 数据权限字段，默认为 created_by，子类可以覆盖
    data_permission_field = 'created_by'
    
    # 部门字段，用于部门级别的权限过滤
    department_field = 'created_by__department'
    
    def get_queryset(self):
        """
        根据用户的数据权限范围过滤查询集
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # 超级管理员可以查看所有数据
        if user.is_superuser:
            logger.debug(f'数据权限过滤: 用户={user.username}, 范围=全部（超级管理员）')
            return queryset
        
        # 获取用户的数据权限范围
        data_scope = self._get_user_data_scope(user)
        
        if data_scope == 'all':
            # 全部数据权限
            logger.debug(f'数据权限过滤: 用户={user.username}, 范围=全部')
            return queryset
        
        elif data_scope == 'department':
            # 本部门数据权限
            if user.department:
                filter_kwargs = {f'{self.department_field}': user.department}
                queryset = queryset.filter(**filter_kwargs)
                logger.debug(f'数据权限过滤: 用户={user.username}, 范围=本部门, 部门={user.department.name}')
            else:
                # 用户没有部门，只能看到自己的数据
                filter_kwargs = {self.data_permission_field: user}
                queryset = queryset.filter(**filter_kwargs)
                logger.debug(f'数据权限过滤: 用户={user.username}, 范围=仅本人（无部门）')
        
        elif data_scope == 'department_and_sub':
            # 本部门及下级部门数据权限
            if user.department:
                # 获取本部门及所有子部门
                departments = [user.department] + user.department.get_all_children()
                department_ids = [dept.id for dept in departments]
                filter_kwargs = {f'{self.department_field}__id__in': department_ids}
                queryset = queryset.filter(**filter_kwargs)
                logger.debug(f'数据权限过滤: 用户={user.username}, 范围=本部门及下级, 部门数={len(departments)}')
            else:
                # 用户没有部门，只能看到自己的数据
                filter_kwargs = {self.data_permission_field: user}
                queryset = queryset.filter(**filter_kwargs)
                logger.debug(f'数据权限过滤: 用户={user.username}, 范围=仅本人（无部门）')
        
        else:  # data_scope == 'self'
            # 仅本人数据权限
            filter_kwargs = {self.data_permission_field: user}
            queryset = queryset.filter(**filter_kwargs)
            logger.debug(f'数据权限过滤: 用户={user.username}, 范围=仅本人')
        
        return queryset
    
    def _get_user_data_scope(self, user):
        """
        获取用户的数据权限范围
        
        返回值:
            'all': 全部数据
            'department': 本部门数据
            'department_and_sub': 本部门及下级部门数据
            'self': 仅本人数据
        """
        # 检查用户是否有全局查看权限
        if self._has_global_view_permission(user):
            return 'all'
        
        # 检查用户是否有部门及下级查看权限
        if self._has_department_and_sub_permission(user):
            return 'department_and_sub'
        
        # 检查用户是否有部门查看权限
        if self._has_department_permission(user):
            return 'department'
        
        # 默认只能查看自己的数据
        return 'self'
    
    def _has_global_view_permission(self, user):
        """检查用户是否有全局查看权限"""
        # 子类可以覆盖此方法来定义具体的权限编码
        # 默认检查是否有 view_all 权限
        module_name = self._get_module_name()
        return user.has_permission(f'{module_name}.view_all')
    
    def _has_department_and_sub_permission(self, user):
        """检查用户是否有部门及下级查看权限"""
        module_name = self._get_module_name()
        return user.has_permission(f'{module_name}.view_department_and_sub')
    
    def _has_department_permission(self, user):
        """检查用户是否有部门查看权限"""
        module_name = self._get_module_name()
        return user.has_permission(f'{module_name}.view_department')
    
    def _get_module_name(self):
        """获取模块名称，用于构建权限编码"""
        # 从 queryset 的模型中获取 app_label
        if hasattr(self, 'queryset') and self.queryset is not None:
            return self.queryset.model._meta.app_label
        return 'common'
    
    def check_object_permission(self, obj):
        """
        检查用户是否有权限访问特定对象
        
        参数:
            obj: 要检查的对象
        
        返回:
            True: 有权限访问
            False: 无权限访问
        """
        user = self.request.user
        
        # 超级管理员有所有权限
        if user.is_superuser:
            return True
        
        # 获取用户的数据权限范围
        data_scope = self._get_user_data_scope(user)
        
        if data_scope == 'all':
            return True
        
        # 获取对象的创建者
        creator = getattr(obj, self.data_permission_field.split('__')[0], None)
        
        if data_scope == 'self':
            # 只能访问自己创建的数据
            return creator == user
        
        elif data_scope == 'department':
            # 可以访问本部门的数据
            if user.department and creator:
                creator_dept = getattr(creator, 'department', None)
                return creator_dept == user.department
            return creator == user
        
        elif data_scope == 'department_and_sub':
            # 可以访问本部门及下级部门的数据
            if user.department and creator:
                creator_dept = getattr(creator, 'department', None)
                if creator_dept:
                    departments = [user.department] + user.department.get_all_children()
                    return creator_dept in departments
            return creator == user
        
        return False


class RegionPermissionMixin:
    """
    区域权限混入类
    实现基于区域的数据过滤
    
    使用方法:
        class MyViewSet(RegionPermissionMixin, viewsets.ModelViewSet):
            queryset = MyModel.objects.all()
            region_field = 'business_region'  # 指定区域字段
    """
    
    # 区域字段，默认为 business_region，子类可以覆盖
    region_field = 'business_region'
    
    def get_queryset(self):
        """
        根据用户的区域权限过滤查询集
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # 超级管理员可以查看所有区域的数据
        if user.is_superuser:
            logger.debug(f'区域权限过滤: 用户={user.username}, 范围=全部区域（超级管理员）')
            return queryset
        
        # 检查用户是否有全局区域权限
        if self._has_all_region_permission(user):
            logger.debug(f'区域权限过滤: 用户={user.username}, 范围=全部区域')
            return queryset
        
        # 获取用户负责的区域列表
        user_regions = self._get_user_regions(user)
        
        if user_regions is not None:
            if user_regions:
                # 过滤用户负责的区域
                filter_kwargs = {f'{self.region_field}__in': user_regions}
                queryset = queryset.filter(**filter_kwargs)
                logger.debug(f'区域权限过滤: 用户={user.username}, 区域数={len(user_regions)}')
            else:
                # 用户没有负责的区域，返回空查询集
                queryset = queryset.none()
                logger.debug(f'区域权限过滤: 用户={user.username}, 无负责区域')
        else:
            # 没有配置区域权限，不进行区域过滤
            logger.debug(f'区域权限过滤: 用户={user.username}, 未配置区域权限，跳过区域过滤')
        
        return queryset
    
    def _has_all_region_permission(self, user):
        """检查用户是否有全局区域权限"""
        module_name = self._get_module_name()
        return user.has_permission(f'{module_name}.view_all_regions')
    
    def _get_user_regions(self, user):
        """
        获取用户负责的区域列表
        
        返回:
            区域对象列表
        """
        # 从用户的扩展信息中获取负责的区域
        # 这里需要根据实际的用户-区域关联模型来实现
        # 目前简化处理：如果用户有区域管理员权限，则从用户的部门或角色中获取区域
        
        # 方案1: 从用户的部门获取关联的区域
        if hasattr(user, 'department') and user.department:
            # 假设部门模型有 business_regions 字段
            if hasattr(user.department, 'business_regions'):
                return list(user.department.business_regions.all())
        
        # 方案2: 从用户的角色获取关联的区域
        # 这需要在角色模型中添加区域关联字段
        
        # 方案3: 从用户的扩展配置中获取
        # 可以在用户模型中添加 managed_regions 字段
        
        # 如果没有配置区域，返回 None 表示不进行区域过滤
        # 这样可以让 DataPermissionMixin 的过滤生效
        return None
    
    def _get_module_name(self):
        """获取模块名称"""
        if hasattr(self, 'queryset') and self.queryset is not None:
            return self.queryset.model._meta.app_label
        return 'common'
    
    def check_region_permission(self, obj):
        """
        检查用户是否有权限访问特定区域的对象
        
        参数:
            obj: 要检查的对象
        
        返回:
            True: 有权限访问
            False: 无权限访问
        """
        user = self.request.user
        
        # 超级管理员有所有权限
        if user.is_superuser:
            return True
        
        # 检查是否有全局区域权限
        if self._has_all_region_permission(user):
            return True
        
        # 获取对象的区域
        obj_region = getattr(obj, self.region_field.split('__')[0], None)
        
        if not obj_region:
            # 对象没有区域信息，默认允许访问
            return True
        
        # 检查对象的区域是否在用户负责的区域列表中
        user_regions = self._get_user_regions(user)
        return obj_region in user_regions


def check_data_permission(user, obj, permission_type='view', permission_field='created_by'):
    """
    通用的数据权限检查函数
    
    参数:
        user: 用户对象
        obj: 要检查的对象
        permission_type: 权限类型 ('view', 'edit', 'delete')
        permission_field: 权限字段名称
    
    返回:
        True: 有权限
        False: 无权限
    """
    # 超级管理员有所有权限
    if user.is_superuser:
        return True
    
    # 获取模块名称
    module_name = obj._meta.app_label
    
    # 检查是否有全局权限
    global_permission_map = {
        'view': f'{module_name}.view_all',
        'edit': f'{module_name}.edit_all',
        'delete': f'{module_name}.delete_all'
    }
    
    global_permission = global_permission_map.get(permission_type)
    if global_permission and user.has_permission(global_permission):
        return True
    
    # 检查是否是对象的创建者
    creator = getattr(obj, permission_field, None)
    if creator == user:
        return True
    
    # 检查部门权限
    if user.department and creator:
        creator_dept = getattr(creator, 'department', None)
        
        # 检查是否有部门及下级权限
        if user.has_permission(f'{module_name}.{permission_type}_department_and_sub'):
            if creator_dept:
                departments = [user.department] + user.department.get_all_children()
                if creator_dept in departments:
                    return True
        
        # 检查是否有部门权限
        if user.has_permission(f'{module_name}.{permission_type}_department'):
            if creator_dept == user.department:
                return True
    
    # 检查基础权限（只能操作自己的数据）
    basic_permission = f'{module_name}.{permission_type}'
    if user.has_permission(basic_permission):
        return creator == user
    
    return False
