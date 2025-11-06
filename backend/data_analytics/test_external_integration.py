#!/usr/bin/env python
"""
外部数据集成功能测试脚本
"""
import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# 设置Django环境
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
django.setup()

from data_analytics.services import ExternalDataValidationService, ROICalculationService
from data_analytics.models import ExternalSalesData


def test_data_validation():
    """测试数据验证功能"""
    print("=== 测试数据验证功能 ===")
    
    validation_service = ExternalDataValidationService()
    
    # 测试有效数据
    valid_data = {
        'store_id': '1',
        'data_date': '2024-01-15',
        'daily_revenue': 5000.50,
        'daily_orders': 25,
        'daily_customers': 30
    }
    
    result = validation_service.validate_sales_data(valid_data)
    print(f"有效数据验证结果: {result['is_valid']}")
    if not result['is_valid']:
        print(f"验证错误: {result['errors']}")
    
    # 测试无效数据
    invalid_data = {
        'store_id': '',
        'data_date': '2024-13-45',  # 无效日期
        'daily_revenue': -100,      # 负数营业额
        'daily_orders': 'abc'       # 无效订单数
    }
    
    result = validation_service.validate_sales_data(invalid_data)
    print(f"无效数据验证结果: {result['is_valid']}")
    print(f"验证错误: {result['errors']}")


def test_store_matching():
    """测试门店匹配功能"""
    print("\n=== 测试门店匹配功能 ===")
    
    validation_service = ExternalDataValidationService()
    
    # 测试通过ID匹配（假设存在ID为1的门店）
    result = validation_service.match_store('1')
    print(f"门店ID匹配结果: {result['found']}")
    if result['found']:
        print(f"匹配到门店: {result['store'].store_name}")
    else:
        print(f"匹配失败: {result['message']}")
    
    # 测试不存在的门店
    result = validation_service.match_store('99999')
    print(f"不存在门店匹配结果: {result['found']}")
    print(f"消息: {result['message']}")


def test_batch_validation():
    """测试批量数据验证"""
    print("\n=== 测试批量数据验证 ===")
    
    validation_service = ExternalDataValidationService()
    
    batch_data = [
        {
            'store_id': '1',
            'data_date': '2024-01-15',
            'daily_revenue': 5000,
            'daily_orders': 25
        },
        {
            'store_id': '2',
            'data_date': '2024-01-15',
            'daily_revenue': 3000,
            'daily_orders': 15
        },
        {
            'store_id': '',  # 无效数据
            'data_date': '2024-01-15',
            'daily_revenue': -100,
            'daily_orders': 10
        }
    ]
    
    result = validation_service.validate_batch_data(batch_data)
    print(f"批量验证结果: {result['is_valid']}")
    print(f"有效记录: {result['valid_count']}, 无效记录: {result['invalid_count']}")
    if result['invalid_count'] > 0:
        print(f"验证错误: {result['errors'][:3]}")  # 只显示前3个错误


def test_sales_data_model():
    """测试销售数据模型功能"""
    print("\n=== 测试销售数据模型功能 ===")
    
    # 创建测试销售数据（需要确保有对应的门店）
    try:
        from store_archive.models import StoreProfile
        
        # 获取第一个门店用于测试
        store = StoreProfile.objects.first()
        if not store:
            print("没有找到门店数据，跳过模型测试")
            return
        
        # 创建测试销售数据
        sales_data = ExternalSalesData(
            store=store,
            data_date=date.today() - timedelta(days=1),
            daily_revenue=Decimal('5000.50'),
            daily_orders=25,
            daily_customers=30
        )
        
        # 测试客单价计算
        avg_order_value = sales_data.calculate_average_order_value()
        print(f"计算客单价: {avg_order_value}")
        
        # 测试数据验证
        is_valid = sales_data.validate_data()
        print(f"数据验证结果: {is_valid}")
        if not is_valid:
            print(f"验证错误: {sales_data.validation_errors}")
        
        print("销售数据模型测试完成")
        
    except Exception as e:
        print(f"销售数据模型测试失败: {e}")


def test_roi_calculation():
    """测试ROI计算功能"""
    print("\n=== 测试ROI计算功能 ===")
    
    try:
        from store_archive.models import StoreProfile
        
        # 获取第一个门店用于测试
        store = StoreProfile.objects.first()
        if not store:
            print("没有找到门店数据，跳过ROI计算测试")
            return
        
        roi_service = ROICalculationService()
        
        # 测试ROI计算
        roi_result = roi_service.calculate_store_roi(store.id, 12)
        print(f"门店 {roi_result['store_name']} ROI计算结果:")
        print(f"  投资成本: {roi_result['investment_cost']}")
        print(f"  总收入: {roi_result['total_revenue']}")
        print(f"  净利润: {roi_result['net_profit']}")
        print(f"  ROI: {roi_result['roi']}%")
        print(f"  回本周期: {roi_result['payback_period_months']}个月")
        
    except Exception as e:
        print(f"ROI计算测试失败: {e}")


def main():
    """主测试函数"""
    print("开始外部数据集成功能测试...\n")
    
    try:
        test_data_validation()
        test_store_matching()
        test_batch_validation()
        test_sales_data_model()
        test_roi_calculation()
        
        print("\n=== 测试完成 ===")
        print("所有测试已执行完毕，请检查上述输出结果")
        
    except Exception as e:
        print(f"测试执行失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()