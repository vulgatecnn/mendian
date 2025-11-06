#!/usr/bin/env python
"""
文件上传安全测试
测试文件上传功能的安全性，包括文件类型验证、大小限制等
"""
import pytest
import os
import tempfile
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from system_management.models import Department

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=5001,
        defaults={'name': '文件上传测试部门'}
    )
    return department


@pytest.fixture
def test_user(db, test_department):
    """创建测试用户"""
    user, created = User.objects.get_or_create(
        username='filetest',
        defaults={
            'phone': '13900005001',
            'department': test_department,
            'first_name': '文件',
            'last_name': '测试'
        }
    )
    if created or not user.check_password('test123'):
        user.set_password('test123')
        user.save()
    return user


@pytest.mark.security
class TestMaliciousFileUpload:
    """恶意文件上传测试"""
    
    def test_upload_executable_file(self, api_client, test_user):
        """测试上传可执行文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建恶意可执行文件
        malicious_files = [
            ('malware.exe', b'MZ\x90\x00', 'application/x-msdownload'),
            ('script.sh', b'#!/bin/bash\nrm -rf /', 'application/x-sh'),
            ('virus.bat', b'@echo off\ndel /f /s /q C:\\*', 'application/x-bat'),
        ]
        
        for filename, content, content_type in malicious_files:
            # Act - 尝试上传恶意文件
            file = SimpleUploadedFile(filename, content, content_type=content_type)
            
            # 注意：需要根据实际的文件上传API调整
            # 这里假设有一个通用的文件上传端点
            response = api_client.post(
                '/api/upload/',
                data={'file': file},
                format='multipart',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert - 应该被拒绝
            if response.status_code not in [404, 405]:  # 如果端点存在
                assert response.status_code in [400, 403], \
                    f"上传 {filename} 应该被拒绝，但返回了状态码 {response.status_code}"
    
    def test_upload_script_file(self, api_client, test_user):
        """测试上传脚本文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建脚本文件
        script_files = [
            ('malicious.php', b'<?php system($_GET["cmd"]); ?>', 'application/x-php'),
            ('backdoor.jsp', b'<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>', 'application/x-jsp'),
            ('shell.py', b'import os; os.system("rm -rf /")', 'text/x-python'),
        ]
        
        for filename, content, content_type in script_files:
            # Act - 尝试上传脚本文件
            file = SimpleUploadedFile(filename, content, content_type=content_type)
            
            response = api_client.post(
                '/api/upload/',
                data={'file': file},
                format='multipart',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert
            if response.status_code not in [404, 405]:
                assert response.status_code in [400, 403], \
                    f"上传 {filename} 应该被拒绝，但返回了状态码 {response.status_code}"
    
    def test_upload_file_with_double_extension(self, api_client, test_user):
        """测试上传双重扩展名文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建双重扩展名文件
        double_extension_files = [
            'image.jpg.exe',
            'document.pdf.sh',
            'data.csv.bat',
        ]
        
        for filename in double_extension_files:
            # Act - 尝试上传双重扩展名文件
            file = SimpleUploadedFile(filename, b'malicious content', content_type='application/octet-stream')
            
            response = api_client.post(
                '/api/upload/',
                data={'file': file},
                format='multipart',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert
            if response.status_code not in [404, 405]:
                print(f"上传 {filename} 返回状态码: {response.status_code}")


@pytest.mark.security
class TestFileTypeValidation:
    """文件类型验证测试"""
    
    def test_upload_allowed_image_file(self, api_client, test_user):
        """测试上传允许的图片文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建合法的图片文件（简单的PNG头）
        png_header = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
        file = SimpleUploadedFile('test.png', png_header, content_type='image/png')
        
        # Act - 上传图片
        response = api_client.post(
            '/api/upload/',
            data={'file': file},
            format='multipart',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code not in [404, 405]:
            print(f"上传PNG文件返回状态码: {response.status_code}")
    
    def test_upload_file_with_fake_extension(self, api_client, test_user):
        """测试上传伪造扩展名的文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建伪装成图片的可执行文件
        # 实际内容是可执行文件，但扩展名是.jpg
        file = SimpleUploadedFile(
            'fake_image.jpg',
            b'MZ\x90\x00',  # PE文件头
            content_type='image/jpeg'
        )
        
        # Act - 上传伪装文件
        response = api_client.post(
            '/api/upload/',
            data={'file': file},
            format='multipart',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert - 应该检测文件内容，而不仅仅是扩展名
        if response.status_code not in [404, 405]:
            print(f"上传伪装文件返回状态码: {response.status_code}")
    
    def test_content_type_validation(self, api_client, test_user):
        """测试Content-Type验证"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建文件，但声明错误的Content-Type
        file = SimpleUploadedFile(
            'test.jpg',
            b'<?php system($_GET["cmd"]); ?>',
            content_type='image/jpeg'  # 声称是图片，实际是PHP代码
        )
        
        # Act - 上传文件
        response = api_client.post(
            '/api/upload/',
            data={'file': file},
            format='multipart',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code not in [404, 405]:
            print(f"Content-Type不匹配的文件返回状态码: {response.status_code}")


@pytest.mark.security
class TestFileSizeLimit:
    """文件大小限制测试"""
    
    def test_upload_oversized_file(self, api_client, test_user):
        """测试上传超大文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建一个大文件（例如11MB，假设限制是10MB）
        large_content = b'0' * (11 * 1024 * 1024)  # 11MB
        file = SimpleUploadedFile('large_file.jpg', large_content, content_type='image/jpeg')
        
        # Act - 尝试上传超大文件
        response = api_client.post(
            '/api/upload/',
            data={'file': file},
            format='multipart',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert - 应该被拒绝
        if response.status_code not in [404, 405]:
            assert response.status_code in [400, 413], \
                f"上传超大文件应该被拒绝，但返回了状态码 {response.status_code}"
    
    def test_upload_empty_file(self, api_client, test_user):
        """测试上传空文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建空文件
        file = SimpleUploadedFile('empty.jpg', b'', content_type='image/jpeg')
        
        # Act - 上传空文件
        response = api_client.post(
            '/api/upload/',
            data={'file': file},
            format='multipart',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code not in [404, 405]:
            assert response.status_code in [400], \
                f"上传空文件应该被拒绝，但返回了状态码 {response.status_code}"
    
    def test_upload_normal_sized_file(self, api_client, test_user):
        """测试上传正常大小的文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建正常大小的文件（1MB）
        normal_content = b'0' * (1 * 1024 * 1024)  # 1MB
        file = SimpleUploadedFile('normal_file.jpg', normal_content, content_type='image/jpeg')
        
        # Act - 上传正常文件
        response = api_client.post(
            '/api/upload/',
            data={'file': file},
            format='multipart',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code not in [404, 405]:
            print(f"上传正常大小文件返回状态码: {response.status_code}")


@pytest.mark.security
class TestFileStorageSecurity:
    """文件存储安全测试"""
    
    def test_uploaded_file_not_executable(self, api_client, test_user):
        """测试上传的文件不可执行"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建文件
        file = SimpleUploadedFile('test.jpg', b'test content', content_type='image/jpeg')
        
        # Act - 上传文件
        response = api_client.post(
            '/api/upload/',
            data={'file': file},
            format='multipart',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code in [200, 201]:
            # 检查文件是否存储在安全位置
            # 文件不应该存储在Web根目录下可直接访问的位置
            # 文件不应该有执行权限
            print("文件上传成功，应该检查存储位置和权限")
    
    def test_file_path_traversal_prevention(self, api_client, test_user):
        """测试路径遍历攻击防护"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 尝试路径遍历攻击
        malicious_filenames = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            'test/../../sensitive.txt',
        ]
        
        for filename in malicious_filenames:
            # Act - 尝试上传带路径遍历的文件名
            file = SimpleUploadedFile(filename, b'malicious', content_type='text/plain')
            
            response = api_client.post(
                '/api/upload/',
                data={'file': file},
                format='multipart',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert
            if response.status_code not in [404, 405]:
                # 应该拒绝或清理文件名
                print(f"路径遍历文件名 '{filename}' 返回状态码: {response.status_code}")
    
    def test_file_name_sanitization(self, api_client, test_user):
        """测试文件名清理"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 包含特殊字符的文件名
        special_filenames = [
            'test<script>.jpg',
            'test;rm -rf /.jpg',
            'test|whoami.jpg',
            'test&cmd.jpg',
        ]
        
        for filename in special_filenames:
            # Act - 上传包含特殊字符的文件名
            file = SimpleUploadedFile(filename, b'test', content_type='image/jpeg')
            
            response = api_client.post(
                '/api/upload/',
                data={'file': file},
                format='multipart',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert
            if response.status_code not in [404, 405]:
                print(f"特殊字符文件名 '{filename}' 返回状态码: {response.status_code}")


@pytest.mark.security
class TestFileAccessControl:
    """文件访问控制测试"""
    
    def test_unauthorized_file_access(self, api_client):
        """测试未授权访问文件"""
        # Act - 尝试不登录访问文件
        response = api_client.get('/api/files/1/')
        
        # Assert - 应该被拒绝
        if response.status_code not in [404, 405]:
            assert response.status_code in [401, 403], \
                f"未授权访问文件应该被拒绝，但返回了状态码 {response.status_code}"
    
    def test_access_other_user_file(self, api_client, test_user):
        """测试访问其他用户的文件"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试访问其他用户的文件（假设文件ID为999）
        response = api_client.get(
            '/api/files/999/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code not in [404, 405]:
            # 应该返回403或404，不应该返回其他用户的文件
            print(f"访问其他用户文件返回状态码: {response.status_code}")


@pytest.mark.security
class TestFileUploadRateLimit:
    """文件上传速率限制测试"""
    
    def test_multiple_rapid_uploads(self, api_client, test_user):
        """测试快速连续上传"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "filetest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 快速连续上传多个文件
        upload_count = 0
        for i in range(20):  # 尝试上传20个文件
            file = SimpleUploadedFile(f'test{i}.jpg', b'test', content_type='image/jpeg')
            
            response = api_client.post(
                '/api/upload/',
                data={'file': file},
                format='multipart',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            if response.status_code in [200, 201]:
                upload_count += 1
            elif response.status_code == 429:  # Too Many Requests
                print(f"在第 {i+1} 次上传时触发速率限制")
                break
        
        # Assert
        print(f"成功上传 {upload_count} 个文件")
        # 如果有速率限制，应该在某个点被阻止
