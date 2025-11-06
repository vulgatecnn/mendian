#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
API 功能测试脚本
快速测试主要 API 端点是否正常工作
"""
import requests
import json
from colorama import init, Fore, Style

init(autoreset=True)

BASE_URL = 'http://localhost:5100/api'
TOKEN = None

def print_success(message):
    print(f"{Fore.GREEN}✓ {message}{Style.RESET_ALL}")

def print_error(message):
    print(f"{Fore.RED}✗ {message}{Style.RESET_ALL}")

def print_info(message):
    print(f"{Fore.CYAN}ℹ {message}{Style.RESET_ALL}")

def test_login():
    """测试登录功能"""
    global TOKEN
    print_info("测试登录 API...")
    
    try:
        response = requests.post(
            f'{BASE_URL}/auth/login/',
            json={
                'login_type': 'username_password',
                'username': 'admin',
                'password': 'admin123'
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 0:
                TOKEN = data['data']['access_token']
                print_success(f"登录成功！用户: {data['data']['user']['username']}")
                return True
            else:
                print_error(f"登录失败: {data.get('message')}")
                return False
        else:
            print_error(f"登录请求失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"登录异常: {str(e)}")
        return False

def test_get_users():
    """测试获取用户列表"""
    print_info("测试获取用户列表...")
    
    try:
        response = requests.get(
            f'{BASE_URL}/users/',
            headers={'Authorization': f'Bearer {TOKEN}'}
        )
        
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', len(data.get('results', [])))
            print_success(f"获取用户列表成功！共 {count} 个用户")
            return True
        else:
            print_error(f"获取用户列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取用户列表异常: {str(e)}")
        return False

def test_get_regions():
    """测试获取经营区域"""
    print_info("测试获取经营区域...")
    
    try:
        response = requests.get(
            f'{BASE_URL}/base-data/regions/',
            headers={'Authorization': f'Bearer {TOKEN}'}
        )
        
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', len(data.get('results', [])))
            print_success(f"获取经营区域成功！共 {count} 个区域")
            return True
        else:
            print_error(f"获取经营区域失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取经营区域异常: {str(e)}")
        return False

def test_get_departments():
    """测试获取部门列表"""
    print_info("测试获取部门列表...")
    
    try:
        response = requests.get(
            f'{BASE_URL}/departments/',
            headers={'Authorization': f'Bearer {TOKEN}'}
        )
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else data.get('count', 0)
            print_success(f"获取部门列表成功！共 {count} 个部门")
            return True
        else:
            print_error(f"获取部门列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取部门列表异常: {str(e)}")
        return False

def test_get_messages():
    """测试获取消息列表"""
    print_info("测试获取消息列表...")
    
    try:
        response = requests.get(
            f'{BASE_URL}/v1/messages/',
            headers={'Authorization': f'Bearer {TOKEN}'}
        )
        
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)
            print_success(f"获取消息列表成功！共 {count} 条消息")
            return True
        else:
            print_error(f"获取消息列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取消息列表异常: {str(e)}")
        return False

def main():
    print("\n" + "="*50)
    print("API 功能测试")
    print("="*50 + "\n")
    
    results = []
    
    # 测试登录
    if test_login():
        results.append(('登录', True))
        
        # 测试其他 API
        results.append(('获取用户列表', test_get_users()))
        results.append(('获取经营区域', test_get_regions()))
        results.append(('获取部门列表', test_get_departments()))
        results.append(('获取消息列表', test_get_messages()))
    else:
        results.append(('登录', False))
        print_error("登录失败，跳过其他测试")
    
    # 打印测试结果
    print("\n" + "="*50)
    print("测试结果汇总")
    print("="*50 + "\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{Fore.GREEN}✓ 通过{Style.RESET_ALL}" if result else f"{Fore.RED}✗ 失败{Style.RESET_ALL}"
        print(f"{name:20} {status}")
    
    print(f"\n总计: {passed}/{total} 通过")
    
    if passed == total:
        print(f"\n{Fore.GREEN}🎉 所有测试通过！{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.YELLOW}⚠️  部分测试失败，请检查日志{Style.RESET_ALL}")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}测试被用户中断{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}测试异常: {str(e)}{Style.RESET_ALL}")
