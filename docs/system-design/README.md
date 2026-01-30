# 康奈尔笔记应用 - 系统设计文档

本目录包含康奈尔笔记学习助手的完整系统设计文档，从需求层到实现层的全套规范。

## 📋 文档导览

### ⭐ 快速开始

**新手必读** → [系统设计导航和快速路径](../../docs/system-design/README.md) （根据角色选择）
- 🎯 产品经理路径
- 🎨 设计师路径
- 👨‍💻 前端开发路径
- 🐍 后端开发路径
- 🛠️ 项目经理路径

### 核心系统设计文档

| 文档 | 内容 | 作用 |
|------|------|------|
| **数据模型设计** (`data-model.md`) | 12 个数据实体、关系、约束、索引 | 定义数据结构和关系 |
| **API 设计规范** (`api-design.md`) | 40+ API 端点、认证、错误处理 | 定义前后端交互接口 |
| **前端架构设计** (`frontend-architecture.md`) | 项目结构、状态管理、组件设计 | 指导 React 应用开发 |
| **后端架构设计** (`backend-architecture.md`) | 分层架构、业务逻辑、中间件 | 指导 FastAPI 服务开发 |

### 与原型设计的映射

原型设计文档 → [`design/prototypes/`](../../design/prototypes/)
- 功能流程定义 → 数据模型结构
- UI 页面布局 → API 响应数据格式
- 交互规范 → 前端状态管理和路由
- 用户故事 → 后端业务逻辑实现

## 🎨 设计原则

### 1. 康奈尔笔记法核心理念

遵循康奈尔笔记法的核心原则：
- **主动学习**：通过线索栏的问题引导思考
- **系统回顾**：便于定期复习和总结
- **结构化记录**：清晰的三栏布局

### 2. 用户体验优先

- 简洁直观的界面
- 流畅的操作体验
- 最小化学习成本

### 3. 数据隐私和安全

- 用户数据本地优先
- 端到端加密（可选）
- 完整的访问控制

### 4. 可扩展性

- 模块化设计
- 插件系统（未来）
- 多平台支持（Web、桌面、移动）

## 📊 系统架构概览

```
┌────────────────────────────────────────────────────────┐
│                  前端层 (Frontend - Monorepo)          │
│  React 18 + TypeScript + Vite + pnpm Workspace        │
│  ┌─────────────────┬──────────────┬──────────────────┐│
│  │ apps/web        │ apps/mobile  │ packages/*       ││
│  │ (3000)          │ (3001)       │ (UI/Utils/Types) ││
│  └─────────────────┴──────────────┴──────────────────┘│
│  ┌──────────────────────────────────────────────────┐ │
│  │  状态管理: Zustand (本地) + TanStack Query (服务器) │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP/REST API + WebSocket
┌────────────────────▼─────────────────────────────────┐
│              API 网关层 (FastAPI)                     │
│  CORS + JWT 认证 + 速率限制 + 错误处理              │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│           业务逻辑层 (Services)                       │
│  ┌──────────┬──────────┬──────────┬──────────────┐  │
│  │笔记服务  │复习服务  │AI服务    │  协作服务    │  │
│  └──────────┴──────────┴──────────┴──────────────┘  │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│            数据访问层 (CRUD + ORM)                    │
│  SQLAlchemy 2.0 + Async/await                        │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼──────────┐
│  PostgreSQL    │      │  Redis            │
│  (数据持久化)   │      │  (缓存/会话)      │
└────────────────┘      └───────────────────┘
```

## 🗂️ 核心数据模型（12 个实体）

### 用户与认证
1. **User（用户）**
   - id, username, email, password_hash
   - user_type (student|teacher|parent|admin)
   - created_at, updated_at, last_login

### 笔记组织
2. **Notebook（笔记本）**
   - id, owner_id, title, color, is_archived
   - created_at, updated_at

3. **CornellNote（笔记）**
   - id, notebook_id, owner_id, title
   - access_level (private|shared|public)
   - is_starred, view_count
   - ai_generated_at (AI 审计)

4. **NoteContent（笔记内容）** - 三分栏核心
   - id, note_id, cue_column, note_column, summary_row
   - version (实时协作版本控制)

### 高亮与复习
5. **Highlight（高亮）**
   - 5 种类型: core_knowledge, problem, case, reflection, warning
   - 颜色自动映射，支持 AI 生成

