from django.apps import AppConfig


class WechatIntegrationConfig(AppConfig):
    """企业微信集成应用配置"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'wechat_integration'
    verbose_name = '企业微信集成'
