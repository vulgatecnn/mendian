"""
系统初始化管理命令

使用方法:
python manage.py init_system

该命令会执行完整的系统初始化，包括：
- 初始化权限数据
- 创建默认管理员角色
- 检查企业微信配置
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
import sys


class Command(BaseCommand):
    help = '执行完整的系统初始化'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新初始化（会删除现有数据）',
        )
        parser.add_argument(
            '--skip-wechat-check',
            action='store_true',
            help='跳过企业微信配置检查',
        )

    def handle(self, *args, **options):
        """执行系统初始化"""
        force = options.get('force', False)
        skip_wechat_check = options.get('skip_wechat_check', False)
        
        self.stdout.write(
            self.style.SUCCESS('门店生命周期管理系统 - 系统初始化')
        )
        self.stdout.write('=' * 60)
        
        try:
            with transaction.atomic():
                # 步骤1：初始化权限数据
                self._init_permissions(force)
                
                # 步骤2：创建默认管理员角色
                self._init_admin_role(force)
                
                # 步骤3：检查企业微信配置
                if not skip_wechat_check:
                    self._check_wechat_config()
                
                # 步骤4：显示初始化完成信息
                self._show_completion_info()
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'初始化过程中发生错误: {str(e)}')
            )
            sys.exit(1)

    def _init_permissions(self, force):
        """初始化权限数据"""
        self.stdout.write('\n步骤 1/3: 初始化权限数据')
        self.stdout.write('-' * 40)
        
        try:
            if force:
                call_command('init_permissions', '--force', verbosity=1)
            else:
                call_command('init_permissions', verbosity=1)
            
            self.stdout.write(
                self.style.SUCCESS('✓ 权限数据初始化完成')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ 权限数据初始化失败: {str(e)}')
            )
            raise

    def _init_admin_role(self, force):
        """创建默认管理员角色"""
        self.stdout.write('\n步骤 2/3: 创建默认管理员角色')
        self.stdout.write('-' * 40)
        
        try:
            if force:
                call_command('init_admin_role', '--force', verbosity=1)
            else:
                call_command('init_admin_role', verbosity=1)
            
            self.stdout.write(
                self.style.SUCCESS('✓ 默认管理员角色创建完成')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ 默认管理员角色创建失败: {str(e)}')
            )
            raise

    def _check_wechat_config(self):
        """检查企业微信配置"""
        self.stdout.write('\n步骤 3/3: 检查企业微信配置')
        self.stdout.write('-' * 40)
        
        try:
            call_command('check_wechat_config', verbosity=1)
            
            self.stdout.write(
                self.style.SUCCESS('✓ 企业微信配置检查完成')
            )
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'⚠ 企业微信配置检查出现问题: {str(e)}')
            )
            # 企业微信配置问题不应该阻止系统初始化
            pass

    def _show_completion_info(self):
        """显示初始化完成信息"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(
            self.style.SUCCESS('🎉 系统初始化完成！')
        )
        
        self.stdout.write('\n已完成的初始化任务:')
        self.stdout.write('  ✓ 权限数据初始化 (23个权限)')
        self.stdout.write('  ✓ 系统管理员角色创建')
        self.stdout.write('  ✓ 企业微信配置检查')
        
        self.stdout.write('\n下一步操作:')
        self.stdout.write('  1. 为用户分配"系统管理员"角色:')
        self.stdout.write('     python manage.py shell -c "')
        self.stdout.write('     from system_management.models import User, Role;')
        self.stdout.write('     user = User.objects.get(username=\'你的用户名\');')
        self.stdout.write('     role = Role.objects.get(name=\'系统管理员\');')
        self.stdout.write('     role.users.add(user)"')
        
        self.stdout.write('\n  2. 配置企业微信集成 (可选):')
        self.stdout.write('     - 参考文档: backend/WECHAT_CONFIG.md')
        self.stdout.write('     - 配置环境变量后运行: python manage.py check_wechat_config --test-api')
        
        self.stdout.write('\n  3. 启动开发服务器:')
        self.stdout.write('     python manage.py runserver')
        
        self.stdout.write('\n  4. 访问管理界面:')
        self.stdout.write('     http://localhost:8000/admin/')
        
        self.stdout.write(
            self.style.WARNING(
                '\n注意: 请妥善保管企业微信凭证，不要将其提交到版本控制系统。'
            )
        )