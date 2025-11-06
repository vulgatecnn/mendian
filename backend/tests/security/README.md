# 安全测试指南

## 概述

本目录包含了对好饭碗门店生命周期管理系统的全面安全测试。这些测试旨在发现和验证系统的安全防护能力，包括认证、授权、注入攻击、跨站攻击等多个安全领域。

## 测试文件结构

```
backend/tests/security/
├── README.md                              # 本文件
├── SECURITY_TEST_SUMMARY.md              # 测试总结文档
├── test_authentication_security.py        # 认证安全测试
├── test_authorization_security.py         # 授权安全测试
├── test_sql_injection.py                  # SQL注入测试
├── test_xss_protection.py                 # XSS攻击测试
├── test_csrf_protection.py                # CSRF攻击测试
├── test_file_upload_security.py           # 文件上传安全测试
└── test_sensitive_data_exposure.py        # 敏感信息泄露测试
```

## 快速开始

### 前置条件

1. 确保已安装所有依赖：
```bash
cd backend
pip install -r requirements.txt
```

2. 确保测试数据库已配置：
```bash
python manage.py migrate --settings=store_lifecycle.settings
```

### 运行所有安全测试

```bash
# 运行所有安全测试
python -m pytest tests/security/ -v -m security

# 运行所有安全测试并生成覆盖率报告
python -m pytest tests/security/ -v -m security --cov=. --cov-report=html
```

### 运行特定测试文件

```bash
# 1. 认证安全测试
python -m pytest tests/security/test_authentication_security.py -v

# 2. 授权安全测试
python -m pytest tests/security/test_authorization_security.py -v

# 3. SQL注入测试
python -m pytest tests/security/test_sql_injection.py -v

# 4. XSS攻击测试
python -m pytest tests/security/test_xss_protection.py -v

# 5. CSRF攻击测试
python -m pytest tests/security/test_csrf_protection.py -v

# 6. 文件上传安全测试
python -m pytest tests/security/test_file_upload_security.py -v

# 7. 敏感信息泄露测试
python -m pytest tests/security/test_sensitive_data_exposure.py -v
```

### 运行特定测试类

```bash
# 运行未授权访问测试
python -m pytest tests/security/test_authorization_security.py::TestUnauthorizedAccess -v

# 运行垂直越权测试
python -m pytest tests/security/test_authorization_security.py::TestVerticalPrivilegeEscalation -v

# 运行水平越权测试
python -m pytest tests/security/test_authorization_security.py::TestHorizontalPrivilegeEscalation -v

# 运行SQL注入搜索测试
python -m pytest tests/security/test_sql_injection.py::TestSQLInjectionInSearch -v

# 运行XSS输入框测试
python -m pytest tests/security/test_xss_protection.py::TestXSSInInputFields -v
```

### 运行特定测试用例

```bash
# 运行单个测试用例
python -m pytest tests/security/test_authorization_security.py::TestUnauthorizedAccess::test_access_user_list_without_login -v
```

## 测试详解

### 1. 认证安全测试 (test_authentication_security.py)

**目的**: 验证用户认证机制的安全性

**测试内容**:
- 密码是否安全加密存储
- Token是否有过期机制
- Token刷新是否安全
- 会话管理是否安全

**关键测试**:
- `test_password_encrypted_in_database`: 验证密码加密
- `test_token_expiration`: 验证Token过期
- `test_refresh_token_security`: 验证Token刷新

### 2. 授权安全测试 (test_authorization_security.py)

**目的**: 验证访问控制和权限管理

**测试内容**:
- 未登录用户无法访问受保护资源
- 普通用户无法访问管理员功能（垂直越权）
- 用户A无法访问用户B的数据（水平越权）
- 角色权限控制有效性
- 数据隔离机制

**关键测试**:
- `test_access_user_list_without_login`: 未授权访问
- `test_normal_user_access_user_management`: 垂直越权
- `test_user_a_access_user_b_plan`: 水平越权
- `test_admin_can_access_user_management`: 角色权限

### 3. SQL注入测试 (test_sql_injection.py)

**目的**: 验证系统对SQL注入攻击的防护

**测试内容**:
- 搜索框SQL注入防护
- URL参数SQL注入防护
- POST数据SQL注入防护
- ORM参数化查询验证
- 数据不被SQL注入破坏

**测试载荷**:
```sql
' OR '1'='1
' OR '1'='1' --
admin'--
'; DROP TABLE users--
' UNION SELECT NULL--
```

**关键测试**:
- `test_sql_injection_in_username_search`: 搜索注入
- `test_sql_injection_in_login_username`: 登录注入
- `test_orm_parameterized_queries`: ORM防护

### 4. XSS攻击测试 (test_xss_protection.py)

**目的**: 验证系统对跨站脚本攻击的防护

**测试内容**:
- 输入框XSS防护
- URL参数XSS防护
- JSON响应编码
- 存储型XSS防护
- 输出转义验证

