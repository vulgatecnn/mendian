# 安全测试执行指南

## 测试执行状态

### ✅ 已完成的测试

1. **认证安全测试** (test_authentication_security.py)
   - 状态: 已完成（前期任务）
   - 测试用例: 密码加密、Token过期、Token刷新

2. **授权安全测试** (test_authorization_security.py)
   - 状态: 已创建并验证
   - 测试用例: 17个
   - 验证状态: ✅ 通过基本测试

3. **SQL注入测试** (test_sql_injection.py)
   - 状态: 已创建并验证
   - 测试用例: 13个
   - 验证状态: ✅ ORM防护测试通过

4. **XSS攻击测试** (test_xss_protection.py)
   - 状态: 已创建
   - 测试用例: 13个
   - 验证状态: 待运行

5. **CSRF攻击测试** (test_csrf_protection.py)
   - 状态: 已创建
   - 测试用例: 16个
   - 验证状态: 待运行

6. **文件上传安全测试** (test_file_upload_security.py)
   - 状态: 已创建
   - 测试用例: 15个
   - 验证状态: 待运行（需要文件上传端点）

7. **敏感信息泄露测试** (test_sensitive_data_exposure.py)
   - 状态: 已创建
   - 测试用例: 19个
   - 验证状态: 待运行

## 测试执行命令

### 快速验证测试

```bash
# 1. 验证授权测试
python -m pytest tests/security/test_authorization_security.py::TestUnauthorizedAccess::test_access_user_list_without_login -v

# 2. 验证SQL注入防护
python -m pytest tests/security/test_sql_injection.py::TestORMProtection::test_orm_parameterized_queries -v

# 3. 验证XSS防护
python -m pytest tests/security/test_xss_protection.py::TestXSSInInputFields::test_xss_in_plan_name -v -s

# 4. 验证CSRF防护
python -m pytest tests/security/test_csrf_protection.py::TestCSRFWithAPIToken::test_jwt_token_not_vulnerable_to_csrf -v

# 5. 验证敏感信息保护
python -m pytest tests/security/test_sensitive_data_exposure.py::TestPasswordExposure -v -s
```

### 完整测试套件

```bash
# 运行所有安全测试
python -m pytest tests/security/ -v -m security

# 运行所有安全测试并生成报告
python -m pytest tests/security/ -v -m security --tb=short --maxfail=5

# 运行所有安全测试并生成覆盖率
python -m pytest tests/security/ -v -m security --cov=. --cov-report=html
```

### 按类别运行

```bash
# 授权相关测试
python -m pytest tests/security/test_authorization_security.py -v

# 注入攻击测试
python -m pytest tests/security/test_sql_injection.py tests/security/test_xss_protection.py -v

# 会话安全测试
python -m pytest tests/security/test_csrf_protection.py tests/security/test_authentication_security.py -v

# 数据保护测试
python -m pytest tests/security/test_sensitive_data_exposure.py tests/security/test_file_upload_security.py -v
```

## 已知问题和注意事项

### 1. API Client配置

**问题**: 某些测试可能遇到JSON解析错误

**原因**: APIClient和Django Test Client的使用差异

**解决方案**:
- 使用APIClient时，确保使用`format='json'`参数
- 或者在POST请求中明确设置`content_type='application/json'`

**示例**:
```python
# 正确的方式
response = api_client.post(
    '/api/auth/login/',
    data=login_data,
    format='json'  # 使用format参数
)

# 或者
response = api_client.post(
    '/api/auth/login/',
    data=json.dumps(login_data),
    content_type='application/json'
)
```

### 2. 文件上传端点

**问题**: 文件上传测试可能返回404

**原因**: 系统可能没有通用的文件上传端点

**解决方案**:
- 测试会检查端点是否存在（404/405）
- 如果端点不存在，测试会跳过
- 需要根据实际的文件上传API调整测试

### 3. CSRF测试

**问题**: API使用JWT Token，可能不使用CSRF Token

