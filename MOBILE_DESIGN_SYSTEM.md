# 好饭碗门店管理系统 - 移动端设计规范

## 📱 文档信息

- **版本**: v1.0.0
- **创建日期**: 2025-08-30
- **适用范围**: 好饭碗门店生命周期管理系统移动端
- **技术栈**: React + TypeScript + Ant Design + SCSS
- **设计原则**: 现代化、企业级、触摸友好

---

## 🎨 设计系统概述

### 设计理念

我们的移动端设计系统基于以下核心理念：

1. **现代化视觉语言** - 采用当代移动端设计趋势，包含渐变、微动画、毛玻璃效果
2. **企业级专业性** - 满足B端企业应用的专业性要求
3. **触摸优化** - 所有交互元素针对手指触摸进行优化
4. **信息层级** - 清晰的信息架构，适合移动端浏览习惯
5. **性能导向** - 优化动画和交互，确保流畅体验

### 核心特性

- ✅ **渐进式增强**: 在现有Ant Design基础上逐步增强
- ✅ **响应式设计**: 支持手机、平板等多种设备
- ✅ **安全区域适配**: 完美支持刘海屏、导航栏等
- ✅ **暗色主题支持**: 预留暗色模式扩展能力
- ✅ **可访问性**: 符合WCAG 2.1 AA标准

---

## 🌈 色彩系统

### 主色调

```scss
// 主色调渐变 - 用于按钮、重要元素
--gradient-primary: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);

// 功能色渐变
--gradient-success: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
--gradient-warning: linear-gradient(135deg, #faad14 0%, #ffd666 100%);
--gradient-error: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
```

### 移动端专用色彩

```scss
// 增强对比度色彩（移动端可读性）
--color-mobile-accent: #ff6b6b;    // 强调色
--color-mobile-info: #4ecdc4;      // 信息色  
--color-mobile-purple: #a55eea;    // 紫色
--color-mobile-orange: #ffa726;    // 橙色
```

### 语义化状态色彩

```scss
// 业务状态色彩映射
--mobile-status-draft: var(--color-neutral-400);      // 草稿
--mobile-status-pending: var(--color-mobile-orange);  // 待处理
--mobile-status-approved: var(--color-success-500);   // 已批准
--mobile-status-rejected: var(--color-error-500);     // 已拒绝
--mobile-status-completed: var(--color-mobile-info);  // 已完成
```

---

## 🖋 字体系统

### 字号层级

```scss
// 移动端优化的字体大小
--font-size-mobile-xs: 11px;      // 辅助信息
--font-size-mobile-sm: 13px;      // 小文本  
--font-size-mobile-base: 15px;    // 正文（防止iOS缩放）
--font-size-mobile-lg: 17px;      // 小标题
--font-size-mobile-xl: 19px;      // 标题
--font-size-mobile-2xl: 22px;     // 大标题
--font-size-mobile-3xl: 28px;     // 特大标题
--font-size-mobile-hero: 32px;    // 英雄标题
```

### 字重系统

```scss
--font-weight-normal: 400;      // 正常文字
--font-weight-medium: 500;      // 稍重文字
--font-weight-semibold: 600;    // 半粗体
--font-weight-bold: 700;        // 粗体
```

### 行高系统

```scss
--line-height-mobile-compact: 1.3;   // 紧凑行高
--line-height-mobile-normal: 1.4;    // 标准行高
--line-height-mobile-relaxed: 1.6;   // 宽松行高
```

---

## 📐 间距系统

### 基础间距

```scss
--spacing-mobile-xs: 6px;       // 最小间距
--spacing-mobile-sm: 12px;      // 小间距
--spacing-mobile-md: 20px;      // 标准间距
--spacing-mobile-lg: 32px;      // 大间距
--spacing-mobile-xl: 48px;      // 特大间距
--spacing-mobile-2xl: 64px;     // 超大间距
```

### 触摸目标尺寸

```scss
--touch-target-min: 44px;         // 最小触摸目标
--touch-target-comfortable: 48px; // 舒适触摸目标
--touch-target-large: 56px;       // 大触摸目标
```

---

