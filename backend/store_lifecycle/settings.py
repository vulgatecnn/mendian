"""
Django settings for store_lifecycle project.
门店生命周期管理系统配置文件
"""

from pathlib import Path
import os
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# 加载 .env 文件
load_dotenv(BASE_DIR / '.env')


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # 第三方应用
    'rest_framework',
    'corsheaders',
    'drf_spectacular',
    'django_filters',
    
    # 本地应用
    'system_management',
    'store_planning',
    'base_data',
    'store_expansion',
    'store_preparation',
    'store_archive',
    'approval',
    'notification',
    'wechat_integration',
    'data_analytics',  # 数据分析模块
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS 中间件
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'system_management.permissions.PermissionMiddleware',  # 权限验证中间件
    'data_analytics.middleware.AnalyticsLoggingMiddleware',  # 数据分析日志中间件
    'data_analytics.middleware.DataCacheMiddleware',  # 数据缓存中间件
    'data_analytics.middleware.AnalyticsSecurityMiddleware',  # 数据分析安全中间件
]

ROOT_URLCONF = 'store_lifecycle.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'store_lifecycle.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'store_lifecycle'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '111111'),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# 自定义用户模型
AUTH_USER_MODEL = 'system_management.User'


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'zh-hans'

TIME_ZONE = 'Asia/Shanghai'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Django REST Framework 配置
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'system_management.jwt_authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'EXCEPTION_HANDLER': 'store_lifecycle.exceptions.custom_exception_handler',
}


# drf-spectacular 配置（API 文档）
SPECTACULAR_SETTINGS = {
    'TITLE': '门店生命周期管理系统 API',
    'DESCRIPTION': '''
好饭碗门店生命周期管理系统的 RESTful API 文档

## 系统概述

门店生命周期管理系统是一个全面的门店管理平台，用于管理从门店规划、选址到施工、开业和持续运营的整个过程。

## 认证方式

系统使用 Session 认证，需要先登录获取会话。

## 权限控制

系统采用基于角色的访问控制（RBAC）模型：
- 用户通过角色获得权限
- 每个API接口都需要相应的权限
- 权限不足时返回 403 状态码

## 响应格式

大部分接口返回统一的响应格式：
```json
{
    "code": 0,           // 状态码，0表示成功
    "message": "成功",    // 响应消息
    "data": {}           // 响应数据
}
```

## 错误码说明

- 0: 成功
- 1000: 未知错误
- 1001: 参数错误
- 1002: 权限不足
- 2001-2003: 企业微信集成相关错误
- 3001-3003: 用户管理相关错误
- 4001-4003: 角色管理相关错误
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'CONTACT': {
        'name': '系统管理员',
        'email': 'admin@example.com',
    },
    'LICENSE': {
        'name': '内部使用',
    },
    'TAGS': [
        {
            'name': '部门管理',
            'description': '部门信息管理和企业微信同步'
        },
        {
            'name': '用户管理', 
            'description': '用户账号管理、启用停用、角色分配'
        },
        {
            'name': '角色管理',
            'description': '角色创建、权限分配、成员管理'
        },
        {
            'name': '权限管理',
            'description': '权限查询和管理'
        },
        {
            'name': '审计日志',
            'description': '系统操作日志查询'
        },
        {
            'name': '数据分析',
            'description': '经营大屏、数据报表和可视化分析'
        },
    ],
    'SERVERS': [
        {
            'url': 'http://localhost:8000',
            'description': '开发环境'
        },
        {
            'url': 'https://api.example.com',
            'description': '生产环境'
        },
    ],
    'EXTERNAL_DOCS': {
        'description': '更多文档',
        'url': 'https://docs.example.com',
    },
    'SCHEMA_PATH_PREFIX': '/api/',
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,
}


# CORS 配置（跨域资源共享）
# 从环境变量读取前端 URL，默认为 http://localhost:5000
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5000')
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    FRONTEND_URL.replace('localhost', '127.0.0.1'),
]

CORS_ALLOW_CREDENTIALS = True


# 企业微信配置
WECHAT_CORP_ID = os.environ.get('WECHAT_CORP_ID', '')
WECHAT_AGENT_ID = os.environ.get('WECHAT_AGENT_ID', '')
WECHAT_SECRET = os.environ.get('WECHAT_SECRET', '')
WECHAT_API_BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin'  # 企业微信 API 基础 URL
WECHAT_TOKEN_CACHE_KEY = 'wechat_access_token'  # 访问令牌缓存键
WECHAT_TOKEN_EXPIRES_IN = 7200  # 访问令牌有效期（秒）
WECHAT_API_TIMEOUT = 30  # API 请求超时时间（秒）


# 缓存配置
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}


# 会话配置
SESSION_COOKIE_AGE = 7200  # 2小时
SESSION_SAVE_EVERY_REQUEST = True


# Celery 配置
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Shanghai'
CELERY_ENABLE_UTC = False
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 任务最长执行时间：30分钟

# Celery Beat 定时任务配置
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # 每天凌晨 2 点执行全量同步
    'sync-wechat-all-daily': {
        'task': 'wechat_integration.tasks.sync_wechat_all',
        'schedule': crontab(hour=2, minute=0),
    },
    # 每 4 小时同步一次用户信息
    'sync-wechat-users-4hours': {
        'task': 'wechat_integration.tasks.sync_wechat_users',
        'schedule': crontab(minute=0, hour='*/4'),
    },
    # 每 6 小时同步一次部门信息
    'sync-wechat-departments-6hours': {
        'task': 'wechat_integration.tasks.sync_wechat_departments',
        'schedule': crontab(minute=0, hour='*/6'),
    },
}


# 日志配置
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'system_management': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
