"""
检查审批超时的管理命令
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '检查审批超时并发送通知'

    def add_arguments(self, parser):
        parser.add_argument(
            '--timeout-days',
            type=int,
            default=7,
            help='审批超时天数（默认7天）'
        )
        
        parser.add_argument(
            '--send-notification',
            action='store_true',
            help='发送超时通知'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='仅检查不发送通知'
        )

    def handle(self, *args, **options):
        timeout_days = options['timeout_days']
        send_notification = options['send_notification']
        dry_run = options['dry_run']
        
        self.stdout.write(
            self.style.SUCCESS(f'开始检查审批超时（超时天数：{timeout_days}天）')
        )
        
        try:
            from store_planning.models import PlanApproval
            from store_planning.notification_service import ApprovalNotificationService
            
            # 计算超时时间
            timeout_date = timezone.now() - timedelta(days=timeout_days)
            
            # 查找超时的审批
            timeout_approvals = PlanApproval.objects.filter(
                status='pending',
                submitted_at__lt=timeout_date
            ).select_related('plan', 'submitted_by')
            
            timeout_count = timeout_approvals.count()
            
            if timeout_count == 0:
                self.stdout.write(
                    self.style.SUCCESS('没有发现超时的审批申请')
                )
                return
            
            self.stdout.write(
                self.style.WARNING(f'发现 {timeout_count} 个超时的审批申请：')
            )
            
            # 显示超时审批详情
            for approval in timeout_approvals:
                days_overdue = (timezone.now() - approval.submitted_at).days
                
                self.stdout.write(
                    f'  - 审批ID: {approval.id}, '
                    f'计划: {approval.plan.name}, '
                    f'类型: {approval.get_approval_type_display()}, '
                    f'提交人: {approval.submitted_by.get_full_name() if approval.submitted_by else "未知"}, '
                    f'超时天数: {days_overdue}天'
                )
            
            # 发送通知
            if send_notification and not dry_run:
                self.stdout.write(
                    self.style.SUCCESS('开始发送超时通知...')
                )
                
                notification_service = ApprovalNotificationService()
                success_count = 0
                error_count = 0
                
                for approval in timeout_approvals:
                    try:
                        result = notification_service.send_approval_timeout_notification(approval)
                        
                        if result['success']:
                            success_count += 1
                            self.stdout.write(
                                f'  ✓ 审批ID {approval.id} 通知发送成功'
                            )
                        else:
                            error_count += 1
                            self.stdout.write(
                                self.style.ERROR(
                                    f'  ✗ 审批ID {approval.id} 通知发送失败: {result.get("message", "未知错误")}'
                                )
                            )
                            
                    except Exception as e:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f'  ✗ 审批ID {approval.id} 通知发送异常: {str(e)}'
                            )
                        )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'通知发送完成：成功 {success_count} 个，失败 {error_count} 个'
                    )
                )
                
            elif dry_run:
                self.stdout.write(
                    self.style.WARNING('这是试运行模式，不会发送实际通知')
                )
                
            else:
                self.stdout.write(
                    self.style.WARNING('使用 --send-notification 参数来发送通知')
                )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'检查审批超时时发生错误: {str(e)}')
            )
            logger.error(f'检查审批超时命令执行失败: {str(e)}')
            raise
        
        self.stdout.write(
            self.style.SUCCESS('审批超时检查完成')
        )