# 企业微信集成快速入门

## 5 分钟快速开始

### 步骤 1: 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 步骤 2: 配置企业微信凭证

编辑 `backend/.env` 文件，添加企业微信配置：

```env
WECHAT_CORP_ID=ww1234567890abcdef
WECHAT_AGENT_ID=1000001
WECHAT_SECRET=your_secret_key_here
```

**获取凭证**:
1. 登录企业微信管理后台: https://work.weixin.qq.com/
2. "我的企业" → 复制 **企业 ID**
3. "应用管理" → 选择应用 → 复制 **AgentId** 和 **Secret**

### 步骤 3: 测试连接

```bash
python system_management/services/test_wechat.py
```

如果看到 "✓ 配置验证通过" 和 "连接成功: True"，说明配置正确！

### 步骤 4: 同步数据

在 Django shell 中执行：

```bash
python manage.py shell
```

```python
from system_management.services import wechat_service

# 同步部门
dept_result = wechat_service.sync_departments()
print(f"部门同步: {dept_result['created']} 个新增, {dept_result['updated']} 个更新")

# 同步用户
user_result = wechat_service.sync_users()
print(f"用户同步: {user_result['created']} 个新增, {user_result['updated']} 个更新")

# 查看部门树
tree = wechat_service.get_department_tree()
print(f"共有 {len(tree)} 个根部门")
```

### 步骤 5: 验证数据

```python
from system_management.models import Department, User

# 查看部门数量
print(f"部门总数: {Department.objects.count()}")

# 查看用户数量
print(f"用户总数: {User.objects.count()}")

# 查看根部门
for dept in Department.objects.filter(parent__isnull=True):
    print(f"- {dept.name} (子部门: {dept.children.count()})")
```

## 常用操作

### 定期同步

建议每天同步一次，保持数据最新：

```python
from system_management.services import wechat_service

# 完整同步（部门 + 用户）
result = wechat_service.sync_all()
```

### 同步指定部门

```python
# 只同步某个部门的用户
result = wechat_service.sync_users(department_id=1, fetch_child=True)
```

### 查看同步日志

```bash
tail -f backend/logs/django.log
```

## 故障排查

### 问题 1: 配置无效

**错误**: `企业微信配置无效`

**解决**:
1. 检查 `.env` 文件是否存在
2. 确认三个配置项都已填写
3. 重启 Django 服务

### 问题 2: 连接失败

**错误**: `连接测试失败`

**解决**:
1. 检查网络连接
2. 确认企业微信凭证正确
3. 查看日志: `tail -f backend/logs/django.log`

### 问题 3: 同步失败

**错误**: `同步失败`

**解决**:
1. 查看详细错误信息: `result['errors']`
2. 检查企业微信应用权限
3. 确认数据库连接正常

## 下一步

- 📖 阅读完整文档: `services/README.md`
- 🔧 查看实施总结: `WECHAT_INTEGRATION.md`
- 🧪 运行测试脚本: `services/test_wechat.py`
- 📝 查看 API 文档: 启动服务后访问 `/api/schema/swagger-ui/`

## 需要帮助？

查看日志文件获取详细信息：
```bash
tail -100 backend/logs/django.log
```

或联系开发团队。