**原因**: JWT Token存储在localStorage，不会被浏览器自动发送

**解决方案**:
- 测试会验证JWT Token不受CSRF影响
- 如果使用Session认证，需要CSRF保护
- 测试会检查两种情况

### 4. 测试数据清理

**问题**: 某些测试可能创建数据但未清理

**原因**: 测试失败或异常退出

**解决方案**:
- 使用pytest的数据库事务回滚
- 在fixture中使用yield进行清理
- 定期清理测试数据库

## 测试结果分析

### 成功的测试示例

```
tests/security/test_authorization_security.py::TestUnauthorizedAccess::test_access_user_list_without_login PASSED [100%]
```

**含义**: 
- ✅ 未登录用户无法访问用户列表
- 系统正确返回401或403状态码
- 授权机制工作正常

### 失败的测试示例

```
tests/security/test_authorization_security.py::TestVerticalPrivilegeEscalation::test_normal_user_access_user_management FAILED
AssertionError: 普通用户访问管理功能应该被拒绝，但返回了状态码 200
```

**含义**:
- ❌ 发现垂直越权漏洞
- 普通用户可以访问管理员功能
- 需要立即修复权限控制

### 跳过的测试示例

```
tests/security/test_file_upload_security.py::TestMaliciousFileUpload::test_upload_executable_file SKIPPED
```

**含义**:
- ⏭️ 文件上传端点不存在（404）
- 测试条件不满足
- 功能可能未实现或端点路径不同

## 测试报告生成

### 生成HTML报告

```bash
# 安装pytest-html
pip install pytest-html

# 生成HTML报告
python -m pytest tests/security/ -v --html=security_test_report.html --self-contained-html
```

### 生成JSON报告

```bash
# 安装pytest-json-report
pip install pytest-json-report

# 生成JSON报告
python -m pytest tests/security/ -v --json-report --json-report-file=security_test_report.json
```

### 生成覆盖率报告

```bash
# 生成HTML覆盖率报告
python -m pytest tests/security/ -v --cov=. --cov-report=html

# 查看报告
# 打开 htmlcov/index.html
```

## 持续集成配置

### GitHub Actions示例

```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run security tests
      run: |
        cd backend
        python -m pytest tests/security/ -v -m security --maxfail=5
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v2
      with:
        name: security-test-results
        path: backend/test-results/
```

## 下一步行动

### 立即执行

1. ✅ 创建所有安全测试文件
2. ✅ 配置pytest标记
3. ⏳ 运行完整测试套件
4. ⏳ 分析测试结果
5. ⏳ 修复发现的问题

### 短期计划

1. 完善测试覆盖率
2. 添加更多测试场景
3. 集成到CI/CD流程
4. 建立安全测试基线

### 长期计划

1. 定期更新测试用例
2. 跟踪新的安全威胁
3. 自动化安全扫描
4. 安全培训和意识提升

## 测试维护

### 定期检查

- [ ] 每周运行完整测试套件
- [ ] 每月更新测试载荷
- [ ] 每季度审查测试覆盖率
- [ ] 每年进行全面安全审计

### 测试更新

- [ ] 跟踪OWASP Top 10更新
- [ ] 关注CVE漏洞公告
- [ ] 学习新的攻击技术
- [ ] 更新测试文档

### 问题跟踪

- [ ] 记录所有发现的问题
- [ ] 跟踪修复进度
- [ ] 验证修复效果
- [ ] 更新测试用例

## 联系和支持

### 遇到问题？

1. 查看[README.md](./README.md)
2. 查看[测试总结](./SECURITY_TEST_SUMMARY.md)
3. 联系安全团队
4. 提交Issue

### 贡献测试

1. Fork项目
2. 创建测试分支
3. 添加测试用例
4. 提交Pull Request

---

**最后更新**: 2025年
**维护者**: 安全测试团队
**状态**: 测试文件已创建，待完整执行
