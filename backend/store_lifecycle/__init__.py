# Django 项目初始化文件

# PostgreSQL 不需要额外的初始化代码

# 导入 Celery 应用，确保 Django 启动时加载
from .celery import app as celery_app

__all__ = ('celery_app',)
