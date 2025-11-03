"""
初始化开店计划管理角色的Django管理命令
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from system_management.models import Permission, Role
from store_planning.permissions_config import (
    ROLE_PERMISSION_TEMPLATES,
    get_permissions_by_role_template,
    validate_permission_dependencies
)


class Command(BaseCommand):
    help = '初始化开店计划管理模块的角色定义'

    def add_arguments(self, parser):
        parser.add_argument(
            '--role',
            type=str,
            help='指定要创建的角色模板名称',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新创建角色（删除已存在的角色）',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='预览模式，不实际创建角色',
        )
        parser.add_argument(
            '--list-templates',
            action='store_true',
            help='列出所有可用的角色模板',
        )

    def handle(self, *args, **options):
        """执行角色初始化"""
        if options.get('list_templates'):
            self._show_available_templates()
            return
            
        role_name = options.get('role')
        force = options.get('force', False)
        dry_run = options.get('dry_run', False)
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('预览模式：不会实际创建角色')
            )
        
        self.stdout.write(
            self.style.SUCCESS('开始初始化开店计划管理角色...')
        )
        
        try:
            if role_name:
                # 创建指定角色
                if role_name not in ROLE_PERMISSION_TEMPLATES:
                    self.stdout.write(
                        self.style.ERROR(f'角色模板 "{role_name}" 不存在')
                    )
                    self._show_available_templates()
                    return
                
                self._create_single_role(role_name, force, dry_run)
            else:
                # 创建所有角色
                self._create_all_roles(force, dry_run)
                
            if not dry_run:
                self.stdout.write(
                    self.style.SUCCESS('开店计划管理角色初始化完成！')
                )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'角色初始化失败: {str(e)}')
            )
            raise

    def _create_single_role(self, template_name, force=False, dry_run=False):
        """创建单个角色"""
        template = ROLE_PERMISSION_TEMPLATES[template_name]
        
        self.stdout.write(f'\n创建角色: {template["name"]}')
        self.stdout.write(f'描述: {template["description"]}')
        
        # 获取权限列表
        permissions = get_permissions_by_role_template(template_name)
        
        # 验证权限依赖
        missing_deps = validate_permission_dependencies(permissions)
        if missing_deps:
            self.stdout.write(
                self.style.WARNING('发现权限依赖问题:')
            )
            for dep in missing_deps:
                self.stdout.write(
                    f'  权限 {dep["permission"]} 依赖 {dep["missing_dependency"]}'
                )
        
        self.stdout.write(f'权限数量: {len(permissions)}')
        
        if dry_run:
            self._show_role_permissions(permissions)
            return
        
        with transaction.atomic():
            self._create_role_with_permissions(
                template["name"], 
                template["description"], 
                permissions, 
                force
            )

    def _create_all_roles(self, force=False, dry_run=False):
        """创建所有角色"""
        for template_name in ROLE_PERMISSION_TEMPLATES.keys():
            self._create_single_role(template_name, force, dry_run)

    def _create_role_with_permissions(self, role_name, description, permission_codes, force=False):
        """创建角色并分配权限"""
        
        # 检查角色是否存在
        if Role.objects.filter(name=role_name).exists():
            if force:
                Role.objects.filter(name=role_name).delete()
                self.stdout.write(
                    self.style.WARNING(f'已删除现有角色: {role_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'角色 "{role_name}" 已存在，跳过创建')
                )
                return
        
        # 创建角色
        role = Role.objects.create(
            name=role_name,
            description=description
        )
        
        # 获取权限对象
        permissions = Permission.objects.filter(code__in=permission_codes)
        existing_codes = set(permissions.values_list('code', flat=True))
        missing_codes = set(permission_codes) - existing_codes
        
        if missing_codes:
            self.stdout.write(
                self.style.WARNING(
                    f'以下权限不存在，将被跳过: {", ".join(missing_codes)}'
                )
            )
        
        # 分配权限
        if permissions.exists():
            role.permissions.add(*permissions)
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ 创建角色: {role_name} (分配了 {permissions.count()} 个权限)'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠ 创建角色: {role_name} (无可用权限)')
            )

    def _show_role_permissions(self, permission_codes):
        """显示角色权限列表"""
        self.stdout.write('权限列表:')
        
        # 按模块分组显示
        permissions = Permission.objects.filter(code__in=permission_codes)
        modules = {}
        
        for perm in permissions:
            module = perm.module
            if module not in modules:
                modules[module] = []
            modules[module].append(perm)
        
        for module, perms in modules.items():
            self.stdout.write(f'  {module}:')
            for perm in perms:
                self.stdout.write(f'    - {perm.name} ({perm.code})')
        
        # 显示不存在的权限
        existing_codes = set(permissions.values_list('code', flat=True))
        missing_codes = set(permission_codes) - existing_codes
        if missing_codes:
            self.stdout.write('  不存在的权限:')
            for code in missing_codes:
                self.stdout.write(f'    - {code}')

    def _show_available_templates(self):
        """显示可用的角色模板"""
        self.stdout.write('\n可用的角色模板:')
        for template_name, template in ROLE_PERMISSION_TEMPLATES.items():
            self.stdout.write(
                f'  {template_name}: {template["name"]} - {template["description"]}'
            )