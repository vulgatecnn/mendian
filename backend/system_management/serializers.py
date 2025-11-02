"""
系统管理模块序列化器
"""
from rest_framework import serializers
from .models import Department, User, Role, Permission, AuditLog


class DepartmentSerializer(serializers.ModelSerializer):
    """
    部门序列化器
    支持嵌套序列化子部门
    """
    # 子部门列表（递归嵌套）
    children = serializers.SerializerMethodField()
    # 父部门名称（只读）
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    # 部门路径名称列表（只读）
    path_names = serializers.SerializerMethodField()
    # 部门层级（只读）
    level = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id',
            'wechat_dept_id',
            'name',
            'parent',
            'parent_name',
            'order',
            'level',
            'path_names',
            'children',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        """
        获取子部门列表（递归序列化）
        """
        children = obj.children.all().order_by('order', 'id')
        # 递归序列化子部门
        return DepartmentSerializer(children, many=True, context=self.context).data
    
    def get_path_names(self, obj):
        """
        获取部门路径名称列表
        例如：['总公司', '技术部', '研发组']
        """
        return obj.get_department_path_names()
    
    def get_level(self, obj):
        """
        获取部门层级（根部门为1）
        """
        return obj.get_level()


class DepartmentSimpleSerializer(serializers.ModelSerializer):
    """
    部门简单序列化器（不包含子部门）
    用于列表展示和关联查询
    """
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Department
        fields = [
            'id',
            'wechat_dept_id',
            'name',
            'parent',
            'parent_name',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']



class RoleSimpleSerializer(serializers.ModelSerializer):
    """
    角色简单序列化器
    用于用户序列化中的角色信息嵌套
    """
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'is_active']
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    """
    用户序列化器
    支持部门信息和角色信息的嵌套序列化
    """
    # 部门信息（嵌套序列化）
    department_info = DepartmentSimpleSerializer(source='department', read_only=True)
    # 角色信息列表（嵌套序列化）
    role_list = RoleSimpleSerializer(source='roles', many=True, read_only=True)
    # 用户全名（只读）
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'first_name',
            'last_name',
            'email',
            'phone',
            'wechat_user_id',
            'department',
            'department_info',
            'position',
            'is_active',
            'is_staff',
            'is_superuser',
            'role_list',
            'date_joined',
            'last_login',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'date_joined',
            'last_login',
            'created_at',
            'updated_at',
        ]
        # 排除密码等敏感信息
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def get_full_name(self, obj):
        """
        获取用户全名
        """
        return obj.get_full_name()


class UserSimpleSerializer(serializers.ModelSerializer):
    """
    用户简单序列化器
    用于列表展示和关联查询
    """
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'phone',
            'department',
            'department_name',
            'position',
            'is_active',
        ]
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        """
        获取用户全名
        """
        return obj.get_full_name()


class PermissionSerializer(serializers.ModelSerializer):
    """
    权限序列化器
    用于权限的展示和管理
    """
    class Meta:
        model = Permission
        fields = [
            'id',
            'code',
            'name',
            'module',
            'description',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    """
    角色序列化器
    包含权限列表和成员数量
    """
    # 权限列表（嵌套序列化）
    permission_list = PermissionSerializer(source='permissions', many=True, read_only=True)
    # 成员数量（只读）
    member_count = serializers.SerializerMethodField()
    # 权限ID列表（用于创建和更新）
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='权限ID列表'
    )
    
    class Meta:
        model = Role
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'permission_list',
            'permission_ids',
            'member_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        """
        获取角色成员数量
        """
        return obj.get_member_count()
    
    def create(self, validated_data):
        """
        创建角色
        支持同时设置权限
        """
        # 提取权限ID列表
        permission_ids = validated_data.pop('permission_ids', [])
        
        # 创建角色
        role = Role.objects.create(**validated_data)
        
        # 设置权限
        if permission_ids:
            permissions = Permission.objects.filter(id__in=permission_ids)
            role.permissions.set(permissions)
        
        return role
    
    def update(self, instance, validated_data):
        """
        更新角色
        支持同时更新权限
        """
        # 提取权限ID列表
        permission_ids = validated_data.pop('permission_ids', None)
        
        # 更新角色基本信息
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 更新权限（如果提供了权限ID列表）
        if permission_ids is not None:
            permissions = Permission.objects.filter(id__in=permission_ids)
            instance.permissions.set(permissions)
            # 清除所有拥有此角色的用户的权限缓存
            instance._clear_users_permission_cache()
        
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    """
    审计日志序列化器
    包含操作人信息的嵌套序列化
    """
    # 操作人信息（嵌套序列化）
    user_info = UserSimpleSerializer(source='user', read_only=True)
    # 操作人用户名（只读，用于快速访问）
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    # 操作人全名（只读）
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'user_info',
            'username',
            'user_full_name',
            'action',
            'target_type',
            'target_id',
            'details',
            'ip_address',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'user_info',
            'username',
            'user_full_name',
            'action',
            'target_type',
            'target_id',
            'details',
            'ip_address',
            'created_at',
        ]
    
    def get_user_full_name(self, obj):
        """
        获取操作人全名
        如果用户不存在（已删除），返回 None
        """
        if obj.user:
            return obj.user.get_full_name()
        return None
