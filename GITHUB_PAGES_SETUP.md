# 📖 GitHub Pages 部署指南

## 🎉 恭喜！您的 GitHub Pages 部署配置已就绪

**仓库地址**: https://github.com/vulgatecnn/mendian  
**预期网站 URL**: https://vulgatecnn.github.io/mendian

## 🚀 立即启用 GitHub Pages

### 步骤1：启用 GitHub Pages

1. **访问仓库设置页面**：
   https://github.com/vulgatecnn/mendian/settings/pages

2. **配置部署源**：
   - **Source**: 选择 "GitHub Actions"
   - ✅ 这是最新的推荐方式，支持自定义构建流程

3. **等待首次部署**：
   - 配置保存后，GitHub Actions 会自动触发
   - 首次部署大约需要 2-5 分钟

### 步骤2：验证部署

1. **检查 Actions 状态**：
   https://github.com/vulgatecnn/mendian/actions

2. **访问您的网站**：
   https://vulgatecnn.github.io/mendian

## 📊 部署特性

### ✨ 自动化部署
- **触发条件**: 推送到 `main` 或 `master` 分支
- **构建时间**: 通常 2-5 分钟
- **更新延迟**: 部署后立即生效

### 🔧 智能检测
- **项目结构**: 自动检测工作区/单项目结构
- **包管理器**: 支持 pnpm、yarn、npm
- **构建工具**: 支持 Vite、Create React App、Webpack

### 🌐 生产优化
- **基础路径**: 自动配置 `/mendian` 路径
- **SPA 路由**: 支持前端路由 (404.html 重定向)
- **SEO 友好**: 禁用 Jekyll 处理 (.nojekyll)
- **缓存优化**: 静态资源缓存配置

### 🔒 安全检查
- **敏感文件扫描**: 自动检查敏感文件
- **文件大小警告**: 大文件提醒优化
- **构建验证**: 部署前完整性检查

## 🛠️ 本地测试

### 模拟 GitHub Pages 环境

```bash
# 1. 构建生产版本 (模拟 GitHub Pages 环境)
npm run build -- --base=/mendian/

# 2. 本地预览
npx serve dist -s -p 3000

# 3. 访问测试 URL
# http://localhost:3000
```

### 路由测试

测试以下关键路径：
- ✅ 首页: http://localhost:3000/
- ✅ 直接访问路由: http://localhost:3000/dashboard
- ✅ 刷新页面: 应该正常显示，不出现 404

## 📁 项目配置

### Vite 项目配置

如果使用 Vite，确保 `vite.config.js` 包含：

```javascript
// vite.config.js
export default {
  base: process.env.NODE_ENV === 'production' ? '/mendian/' : '/',
  build: {
    outDir: 'dist',
  }
}
```

### Create React App 配置

如果使用 CRA，在 `package.json` 中添加：

```json
{
  "homepage": "https://vulgatecnn.github.io/mendian",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 环境变量

支持的环境变量：
```bash
# 自动设置的变量
PUBLIC_URL=/mendian
VITE_BASE_URL=/mendian/
REACT_APP_BASE_URL=/mendian/

