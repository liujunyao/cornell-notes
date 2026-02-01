# 康奈尔笔记学习助手 - Logo 使用说明

## 📁 Logo 文件位置

- **源文件**: `design/assets/logo.svg`
- **Web端**: `frontend/apps/web/public/logo.svg`
- **移动端**: `frontend/apps/mobile/public/logo.svg`
- **预览页面**: `design/logo-preview.html`

## 🎨 设计方案

采用**方案三：极简笔记**作为最终设计。

### 设计特点

- **康奈尔三栏结构**：清晰展现线索栏（左）、笔记栏（右）、总结栏（下）
- **蓝紫渐变背景**：#4361EE → #667EEA
- **铅笔元素**：金黄色 #FFB627，象征学习和记录
- **圆角设计**：16px 圆角，友好亲和
- **尺寸**: 120x120 viewBox，可无损缩放

### 颜色规范

| 元素 | 颜色代码 | 说明 |
|------|---------|------|
| 背景渐变起点 | #4361EE | 蓝色 |
| 背景渐变终点 | #667EEA | 紫蓝色 |
| 三栏结构 | #FFFFFF (opacity: 0.9) | 白色半透明 |
| 铅笔主体 | #FFB627 | 金黄色 |
| 铅笔阴影 | #E09F1F | 深金黄色 |
| 铅笔笔尖 | #333333 | 深灰色 |

## 📱 应用位置

### 1. 网站 Favicon

- **Web端**: 浏览器标签页图标
- **移动端**: 浏览器标签页图标 + Apple Touch Icon

### 2. 未来可能的应用场景

- 关于页面
- 404页面
- 登录/注册页面
- 营销页面
- 文档网站
- 应用启动画面

## 🖼️ 文件格式说明

### SVG 格式优势

- ✅ 矢量图形，无损缩放
- ✅ 文件体积小（< 1KB）
- ✅ 支持渐变和透明度
- ✅ 现代浏览器完美支持

### 如需其他格式

如果需要PNG、ICO等格式，可使用以下工具转换：

```bash
# 使用 Inkscape 转换为 PNG（需安装 Inkscape）
inkscape logo.svg --export-png=logo.png --export-width=512

# 在线转换工具
# https://cloudconvert.com/svg-to-png
# https://convertio.co/svg-png/
```

## 🎯 使用示例

### HTML 引用

```html
<!-- 标准 favicon -->
<link rel="icon" type="image/svg+xml" href="/logo.svg" />

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/logo.svg" />

<!-- 在页面中使用 -->
<img src="/logo.svg" alt="康奈尔笔记学习助手" width="120" height="120" />
```

### React 组件中使用

```tsx
import logo from '/logo.svg'

function Header() {
  return (
    <div className="header">
      <img src={logo} alt="康奈尔笔记" className="logo" />
      <h1>康奈尔笔记学习助手</h1>
    </div>
  )
}
```

### CSS 背景

```css
.logo-bg {
  background-image: url('/logo.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
```

## 📋 版本历史

- **v1.0** (2026-02-01)
  - 初始版本
  - 采用方案三设计
  - 应用到Web端和移动端

## 📞 设计说明

如需调整logo设计（颜色、尺寸、元素等），请修改 `design/assets/logo.svg` 源文件，然后重新复制到各应用的 public 目录。

```bash
# 复制到Web端
cp design/assets/logo.svg frontend/apps/web/public/logo.svg

# 复制到移动端
cp design/assets/logo.svg frontend/apps/mobile/public/logo.svg
```
