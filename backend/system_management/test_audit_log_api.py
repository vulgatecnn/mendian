"""
审计日志 API 测试
测试审计日志的查询功能
"""
import requests
import json
from datetime import datetime, timedelta

# API 基础 URL
BASE_URL = "http://localhost:8000/api/system"

# 测试用户凭证（需要管理员权限）
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin123"


def login():
    """登录并获取会话"""
    session = requests.Session()
    
    # 获取 CSRF token
    session.get(f"{BASE_URL}/")
    
    # 登录
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    
    response = session.post(login_url, json=login_data)
    
    if response.status_code == 200:
        print("✓ 登录成功")
        return session
    else:
        print(f"✗ 登录失败: {response.status_code}")
        print(f"  响应: {response.text}")
        return None


def test_list_audit_logs(session):
    """测试获取审计日志列表"""
    print("\n=== 测试获取审计日志列表 ===")
    
    url = f"{BASE_URL}/audit-logs/"
    
    # 测试基本查询
    print("\n1. 基本查询（获取所有日志）")
    response = session.get(url)
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功获取审计日志")
        print(f"   总数: {data.get('count', 0)}")
        
        # 显示前3条日志
        results = data.get('results', [])
        if results:
            print(f"   前3条日志:")
            for i, log in enumerate(results[:3], 1):
                print(f"     {i}. [{log['action']}] {log.get('username', '未知用户')} - "
                      f"{log['target_type']}#{log['target_id']} - {log['created_at']}")
    else:
        print(f"   ✗ 失败: {response.text}")
    
    # 测试按操作类型筛选
    print("\n2. 按操作类型筛选（action=create）")
    response = session.get(url, params={'action': 'create'})
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功获取创建操作日志")
        print(f"   数量: {data.get('count', 0)}")
    else:
        print(f"   ✗ 失败: {response.text}")
    
    # 测试按对象类型筛选
    print("\n3. 按对象类型筛选（target_type=role）")
    response = session.get(url, params={'target_type': 'role'})
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功获取角色相关日志")
        print(f"   数量: {data.get('count', 0)}")
    else:
        print(f"   ✗ 失败: {response.text}")
    
    # 测试按时间范围筛选
    print("\n4. 按时间范围筛选（最近24小时）")
    start_time = (datetime.now() - timedelta(days=1)).isoformat()
    response = session.get(url, params={'start_time': start_time})
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功获取最近24小时日志")
        print(f"   数量: {data.get('count', 0)}")
    else:
        print(f"   ✗ 失败: {response.text}")
    
    # 测试分页
    print("\n5. 测试分页（page_size=5）")
    response = session.get(url, params={'page_size': 5})
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功获取分页数据")
        print(f"   总数: {data.get('count', 0)}")
        print(f"   当前页数量: {len(data.get('results', []))}")
    else:
        print(f"   ✗ 失败: {response.text}")


def test_get_audit_log_detail(session):
    """测试获取审计日志详情"""
    print("\n=== 测试获取审计日志详情 ===")
    
    # 先获取一个日志ID
    list_url = f"{BASE_URL}/audit-logs/"
    response = session.get(list_url, params={'page_size': 1})
    
    if response.status_code == 200:
        data = response.json()
        results = data.get('results', [])
        
        if results:
            log_id = results[0]['id']
            print(f"\n获取日志详情（ID: {log_id}）")
            
            detail_url = f"{BASE_URL}/audit-logs/{log_id}/"
            response = session.get(detail_url)
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                log = response.json()
                print(f"✓ 成功获取日志详情")
                print(f"  操作人: {log.get('username', '未知用户')}")
                print(f"  操作类型: {log['action']}")
                print(f"  对象类型: {log['target_type']}")
                print(f"  对象ID: {log['target_id']}")
                print(f"  IP地址: {log['ip_address']}")
                print(f"  操作时间: {log['created_at']}")
                print(f"  详情: {json.dumps(log['details'], ensure_ascii=False, indent=2)}")
                
                # 检查用户信息嵌套
                if log.get('user_info'):
                    print(f"  用户信息:")
                    user_info = log['user_info']
                    print(f"    - 用户名: {user_info.get('username')}")
                    print(f"    - 全名: {user_info.get('full_name')}")
                    print(f"    - 部门: {user_info.get('department_name', '无')}")
            else:
                print(f"✗ 失败: {response.text}")
        else:
            print("✗ 没有找到审计日志")
    else:
        print(f"✗ 获取日志列表失败: {response.text}")


def test_combined_filters(session):
    """测试组合筛选"""
    print("\n=== 测试组合筛选 ===")
    
    url = f"{BASE_URL}/audit-logs/"
    
    # 组合筛选：角色相关的创建操作
    print("\n组合筛选：角色相关的创建操作")
    params = {
        'action': 'create',
        'target_type': 'role',
        'page_size': 10
    }
    
    response = session.get(url, params=params)
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ 成功获取筛选结果")
        print(f"  数量: {data.get('count', 0)}")
        
        results = data.get('results', [])
        if results:
            print(f"  结果:")
            for i, log in enumerate(results, 1):
                print(f"    {i}. {log.get('username', '未知用户')} 创建了角色 "
                      f"(ID: {log['target_id']}) - {log['created_at']}")
    else:
        print(f"✗ 失败: {response.text}")


def main():
    """主测试函数"""
    print("=" * 60)
    print("审计日志 API 测试")
    print("=" * 60)
    
    # 登录
    session = login()
    if not session:
        print("\n测试终止：无法登录")
        return
    
    # 运行测试
    test_list_audit_logs(session)
    test_get_audit_log_detail(session)
    test_combined_filters(session)
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)


if __name__ == "__main__":
    main()