# 应用信息
VITE_APP_VERSION=commit_sha
VITE_APP_ENVIRONMENT=production
```

## 🎯 自定义配置

### 自定义域名

1. **在仓库根目录创建 `CNAME` 文件**：
```bash
echo "mendian.yourdomain.com" > CNAME
git add CNAME
git commit -m "添加自定义域名"
git push
```

2. **配置 DNS 记录**：
```
CNAME   mendian   vulgatecnn.github.io.
```

3. **在 GitHub 设置中验证域名**：
   - Settings → Pages → Custom domain
   - 输入域名并验证

### HTTPS 强制

GitHub Pages 自动启用 HTTPS：
- ✅ 自动 SSL 证书
- ✅ HTTP 到 HTTPS 重定向
- ✅ 现代 TLS 支持

## 📈 监控和维护

### 部署状态监控

1. **GitHub Actions 页面**：
   https://github.com/vulgatecnn/mendian/actions

2. **部署历史**：
   https://github.com/vulgatecnn/mendian/deployments

3. **Pages 设置**：
   https://github.com/vulgatecnn/mendian/settings/pages

### 性能优化建议

1. **图片优化**：
   ```bash
   # 压缩图片
   npm install -D imagemin imagemin-webp
   
   # 使用 WebP 格式
   # 添加 srcset 属性
   ```

2. **代码分割**：
   ```javascript
   // 使用动态导入
   const LazyComponent = lazy(() => import('./Component'));
   ```

3. **缓存策略**：
   ```javascript
   // Service Worker 缓存
   // manifest.json PWA 配置
   ```

## 🚨 故障排除

### 常见问题

#### 1. 404 错误
**症状**: 直接访问路由显示 404  
**原因**: SPA 路由配置问题  
**解决**:
```bash
# 确保构建输出包含 404.html
ls dist/404.html

# 检查部署日志中的 SPA 配置
```

#### 2. 资源加载失败
**症状**: CSS/JS 文件 404  
**原因**: 基础路径配置错误  
**解决**:
```javascript
// 检查 vite.config.js 中的 base 配置
base: '/mendian/'

// 或 package.json 中的 homepage
"homepage": "https://vulgatecnn.github.io/mendian"
```

#### 3. 构建失败
**症状**: GitHub Actions 构建失败  
**原因**: 依赖或构建配置问题  
**解决**:
```bash
# 本地测试构建
npm run build

# 检查 package.json 脚本
npm run typecheck
npm run lint
```

#### 4. 环境变量问题
**症状**: 应用中环境变量未定义  
**原因**: 变量名前缀不正确  
**解决**:
```bash
# Vite: 使用 VITE_ 前缀
VITE_APP_API_URL=https://api.example.com

# CRA: 使用 REACT_APP_ 前缀
REACT_APP_API_URL=https://api.example.com
```

### 调试工具

1. **部署日志查看**：
```bash
# 使用 GitHub CLI 查看最新 workflow run
gh run list --repo vulgatecnn/mendian
gh run view --repo vulgatecnn/mendian
```

2. **本地环境模拟**：
```bash
# 安装 GitHub Pages 仿真器
npm install -g @silvenon/github-pages
github-pages serve dist
```

## 📚 更多资源

### 官方文档
- [GitHub Pages 官方文档](https://docs.github.com/pages)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
- [自定义域名配置](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)

### 性能和 SEO
- [Core Web Vitals 优化](https://web.dev/vitals/)
- [PWA 配置指南](https://web.dev/progressive-web-apps/)
- [SEO 最佳实践](https://developers.google.com/search/docs/beginner/seo-starter-guide)

### 项目文件
- [`.github/workflows/deploy-github-pages.yml`](./.github/workflows/deploy-github-pages.yml) - 部署工作流
- [`package.json`](./package.json) - 项目配置
- [`vite.config.js`](./vite.config.js) - 构建配置 (如果存在)

## 🎉 完成！

您的好饭碗门店管理系统现在已配置为自动部署到 GitHub Pages！

### 🔗 重要链接
- **🌐 网站**: https://vulgatecnn.github.io/mendian
- **⚙️ 设置**: https://github.com/vulgatecnn/mendian/settings/pages
- **📊 状态**: https://github.com/vulgatecnn/mendian/actions
- **🚀 部署**: https://github.com/vulgatecnn/mendian/deployments

### 📋 下一步
1. ✅ 访问 GitHub Pages 设置启用部署
2. ✅ 等待首次自动部署完成
3. ✅ 访问您的网站进行测试
4. 🔧 根据需要配置自定义域名
5. 📈 设置监控和分析工具

---

**🎊 现在就去启用 GitHub Pages 并观看您的网站上线吧！**