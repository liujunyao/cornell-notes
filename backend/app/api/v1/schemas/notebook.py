"""笔记本相关的 Pydantic 模式"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class NotebookBase(BaseModel):
    """笔记本基础模式"""
    title: str = Field(..., min_length=1, max_length=200, description="笔记本标题")
    description: Optional[str] = Field(None, max_length=1000, description="笔记本描述")
    icon: str = Field("📚", max_length=100, description="图标")
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="颜色代码（可选）")


class NotebookCreate(NotebookBase):
    """创建笔记本的请求模式"""
    pass


class NotebookUpdate(BaseModel):
    """更新笔记本的请求模式"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    icon: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    is_archived: Optional[bool] = None
    is_public: Optional[bool] = None


class NotebookResponse(NotebookBase):
    """笔记本响应模式"""
    id: str
    owner_id: str
    is_archived: bool
    is_public: bool
    note_count: int = Field(0, description="笔记数量")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotebookListResponse(BaseModel):
    """笔记本列表响应模式"""
    items: list[NotebookResponse]
    total: int
    page: int
    page_size: int
