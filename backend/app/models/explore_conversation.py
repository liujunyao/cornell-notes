"""深度探索对话模型"""
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.models.base import Base


class ExploreConversation(Base):
    """深度探索对话会话表

    记录用户在笔记编辑器中的探索对话会话
    """
    __tablename__ = "explore_conversations"

    id = Column(String, primary_key=True, index=True)
    note_id = Column(String, ForeignKey("cornell_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # 对话标题（可选，用于区分多个对话）
    title = Column(String(200), nullable=True)

    # 统计信息
    qa_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 关系
    note = relationship("CornellNote", back_populates="explore_sessions")
    owner = relationship("User", back_populates="explore_conversations")
    qa_pairs = relationship("ExploreQAPair", back_populates="conversation", cascade="all, delete-orphan", order_by="ExploreQAPair.sequence")

    def __repr__(self):
        return f"<ExploreConversation(id={self.id}, note_id={self.note_id}, qa_count={self.qa_count})>"


class ExploreQAPair(Base):
    """深度探索问答对表

    存储一对 Question-Answer
    """
    __tablename__ = "explore_qa_pairs"

    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("explore_conversations.id", ondelete="CASCADE"), nullable=False, index=True)

    # 问题（用户提问）
    question = Column(Text, nullable=False)
    question_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # 回答（AI回复）
    answer = Column(Text, nullable=False)
    answer_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # 序号（用于排序，表示第几轮对话）
    sequence = Column(Integer, nullable=False, index=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # 关系
    conversation = relationship("ExploreConversation", back_populates="qa_pairs")

    def __repr__(self):
        return f"<ExploreQAPair(id={self.id}, sequence={self.sequence})>"
