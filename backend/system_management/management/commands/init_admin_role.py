"""
创建默认管理员角色的管理命令

使用方法:
python manage.py init_admin_role

该命令会创建"系统管理员"角色，并分配所有系统管理权限
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from system_management.models import Role, Permission


class Command(BaseCommand):
    help = '创建默认的系统管理员角色'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新创建角色（会删除现有同名角色）',
        )
        parser.add_argument(
            '--role-name',
            type=str,
            default='系统管理员',
            help='角色名称（默认：系统管理员）',
        )

    def handle(self, *args, **options):
        """执行角色创建"""
        force = options.get('force', False)
        role_name = options.get('role_name', '系统管理员')
        
        if force:
            self.stdout.write(
                self.style.WARNING(f'强制模式：将删除现有角色"{role_name}"并重新创建')
            )
            # 删除现有同名角色
            Role.objects.filter(name=role_name).delete()
        
        # 使用事务确保数据一致性
        with transaction.atomic():
            # 检查角色是否已存在
            if Role.objects.filter(name=role_name).exists():
                self.stdout.write(
                    self.style.WARNING(f'角色"{role_name}"已存在，跳过创建')
                )
                role = Role.objects.get(name=role_name)
            else:
                # 创建系统管理员角色
                role = Role.objects.create(
                    name=role_name,
                    description='系统管理员角色，拥有所有系统管理功能的访问权限，包括部门管理、用户管理、角色管理和审计日志查看等。',
                    is_active=True
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✓ 创建角色: {role.name}')
                )
            
            # 获取所有系统管理相关权限
            system_permissions = self._get_admin_permissions()
            
            if not system_permissions:
                self.stdout.write(
                    self.style.ERROR('未找到系统管理权限，请先运行 init_permissions 命令')
                )
                return
            
            # 为角色分配权限
            role.permissions.clear()  # 清除现有权限
            role.permissions.add(*system_permissions)
            
            # 输出分配的权限
            self.stdout.write(
                self.style.SUCCESS(f'✓ 为角色"{role.name}"分配了 {len(system_permissions)} 个权限:')
            )
            
            for perm in system_permissions.order_by('module', 'code'):
                self.stdout.write(f'  - [{perm.module}] {perm.name} ({perm.code})')
        
        # 输出统计信息
        self.stdout.write(
            self.style.SUCCESS(
                f'\n系统管理员角色创建完成！'
                f'\n角色名称: {role.name}'
                f'\n权限数量: {role.permissions.count()}'
                f'\n角色状态: {"启用" if role.is_active else "停用"}'
            )
        )
        
        # 提示如何分配用户
        self.stdout.write(
            self.style.WARNING(
                f'\n提示：'
                f'\n1. 可以通过管理界面为用户分配"{role.name}"角色'
                f'\n2. 或使用以下命令为用户分配角色：'
                f'\n   python manage.py shell -c "from system_management.models import User, Role; '
                f'user = User.objects.get(username=\'用户名\'); '
                f'role = Role.objects.get(name=\'{role.name}\'); '
                f'role.users.add(user)"'
            )
        )

    def _get_admin_permissions(self):
        """
        获取系统管理员应该拥有的权限
        
        系统管理员拥有所有系统管理模块的权限，包括：
        - 所有部门管理权限
        - 所有用户管理权限
        - 所有角色管理权限
        - 所有权限管理权限
        - 所有审计日志权限
        - 所有企微集成权限
        - 系统管理基础权限
        """
        # 定义系统管理员应该拥有的权限模块
        admin_modules = [
            '部门管理',
            '用户管理', 
            '角色管理',
            '权限管理',
            '审计日志',
            '企微集成',
            '系统管理'
        ]
        
        # 获取这些模块的所有权限
        permissions = Permission.objects.filter(module__in=admin_modules)
        
        return permissions

    def _get_essential_permissions(self):
        """
        获取系统管理员的核心权限（最小权限集）
        如果需要创建权限更少的管理员角色，可以使用这个方法
        """
        essential_codes = [
            # 系统管理基础权限
            'system.admin',
            'system.dashboard.view',
            'system.menu.view',
            
            # 部门管理核心权限
            'system.department.view',
            'system.department.sync',
            
            # 用户管理核心权限
            'system.user.manage',
            
            # 角色管理核心权限
            'system.role.manage',
            
            # 审计日志权限
            'system.audit.view',
            
            # 企微集成权限
            'system.wechat.sync',
        ]
        
        return Permission.objects.filter(code__in=essential_codes)