#!/usr/bin/env python
"""
认证安全测试
测试认证系统的安全性，包括密码强度、Token安全、会话管理等
"""
import pytest
import time
from django.contrib.auth import get_user_model
from django.test import Client
from system_management.models import Department
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from django.utils import timezone

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=999,
        defaults={'name': '测试部门'}
    )
    return department


@pytest.fixture
def test_user(db, test_department):
    """创建测试用户"""
    user, created = User.objects.get_or_create(
        username='securitytest',
        defaults={
            'phone': '13900139000',
            'department': 