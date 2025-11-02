# 端口配置说明

## 端口分配

- **前端开发服务器**: 5000
- **后端 API 服务器**: 5100

## 配置方式

### 后端配置

后端端口通过 `backend/.env` 文件配置：

```env
BACKEND_PORT=5100
FRONTEND_URL=http://localhost:5000
```

启动脚本会自动从 `.env` 文件读取端口号：
- Linux/Mac: `./start.sh`
- Windows: `start.bat`

### 前端配置

前端端口和后端 API 地址通过 `frontend/.env` 文件配置：

```env
VITE_PORT=5000
VITE_API_BASE_URL=http://localhost:5100
```

Vite 配置文件 (`vite.config.ts`) 会自动读取这些环境变量。

## 启动服务

### 启动后端

```bash
cd backend
# Linux/Mac
./start.sh

# Windows
start.bat
```

后端将在 `http://localhost:5100` 启动

### 启动前端

```bash
cd frontend
pnpm install  # 首次运行需要安装依赖
pnpm dev
```

前端将在 `http://localhost:5000` 启动

## 修改端口

如需修改端口号，只需编辑对应的 `.env` 文件：

1. 修改 `backend/.env` 中的 `BACKEND_PORT` 和 `FRONTEND_URL`
2. 修改 `frontend/.env` 中的 `VITE_PORT` 和 `VITE_API_BASE_URL`
3. 重启服务即可生效

## 注意事项

- `.env` 文件包含敏感信息，已添加到 `.gitignore`，不会提交到版本控制
- `.env.example` 文件是配置模板，可以提交到版本控制
- 首次部署时，需要复制 `.env.example` 为 `.env` 并修改相应配置
- 确保前端的 `VITE_API_BASE_URL` 与后端的实际运行地址一致
- 确保后端的 `FRONTEND_URL` 与前端的实际运行地址一致（用于 CORS 配置）