## 🎭 圆角系统

### 移动端圆角层级

```scss
--border-radius-mobile-sm: 8px;    // 小圆角
--border-radius-mobile-base: 12px; // 标准圆角
--border-radius-mobile-lg: 16px;   // 大圆角
--border-radius-mobile-xl: 20px;   // 特大圆角
--border-radius-mobile-2xl: 24px;  // 超大圆角
--border-radius-mobile-card: 16px; // 卡片专用圆角
```

---

## 🌟 阴影系统

### 移动端阴影层级

```scss
--shadow-mobile-sm: 0 2px 8px rgba(0, 0, 0, 0.06);    // 轻微阴影
--shadow-mobile-base: 0 4px 12px rgba(0, 0, 0, 0.08); // 标准阴影
--shadow-mobile-lg: 0 8px 24px rgba(0, 0, 0, 0.12);   // 明显阴影
--shadow-mobile-xl: 0 12px 32px rgba(0, 0, 0, 0.16);  // 强烈阴影
--shadow-mobile-card: 0 2px 16px rgba(0, 0, 0, 0.04); // 卡片专用
--shadow-mobile-float: 0 8px 32px rgba(0, 0, 0, 0.12);// 悬浮元素
```

---

## 🎬 动画系统

### 动画曲线

```scss
--transition-base: all 0.3s ease;                                    // 基础过渡
--transition-fast: all 0.2s ease;                                    // 快速过渡
--transition-spring: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); // 弹性过渡
--transition-bounce: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);   // 弹跳过渡
```

### 关键动画

```scss
// 卡片进入动画
@keyframes mobileSpring {
  0% { transform: scale(0.8) translateY(20px); opacity: 0; }
  50% { transform: scale(1.05) translateY(-5px); opacity: 0.8; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

// 淡入上移动画
@keyframes mobileFadeInUp {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

---

## 🧩 核心组件规范

### 1. 现代化卡片 (modern-list-item)

**视觉特征**:
- 圆角: `--border-radius-mobile-card` (16px)
- 阴影: `--shadow-mobile-card`
- 背景: 渐变背景支持
- 动画: 进入动画 + 触摸反馈

**结构**:
```html
<div class="modern-list-item interactive-card mobile-card-enter touch-feedback-light">
  <div class="list-item-content">
    <div class="list-item-header">标题区域</div>
    <div class="list-item-description">内容区域</div>
    <div class="list-item-meta">元数据区域</div>
  </div>
  <div class="list-item-actions">操作区域</div>
</div>
```

### 2. 现代化状态标签 (modern-status-tag)

**视觉特征**:
- 圆角: `--border-radius-mobile-lg` (16px)
- 半透明背景 + 彩色边框
- 支持图标 + 文字组合

**状态映射**:
- `draft` - 灰色系，表示草稿
- `pending` - 橙色系，表示待处理
- `approved` - 绿色系，表示已批准
- `rejected` - 红色系，表示已拒绝
- `completed` - 青色系，表示已完成

### 3. 现代化进度条 (modern-progress)

**视觉特征**:
- 高度: `6px` (标准) / `20px` (大型)
- 圆角: 完全圆角
- 渐变填充，支持动态颜色
- 内嵌百分比显示

**颜色逻辑**:
- `success` - 80%+ 完成度
- `warning` - 50-80% 完成度  
- `error` - <50% 完成度

### 4. 现代化搜索框 (modern-search)

**视觉特征**:
- 圆角: `--border-radius-mobile-2xl` (24px)
- 毛玻璃背景效果
- 右侧搜索图标
- 聚焦状态光环效果

### 5. 现代化导航栏 (modern-navbar)

**视觉特征**:
- 固定顶部，毛玻璃背景
- 高度: `--mobile-nav-height` (56px)
- 安全区域适配
- 左中右三栏布局

### 6. 现代化FAB (modern-fab)

**视觉特征**:
- 尺寸: `--mobile-fab-size` (56px)
- 渐变背景: `--gradient-primary`
- 强阴影: `--shadow-mobile-float`
- 悬停/点击动画

---

## 🤝 交互规范

### 触摸反馈类

**轻微反馈** (touch-feedback-light):
- 缩放: `scale(0.98)`
- 背景: 轻微变暗

**中等反馈** (touch-feedback-medium):
- 缩放: `scale(0.95)` + `translateY(1px)`
- 阴影变化

**强烈反馈** (touch-feedback-strong):
- 缩放: `scale(0.92)` + `translateY(2px)`
- 明显阴影变化

### 手势支持

- **点击**: 所有可交互元素
- **长按**: 上下文菜单触发
- **滑动**: 列表项操作（预留）
- **拖拽**: 排序操作（预留）

---

## 📋 组件使用示例

### 1. 统计卡片

```tsx
<div style={{
  background: 'var(--gradient-primary)',
  borderRadius: 'var(--border-radius-mobile-lg)',
  padding: 'var(--spacing-mobile-md)',
  color: 'white'
}}>
  <div>总计划: 128</div>
  <div>趋势: +12%</div>
