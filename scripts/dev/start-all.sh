#!/bin/bash
# 一键启动前后端开发服务器

echo "🚀 启动康奈尔笔记应用..."
echo ""

# 检查依赖
echo "📦 检查依赖..."
cd backend
if [ ! -d ".venv" ]; then
    echo "创建 Python 虚拟环境..."
    python -m venv .venv
fi

echo "激活虚拟环境并安装依赖..."
source .venv/bin/activate 2>/dev/null || .venv\\Scripts\\activate
pip install -q fastapi uvicorn sqlalchemy pydantic pydantic-settings passlib python-jose[cryptography] python-multipart bcrypt "pydantic[email]"

cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    pnpm install
fi

echo ""
echo "✅ 依赖检查完成"
echo ""
echo "🔄 启动服务..."
echo ""

# 启动后端（后台）
cd ../backend
source .venv/bin/activate 2>/dev/null || .venv\\Scripts\\activate
echo "📡 启动后端服务 (http://localhost:8000)..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
cd ../frontend
echo "🌐 启动前端服务 (http://localhost:3000)..."
pnpm dev:web &
FRONTEND_PID=$!

echo ""
echo "✨ 应用已启动！"
echo ""
echo "📍 访问地址:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待进程
wait $BACKEND_PID $FRONTEND_PID
