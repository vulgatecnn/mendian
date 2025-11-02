"""
系统管理模块测试包
包含企业微信集成、用户管理、角色权限、权限控制和审计日志的集成测试
"""

# 测试模块导入
from .test_wechat_integration import (
    WeChatDepartmentSyncTest,
    WeChatUserSyncTest,
    WeChatTokenManagerTest
)

from .test_user_management import (
    UserManagementTest,
    UserLoginTest,
    UserPermissionTest
)

from .test_role_permission import (
    RoleManagementTest,
    PermissionManagementTest,
    RolePermissionIntegrationTest
)

from .test_permission_control import (
    PermissionControlTest,
    APIPermissionTest,
    FrontendPermissionControlTest
)

from .test_audit_log import (
    AuditLogRecordingTest,
    AuditLogQueryTest,
    AuditLogCleanupTest
)

__all__ = [
    # 企业微信集成测试
    'WeChatDepartmentSyncTest',
    'WeChatUserSyncTest', 
    'WeChatTokenManagerTest',
    
    # 用户管理测试
    'UserManagementTest',
    'UserLoginTest',
    'UserPermissionTest',
    
    # 角色权限测试
    'RoleManagementTest',
    'PermissionManagementTest',
    'RolePermissionIntegrationTest',
    
    # 权限控制测试
    'PermissionControlTest',
    'APIPermissionTest',
    'FrontendPermissionControlTest',
    
    # 审计日志测试
    'AuditLogRecordingTest',
    'AuditLogQueryTest',
    'AuditLogCleanupTest',
]