**测试载荷**:
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
javascript:alert('XSS')
<iframe src='javascript:alert("XSS")'></iframe>
```

**关键测试**:
- `test_xss_in_plan_name`: 输入框XSS
- `test_stored_xss_in_database`: 存储型XSS
- `test_json_response_encoding`: JSON编码

### 5. CSRF攻击测试 (test_csrf_protection.py)

**目的**: 验证系统对跨站请求伪造的防护

**测试内容**:
- CSRF Token存在性
- CSRF Token有效性验证
- API Token与CSRF关系
- CSRF攻击场景模拟
- Token轮换机制

**关键测试**:
- `test_post_request_requires_csrf_token`: Token要求
- `test_api_token_authentication_csrf_exempt`: API Token豁免
- `test_csrf_attack_on_delete_operation`: 删除攻击
- `test_jwt_token_not_vulnerable_to_csrf`: JWT安全性

### 6. 文件上传安全测试 (test_file_upload_security.py)

**目的**: 验证文件上传功能的安全性

**测试内容**:
- 恶意文件上传防护
- 文件类型验证
- 文件大小限制
- 文件存储安全
- 路径遍历防护
- 文件访问控制

**测试文件类型**:
- 可执行文件: `.exe`, `.sh`, `.bat`
- 脚本文件: `.php`, `.jsp`, `.py`
- 双重扩展名: `.jpg.exe`, `.pdf.sh`

**关键测试**:
- `test_upload_executable_file`: 可执行文件
- `test_upload_oversized_file`: 文件大小
- `test_file_path_traversal_prevention`: 路径遍历
- `test_unauthorized_file_access`: 访问控制

### 7. 敏感信息泄露测试 (test_sensitive_data_exposure.py)

**目的**: 验证系统不泄露敏感信息

**测试内容**:
- 密码不在API响应中
- Token不在日志中
- 错误消息不泄露系统信息
- 日志不记录敏感数据
- 前端代码不包含密钥
- 会话数据不暴露
- 个人信息适当脱敏
- 调试信息不暴露

**关键测试**:
- `test_password_not_in_user_list_response`: 密码保护
- `test_token_not_in_logs`: Token保护
- `test_error_message_not_expose_system_info`: 错误消息
- `test_debug_mode_disabled_in_production`: 调试模式

## 测试结果解读

### 成功的测试
- ✅ 表示安全机制正常工作
- 系统正确阻止了攻击尝试
- 敏感信息得到了保护

### 失败的测试
- ❌ 表示发现了安全漏洞
- 需要立即修复
- 应该添加到Bug清单

### 跳过的测试
- ⏭️ 表示测试条件不满足
- 可能是功能未实现
- 或者测试环境问题

## 常见问题

### Q1: 为什么有些测试会跳过？
A: 某些测试依赖特定的API端点或功能。如果这些端点不存在（返回404或405），测试会跳过。

### Q2: 如何处理测试失败？
A: 
1. 查看失败原因
2. 确认是否为真实的安全漏洞
3. 如果是漏洞，立即修复
4. 修复后重新运行测试验证

### Q3: 测试覆盖率多少合适？
A: 安全测试应该覆盖所有关键功能和敏感操作，建议达到80%以上。

### Q4: 多久运行一次安全测试？
A: 
- 每次代码提交前运行
- 每次发布前完整运行
- 定期（每周/每月）全面审计

### Q5: 如何添加新的安全测试？
A:
1. 在相应的测试文件中添加测试类或方法
2. 使用`@pytest.mark.security`标记
3. 遵循AAA模式（Arrange-Act-Assert）
4. 添加清晰的文档字符串

## 最佳实践

### 1. 测试隔离
- 每个测试应该独立运行
- 使用fixtures准备测试数据
- 测试后清理创建的数据

### 2. 测试命名
- 使用描述性的测试名称
- 清楚表达测试意图
- 例如：`test_normal_user_cannot_access_admin_resources`

### 3. 断言消息
- 提供清晰的断言消息
- 说明期望的行为
- 帮助快速定位问题

### 4. 测试文档
- 为每个测试添加文档字符串
- 说明测试目的和方法
- 记录重要的测试场景

### 5. 持续更新
- 跟踪最新的安全威胁
- 更新测试载荷
- 添加新的测试场景

## 安全测试检查清单

### 认证与授权
- [ ] 密码安全存储
- [ ] Token安全机制
- [ ] 会话管理
- [ ] 权限控制
- [ ] 越权防护

### 注入攻击
- [ ] SQL注入防护
- [ ] XSS防护
- [ ] 命令注入防护
- [ ] LDAP注入防护

### 会话安全
- [ ] CSRF防护
- [ ] 会话固定防护
- [ ] 会话超时
- [ ] 安全Cookie

### 数据保护
- [ ] 敏感数据加密
- [ ] 传输加密（HTTPS）
- [ ] 数据脱敏
- [ ] 备份安全

### 文件安全
- [ ] 文件类型验证
- [ ] 文件大小限制
- [ ] 路径遍历防护
- [ ] 文件访问控制

### 错误处理
- [ ] 错误消息安全
- [ ] 日志安全
- [ ] 调试模式禁用
- [ ] 异常处理

## 相关资源

### 内部文档
- [测试总结](./SECURITY_TEST_SUMMARY.md)
- [综合测试计划](../../.kiro/specs/comprehensive-testing/)

### 外部资源
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

### 工具
- [pytest](https://docs.pytest.org/)
- [Django Test Client](https://docs.djangoproject.com/en/stable/topics/testing/tools/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)

## 联系方式

如有问题或建议，请联系：
- 安全团队
- 测试团队
- 开发团队

---

**最后更新**: 2025年
**维护者**: 安全测试团队
