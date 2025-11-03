"""
审批流程引擎服务
"""
import uuid
from datetime import datetime
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

from ..models import (
    ApprovalTemplate, ApprovalInstance, ApprovalNode, 
    ApprovalNodeApprover, ApprovalNodeCC
)
from system_management.models import User, Department, Role


class ApprovalFlowEngine:
    """审批流程引擎"""
    
    def __init__(self):
        """初始化流程引擎"""
        pass
    
    @transaction.atomic
    def initiate_approval(self, template, form_data, initiator, business_type, business_id, title=None):
        """
        发起审批
        
        Args:
            template: 审批模板实例
            form_data: 表单数据
            initiator: 发起人
            business_type: 业务类型
            business_id: 业务ID
            title: 审批标题（可选，不提供则自动生成）
            
        Returns:
            ApprovalInstance: 审批实例
        """
        # 验证模板是否启用
        if template.status != 'active':
            raise ValidationError('审批模板已停用，无法发起审批')
        
        # 生成审批单号
        instance_no = self._generate_instance_no(template.template_code)
        
        # 生成审批标题
        if not title:
            title = self._generate_title(template, form_data, initiator)
        
        # 创建审批实例
        instance = ApprovalInstance.objects.create(
            instance_no=instance_no,
            template=template,
            title=title,
            form_data=form_data,
            business_type=business_type,
            business_id=business_id,
            status='pending',
            initiator=initiator
        )
        
        # 根据流程配置创建审批节点
        self._create_approval_nodes(instance, template.flow_config)
        
        # 启动第一个节点
        self._start_first_node(instance)
        
        return instance
    
    def _generate_instance_no(self, template_code):
        """生成审批单号"""
        today = timezone.now().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"{template_code}_{today}_{unique_id}"
    
    def _generate_title(self, template, form_data, initiator):
        """生成审批标题"""
        # 基础标题格式：模板名称 - 发起人 - 日期
        date_str = timezone.now().strftime('%Y-%m-%d')
        title = f"{template.template_name} - {initiator.get_full_name() or initiator.username} - {date_str}"
        
        # 如果表单数据中有特定字段，可以添加到标题中
        if 'store_name' in form_data:
            title = f"{form_data['store_name']} - {title}"
        elif 'subject' in form_data:
            title = f"{form_data['subject']} - {title}"
        
        return title
    
    def _create_approval_nodes(self, instance, flow_config):
        """根据流程配置创建审批节点"""
        nodes = flow_config.get('nodes', [])
        
        for idx, node_config in enumerate(nodes):
            # 创建审批节点
            node = ApprovalNode.objects.create(
                instance=instance,
                node_name=node_config['name'],
                node_type=node_config.get('type', 'approval'),
                sequence=idx + 1,
                approver_config=node_config,
                status='pending'
            )
            
            # 解析并设置审批人
            approvers = self._resolve_approvers(node_config.get('approvers', {}), instance)
            for approver in approvers:
                ApprovalNodeApprover.objects.create(node=node, user=approver)
            
            # 解析并设置抄送人
            cc_users = self._resolve_approvers(node_config.get('cc_users', {}), instance)
            for cc_user in cc_users:
                ApprovalNodeCC.objects.create(node=node, user=cc_user)
    
    def _resolve_approvers(self, approver_config, instance):
        """
        解析审批人配置
        
        支持的配置类型：
        - fixed_users: 固定人员
        - role: 角色
        - department_manager: 部门负责人
        - initiator_manager: 发起人的上级
        - department_users: 部门所有用户
        """
        if not approver_config:
            return []
        
        approvers = []
        config_type = approver_config.get('type')
        
        if config_type == 'fixed_users':
            # 固定人员
            user_ids = approver_config.get('user_ids', [])
            approvers = list(User.objects.filter(id__in=user_ids, is_active=True))
        
        elif config_type == 'role':
            # 角色
            role_codes = approver_config.get('role_codes', [])
            if role_codes:
                approvers = list(User.objects.filter(
                    roles__code__in=role_codes, 
                    is_active=True
                ).distinct())
        
        elif config_type == 'department_manager':
            # 部门负责人
            dept_ids = approver_config.get('department_ids', [])
            if dept_ids:
                departments = Department.objects.filter(id__in=dept_ids)
                for dept in departments:
                    # 假设部门模型有manager字段，如果没有则需要通过其他方式获取负责人
                    if hasattr(dept, 'manager') and dept.manager:
                        approvers.append(dept.manager)
        
        elif config_type == 'initiator_manager':
            # 发起人的直接上级
            if hasattr(instance.initiator, 'manager') and instance.initiator.manager:
                approvers.append(instance.initiator.manager)
        
        elif config_type == 'department_users':
            # 部门所有用户
            dept_ids = approver_config.get('department_ids', [])
            if dept_ids:
                approvers = list(User.objects.filter(
                    department_id__in=dept_ids, 
                    is_active=True
                ))
        
        elif config_type == 'initiator_department_manager':
            # 发起人所在部门的负责人
            if instance.initiator.department:
                dept = instance.initiator.department
                if hasattr(dept, 'manager') and dept.manager:
                    approvers.append(dept.manager)
        
        return approvers
    
    def _start_first_node(self, instance):
        """启动第一个审批节点"""
        first_node = instance.nodes.first()
        if first_node:
            first_node.status = 'in_progress'
            first_node.save()
            
            instance.current_node = first_node
            instance.status = 'in_progress'
            instance.save()
            
            # 发送通知给审批人
            self._notify_approvers(first_node)
    
    def _notify_approvers(self, node):
        """发送通知给审批人"""
        # 这里应该集成消息通知服务
        # 暂时只记录日志
        approvers = [approver.user for approver in node.approvers.all()]
        print(f"通知审批人处理审批：{node.instance.title}，审批人：{[u.username for u in approvers]}")
        
        # TODO: 集成消息通知服务
        # from notification.services import NotificationService
        # NotificationService.send_approval_notification(node, approvers)
    
    @transaction.atomic
    def approve(self, node, approver, comment=None):
        """
        审批通过
        
        Args:
            node: 审批节点
            approver: 审批人
            comment: 审批意见
        """
        # 验证审批人权限
        if not node.approvers.filter(user=approver).exists():
            raise ValidationError('您没有权限处理此审批节点')
        
        # 验证节点状态
        if node.status != 'in_progress':
            raise ValidationError('此审批节点不在处理状态')
        
        # 更新节点状态
        node.status = 'approved'
        node.approval_result = 'approved'
        node.approval_comment = comment
        node.approved_by = approver
        node.approved_at = timezone.now()
        node.save()
        
        # 标记审批人已处理
        approver_record = node.approvers.get(user=approver)
        approver_record.is_processed = True
        approver_record.processed_at = timezone.now()
        approver_record.save()
        
        # 流转到下一个节点
        self._flow_to_next_node(node.instance)
    
    @transaction.atomic
    def reject(self, node, approver, reason):
        """
        审批拒绝
        
        Args:
            node: 审批节点
            approver: 审批人
            reason: 拒绝原因
        """
        # 验证审批人权限
        if not node.approvers.filter(user=approver).exists():
            raise ValidationError('您没有权限处理此审批节点')
        
        # 验证节点状态
        if node.status != 'in_progress':
            raise ValidationError('此审批节点不在处理状态')
        
        # 更新节点状态
        node.status = 'rejected'
        node.approval_result = 'rejected'
        node.approval_comment = reason
        node.approved_by = approver
        node.approved_at = timezone.now()
        node.save()
        
        # 标记审批人已处理
        approver_record = node.approvers.get(user=approver)
        approver_record.is_processed = True
        approver_record.processed_at = timezone.now()
        approver_record.save()
        
        # 整个审批流程被拒绝
        instance = node.instance
        instance.status = 'rejected'
        instance.final_result = 'rejected'
        instance.completed_at = timezone.now()
        instance.current_node = None
        instance.save()
        
        # 通知发起人审批被拒绝
        self._notify_rejection(instance, approver, reason)
    
    @transaction.atomic
    def transfer(self, node, current_approver, target_user, comment=None):
        """
        转交审批
        
        Args:
            node: 审批节点
            current_approver: 当前审批人
            target_user: 目标用户
            comment: 转交说明
        """
        # 验证当前审批人权限
        if not node.approvers.filter(user=current_approver).exists():
            raise ValidationError('您没有权限处理此审批节点')
        
        # 验证节点状态
        if node.status != 'in_progress':
            raise ValidationError('此审批节点不在处理状态')
        
        # 验证目标用户
        if not target_user.is_active:
            raise ValidationError('目标用户已停用，无法转交')
        
        # 移除当前审批人
        node.approvers.filter(user=current_approver).delete()
        
        # 添加新的审批人
        ApprovalNodeApprover.objects.create(node=node, user=target_user)
        
        # 记录转交操作
        node.approval_comment = f"转交给 {target_user.real_name or target_user.username}：{comment or '无'}"
        node.save()
        
        # 通知新的审批人
        self._notify_approvers(node)
    
    @transaction.atomic
    def add_sign(self, node, current_approver, additional_users, comment=None):
        """
        加签审批
        
        Args:
            node: 审批节点
            current_approver: 当前审批人
            additional_users: 加签用户列表
            comment: 加签说明
        """
        # 验证当前审批人权限
        if not node.approvers.filter(user=current_approver).exists():
            raise ValidationError('您没有权限处理此审批节点')
        
        # 验证节点状态
        if node.status != 'in_progress':
            raise ValidationError('此审批节点不在处理状态')
        
        # 添加加签用户
        for user in additional_users:
            if user.is_active:
                ApprovalNodeApprover.objects.get_or_create(node=node, user=user)
        
        # 记录加签操作
        user_names = [u.real_name or u.username for u in additional_users]
        node.approval_comment = f"加签给 {', '.join(user_names)}：{comment or '无'}"
        node.save()
        
        # 通知加签用户
        self._notify_approvers(node)
    
    @transaction.atomic
    def withdraw(self, instance, initiator):
        """
        撤销审批
        
        Args:
            instance: 审批实例
            initiator: 发起人
        """
        # 验证发起人权限
        if instance.initiator != initiator:
            raise ValidationError('只有发起人可以撤销审批')
        
        # 验证审批状态
        if instance.status not in ['pending', 'in_progress']:
            raise ValidationError('只有待审批或审批中的单据可以撤销')
        
        # 更新审批状态
        instance.status = 'withdrawn'
        instance.final_result = 'withdrawn'
        instance.completed_at = timezone.now()
        instance.current_node = None
        instance.save()
        
        # 更新所有未完成节点的状态
        instance.nodes.filter(status__in=['pending', 'in_progress']).update(status='skipped')
    
    def _flow_to_next_node(self, instance):
        """流转到下一个节点"""
        current_node = instance.current_node
        if not current_node:
            return
        
        # 获取下一个节点
        next_node = instance.nodes.filter(sequence__gt=current_node.sequence).first()
        
        if next_node:
            # 启动下一个节点
            next_node.status = 'in_progress'
            next_node.save()
            
            instance.current_node = next_node
            instance.save()
            
            # 通知下一个节点的审批人
            self._notify_approvers(next_node)
        else:
            # 所有节点都已完成，审批通过
            instance.status = 'approved'
            instance.final_result = 'approved'
            instance.completed_at = timezone.now()
            instance.current_node = None
            instance.save()
            
            # 通知发起人审批通过
            self._notify_approval_completed(instance)
    
    def _notify_rejection(self, instance, approver, reason):
        """通知审批被拒绝"""
        print(f"审批被拒绝：{instance.title}，拒绝人：{approver.username}，原因：{reason}")
        # TODO: 集成消息通知服务
    
    def _notify_approval_completed(self, instance):
        """通知审批完成"""
        print(f"审批已完成：{instance.title}")
        # TODO: 集成消息通知服务
    
    def get_user_pending_approvals(self, user):
        """获取用户待处理的审批"""
        return ApprovalInstance.objects.filter(
            current_node__approvers__user=user,
            current_node__approvers__is_processed=False,
            status='in_progress'
        ).distinct()
    
    def get_user_processed_approvals(self, user):
        """获取用户已处理的审批"""
        return ApprovalInstance.objects.filter(
            nodes__approvers__user=user,
            nodes__approvers__is_processed=True
        ).distinct()
    
    def get_user_cc_approvals(self, user):
        """获取抄送给用户的审批"""
        return ApprovalInstance.objects.filter(
            nodes__cc_users__user=user
        ).distinct()
    
    def get_user_initiated_approvals(self, user):
        """获取用户发起的审批"""
        return ApprovalInstance.objects.filter(initiator=user)
    
    def get_user_followed_approvals(self, user):
        """获取用户关注的审批"""
        return ApprovalInstance.objects.filter(follows__user=user)