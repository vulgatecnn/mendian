"""
审批中心工具类
"""
import re
from django.core.exceptions import ValidationError


class ApprovalValidator:
    """审批验证器"""
    
    @staticmethod
    def validate_flow_config(flow_config):
        """
        验证流程配置的完整性
        
        Args:
            flow_config: 流程配置字典
            
        Raises:
            ValidationError: 配置不完整或不正确时抛出异常
        """
        if not isinstance(flow_config, dict):
            raise ValidationError('流程配置必须是字典格式')
        
        nodes = flow_config.get('nodes', [])
        if not nodes:
            raise ValidationError('流程配置中必须包含至少一个节点')
        
        for idx, node in enumerate(nodes):
            ApprovalValidator._validate_node_config(node, idx + 1)
    
    @staticmethod
    def _validate_node_config(node_config, sequence):
        """验证单个节点配置"""
        if not isinstance(node_config, dict):
            raise ValidationError(f'第{sequence}个节点配置必须是字典格式')
        
        # 验证必填字段
        required_fields = ['name', 'type']
        for field in required_fields:
            if field not in node_config:
                raise ValidationError(f'第{sequence}个节点缺少必填字段：{field}')
        
        # 验证节点类型
        valid_types = ['approval', 'cc', 'condition']
        if node_config['type'] not in valid_types:
            raise ValidationError(f'第{sequence}个节点类型无效，支持的类型：{valid_types}')
        
        # 验证审批节点必须有审批人配置
        if node_config['type'] == 'approval':
            if 'approvers' not in node_config or not node_config['approvers']:
                raise ValidationError(f'第{sequence}个审批节点必须配置审批人')
            
            ApprovalValidator._validate_approver_config(node_config['approvers'], sequence)
    
    @staticmethod
    def _validate_approver_config(approver_config, sequence):
        """验证审批人配置"""
        if not isinstance(approver_config, dict):
            raise ValidationError(f'第{sequence}个节点的审批人配置必须是字典格式')
        
        config_type = approver_config.get('type')
        if not config_type:
            raise ValidationError(f'第{sequence}个节点的审批人配置缺少type字段')
        
        valid_types = [
            'fixed_users', 'role', 'department_manager', 
            'initiator_manager', 'department_users', 'initiator_department_manager'
        ]
        if config_type not in valid_types:
            raise ValidationError(f'第{sequence}个节点的审批人类型无效，支持的类型：{valid_types}')
        
        # 根据类型验证具体配置
        if config_type == 'fixed_users':
            user_ids = approver_config.get('user_ids', [])
            if not user_ids:
                raise ValidationError(f'第{sequence}个节点的固定用户配置不能为空')
        
        elif config_type == 'role':
            role_codes = approver_config.get('role_codes', [])
            if not role_codes:
                raise ValidationError(f'第{sequence}个节点的角色配置不能为空')
        
        elif config_type in ['department_manager', 'department_users']:
            dept_ids = approver_config.get('department_ids', [])
            if not dept_ids:
                raise ValidationError(f'第{sequence}个节点的部门配置不能为空')
    
    @staticmethod
    def validate_form_schema(form_schema):
        """
        验证表单配置的完整性
        
        Args:
            form_schema: 表单配置字典（JSON Schema格式）
            
        Raises:
            ValidationError: 配置不完整或不正确时抛出异常
        """
        if not isinstance(form_schema, dict):
            raise ValidationError('表单配置必须是字典格式')
        
        # 基本的JSON Schema验证
        if 'type' not in form_schema:
            raise ValidationError('表单配置缺少type字段')
        
        if form_schema['type'] != 'object':
            raise ValidationError('表单配置的根类型必须是object')
        
        properties = form_schema.get('properties', {})
        if not properties:
            raise ValidationError('表单配置必须包含至少一个字段')
        
        # 验证每个字段配置
        for field_name, field_config in properties.items():
            ApprovalValidator._validate_field_config(field_name, field_config)
    
    @staticmethod
    def _validate_field_config(field_name, field_config):
        """验证单个字段配置"""
        if not isinstance(field_config, dict):
            raise ValidationError(f'字段{field_name}的配置必须是字典格式')
        
        if 'type' not in field_config:
            raise ValidationError(f'字段{field_name}缺少type字段')
        
        valid_types = ['string', 'number', 'integer', 'boolean', 'array', 'object']
        if field_config['type'] not in valid_types:
            raise ValidationError(f'字段{field_name}的类型无效，支持的类型：{valid_types}')


class ApprovalPermissionChecker:
    """审批权限检查器"""
    
    @staticmethod
    def can_initiate_approval(user, template):
        """检查用户是否可以发起指定模板的审批"""
        # 基本检查：用户必须是活跃状态
        if not user.is_active:
            return False, '用户已停用'
        
        # 检查模板是否启用
        if template.status != 'active':
            return False, '审批模板已停用'
        
        # TODO: 根据业务需求添加更多权限检查
        # 例如：检查用户角色、部门等
        
        return True, '可以发起审批'
    
    @staticmethod
    def can_process_approval(user, node):
        """检查用户是否可以处理指定的审批节点"""
        # 基本检查：用户必须是活跃状态
        if not user.is_active:
            return False, '用户已停用'
        
        # 检查节点状态
        if node.status != 'in_progress':
            return False, '审批节点不在处理状态'
        
        # 检查用户是否是该节点的审批人
        if not node.approvers.filter(user=user, is_processed=False).exists():
            return False, '您不是此审批节点的审批人或已处理过'
        
        return True, '可以处理审批'
    
    @staticmethod
    def can_withdraw_approval(user, instance):
        """检查用户是否可以撤销审批"""
        # 只有发起人可以撤销
        if instance.initiator != user:
            return False, '只有发起人可以撤销审批'
        
        # 只有待审批或审批中的单据可以撤销
        if instance.status not in ['pending', 'in_progress']:
            return False, '只有待审批或审批中的单据可以撤销'
        
        return True, '可以撤销审批'


class ApprovalStatusHelper:
    """审批状态辅助类"""
    
    STATUS_DISPLAY = {
        'pending': '待审批',
        'in_progress': '审批中',
        'approved': '已通过',
        'rejected': '已拒绝',
        'withdrawn': '已撤销',
    }
    
    NODE_STATUS_DISPLAY = {
        'pending': '待处理',
        'in_progress': '处理中',
        'approved': '已通过',
        'rejected': '已拒绝',
        'skipped': '已跳过',
    }
    
    @classmethod
    def get_status_display(cls, status):
        """获取状态显示名称"""
        return cls.STATUS_DISPLAY.get(status, status)
    
    @classmethod
    def get_node_status_display(cls, status):
        """获取节点状态显示名称"""
        return cls.NODE_STATUS_DISPLAY.get(status, status)
    
    @staticmethod
    def is_final_status(status):
        """判断是否为最终状态"""
        return status in ['approved', 'rejected', 'withdrawn']
    
    @staticmethod
    def can_be_processed(status):
        """判断是否可以被处理"""
        return status in ['pending', 'in_progress']