"""
系统管理模块视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils.decorators import method_decorator
from django.db.models import Q
import logging

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import Department, User, Role, Permission, AuditLog
from .serializers import (
    DepartmentSerializer,
    DepartmentSimpleSerializer,
    UserSerializer,
    UserSimpleSerializer,
    RoleSerializer,
    PermissionSerializer,
    AuditLogSerializer,
)
from .services.wechat_department import department_service
from .services.wechat_user import user_service
from .services.audit_service import audit_logger
from .permissions import permission_required

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="获取部门列表",
        description="获取部门列表，支持按父部门筛选。需要 system.department.view 权限。",
        parameters=[
            OpenApiParameter(
                name='parent_id',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='父部门ID，0或null表示查询根部门',
                required=False,
                examples=[
                    OpenApiExample('查询根部门', value='0'),
                    OpenApiExample('查询指定父部门', value='1'),
                ]
            ),
        ],
        responses={
            200: DepartmentSimpleSerializer(many=True),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['部门管理']
    ),
    retrieve=extend_schema(
        summary="获取部门详情",
        description="根据部门ID获取部门详细信息，包含子部门。需要 system.department.view 权限。",
        responses={
            200: DepartmentSerializer,
            404: OpenApiExample('部门不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['部门管理']
    ),
    create=extend_schema(
        summary="创建部门",
        description="创建新部门。需要 system.department.create 权限。",
        request=DepartmentSerializer,
        responses={
            201: DepartmentSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['部门管理']
    ),
    update=extend_schema(
        summary="更新部门",
        description="更新部门信息。需要 system.department.update 权限。",
        request=DepartmentSerializer,
        responses={
            200: DepartmentSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            404: OpenApiExample('部门不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['部门管理']
    ),
    partial_update=extend_schema(
        summary="部分更新部门",
        description="部分更新部门信息。需要 system.department.update 权限。",
        request=DepartmentSerializer,
        responses={
            200: DepartmentSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            404: OpenApiExample('部门不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['部门管理']
    ),
    destroy=extend_schema(
        summary="删除部门",
        description="删除部门。需要 system.department.delete 权限。",
        responses={
            204: OpenApiExample('删除成功', value=None),
            404: OpenApiExample('部门不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['部门管理']
    ),
)
class DepartmentViewSet(viewsets.ModelViewSet):
    """
    部门管理 ViewSet
    
    提供部门的 CRUD 操作和企业微信同步功能
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """
        根据不同的 action 返回不同的序列化器
        """
        if self.action == 'list':
            # 列表查询使用简单序列化器（不包含子部门）
            return DepartmentSimpleSerializer
        return DepartmentSerializer
    
    def get_queryset(self):
        """
        获取查询集
        支持按父部门筛选
        优化：使用 select_related 预加载父部门信息
        """
        queryset = Department.objects.select_related('parent')
        
        # 按父部门筛选
        parent_id = self.request.query_params.get('parent_id', None)
        if parent_id is not None:
            if parent_id == '0' or parent_id == 'null':
                # 查询根部门
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
        
        return queryset.order_by('order', 'id')
    
    @method_decorator(permission_required('system.department.view'))
    def list(self, request, *args, **kwargs):
        """
        获取部门列表
        
        查询参数：
        - parent_id: 父部门ID（可选，0或null表示查询根部门）
        
        权限：system.department.view
        """
        return super().list(request, *args, **kwargs)
    
    @method_decorator(permission_required('system.department.view'))
    def retrieve(self, request, *args, **kwargs):
        """
        获取部门详情
        
        权限：system.department.view
        """
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="获取部门树形结构",
        description="获取完整的部门树形结构，包含所有层级的部门。使用缓存提高性能。需要 system.department.view 权限。",
        responses={
            200: OpenApiExample(
                '获取成功',
                value={
                    'code': 0,
                    'message': '获取部门树成功',
                    'data': [
                        {
                            'id': 1,
                            'name': '总公司',
                            'parent': None,
                            'children': [
                                {
                                    'id': 2,
                                    'name': '技术部',
                                    'parent': 1,
                                    'children': []
                                }
                            ]
                        }
                    ]
                }
            ),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
            500: OpenApiExample('服务器错误', value={'code': 1000, 'message': '获取部门树失败', 'data': None}),
        },
        tags=['部门管理']
    )
    @action(detail=False, methods=['get'], url_path='tree')
    @method_decorator(permission_required('system.department.view'))
    def tree(self, request):
        """
        获取部门树形结构
        
        返回完整的部门树形结构，包含所有层级的部门
        使用缓存提高性能
        
        权限：system.department.view
        """
        try:
            from .services.cache_service import cache_service
            
            # 尝试从缓存获取部门树
            cached_tree = cache_service.get_department_tree()
            if cached_tree:
                return Response({
                    'code': 0,
                    'message': '获取部门树成功（缓存）',
                    'data': cached_tree
                })
            
            # 缓存未命中，从数据库查询
            # 获取根部门（parent 为 None）
            # 优化：使用 prefetch_related 预加载所有子部门，减少数据库查询次数
            root_departments = Department.objects.filter(
                parent__isnull=True
            ).prefetch_related(
                'children',
                'children__children',
                'children__children__children',  # 支持3级部门嵌套
                'children__children__children__children'  # 支持4级部门嵌套
            ).order_by('order', 'id')
            
            # 使用完整序列化器（包含子部门）
            serializer = DepartmentSerializer(
                root_departments,
                many=True,
                context={'request': request}
            )
            
            # 设置缓存
            tree_data = serializer.data
            cache_service.set_department_tree(tree_data)
            
            return Response({
                'code': 0,
                'message': '获取部门树成功',
                'data': tree_data
            })
            
        except Exception as e:
            logger.error(f"获取部门树失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'获取部门树失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="从企业微信同步部门",
        description="从企业微信API同步部门信息到系统。可以指定同步特定部门或同步所有部门。需要 system.department.sync 权限。",
        request=OpenApiExample(
            '同步请求',
            value={
                'department_id': 1  # 可选，指定同步的部门ID，不传则同步所有部门
            }
        ),
        responses={
            200: OpenApiExample(
                '同步成功',
                value={
                    'code': 0,
                    'message': '同步成功',
                    'data': {
                        'total': 10,
                        'created': 3,
                        'updated': 5,
                        'failed': 2
                    }
                }
            ),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
            500: OpenApiExample(
                '同步失败',
                value={
                    'code': 2003,
                    'message': '同步失败',
                    'data': {
                        'errors': ['企业微信API调用失败']
                    }
                }
            ),
        },
        tags=['部门管理']
    )
    @action(detail=False, methods=['post'], url_path='sync_from_wechat')
    @method_decorator(permission_required('system.department.sync'))
    def sync_from_wechat(self, request):
        """
        从企业微信同步部门
        
        请求体（可选）：
        {
            "department_id": 1  // 指定同步的部门ID，不传则同步所有部门
        }
        
        权限：system.department.sync
        """
        try:
            # 获取请求参数
            department_id = request.data.get('department_id', None)
            
            logger.info(f"开始从企业微信同步部门，department_id={department_id}")
            
            # 调用同步服务
            result = department_service.sync_departments(department_id)
            
            if result['success']:
                # 同步成功后清除部门树缓存
                from .services.cache_service import cache_service
                cache_service.clear_department_tree()
                
                return Response({
                    'code': 0,
                    'message': '同步成功',
                    'data': {
                        'total': result['total'],
                        'created': result['created'],
                        'updated': result['updated'],
                        'failed': result['failed'],
                    }
                })
            else:
                return Response({
                    'code': 2003,
                    'message': '同步失败',
                    'data': {
                        'errors': result['errors']
                    }
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"从企业微信同步部门失败: {e}", exc_info=True)
            return Response({
                'code': 2003,
                'message': f'同步失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class StandardResultsSetPagination(PageNumberPagination):
    """标准分页器"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema_view(
    list=extend_schema(
        summary="获取用户列表",
        description="获取用户列表，支持分页和多条件筛选。需要 system.user.view 权限。",
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='搜索关键词（用户名、姓名、手机号）',
                required=False,
            ),
            OpenApiParameter(
                name='department_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='部门ID筛选',
                required=False,
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='启用状态筛选',
                required=False,
            ),
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='页码',
                required=False,
            ),
            OpenApiParameter(
                name='page_size',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='每页数量（最大100）',
                required=False,
            ),
        ],
        responses={
            200: UserSimpleSerializer(many=True),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['用户管理']
    ),
    retrieve=extend_schema(
        summary="获取用户详情",
        description="根据用户ID获取用户详细信息，包含部门和角色信息。需要 system.user.view 权限。",
        responses={
            200: UserSerializer,
            404: OpenApiExample('用户不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['用户管理']
    ),
    create=extend_schema(
        summary="创建用户",
        description="创建新用户。需要 system.user.create 权限。",
        request=UserSerializer,
        responses={
            201: UserSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['用户管理']
    ),
    update=extend_schema(
        summary="更新用户",
        description="更新用户信息。需要 system.user.update 权限。",
        request=UserSerializer,
        responses={
            200: UserSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            404: OpenApiExample('用户不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['用户管理']
    ),
    partial_update=extend_schema(
        summary="部分更新用户",
        description="部分更新用户信息。需要 system.user.update 权限。",
        request=UserSerializer,
        responses={
            200: UserSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            404: OpenApiExample('用户不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['用户管理']
    ),
    destroy=extend_schema(
        summary="删除用户",
        description="删除用户。需要 system.user.delete 权限。",
        responses={
            204: OpenApiExample('删除成功', value=None),
            404: OpenApiExample('用户不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['用户管理']
    ),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    用户管理 ViewSet
    
    提供用户的 CRUD 操作、企业微信同步、启用/停用、角色分配等功能
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        """
        根据不同的 action 返回不同的序列化器
        """
        if self.action == 'list':
            # 列表查询使用简单序列化器
            return UserSimpleSerializer
        return UserSerializer
    
    def get_queryset(self):
        """
        获取查询集
        支持按姓名、部门、状态筛选
        优化：使用 select_related 和 prefetch_related 预加载关联数据
        """
        queryset = User.objects.select_related(
            'department',
            'department__parent'  # 预加载部门的父部门信息
        ).prefetch_related(
            'roles',
            'roles__permissions'  # 预加载角色的权限信息
        )
        
        # 按姓名筛选（支持用户名、姓名模糊查询）
        name = self.request.query_params.get('name', None)
        if name:
            queryset = queryset.filter(
                Q(username__icontains=name) |
                Q(first_name__icontains=name) |
                Q(last_name__icontains=name)
            )
        
        # 按部门筛选
        department_id = self.request.query_params.get('department_id', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # 按状态筛选
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            # 转换为布尔值
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('-created_at')
    
    @method_decorator(permission_required('system.user.view'))
    def list(self, request, *args, **kwargs):
        """
        获取用户列表
        
        查询参数：
        - name: 姓名（可选，支持模糊查询）
        - department_id: 部门ID（可选）
        - is_active: 启用状态（可选，true/false）
        - page: 页码（可选，默认1）
        - page_size: 每页数量（可选，默认20，最大100）
        
        权限：system.user.view
        """
        return super().list(request, *args, **kwargs)
    
    @method_decorator(permission_required('system.user.view'))
    def retrieve(self, request, *args, **kwargs):
        """
        获取用户详情
        
        权限：system.user.view
        """
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="从企业微信同步用户",
        description="从企业微信API同步用户信息到系统。可以指定同步特定部门或同步所有部门的用户。需要 system.user.sync 权限。",
        request=OpenApiExample(
            '同步请求',
            value={
                'department_id': 1,  # 可选，指定同步的部门ID，不传则同步所有部门
                'fetch_child': True  # 可选，是否递归获取子部门的用户，默认true
            }
        ),
        responses={
            200: OpenApiExample(
                '同步成功',
                value={
                    'code': 0,
                    'message': '同步成功',
                    'data': {
                        'total': 50,
                        'created': 10,
                        'updated': 35,
                        'failed': 5
                    }
                }
            ),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
            500: OpenApiExample(
                '同步失败',
                value={
                    'code': 2003,
                    'message': '同步失败',
                    'data': {
                        'errors': ['企业微信API调用失败']
                    }
                }
            ),
        },
        tags=['用户管理']
    )
    @action(detail=False, methods=['post'], url_path='sync_from_wechat')
    @method_decorator(permission_required('system.user.sync'))
    def sync_from_wechat(self, request):
        """
        从企业微信同步用户
        
        请求体（可选）：
        {
            "department_id": 1,  // 指定同步的部门ID，不传则同步所有部门
            "fetch_child": true  // 是否递归获取子部门的用户，默认true
        }
        
        权限：system.user.sync
        """
        try:
            # 获取请求参数
            department_id = request.data.get('department_id', None)
            fetch_child = request.data.get('fetch_child', True)
            
            logger.info(
                f"开始从企业微信同步用户，department_id={department_id}, "
                f"fetch_child={fetch_child}"
            )
            
            # 调用同步服务
            result = user_service.sync_users(department_id, fetch_child)
            
            if result['success']:
                # 记录审计日志
                audit_logger.log(
                    request=request,
                    action='sync',
                    target_type='user',
                    target_id=0,  # 批量操作，没有特定ID
                    details={
                        'department_id': department_id,
                        'total': result['total'],
                        'created': result['created'],
                        'updated': result['updated'],
                        'failed': result['failed'],
                    }
                )
                
                return Response({
                    'code': 0,
                    'message': '同步成功',
                    'data': {
                        'total': result['total'],
                        'created': result['created'],
                        'updated': result['updated'],
                        'failed': result['failed'],
                    }
                })
            else:
                return Response({
                    'code': 2003,
                    'message': '同步失败',
                    'data': {
                        'errors': result['errors']
                    }
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"从企业微信同步用户失败: {e}", exc_info=True)
            return Response({
                'code': 2003,
                'message': f'同步失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="启用/停用用户",
        description="启用或停用指定用户。可以指定目标状态或切换当前状态。需要 system.user.manage 权限。",
        request=OpenApiExample(
            '状态切换请求',
            value={
                'is_active': True  # 可选，目标状态，不传则切换当前状态
            }
        ),
        responses={
            200: OpenApiExample(
                '操作成功',
                value={
                    'code': 0,
                    'message': '操作成功',
                    'data': {
                        'id': 1,
                        'username': 'testuser',
                        'is_active': True
                    }
                }
            ),
            404: OpenApiExample('用户不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
            500: OpenApiExample('操作失败', value={'code': 1000, 'message': '操作失败', 'data': None}),
        },
        tags=['用户管理']
    )
    @action(detail=True, methods=['post'], url_path='toggle_status')
    @method_decorator(permission_required('system.user.manage'))
    def toggle_status(self, request, pk=None):
        """
        启用/停用用户
        
        请求体（可选）：
        {
            "is_active": true  // 目标状态，不传则切换当前状态
        }
        
        权限：system.user.manage
        """
        try:
            user = self.get_object()
            
            # 获取目标状态
            target_status = request.data.get('is_active', None)
            if target_status is None:
                # 如果没有指定状态，则切换当前状态
                target_status = not user.is_active
            
            # 更新用户状态
            old_status = user.is_active
            user.is_active = target_status
            user.save(update_fields=['is_active'])
            
            # 记录审计日志
            action = audit_logger.ACTION_ENABLE if target_status else audit_logger.ACTION_DISABLE
            audit_logger.log(
                request=request,
                action=action,
                target_type=audit_logger.TARGET_USER,
                target_id=user.id,
                details={
                    'username': user.username,
                    'old_status': old_status,
                    'new_status': target_status,
                }
            )
            
            logger.info(
                f"用户 {user.username} 状态已更新: "
                f"{old_status} -> {target_status}"
            )
            
            return Response({
                'code': 0,
                'message': '操作成功',
                'data': {
                    'id': user.id,
                    'username': user.username,
                    'is_active': user.is_active,
                }
            })
            
        except Exception as e:
            logger.error(f"切换用户状态失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'操作失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="分配用户角色",
        description="为指定用户分配角色。会替换用户当前的所有角色。需要 system.user.manage 权限。",
        request=OpenApiExample(
            '角色分配请求',
            value={
                'role_ids': [1, 2, 3]  # 角色ID列表
            }
        ),
        responses={
            200: OpenApiExample(
                '分配成功',
                value={
                    'code': 0,
                    'message': '角色分配成功',
                    'data': {
                        'id': 1,
                        'username': 'testuser',
                        'roles': [
                            {'id': 1, 'name': '系统管理员'},
                            {'id': 2, 'name': '普通用户'}
                        ]
                    }
                }
            ),
            400: OpenApiExample('参数错误', value={'code': 1001, 'message': 'role_ids 必须是数组', 'data': None}),
            404: OpenApiExample('用户不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
            500: OpenApiExample('分配失败', value={'code': 1000, 'message': '分配失败', 'data': None}),
        },
        tags=['用户管理']
    )
    @action(detail=True, methods=['post'], url_path='assign_roles')
    @method_decorator(permission_required('system.user.manage'))
    def assign_roles(self, request, pk=None):
        """
        分配角色
        
        请求体：
        {
            "role_ids": [1, 2, 3]  // 角色ID列表
        }
        
        权限：system.user.manage
        """
        try:
            user = self.get_object()
            
            # 获取角色ID列表
            role_ids = request.data.get('role_ids', [])
            if not isinstance(role_ids, list):
                return Response({
                    'code': 1001,
                    'message': 'role_ids 必须是数组',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证角色是否存在
            roles = Role.objects.filter(id__in=role_ids)
            if roles.count() != len(role_ids):
                return Response({
                    'code': 4001,
                    'message': '部分角色不存在',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 记录旧角色
            old_role_ids = list(user.roles.values_list('id', flat=True))
            old_role_names = list(user.roles.values_list('name', flat=True))
            
            # 更新用户角色
            user.roles.set(roles)
            
            # 清除用户权限缓存
            user.clear_permission_cache()
            
            # 记录审计日志
            new_role_names = list(roles.values_list('name', flat=True))
            audit_logger.log_role_assign(
                request=request,
                user_id=user.id,
                details={
                    'username': user.username,
                    'old_roles': old_role_names,
                    'new_roles': new_role_names,
                }
            )
            
            logger.info(
                f"用户 {user.username} 的角色已更新: "
                f"{old_role_ids} -> {role_ids}"
            )
            
            return Response({
                'code': 0,
                'message': '角色分配成功',
                'data': {
                    'id': user.id,
                    'username': user.username,
                    'roles': [{'id': r.id, 'name': r.name} for r in roles],
                }
            })
            
        except Exception as e:
            logger.error(f"分配角色失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'操作失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@extend_schema_view(
    list=extend_schema(
        summary="获取角色列表",
        description="获取角色列表，支持按名称和状态筛选。需要 system.role.view 权限。",
        parameters=[
            OpenApiParameter(
                name='name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='角色名称（支持模糊查询）',
                required=False,
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='启用状态筛选',
                required=False,
            ),
        ],
        responses={
            200: RoleSerializer(many=True),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['角色管理']
    ),
    retrieve=extend_schema(
        summary="获取角色详情",
        description="根据角色ID获取角色详细信息，包含权限和成员信息。需要 system.role.view 权限。",
        responses={
            200: RoleSerializer,
            404: OpenApiExample('角色不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['角色管理']
    ),
    create=extend_schema(
        summary="创建角色",
        description="创建新角色，可以同时分配权限。需要 system.role.manage 权限。",
        request=OpenApiExample(
            '创建角色请求',
            value={
                'name': '系统管理员',
                'description': '系统管理员角色',
                'is_active': True,
                'permission_ids': [1, 2, 3]  # 可选，权限ID列表
            }
        ),
        responses={
            201: RoleSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['角色管理']
    ),
    update=extend_schema(
        summary="更新角色",
        description="更新角色信息。需要 system.role.manage 权限。",
        request=RoleSerializer,
        responses={
            200: RoleSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            404: OpenApiExample('角色不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['角色管理']
    ),
    partial_update=extend_schema(
        summary="部分更新角色",
        description="部分更新角色信息。需要 system.role.manage 权限。",
        request=RoleSerializer,
        responses={
            200: RoleSerializer,
            400: OpenApiExample('参数错误', value={'detail': '参数错误'}),
            404: OpenApiExample('角色不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['角色管理']
    ),
    destroy=extend_schema(
        summary="删除角色",
        description="删除角色。如果角色已被用户使用，则无法删除。需要 system.role.manage 权限。",
        responses={
            204: OpenApiExample('删除成功', value=None),
            400: OpenApiExample('角色被使用', value={'code': 4002, 'message': '角色正在被使用，无法删除', 'data': None}),
            404: OpenApiExample('角色不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['角色管理']
    ),
)
class RoleViewSet(viewsets.ModelViewSet):
    """
    角色管理 ViewSet
    
    提供角色的 CRUD 操作、权限分配、成员管理等功能
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        获取查询集
        支持按名称、状态筛选
        优化：使用 prefetch_related 预加载权限和用户信息
        """
        queryset = Role.objects.prefetch_related(
            'permissions',
            'users',
            'users__department'  # 预加载用户的部门信息
        )
        
        # 按名称筛选（模糊查询）
        name = self.request.query_params.get('name', None)
        if name:
            queryset = queryset.filter(name__icontains=name)
        
        # 按状态筛选
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('-created_at')
    
    @method_decorator(permission_required('system.role.view'))
    def list(self, request, *args, **kwargs):
        """
        获取角色列表
        
        查询参数：
        - name: 角色名称（可选，支持模糊查询）
        - is_active: 启用状态（可选，true/false）
        
        权限：system.role.view
        """
        return super().list(request, *args, **kwargs)
    
    @method_decorator(permission_required('system.role.manage'))
    def create(self, request, *args, **kwargs):
        """
        创建角色
        
        请求体：
        {
            "name": "角色名称",
            "description": "角色描述",
            "is_active": true,
            "permission_ids": [1, 2, 3]  // 可选，权限ID列表
        }
        
        权限：system.role.manage
        """
        try:
            response = super().create(request, *args, **kwargs)
            
            # 记录审计日志
            if response.status_code == status.HTTP_201_CREATED:
                role_id = response.data.get('id')
                role_name = response.data.get('name')
                
                audit_logger.log(
                    request=request,
                    action=audit_logger.ACTION_CREATE,
                    target_type=audit_logger.TARGET_ROLE,
                    target_id=role_id,
                    details={
                        'name': role_name,
                        'description': response.data.get('description', ''),
                    }
                )
                
                logger.info(f"角色 {role_name} 创建成功，ID: {role_id}")
            
            return response
            
        except Exception as e:
            logger.error(f"创建角色失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'创建失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @method_decorator(permission_required('system.role.view'))
    def retrieve(self, request, *args, **kwargs):
        """
        获取角色详情
        
        权限：system.role.view
        """
        return super().retrieve(request, *args, **kwargs)
    
    @method_decorator(permission_required('system.role.manage'))
    def update(self, request, *args, **kwargs):
        """
        更新角色
        
        请求体：
        {
            "name": "角色名称",
            "description": "角色描述",
            "is_active": true,
            "permission_ids": [1, 2, 3]  // 可选，权限ID列表
        }
        
        权限：system.role.manage
        """
        try:
            role = self.get_object()
            old_name = role.name
            
            response = super().update(request, *args, **kwargs)
            
            # 记录审计日志
            if response.status_code == status.HTTP_200_OK:
                audit_logger.log(
                    request=request,
                    action=audit_logger.ACTION_UPDATE,
                    target_type=audit_logger.TARGET_ROLE,
                    target_id=role.id,
                    details={
                        'old_name': old_name,
                        'new_name': response.data.get('name'),
                        'description': response.data.get('description', ''),
                    }
                )
                
                logger.info(f"角色 {role.name} 更新成功")
            
            return response
            
        except Exception as e:
            logger.error(f"更新角色失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'更新失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @method_decorator(permission_required('system.role.manage'))
    def destroy(self, request, *args, **kwargs):
        """
        删除角色
        
        需要验证角色是否被使用（是否有用户关联）
        
        权限：system.role.manage
        """
        try:
            role = self.get_object()
            
            # 检查角色是否被使用
            if role.is_in_use():
                return Response({
                    'code': 4002,
                    'message': f'角色 {role.name} 正在被使用，无法删除',
                    'data': {
                        'member_count': role.get_member_count()
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 记录角色信息用于审计日志
            role_id = role.id
            role_name = role.name
            
            # 删除角色
            response = super().destroy(request, *args, **kwargs)
            
            # 记录审计日志
            if response.status_code == status.HTTP_204_NO_CONTENT:
                audit_logger.log(
                    request=request,
                    action=audit_logger.ACTION_DELETE,
                    target_type=audit_logger.TARGET_ROLE,
                    target_id=role_id,
                    details={
                        'name': role_name,
                    }
                )
                
                logger.info(f"角色 {role_name} 删除成功")
            
            return response
            
        except Exception as e:
            logger.error(f"删除角色失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'删除失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="分配角色权限",
        description="为指定角色分配权限。会替换角色当前的所有权限。需要 system.role.manage 权限。",
        request=OpenApiExample(
            '权限分配请求',
            value={
                'permission_ids': [1, 2, 3]  # 权限ID列表
            }
        ),
        responses={
            200: OpenApiExample(
                '分配成功',
                value={
                    'code': 0,
                    'message': '权限分配成功',
                    'data': {
                        'id': 1,
                        'name': '系统管理员',
                        'permissions': [
                            {'id': 1, 'name': '用户管理', 'code': 'system.user.manage'},
                            {'id': 2, 'name': '角色管理', 'code': 'system.role.manage'}
                        ]
                    }
                }
            ),
            400: OpenApiExample('参数错误', value={'code': 1001, 'message': 'permission_ids 必须是数组', 'data': None}),
            404: OpenApiExample('角色不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
            500: OpenApiExample('分配失败', value={'code': 1000, 'message': '分配失败', 'data': None}),
        },
        tags=['角色管理']
    )
    @action(detail=True, methods=['post'], url_path='assign_permissions')
    @method_decorator(permission_required('system.role.manage'))
    def assign_permissions(self, request, pk=None):
        """
        分配权限
        
        请求体：
        {
            "permission_ids": [1, 2, 3]  // 权限ID列表
        }
        
        权限：system.role.manage
        """
        try:
            role = self.get_object()
            
            # 获取权限ID列表
            permission_ids = request.data.get('permission_ids', [])
            if not isinstance(permission_ids, list):
                return Response({
                    'code': 1001,
                    'message': 'permission_ids 必须是数组',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证权限是否存在
            permissions = Permission.objects.filter(id__in=permission_ids)
            if permissions.count() != len(permission_ids):
                return Response({
                    'code': 1001,
                    'message': '部分权限不存在',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 记录旧权限
            old_permission_codes = list(role.permissions.values_list('code', flat=True))
            
            # 更新角色权限
            role.permissions.set(permissions)
            
            # 清除所有拥有此角色的用户的权限缓存
            role._clear_users_permission_cache()
            
            # 记录审计日志
            new_permission_codes = list(permissions.values_list('code', flat=True))
            audit_logger.log(
                request=request,
                action='assign_permissions',
                target_type=audit_logger.TARGET_ROLE,
                target_id=role.id,
                details={
                    'role_name': role.name,
                    'old_permissions': old_permission_codes,
                    'new_permissions': new_permission_codes,
                }
            )
            
            logger.info(f"角色 {role.name} 的权限已更新")
            
            # 返回更新后的角色信息
            serializer = self.get_serializer(role)
            return Response({
                'code': 0,
                'message': '权限分配成功',
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"分配权限失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'操作失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'], url_path='members')
    @method_decorator(permission_required('system.role.view'))
    def members(self, request, pk=None):
        """
        获取角色成员列表
        
        权限：system.role.view
        """
        try:
            role = self.get_object()
            
            # 获取角色成员
            # 优化：使用 select_related 预加载部门信息
            users = role.users.select_related('department').all()
            
            # 序列化用户信息
            user_serializer = UserSimpleSerializer(users, many=True)
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': {
                    'role_id': role.id,
                    'role_name': role.name,
                    'member_count': users.count(),
                    'members': user_serializer.data
                }
            })
            
        except Exception as e:
            logger.error(f"获取角色成员失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'获取失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], url_path='add_members')
    @method_decorator(permission_required('system.role.manage'))
    def add_members(self, request, pk=None):
        """
        添加角色成员
        
        请求体：
        {
            "user_ids": [1, 2, 3]  // 用户ID列表
        }
        
        权限：system.role.manage
        """
        try:
            role = self.get_object()
            
            # 获取用户ID列表
            user_ids = request.data.get('user_ids', [])
            if not isinstance(user_ids, list):
                return Response({
                    'code': 1001,
                    'message': 'user_ids 必须是数组',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证用户是否存在
            users = User.objects.filter(id__in=user_ids)
            if users.count() != len(user_ids):
                return Response({
                    'code': 3001,
                    'message': '部分用户不存在',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 添加用户到角色
            role.add_users(user_ids)
            
            # 记录审计日志
            user_names = list(users.values_list('username', flat=True))
            audit_logger.log(
                request=request,
                action='add_members',
                target_type=audit_logger.TARGET_ROLE,
                target_id=role.id,
                details={
                    'role_name': role.name,
                    'added_users': user_names,
                }
            )
            
            logger.info(f"角色 {role.name} 添加了 {len(user_ids)} 个成员")
            
            return Response({
                'code': 0,
                'message': '添加成功',
                'data': {
                    'role_id': role.id,
                    'role_name': role.name,
                    'added_count': len(user_ids),
                    'total_members': role.get_member_count(),
                }
            })
            
        except Exception as e:
            logger.error(f"添加角色成员失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'操作失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@extend_schema_view(
    list=extend_schema(
        summary="获取审计日志列表",
        description="获取审计日志列表，支持多条件筛选和分页。仅管理员可查看。需要 system.audit.view 权限。",
        parameters=[
            OpenApiParameter(
                name='user_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='操作人用户ID筛选',
                required=False,
            ),
            OpenApiParameter(
                name='username',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='操作人用户名筛选（支持模糊查询）',
                required=False,
            ),
            OpenApiParameter(
                name='action',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='操作类型筛选',
                required=False,
            ),
            OpenApiParameter(
                name='target_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='操作对象类型筛选',
                required=False,
            ),
            OpenApiParameter(
                name='start_time',
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY,
                description='开始时间筛选（ISO格式）',
                required=False,
            ),
            OpenApiParameter(
                name='end_time',
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY,
                description='结束时间筛选（ISO格式）',
                required=False,
            ),
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='页码',
                required=False,
            ),
            OpenApiParameter(
                name='page_size',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='每页数量（最大100）',
                required=False,
            ),
        ],
        responses={
            200: AuditLogSerializer(many=True),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['审计日志']
    ),
    retrieve=extend_schema(
        summary="获取审计日志详情",
        description="根据日志ID获取审计日志详细信息。需要 system.audit.view 权限。",
        responses={
            200: AuditLogSerializer,
            404: OpenApiExample('日志不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['审计日志']
    ),
)
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    审计日志 ViewSet
    
    提供审计日志的查询功能（只读）
    仅管理员可查看
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """
        获取查询集
        支持按操作人、时间、操作类型筛选
        优化：使用 select_related 预加载用户和部门信息
        """
        queryset = AuditLog.objects.select_related(
            'user',
            'user__department',
            'user__department__parent'  # 预加载用户部门的父部门信息
        )
        
        # 按操作人筛选（用户ID）
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # 按操作人筛选（用户名，模糊查询）
        username = self.request.query_params.get('username', None)
        if username:
            queryset = queryset.filter(user__username__icontains=username)
        
        # 按操作类型筛选
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)
        
        # 按操作对象类型筛选
        target_type = self.request.query_params.get('target_type', None)
        if target_type:
            queryset = queryset.filter(target_type=target_type)
        
        # 按时间范围筛选（开始时间）
        start_time = self.request.query_params.get('start_time', None)
        if start_time:
            queryset = queryset.filter(created_at__gte=start_time)
        
        # 按时间范围筛选（结束时间）
        end_time = self.request.query_params.get('end_time', None)
        if end_time:
            queryset = queryset.filter(created_at__lte=end_time)
        
        return queryset.order_by('-created_at')
    
    @method_decorator(permission_required('system.audit.view'))
    def list(self, request, *args, **kwargs):
        """
        获取审计日志列表
        
        查询参数：
        - user_id: 操作人ID（可选）
        - username: 操作人用户名（可选，支持模糊查询）
        - action: 操作类型（可选，如 'create', 'update', 'delete'）
        - target_type: 操作对象类型（可选，如 'user', 'role'）
        - start_time: 开始时间（可选，ISO 8601格式）
        - end_time: 结束时间（可选，ISO 8601格式）
        - page: 页码（可选，默认1）
        - page_size: 每页数量（可选，默认20，最大100）
        
        权限：system.audit.view（仅管理员）
        """
        return super().list(request, *args, **kwargs)
    
    @method_decorator(permission_required('system.audit.view'))
    def retrieve(self, request, *args, **kwargs):
        """
        获取审计日志详情
        
        权限：system.audit.view（仅管理员）
        """
        return super().retrieve(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(
        summary="获取权限列表",
        description="获取权限列表，支持按模块筛选和分组。需要 system.permission.view 权限。",
        parameters=[
            OpenApiParameter(
                name='module',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='模块名称筛选',
                required=False,
            ),
            OpenApiParameter(
                name='group_by_module',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='是否按模块分组返回',
                required=False,
            ),
        ],
        responses={
            200: OpenApiExample(
                '获取成功',
                value={
                    'code': 0,
                    'message': '获取权限列表成功',
                    'data': {
                        '系统管理': [
                            {'id': 1, 'name': '用户管理', 'code': 'system.user.manage'},
                            {'id': 2, 'name': '角色管理', 'code': 'system.role.manage'}
                        ],
                        '门店管理': [
                            {'id': 3, 'name': '门店查看', 'code': 'store.view'}
                        ]
                    }
                }
            ),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['权限管理']
    ),
    retrieve=extend_schema(
        summary="获取权限详情",
        description="根据权限ID获取权限详细信息。需要 system.permission.view 权限。",
        responses={
            200: PermissionSerializer,
            404: OpenApiExample('权限不存在', value={'detail': '未找到'}),
            403: OpenApiExample('权限不足', value={'detail': '权限不足'}),
        },
        tags=['权限管理']
    ),
)
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    权限管理 ViewSet
    
    提供权限的查询功能（只读）
    支持按模块分组和缓存
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        获取查询集
        支持按模块筛选
        """
        queryset = Permission.objects.all()
        
        # 按模块筛选
        module = self.request.query_params.get('module', None)
        if module:
            queryset = queryset.filter(module=module)
        
        return queryset.order_by('module', 'code')
    
    @method_decorator(permission_required('system.permission.view'))
    def list(self, request, *args, **kwargs):
        """
        获取权限列表
        
        查询参数：
        - module: 模块名称（可选）
        - group_by_module: 是否按模块分组（可选，true/false）
        
        权限：system.permission.view
        """
        try:
            from .services.cache_service import cache_service
            
            # 检查是否需要按模块分组
            group_by_module = request.query_params.get('group_by_module', 'false').lower() == 'true'
            module_filter = request.query_params.get('module', None)
            
            if group_by_module and not module_filter:
                # 按模块分组返回，尝试从缓存获取
                cached_permissions = cache_service.get_permission_list()
                if cached_permissions:
                    return Response({
                        'code': 0,
                        'message': '获取权限列表成功（缓存）',
                        'data': cached_permissions
                    })
                
                # 缓存未命中，从数据库查询并按模块分组
                permissions = Permission.objects.all().order_by('module', 'code')
                
                # 按模块分组
                grouped_permissions = {}
                for perm in permissions:
                    module_name = perm.module
                    if module_name not in grouped_permissions:
                        grouped_permissions[module_name] = []
                    
                    grouped_permissions[module_name].append({
                        'id': perm.id,
                        'code': perm.code,
                        'name': perm.name,
                        'description': perm.description,
                    })
                
                # 转换为列表格式
                result = []
                for module_name, perms in grouped_permissions.items():
                    result.append({
                        'module': module_name,
                        'permissions': perms,
                        'count': len(perms),
                    })
                
                # 设置缓存
                cache_service.set_permission_list(result)
                
                return Response({
                    'code': 0,
                    'message': '获取权限列表成功',
                    'data': result
                })
            else:
                # 普通列表查询
                return super().list(request, *args, **kwargs)
                
        except Exception as e:
            logger.error(f"获取权限列表失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'获取权限列表失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @method_decorator(permission_required('system.permission.view'))
    def retrieve(self, request, *args, **kwargs):
        """
        获取权限详情
        
        权限：system.permission.view
        """
        return super().retrieve(request, *args, **kwargs)


class CacheManagementViewSet(viewsets.ViewSet):
    """
    缓存管理 ViewSet
    
    提供缓存状态查看、清除等管理功能
    仅系统管理员可访问
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='stats')
    @method_decorator(permission_required('system.cache.view'))
    def stats(self, request):
        """
        获取缓存统计信息
        
        返回各类缓存的状态和统计信息
        
        权限：system.cache.view
        """
        try:
            from .services.cache_service import cache_service
            stats = cache_service.get_cache_stats()
            
            return Response({
                'code': 0,
                'message': '获取缓存统计成功',
                'data': {
                    'cache_stats': stats,
                    'cache_config': {
                        'department_tree_timeout': cache_service.DEPARTMENT_TREE_TIMEOUT,
                        'user_permissions_timeout': cache_service.USER_PERMISSIONS_TIMEOUT,
                        'wechat_token_timeout': cache_service.WECHAT_TOKEN_TIMEOUT,
                        'permission_list_timeout': cache_service.PERMISSION_LIST_TIMEOUT,
                    }
                }
            })
            
        except Exception as e:
            logger.error(f"获取缓存统计失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'获取缓存统计失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='clear')
    @method_decorator(permission_required('system.cache.manage'))
    def clear_cache(self, request):
        """
        清除缓存
        
        请求体：
        {
            "cache_type": "all|department_tree|user_permissions|wechat_token|permission_list",
            "user_id": 123  // 仅当 cache_type 为 user_permissions 时需要
        }
        
        权限：system.cache.manage
        """
        try:
            from .services.cache_service import cache_service
            
            cache_type = request.data.get('cache_type', 'all')
            user_id = request.data.get('user_id', None)
            
            success = False
            message = ""
            
            if cache_type == 'all':
                # 清除所有缓存
                success = cache_service.clear_all_cache()
                message = "所有缓存已清除" if success else "清除所有缓存失败"
                
            elif cache_type == 'department_tree':
                # 清除部门树缓存
                success = cache_service.clear_department_tree()
                message = "部门树缓存已清除" if success else "清除部门树缓存失败"
                
            elif cache_type == 'user_permissions':
                if user_id:
                    # 清除指定用户的权限缓存
                    success = cache_service.clear_user_permissions(user_id)
                    message = f"用户 {user_id} 权限缓存已清除" if success else f"清除用户 {user_id} 权限缓存失败"
                else:
                    # 清除所有用户权限缓存
                    success = cache_service.clear_all_user_permissions()
                    message = "所有用户权限缓存已清除" if success else "清除所有用户权限缓存失败"
                    
            elif cache_type == 'wechat_token':
                # 清除企微访问令牌缓存
                success = cache_service.clear_wechat_token()
                message = "企微访问令牌缓存已清除" if success else "清除企微访问令牌缓存失败"
                
            elif cache_type == 'permission_list':
                # 清除权限列表缓存
                success = cache_service.clear_permission_list()
                message = "权限列表缓存已清除" if success else "清除权限列表缓存失败"
                
            else:
                return Response({
                    'code': 1001,
                    'message': f'不支持的缓存类型: {cache_type}',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 记录审计日志
            audit_logger.log(
                request=request,
                action='clear_cache',
                target_type='cache',
                target_id=0,
                details={
                    'cache_type': cache_type,
                    'user_id': user_id,
                    'success': success,
                }
            )
            
            if success:
                return Response({
                    'code': 0,
                    'message': message,
                    'data': {
                        'cache_type': cache_type,
                        'user_id': user_id,
                    }
                })
            else:
                return Response({
                    'code': 1000,
                    'message': message,
                    'data': None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"清除缓存失败: {e}", exc_info=True)
            return Response({
                'code': 1000,
                'message': f'清除缓存失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
