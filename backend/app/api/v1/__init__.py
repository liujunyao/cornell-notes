"""API v1 路由"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, notes, notebooks, ai, conversations

api_router = APIRouter()

# 注册路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(notes.router, prefix="/notes", tags=["笔记"])
api_router.include_router(notebooks.router, prefix="/notebooks", tags=["笔记本"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI服务"])
api_router.include_router(conversations.router, prefix="/ai", tags=["深度探索对话"])
