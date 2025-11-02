from django.apps import AppConfig


class SystemManagementConfig(AppConfig):
    """系统管理模块配置"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'system_management'
    verbose_name = '系统管理'
