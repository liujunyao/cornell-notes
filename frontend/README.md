# 康奈尔笔记 - 前端 Monorepo

基于 pnpm workspace 的多端前端项目。

## 📁 项目结构

```
frontend/
├── apps/                    # 应用目录
│   ├── web/                # Web 端应用 (端口 3000)
│   └── mobile/             # 移动端应用 (端口 3001)
├── packages/               # 共享包
│   ├── ui/                 # 共享 UI 组件库
│   ├── utils/              # 工具函数库
│   ├── types/              # TypeScript 类型定义
│   └── shared/             # 共享业务逻辑和常量
├── package.json            # Workspace 根配置
├── pnpm-workspace.yaml     # pnpm workspace 配置
└── tsconfig.json           # TypeScript 根配置
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 同时启动所有应用
pnpm dev

# 只启动 Web 端
pnpm dev:web

# 只启动移动端
pnpm dev:mobile
```

### 构建

```bash
# 构建所有应用
pnpm build

# 构建 Web 端
pnpm build:web

# 构建移动端
pnpm build:mobile
```

## 📦 Packages 说明

### @cornell-notes/ui

共享 UI 组件库，包含：
- 按钮、输入框等基础组件
- 康奈尔笔记编辑器组件
- 布局组件

### @cornell-notes/utils

通用工具函数库：
- 日期格式化
- ID 生成
- 延迟函数
- 等等

### @cornell-notes/types

TypeScript 类型定义：
- 用户类型
- 笔记类型
- 笔记本类型
- API 响应类型

### @cornell-notes/shared

共享业务逻辑：
- API 配置
- 应用常量
- 本地存储键名
- 康奈尔笔记模板

## 🎯 应用说明

### Web 端 (@cornell-notes/web)

- **端口**: 3000
- **目标**: 桌面浏览器，大屏幕优化
- **特性**: 完整功能，多窗口支持

### 移动端 (@cornell-notes/mobile)

- **端口**: 3001
- **目标**: 移动浏览器，小屏幕优化
- **特性**: 触控优化，PWA 支持

## 🛠️ 开发命令

```bash
# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 运行测试
pnpm test

# 清理所有构建产物和依赖
pnpm clean
```

## 📝 添加新 Package

1. 在 `packages/` 目录创建新包
2. 添加 `package.json` 和 `tsconfig.json`
3. 在根目录运行 `pnpm install` 更新依赖

## 🔗 跨包引用

在应用中引用共享包：

```typescript
// 引用共享组件
import { Button } from '@cornell-notes/ui'

// 引用工具函数
import { formatDate } from '@cornell-notes/utils'

// 引用类型
import type { CornellNote } from '@cornell-notes/types'

// 引用共享常量
import { API_BASE_URL } from '@cornell-notes/shared'
```

## 🎨 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

## 🔧 环境变量

### Web 端 (apps/web/.env.local)

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 移动端 (apps/mobile/.env.local)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📖 相关文档

- [项目主文档](../README.md)
- [开发指南](../CLAUDE.md)
- [项目结构](../PROJECT_STRUCTURE.md)
