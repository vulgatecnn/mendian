# 网络异常测试指南

## 测试目的
验证系统在网络异常情况下的错误处理和用户体验

## 测试工具
- Chrome DevTools (Network面板)
- Playwright (自动化测试)
- 后端超时配置

## 8.3 网络异常测试用例

### 1. 模拟网络超时

#### 使用Chrome DevTools
1. 打开Chrome浏览器，访问系统
2. 按F12打开DevTools
3. 切换到Network面板
4. 点击右上角的"No throttling"下拉菜单
5. 选择"Add custom profile"
6. 设置：
   - Download: 0 kb/s
   - Upload: 0 kb/s
   - Latency: 10000 ms (10秒)
7. 执行操作（如登录、提交表单）
8. 观察系统行为

**预期结果**：
- ✅ 显示加载指示器
- ✅ 在合理时间后显示超时错误提示
- ✅ 提供重试选项
- ✅ 不会导致页面崩溃

**实际结果**：
- [ ] 待测试

#### 使用后端配置
在Django settings中设置：
```python
# 请求超时设置
REQUEST_TIMEOUT = 30  # 30秒
```

### 2. 模拟网络断开

#### 使用Chrome DevTools
1. 打开Chrome DevTools
2. 切换到Network面板
3. 勾选"Offline"复选框
4. 尝试执行需要网络的操作

**预期结果**：
- ✅ 显示"网络连接失败"错误提示
- ✅ 提供重试按钮
- ✅ 本地数据不丢失（如表单输入）
- ✅ 恢复网络后可以继续操作

**实际结果**：
- [ ] 待测试

### 3. 模拟慢速网络（3G）

#### 使用Chrome DevTools
1. 打开Chrome DevTools
2. 切换到Network面板
3. 选择"Slow 3G"预设
4. 执行各种操作

**预期结果**：
- ✅ 页面可以正常加载（虽然慢）
- ✅ 显示加载进度
- ✅ 图片和资源逐步加载
- ✅ 不会出现超时错误
- ✅ 用户体验可接受

**实际结果**：
- [ ] 待测试

### 4. 验证错误提示和重试机制

#### 测试场景
1. **登录超时**
   - 操作：在慢速网络下登录
   - 预期：显示超时提示，提供重试按钮

2. **表单提交超时**
   - 操作：提交大表单时断网
   - 预期：保留表单数据，提示网络错误，可重试

3. **文件上传超时**
   - 操作：上传大文件时断网
   - 预期：显示上传失败，可重新上传

4. **列表加载超时**
   - 操作：加载数据列表时网络慢
   - 预期：显示加载中，超时后提示错误

### 5. 记录网络异常处理问题

#### 发现的问题模板
```markdown
**问题编号**: NET-001
**严重程度**: P1/P2/P3
**问题描述**: [详细描述]
**重现步骤**:
1. 
2. 
3. 
**预期行为**: [应该如何处理]
**实际行为**: [实际发生了什么]
**影响范围**: [哪些功能受影响]
**建议修复**: [如何修复]
```

## 自动化测试脚本

### 使用Playwright进行网络异常测试

```python
# tests/e2e/test_network_exceptions.py
import pytest
from playwright.sync_api import Page, expect

@pytest.mark.e2e
class TestNetworkExceptions:
    """网络异常端到端测试"""
    
    def test_offline_mode(self, page: Page):
        """测试离线模式"""
        # 访问页面
        page.goto('http://localhost:5173/pc/login')
        
        # 设置离线模式
        page.context.set_offline(True)
        
        # 尝试登录
        page.fill('input[name="username"]', 'testuser')
        page.fill('input[name="password"]', 'testpass123')
        page.click('button[type="submit"]')
        
        # 验证错误提示
        expect(page.locator('.error-message')).to_contain_text('网络')
    
    def test_slow_network(self, page: Page):
        """测试慢速网络"""
        # 模拟慢速3G
        page.context.route('**/*', lambda route: route.continue_(
            delay=3000  # 3秒延迟
        ))
        
        # 访问页面
        page.goto('http://localhost:5173/pc/login')
        
        # 验证加载指示器
        expect(page.locator('.loading-indicator')).to_be_visible()
    
    def test_request_timeout(self, page: Page):
        """测试请求超时"""
        # 模拟超时
        page.context.route('**/api/**', lambda route: route.abort())
        
        # 访问页面并尝试操作
        page.goto('http://localhost:5173/pc/login')
        page.fill('input[name="username"]', 'testuser')
        page.fill('input[name="password"]', 'testpass123')
        page.click('button[type="submit"]')
        
        # 验证超时错误
        expect(page.locator('.error-message')).to_be_visible()
```

