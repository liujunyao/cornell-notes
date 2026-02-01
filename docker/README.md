# Docker 部署指南

本目录包含康奈尔笔记应用的 Docker 镜像构建和部署文件。

## 📦 目录结构

```
docker/
├── backend.Dockerfile      # 后端 Dockerfile
├── frontend.Dockerfile     # 前端 Dockerfile
├── nginx.conf             # Nginx 配置文件
├── docker-compose.yml     # Docker Compose 配置
├── build.sh               # 构建脚本 (Linux/Mac)
├── build.bat              # 构建脚本 (Windows)
├── push.sh                # 推送脚本 (Linux/Mac)
├── push.bat               # 推送脚本 (Windows)
├── .env.example           # 环境变量示例
└── README.md              # 本文件
```

## 🚀 快速开始

### 1. 配置环境变量

复制环境变量示例文件并修改：

```bash
cd docker
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

**重要配置项：**
- `POSTGRES_USER`: PostgreSQL 用户名
- `POSTGRES_PASSWORD`: PostgreSQL 密码（请修改为强密码）
- `POSTGRES_DB`: 数据库名称
- `SECRET_KEY`: JWT 密钥（请生成随机字符串）
- `EXPLORE_API_KEY`: AI 服务 API Key

### 2. 构建 Docker 镜像

**Linux/Mac:**
```bash
cd ..  # 返回项目根目录
chmod +x docker/build.sh
./docker/build.sh
```

**Windows:**
```cmd
docker\build.bat
```

### 3. 推送镜像到仓库

**Linux/Mac:**
```bash
chmod +x docker/push.sh
./docker/push.sh
```

**Windows:**
```cmd
docker\push.bat
```

### 4. 使用 Docker Compose 部署

```bash
cd docker
docker-compose up -d
```

## 🏗️ 镜像信息

### PostgreSQL 数据库
- **镜像名称**: `postgres:16-alpine`
- **暴露端口**: `5432`
- **数据持久化**: `postgres-data` volume

### 后端镜像
- **镜像名称**: `c8n.io/liujunyao/cornell-notes-backend:latest`
- **基础镜像**: `python:3.11-slim`
- **暴露端口**: `8000`
- **启动命令**: 自动运行数据库迁移后启动 Uvicorn
- **依赖服务**: PostgreSQL（需等待健康检查通过）

### 前端镜像
- **镜像名称**: `c8n.io/liujunyao/cornell-notes-frontend:latest`
- **基础镜像**: `nginx:alpine`
- **暴露端口**: `80`
- **构建方式**: 多阶段构建（Node.js 构建 + Nginx 服务）

## 🔧 高级用法

### 构建指定版本

```bash
# Linux/Mac
VERSION=v1.0.0 ./docker/build.sh

# Windows
set VERSION=v1.0.0 && docker\build.bat
```

### 单独构建某个服务

```bash
# 只构建后端
docker build -f docker/backend.Dockerfile -t c8n.io/cornell-notes/backend:latest .

# 只构建前端
docker build -f docker/frontend.Dockerfile -t c8n.io/cornell-notes/frontend:latest .
```

### 单独运行某个服务

```bash
# 只启动后端
docker-compose up -d backend

# 只启动前端
docker-compose up -d frontend
```

## 📝 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_USER` | PostgreSQL 用户名 | `cornell_user` |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | `cornell_pass` |
| `POSTGRES_DB` | PostgreSQL 数据库名 | `cornell_notes` |
| `SECRET_KEY` | JWT 密钥 | `your-secret-key-change-me` |
| `ALGORITHM` | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间（分钟） | `30` |
| `EXPLORE_API_KEY` | AI 服务 API Key | - |
| `EXPLORE_BASE_URL` | AI 服务 Base URL | `https://api.openai.com/v1` |
| `EXPLORE_MODEL_NAME` | AI 模型名称 | `gpt-4` |
| `VERSION` | 镜像版本标签 | `latest` |

## 🌐 访问应用

部署成功后，可以通过以下地址访问：

- **前端**: http://localhost
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432（需要数据库客户端连接）

## 🛠️ 故障排查

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看数据库日志
docker-compose logs -f postgres

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

### PostgreSQL 相关问题

#### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker-compose ps postgres

# 检查数据库健康状态
docker exec cornell-notes-postgres pg_isready -U cornell_user

# 进入数据库容器
docker exec -it cornell-notes-postgres psql -U cornell_user -d cornell_notes
```

#### 2. 重置数据库

```bash
# 停止所有服务
docker-compose down

# 删除数据卷（警告：会删除所有数据）
docker volume rm docker_postgres-data

# 重新启动
docker-compose up -d
```

#### 3. 手动运行迁移

```bash
# 进入后端容器
docker exec -it cornell-notes-backend bash

# 运行迁移
alembic upgrade head

# 查看迁移状态
alembic current
```

#### 4. 数据备份

```bash
# 备份数据库
docker exec cornell-notes-postgres pg_dump -U cornell_user cornell_notes > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i cornell-notes-postgres psql -U cornell_user -d cornell_notes < backup_20260201.sql
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart backend
```

### 清理并重新构建

```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker rmi c8n.io/cornell-notes/backend:latest
docker rmi c8n.io/cornell-notes/frontend:latest

# 重新构建
./docker/build.sh
docker-compose up -d
```

## 📚 更多信息

- 项目文档: `../docs/`
- API 文档: `../backend/README.md`
- 前端文档: `../frontend/README.md`
