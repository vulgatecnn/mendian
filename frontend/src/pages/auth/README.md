# 认证和个人中心模块

## 概述

本模块包含用户登录和个人中心功能，支持多种登录方式和完整的个人信息管理。

## 功能列表

### 登录页面 (Login.tsx)

#### 支持的登录方式

1. **账号密码登录**
   - 支持用户名或手机号登录
   - 密码输入
   - 记住登录状态

2. **手机号密码登录**
   - 手机号验证（11位，1开头）
   - 密码输入
   - 记住登录状态

3. **手机号验证码登录**
   - 手机号验证
   - 短信验证码（6位）
   - 60秒倒计时重发
   - 记住登录状态

4. **企业微信登录**
   - 移动端扫码/授权登录
   - 自动检测企业微信环境

#### 安全特性

- **登录失败限制**：5次失败后锁定账号30分钟
- **失败次数提示**：3次失败后显示剩余机会
- **账号锁定提示**：锁定期间禁止登录并显示提示
- **Token 自动刷新**：Token 过期时自动刷新

### 个人中心页面 (Profile.tsx)

#### 功能标签页

1. **基本信息**
   - 头像展示
   - 用户名、姓名、手机号、邮箱
   - 部门、角色信息
   - 创建时间、最后登录时间

2. **编辑信息**
   - 修改姓名
   - 修改手机号（带验证）
   - 修改邮箱（带验证）
   - 上传头像（支持图片裁剪）

3. **修改密码**
   - 原密码验证
   - 新密码强度检查（至少8位，包含字母和数字）
   - 确认密码验证

4. **权限查看**
   - 我的角色列表
   - 权限树展示（按模块分组）

5. **操作日志**
   - 个人操作记录
   - 操作时间、类型、描述、IP地址
   - 分页查询

## API 集成

### 认证服务 (authService.ts)

```typescript
// 账号密码登录
AuthService.loginByPassword({ username, password, remember })

// 手机号密码登录
AuthService.loginByPhonePassword({ phone, password, remember })

// 手机号验证码登录
AuthService.loginBySmsCode({ phone, code, remember })

// 企业微信登录
AuthService.loginByWechat({ code })

// 发送短信验证码
AuthService.sendSmsCode({ phone, type: 'login' })

// 退出登录
AuthService.logout()

// 刷新Token
AuthService.refreshToken({ refresh_token })
```

### 个人中心服务 (profileService.ts)

```typescript
// 获取个人信息
ProfileService.getProfile()

// 更新个人信息
ProfileService.updateProfile({ name, phone, email })

// 修改密码
ProfileService.changePassword({ old_password, new_password, confirm_password })

// 上传头像
ProfileService.uploadAvatar(file)

// 获取操作日志
ProfileService.getOperationLogs({ page, page_size })
```

## 认证上下文 (AuthContext)

提供全局认证状态管理：

```typescript
const { user, isAuthenticated, isLoading, login, logout, refreshUser } = useAuth()
```

### 状态

- `user`: 当前登录用户信息
- `isAuthenticated`: 是否已登录
- `isLoading`: 是否正在加载

### 方法

- `login(response)`: 登录成功后调用，保存 token 和用户信息
- `logout()`: 退出登录，清除 token 和用户信息
- `refreshUser()`: 刷新用户信息

## 路由配置

```typescript
// 登录页面（未登录时访问）
/login

// 个人中心（需要登录）
/profile
```

## 样式文件

- `Login.module.css`: 登录页面样式
- `Profile.module.css`: 个人中心页面样式

## 使用示例

### 在组件中使用认证状态

```typescript
import { useAuth } from '../../contexts'

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return (
    <div>
      <p>欢迎，{user?.name}</p>
      <button onClick={logout}>退出登录</button>
    </div>
  )
}
```

### 在请求中自动添加 Token

Token 会自动添加到所有 API 请求的 Authorization 头中：

```typescript
// request.ts 中的拦截器会自动处理
const token = localStorage.getItem('access_token')
if (token) {
  config.headers.Authorization = `Bearer ${token}`
}
```

## 注意事项

1. **Token 存储**：使用 localStorage 存储 access_token 和 refresh_token
2. **Token 刷新**：Token 过期时自动刷新，刷新失败则跳转到登录页
3. **登录状态持久化**：勾选"记住登录"后，Token 会长期保存
4. **安全性**：密码必须至少8位，包含字母和数字
5. **移动端适配**：登录页面和个人中心都支持移动端响应式布局

## 需求映射

### 登录页面

- ✅ 需求 15.1: 账号密码登录
- ✅ 需求 15.2: 手机号密码登录
- ✅ 需求 15.3: 手机号验证码登录
- ✅ 需求 15.4: 登录失败次数限制（5次锁定30分钟）
- ✅ 需求 15.5: 会话令牌生成（JWT）
- ✅ 需求 15.6: 企业微信登录
- ✅ 需求 15.7: 会话超时处理

### 个人中心页面

- ✅ 需求 17.1: 个人信息查询
- ✅ 需求 17.2: 个人信息更新
- ✅ 需求 17.3: 密码修改（原密码验证、新密码强度检查）
- ✅ 需求 17.4: 权限查询
- ✅ 需求 17.5: 头像上传
- ✅ 需求 17.6: 操作日志查看
