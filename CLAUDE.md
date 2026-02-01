# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**康奈尔笔记-学习助手** - 一个基于康奈尔笔记法的 Web 学习辅助工具。

康奈尔笔记法将笔记页面分为三个区域：
- **笔记栏**（右侧）：记录主要内容
- **线索栏**（左侧）：记录关键词和问题
- **总结栏**（底部）：概括总结

## 技术栈

### 后端（backend/）
- **语言**: Python 3.10+
- **框架**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **数据库迁移**: Alembic
- **认证**: JWT (python-jose)
- **测试**: pytest

### 前端（frontend/）
- **架构**: pnpm Workspace Monorepo
- **应用**:
  - Web 端（端口 3000）- 桌面浏览器优化
  - Mobile 端（端口 3001）- 移动浏览器优化
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **包管理**: pnpm workspace
- **路由**: React Router v6
- **状态管理**: Zustand
- **数据获取**: TanStack Query (React Query)
- **测试**: Vitest + Testing Library
- **共享包**:
  - @cornell-notes/ui - UI 组件库
  - @cornell-notes/utils - 工具函数
  - @cornell-notes/types - 类型定义
  - @cornell-notes/shared - 共享业务逻辑

## 项目结构

```
cornell-notes/
├── backend/              # Python 后端
│   ├── app/
│   │   ├── api/         # API 路由（按版本组织）
│   │   ├── core/        # 核心配置（config, security）
│   │   ├── models/      # SQLAlchemy 模型
│   │   ├── services/    # 业务逻辑层
│   │   └── utils/       # 工具函数
│   ├── tests/           # 后端测试
│   └── scripts/         # 后端脚本
├── frontend/            # React 前端 Monorepo
│   ├── apps/
│   │   ├── web/        # Web 端应用（端口 3000）
│   │   └── mobile/     # 移动端应用（端口 3001）
│   ├── packages/       # 共享包
│   │   ├── ui/        # UI 组件库
│   │   ├── utils/     # 工具函数
│   │   ├── types/     # 类型定义
│   │   └── shared/    # 共享业务逻辑
│   └── pnpm-workspace.yaml  # workspace 配置
├── docs/                # 项目文档
│   ├── api/            # API 文档
│   ├── architecture/   # 架构设计文档
│   ├── user-guide/     # 用户指南
│   └── development/    # 开发文档
├── design/             # 设计资源
│   ├── prototypes/     # 原型设计
│   ├── mockups/        # 视觉稿
│   └── assets/         # 设计素材
└── scripts/            # 项目级脚本
    ├── deploy/         # 部署脚本
    ├── migration/      # 数据迁移脚本
    └── dev/            # 开发辅助脚本
```

## 常用开发命令

### 后端开发

```bash
cd backend

# 创建虚拟环境（首次）
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 运行开发服务器（端口 8000）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 运行测试
pytest                           # 所有测试
pytest tests/test_api.py        # 单个测试文件
pytest --cov=app --cov-report=html  # 带覆盖率

# 代码质量检查
black app/ tests/               # 格式化
ruff check app/ tests/          # 代码检查
mypy app/                       # 类型检查

# 数据库迁移
alembic revision --autogenerate -m "描述"  # 生成迁移
alembic upgrade head                      # 应用迁移
alembic downgrade -1                      # 回滚一个版本
```

### 前端开发

```bash
cd frontend

# 安装依赖（首次或更新）
pnpm install

# 同时运行所有应用
pnpm dev

# 运行 Web 端（端口 3000）
pnpm dev:web

# 运行移动端（端口 3001）
pnpm dev:mobile

# 构建所有应用
pnpm build

# 构建 Web 端
pnpm build:web

# 构建移动端
pnpm build:mobile

# 测试
pnpm test              # 运行所有测试
pnpm test:ui           # 测试 UI
pnpm test:coverage     # 覆盖率报告

# 代码质量
pnpm lint              # 检查所有包
pnpm lint:fix          # 修复问题
pnpm format            # 格式化代码
pnpm type-check        # TypeScript 类型检查
```

## 开发工作流

### 1. 本地开发环境

同时运行前后端：
```bash
# 终端 1 - 后端
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# 终端 2 - 前端 Web 端
cd frontend && pnpm dev:web

# 终端 3 - 前端移动端（可选）
cd frontend && pnpm dev:mobile
```

访问：
- 前端 Web 版: http://localhost:3000
- 前端移动版: http://localhost:3001
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 2. API 开发流程

1. 在 `backend/app/models/` 定义 SQLAlchemy 模型
2. 在 `backend/app/api/v1/schemas/` 定义 Pydantic 模式
3. 在 `backend/app/services/` 实现业务逻辑
4. 在 `backend/app/api/v1/endpoints/` 创建路由端点
5. 在 `backend/tests/` 编写测试
6. 在 `frontend/src/services/` 创建对应的 API 调用

