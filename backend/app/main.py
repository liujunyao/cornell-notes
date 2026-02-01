"""FastAPI 应用主入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1 import api_router
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    init_db()
    print("✅ 数据库初始化完成")
    yield
    # 关闭时的清理工作
    print("👋 应用关闭")


app = FastAPI(
    title="康奈尔笔记 API",
    description="康奈尔笔记学习助手后端服务",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Web 前端开发服务器
        "http://localhost:3001",  # Mobile 前端开发服务器
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "康奈尔笔记 API",
        "version": "0.1.0",
        "docs": "/docs",
        "api": "/api/v1"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    print("========================================")
    print("  康奈尔笔记应用 - 后端服务启动")
    print("========================================")
    print("  API 服务:  http://localhost:8000")
    print("  API 文档:  http://localhost:8000/docs")
    print("  健康检查:  http://localhost:8000/health")
    print("========================================")
    print()

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
