"""笔记本模型"""
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, Optional

from app.models.base import BaseModel


class Notebook(BaseModel):
    """笔记本模型

    对应数据模型设计文档中的 Notebook 实体
    """

    __tablename__ = "notebooks"

    # 基本信息
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)

    # 外观设置
    color: Mapped[str] = mapped_column(String(7), default="#3A6EA5", nullable=False)
    icon: Mapped[str] = mapped_column(String(100), default="📚", nullable=False)

    # 状态
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 软删除
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # 外键
    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 关系
    owner: Mapped["User"] = relationship("User", back_populates="notebooks")
    notes: Mapped[List["CornellNote"]] = relationship(
        "CornellNote",
        back_populates="notebook",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Notebook(id={self.id}, title={self.title}, owner_id={self.owner_id})>"
