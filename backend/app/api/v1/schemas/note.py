"""笔记相关的 Pydantic 模型"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any

from app.models.cornell_note import AccessLevel


# 笔记内容
class NoteContentBase(BaseModel):
    """笔记内容基础模型"""
    cue_column: Optional[str] = Field("", description="线索栏 - 关键词和问题")
    note_column: Optional[str] = Field("", description="笔记栏 - 详细内容")
    summary_row: Optional[str] = Field("", description="总结栏 - 核心总结")
    mindmap_data: Optional[Any] = Field(None, description="思维导图数据（JSON格式）")


class NoteContentResponse(NoteContentBase):
    """笔记内容响应"""
    id: str
    version: int
    is_synced: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# 笔记创建
class NoteCreate(BaseModel):
    """创建笔记请求"""
    title: str = Field(..., min_length=1, max_length=300, description="笔记标题")
    notebook_id: Optional[str] = Field(None, description="笔记本ID")
    access_level: AccessLevel = Field(AccessLevel.PRIVATE, description="访问级别")
    content: Optional[NoteContentBase] = Field(None, description="笔记内容")


# 笔记更新
class NoteUpdate(BaseModel):
    """更新笔记请求"""
    title: Optional[str] = Field(None, min_length=1, max_length=300, description="笔记标题")
    notebook_id: Optional[str] = Field(None, description="笔记本ID")
    is_starred: Optional[bool] = Field(None, description="是否星标")
    access_level: Optional[AccessLevel] = Field(None, description="访问级别")
    content: Optional[NoteContentBase] = Field(None, description="笔记内容")


# 笔记响应（列表）
class NoteListItem(BaseModel):
    """笔记列表项"""
    id: str
    title: str
    notebook_id: Optional[str]
    is_starred: bool
    access_level: AccessLevel
    word_count: int
    view_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# 笔记响应（详情）
class NoteResponse(BaseModel):
    """笔记详情响应"""
    id: str
    title: str
    notebook_id: Optional[str]
    owner_id: str
    is_starred: bool
    is_archived: bool
    access_level: AccessLevel
    word_count: int
    view_count: int
    estimated_review_minutes: Optional[int]
    ai_generated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    content: Optional[NoteContentResponse]

    model_config = {
        "from_attributes": True
    }


# 分页响应
class PaginationMeta(BaseModel):
    """分页元数据"""
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")


class NoteListResponse(BaseModel):
    """笔记列表响应"""
    items: list[NoteListItem]
    pagination: PaginationMeta