## 后端超时测试

### 测试API超时处理

```python
# tests/integration/test_api_timeout.py
import pytest
import time
from django.test import Client
from unittest.mock import patch

@pytest.mark.django_db
class TestAPITimeout:
    """测试API超时处理"""
    
    def test_slow_database_query(self, authenticated_client):
        """测试慢查询超时"""
        # 模拟慢查询
        with patch('time.sleep') as mock_sleep:
            mock_sleep.side_effect = lambda x: time.sleep(0.1)
            
            response = authenticated_client.get('/api/users/')
            
            # 应该在合理时间内返回
            assert response.status_code in [200, 408, 504]
    
    def test_external_api_timeout(self, authenticated_client):
        """测试外部API调用超时"""
        # 模拟外部API超时
        with patch('requests.get') as mock_get:
            mock_get.side_effect = TimeoutError()
            
            response = authenticated_client.get('/api/external-data/')
            
            # 应该返回超时错误
            assert response.status_code in [408, 504]
```

## 测试检查清单

### 前端网络异常处理
- [ ] 显示加载指示器
- [ ] 超时后显示错误提示
- [ ] 提供重试按钮
- [ ] 保留用户输入数据
- [ ] 网络恢复后自动重试（可选）
- [ ] 错误提示清晰易懂
- [ ] 不会导致页面崩溃

### 后端网络异常处理
- [ ] 设置合理的超时时间
- [ ] 返回适当的HTTP状态码（408, 504）
- [ ] 记录超时日志
- [ ] 释放资源（数据库连接等）
- [ ] 支持请求重试
- [ ] 幂等性保证（重试不会重复操作）

### 用户体验
- [ ] 错误提示友好
- [ ] 提供明确的操作指引
- [ ] 不丢失用户数据
- [ ] 加载状态清晰
- [ ] 可以取消长时间操作

## 测试报告模板

```markdown
# 网络异常测试报告

## 测试概况
- 测试日期：YYYY-MM-DD
- 测试人员：[姓名]
- 测试环境：[环境描述]

## 测试结果

### 网络超时测试
- 测试用例数：X
- 通过数：Y
- 失败数：Z
- 发现问题：N个

### 网络断开测试
- 测试用例数：X
- 通过数：Y
- 失败数：Z
- 发现问题：N个

### 慢速网络测试
- 测试用例数：X
- 通过数：Y
- 失败数：Z
- 发现问题：N个

## 发现的问题

### P1 - 高优先级
1. [问题描述]

### P2 - 中优先级
1. [问题描述]

### P3 - 低优先级
1. [问题描述]

## 建议
1. [改进建议]
2. [改进建议]
```

## 注意事项

1. **测试环境**：在测试环境进行，避免影响生产数据
2. **数据备份**：测试前备份重要数据
3. **时间安排**：网络异常测试可能耗时较长
4. **真实场景**：尽量模拟真实用户的网络环境
5. **多设备测试**：在不同设备和网络条件下测试

## 参考资料

- [Chrome DevTools Network Throttling](https://developer.chrome.com/docs/devtools/network/)
- [Playwright Network Emulation](https://playwright.dev/docs/network)
- [Django Request Timeout](https://docs.djangoproject.com/en/4.2/ref/settings/)
