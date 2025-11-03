"""
认证相关序列化器
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import User


class LoginSerializer(serializers.Serializer):
    """登录序列化器"""
    login_type = serializers.ChoiceField(
        choices=[
            ('username_password', '用户名密码'),
            ('phone_password', '手机号密码'),
            ('phone_sms', '手机号验证码'),
            ('wechat', '企业微信')
        ],
        help_text='登录方式'
    )
    
    # 用户名密码登录
    username = serializers.CharField(
        max_length=150,
        required=False,
        help_text='用户名（支持用户名或手机号）'
    )
    password = serializers.CharField(
        max_length=128,
        required=False,
        help_text='密码'
    )
    
    # 手机号登录
    phone = serializers.CharField(
        max_length=11,
        required=False,
        help_text='手机号'
    )
    
    # 验证码登录
    sms_code = serializers.CharField(
        max_length=6,
        required=False,
        help_text='短信验证码'
    )
    
    # 企业微信登录
    wechat_code = serializers.CharField(
        max_length=200,
        required=False,
        help_text='企业微信授权码'
    )
    
    def validate(self, attrs):
        """验证登录参数"""
        login_type = attrs.get('login_type')
        
        if login_type == 'username_password':
            if not attrs.get('username') or not attrs.get('password'):
                raise serializers.ValidationError('用户名和密码不能为空')
        
        elif login_type == 'phone_password':
            if not attrs.get('phone') or not attrs.get('password'):
                raise serializers.ValidationError('手机号和密码不能为空')
            
            # 验证手机号格式
            phone = attrs.get('phone')
            if not phone.isdigit() or len(phone) != 11:
                raise serializers.ValidationError('手机号格式不正确')
        
        elif login_type == 'phone_sms':
            if not attrs.get('phone') or not attrs.get('sms_code'):
                raise serializers.ValidationError('手机号和验证码不能为空')
            
            # 验证手机号格式
            phone = attrs.get('phone')
            if not phone.isdigit() or len(phone) != 11:
                raise serializers.ValidationError('手机号格式不正确')
            
            # 验证验证码格式
            sms_code = attrs.get('sms_code')
            if not sms_code.isdigit() or len(sms_code) != 6:
                raise serializers.ValidationError('验证码格式不正确')
        
        elif login_type == 'wechat':
            if not attrs.get('wechat_code'):
                raise serializers.ValidationError('企业微信授权码不能为空')
        
        else:
            raise serializers.ValidationError('不支持的登录方式')
        
        return attrs


class SendSMSCodeSerializer(serializers.Serializer):
    """发送短信验证码序列化器"""
    phone = serializers.CharField(
        max_length=11,
        help_text='手机号'
    )
    
    def validate_phone(self, value):
        """验证手机号格式"""
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError('手机号格式不正确')
        return value


class RefreshTokenSerializer(serializers.Serializer):
    """刷新令牌序列化器"""
    refresh_token = serializers.CharField(
        help_text='刷新令牌'
    )


class ChangePasswordSerializer(serializers.Serializer):
    """修改密码序列化器"""
    old_password = serializers.CharField(
        max_length=128,
        help_text='原密码'
    )
    new_password = serializers.CharField(
        max_length=128,
        help_text='新密码'
    )
    confirm_password = serializers.CharField(
        max_length=128,
        help_text='确认新密码'
    )
    
    def validate_new_password(self, value):
        """验证新密码强度"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """验证密码一致性"""
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError('两次输入的密码不一致')
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """用户个人信息序列化器"""
    full_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    role_names = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'first_name',
            'last_name',
            'email',
            'phone',
            'department',
            'department_name',
            'position',
            'role_names',
            'permissions',
            'is_active',
            'date_joined',
            'last_login'
        ]
        read_only_fields = [
            'id',
            'username',
            'is_active',
            'date_joined',
            'last_login'
        ]
    
    def get_full_name(self, obj):
        """获取用户全名"""
        return obj.get_full_name()
    
    def get_role_names(self, obj):
        """获取用户角色名称列表"""
        return list(obj.roles.values_list('name', flat=True))
    
    def get_permissions(self, obj):
        """获取用户权限编码列表"""
        return list(obj.get_permission_codes())


class LoginResponseSerializer(serializers.Serializer):
    """登录响应序列化器"""
    access_token = serializers.CharField(help_text='访问令牌')
    refresh_token = serializers.CharField(help_text='刷新令牌')
    token_type = serializers.CharField(help_text='令牌类型')
    expires_in = serializers.IntegerField(help_text='过期时间（秒）')
    user = UserProfileSerializer(help_text='用户信息')


class RefreshTokenResponseSerializer(serializers.Serializer):
    """刷新令牌响应序列化器"""
    access_token = serializers.CharField(help_text='新的访问令牌')
    token_type = serializers.CharField(help_text='令牌类型')
    expires_in = serializers.IntegerField(help_text='过期时间（秒）')