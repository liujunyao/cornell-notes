# 🎉 前端已按原型重构完成！

## 立即开始

### 🐳 Docker 部署（推荐，支持生产环境）

```bash
cd docker
cp .env.example .env
# 编辑 .env，配置数据库密码和 API Key
docker-compose up -d
```

访问：http://localhost

详见：[PostgreSQL 配置指南](POSTGRESQL_SETUP.md) | [Docker 部署文档](docker/README.md)

### Windows 用户（本地开发）
**双击运行**：`scripts\dev\start-all.bat`

### 手动启动（本地开发）
1. **后端**（终端1）：
   ```bash
   cd backend
   # 首次启动需要配置数据库（二选一）：
   # 方法1: 使用 SQLite（开发环境）
   cp .env.example .env  # DATABASE_URL 使用 sqlite

   # 方法2: 使用 PostgreSQL（推荐）
   # 1) 安装 PostgreSQL
   # 2) 创建数据库: psql -U postgres -c "CREATE DATABASE cornell_notes"
   # 3) 编辑 .env，设置 DATABASE_URL=postgresql://user:pass@localhost/cornell_notes

   .venv\Scripts\activate           # ⚠️ 必须先激活虚拟环境！
   pip install -r requirements.txt
   alembic upgrade head             # 运行数据库迁移
   python app/main.py
   ```

2. **前端**（终端2）：
   ```bash
   cd frontend
   pnpm install
   pnpm dev:web
   ```

## 访问地址
- 前端：http://localhost:3000（本地开发）或 http://localhost（Docker）
- 后端：http://localhost:8000
- API文档：http://localhost:8000/docs

## 重要文档
- **🐳 [PostgreSQL 配置指南](POSTGRESQL_SETUP.md)** - 数据库切换说明
- **🐳 [Docker 部署文档](docker/README.md)** - 容器化部署
- **📖 [前端重构完成报告](FRONTEND_REFACTOR_COMPLETE.md)** - 详细功能说明
- **📖 [README_COMPLETE.md](README_COMPLETE.md)** - 完整使用指南
- **🚀 [START_HERE.md](START_HERE.md)** - 快速开始
- **🔧 [backend/BACKEND_GUIDE.md](backend/BACKEND_GUIDE.md)** - 后端详细指南
- **🗃️ [backend/POSTGRESQL_MIGRATION.md](backend/POSTGRESQL_MIGRATION.md)** - 数据库迁移指南

## 已实现功能
✅ 左侧垂直导航栏（完全按照原型）
✅ 笔记列表页（Tab切换、搜索、三栏预览）
✅ **康奈尔笔记编辑器**（三分栏布局、响应式）
  - 线索栏 20% + 笔记栏 80% + 总结栏底部（经典模式）
  - 线索栏 15% + 笔记栏 65% + 总结栏 20%（宽屏模式）
  - 工具栏（格式化、AI 功能）
  - 自动保存（5秒防抖）+ 手动保存
  - 专注模式（折叠辅助栏）
  - AI 深度探索对话（流式输出、对话记录保存）
✅ 用户注册和登录（自动创建默认笔记本）
✅ 完整的 RESTful API
✅ **PostgreSQL 数据库**（生产级持久化）
✅ **Docker 容器化部署**（一键启动）
✅ 数据库迁移管理（Alembic）

立即体验康奈尔笔记法的数字化！📝
