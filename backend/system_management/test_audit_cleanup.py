"""
审计日志清理功能测试脚本

使用方法:
    python manage.py shell < system_management/test_audit_cleanup.py
"""
from django.utils import timezone
from datetime import timedelta
from system_management.models import AuditLog, User
from system_management.tasks import cleanup_expired_audit_logs, cleanup_audit_logs_by_count


def create_test_logs():
    """创建测试审计日志"""
    print("=" * 60)
    print("创建测试审计日志")
    print("=" * 60)
    
    # 获取或创建测试用户
    user, created = User.objects.get_or_create(
        username='test_user',
        defaults={
            'phone': '13800000000',
            'wechat_user_id': 'test_wechat_id',
            'is_active': True
        }
    )
    
    if created:
        user.set_password('test123456')
        user.save()
        print(f"✓ 创建测试用户: {user.username}")
    else:
        print(f"✓ 使用现有测试用户: {user.username}")
    
    # 创建不同时间的测试日志
    now = timezone.now()
    
    test_logs = [
        # 最近的日志（不应被删除）
        {'days_ago': 1, 'count': 5, 'action': 'create'},
        {'days_ago': 30, 'count': 10, 'action': 'update'},
        {'days_ago': 180, 'count': 15, 'action': 'delete'},
        
        # 过期的日志（应被删除）
        {'days_ago': 366, 'count': 20, 'action': 'create'},
        {'days_ago': 400, 'count': 25, 'action': 'update'},
        {'days_ago': 500, 'count': 30, 'action': 'delete'},
    ]
    
    created_count = 0
    for log_group in test_logs:
        created_at = now - timedelta(days=log_group['days_ago'])
        
        for i in range(log_group['count']):
            AuditLog.objects.create(
                user=user,
                action=log_group['action'],
                target_type='test',
                target_id=i,
                details={'test': True, 'index': i},
                ip_address='127.0.0.1',
                created_at=created_at
            )
            created_count += 1
    
    print(f"✓ 创建了 {created_count} 条测试日志")
    print()
    
    # 显示日志统计
    total_logs = AuditLog.objects.count()
    cutoff_date = now - timedelta(days=365)
    expired_logs = AuditLog.objects.filter(created_at__lt=cutoff_date).count()
    recent_logs = AuditLog.objects.filter(created_at__gte=cutoff_date).count()
    
    print(f"日志统计:")
    print(f"  总日志数: {total_logs}")
    print(f"  过期日志数 (>365天): {expired_logs}")
    print(f"  有效日志数 (≤365天): {recent_logs}")
    print()


def test_cleanup_by_days():
    """测试按天数清理日志"""
    print("=" * 60)
    print("测试按天数清理日志")
    print("=" * 60)
    
    # 执行清理任务
    result = cleanup_expired_audit_logs()
    
    print(f"清理结果:")
    print(f"  成功: {result['success']}")
    print(f"  删除数量: {result['deleted_count']}")
    print(f"  截止日期: {result['cutoff_date']}")
    print(f"  消息: {result['message']}")
    print()
    
    # 验证清理结果
    now = timezone.now()
    cutoff_date = now - timedelta(days=365)
    remaining_expired = AuditLog.objects.filter(created_at__lt=cutoff_date).count()
    
    if remaining_expired == 0:
        print("✓ 验证通过: 所有过期日志已清理")
    else:
        print(f"✗ 验证失败: 仍有 {remaining_expired} 条过期日志")
    print()


def test_cleanup_by_count():
    """测试按数量清理日志"""
    print("=" * 60)
    print("测试按数量清理日志")
    print("=" * 60)
    
    # 设置最大保留数量为10
    max_records = 10
    
    # 执行清理任务
    result = cleanup_audit_logs_by_count(max_records=max_records)
    
    print(f"清理结果:")
    print(f"  成功: {result['success']}")
    print(f"  删除数量: {result['deleted_count']}")
    print(f"  原始总数: {result.get('total_count', 0)}")
    print(f"  剩余数量: {result.get('remaining_count', 0)}")
    print(f"  消息: {result['message']}")
    print()
    
    # 验证清理结果
    remaining_count = AuditLog.objects.count()
    
    if remaining_count <= max_records:
        print(f"✓ 验证通过: 剩余日志数 ({remaining_count}) ≤ 最大保留数 ({max_records})")
    else:
        print(f"✗ 验证失败: 剩余日志数 ({remaining_count}) > 最大保留数 ({max_records})")
    print()


def cleanup_test_data():
    """清理测试数据"""
    print("=" * 60)
    print("清理测试数据")
    print("=" * 60)
    
    # 删除所有测试日志
    deleted_logs, _ = AuditLog.objects.filter(target_type='test').delete()
    print(f"✓ 删除了 {deleted_logs} 条测试日志")
    
    # 删除测试用户
    try:
        user = User.objects.get(username='test_user')
        user.delete()
        print(f"✓ 删除了测试用户")
    except User.DoesNotExist:
        print("✓ 测试用户不存在，无需删除")
    
    print()


def run_all_tests():
    """运行所有测试"""
    print("\n")
    print("*" * 60)
    print("审计日志清理功能测试")
    print("*" * 60)
    print()
    
    # 1. 创建测试数据
    create_test_logs()
    
    # 2. 测试按天数清理
    test_cleanup_by_days()
    
    # 3. 重新创建测试数据
    create_test_logs()
    
    # 4. 测试按数量清理
    test_cleanup_by_count()
    
    # 5. 清理测试数据
    cleanup_test_data()
    
    print("*" * 60)
    print("测试完成")
    print("*" * 60)
    print()


# 运行测试
if __name__ == '__main__':
    run_all_tests()