6. **ReviewSchedule（复习计划）**
   - 基于艾宾浩斯曲线: [1天, 2天, 7天, 15天, 30天]
   - status (pending|completed|skipped)

7. **ReviewRecord（复习记录）**
   - 记录每次复习: 时间、正确率、薄弱点
   - 3 种复习模式: 基础、进阶、高阶

### 协作与分享
8. **CollaborationGroup（协作小组）**
   - note_id, created_by, invite_code
   - 支持权限管理 (owner|editor|viewer)

9. **GroupMember（小组成员）**
   - group_id, user_id, role, color_code

10. **Annotation（批注）**
    - 类型: comment|suggestion|question
    - 支持批注线程和解决跟踪

11. **ShareLink（分享链接）**
    - share_token, access_level
    - 过期管理和使用次数限制

### 媒体管理
12. **MediaFile（媒体文件）**
    - 类型: image|video|audio|pdf|formula
    - 支持缩略图和元数据

## 关键关系

```
User (1) ──M──> Notebook ──M──> CornellNote ──1──> NoteContent
  │                               │
  │                               ├──M──> Highlight
  │                               ├──M──> ReviewSchedule
  │                               ├──M──> ReviewRecord
  │                               ├──1──> CollaborationGroup
  │                               ├──M──> Annotation
  │                               ├──M──> ShareLink
  │                               └──M──> MediaFile
  │
  └──M──> CollaborationGroup ──M──> GroupMember
```

## 📝 核心规范汇总

### API 设计规范 (详见 api-design.md)
- ✅ RESTful 风格，版本化 (/api/v1/)
- ✅ JWT 认证 + 刷新令牌机制
- ✅ 40+ 端点完整设计
- ✅ 统一错误响应格式
- ✅ 速率限制和分页规范
- ✅ WebSocket 实时通信

### 数据库规范 (详见 data-model.md)
- ✅ UUID 主键，ULID 排序友好
- ✅ 所有表包含 created_at, updated_at
- ✅ 软删除策略 (deleted_at 字段)
- ✅ 复合索引优化常见查询
- ✅ 自动时间戳和版本控制
- ✅ 外键约束和级联操作

### 前端规范 (详见 frontend-architecture.md)
- ✅ Monorepo 结构，代码共享
- ✅ Zustand 本地状态 + TanStack Query 服务器状态
- ✅ TypeScript 严格模式
- ✅ 组件化 + Hooks 模式
- ✅ 响应式设计 (3 端适配)
- ✅ 离线编辑支持

### 后端规范 (详见 backend-architecture.md)
- ✅ FastAPI 异步优先
- ✅ 分层架构 (API → Service → CRUD → DB)
- ✅ SQLAlchemy ORM 2.0
- ✅ Pydantic 数据验证
- ✅ 依赖注入和中间件
- ✅ 异步任务处理 (Celery)

## 🔄 版本迭代计划

### P0 - MVP (第 1-2 周)
- [x] 项目初始化和文档完成
- [ ] 用户认证 (注册/登录)
- [ ] 笔记编辑 (三分栏核心)
- [ ] 复习系统 (基础模式)
- [ ] 首页和个人中心
- [ ] 前端基本页面

### P1 - 增值功能 (第 3-4 周)
- [ ] AI 功能 (高亮、提炼、生成)
- [ ] 复习进阶/高阶模式
- [ ] 协作编辑 (WebSocket)
- [ ] 分享和导出
- [ ] 用户权限管理

### P2 - 优化迭代 (第 5 周+)
- [ ] 教师班级管理
- [ ] 数据备份和恢复
- [ ] 性能优化
- [ ] 安全加固
- [ ] 移动端优化

## 🔗 文档关系图

```
产品设计
  │ (定义功能和流程)
  ↓
原型设计 (design/prototypes/)
  │ (定义 UI 和交互)
  ├─→ 功能模块与用户流程.md
  ├─→ 页面原型框架与设计规范.md
  └─→ 原型设计总结与Figma指南.md
  │
  ↓ (翻译为数据和技术)
系统设计 (当前目录)
  │
  ├─→ 数据模型设计.md
  │   (定义 12 个数据实体和关系)
  │
  ├─→ API 设计规范.md
  │   (定义 40+ 个 API 端点)
  │   ├─→ 前端实现
  │   └─→ 后端实现
  │
  ├─→ 前端架构设计.md
  │   (React 应用架构)
  │   └─→ frontend/* (代码实现)
  │
  └─→ 后端架构设计.md
      (FastAPI 服务架构)
      └─→ backend/* (代码实现)
```

