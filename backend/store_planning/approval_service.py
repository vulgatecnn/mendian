"""
开店计划审批流程服务
"""

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
from typing import Dict, List, Optional
import logging

from .models import StorePlan, PlanApproval
from .services import PlanBusinessService

logger = logging.getLogger(__name__)


class PlanApprovalService:
    """计划审批流程服务"""
    
    def __init__(self):
        self.business_service = PlanBusinessService()
        # 延迟导入避免循环依赖
        self._external_service = None
        self._result_processor = None
    
    @transaction.atomic
    def submit_for_approval(self, plan: StorePlan, approval_type: str, 
                           submitted_by, additional_data: Optional[Dict] = None) -> PlanApproval:
        """提交计划审批申请"""
        
        # 验证审批类型
        valid_types = [choice[0] for choice in PlanApproval.APPROVAL_TYPE_CHOICES]
        if approval_type not in valid_types:
            raise ValidationError(f"无效的审批类型: {approval_type}")
        
        # 验证计划状态是否允许提交审批
        self._validate_plan_status_for_approval(plan, approval_type)
        
        # 检查是否已存在相同类型的待审批记录
        existing_approval = PlanApproval.objects.filter(
            plan=plan,
            approval_type=approval_type,
            status='pending'
        ).first()
        
        if existing_approval:
            raise ValidationError(f"该计划已有{existing_approval.get_approval_type_display()}审批申请在处理中")
        
        # 创建审批记录
        approval_data = {
            'plan': plan,
            'approval_type': approval_type,
            'submitted_by': submitted_by,
            'status': 'pending'
        }
        
        # 添加额外数据（如取消原因等）
        if additional_data:
            if 'cancel_reason' in additional_data:
                approval_data['approval_notes'] = f"取消原因: {additional_data['cancel_reason']}"
            if 'modification_reason' in additional_data:
                approval_data['approval_notes'] = f"修改原因: {additional_data['modification_reason']}"
        
        approval = PlanApproval.objects.create(**approval_data)
        
        # 记录审批提交日志
        self.business_service._log_plan_action(
            plan=plan,
            action_type='approval_submitted',
            description=f'提交{approval.get_approval_type_display()}审批申请',
            user=submitted_by
        )
        
        # 发送审批通知（如果配置了通知系统）
        self._send_approval_notification(approval, 'submitted')
        
        # 如果启用了外部审批系统，同时提交到外部系统
        self._submit_to_external_system(approval, additional_data)
        
        logger.info(f"计划 {plan.name} 提交{approval.get_approval_type_display()}审批申请，ID: {approval.id}")
        
        return approval
    
    @transaction.atomic
    def approve_plan(self, approval: PlanApproval, approved_by, 
                    approval_notes: Optional[str] = None) -> PlanApproval:
        """审批通过"""
        
        if approval.status != 'pending':
            raise ValidationError("只有待审批的申请才能进行审批操作")
        
        # 更新审批记录
        approval.status = 'approved'
        approval.approved_by = approved_by
        approval.approved_at = timezone.now()
        if approval_notes:
            approval.approval_notes = approval_notes
        approval.save()
        
        # 执行审批通过后的业务逻辑
        try:
            self._execute_approval_action(approval, approved_by)
        except Exception as e:
            # 如果业务逻辑执行失败，回滚审批状态
            approval.status = 'pending'
            approval.approved_by = None
            approval.approved_at = None
            approval.save()
            raise ValidationError(f"审批通过后执行业务逻辑失败: {str(e)}")
        
        # 记录审批通过日志
        self.business_service._log_plan_action(
            plan=approval.plan,
            action_type='approval_approved',
            description=f'{approval.get_approval_type_display()}审批通过',
            user=approved_by
        )
        
        # 发送审批通知
        self._send_approval_notification(approval, 'approved')
        
        logger.info(f"审批申请 {approval.id} 通过，审批人: {approved_by.username}")
        
        return approval
    
    @transaction.atomic
    def reject_plan(self, approval: PlanApproval, approved_by, 
                   rejection_reason: str) -> PlanApproval:
        """审批拒绝"""
        
        if approval.status != 'pending':
            raise ValidationError("只有待审批的申请才能进行审批操作")
        
        if not rejection_reason.strip():
            raise ValidationError("审批拒绝必须提供拒绝原因")
        
        # 更新审批记录
        approval.status = 'rejected'
        approval.approved_by = approved_by
        approval.approved_at = timezone.now()
        approval.rejection_reason = rejection_reason.strip()
        approval.save()
        
        # 执行审批拒绝后的业务逻辑
        self._execute_rejection_action(approval)
        
        # 记录审批拒绝日志
        self.business_service._log_plan_action(
            plan=approval.plan,
            action_type='approval_rejected',
            description=f'{approval.get_approval_type_display()}审批拒绝: {rejection_reason}',
            user=approved_by
        )
        
        # 发送审批通知
        self._send_approval_notification(approval, 'rejected')
        
        logger.info(f"审批申请 {approval.id} 被拒绝，审批人: {approved_by.username}")
        
        return approval
    
    @transaction.atomic
    def cancel_approval(self, approval: PlanApproval, cancelled_by) -> PlanApproval:
        """取消审批申请"""
        
        if approval.status != 'pending':
            raise ValidationError("只有待审批的申请才能取消")
        
        # 只有提交人或管理员才能取消审批申请
        if approval.submitted_by != cancelled_by and not cancelled_by.is_superuser:
            raise ValidationError("只有申请提交人或管理员才能取消审批申请")
        
        approval.status = 'cancelled'
        approval.save()
        
        # 记录取消日志
        self.business_service._log_plan_action(
            plan=approval.plan,
            action_type='approval_cancelled',
            description=f'{approval.get_approval_type_display()}审批申请被取消',
            user=cancelled_by
        )
        
        # 发送取消通知
        self._send_approval_notification(approval, 'cancelled')
        
        logger.info(f"审批申请 {approval.id} 被取消，操作人: {cancelled_by.username}")
        
        return approval
    
    def get_approval_status(self, plan: StorePlan, approval_type: Optional[str] = None) -> Dict:
        """获取计划的审批状态"""
        
        query = PlanApproval.objects.filter(plan=plan)
        if approval_type:
            query = query.filter(approval_type=approval_type)
        
        approvals = query.select_related('submitted_by', 'approved_by').order_by('-submitted_at')
        
        status_data = {
            'plan_id': plan.id,
            'plan_name': plan.name,
            'current_status': plan.status,
            'approvals': []
        }
        
        for approval in approvals:
            approval_info = {
                'id': approval.id,
                'approval_type': approval.approval_type,
                'approval_type_display': approval.get_approval_type_display(),
                'status': approval.status,
                'status_display': approval.get_status_display(),
                'submitted_by': approval.submitted_by.username if approval.submitted_by else None,
                'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                'approved_by': approval.approved_by.username if approval.approved_by else None,
                'approved_at': approval.approved_at.strftime('%Y-%m-%d %H:%M:%S') if approval.approved_at else None,
                'approval_notes': approval.approval_notes,
                'rejection_reason': approval.rejection_reason
            }
            status_data['approvals'].append(approval_info)
        
        return status_data
    
    def get_pending_approvals(self, user=None, approval_type: Optional[str] = None) -> List[Dict]:
        """获取待审批列表"""
        
        query = PlanApproval.objects.filter(status='pending')
        
        if approval_type:
            query = query.filter(approval_type=approval_type)
        
        # 如果指定了用户，可以根据权限过滤（这里简化处理）
        if user and not user.is_superuser:
            # 可以根据实际业务需求添加权限过滤逻辑
            pass
        
        approvals = query.select_related(
            'plan', 'submitted_by'
        ).order_by('-submitted_at')
        
        pending_list = []
        for approval in approvals:
            approval_info = {
                'id': approval.id,
                'plan_id': approval.plan.id,
                'plan_name': approval.plan.name,
                'plan_status': approval.plan.status,
                'approval_type': approval.approval_type,
                'approval_type_display': approval.get_approval_type_display(),
                'submitted_by': approval.submitted_by.username if approval.submitted_by else None,
                'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                'approval_notes': approval.approval_notes,
                'days_pending': (timezone.now() - approval.submitted_at).days,
                'is_urgent': (timezone.now() - approval.submitted_at).days > 3  # 超过3天算紧急
            }
            pending_list.append(approval_info)
        
        return pending_list
    
    def get_my_approvals(self, user, status: Optional[str] = None) -> List[Dict]:
        """获取我提交的审批申请"""
        
        query = PlanApproval.objects.filter(submitted_by=user)
        
        if status:
            query = query.filter(status=status)
        
        approvals = query.select_related(
            'plan', 'approved_by'
        ).order_by('-submitted_at')
        
        my_approvals = []
        for approval in approvals:
            approval_info = {
                'id': approval.id,
                'plan_id': approval.plan.id,
                'plan_name': approval.plan.name,
                'plan_status': approval.plan.status,
                'approval_type': approval.approval_type,
                'approval_type_display': approval.get_approval_type_display(),
                'status': approval.status,
                'status_display': approval.get_status_display(),
                'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                'approved_by': approval.approved_by.username if approval.approved_by else None,
                'approved_at': approval.approved_at.strftime('%Y-%m-%d %H:%M:%S') if approval.approved_at else None,
                'approval_notes': approval.approval_notes,
                'rejection_reason': approval.rejection_reason,
                'days_pending': (timezone.now() - approval.submitted_at).days if approval.status == 'pending' else None
            }
            my_approvals.append(approval_info)
        
        return my_approvals
    
    def check_approval_timeout(self) -> List[Dict]:
        """检查审批超时"""
        
        # 获取超过指定天数的待审批记录
        timeout_days = getattr(settings, 'PLAN_APPROVAL_TIMEOUT_DAYS', 7)
        timeout_date = timezone.now() - timezone.timedelta(days=timeout_days)
        
        timeout_approvals = PlanApproval.objects.filter(
            status='pending',
            submitted_at__lt=timeout_date
        ).select_related('plan', 'submitted_by')
        
        timeout_list = []
        for approval in timeout_approvals:
            timeout_info = {
                'id': approval.id,
                'plan_id': approval.plan.id,
                'plan_name': approval.plan.name,
                'approval_type': approval.approval_type,
                'approval_type_display': approval.get_approval_type_display(),
                'submitted_by': approval.submitted_by.username if approval.submitted_by else None,
                'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                'days_overdue': (timezone.now() - approval.submitted_at).days - timeout_days
            }
            timeout_list.append(timeout_info)
        
        return timeout_list
    
    def _validate_plan_status_for_approval(self, plan: StorePlan, approval_type: str) -> None:
        """验证计划状态是否允许提交审批"""
        
        # 定义各种审批类型允许的计划状态
        allowed_statuses = {
            'plan_publish': ['draft'],
            'plan_cancel': ['published', 'executing'],
            'plan_modify': ['draft', 'published']
        }
        
        if approval_type in allowed_statuses:
            if plan.status not in allowed_statuses[approval_type]:
                raise ValidationError(
                    f"计划状态为'{plan.get_status_display()}'时不能提交{dict(PlanApproval.APPROVAL_TYPE_CHOICES)[approval_type]}审批"
                )
    
    def _execute_approval_action(self, approval: PlanApproval, approved_by) -> None:
        """执行审批通过后的业务逻辑"""
        
        plan = approval.plan
        
        if approval.approval_type == 'plan_publish':
            # 发布计划
            self.business_service.publish_plan(plan, approved_by)
            
        elif approval.approval_type == 'plan_cancel':
            # 取消计划
            cancel_reason = approval.approval_notes or '审批通过取消'
            self.business_service.cancel_plan(plan, cancel_reason, approved_by)
            
        elif approval.approval_type == 'plan_modify':
            # 计划修改审批通过，允许继续修改
            # 这里可以根据实际需求添加相应的业务逻辑
            pass
    
    def _execute_rejection_action(self, approval: PlanApproval) -> None:
        """执行审批拒绝后的业务逻辑"""
        
        plan = approval.plan
        
        if approval.approval_type == 'plan_publish':
            # 发布审批被拒绝，计划保持草稿状态
            pass
            
        elif approval.approval_type == 'plan_cancel':
            # 取消审批被拒绝，计划保持原状态
            pass
            
        elif approval.approval_type == 'plan_modify':
            # 修改审批被拒绝，可能需要锁定计划编辑
            pass
    
    def _send_approval_notification(self, approval: PlanApproval, action: str) -> None:
        """发送审批通知"""
        
        try:
            # 使用异步任务发送通知，避免阻塞主要业务流程
            from .notification_service import send_approval_notification_async
            
            # 异步发送通知
            send_approval_notification_async.delay(approval.id, action)
            
            logger.info(f"审批通知任务已提交: 审批ID={approval.id}, 动作={action}")
            
        except Exception as e:
            logger.error(f"提交审批通知任务失败: {str(e)}")
            
            # 如果异步任务失败，尝试同步发送
            try:
                from .notification_service import ApprovalNotificationService
                
                notification_service = ApprovalNotificationService()
                
                if action == 'submitted':
                    result = notification_service.send_approval_submitted_notification(approval)
                elif action == 'approved':
                    result = notification_service.send_approval_approved_notification(approval)
                elif action == 'rejected':
                    result = notification_service.send_approval_rejected_notification(approval)
                elif action == 'cancelled':
                    result = notification_service.send_approval_cancelled_notification(approval)
                
                if result['success']:
                    logger.info(f"同步审批通知发送成功: {approval.id}")
                else:
                    logger.warning(f"同步审批通知发送失败: {approval.id} - {result}")
                    
            except Exception as sync_e:
                logger.error(f"同步发送审批通知也失败: {str(sync_e)}")
                # 通知失败不应该影响主要业务流程
                pass
    
    def get_approval_statistics(self, start_date=None, end_date=None) -> Dict:
        """获取审批统计数据"""
        
        query = PlanApproval.objects.all()
        
        if start_date:
            query = query.filter(submitted_at__date__gte=start_date)
        if end_date:
            query = query.filter(submitted_at__date__lte=end_date)
        
        # 按状态统计
        status_stats = {}
        for status, _ in PlanApproval.STATUS_CHOICES:
            status_stats[status] = query.filter(status=status).count()
        
        # 按类型统计
        type_stats = {}
        for approval_type, _ in PlanApproval.APPROVAL_TYPE_CHOICES:
            type_stats[approval_type] = query.filter(approval_type=approval_type).count()
        
        # 平均审批时长（已完成的审批）
        completed_approvals = query.filter(
            status__in=['approved', 'rejected'],
            approved_at__isnull=False
        )
        
        avg_approval_time = None
        if completed_approvals.exists():
            total_time = sum(
                (approval.approved_at - approval.submitted_at).total_seconds()
                for approval in completed_approvals
            )
            avg_approval_time = total_time / completed_approvals.count() / 3600  # 转换为小时
        
        return {
            'total_approvals': query.count(),
            'status_statistics': status_stats,
            'type_statistics': type_stats,
            'average_approval_time_hours': round(avg_approval_time, 2) if avg_approval_time else None,
            'pending_count': status_stats.get('pending', 0),
            'approved_count': status_stats.get('approved', 0),
            'rejected_count': status_stats.get('rejected', 0),
            'approval_rate': round(
                (status_stats.get('approved', 0) / max(1, status_stats.get('approved', 0) + status_stats.get('rejected', 0))) * 100, 2
            )
        }
    
    @property
    def external_service(self):
        """延迟加载外部审批服务"""
        if self._external_service is None:
            from .external_approval_service import ExternalApprovalService
            self._external_service = ExternalApprovalService()
        return self._external_service
    
    @property
    def result_processor(self):
        """延迟加载结果处理器"""
        if self._result_processor is None:
            from .external_approval_service import ApprovalResultProcessor
            self._result_processor = ApprovalResultProcessor()
        return self._result_processor
    
    def _submit_to_external_system(self, approval: PlanApproval, additional_data: Optional[Dict] = None) -> None:
        """提交审批申请到外部系统"""
        
        if not self.external_service.is_enabled():
            logger.info("外部审批系统未启用，跳过外部提交")
            return
        
        try:
            # 构建外部系统需要的数据
            plan = approval.plan
            approval_data = {
                'title': f"{approval.get_approval_type_display()} - {plan.name}",
                'description': f"申请{approval.get_approval_type_display()}：{plan.name}",
                'approval_type': approval.approval_type,
                'priority': 'normal',
                'requester_id': str(approval.submitted_by.id) if approval.submitted_by else '',
                'requester_name': approval.submitted_by.get_full_name() if approval.submitted_by else '',
                'requester_email': approval.submitted_by.email if approval.submitted_by else '',
                'plan_id': str(plan.id),
                'plan_name': plan.name,
                'plan_type': plan.plan_type,
                'plan_status': plan.status,
                'target_count': plan.total_target_count,
                'budget_amount': float(plan.total_budget_amount),
                'start_date': plan.start_date.strftime('%Y-%m-%d'),
                'end_date': plan.end_date.strftime('%Y-%m-%d')
            }
            
            # 添加额外数据
            if additional_data:
                if 'cancel_reason' in additional_data:
                    approval_data['cancel_reason'] = additional_data['cancel_reason']
                if 'modification_reason' in additional_data:
                    approval_data['modification_reason'] = additional_data['modification_reason']
            
            # 提交到外部系统
            result = self.external_service.submit_approval_request(approval_data)
            
            if result['success']:
                # 保存外部审批ID
                approval.approval_notes = f"外部审批ID: {result['external_approval_id']}"
                approval.save(update_fields=['approval_notes'])
                
                logger.info(f"成功提交审批申请到外部系统，外部ID: {result['external_approval_id']}")
            else:
                logger.warning(f"提交审批申请到外部系统失败: {result['message']}")
                
        except Exception as e:
            logger.error(f"提交审批申请到外部系统时发生错误: {str(e)}")
    
    def sync_external_approval_results(self, approval_ids: Optional[List[int]] = None) -> Dict:
        """同步外部审批结果"""
        
        if not self.external_service.is_enabled():
            return {
                'success': False,
                'message': '外部审批系统未启用',
                'synced_count': 0,
                'results': []
            }
        
        # 获取需要同步的审批记录
        query = PlanApproval.objects.filter(status='pending')
        
        if approval_ids:
            query = query.filter(id__in=approval_ids)
        
        # 只同步有外部审批ID的记录
        approvals = query.filter(approval_notes__contains='外部审批ID:')
        
        results = []
        synced_count = 0
        
        for approval in approvals:
            try:
                # 从备注中提取外部审批ID
                external_id = self._extract_external_approval_id(approval.approval_notes)
                
                if not external_id:
                    continue
                
                # 获取外部审批状态
                status_result = self.external_service.get_approval_status(external_id)
                
                if status_result['success']:
                    # 处理审批结果
                    if status_result['status'] in ['approved', 'rejected']:
                        process_result = self.result_processor.process_approval_result(
                            approval, status_result
                        )
                        
                        results.append({
                            'approval_id': approval.id,
                            'external_approval_id': external_id,
                            'status': status_result['status'],
                            'processed': process_result['success'],
                            'message': process_result['message']
                        })
                        
                        if process_result['success']:
                            synced_count += 1
                    else:
                        results.append({
                            'approval_id': approval.id,
                            'external_approval_id': external_id,
                            'status': status_result['status'],
                            'processed': False,
                            'message': '审批仍在处理中'
                        })
                else:
                    results.append({
                        'approval_id': approval.id,
                        'external_approval_id': external_id,
                        'status': 'unknown',
                        'processed': False,
                        'message': status_result['message']
                    })
                    
            except Exception as e:
                results.append({
                    'approval_id': approval.id,
                    'external_approval_id': external_id if 'external_id' in locals() else 'unknown',
                    'status': 'error',
                    'processed': False,
                    'message': str(e)
                })
        
        return {
            'success': True,
            'message': f'同步完成，处理了{synced_count}个审批结果',
            'synced_count': synced_count,
            'total_checked': len(results),
            'results': results
        }
    
    def _extract_external_approval_id(self, approval_notes: str) -> Optional[str]:
        """从审批备注中提取外部审批ID"""
        
        if not approval_notes:
            return None
        
        import re
        match = re.search(r'外部审批ID:\s*([^\s,]+)', approval_notes)
        return match.group(1) if match else None
    
    def handle_external_approval_callback(self, external_approval_id: str, callback_data: Dict) -> Dict:
        """处理外部审批系统的回调"""
        
        try:
            # 根据外部审批ID查找对应的审批记录
            approval = PlanApproval.objects.filter(
                approval_notes__contains=f'外部审批ID: {external_approval_id}',
                status='pending'
            ).first()
            
            if not approval:
                return {
                    'success': False,
                    'message': f'未找到外部审批ID为{external_approval_id}的待审批记录'
                }
            
            # 处理回调数据
            status = callback_data.get('status', '').lower()
            
            if status == 'approved':
                # 审批通过
                updated_approval = self.approve_plan(
                    approval=approval,
                    approved_by=None,  # 外部审批，审批人为None
                    approval_notes=callback_data.get('approval_notes', '外部审批系统通过')
                )
                
                return {
                    'success': True,
                    'message': '外部审批通过处理成功',
                    'approval_id': approval.id,
                    'plan_status': approval.plan.status
                }
                
            elif status == 'rejected':
                # 审批拒绝
                updated_approval = self.reject_plan(
                    approval=approval,
                    approved_by=None,  # 外部审批，审批人为None
                    rejection_reason=callback_data.get('rejection_reason', '外部审批系统拒绝')
                )
                
                return {
                    'success': True,
                    'message': '外部审批拒绝处理成功',
                    'approval_id': approval.id,
                    'plan_status': approval.plan.status
                }
                
            else:
                return {
                    'success': False,
                    'message': f'未知的外部审批状态: {status}'
                }
                
        except Exception as e:
            logger.error(f"处理外部审批回调时发生错误: {str(e)}")
            return {
                'success': False,
                'message': f'处理外部审批回调失败: {str(e)}'
            }
    
    def get_external_system_status(self) -> Dict:
        """获取外部审批系统状态"""
        
        if not self.external_service.is_enabled():
            return {
                'enabled': False,
                'connected': False,
                'message': '外部审批系统未启用'
            }
        
        # 测试连接
        connection_result = self.external_service.test_connection()
        
        # 获取系统信息
        system_info = self.external_service.get_system_info()
        
        return {
            'enabled': True,
            'connected': connection_result['success'],
            'connection_message': connection_result['message'],
            'system_info': system_info,
            'last_check': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }