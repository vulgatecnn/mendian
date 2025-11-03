"""
开店计划管理权限配置
定义不同角色的权限组合和权限分组
"""

# 权限分组定义
PERMISSION_GROUPS = {
    'basic_data': {
        'name': '基础数据管理',
        'description': '经营区域和门店类型的管理权限',
        'permissions': [
            'store_planning.region.view',
            'store_planning.region.create',
            'store_planning.region.update',
            'store_planning.region.delete',
            'store_planning.store_type.view',
            'store_planning.store_type.create',
            'store_planning.store_type.update',
            'store_planning.store_type.delete',
        ]
    },
    'plan_management': {
        'name': '计划管理',
        'description': '开店计划的基本管理权限',
        'permissions': [
            'store_planning.plan.view',
            'store_planning.plan.create',
            'store_planning.plan.update',
            'store_planning.plan.delete',
            'store_planning.regional_plan.view',
            'store_planning.regional_plan.update',
            'store_planning.regional_plan.delete',
        ]
    },
    'plan_execution': {
        'name': '计划执行',
        'description': '计划发布、执行和状态管理权限',
        'permissions': [
            'store_planning.plan.publish',
            'store_planning.plan.cancel',
            'store_planning.plan.execute',
            'store_planning.plan.complete',
            'store_planning.progress.view',
            'store_planning.progress.update',
            'store_planning.progress.record',
        ]
    },
    'statistics_analysis': {
        'name': '统计分析',
        'description': '数据统计和分析报表权限',
        'permissions': [
            'store_planning.statistics.view',
            'store_planning.dashboard.view',
            'store_planning.reports.view',
        ]
    },
    'data_import_export': {
        'name': '数据导入导出',
        'description': '数据导入导出功能权限',
        'permissions': [
            'store_planning.import.execute',
            'store_planning.export.execute',
            'store_planning.template.download',
        ]
    },
    'approval_process': {
        'name': '审批流程',
        'description': '审批相关功能权限',
        'permissions': [
            'store_planning.approval.submit',
            'store_planning.approval.view',
            'store_planning.approval.cancel',
        ]
    },
    'approval_management': {
        'name': '审批管理',
        'description': '审批处理和管理权限',
        'permissions': [
            'store_planning.approval.approve',
            'store_planning.approval.batch',
        ]
    },
    'audit_log': {
        'name': '审计日志',
        'description': '审计日志查看权限',
        'permissions': [
            'store_planning.audit.view',
        ]
    },
    'system_management': {
        'name': '系统管理',
        'description': '系统配置和维护权限',
        'permissions': [
            'store_planning.system.config',
            'store_planning.system.maintenance',
            'store_planning.dashboard.refresh',
        ]
    },
    'sensitive_operations': {
        'name': '敏感操作',
        'description': '高风险敏感操作权限',
        'permissions': [
            'store_planning.sensitive.force_update',
            'store_planning.sensitive.force_delete',
            'store_planning.sensitive.bypass_approval',
            'store_planning.sensitive.data_recovery',
        ]
    }
}

# 角色权限模板定义
ROLE_PERMISSION_TEMPLATES = {
    'plan_viewer': {
        'name': '计划查看员',
        'description': '只能查看计划相关信息，无修改权限',
        'permission_groups': [
            'statistics_analysis',
        ],
        'additional_permissions': [
            'store_planning.plan.view',
            'store_planning.regional_plan.view',
            'store_planning.progress.view',
            'store_planning.approval.view',
        ]
    },
    'plan_operator': {
        'name': '计划操作员',
        'description': '可以创建和管理计划，但不能执行敏感操作',
        'permission_groups': [
            'plan_management',
            'statistics_analysis',
            'data_import_export',
            'approval_process',
        ],
        'additional_permissions': []
    },
    'plan_manager': {
        'name': '计划管理员',
        'description': '具有完整的计划管理权限，包括执行和审批',
        'permission_groups': [
            'basic_data',
            'plan_management',
            'plan_execution',
            'statistics_analysis',
            'data_import_export',
            'approval_process',
            'approval_management',
            'audit_log',
        ],
        'additional_permissions': []
    },
    'system_admin': {
        'name': '系统管理员',
        'description': '具有所有权限，包括系统管理和敏感操作',
        'permission_groups': [
            'basic_data',
            'plan_management',
            'plan_execution',
            'statistics_analysis',
            'data_import_export',
            'approval_process',
            'approval_management',
            'audit_log',
            'system_management',
            'sensitive_operations',
        ],
        'additional_permissions': []
    },
    'regional_manager': {
        'name': '区域管理员',
        'description': '负责特定区域的计划管理，权限相对受限',
        'permission_groups': [
            'plan_management',
            'statistics_analysis',
            'approval_process',
        ],
        'additional_permissions': [
            'store_planning.progress.view',
            'store_planning.progress.update',
            'store_planning.progress.record',
        ]
    },
    'data_analyst': {
        'name': '数据分析员',
        'description': '专注于数据分析和报表，具有导出权限',
        'permission_groups': [
            'statistics_analysis',
            'data_import_export',
        ],
        'additional_permissions': [
            'store_planning.plan.view',
            'store_planning.regional_plan.view',
            'store_planning.progress.view',
        ]
    },
    'approver': {
        'name': '审批员',
        'description': '专门负责审批工作的角色',
        'permission_groups': [
            'approval_management',
            'audit_log',
        ],
        'additional_permissions': [
            'store_planning.plan.view',
            'store_planning.regional_plan.view',
            'store_planning.statistics.view',
        ]
    }
}

# 权限验证规则
PERMISSION_VALIDATION_RULES = {
    # 状态相关的权限验证
    'status_based': {
        'store_planning.plan.update': {
            'allowed_statuses': ['draft'],
            'error_message': '只有草稿状态的计划才能修改'
        },
        'store_planning.plan.delete': {
            'allowed_statuses': ['draft'],
            'error_message': '只有草稿状态的计划才能删除'
        },
        'store_planning.plan.publish': {
            'allowed_statuses': ['draft'],
            'error_message': '只有草稿状态的计划才能发布'
        },
        'store_planning.plan.execute': {
            'allowed_statuses': ['published'],
            'error_message': '只有已发布的计划才能开始执行'
        },
        'store_planning.plan.complete': {
            'allowed_statuses': ['executing'],
            'error_message': '只有执行中的计划才能标记为完成'
        },
        'store_planning.progress.update': {
            'allowed_statuses': ['executing'],
            'error_message': '只有执行中的计划才能更新进度'
        }
    },
    
    # 数据范围相关的权限验证
    'data_scope': {
        'regional_manager': {
            'description': '区域管理员只能管理自己负责区域的计划',
            'scope_field': 'region_id',
            'scope_source': 'user.managed_regions'
        }
    },
    
    # 敏感操作的额外验证
    'sensitive_operations': {
        'store_planning.sensitive.force_update': {
            'require_reason': True,
            'require_confirmation': True,
            'audit_level': 'high'
        },
        'store_planning.sensitive.force_delete': {
            'require_reason': True,
            'require_confirmation': True,
            'audit_level': 'high'
        },
        'store_planning.sensitive.bypass_approval': {
            'require_reason': True,
            'require_confirmation': True,
            'audit_level': 'critical'
        },
        'store_planning.sensitive.data_recovery': {
            'require_reason': True,
            'require_confirmation': True,
            'audit_level': 'critical'
        }
    }
}

# 权限依赖关系
PERMISSION_DEPENDENCIES = {
    # 修改权限需要查看权限
    'store_planning.plan.update': ['store_planning.plan.view'],
    'store_planning.plan.delete': ['store_planning.plan.view'],
    'store_planning.plan.publish': ['store_planning.plan.view'],
    'store_planning.plan.cancel': ['store_planning.plan.view'],
    'store_planning.plan.execute': ['store_planning.plan.view'],
    'store_planning.plan.complete': ['store_planning.plan.view'],
    
    # 区域计划权限依赖
    'store_planning.regional_plan.update': ['store_planning.regional_plan.view'],
    'store_planning.regional_plan.delete': ['store_planning.regional_plan.view'],
    
    # 进度管理权限依赖
    'store_planning.progress.update': ['store_planning.progress.view'],
    'store_planning.progress.record': ['store_planning.progress.view'],
    
    # 审批权限依赖
    'store_planning.approval.approve': ['store_planning.approval.view'],
    'store_planning.approval.batch': ['store_planning.approval.approve'],
    
    # 敏感操作权限依赖
    'store_planning.sensitive.force_update': ['store_planning.plan.update'],
    'store_planning.sensitive.force_delete': ['store_planning.plan.delete'],
}


def get_permissions_by_group(group_name):
    """根据权限组名获取权限列表"""
    return PERMISSION_GROUPS.get(group_name, {}).get('permissions', [])


def get_permissions_by_role_template(template_name):
    """根据角色模板获取权限列表"""
    template = ROLE_PERMISSION_TEMPLATES.get(template_name, {})
    permissions = []
    
    # 添加权限组中的权限
    for group_name in template.get('permission_groups', []):
        permissions.extend(get_permissions_by_group(group_name))
    
    # 添加额外的权限
    permissions.extend(template.get('additional_permissions', []))
    
    return list(set(permissions))  # 去重


def validate_permission_dependencies(permissions):
    """验证权限依赖关系"""
    missing_dependencies = []
    
    for permission in permissions:
        dependencies = PERMISSION_DEPENDENCIES.get(permission, [])
        for dependency in dependencies:
            if dependency not in permissions:
                missing_dependencies.append({
                    'permission': permission,
                    'missing_dependency': dependency
                })
    
    return missing_dependencies


def get_all_permissions():
    """获取所有开店计划管理权限"""
    all_permissions = []
    for group in PERMISSION_GROUPS.values():
        all_permissions.extend(group['permissions'])
    return list(set(all_permissions))