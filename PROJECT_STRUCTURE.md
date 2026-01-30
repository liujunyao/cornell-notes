# 项目结构说明

```
cornell-notes/
│
├── backend/                          # Python 后端服务
│   ├── app/                         # 应用主目录
│   │   ├── api/                     # API 路由层
│   │   │   ├── deps.py             # 依赖注入（数据库会话、当前用户等）
│   │   │   └── v1/                 # API v1 版本
│   │   │       ├── endpoints/       # 路由端点实现
│   │   │       └── schemas/         # Pydantic 请求/响应模型
│   │   ├── core/                    # 核心配置
│   │   │   ├── config.py           # 应用配置（环境变量等）
│   │   │   └── security.py         # 安全相关（密码哈希、JWT 等）
│   │   ├── models/                  # SQLAlchemy ORM 模型
│   │   ├── services/                # 业务逻辑层
│   │   └── utils/                   # 通用工具函数
│   ├── scripts/                     # 后端脚本
│   ├── tests/                       # pytest 测试
│   ├── __init__.py
│   ├── pyproject.toml              # Python 项目配置
│   ├── requirements.txt            # Python 依赖
│   └── README.md
│
├── frontend/                         # React 前端应用 (Monorepo)
│   ├── apps/                        # 应用目录
│   │   ├── web/                     # Web 端应用 (端口 3000)
│   │   │   ├── src/
│   │   │   │   ├── components/      # 页面特定组件
│   │   │   │   ├── pages/           # 页面组件
│   │   │   │   ├── hooks/           # 自定义 Hooks
│   │   │   │   ├── services/        # API 调用
│   │   │   │   ├── utils/           # 工具函数
│   │   │   │   ├── assets/          # 静态资源
│   │   │   │   ├── styles/          # 样式文件
│   │   │   │   ├── App.tsx          # 根组件
│   │   │   │   └── main.tsx         # 应用入口
│   │   │   ├── public/              # 公共资源
│   │   │   ├── index.html           # HTML 入口
│   │   │   ├── vite.config.ts       # Vite 配置
│   │   │   ├── tsconfig.json        # TypeScript 配置
│   │   │   └── package.json         # 应用依赖
│   │   └── mobile/                  # 移动端应用 (端口 3001)
│   │       ├── src/                 # 源代码（结构同 web）
│   │       ├── public/              # 公共资源
│   │       ├── index.html           # HTML 入口
│   │       ├── vite.config.ts       # Vite 配置
│   │       ├── tsconfig.json        # TypeScript 配置
│   │       └── package.json         # 应用依赖
│   ├── packages/                    # 共享包
│   │   ├── ui/                      # UI 组件库
│   │   │   ├── src/
│   │   │   │   ├── components/      # 共享组件
│   │   │   │   └── index.ts         # 入口文件
│   │   │   ├── tsconfig.json        # TypeScript 配置
│   │   │   └── package.json         # 包依赖
│   │   ├── utils/                   # 工具函数库
│   │   │   ├── src/
│   │   │   │   └── index.ts         # 工具函数导出
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   ├── types/                   # TypeScript 类型定义
│   │   │   ├── src/
│   │   │   │   └── index.ts         # 类型导出
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   └── shared/                  # 共享业务逻辑
│   │       ├── src/
│   │       │   └── index.ts         # 常量、配置导出
│   │       ├── tsconfig.json
│   │       └── package.json
│   ├── pnpm-workspace.yaml          # pnpm workspace 配置
│   ├── package.json                 # Workspace 根配置
│   ├── tsconfig.json                # TypeScript 根配置
│   └── README.md
│
├── docs/                            # 项目文档
│   ├── system-design/               # 系统设计文档（数据模型、API设计等）
│   ├── api/                         # API 接口文档
│   ├── architecture/                # 架构设计文档
│   ├── development/                 # 开发指南
│   ├── user-guide/                  # 用户使用手册
│   └── README.md
│
├── design/                          # 设计资源
│   ├── assets/                      # 设计素材（图标、插图等）
│   ├── mockups/                     # UI 设计稿
│   ├── prototypes/                  # 交互原型
│   └── README.md
│
├── scripts/                         # 项目级脚本
│   ├── deploy/                      # 部署脚本
│   ├── dev/                         # 开发辅助脚本
│   └── migration/                   # 数据迁移脚本
│
├── .gitignore                       # Git 忽略规则
├── CLAUDE.md                        # AI 编码助手指南
└── README.md                        # 项目主文档
```

## 目录说明

### 后端目录详解

- **app/api/v1/endpoints/**: 按功能模块组织的路由端点（如 `notes.py`, `users.py`）
- **app/api/v1/schemas/**: Pydantic 模型，用于请求验证和响应序列化
- **app/models/**: 数据库表模型，使用 SQLAlchemy 定义
- **app/services/**: 业务逻辑层，保持控制器（endpoints）简洁
- **app/core/**: 应用核心配置，如数据库连接、JWT 配置等

### 前端目录详解

**Monorepo 架构** - 使用 pnpm workspace 组织：

- **apps/web/**: Web 端应用，端口 3000，桌面浏览器优化
- **apps/mobile/**: 移动端应用，端口 3001，移动浏览器优化，PWA 支持
- **packages/ui/**: 共享 UI 组件库，如 Button、Input、Card 等
- **packages/utils/**: 工具函数库，如 formatDate、generateId 等
- **packages/types/**: TypeScript 类型定义，如 User、CornellNote 等
- **packages/shared/**: 共享业务逻辑、常量和配置

**跨包引用**示例：
```typescript
import { Button } from '@cornell-notes/ui'
import { formatDate } from '@cornell-notes/utils'
import type { CornellNote } from '@cornell-notes/types'
import { API_BASE_URL } from '@cornell-notes/shared'
```

### 文档目录详解

- **docs/system-design/**: 核心设计文档，包括数据模型、API 设计、前后端架构、安全设计等
- **docs/api/**: OpenAPI/Swagger 规范、端点说明、API 使用示例
- **docs/architecture/**: 系统架构图、技术选型说明、基础设施设计
- **docs/development/**: 开发环境搭建、代码规范、贡献指南、开发工作流
- **docs/user-guide/**: 功能说明、使用教程、FAQ、最佳实践

### 设计目录详解

- **design/prototypes/**: Figma/Sketch 原型链接或导出文件
- **design/mockups/**: 高保真设计稿
- **design/assets/**: 图标库、品牌素材、设计系统

## 命名约定

### 后端（Python）
- 文件：snake_case（`note_service.py`）
- 类：PascalCase（`NoteService`）
- 函数/变量：snake_case（`get_note_by_id`）
- 常量：UPPER_SNAKE_CASE（`MAX_NOTES_PER_USER`）

### 前端（TypeScript/React）
- 组件文件：PascalCase（`NoteEditor.tsx`）
- 非组件文件：camelCase（`noteService.ts`）
- 组件：PascalCase（`function NoteEditor()`）
- Hooks：camelCase with `use` prefix（`useNotes`）
- 类型/接口：PascalCase（`interface NoteData`）

## 扩展建议

随着项目发展，可以考虑添加：

- `backend/alembic/`: 数据库迁移文件
- `backend/app/middleware/`: 自定义中间件
- `frontend/src/contexts/`: React Context 提供者
- `frontend/src/layouts/`: 布局组件
- `.github/workflows/`: CI/CD 配置
- `docker/`: Docker 相关配置
- `deploy/`: 部署配置（Nginx、systemd 等）
