"""笔记内容模型"""
from sqlalchemy import String, Text, ForeignKey, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional

from app.models.base import BaseModel


class NoteContent(BaseModel):
    """笔记内容模型 - 康奈尔笔记三分栏

    对应数据模型设计文档中的 NoteContent 实体
    """

    __tablename__ = "note_contents"

    # 康奈尔笔记三分栏内容
    cue_column: Mapped[str] = mapped_column(Text, nullable=True, default="")
    note_column: Mapped[str] = mapped_column(Text, nullable=True, default="")
    summary_row: Mapped[str] = mapped_column(Text, nullable=True, default="")

    # 思维导图数据 (JSON格式)
    mindmap_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # 版本控制
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # 同步状态
    is_synced: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sync_error: Mapped[str] = mapped_column(String(500), nullable=True)

    # 外键 (一对一关系)
    note_id: Mapped[str] = mapped_column(
        ForeignKey("cornell_notes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    # 关系
    note: Mapped["CornellNote"] = relationship("CornellNote", back_populates="content")

    def __repr__(self):
        return f"<NoteContent(id={self.id}, note_id={self.note_id}, version={self.version})>"
