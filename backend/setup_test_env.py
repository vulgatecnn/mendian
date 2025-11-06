#!/usr/bin/env python
"""
测试环境准备脚本
用于创建测试数据库和准备测试数据
"""
import os
import sys
import django
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_test_database():
    """创建测试数据库"""
    print("正在创建测试数据库...")
    
    # 从环境变量读取数据库配置
    db_name = os.getenv('DB_NAME', 'store_lifecycle_test')
    db_user = os.getenv('DB_USER', 'postgres')
    db_password = os.getenv('DB_PASSWORD', '111111')
    db_host = os.getenv('DB_HOST', '127.0.0.1')
    db_port = os.getenv('DB_PORT', '5432')
    
    try:
        # 连接到 PostgreSQL 默认数据库
        conn = psycopg2.connect(
            dbname='postgres',
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # 检查数据库是否存在
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()
        
        if exists:
            print(f"测试数据库 '{db_name}' 已存在")
        else:
            # 创建数据库
            cursor.execute(f'CREATE DATABASE {db_name}')
            print(f"测试数据库 '{db_name}' 创建成功")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"创建测试数据库失败: {e}")
        return False

def run_migrations():
    """运行数据库迁移"""
    print("\n正在运行数据库迁移...")
    
    # 设置 Django 环境
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
    django.setup()
    
    from django.core.management import call_command
    
    try:
        # 运行迁移
        call_command('migrate', '--noinput')
        print("数据库迁移完成")
        return True
    except Exception as e:
        print(f"数据库迁移失败: {e}")
        return False

def create_test_data():
    """创建测试数据"""
    print("\n正在创建测试数据...")
    
    try:
        from django.core.management import call_command
        
        # 检查是否存在测试数据生成脚本
        if os.path.exists('quick_test_data.py'):
            call_command('shell', '-c', 'exec(open("quick_test_data.py").read())')
            print("测试数据创建完成")
        else:
            print("未找到测试数据生成脚本，跳过")
        
        return True
    except Exception as e:
        print(f"创建测试数据失败: {e}")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("测试环境准备")
    print("=" * 60)
    
    # 加载测试环境配置
    from dotenv import load_dotenv
    load_dotenv('.env.test')
    
    # 步骤1: 创建测试数据库
    if not create_test_database():
        print("\n❌ 测试环境准备失败：无法创建测试数据库")
        sys.exit(1)
    
    # 步骤2: 运行数据库迁移
    if not run_migrations():
        print("\n❌ 测试环境准备失败：数据库迁移失败")
        sys.exit(1)
    
    # 步骤3: 创建测试数据（可选）
    create_test_data()
    
    print("\n" + "=" * 60)
    print("✅ 测试环境准备完成")
    print("=" * 60)
    print("\n可以开始运行测试了：")
    print("  pytest                    # 运行所有测试")
    print("  pytest --cov              # 运行测试并生成覆盖率报告")
    print("  pytest -v                 # 详细输出")

if __name__ == '__main__':
    main()
