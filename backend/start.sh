#!/bin/bash
# 后端启动脚本 - 自动运行数据库迁移

set -e

echo "运行数据库迁移..."
alembic upgrade head

echo "启动应用..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8100
