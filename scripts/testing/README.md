# 测试脚本

这个目录包含用于测试前后端连接和服务状态的脚本。

## 文件说明

### test_connection.js
Node.js脚本，用于测试前后端API连接。

**使用方法：**
```bash
# 确保已安装axios
npm install axios

# 运行测试
node scripts/testing/test_connection.js
```

**测试内容：**
- 后端服务器状态
- 前端服务器状态
- API文档访问
- OpenAPI Schema
- CORS预检请求
- API权限验证

### test_connection.ps1
PowerShell脚本，用于Windows环境下测试前后端连接。

**使用方法：**
```powershell
# 在PowerShell中运行
.\scripts\testing\test_connection.ps1
```

**测试内容：**
- 后端服务器状态
- 前端服务器状态
- API文档访问
- OpenAPI Schema
- API权限验证

### api_test.html
浏览器端测试页面，提供可视化的API测试界面。

**使用方法：**
1. 确保前后端服务都在运行
2. 在浏览器中打开 `scripts/testing/api_test.html`
3. 点击各个测试按钮进行测试

**功能：**
- 服务状态检查
- API连接测试
- CORS测试
- 登录功能测试

## 前置条件

运行这些测试脚本前，请确保：

1. 后端服务正在运行（默认端口：8000）
   ```bash
   cd backend
   python manage.py runserver
   ```

2. 前端服务正在运行（默认端口：5000）
   ```bash
   cd frontend
   pnpm dev
   ```

## 测试场景

### 开发环境测试
在开发过程中，使用这些脚本快速验证前后端连接是否正常。

### 部署后验证
部署到新环境后，使用这些脚本验证服务是否正确配置。

### 故障排查
当遇到连接问题时，使用这些脚本定位问题所在。

## 注意事项

1. 这些脚本用于开发和测试环境，不应在生产环境中使用
2. 默认使用 localhost 和标准端口，如需修改请编辑脚本中的URL配置
3. 测试脚本不会修改任何数据，可以安全运行
