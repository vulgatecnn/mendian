# 依赖安全扫描报告

**生成时间**: 2025-11-04T20:46:40.358259

## 执行摘要

### 后端 (Python)
- **安全漏洞**: 0 个（严重: 0, 高危: 0, 中危: 0, 低危: 0）
- **受影响的包**: 0 个
- **过期的包**: 29 个

### 前端 (Node.js)
- **安全漏洞**: 2 个（严重: 0, 高危: 0, 中危: 2, 低危: 0, 信息: 0）
- **受影响的包**: 2 个
- **过期的包**: 11 个

## 详细结果

### 1. 后端 Python 依赖

✓ 未发现安全漏洞

#### 过期的包（前10个）

- **astroid**: 3.0.3 → 4.0.1
- **bandit**: 1.7.6 → 1.8.6
- **celery**: 5.3.4 → 5.5.3
- **cryptography**: 41.0.7 → 46.0.3
- **cyclonedx-python-lib**: 7.6.2 → 11.5.0
- **Django**: 4.2.7 → 5.2.7
- **django-cors-headers**: 4.3.0 → 4.9.0
- **django-filter**: 24.3 → 25.2
- **djangorestframework**: 3.14.0 → 3.16.1
- **drf-spectacular**: 0.26.5 → 0.29.0

### 2. 前端 Node.js 依赖

发现 2 个安全漏洞：

#### 受影响的包（前10个）

1. **esbuild**
   - 严重程度: moderate
   - 影响范围: <=0.24.2

2. **vite**
   - 严重程度: moderate
   - 影响范围: 0.11.0 - 6.1.6

#### 过期的包（前10个）

- **@types/react**: 18.3.26 → 19.2.2
- **@types/react-dom**: 18.3.7 → 19.2.2
- **@typescript-eslint/eslint-plugin**: 6.21.0 → 8.46.3
- **@typescript-eslint/parser**: 6.21.0 → 8.46.3
- **@vitejs/plugin-react**: 4.7.0 → 5.1.0
- **eslint**: 8.57.1 → 9.39.1
- **eslint-plugin-react-hooks**: 4.6.2 → 7.0.1
- **react**: 18.3.1 → 19.2.0
- **react-dom**: 18.3.1 → 19.2.0
- **react-router-dom**: 6.30.1 → 7.9.5

## 修复建议

### 优先级
1. **立即修复**: 严重 (Critical) 和高危 (High) 漏洞
2. **计划修复**: 中危 (Medium) 漏洞
3. **可选修复**: 低危 (Low) 和信息 (Info) 级别的问题

### 后端 Python 依赖
```bash
# 升级特定包
pip install --upgrade <package-name>

# 或使用 pip-audit 自动修复
pip-audit --fix
```

### 前端 Node.js 依赖
```bash
# 自动修复（如果可能）
npm audit fix

# 强制修复（可能引入破坏性更改）
npm audit fix --force

# 手动升级特定包
npm install <package-name>@latest
```

### 注意事项
- 升级依赖前请先备份代码
- 升级后运行完整的测试套件
- 检查是否有破坏性更改
- 更新 requirements.txt 和 package.json

## 附录

完整的 JSON 格式报告: `dependency_security_report.json`
