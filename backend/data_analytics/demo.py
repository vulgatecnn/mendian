"""
数据聚合服务演示脚本
用于测试和演示数据聚合功能
"""
import os
import sys
import django

# 设置Django环境
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
django.setup()

from django.utils import timezone
from decimal import Decimal
from data_analytics.services import DataAggregationService, ROICalculationService
from data_analytics.utils import DataValidator, DataCleaner, DataFormatter
from data_analytics.permissions import AnalyticsPermissionManager
from django.contrib.auth import get_user_model

User = get_user_model()


def demo_data_aggregation_service():
    """演示数据聚合服务"""
    print("=== 数据聚合服务演示 ===")
    
    service = DataAggregationService()
    
    # 测试缓存键生成
    cache_key = service._get_cache_key('dashboard', user_id=1, region_id=2)
    print(f"生成的缓存键: {cache_key}")
    
    # 测试转化率计算
    stage_counts = {
        'investigating': {'count': 100},
        'calculating': {'count': 80},
        'approving': {'count': 60},
        'signing': {'count': 40},
        'signed': {'count': 20},
    }
    funnel_stages = [
        ('investigating', '调研中'),
        ('calculating', '测算中'),
        ('approving', '审批中'),
        ('signing', '签约中'),
        ('signed', '已签约'),
    ]
    
    rates = service._calculate_conversion_rates(stage_counts, funnel_stages)
    print(f"转化率计算结果:")
    for rate in rates:
        print(f"  {rate['from_stage']} -> {rate['to_stage']}: {rate['rate']}%")
    
    print()


def demo_data_validator():
    """演示数据验证器"""
    print("=== 数据验证器演示 ===")
    
    # 测试销售数据验证
    valid_data = {
        'store_id': '1',
        'data_date': '2024-01-01',
        'daily_revenue': '1000.50',
        'daily_orders': '50'
    }
    
    try:
        result = DataValidator.validate_sales_data(valid_data)
        print(f"销售数据验证成功:")
        print(f"  门店ID: {result['store_id']}")
        print(f"  日期: {result['data_date']}")
        print(f"  日营业额: {result['daily_revenue']}")
        print(f"  日订单数: {result['daily_orders']}")
    except Exception as e:
        print(f"销售数据验证失败: {e}")
    
    # 测试无效数据
    invalid_data = {
        'store_id': 'invalid',
        'data_date': '2024-01-01',
        'daily_revenue': '-100'
    }
    
    try:
        DataValidator.validate_sales_data(invalid_data)
    except Exception as e:
        print(f"无效数据验证失败（预期）: {e}")
    
    print()


def demo_data_cleaner():
    """演示数据清洗器"""
    print("=== 数据清洗器演示 ===")
    
    # 测试门店数据清洗
    dirty_store_data = {
        'name': '  测试门店  ',
        'province': '广东',
        'city': '  深圳市  ',
        'status': '营业中'
    }
    
    cleaned_data = DataCleaner.clean_store_data(dirty_store_data)
    print(f"门店数据清洗结果:")
    print(f"  原始: {dirty_store_data}")
    print(f"  清洗后: {cleaned_data}")
    
    # 测试财务数据清洗
    dirty_financial_data = {
        'revenue': '1000.567',
        'roi': '25.678',
        'completion_rate': '-5'
    }
    
    cleaned_financial = DataCleaner.clean_financial_data(dirty_financial_data)
    print(f"财务数据清洗结果:")
    print(f"  原始: {dirty_financial_data}")
    print(f"  清洗后: {cleaned_financial}")
    
    print()


def demo_data_formatter():
    """演示数据格式化器"""
    print("=== 数据格式化器演示 ===")
    
    # 测试货币格式化
    amount = Decimal('1234567.89')
    formatted_currency = DataFormatter.format_currency(amount)
    print(f"货币格式化: {amount} -> {formatted_currency}")
    
    # 测试百分比格式化
    percentage = 25.678
    formatted_percentage = DataFormatter.format_percentage(percentage)
    print(f"百分比格式化: {percentage} -> {formatted_percentage}")
    
    # 测试数字格式化
    number = 1234567
    formatted_number = DataFormatter.format_number(number)
    print(f"数字格式化: {number} -> {formatted_number}")
    
    print()


def demo_permissions():
    """演示权限管理"""
    print("=== 权限管理演示 ===")
    
    # 创建测试用户
    try:
        user = User.objects.get(username='demo_user')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='demo_user',
            email='demo@example.com',
            password='demo123'
        )
    
    # 测试权限管理器
    permission_manager = AnalyticsPermissionManager(user)
    permissions = permission_manager.get_user_permissions()
    
    print(f"用户权限信息:")
    print(f"  用户ID: {permissions['user_id']}")
    print(f"  是否超级用户: {permissions['is_superuser']}")
    print(f"  允许的区域: {permissions['allowed_regions']}")
    print(f"  允许的数据类型: {permissions['allowed_data_types']}")
    print(f"  数据级别: {permissions['data_level']}")
    
    print()


def main():
    """主函数"""
    print("数据分析模块功能演示")
    print("=" * 50)
    
    try:
        demo_data_aggregation_service()
        demo_data_validator()
        demo_data_cleaner()
        demo_data_formatter()
        demo_permissions()
        
        print("所有演示完成！")
        
    except Exception as e:
        print(f"演示过程中出现错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()