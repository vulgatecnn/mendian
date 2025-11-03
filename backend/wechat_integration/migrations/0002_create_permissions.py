"""
创建企业微信集成模块权限
"""
from django.db import migrations


def create_wechat_permissions(apps, schema_editor):
    """创建企业微信集成相关权限"""
    Permission = apps.get_model('system_management', 'Permission')
    
    permissions = [
        # 企业微信同步权限
        {
            'code': 'wechat.sync.department',
            'name': '同步企业微信部门',
            'module': '企业微信集成',
            'description': '从企业微信同步部门信息到本地数据库'
        },
        {
            'code': 'wechat.sync.user',
            'name': '同步企业微信用户',
            'module': '企业微信集成',
            'description': '从企业微信同步用户信息到本地数据库'
        },
        {
            'code': 'wechat.sync.all',
            'name': '全量同步企业微信',
            'module': '企业微信集成',
            'description': '全量同步企业微信部门和用户信息'
        },
        {
            'code': 'wechat.sync.view',
            'name': '查看同步日志',
            'module': '企业微信集成',
            'description': '查看企业微信同步日志'
        },
        
        # 企业微信部门权限
        {
            'code': 'wechat.department.view',
            'name': '查看企业微信部门',
            'module': '企业微信集成',
            'description': '查看企业微信部门信息'
        },
        
        # 企业微信用户权限
        {
            'code': 'wechat.user.view',
            'name': '查看企业微信用户',
            'module': '企业微信集成',
            'description': '查看企业微信用户信息'
        },
        
        # 企业微信消息权限
        {
            'code': 'wechat.message.view',
            'name': '查看企业微信消息',
            'module': '企业微信集成',
            'description': '查看企业微信消息记录'
        },
        {
            'code': 'wechat.message.send',
            'name': '发送企业微信消息',
            'module': '企业微信集成',
            'description': '发送企业微信消息'
        },
    ]
    
    for perm_data in permissions:
        Permission.objects.get_or_create(
            code=perm_data['code'],
            defaults={
                'name': perm_data['name'],
                'module': perm_data['module'],
                'description': perm_data['description']
            }
        )


def remove_wechat_permissions(apps, schema_editor):
    """删除企业微信集成相关权限"""
    Permission = apps.get_model('system_management', 'Permission')
    
    permission_codes = [
        'wechat.sync.department',
        'wechat.sync.user',
        'wechat.sync.all',
        'wechat.sync.view',
        'wechat.department.view',
        'wechat.user.view',
        'wechat.message.view',
        'wechat.message.send',
    ]
    
    Permission.objects.filter(code__in=permission_codes).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('wechat_integration', '0001_initial'),
        ('system_management', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_wechat_permissions, remove_wechat_permissions),
    ]