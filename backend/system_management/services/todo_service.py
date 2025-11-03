"""
待办事项聚合服务
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count
from typing import List, Dict, Any

from approval.models import ApprovalInstance, ApprovalNodeApprover
from store_expansion.models import FollowUpRecord
from store_preparation.models import Milestone


class TodoService:
    """待办事项服务"""
    
    @staticmethod
    def get_user_todos(user) -> List[Dict[str, Any]]:
        """
        获取用户待办事项
        
        Args:
            user: 用户对象
            
        Returns:
            List[Dict]: 待办事项列表
        """
        todos = []
        
        # 1. 待审批事项统计
        pending_approvals_count = TodoService._get_pending_approvals_count(user)
        if pending_approvals_count > 0:
            todos.append({
                'type': 'approval',
                'title': '待审批',
                'count': pending_approvals_count,
                'link': '/approval/my-pending/',
                'description': f'您有 {pending_approvals_count} 个待审批事项需要处理',
                'priority': 'high'
            })
        
        # 2. 合同提醒统计
        contract_reminders = TodoService._get_upcoming_contract_reminders(user)
        if contract_reminders:
            todos.append({
                'type': 'contract_reminder',
                'title': '合同提醒',
                'count': len(contract_reminders),
                'link': '/expansion/follow-ups/',
                'description': f'您有 {len(contract_reminders)} 个合同即将到期',
                'priority': 'medium',
                'details': contract_reminders
            })
        
        # 3. 工程里程碑提醒统计
        milestone_reminders = TodoService._get_upcoming_milestones(user)
        if milestone_reminders:
            todos.append({
                'type': 'milestone_reminder',
                'title': '工程里程碑',
                'count': len(milestone_reminders),
                'link': '/preparation/construction/',
                'description': f'您有 {len(milestone_reminders)} 个工程里程碑即将到期',
                'priority': 'medium',
                'details': milestone_reminders
            })
        
        return todos
    
    @staticmethod
    def _get_pending_approvals_count(user) -> int:
        """
        获取待审批事项数量
        
        Args:
            user: 用户对象
            
        Returns:
            int: 待审批数量
        """
        try:
            # 查询用户作为审批人的待处理审批节点
            pending_count = ApprovalNodeApprover.objects.filter(
                user=user,
                is_processed=False,
                node__status='in_progress',
                node__instance__status__in=['pending', 'in_progress']
            ).count()
            
            return pending_count
        except Exception as e:
            # 记录错误日志但不影响其他待办事项的获取
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"获取待审批事项数量失败: {e}")
            return 0
    
    @staticmethod
    def _get_upcoming_contract_reminders(user) -> List[Dict[str, Any]]:
        """
        获取即将到期的合同提醒
        
        Args:
            user: 用户对象
            
        Returns:
            List[Dict]: 合同提醒列表
        """
        try:
            # 获取未来7天内的合同提醒
            today = timezone.now().date()
            end_date = today + timedelta(days=7)
            
            # 查询用户创建的或负责的跟进单中的合同提醒
            follow_ups = FollowUpRecord.objects.filter(
                Q(created_by=user) | Q(location__business_region__manager=user),
                status__in=['signed'],  # 已签约状态
                contract_reminders__isnull=False
            ).exclude(contract_reminders=[])
            
            reminders = []
            for follow_up in follow_ups:
                if follow_up.contract_reminders:
                    for reminder in follow_up.contract_reminders:
                        reminder_date_str = reminder.get('reminder_date')
                        if reminder_date_str:
                            try:
                                reminder_date = datetime.strptime(reminder_date_str, '%Y-%m-%d').date()
                                if today <= reminder_date <= end_date:
                                    reminders.append({
                                        'follow_up_id': follow_up.id,
                                        'follow_up_no': follow_up.record_no,
                                        'store_name': follow_up.location.name,
                                        'reminder_type': reminder.get('type', '合同提醒'),
                                        'reminder_date': reminder_date_str,
                                        'description': reminder.get('description', ''),
                                        'days_left': (reminder_date - today).days
                                    })
                            except ValueError:
                                # 日期格式错误，跳过
                                continue
            
            # 按提醒日期排序
            reminders.sort(key=lambda x: x['reminder_date'])
            return reminders
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"获取合同提醒失败: {e}")
            return []
    
    @staticmethod
    def _get_upcoming_milestones(user) -> List[Dict[str, Any]]:
        """
        获取即将到期的工程里程碑
        
        Args:
            user: 用户对象
            
        Returns:
            List[Dict]: 里程碑提醒列表
        """
        try:
            # 获取未来7天内的里程碑
            today = timezone.now().date()
            end_date = today + timedelta(days=7)
            
            # 查询用户创建的或负责区域的工程里程碑
            milestones = Milestone.objects.filter(
                Q(construction_order__created_by=user) | 
                Q(construction_order__follow_up_record__location__business_region__manager=user),
                status__in=['pending', 'in_progress'],  # 待开始或进行中
                planned_date__range=[today, end_date]
            ).select_related(
                'construction_order',
                'construction_order__follow_up_record',
                'construction_order__follow_up_record__location'
            )
            
            reminders = []
            for milestone in milestones:
                days_left = (milestone.planned_date - today).days
                reminders.append({
                    'milestone_id': milestone.id,
                    'construction_order_id': milestone.construction_order.id,
                    'order_no': milestone.construction_order.order_no,
                    'store_name': milestone.construction_order.store_name,
                    'milestone_name': milestone.name,
                    'planned_date': milestone.planned_date.strftime('%Y-%m-%d'),
                    'status': milestone.get_status_display(),
                    'days_left': days_left,
                    'is_overdue': days_left < 0
                })
            
            # 按计划日期排序
            reminders.sort(key=lambda x: x['planned_date'])
            return reminders
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"获取工程里程碑提醒失败: {e}")
            return []
    
    @staticmethod
    def get_todo_summary(user) -> Dict[str, Any]:
        """
        获取待办事项汇总信息
        
        Args:
            user: 用户对象
            
        Returns:
            Dict: 汇总信息
        """
        todos = TodoService.get_user_todos(user)
        
        total_count = sum(todo['count'] for todo in todos)
        high_priority_count = sum(
            todo['count'] for todo in todos 
            if todo.get('priority') == 'high'
        )
        
        return {
            'total_count': total_count,
            'high_priority_count': high_priority_count,
            'todos': todos,
            'last_updated': timezone.now().isoformat()
        }
    
    @staticmethod
    def mark_reminder_as_read(user, reminder_type: str, reminder_id: int) -> bool:
        """
        标记提醒为已读（可选功能）
        
        Args:
            user: 用户对象
            reminder_type: 提醒类型
            reminder_id: 提醒ID
            
        Returns:
            bool: 是否成功
        """
        try:
            if reminder_type == 'milestone':
                # 标记里程碑提醒为已发送
                milestone = Milestone.objects.get(id=reminder_id)
                if (milestone.construction_order.created_by == user or 
                    milestone.construction_order.follow_up_record.location.business_region.manager == user):
                    milestone.reminder_sent = True
                    milestone.save()
                    return True
            
            return False
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"标记提醒为已读失败: {e}")
            return False