"""
初始化权限数据的管理命令

使用方法:
python manage.py init_permissions

该命令会创建系统管理模块的所有权限数据，包括：
- 部门管理权限
- 用户管理权限  
- 角色管理权限
- 审计日志权限
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from system_management.models import Permission


class Command(BaseCommand):
    help = '初始化系统管理模块的权限数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新创建权限（会删除现有权限）',
        )

    def handle(self, *args, **options):
        """执行权限初始化"""
        force = options.get('force', False)
        
        if force:
            self.stdout.write(
                self.style.WARNING('强制模式：将删除现有权限并重新创建')
            )
            # 删除现有的系统管理模块权限
            Permission.objects.filter(module__in=['系统管理', '部门管理', '用户管理', '角色管理', '审计日志']).delete()
        
        # 定义权限数据
        permissions_data = self._get_permissions_data()
        
        # 使用事务确保数据一致性
        with transaction.atomic():
            created_count = 0
            updated_count = 0
            
            for perm_data in permissions_data:
                permission, created = Permission.objects.get_or_create(
                    code=perm_data['code'],
                    defaults={
                        'name': perm_data['name'],
                        'module': perm_data['module'],
                        'description': perm_data['description']
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ 创建权限: {permission.name} ({permission.code})')
                    )
                else:
                    # 更新现有权限的信息
                    permission.name = perm_data['name']
                    permission.module = perm_data['module']
                    permission.description = perm_data['description']
                    permission.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'↻ 更新权限: {permission.name} ({permission.code})')
                    )
        
        # 输出统计信息
        self.stdout.write(
            self.style.SUCCESS(
                f'\n权限初始化完成！'
                f'\n创建: {created_count} 个权限'
                f'\n更新: {updated_count} 个权限'
                f'\n总计: {created_count + updated_count} 个权限'
            )
        )

    def _get_permissions_data(self):
        """
        定义系统管理模块的权限数据
        
        权限编码规范：模块.功能.操作
        - 模块：system（系统管理）
        - 功能：department（部门）、user（用户）、role（角色）、audit（审计）
        - 操作：view（查看）、create（创建）、edit（编辑）、delete（删除）、sync（同步）等
        """
        return [
            # 部门管理权限
            {
                'code': 'system.department.view',
                'name': '查看部门',
                'module': '部门管理',
                'description': '查看部门列表和部门详情的权限'
            },
            {
                'code': 'system.department.sync',
                'name': '同步部门',
                'module': '部门管理',
                'description': '从企业微信同步部门信息的权限'
            },
            {
                'code': 'system.department.tree',
                'name': '查看部门树',
                'module': '部门管理',
                'description': '查看部门树形结构的权限'
            },
            
            # 用户管理权限
            {
                'code': 'system.user.view',
                'name': '查看用户',
                'module': '用户管理',
                'description': '查看用户列表和用户详情的权限'
            },
            {
                'code': 'system.user.sync',
                'name': '同步用户',
                'module': '用户管理',
                'description': '从企业微信同步用户信息的权限'
            },
            {
                'code': 'system.user.toggle_status',
                'name': '启用停用用户',
                'module': '用户管理',
                'description': '启用或停用用户账号的权限'
            },
            {
                'code': 'system.user.assign_roles',
                'name': '分配用户角色',
                'module': '用户管理',
                'description': '为用户分配或移除角色的权限'
            },
            {
                'code': 'system.user.manage',
                'name': '管理用户',
                'module': '用户管理',
                'description': '用户管理的综合权限（包含查看、同步、启用停用、分配角色）'
            },
            
            # 角色管理权限
            {
                'code': 'system.role.view',
                'name': '查看角色',
                'module': '角色管理',
                'description': '查看角色列表和角色详情的权限'
            },
            {
                'code': 'system.role.create',
                'name': '创建角色',
                'module': '角色管理',
                'description': '创建新角色的权限'
            },
            {
                'code': 'system.role.edit',
                'name': '编辑角色',
                'module': '角色管理',
                'description': '编辑角色信息的权限'
            },
            {
                'code': 'system.role.delete',
                'name': '删除角色',
                'module': '角色管理',
                'description': '删除角色的权限'
            },
            {
                'code': 'system.role.assign_permissions',
                'name': '分配角色权限',
                'module': '角色管理',
                'description': '为角色分配或移除权限的权限'
            },
            {
                'code': 'system.role.manage_members',
                'name': '管理角色成员',
                'module': '角色管理',
                'description': '管理角色成员（添加、移除用户）的权限'
            },
            {
                'code': 'system.role.manage',
                'name': '管理角色',
                'module': '角色管理',
                'description': '角色管理的综合权限（包含所有角色操作）'
            },
            
            # 权限管理权限
            {
                'code': 'system.permission.view',
                'name': '查看权限',
                'module': '权限管理',
                'description': '查看权限列表的权限'
            },
            
            # 审计日志权限
            {
                'code': 'system.audit.view',
                'name': '查看审计日志',
                'module': '审计日志',
                'description': '查看系统审计日志的权限'
            },
            {
                'code': 'system.audit.export',
                'name': '导出审计日志',
                'module': '审计日志',
                'description': '导出审计日志数据的权限'
            },
            
            # 系统管理综合权限
            {
                'code': 'system.admin',
                'name': '系统管理员',
                'module': '系统管理',
                'description': '系统管理员权限，拥有所有系统管理功能的访问权限'
            },
            
            # 企业微信集成权限
            {
                'code': 'system.wechat.sync',
                'name': '企微数据同步',
                'module': '企微集成',
                'description': '执行企业微信数据同步操作的权限'
            },
            {
                'code': 'system.wechat.config',
                'name': '企微配置管理',
                'module': '企微集成',
                'description': '管理企业微信集成配置的权限'
            },
            
            # 基础系统权限（其他模块可能需要的通用权限）
            {
                'code': 'system.dashboard.view',
                'name': '查看系统首页',
                'module': '系统管理',
                'description': '访问系统管理首页和仪表板的权限'
            },
            {
                'code': 'system.menu.view',
                'name': '查看系统菜单',
                'module': '系统管理',
                'description': '查看系统管理菜单的权限'
            },
        ]