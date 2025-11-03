"""
开店计划管理模块权限初始化命令
"""
from django.core.management.base import BaseCommand
from system_management.models import Permission


class Command(BaseCommand):
    help = '初始化开店计划管理模块的权限'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化开店计划管理模块权限...')
        
        # 定义所有权限
        permissions = [
            # 经营区域管理权限
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
                'name': '更新经营区域',
                'module': '开店计划管理',
                'description': '修改经营区域信息'
            },
            {
                'code': 'store_planning.region.delete',
                'name': '删除经营区域',
                'module': '开店计划管理',
                'description': '删除经营区域（需要二次确认）'
            },
            
            # 门店类型管理权限
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
                'name': '更新门店类型',
                'module': '开店计划管理',
                'description': '修改门店类型信息'
            },
            {
                'code': 'store_planning.store_type.delete',
                'name': '删除门店类型',
                'module': '开店计划管理',
                'description': '删除门店类型（需要二次确认）'
            },
            
            # 开店计划管理权限
            {
                'code': 'store_planning.plan.view',
                'name': '查看计划',
                'module': '开店计划管理',
                'description': '查看自己创建的计划'
            },
            {
                'code': 'store_planning.plan.view_all',
                'name': '查看所有计划',
                'module': '开店计划管理',
                'description': '查看所有用户创建的计划'
            },
            {
                'code': 'store_planning.plan.create',
                'name': '创建计划',
                'module': '开店计划管理',
                'description': '创建新的开店计划'
            },
            {
                'code': 'store_planning.plan.update',
                'name': '更新计划',
                'module': '开店计划管理',
                'description': '修改自己创建的计划'
            },
            {
                'code': 'store_planning.plan.update_all',
                'name': '更新所有计划',
                'module': '开店计划管理',
                'description': '修改任何用户创建的计划'
            },
            {
                'code': 'store_planning.plan.delete',
                'name': '删除计划',
                'module': '开店计划管理',
                'description': '删除自己创建的计划（需要二次确认）'
            },
            {
                'code': 'store_planning.plan.delete_all',
                'name': '删除所有计划',
                'module': '开店计划管理',
                'description': '删除任何用户创建的计划（需要二次确认）'
            },
            {
                'code': 'store_planning.plan.publish',
                'name': '发布计划',
                'module': '开店计划管理',
                'description': '发布开店计划（需要二次确认）'
            },
            {
                'code': 'store_planning.plan.cancel',
                'name': '取消计划',
                'module': '开店计划管理',
                'description': '取消开店计划（需要二次确认）'
            },
            {
                'code': 'store_planning.plan.execute',
                'name': '执行计划',
                'module': '开店计划管理',
                'description': '开始执行计划'
            },
            {
                'code': 'store_planning.plan.complete',
                'name': '完成计划',
                'module': '开店计划管理',
                'description': '标记计划为完成'
            },
            {
                'code': 'store_planning.plan.update_progress',
                'name': '更新进度',
                'module': '开店计划管理',
                'description': '更新计划执行进度'
            },
            {
                'code': 'store_planning.plan.submit_approval',
                'name': '提交审批',
                'module': '开店计划管理',
                'description': '提交计划审批申请'
            },
            
            # 区域计划管理权限
            {
                'code': 'store_planning.regional_plan.view',
                'name': '查看区域计划',
                'module': '开店计划管理',
                'description': '查看区域计划列表和详情'
            },
            {
                'code': 'store_planning.regional_plan.create',
                'name': '创建区域计划',
                'module': '开店计划管理',
                'description': '创建新的区域计划（通过主计划创建）'
            },
            {
                'code': 'store_planning.regional_plan.update',
                'name': '更新区域计划',
                'module': '开店计划管理',
                'description': '修改区域计划信息'
            },
            {
                'code': 'store_planning.regional_plan.delete',
                'name': '删除区域计划',
                'module': '开店计划管理',
                'description': '删除区域计划（需要二次确认）'
            },
            {
                'code': 'store_planning.regional_plan.update_progress',
                'name': '更新区域进度',
                'module': '开店计划管理',
                'description': '更新区域计划执行进度'
            },
            
            # 审批管理权限
            {
                'code': 'store_planning.approval.view',
                'name': '查看审批',
                'module': '开店计划管理',
                'description': '查看自己提交或需要审批的申请'
            },
            {
                'code': 'store_planning.approval.view_all',
                'name': '查看所有审批',
                'module': '开店计划管理',
                'description': '查看所有审批申请'
            },
            {
                'code': 'store_planning.approval.create',
                'name': '创建审批',
                'module': '开店计划管理',
                'description': '提交审批申请'
            },
            {
                'code': 'store_planning.approval.approve',
                'name': '审批通过',
                'module': '开店计划管理',
                'description': '审批通过申请（需要二次确认）'
            },
            {
                'code': 'store_planning.approval.reject',
                'name': '审批拒绝',
                'module': '开店计划管理',
                'description': '审批拒绝申请（需要二次确认）'
            },
            {
                'code': 'store_planning.approval.cancel',
                'name': '取消审批',
                'module': '开店计划管理',
                'description': '取消审批申请'
            },
            
            # 统计分析权限
            {
                'code': 'store_planning.statistics.view',
                'name': '查看统计',
                'module': '开店计划管理',
                'description': '查看统计分析数据'
            },
            {
                'code': 'store_planning.dashboard.view',
                'name': '查看仪表板',
                'module': '开店计划管理',
                'description': '查看仪表板数据'
            },
            
            # 数据导入导出权限
            {
                'code': 'store_planning.import.view',
                'name': '查看导入',
                'module': '开店计划管理',
                'description': '查看导入模板和指南'
            },
            {
                'code': 'store_planning.import.create',
                'name': '执行导入',
                'module': '开店计划管理',
                'description': '执行数据导入操作'
            },
            {
                'code': 'store_planning.export.create',
                'name': '执行导出',
                'module': '开店计划管理',
                'description': '执行数据导出操作'
            },
            
            # 系统管理权限
            {
                'code': 'store_planning.system.config',
                'name': '系统配置',
                'module': '开店计划管理',
                'description': '系统级配置和管理权限'
            },
            {
                'code': 'store_planning.regional_manager',
                'name': '区域管理员',
                'module': '开店计划管理',
                'description': '区域管理员特殊权限'
            },
        ]
        
        # 创建或更新权限
        created_count = 0
        updated_count = 0
        
        for perm_data in permissions:
            permission, created = Permission.objects.update_or_create(
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
                    self.style.SUCCESS(f'✓ 创建权限: {permission.code} - {permission.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'→ 更新权限: {permission.code} - {permission.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n权限初始化完成！'
                f'\n创建: {created_count} 个'
                f'\n更新: {updated_count} 个'
                f'\n总计: {len(permissions)} 个权限'
            )
        )
