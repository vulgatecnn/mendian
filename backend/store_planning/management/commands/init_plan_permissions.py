"""
初始化开店计划管理权限的Django管理命令
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from system_management.models import Permission


class Command(BaseCommand):
    help = '初始化开店计划管理模块的权限定义'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新创建权限（删除已存在的权限）',
        )

    def handle(self, *args, **options):
        """执行权限初始化"""
        force = options.get('force', False)
        
        self.stdout.write(
            self.style.SUCCESS('开始初始化开店计划管理权限...')
        )
        
        try:
            with transaction.atomic():
                self._create_permissions(force)
                
            self.stdout.write(
                self.style.SUCCESS('开店计划管理权限初始化完成！')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'权限初始化失败: {str(e)}')
            )
            raise

    def _create_permissions(self, force=False):
        """创建权限定义"""
        
        # 定义开店计划管理相关权限
        permissions_data = [
            # 基础数据管理权限
            {
                'code': 'store_planning.region.view',
                'name': '查看经营区域',
                'module': '开店计划管理',
                'description': '查看经营区域列表和详情'
            },
            {
                'code': 'store_planning.region.create',
                'name': '创建经营区域',
                'module': '开店计划管理',
                'description': '创建新的经营区域'
            },
            {
                'code': 'store_planning.region.update',
                'name': '修改经营区域',
                'module': '开店计划管理',
                'description': '修改经营区域信息'
            },
            {
                'code': 'store_planning.region.delete',
                'name': '删除经营区域',
                'module': '开店计划管理',
                'description': '删除经营区域'
            },
            {
                'code': 'store_planning.store_type.view',
                'name': '查看门店类型',
                'module': '开店计划管理',
                'description': '查看门店类型列表和详情'
            },
            {
                'code': 'store_planning.store_type.create',
                'name': '创建门店类型',
                'module': '开店计划管理',
                'description': '创建新的门店类型'
            },
            {
                'code': 'store_planning.store_type.update',
                'name': '修改门店类型',
                'module': '开店计划管理',
                'description': '修改门店类型信息'
            },
            {
                'code': 'store_planning.store_type.delete',
                'name': '删除门店类型',
                'module': '开店计划管理',
                'description': '删除门店类型'
            },
            
            # 计划管理核心权限
            {
                'code': 'store_planning.plan.view',
                'name': '查看开店计划',
                'module': '开店计划管理',
                'description': '查看开店计划列表和详情'
            },
            {
                'code': 'store_planning.plan.create',
                'name': '创建开店计划',
                'module': '开店计划管理',
                'description': '创建新的开店计划'
            },
            {
                'code': 'store_planning.plan.update',
                'name': '修改开店计划',
                'module': '开店计划管理',
                'description': '修改开店计划信息（草稿状态）'
            },
            {
                'code': 'store_planning.plan.delete',
                'name': '删除开店计划',
                'module': '开店计划管理',
                'description': '删除开店计划（仅草稿状态）'
            },
            {
                'code': 'store_planning.plan.publish',
                'name': '发布开店计划',
                'module': '开店计划管理',
                'description': '发布开店计划，使计划生效'
            },
            {
                'code': 'store_planning.plan.cancel',
                'name': '取消开店计划',
                'module': '开店计划管理',
                'description': '取消已发布或执行中的计划'
            },
            {
                'code': 'store_planning.plan.execute',
                'name': '执行开店计划',
                'module': '开店计划管理',
                'description': '开始执行已发布的计划'
            },
            {
                'code': 'store_planning.plan.complete',
                'name': '完成开店计划',
                'module': '开店计划管理',
                'description': '标记计划为完成状态'
            },
            
            # 区域计划管理权限
            {
                'code': 'store_planning.regional_plan.view',
                'name': '查看区域计划',
                'module': '开店计划管理',
                'description': '查看区域计划详情'
            },
            {
                'code': 'store_planning.regional_plan.update',
                'name': '修改区域计划',
                'module': '开店计划管理',
                'description': '修改区域计划信息'
            },
            {
                'code': 'store_planning.regional_plan.delete',
                'name': '删除区域计划',
                'module': '开店计划管理',
                'description': '删除区域计划'
            },
            
            # 计划执行监控权限
            {
                'code': 'store_planning.progress.view',
                'name': '查看执行进度',
                'module': '开店计划管理',
                'description': '查看计划执行进度和统计'
            },
            {
                'code': 'store_planning.progress.update',
                'name': '更新执行进度',
                'module': '开店计划管理',
                'description': '更新计划执行进度'
            },
            {
                'code': 'store_planning.progress.record',
                'name': '记录门店开业',
                'module': '开店计划管理',
                'description': '记录门店开业，自动更新进度'
            },
            
            # 统计分析权限
            {
                'code': 'store_planning.statistics.view',
                'name': '查看统计分析',
                'module': '开店计划管理',
                'description': '查看计划统计分析数据'
            },
            {
                'code': 'store_planning.dashboard.view',
                'name': '查看仪表板',
                'module': '开店计划管理',
                'description': '查看计划管理仪表板'
            },
            {
                'code': 'store_planning.dashboard.refresh',
                'name': '刷新仪表板缓存',
                'module': '开店计划管理',
                'description': '手动刷新仪表板缓存数据'
            },
            {
                'code': 'store_planning.reports.view',
                'name': '查看分析报表',
                'module': '开店计划管理',
                'description': '查看各类分析报表'
            },
            
            # 数据导入导出权限
            {
                'code': 'store_planning.import.execute',
                'name': '导入计划数据',
                'module': '开店计划管理',
                'description': '从Excel文件导入计划数据'
            },
            {
                'code': 'store_planning.export.execute',
                'name': '导出计划数据',
                'module': '开店计划管理',
                'description': '导出计划数据到Excel文件'
            },
            {
                'code': 'store_planning.template.download',
                'name': '下载导入模板',
                'module': '开店计划管理',
                'description': '下载数据导入模板'
            },
            
            # 审批流程权限
            {
                'code': 'store_planning.approval.submit',
                'name': '提交计划审批',
                'module': '开店计划管理',
                'description': '提交计划审批申请'
            },
            {
                'code': 'store_planning.approval.view',
                'name': '查看审批记录',
                'module': '开店计划管理',
                'description': '查看计划审批记录'
            },
            {
                'code': 'store_planning.approval.approve',
                'name': '审批计划',
                'module': '开店计划管理',
                'description': '审批通过或拒绝计划申请'
            },
            {
                'code': 'store_planning.approval.cancel',
                'name': '取消审批申请',
                'module': '开店计划管理',
                'description': '取消已提交的审批申请'
            },
            {
                'code': 'store_planning.approval.batch',
                'name': '批量审批',
                'module': '开店计划管理',
                'description': '批量处理审批申请'
            },
            
            # 审计日志权限
            {
                'code': 'store_planning.audit.view',
                'name': '查看审计日志',
                'module': '开店计划管理',
                'description': '查看计划管理相关的审计日志'
            },
            
            # 系统管理权限
            {
                'code': 'store_planning.system.config',
                'name': '系统配置管理',
                'module': '开店计划管理',
                'description': '管理计划系统配置参数'
            },
            {
                'code': 'store_planning.system.maintenance',
                'name': '系统维护',
                'module': '开店计划管理',
                'description': '执行系统维护操作'
            },
            
            # 高级权限（敏感操作）
            {
                'code': 'store_planning.sensitive.force_update',
                'name': '强制修改计划',
                'module': '开店计划管理',
                'description': '强制修改非草稿状态的计划（敏感操作）'
            },
            {
                'code': 'store_planning.sensitive.force_delete',
                'name': '强制删除计划',
                'module': '开店计划管理',
                'description': '强制删除非草稿状态的计划（敏感操作）'
            },
            {
                'code': 'store_planning.sensitive.bypass_approval',
                'name': '跳过审批流程',
                'module': '开店计划管理',
                'description': '跳过审批流程直接操作（敏感操作）'
            },
            {
                'code': 'store_planning.sensitive.data_recovery',
                'name': '数据恢复',
                'module': '开店计划管理',
                'description': '恢复已删除的计划数据（敏感操作）'
            },
        ]
        
        # 如果强制模式，先删除现有权限
        if force:
            existing_codes = [p['code'] for p in permissions_data]
            deleted_count = Permission.objects.filter(
                code__in=existing_codes
            ).delete()[0]
            
            if deleted_count > 0:
                self.stdout.write(
                    self.style.WARNING(f'已删除 {deleted_count} 个现有权限')
                )
        
        # 创建权限
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
                    f'  ✓ 创建权限: {permission.code} - {permission.name}'
                )
            else:
                # 更新现有权限的信息
                permission.name = perm_data['name']
                permission.module = perm_data['module']
                permission.description = perm_data['description']
                permission.save()
                updated_count += 1
                self.stdout.write(
                    f'  ↻ 更新权限: {permission.code} - {permission.name}'
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n权限初始化完成: 创建 {created_count} 个，更新 {updated_count} 个'
            )
        )
        
        # 显示权限分组统计
        self._show_permission_summary()

    def _show_permission_summary(self):
        """显示权限分组统计"""
        self.stdout.write('\n权限分组统计:')
        
        # 按功能分组统计
        groups = {
            '基础数据管理': ['region', 'store_type'],
            '计划管理': ['plan'],
            '区域计划管理': ['regional_plan'],
            '执行监控': ['progress'],
            '统计分析': ['statistics', 'dashboard', 'reports'],
            '数据导入导出': ['import', 'export', 'template'],
            '审批流程': ['approval'],
            '审计日志': ['audit'],
            '系统管理': ['system'],
            '敏感操作': ['sensitive']
        }
        
        for group_name, keywords in groups.items():
            if len(keywords) == 1:
                count = Permission.objects.filter(
                    code__startswith='store_planning.',
                    code__contains=f'.{keywords[0]}.'
                ).count()
            else:
                from django.db.models import Q
                query = Q()
                for kw in keywords:
                    query |= Q(code__contains=f'.{kw}.')
                count = Permission.objects.filter(
                    code__startswith='store_planning.'
                ).filter(query).count()
            
            if count > 0:
                self.stdout.write(f'  {group_name}: {count} 个权限')