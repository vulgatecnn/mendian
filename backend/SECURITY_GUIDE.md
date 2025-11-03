# 安全加固指南

## 1. API 限流配置

### 1.1 在 settings.py 中配置限流

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'common.security.UserRateThrottle',
        'common.security.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '1000/hour',      # 认证用户每小时1000次
        'anon': '100/hour',        # 匿名用户每小时100次
        'sensitive': '5/hour'      # 敏感操作每小时5次
    }
}
```

### 1.2 在视图中应用限流

```python
from rest_framework.views import APIView
from common.security import UserRateThrottle, SensitiveAPIThrottle

class LoginView(APIView):
    """登录接口 - 应用敏感操作限流"""
    throttle_classes = [SensitiveAPIThrottle]
    
    def post(self, request):
        # 登录逻辑
        pass

class StoreListView(APIView):
    """门店列表接口 - 应用用户限流"""
    throttle_classes = [UserRateThrottle]
    
    def get(self, request):
        # 查询逻辑
        pass
```

### 1.3 自定义限流规则

```python
from common.security import APIRateLimiter

def custom_rate_limit_check(request):
    """自定义限流检查"""
    user_id = request.user.id
    key = f'custom_limit:{user_id}'
    
    allowed, remaining, reset_time = APIRateLimiter.check_rate_limit(
        key=key,
        max_requests=100,
        time_window=3600  # 1小时
    )
    
    if not allowed:
        raise Throttled(detail=f'请求过于频繁，请在 {int(reset_time - time.time())} 秒后重试')
    
    return True
```

## 2. 敏感数据加密

### 2.1 加密存储敏感字段

```python
from common.security import DataEncryption

# 初始化加密器
encryptor = DataEncryption()

# 加密数据
encrypted_data = encryptor.encrypt('敏感信息')

# 存储到数据库
user.encrypted_field = encrypted_data
user.save()

# 解密数据
decrypted_data = encryptor.decrypt(user.encrypted_field)
```

### 2.2 在模型中使用加密字段

```python
from django.db import models
from common.security import DataEncryption

class SensitiveData(models.Model):
    """包含敏感数据的模型"""
    encrypted_field = models.TextField(verbose_name="加密字段")
    
    def set_sensitive_data(self, data):
        """设置敏感数据（自动加密）"""
        encryptor = DataEncryption()
        self.encrypted_field = encryptor.encrypt(data)
    
    def get_sensitive_data(self):
        """获取敏感数据（自动解密）"""
        encryptor = DataEncryption()
        return encryptor.decrypt(self.encrypted_field)
```

### 2.3 密码哈希

```python
from common.security import DataEncryption

# 哈希密码
hashed, salt = DataEncryption.hash_password('user_password')

# 存储哈希值和盐值
user.password_hash = hashed
user.password_salt = salt
user.save()

# 验证密码
is_valid = DataEncryption.verify_password(
    'user_password',
    user.password_hash,
    user.password_salt
)
```

## 3. 敏感数据脱敏

### 3.1 在 API 响应中脱敏

```python
from rest_framework import serializers
from common.security import SensitiveDataMasking

class UserSerializer(serializers.ModelSerializer):
    """用户序列化器 - 自动脱敏"""
    
    phone = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    id_card = serializers.SerializerMethodField()
    
    def get_phone(self, obj):
        """手机号脱敏"""
        return SensitiveDataMasking.mask_phone(obj.phone)
    
    def get_email(self, obj):
        """邮箱脱敏"""
        return SensitiveDataMasking.mask_email(obj.email)
    
    def get_id_card(self, obj):
        """身份证号脱敏"""
        return SensitiveDataMasking.mask_id_card(obj.id_card)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'phone', 'email', 'id_card']
```

### 3.2 在日志中脱敏

```python
from common.security import SensitiveDataMasking
import logging

logger = logging.getLogger(__name__)

def log_user_action(user, action):
    """记录用户操作（脱敏）"""
    masked_phone = SensitiveDataMasking.mask_phone(user.phone)
    logger.info(f'用户 {user.username} ({masked_phone}) 执行了操作: {action}')
```

## 4. 输入验证

### 4.1 验证用户输入

```python
from common.security import InputValidator
from rest_framework.exceptions import ValidationError

def validate_user_input(data):
    """验证用户输入"""
    
    # 验证手机号
    if 'phone' in data:
        if not InputValidator.validate_phone(data['phone']):
            raise ValidationError('手机号格式不正确')
    
    # 验证邮箱
    if 'email' in data:
        if not InputValidator.validate_email(data['email']):
            raise ValidationError('邮箱格式不正确')
    
    # 验证密码强度
    if 'password' in data:
        if not InputValidator.validate_password(data['password']):
            raise ValidationError('密码必须至少8位，包含字母和数字')
    
    # 清理输入（防止 XSS）
    if 'description' in data:
        data['description'] = InputValidator.sanitize_input(data['description'])
    
    # 检测 SQL 注入
    if 'search' in data:
        if not InputValidator.validate_sql_injection(data['search']):
            raise ValidationError('输入包含非法字符')
    
    return data
