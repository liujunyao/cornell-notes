# 康奈尔笔记 - 学习助手

一个基于康奈尔笔记法的 Web 学习辅助工具，帮助用户更高效地记录、整理和回顾学习内容。

## 🎯 项目愿景

康奈尔笔记法是一种经过验证的系统化笔记方法，本项目旨在将这一方法数字化，提供便捷的笔记管理和学习辅助功能。

## 📝 什么是康奈尔笔记法？

康奈尔笔记法将笔记页面分为三个功能区域：

```
┌─────────────────────────────────────┐
│        康奈尔笔记模板                 │
├─────────┬──────────────────────────┤
│         │                           │
│  线索栏  │      笔记栏               │
│         │                           │
│  关键词  │   · 主要内容              │
│  问题   │   · 详细记录              │
│  概念   │   · 课程笔记              │
│         │                           │
├─────────┴──────────────────────────┤
│                                     │
│  总结栏                              │
│  · 概括本页要点                      │
│  · 用自己的话总结                    │
│                                     │
└─────────────────────────────────────┘
```

- **笔记栏**（右侧）：记录课堂或阅读的主要内容
- **线索栏**（左侧）：记录关键词、问题和重要概念
- **总结栏**（底部）：用自己的话概括总结

## 🚀 技术栈

### 后端
- Python 3.10+ / FastAPI
- SQLAlchemy 2.0
- JWT 认证

### 前端
- React 18 + TypeScript
- Vite
- pnpm
- Zustand + TanStack Query

## 📂 项目结构

```
cornell-notes/
├── backend/          # Python FastAPI 后端
├── frontend/         # React TypeScript 前端
├── docs/            # 项目文档
├── design/          # 设计资源
└── scripts/         # 实用脚本
```

详见各子目录的 README 文件。

## 🛠️ 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- pnpm 8+

### 后端设置

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端将在 http://localhost:8000 启动

### 前端设置

```bash
cd frontend
pnpm install
pnpm dev
```

前端将在 http://localhost:3000 启动

## 📖 文档

- [完整文档](./docs/)
- [API 文档](./docs/api/)
- [架构设计](./docs/architecture/)
- [开发指南](./CLAUDE.md)

## 🤝 贡献

欢迎贡献！请查看各子项目的 README 了解开发规范。

## 📄 许可证

待定

## 🔗 相关资源

- [康奈尔笔记法介绍](https://en.wikipedia.org/wiki/Cornell_Notes)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React 文档](https://react.dev/)
