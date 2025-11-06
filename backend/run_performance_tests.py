"""
运行API性能基准测试并生成报告

使用方法:
    python run_performance_tests.py
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
django.setup()

import pytest

def main():
    """运行性能测试"""
    print("=" * 80)
    print("开始API性能基准测试")
    print("=" * 80)
    print()
    
    # 运行性能测试
    exit_code = pytest.main([
        'tests/performance/test_api_performance.py',
        '-v',
        '-s',
        '--tb=short',
        '-m', 'performance'
    ])
    
    print()
    print("=" * 80)
    print("性能测试完成")
    print("=" * 80)
    print()
    
    # 检查报告文件
    report_file = 'API_PERFORMANCE_REPORT.md'
    if os.path.exists(report_file):
        print(f"性能报告已生成: {report_file}")
        print()
        print("报告内容:")
        print("-" * 80)
        with open(report_file, 'r', encoding='utf-8') as f:
            print(f.read())
    else:
        print(f"警告: 未找到性能报告文件 {report_file}")
    
    return exit_code

if __name__ == '__main__':
    sys.exit(main())
