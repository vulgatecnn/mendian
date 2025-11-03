"""
系统首页相关视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.utils import timezone
import logging

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .services.todo_service import TodoService
from .permissions import permission_required
from notification.models import Message

logger = logging.getLogger(__name__)


@extend_schema_view(
    todos=extend_schema(
        summary="获取待办事项",
        description="获取当前用户的待办事项列表，包括待审批、合同提醒、工程里程碑等。",
        responses={
            200: OpenApiExample(
                '获取成功',
                value={
                    'code': 0,
                    'message': '获取待办事项成功',
                    'data': {
                        'total_count': 5,
                        'high_priority_count': 2,
                        'todos': [
                            {
                                'type': 'approval',
                                'title': '待审批',
                                'count': 3,
                                'link': '/approval/my-pending/',
                                'description': '您有 3 个待审批事项需要处理',
             