### 3. 组件开发流程

1. 在 `frontend/packages/types/src/` 定义 TypeScript 类型
2. 在 `frontend/packages/ui/src/components/` 创建共享组件
3. 在 `frontend/apps/web/src/pages/` 或 `frontend/apps/mobile/src/pages/` 组合页面
4. 在对应应用的 tests 目录编写组件测试

### 4. 跨包引用

在应用中使用共享包：

```typescript
// 引用共享组件
import { Button } from '@cornell-notes/ui'

// 引用工具函数
import { formatDate, generateId } from '@cornell-notes/utils'

// 引用类型
import type { CornellNote, User } from '@cornell-notes/types'

// 引用共享常量
import { API_BASE_URL, APP_NAME } from '@cornell-notes/shared'
```

## 架构原则

### 后端

- **分层架构**: API → Service → Model
- **依赖注入**: 使用 FastAPI 的依赖系统
- **异步优先**: 使用 async/await
- **类型安全**: 使用 Pydantic 进行数据验证
- **单一职责**: 每个 Service 处理单一业务领域

### 前端

- **Monorepo 架构**: 使用 pnpm workspace 管理多应用和共享包
- **应用隔离**: Web 端和移动端独立开发、独立部署
- **代码共享**: 通过 @cornell-notes/* 命名空间共享代码
- **组件化**: 小而专注的可复用组件
- **类型安全**: TypeScript 严格模式
- **状态管理**: 服务器状态用 TanStack Query，本地状态用 Zustand
- **样式隔离**: CSS Modules 或 styled-components
- **懒加载**: 路由级代码分割
- **响应式**: Web 端桌面优化，Mobile 端移动优化

## 代码规范

### Python
- **格式**: Black (line-length=100)
- **检查**: Ruff
- **类型**: MyPy 严格模式
- **导入顺序**: 标准库 → 第三方 → 本地
- **文档**: Google 风格的 docstrings

### TypeScript/React
- **格式**: Prettier
- **检查**: ESLint
- **组件**: 函数组件 + Hooks
- **命名**:
  - 组件: PascalCase
  - 函数/变量: camelCase
  - 常量: UPPER_SNAKE_CASE
  - 类型/接口: PascalCase

## 环境变量

### 后端 (.env)
```
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 前端环境变量配置

前端使用 Vite 的环境变量系统，支持以下配置方式：

#### 1. 环境变量文件

在 `frontend/apps/web/` 目录下创建环境变量文件：

- `.env.example` - 示例配置（已提交到版本控制）
- `.env.local` - 本地开发配置（不提交）
- `.env.production` - 生产环境配置（已提交）

**开发环境** (`frontend/apps/web/.env.local`):
```bash
# 本地开发 API 地址
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**生产环境** (`frontend/apps/web/.env.production`):
```bash
# 生产环境 API 地址
VITE_API_BASE_URL=https://api.cornell-notes.com/api/v1
```

#### 2. 构建时指定环境变量

```bash
# 方式 1：通过环境变量构建
VITE_API_BASE_URL=https://api.example.com/api/v1 pnpm build:web

# 方式 2：使用部署脚本
./scripts/deploy-web.sh prod    # 生产环境
./scripts/deploy-web.sh staging # 测试环境
./scripts/deploy-web.sh dev     # 开发环境
```

#### 3. API URL 自动配置逻辑

前端会按以下优先级确定 API URL（`frontend/apps/web/src/services/api.ts`）：

1. **环境变量** - `VITE_API_BASE_URL`（最高优先级）
2. **生产环境** - 使用相对路径 `/api/v1`（由 Nginx 反向代理处理）
3. **开发环境** - 默认 `http://localhost:8000/api/v1`

#### 4. 生产部署建议

**方案 A：使用环境变量文件**
```bash
# 修改 .env.production 后构建
pnpm build:web
```

**方案 B：使用相对路径 + Nginx 反向代理（推荐）**
```bash
# 使用默认配置构建（生产环境自动使用 /api/v1）
pnpm build:web
```

然后配置 Nginx：
```nginx
server {
    listen 80;
    server_name cornell-notes.com;

    # 前端静态文件
    location / {
        root /var/www/cornell-notes/web;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**方案 C：构建时动态注入**
```bash
# CI/CD 环境中使用
VITE_API_BASE_URL=$API_URL pnpm build:web
```

移动端 (`frontend/apps/mobile/.env.local`):
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 注意事项

1. **数据库迁移**: 每次修改模型后运行 `alembic revision --autogenerate`
2. **类型检查**: 提交前运行 `mypy` 和 `tsc --noEmit`
3. **测试覆盖**: 新功能必须包含测试
4. **API 版本**: 使用 `/api/v1/` 前缀，向后兼容
5. **错误处理**: 使用统一的错误响应格式
6. **认证**: 所有需要认证的端点使用 JWT
