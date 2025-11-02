# Generated manually for database optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('system_management', '0001_initial'),
    ]

    operations = [
        # 为审计日志添加复合索引，优化常用查询
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(
                fields=['user', 'created_at'], 
                name='idx_log_user_time'
            ),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(
                fields=['action', 'created_at'], 
                name='idx_log_action_time'
            ),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(
                fields=['target_type', 'created_at'], 
                name='idx_log_target_time'
            ),
        ),
        
        # 为用户表添加复合索引，优化常用查询
        migrations.AddIndex(
            model_name='user',
            index=models.Index(
                fields=['department', 'is_active'], 
                name='idx_user_dept_active'
            ),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(
                fields=['is_active', 'created_at'], 
                name='idx_user_active_time'
            ),
        ),
        
        # 为角色表添加复合索引
        migrations.AddIndex(
            model_name='role',
            index=models.Index(
                fields=['is_active', 'created_at'], 
                name='idx_role_active_time'
            ),
        ),
        
        # 为部门表添加复合索引，优化树形查询
        migrations.AddIndex(
            model_name='department',
            index=models.Index(
                fields=['parent', 'order'], 
                name='idx_dept_parent_order'
            ),
        ),
        
        # 为权限表添加复合索引
        migrations.AddIndex(
            model_name='permission',
            index=models.Index(
                fields=['module', 'code'], 
                name='idx_perm_module_code'
            ),
        ),
    ]