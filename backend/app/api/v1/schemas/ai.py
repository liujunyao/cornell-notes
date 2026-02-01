"""AI 服务相关的 Pydantic 模型"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# 消息模型
class ChatMessage(BaseModel):
    """对话消息"""
    role: Literal["user", "assistant"] = Field(..., description="角色：用户或AI助手")
    content: str = Field(..., description="消息内容")


# 请求模型
class ChatRequest(BaseModel):
    """对话请求"""
    message: str = Field(..., min_length=1, max_length=10000, description="用户消息")
    history: List[ChatMessage] = Field(default=[], description="历史对话记录")
    note_context: Optional[str] = Field(None, description="笔记上下文（可选）")
    max_tokens: Optional[int] = Field(2048, ge=1, le=8000, description="最大生成令牌数")
    temperature: Optional[float] = Field(0.7, ge=0, le=1, description="温度参数")


class ExploreRequest(BaseModel):
    """深度探索请求"""
    question: str = Field(..., min_length=1, max_length=10000, description="探索问题")
    note_id: Optional[str] = Field(None, description="笔记ID（可选，用于获取笔记内容作为上下文）")
    history: List[ChatMessage] = Field(default=[], description="历史对话记录")


# 响应模型
class ChatResponse(BaseModel):
    """对话响应"""
    message: str = Field(..., description="AI回复内容")
    role: Literal["assistant"] = Field("assistant", description="角色：AI助手")
    usage: Optional[dict] = Field(None, description="令牌使用情况")


class ExploreResponse(BaseModel):
    """深度探索响应"""
    answer: str = Field(..., description="AI回答内容（Markdown格式）")


class ExtractPointRequest(BaseModel):
    """提炼线索和问题请求"""
    note_id: str = Field(..., description="笔记ID")
    note_content: str = Field(..., description="笔记内容（富文本HTML）")


class ExtractPointResponse(BaseModel):
    """提炼线索和问题响应"""
    cue_points: List[str] = Field(..., description="提炼的线索和问题列表")


class GenerateMindmapRequest(BaseModel):
    """生成思维导图请求"""
    note_id: str = Field(..., description="笔记ID")
    note_content: str = Field(..., description="笔记内容（富文本HTML）")


class MindmapNode(BaseModel):
    """思维导图节点"""
    id: str = Field(..., description="节点ID")
    label: str = Field(..., description="节点文本")
    children: List['MindmapNode'] = Field(default=[], description="子节点列表")


class GenerateMindmapResponse(BaseModel):
    """生成思维导图响应"""
    mindmap: MindmapNode = Field(..., description="思维导图根节点")


class CheckSummaryRequest(BaseModel):
    """检查总结请求"""
    note_id: str = Field(..., description="笔记ID")
    note_content: str = Field(..., description="笔记内容（富文本HTML）")
    user_summary: str = Field(..., description="用户的总结内容")


class CheckSummaryResponse(BaseModel):
    """检查总结响应"""
    feedback: str = Field(..., description="AI反馈内容（Markdown格式）")
