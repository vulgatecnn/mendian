from django.apps import AppConfig


class BaseDataConfig(AppConfig):
    """基础数据管理应用配置"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base_data'
    verbose_name = '基础数据管理'