</div>
```

### 2. 业务数据卡片

```tsx
<div className="modern-list-item interactive-card touch-feedback-medium">
  <div className="list-item-content">
    <div className="list-item-header">
      <h4 className="list-item-title">计划名称</h4>
      <span className="modern-status-tag approved">已批准</span>
    </div>
    <div className="list-item-description">详细内容...</div>
    <div className="list-item-meta">
      <div className="meta-item">
        <CalendarOutlined />
        <span>2025-08-30</span>
      </div>
    </div>
  </div>
</div>
```

### 3. 现代化进度条

```tsx
<div className="modern-progress modern-progress-large success"
     style={{ '--progress-width': '75%' }}>
  <div>75%</div>
</div>
```

---

## 🎯 最佳实践

### 布局原则

1. **垂直滚动优先** - 避免水平滚动
2. **内容优先级** - 重要信息置顶显示
3. **操作就近** - 操作按钮靠近相关内容
4. **安全距离** - 避免误触的安全边距

### 性能优化

1. **动画限制** - 同时最多3个动画元素
2. **图片懒加载** - 非关键图像延迟加载
3. **列表虚拟化** - 长列表使用虚拟滚动
4. **状态预加载** - 预加载常用状态变化

### 可访问性

1. **触摸目标** - 最小44px，推荐48px
2. **对比度** - 文字对比度≥4.5:1
3. **语义标签** - 正确使用HTML语义
4. **键盘导航** - 支持Tab键导航

### 企业微信集成

1. **导航适配** - 考虑企微导航栏高度
2. **分享支持** - 支持企微内分享
3. **认证集成** - 利用企微身份认证
4. **消息推送** - 关键状态变化推送

---

## 🔧 开发指南

### CSS变量使用

```scss
// ✅ 正确使用
.my-component {
  padding: var(--spacing-mobile-md);
  border-radius: var(--border-radius-mobile-base);
  color: var(--text-primary);
}

// ❌ 避免硬编码
.my-component {
  padding: 20px;
  border-radius: 12px;
  color: #333;
}
```

### 组件类名规范

```tsx
// 组合使用多个功能类
<div className="modern-list-item interactive-card mobile-card-enter touch-feedback-light">
  内容
</div>
```

### 响应式开发

```tsx
// 使用设备检测hooks
const { isMobile } = useDevice()
const { xs, sm } = useBreakpoint()

// 条件渲染
{isMobile ? <MobileComponent /> : <DesktopComponent />}
```

---

## 🚀 后续迭代计划

### Phase 2: 交互增强
- 手势操作支持（滑动删除、拖拽排序）
- 下拉刷新和上拉加载
- 离线状态处理

### Phase 3: 体验优化  
- 骨架屏优化
- 微动画库扩展
- 暗色主题完整支持

### Phase 4: 平台特性
- iOS Safari优化
- Android Chrome优化
- 企业微信深度集成

---

## 📞 支持与反馈

如有任何问题或建议，请联系前端团队：

- **设计系统维护**: 前端架构师
- **组件开发**: 前端开发团队
- **问题反馈**: 项目Issue或内部沟通群

---

*本设计规范将随着项目发展持续更新，请定期关注版本变化*