## 📚 相关文档链接

### 上层文档（需求和设计）
- [`/docs/product-design/`](../product-design/) - 产品设计文档
- [`/design/README.md`](../../design/README.md) - 设计规范总览
- [`/design/prototypes/`](../../design/prototypes/) - 原型设计文档

### 同层文档（系统设计）
- [`data-model.md`](./data-model.md) - 数据模型详解（12 个实体）
- [`api-design.md`](./api-design.md) - API 规范（40+ 端点）
- [`frontend-architecture.md`](./frontend-architecture.md) - 前端架构
- [`backend-architecture.md`](./backend-architecture.md) - 后端架构

### 下层文档（开发和实现）
- [`/PROJECT_STRUCTURE.md`](../../PROJECT_STRUCTURE.md) - 项目组织细节
- [`/QUICKSTART.md`](../../QUICKSTART.md) - 快速开始指南
- [`/CLAUDE.md`](../../CLAUDE.md) - AI 编程助手指南

## 🎓 学习路径

### 初次接触项目？
1. 阅读 [`/PROJECT_STRUCTURE.md`](../../PROJECT_STRUCTURE.md) (5分钟)
2. 阅读 [`/QUICKSTART.md`](../../QUICKSTART.md) (10分钟)
3. 根据角色选择对应的系统设计文档 (20-40分钟)
4. 开始代码实现

### 需要理解某个功能？
1. 查看 [`/design/prototypes/功能模块与用户流程.md`](../../design/prototypes/功能模块与用户流程.md)
2. 查看 [`data-model.md`](./data-model.md) 中的相关数据模型
3. 查看 [`api-design.md`](./api-design.md) 中的相关 API 端点
4. 查看对应的前端/后端架构文档

### 开始特定开发任务？
- **前端开发**: [`frontend-architecture.md`](./frontend-architecture.md)
- **后端开发**: [`backend-architecture.md`](./backend-architecture.md) + [`data-model.md`](./data-model.md)
- **数据库设计**: [`data-model.md`](./data-model.md)
- **API 设计**: [`api-design.md`](./api-design.md)

## ⚡ 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 前端框架 | React 18 | 生态成熟，性能优秀 |
| 项目组织 | pnpm Monorepo | 支持多端，代码共享 |
| 后端框架 | FastAPI | 异步性能强，文档生成 |
| 数据库 | PostgreSQL | 可靠性强，JSON 支持 |
| 缓存层 | Redis | 性能高，集成简单 |
| 状态管理 | Zustand + TanStack Query | 轻量级，分离本地和服务器状态 |
| 认证方案 | JWT + 刷新令牌 | 无状态，适合分布式 |
| 协作编辑 | WebSocket + OT | 实时同步，冲突处理 |

## 📞 常见问题

**Q: 12 个数据实体是什么？**
A: User, Notebook, CornellNote, NoteContent, Highlight, ReviewSchedule, ReviewRecord, CollaborationGroup, GroupMember, Annotation, ShareLink, MediaFile。详见本文档的"核心数据模型"部分。

**Q: 为什么用 Zustand + TanStack Query？**
A: Zustand 用于本地状态（UI 状态），TanStack Query 用于服务器状态（数据）。两者结合比单一状态管理工具更轻量和灵活。

**Q: API 有多少个端点？**
A: 40+ 个端点，涵盖认证、笔记、高亮、复习、协作、分享、导出等所有功能。详见 `api-design.md`。

**Q: 如何处理离线编辑？**
A: 使用本地存储 (useDraftStore) 保存草稿。网络恢复时自动同步。详见 `frontend-architecture.md` 的"离线编辑支持"。

**Q: 怎样实现实时协作？**
A: 使用 WebSocket 连接传递编辑操作。服务器使用 Operational Transform 处理冲突。详见 `backend-architecture.md`。

---

**最后更新**: 2024-01-29
**版本**: 1.0
**维护者**: 系统设计团队
