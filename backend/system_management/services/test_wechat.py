"""
企业微信服务测试脚本
用于测试企业微信集成服务的基本功能
"""
import os
import sys
import django

# 设置 Django 环境
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
django.setup()

from system_management.services import wechat_service


def test_config():
    """测试配置验证"""
    print("\n" + "=" * 60)
    print("测试 1: 配置验证")
    print("=" * 60)
    
    is_valid, error_msg = wechat_service.validate_config()
    
    if is_valid:
        print("✓ 配置验证通过")
    else:
        print(f"✗ 配置验证失败: {error_msg}")
    
    return is_valid


def test_connection():
    """测试连接"""
    print("\n" + "=" * 60)
    print("测试 2: 连接测试")
    print("=" * 60)
    
    result = wechat_service.test_connection()
    
    print(f"配置有效: {result['config_valid']}")
    print(f"令牌有效: {result['token_valid']}")
    print(f"连接成功: {result['success']}")
    
    if result['errors']:
        print("\n错误信息:")
        for error in result['errors']:
            print(f"  - {error}")
    
    return result['success']


def test_sync_departments():
    """测试部门同步"""
    print("\n" + "=" * 60)
    print("测试 3: 部门同步")
    print("=" * 60)
    
    result = wechat_service.sync_departments()
    
    print(f"同步成功: {result['success']}")
    print(f"总数: {result['total']}")
    print(f"新增: {result['created']}")
    print(f"更新: {result['updated']}")
    print(f"失败: {result['failed']}")
    print(f"耗时: {result['elapsed_time']} 秒")
    
    if result.get('timeout_warning'):
        print("⚠ 警告: 同步耗时过长")
    
    if result.get('errors'):
        print("\n错误信息:")
        for error in result['errors']:
            print(f"  - {error}")
    
    return result['success']


def test_sync_users():
    """测试用户同步"""
    print("\n" + "=" * 60)
    print("测试 4: 用户同步")
    print("=" * 60)
    
    result = wechat_service.sync_users()
    
    print(f"同步成功: {result['success']}")
    print(f"总数: {result['total']}")
    print(f"新增: {result['created']}")
    print(f"更新: {result['updated']}")
    print(f"失败: {result['failed']}")
    print(f"耗时: {result['elapsed_time']} 秒")
    
    if result.get('timeout_warning'):
        print("⚠ 警告: 同步耗时过长")
    
    if result.get('errors'):
        print("\n错误信息:")
        for error in result['errors']:
            print(f"  - {error}")
    
    return result['success']


def test_get_department_tree():
    """测试获取部门树"""
    print("\n" + "=" * 60)
    print("测试 5: 获取部门树")
    print("=" * 60)
    
    try:
        tree = wechat_service.get_department_tree()
        print(f"✓ 成功获取部门树，共 {len(tree)} 个根部门")
        
        # 打印部门树结构（仅第一层）
        for dept in tree[:3]:  # 只显示前3个
            print(f"  - {dept['name']} (ID: {dept['id']}, 子部门: {len(dept['children'])})")
        
        if len(tree) > 3:
            print(f"  ... 还有 {len(tree) - 3} 个部门")
        
        return True
        
    except Exception as e:
        print(f"✗ 获取部门树失败: {e}")
        return False


def main():
    """主测试函数"""
    print("\n" + "=" * 60)
    print("企业微信集成服务测试")
    print("=" * 60)
    
    # 测试 1: 配置验证
    if not test_config():
        print("\n⚠ 配置无效，请检查 .env 文件中的企业微信配置")
        print("需要配置以下环境变量:")
        print("  - WECHAT_CORP_ID")
        print("  - WECHAT_AGENT_ID")
        print("  - WECHAT_SECRET")
        return
    
    # 测试 2: 连接测试
    if not test_connection():
        print("\n⚠ 连接测试失败，请检查企业微信配置和网络连接")
        return
    
    # 测试 3: 部门同步
    test_sync_departments()
    
    # 测试 4: 用户同步
    test_sync_users()
    
    # 测试 5: 获取部门树
    test_get_department_tree()
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)


if __name__ == '__main__':
    main()
