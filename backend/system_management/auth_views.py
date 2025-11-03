"""
认证相关视图
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample

from .authentication import (
    AuthenticationService,
    SMSVerificationService,
    JWTTokenManager,
    LoginAttemptTracker
)
from .auth_serializers import (
    LoginSerializer,
    SendSMSCodeSerializer,
    RefreshTokenSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer,
    LoginResponseSerializer,
    RefreshTokenResponseSerializer
)
from .models import User
from .services.audit_service import audit_logger

logger = logging.getLogger(__name__)


@extend_schema(
    summary="用户登录",
    description="""
    支持多种登录方式：
    1. 用户名密码登录
    2. 手机号密码登录
    3. 手机号验证码登录
    4. 企业微信登录（移动端）
    
    安全机制：
    - 登录失败5次后锁定账号30分钟
    - 返回JWT令牌用于后续API调用
    """,
    request=LoginSerializer,
    responses={
        200: OpenApiExample(
            '登录成功',
            value={
                'code': 0,
                'message': '登录成功',
                'data': {
                    'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                    'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                    'token_type': 'Bearer',
                    'expires_in': 7200,
                    'user': {
                        'id': 1,
                        'username': 'testuser',
                        'full_name': '测试用户',
                        'phone': '13800138000',
                        'department_name': '技术部',
                        'role_names': ['系统管理员'],
                        'permissions': ['system.user.view', 'system.user.create']
                    }
                }
            }
        ),
        400: OpenApiExample('参数错误', value={'code': 1001, 'message': '参数错误', 'data': None}),
        401: OpenApiExample('认证失败', value={'code': 1002, 'message': '用户名或密码错误', 'data': None}),
        423: OpenApiExample('账号锁定', value={'code': 1003, 'message': '账号已被锁定，请 25 分钟后重试', 'data': None}),
    },
    tags=['认证服务']
)
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """用户登录"""
    try:
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'code': 1001,
                'message': '参数错误',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        login_type = data['login_type']
        
        # 根据登录方式调用相应的认证方法
        if login_type == 'username_password':
            success, message, user, tokens = AuthenticationService.login_with_username_password(
                data['username'], data['password'], request
            )
        elif login_type == 'phone_password':
            success, message, user, tokens = AuthenticationService.login_with_phone_password(
                data['phone'], data['password'], request
            )
        elif login_type == 'phone_sms':
            success, message, user, tokens = AuthenticationService.login_with_phone_sms(
                data['phone'], data['sms_code'], request
            )
        elif login_type == 'wechat':
            success, message, user, tokens = AuthenticationService.login_with_wechat(
                data['wechat_code'], request
            )
        else:
            return Response({
                'code': 1001,
                'message': '不支持的登录方式',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if success:
            # 序列化用户信息
            user_serializer = UserProfileSerializer(user)
            
            return Response({
                'code': 0,
                'message': message,
                'data': {
                    **tokens,
                    'user': user_serializer.data
                }
            })
        else:
            # 根据错误类型返回不同的状态码
            if '锁定' in message:
                return Response({
                    'code': 1003,
                    'message': message,
                    'data': None
                }, status=status.HTTP_423_LOCKED)
            else:
                return Response({
                    'code': 1002,
                    'message': message,
                    'data': None
                }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        logger.error(f"登录失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'登录失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="发送短信验证码",
    description="""
    发送短信验证码到指定手机号
    
    限制：
    - 同一手机号60秒内只能发送一次
    - 验证码有效期5分钟
    """,
    request=SendSMSCodeSerializer,
    responses={
        200: OpenApiExample(
            '发送成功',
            value={
                'code': 0,
                'message': '验证码已发送',
                'data': None
            }
        ),
        400: OpenApiExample('参数错误', value={'code': 1001, 'message': '手机号格式不正确', 'data': None}),
        429: OpenApiExample('发送频繁', value={'code': 1004, 'message': '验证码发送过于频繁，请稍后再试', 'data': None}),
    },
    tags=['认证服务']
)
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def send_sms_code_view(request):
    """发送短信验证码"""
    try:
        serializer = SendSMSCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'code': 1001,
                'message': '参数错误',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        phone = serializer.validated_data['phone']
        
        # 发送验证码
        success, message = SMSVerificationService.send_verification_code(phone)
        
        if success:
            return Response({
                'code': 0,
                'message': message,
                'data': None
            })
        else:
            return Response({
                'code': 1004,
                'message': message,
                'data': None
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    except Exception as e:
        logger.error(f"发送短信验证码失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'发送失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="刷新访问令牌",
    description="使用刷新令牌获取新的访问令牌",
    request=RefreshTokenSerializer,
    responses={
        200: OpenApiExample(
            '刷新成功',
            value={
                'code': 0,
                'message': '令牌刷新成功',
                'data': {
                    'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                    'token_type': 'Bearer',
                    'expires_in': 7200
                }
            }
        ),
        400: OpenApiExample('参数错误', value={'code': 1001, 'message': '参数错误', 'data': None}),
        401: OpenApiExample('令牌无效', value={'code': 1002, 'message': '刷新令牌无效或已过期', 'data': None}),
    },
    tags=['认证服务']
)
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def refresh_token_view(request):
    """刷新访问令牌"""
    try:
        serializer = RefreshTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'code': 1001,
                'message': '参数错误',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh_token = serializer.validated_data['refresh_token']
        
        # 刷新令牌
        new_tokens = JWTTokenManager.refresh_access_token(refresh_token)
        
        if new_tokens:
            return Response({
                'code': 0,
                'message': '令牌刷新成功',
                'data': new_tokens
            })
        else:
            return Response({
                'code': 1002,
                'message': '刷新令牌无效或已过期',
                'data': None
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        logger.error(f"刷新令牌失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'刷新失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="用户登出",
    description="用户登出，清除会话信息",
    responses={
        200: OpenApiExample(
            '登出成功',
            value={
                'code': 0,
                'message': '登出成功',
                'data': None
            }
        ),
    },
    tags=['认证服务']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """用户登出"""
    try:
        # 执行登出
        AuthenticationService.logout(request.user, request)
        
        return Response({
            'code': 0,
            'message': '登出成功',
            'data': None
        })
    
    except Exception as e:
        logger.error(f"登出失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'登出失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="获取个人信息",
    description="获取当前登录用户的个人信息",
    responses={
        200: OpenApiExample(
            '获取成功',
            value={
                'code': 0,
                'message': '获取成功',
                'data': {
                    'id': 1,
                    'username': 'testuser',
                    'full_name': '测试用户',
                    'phone': '13800138000',
                    'email': 'test@example.com',
                    'department_name': '技术部',
                    'position': '开发工程师',
                    'role_names': ['系统管理员'],
                    'permissions': ['system.user.view', 'system.user.create']
                }
            }
        ),
    },
    tags=['个人中心']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """获取个人信息"""
    try:
        serializer = UserProfileSerializer(request.user)
        
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': serializer.data
        })
    
    except Exception as e:
        logger.error(f"获取个人信息失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'获取失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="更新个人信息",
    description="更新当前登录用户的个人信息",
    request=UserProfileSerializer,
    responses={
        200: OpenApiExample(
            '更新成功',
            value={
                'code': 0,
                'message': '更新成功',
                'data': {
                    'id': 1,
                    'username': 'testuser',
                    'full_name': '测试用户',
                    'phone': '13800138000',
                    'email': 'test@example.com'
                }
            }
        ),
        400: OpenApiExample('参数错误', value={'code': 1001, 'message': '参数错误', 'data': None}),
    },
    tags=['个人中心']
)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """更新个人信息"""
    try:
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                'code': 1001,
                'message': '参数错误',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 保存更新
        user = serializer.save()
        
        # 记录审计日志
        audit_logger.log(
            request=request,
            action=audit_logger.ACTION_UPDATE,
            target_type=audit_logger.TARGET_USER,
            target_id=user.id,
            details={
                'updated_fields': list(serializer.validated_data.keys())
            }
        )
        
        return Response({
            'code': 0,
            'message': '更新成功',
            'data': serializer.data
        })
    
    except Exception as e:
        logger.error(f"更新个人信息失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'更新失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="修改密码",
    description="""
    修改当前用户密码
    
    密码要求：
    - 长度至少8位
    - 包含字母和数字
    - 不能与用户名相似
    - 不能是常见密码
    """,
    request=ChangePasswordSerializer,
    responses={
        200: OpenApiExample(
            '修改成功',
            value={
                'code': 0,
                'message': '密码修改成功',
                'data': None
            }
        ),
        400: OpenApiExample('参数错误', value={'code': 1001, 'message': '原密码错误', 'data': None}),
    },
    tags=['个人中心']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """修改密码"""
    try:
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'code': 1001,
                'message': '参数错误',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        user = request.user
        
        # 验证原密码
        if not check_password(data['old_password'], user.password):
            return Response({
                'code': 1001,
                'message': '原密码错误',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 设置新密码
        user.set_password(data['new_password'])
        user.save(update_fields=['password'])
        
        # 记录审计日志
        audit_logger.log(
            request=request,
            action='change_password',
            target_type=audit_logger.TARGET_USER,
            target_id=user.id,
            details={
                'username': user.username
            }
        )
        
        return Response({
            'code': 0,
            'message': '密码修改成功',
            'data': None
        })
    
    except Exception as e:
        logger.error(f"修改密码失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'修改失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="查询用户权限",
    description="查询当前登录用户的角色和权限信息",
    responses={
        200: OpenApiExample(
            '查询成功',
            value={
                'code': 0,
                'message': '查询成功',
                'data': {
                    'roles': [
                        {
                            'id': 1,
                            'name': '系统管理员',
                            'description': '系统管理员角色'
                        }
                    ],
                    'permissions': [
                        {
                            'code': 'system.user.view',
                            'name': '查看用户',
                            'module': '系统管理'
                        },
                        {
                            'code': 'system.user.create',
                            'name': '创建用户',
                            'module': '系统管理'
                        }
                    ]
                }
            }
        ),
    },
    tags=['个人中心']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permissions_view(request):
    """查询用户权限"""
    try:
        user = request.user
        
        # 获取用户角色
        roles = user.roles.filter(is_active=True).values('id', 'name', 'description')
        
        # 获取用户权限
        permissions = user.get_permissions().values('code', 'name', 'module')
        
        return Response({
            'code': 0,
            'message': '查询成功',
            'data': {
                'roles': list(roles),
                'permissions': list(permissions)
            }
        })
    
    except Exception as e:
        logger.error(f"查询用户权限失败: {e}", exc_info=True)
        return Response({
            'code': 1000,
            'message': f'查询失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)