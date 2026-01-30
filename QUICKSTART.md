# 快速开始指南

本指南帮助您快速搭建康奈尔笔记学习助手的开发环境。

## 📋 前置要求

确保您的系统已安装以下工具：

- **Python 3.10+** - 后端开发
- **Node.js 18+** - 前端开发
- **pnpm 8+** - 前端包管理器
- **Git** - 版本控制

### 安装 pnpm

```bash
npm install -g pnpm
```

## 🚀 快速启动（推荐）

### 方式一：使用启动脚本（开发中）

```bash
# 一键启动前后端（开发中）
./scripts/dev/start-all.sh
```

### 方式二：手动启动

#### 1. 后端设置

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 运行开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 http://localhost:8000 启动

**API 文档**: http://localhost:8000/docs

#### 2. 前端设置（新终端窗口）

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 运行开发服务器
pnpm dev
```

前端应用将在 http://localhost:3000 启动

## 🧪 验证安装

### 检查后端

```bash
curl http://localhost:8000/health
# 预期输出: {"status":"healthy"}
```

### 检查前端

在浏览器中访问 http://localhost:3000，应该看到欢迎页面。

## 📂 项目结构快速浏览

```
cornell-notes/
├── backend/          # Python FastAPI 后端 (端口 8000)
├── frontend/         # React TypeScript 前端 (端口 3000)
├── docs/            # 项目文档
│   └── system-design/  # 核心设计文档
├── design/          # 设计资源
└── scripts/         # 开发脚本
```

详细结构请查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🛠️ 常用开发命令

### 后端

```bash
cd backend

# 代码格式化
black app/ tests/

# 代码检查
ruff check app/ tests/

# 运行测试
pytest

# 类型检查
mypy app/
```

### 前端

```bash
cd frontend

# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 修复代码问题
pnpm lint:fix

# 运行测试
pnpm test

# 类型检查
pnpm type-check
```

## 🔧 环境配置

### 后端环境变量

在 `backend/` 目录创建 `.env` 文件（参考 `.env.example`）：

```env
DATABASE_URL=sqlite:///./cornell_notes.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 前端环境变量

在 `frontend/` 目录创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📖 下一步

- 📚 阅读 [系统设计文档](./docs/system-design/)
- 🎨 查看 [设计资源](./design/)
- 🤖 了解 [AI 编码助手指南](./CLAUDE.md)
- 📘 查阅 [完整文档](./docs/)

## ❓ 常见问题

### 端口被占用

如果端口 3000 或 8000 被占用：

```bash
# 后端使用其他端口
uvicorn app.main:app --reload --port 8001

# 前端使用其他端口
pnpm dev -- --port 3001
```

### Python 虚拟环境问题

确保使用正确的 Python 版本：

```bash
python --version  # 应该是 3.10 或更高
```

### pnpm 安装失败

清除缓存后重试：

```bash
pnpm store prune
pnpm install
```

## 🆘 获取帮助

- 查看 [开发文档](./docs/development/)
- 提交 Issue（开发中）
- 查看项目 README

---

祝开发愉快！🎉
