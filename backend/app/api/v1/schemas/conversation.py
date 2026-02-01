"""深度探索对话相关的 Pydantic 模型"""
from typing import List
from pydantic import BaseModel, Field
from datetime import datetime


class QAPairCreate(BaseModel):
    """创建问答对请求"""
    question: str = Field(..., description="用户问题")
    answer: str = Field(..., description="AI回答")


class QAPairResponse(BaseModel):
    """问答对响应"""
    id: str = Field(..., description="问答对ID")
    question: str = Field(..., description="用户问题")
    question_time: datetime = Field(..., description="提问时间")
    answer: str = Field(..., description="AI回答")
    answer_time: datetime = Field(..., description="回答时间")
    sequence: int = Field(..., description="序号（第几轮对话）")
    created_at: datetime = Field(..., description="创建时间")

    class Config:
        from_attributes = True


class ConversationSaveRequest(BaseModel):
    """保存对话请求"""
    note_id: str = Field(..., description="笔记ID")
    qa_pairs: List[QAPairCreate] = Field(..., description="问答对列表")


class ConversationResponse(BaseModel):
    """对话响应"""
    id: str = Field(..., description="对话ID")
    note_id: str = Field(..., description="笔记ID")
    title: str | None = Field(None, description="对话标题")
    qa_count: int = Field(..., description="问答对数量")
    qa_pairs: List[QAPairResponse] = Field(..., description="问答对列表")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    """对话列表项"""
    id: str = Field(..., description="对话ID")
    note_id: str = Field(..., description="笔记ID")
    title: str | None = Field(None, description="对话标题")
    qa_count: int = Field(..., description="问答对数量")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """对话列表响应"""
    data: List[ConversationListItem] = Field(..., description="对话列表")
    total: int = Field(..., description="总数")
