from django.apps import AppConfig


class DataAnalyticsConfig(AppConfig):
    """数据分析模块配置"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'data_analytics'
    verbose_name = '数据分析'
