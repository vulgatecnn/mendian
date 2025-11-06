"""
简化的测试数据生成脚本
直接运行: python manage.py shell < scripts/generate_simple_test_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
import random

from system_management.models import User, Department
from base_data.models import BusinessRegion, LegalEntity, Supplier, Customer

print('开始生成测试数据...\n')

# 1. 创建部门
print('1. 创建部门...')
departments = []
dept_data = [
    {'name': '总裁办', 'code': 'CEO'},
    {'name': '运营中心', 'code': 'OPS'},
    {'name': '拓展部', 'code': 'EXP'},
    {'name': '工程部', 'code': 'ENG'},
    {'name': '财务部', 'code': 'FIN'},
]

for data in dept_data:
    dept, created = Department.objects.get_or_create(
        code=data['code'],
        defaults={'name': data['name'], 'description': f'{data["name"]}负责相关业务'}
    )
    departments.append(dept)
    if created:
        print(f'  ✓ 创建部门: {dept.name}')

# 2. 创建用户
print('\n2. 创建用户...')
user_data = [
    {'username': 'ceo', 'name': '张总', 'dept_code': 'CEO'},
    {'username': 'ops_manager', 'name': '李经理', 'dept_code': 'OPS'},
    {'username': 'exp_manager', 'name': '王经理', 'dept_code': 'EXP'},
    {'username': 'exp_staff1', 'name': '赵拓展', 'dept_code': 'EXP'},
    {'username': 'fin_manager', 'name': '吴经理', 'dept_code': 'FIN'},
]

dept_map = {d.code: d for d in departments}

for data in user_data:
    if not User.objects.filter(username=data['username']).exists():
        user = User.objects.create_user(
            username=data['username'],
            password='test123',
            first_name=data['name'],
            phone=f'138{random.randint(10000000, 99999999)}',
            department=dept_map.get(data['dept_code']),
            wechat_user_id=f'wechat_{data["username"]}'
        )
        print(f'  ✓ 创建用户: {user.first_name} ({user.username})')

# 3. 创建经营区域
print('\n3. 创建经营区域...')
region_data = [
    {'name': '华东区', 'code': 'HD'},
    {'name': '华南区', 'code': 'HN'},
    {'name': '华北区', 'code': 'HB'},
    {'name': '西南区', 'code': 'XN'},
]

for data in region_data:
    region, created = BusinessRegion.objects.get_or_create(
        code=data['code'],
        defaults={'name': data['name'], 'description': f'{data["name"]}业务区域'}
    )
    if created:
        print(f'  ✓ 创建区域: {region.name}')

# 4. 创建法人主体
print('\n4. 创建法人主体...')
entity_names = ['好饭碗餐饮管理有限公司', '好饭碗（上海）餐饮有限公司', '好饭碗（广州）餐饮有限公司']

for name in entity_names:
    if not LegalEntity.objects.filter(name=name).exists():
        entity = LegalEntity.objects.create(
            name=name,
            code=f'LE{random.randint(1000, 9999)}',
            tax_number=f'{random.randint(100000000000000, 999999999999999)}',
            legal_representative='张三',
            contact_phone='021-12345678'
        )
        print(f'  ✓ 创建法人主体: {entity.name}')

# 5. 创建供应商
print('\n5. 创建供应商...')
supplier_names = ['XX装修公司', 'YY设备供应商', 'ZZ家具厂', 'AA电器商行']

for name in supplier_names:
    if not Supplier.objects.filter(name=name).exists():
        supplier = Supplier.objects.create(
            name=name,
            code=f'SUP{random.randint(1000, 9999)}',
            contact_person='李四',
            contact_phone=f'138{random.randint(10000000, 99999999)}',
            supplier_type=random.choice(['decoration', 'equipment', 'material'])
        )
        print(f'  ✓ 创建供应商: {supplier.name}')

# 6. 创建客户
print('\n6. 创建客户/加盟商...')
customer_names = ['张加盟', '李加盟', '王加盟', '赵加盟']

for name in customer_names:
    if not Customer.objects.filter(name=name).exists():
        customer = Customer.objects.create(
            name=name,
            code=f'CUS{random.randint(1000, 9999)}',
            contact_phone=f'138{random.randint(10000000, 99999999)}',
            customer_type=random.choice(['direct', 'franchise']),
            credit_level=random.choice(['A', 'B', 'C'])
        )
        print(f'  ✓ 创建客户: {customer.name}')

print('\n' + '='*50)
print('测试数据生成完成！')
print('='*50)
print(f'部门数量: {Department.objects.count()}')
print(f'用户数量: {User.objects.count()}')
print(f'经营区域: {BusinessRegion.objects.count()}')
print(f'法人主体: {LegalEntity.objects.count()}')
print(f'供应商: {Supplier.objects.count()}')
print(f'客户: {Customer.objects.count()}')
print('\n测试账号:')
print('  用户名: admin / 密码: admin123 (管理员)')
print('  用户名: ceo / 密码: test123')
print('  用户名: exp_manager / 密码: test123')
