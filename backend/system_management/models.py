"""
系统管理模块数据模型
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.cache import cache


class Department(models.Model):
    """部门模型"""
    id = models.BigAutoField(primary_key=True, verbose_name='部门ID')
    wechat_dept_id = models.BigIntegerField(unique=True, verbose_name='企微部门ID')
    name = models.CharField(max_length=100, verbose_name='部门名称')
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
        verbose_name='上级部门'
    )
    order = models.IntegerField(default=0, verbose_name='排序')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'sys_department'
        verbose_name = '部门'
        verbose_name_plural = '部门'
        ordering = ['order', 'id']
        indexes = [
            models.Index(fields=['parent'], name='idx_dept_parent'),
        ]

    def __str__(self):
        return self.name

    def get_children(self):
        """获取所有子部门"""
        return self.children.all()

    def get_all_children(self):
        """递归获取所有子部门（包括子部门的子部门）"""
        children = []
        for child in self.children.all():
            children.append(child)
            children.extend(child.get_all_children())
        return children

    def get_department_path(self):
        """获取部门路径（从根部门到当前部门）"""
        path = [self]
        current = self.parent
        while current:
            path.insert(0, current)
            current = current.parent
        return path

    def get_department_path_names(self):
        """获取部门路径名称列表"""
        return [dept.name for dept in self.get_department_path()]

    def get_level(self):
        """获取部门层级（根部门为1）"""
        return len(self.get_department_path())


class User(AbstractUser):
    """用户模型"""
    phone = models.CharField(max_length=11, unique=True, verbose_name='手机号')
    wechat_user_id = models.CharField(max_length=64, unique=True, verbose_name='企微用户ID')
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name='所属部门'
    )
    position = models.CharField(max_length=50, blank=True, verbose_name='职位')
    is_active = models.BooleanField(default=True, verbose_name='启用状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'sys_user'
        verbose_name = '用户'
        verbose_name_plural = '用户'
        indexes = [
            models.Index(fields=['department'], name='idx_user_dept'),
            models.Index(fields=['is_active'], name='idx_user_active'),
            models.Index(fields=['phone'], name='idx_user_phone'),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_full_name() or self.phone})"

    def get_full_name(self):
        """获取用户全名"""
        if self.first_name and self.last_name:
            return f"{self.last_name}{self.first_name}"
        return self.username

    def has_permission(self, permission_code):
        """
        检查用户是否具有指定权限
        使用缓存提高性能
        
        参数:
            permission_code: 权限编码，如 'system.user.view'
        
        返回:
            True: 用户具有该权限
            False: 用户不具有该权限
        """
        if self.is_superuser:
            return True
        
        # 使用缓存服务获取权限集合
        from .services.cache_service import cache_service
        permissions = cache_service.get_user_permissions(self.id)
        
        if permissions is None:
            # 缓存未命中，从数据库查询
            permissions = set(
                self.roles.filter(is_active=True)
                .values_list('permissions__code', flat=True)
            )
            # 设置权限缓存
            cache_service.set_user_permissions(self.id, permissions)
        
        return permission_code in permissions

    def get_permissions(self):
        """
        获取用户所有权限
        使用缓存提高性能
        
        返回:
            QuerySet: 用户的所有权限对象
        """
        if self.is_superuser:
            # 超级管理员拥有所有权限
            return Permission.objects.all()
        
        # 从用户的所有启用角色中获取权限
        return Permission.objects.filter(
            roles__users=self,
            roles__is_active=True
        ).distinct()
    
    def get_permission_codes(self):
        """
        获取用户所有权限编码列表
        使用缓存提高性能
        
        返回:
            set: 权限编码集合
        """
        # 使用缓存服务获取权限集合
        from .services.cache_service import cache_service
        permissions = cache_service.get_user_permissions(self.id)
        
        if permissions is None:
            if self.is_superuser:
                # 超级管理员拥有所有权限
                permissions = set(Permission.objects.values_list('code', flat=True))
            else:
                # 从用户角色获取权限编码
                permissions = set(
                    self.roles.filter(is_active=True)
                    .values_list('permissions__code', flat=True)
                )
            # 设置权限缓存
            cache_service.set_user_permissions(self.id, permissions)
        
        return permissions
    
    def clear_permission_cache(self):
        """
        清除用户权限缓存
        在用户角色或权限变更时调用
        """
        from .services.cache_service import cache_service
        cache_service.clear_user_permissions(self.id)


class Permission(models.Model):
    """权限模型"""
    id = models.BigAutoField(primary_key=True, verbose_name='权限ID')
    code = models.CharField(max_length=100, unique=True, verbose_name='权限编码')
    name = models.CharField(max_length=100, verbose_name='权限名称')
    module = models.CharField(max_length=50, verbose_name='所属模块')
    description = models.TextField(blank=True, verbose_name='权限描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'sys_permission'
        verbose_name = '权限'
        verbose_name_plural = '权限'
        ordering = ['module', 'code']
        indexes = [
            models.Index(fields=['module'], name='idx_perm_module'),
            models.Index(fields=['code'], name='idx_perm_code'),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Role(models.Model):
    """角色模型"""
    id = models.BigAutoField(primary_key=True, verbose_name='角色ID')
    name = models.CharField(max_length=50, unique=True, verbose_name='角色名称')
    description = models.TextField(blank=True, verbose_name='角色描述')
    permissions = models.ManyToManyField(
        Permission,
        related_name='roles',
        blank=True,
        verbose_name='权限列表'
    )
    users = models.ManyToManyField(
        User,
        related_name='roles',
        blank=True,
        verbose_name='角色成员'
    )
    is_active = models.BooleanField(default=True, verbose_name='启用状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'sys_role'
        verbose_name = '角色'
        verbose_name_plural = '角色'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name'], name='idx_role_name'),
            models.Index(fields=['is_active'], name='idx_role_active'),
        ]

    def __str__(self):
        return self.name

    def get_member_count(self):
        """获取角色成员数量"""
        return self.users.count()

    def is_in_use(self):
        """检查角色是否被使用（是否有用户关联）"""
        return self.users.exists()

    def add_permissions(self, permission_codes):
        """
        添加权限（通过权限编码列表）
        自动清除相关用户的权限缓存
        """
        permissions = Permission.objects.filter(code__in=permission_codes)
        self.permissions.add(*permissions)
        # 清除所有拥有此角色的用户的权限缓存
        self._clear_users_permission_cache()

    def remove_permissions(self, permission_codes):
        """
        移除权限（通过权限编码列表）
        自动清除相关用户的权限缓存
        """
        permissions = Permission.objects.filter(code__in=permission_codes)
        self.permissions.remove(*permissions)
        # 清除所有拥有此角色的用户的权限缓存
        self._clear_users_permission_cache()

    def add_users(self, user_ids):
        """
        添加用户成员
        自动清除新增用户的权限缓存
        """
        users = User.objects.filter(id__in=user_ids)
        self.users.add(*users)
        # 清除新增用户的权限缓存
        for user in users:
            user.clear_permission_cache()

    def remove_users(self, user_ids):
        """
        移除用户成员
        自动清除移除用户的权限缓存
        """
        users = User.objects.filter(id__in=user_ids)
        self.users.remove(*users)
        # 清除移除用户的权限缓存
        for user in users:
            user.clear_permission_cache()
    
    def _clear_users_permission_cache(self):
        """清除所有拥有此角色的用户的权限缓存"""
        for user in self.users.all():
            user.clear_permission_cache()


class AuditLog(models.Model):
    """审计日志模型"""
    id = models.BigAutoField(primary_key=True, verbose_name='日志ID')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='操作人'
    )
    action = models.CharField(max_length=50, verbose_name='操作类型')
    target_type = models.CharField(max_length=50, verbose_name='操作对象类型')
    target_id = models.BigIntegerField(verbose_name='操作对象ID')
    details = models.JSONField(verbose_name='操作详情')
    ip_address = models.GenericIPAddressField(verbose_name='IP地址')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='操作时间')

    class Meta:
        db_table = 'sys_audit_log'
        verbose_name = '审计日志'
        verbose_name_plural = '审计日志'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user'], name='idx_log_user'),
            models.Index(fields=['action'], name='idx_log_action'),
            models.Index(fields=['created_at'], name='idx_log_time'),
            models.Index(fields=['target_type', 'target_id'], name='idx_log_target'),
        ]

    def __str__(self):
        user_name = self.user.username if self.user else '未知用户'
        return f"{user_name} - {self.action} - {self.target_type}#{self.target_id}"

    @classmethod
    def log_action(cls, user, action, target_type, target_id, details, ip_address):
        """记录操作日志"""
        return cls.objects.create(
            user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address
        )
