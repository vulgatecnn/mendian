#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django

# 设置 Django 环境
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
django.setup()

from system_management.models import User, Department
from base_data.models import BusinessRegion, LegalEntity
import random

print('生成基础测试数据...\n')

# 创建部门
print('创建部门...')
dept_ops, _ = Department.objects.get_or_create(
    name='运营中心',
    defaults={'wechat_dept_id': 1001}
)
dept_exp, _ = Department.objects.get_or_create(
    name='拓展部',
    defaults={'wechat_dept_id': 1002}
)
print(f'  部门数量: {Department.objects.count()}')

# 创建测试用户
print('\n创建测试用户...')
if not User.objects.filter(username='test_user').exists():
    User.objects.create_user(
        username='test_user',
        password='test123',
        first_name='测试用户',
        phone='13800138001',
        department=dept_ops,
        wechat_user_id='test_wechat'
    )
print(f'  用户数量: {User.objects.count()}')

# 创建区域
print('\n创建经营区域...')
BusinessRegion.objects.get_or_create(code='HD', defaults={'name': '华东区'})
BusinessRegion.objects.get_or_create(code='HN', defaults={'name': '华南区'})
print(f'  区域数量: {BusinessRegion.objects.count()}')

# 创建法人主体
print('\n创建法人主体...')
LegalEntity.objects.get_or_create(
    name='好饭碗餐饮管理有限公司',
    defaults={
        'code': 'LE001',
        'credit_code': '91310000123456789X',
        'legal_representative': '张三',
        'contact_phone': '021-12345678'
    }
)
print(f'  法人主体数量: {LegalEntity.objects.count()}')

print('\n✓ 测试数据生成完成！')