```

### 4.2 在序列化器中验证

```python
from rest_framework import serializers
from common.security import InputValidator

class UserCreateSerializer(serializers.Serializer):
    """用户创建序列化器 - 包含输入验证"""
    
    phone = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate_phone(self, value):
        """验证手机号"""
        if not InputValidator.validate_phone(value):
            raise serializers.ValidationError('手机号格式不正确')
        return value
    
    def validate_password(self, value):
        """验证密码强度"""
        if not InputValidator.validate_password(value):
            raise serializers.ValidationError('密码必须至少8位，包含字母和数字')
        return value
```

## 5. 权限控制

### 5.1 检查功能权限

```python
from common.security import PermissionChecker
from rest_framework.exceptions import PermissionDenied

def create_store(request):
    """创建门店 - 检查权限"""
    
    # 检查用户是否有创建门店的权限
    if not PermissionChecker.check_permission(request.user, 'store:create'):
        raise PermissionDenied('您没有创建门店的权限')
    
    # 创建门店逻辑
    pass
```

### 5.2 使用权限装饰器

```python
from common.security import PermissionChecker

@PermissionChecker.require_permission('store:delete')
def delete_store(request, store_id):
    """删除门店 - 需要权限"""
    # 删除逻辑
    pass
```

### 5.3 检查数据权限

```python
from common.security import PermissionChecker
from store_archive.models import StoreProfile

def get_store_detail(request, store_id):
    """获取门店详情 - 检查数据权限"""
    
    store = StoreProfile.objects.get(id=store_id)
    
    # 检查用户是否有权限查看此门店
    if not PermissionChecker.check_data_permission(request.user, store):
        raise PermissionDenied('您没有权限查看此门店')
    
    return store
```

## 6. 安全日志

### 6.1 记录登录尝试

```python
from common.security import SecurityLogger

def login(request):
    """登录"""
    username = request.data.get('username')
    password = request.data.get('password')
    ip_address = request.META.get('REMOTE_ADDR')
    
    user = authenticate(username=username, password=password)
    
    if user:
        # 登录成功
        SecurityLogger.log_login_attempt(username, ip_address, True)
        return Response({'token': generate_token(user)})
    else:
        # 登录失败
        SecurityLogger.log_login_attempt(username, ip_address, False, '用户名或密码错误')
        return Response({'error': '用户名或密码错误'}, status=401)
```

### 6.2 记录权限拒绝

```python
from common.security import SecurityLogger

def access_sensitive_data(request, resource_id):
    """访问敏感数据"""
    ip_address = request.META.get('REMOTE_ADDR')
    
    if not has_permission(request.user, 'sensitive:read'):
        # 记录权限拒绝
        SecurityLogger.log_permission_denied(
            user=request.user,
            resource='sensitive_data',
            action='read',
            ip_address=ip_address
        )
        raise PermissionDenied()
    
    # 访问逻辑
    pass
```

### 6.3 记录数据访问

```python
from common.security import SecurityLogger

def view_store_detail(request, store_id):
    """查看门店详情"""
    ip_address = request.META.get('REMOTE_ADDR')
    
    # 记录数据访问
    SecurityLogger.log_data_access(
        user=request.user,
        resource_type='store',
        resource_id=store_id,
        action='view',
        ip_address=ip_address
    )
    
    # 查询逻辑
    pass
```

## 7. IP 白名单

### 7.1 配置 IP 白名单

在 `settings.py` 中配置：

```python
# IP 白名单（仅允许这些 IP 访问）
IP_WHITELIST = [
    '192.168.1.100',
    '192.168.1.101',
    '10.0.0.0/8',  # 支持 CIDR 格式
]
```

### 7.2 使用 IP 白名单装饰器

```python
from common.security import IPWhitelist

@IPWhitelist.check_ip_whitelist
def admin_only_view(request):
    """仅管理员 IP 可访问的视图"""
    # 管理操作
    pass
```

## 8. Django 安全配置

### 8.1 在 settings.py 中配置安全选项

```python
# 安全配置
DEBUG = False  # 生产环境必须关闭 DEBUG

# HTTPS 配置
SECURE_SSL_REDIRECT = True  # 强制使用 HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Cookie 安全
SESSION_COOKIE_SECURE = True  # 仅通过 HTTPS 传输 Session Cookie
SESSION_COOKIE_HTTPONLY = True  # 防止 JavaScript 访问 Session Cookie
SESSION_COOKIE_SAMESITE = 'Strict'  # 防止 CSRF 攻击
SESSION_COOKIE_AGE = 3600  # Session 超时时间（1小时）

