"""
集成测试运行脚本
执行系统管理模块的所有集成测试
"""
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner
from django.core.management import execute_from_command_line


def run_integration_tests():
    """运行集成测试"""
    print("=" * 80)
    print("系统管理模块集成测试")
    print("=" * 80)
    
    # 设置Django环境
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
    django.setup()
    
    # 测试模块列表
    test_modules = [
        'system_management.tests.test_wechat_integration',
        'system_management.tests.test_user_management', 
        'system_management.tests.test_role_permission',
        'system_management.tests.test_permission_control',
        'system_management.tests.test_audit_log',
    ]
    
    print(f"\n将运行以下测试模块:")
    for i, module in enumerate(test_modules, 1):
        print(f"  {i}. {module}")
    
    print(f"\n开始执行测试...")
    print("-" * 80)
    
    # 运行测试
    test_results = {}
    total_tests = 0
    total_failures = 0
    total_errors = 0
    
    for module in test_modules:
        print(f"\n>>> 运行测试模块: {module}")
        print("-" * 60)
        
        try:
            # 使用Django测试运行器
            TestRunner = get_runner(settings)
            test_runner = TestRunner(verbosity=2, interactive=False, keepdb=True)
            
            # 运行单个测试模块
            result = test_runner.run_tests([module])
            
            test_results[module] = {
                'success': result == 0,
                'failures': getattr(test_runner, 'failures', 0),
                'errors': getattr(test_runner, 'errors', 0),
                'tests_run': getattr(test_runner, 'tests_run', 0)
            }
            
            if result == 0:
                print(f"✓ {module} - 所有测试通过")
            else:
                print(f"✗ {module} - 测试失败")
                
        except Exception as e:
            print(f"✗ {module} - 运行出错: {e}")
            test_results[module] = {
                'success': False,
                'error': str(e)
            }
    
    # 输出测试总结
    print("\n" + "=" * 80)
    print("测试总结")
    print("=" * 80)
    
    successful_modules = 0
    failed_modules = 0
    
    for module, result in test_results.items():
        status = "✓ 通过" if result.get('success', False) else "✗ 失败"
        print(f"{status} - {module}")
        
        if result.get('success', False):
            successful_modules += 1
        else:
            failed_modules += 1
            if 'error' in result:
                print(f"    错误: {result['error']}")
    
    print(f"\n总计:")
    print(f"  - 成功模块: {successful_modules}")
    print(f"  - 失败模块: {failed_modules}")
    print(f"  - 总模块数: {len(test_modules)}")
    
    if failed_modules == 0:
        print(f"\n🎉 所有集成测试通过！")
        return True
    else:
        print(f"\n❌ 有 {failed_modules} 个测试模块失败")
        return False


def run_specific_test_class():
    """运行特定的测试类"""
    print("=" * 80)
    print("运行特定测试类")
    print("=" * 80)
    
    test_classes = {
        '1': 'system_management.tests.test_wechat_integration.WeChatDepartmentSyncTest',
        '2': 'system_management.tests.test_wechat_integration.WeChatUserSyncTest',
        '3': 'system_management.tests.test_user_management.UserManagementTest',
        '4': 'system_management.tests.test_role_permission.RoleManagementTest',
        '5': 'system_management.tests.test_permission_control.PermissionControlTest',
        '6': 'system_management.tests.test_audit_log.AuditLogRecordingTest',
    }
    
    print("可用的测试类:")
    for key, class_name in test_classes.items():
        print(f"  {key}. {class_name}")
    
    choice = input("\n请选择要运行的测试类 (输入数字): ")
    
    if choice in test_classes:
        test_class = test_classes[choice]
        print(f"\n运行测试类: {test_class}")
        print("-" * 60)
        
        try:
            execute_from_command_line(['manage.py', 'test', test_class, '--verbosity=2'])
        except Exception as e:
            print(f"运行测试时出错: {e}")
    else:
        print("无效的选择")


def main():
    """主函数"""
    if len(sys.argv) > 1 and sys.argv[1] == 'specific':
        run_specific_test_class()
    else:
        success = run_integration_tests()
        sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()