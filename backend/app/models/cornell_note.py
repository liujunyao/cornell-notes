"""康奈尔笔记模型"""
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
import enum

from app.models.base import BaseModel


class AccessLevel(str, enum.Enum):
    """访问级别枚举"""
    PRIVATE = "private"
    SHARED = "shared"
    PUBLIC = "public"


class CornellNote(BaseModel):
    """康奈尔笔记模型

    对应数据模型设计文档中的 CornellNote 实体
    """

    __tablename__ = "cornell_notes"

    # 基本信息
    title: Mapped[str] = mapped_column(String(300), nullable=False)

    # 状态
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_starred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # 访问控制
    access_level: Mapped[AccessLevel] = mapped_column(
        Enum(AccessLevel),
        default=AccessLevel.PRIVATE,
        nullable=False
    )

    # 统计信息
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_review_minutes: Mapped[int] = mapped_column(Integer, nullable=True)

    # AI 相关
    ai_generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # 软删除
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # 外键
    notebook_id: Mapped[str] = mapped_column(
        ForeignKey("notebooks.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    last_edited_by: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # 关系
    notebook: Mapped["Notebook"] = relationship("Notebook", back_populates="notes")
    owner: Mapped["User"] = relationship("User", back_populates="notes", foreign_keys=[owner_id])
    content: Mapped[Optional["NoteContent"]] = relationship(
        "NoteContent",
        back_populates="note",
        uselist=False,
        cascade="all, delete-orphan"
    )
    explore_sessions: Mapped[list["ExploreConversation"]] = relationship(
        "ExploreConversation",
        back_populates="note",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<CornellNote(id={self.id}, title={self.title}, owner_id={self.owner_id})>"