CSRF_COOKIE_SECURE = True  # 仅通过 HTTPS 传输 CSRF Cookie
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# 安全头
SECURE_BROWSER_XSS_FILTER = True  # 启用浏览器 XSS 过滤
SECURE_CONTENT_TYPE_NOSNIFF = True  # 防止 MIME 类型嗅探
X_FRAME_OPTIONS = 'DENY'  # 防止点击劫持

# HSTS（HTTP Strict Transport Security）
SECURE_HSTS_SECONDS = 31536000  # 1年
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# 允许的主机
ALLOWED_HOSTS = [
    'example.com',
    'www.example.com',
]

# CORS 配置
CORS_ALLOWED_ORIGINS = [
    'https://example.com',
    'https://www.example.com',
]
CORS_ALLOW_CREDENTIALS = True

# 密码验证
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
```

### 8.2 配置日志记录

```python
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
        'file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/security.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/security_events.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['security_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

## 9. 安全检查清单

### 部署前检查

- [ ] 关闭 DEBUG 模式
- [ ] 配置 ALLOWED_HOSTS
- [ ] 启用 HTTPS
- [ ] 配置安全 Cookie
- [ ] 启用 CSRF 保护
- [ ] 配置 CORS
- [ ] 实施 API 限流
- [ ] 加密敏感数据
- [ ] 实施输入验证
- [ ] 配置权限控制
- [ ] 启用安全日志
- [ ] 配置密码策略
- [ ] 设置会话超时
- [ ] 配置安全头
- [ ] 实施 IP 白名单（如需要）
- [ ] 定期更新依赖包
- [ ] 配置数据库访问权限
- [ ] 启用数据库连接加密
- [ ] 配置防火墙规则
- [ ] 实施备份策略

### 定期安全审计

- [ ] 检查安全日志
- [ ] 审查权限配置
- [ ] 检查异常登录
- [ ] 审查 API 调用频率
- [ ] 检查数据访问模式
- [ ] 更新安全补丁
- [ ] 进行渗透测试
- [ ] 审查代码安全性

## 10. 常见安全问题和解决方案

### 10.1 SQL 注入

**问题**：用户输入直接拼接到 SQL 语句中

**解决方案**：
- 使用 Django ORM（自动防止 SQL 注入）
- 如果必须使用原生 SQL，使用参数化查询

```python
# 错误示例
User.objects.raw(f"SELECT * FROM users WHERE username = '{username}'")

# 正确示例
User.objects.raw("SELECT * FROM users WHERE username = %s", [username])
```

### 10.2 XSS 攻击

**问题**：用户输入的 HTML/JavaScript 被直接渲染

**解决方案**：
- 使用 Django 模板自动转义
- 在 API 响应中清理用户输入
- 设置 Content-Security-Policy 头

```python
from common.security import InputValidator

# 清理用户输入
clean_text = InputValidator.sanitize_input(user_input)
```

### 10.3 CSRF 攻击

**问题**：恶意网站伪造用户请求

**解决方案**：
- 启用 Django CSRF 保护
- 在表单中包含 CSRF Token
- 配置 SameSite Cookie

### 10.4 暴力破解

**问题**：攻击者尝试大量密码组合

**解决方案**：
- 实施登录限流
- 账号锁定机制
- 使用验证码

```python
from common.security import SensitiveAPIThrottle

class LoginView(APIView):
    throttle_classes = [SensitiveAPIThrottle]  # 限制登录频率
```

### 10.5 会话劫持

**问题**：攻击者窃取用户会话

**解决方案**：
- 使用 HTTPS
- 设置 HttpOnly Cookie
- 实施会话超时
- 定期更新会话 ID

## 11. 应急响应

### 发现安全漏洞时的处理流程

1. **立即评估影响范围**
   - 确定受影响的系统和数据
   - 评估潜在损失

2. **隔离受影响系统**
   - 临时关闭受影响的功能
   - 限制访问权限

3. **修复漏洞**
   - 开发和测试补丁
   - 部署修复

4. **通知相关方**
   - 通知管理层
   - 如有必要，通知用户

5. **事后分析**
   - 分析漏洞原因
   - 改进安全流程
   - 更新安全文档

## 12. 安全培训

### 开发人员安全意识培训内容

- OWASP Top 10 安全风险
- 安全编码实践
- 输入验证和输出编码
- 认证和授权最佳实践
- 敏感数据处理
- 安全测试方法
- 应急响应流程

### 定期安全演练

- 模拟安全事件
- 测试应急响应流程
- 评估安全措施有效性
- 更新安全策略
