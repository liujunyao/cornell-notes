"""用户模型"""
from sqlalchemy import String, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
from typing import List

from app.models.base import BaseModel


class UserType(str, enum.Enum):
    """用户类型枚举"""
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"
    ADMIN = "admin"


class User(BaseModel):
    """用户模型

    对应数据模型设计文档中的 User 实体
    """

    __tablename__ = "users"

    # 基本信息
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # 个人信息
    full_name: Mapped[str] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    bio: Mapped[str] = mapped_column(String(500), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    location: Mapped[str] = mapped_column(String(100), nullable=True)

    # 用户类型和状态
    user_type: Mapped[UserType] = mapped_column(
        Enum(UserType),
        default=UserType.STUDENT,
        nullable=False,
        index=True
    )
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # 最后登录时间
    last_login: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # 关系
    notebooks: Mapped[List["Notebook"]] = relationship(
        "Notebook",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    notes: Mapped[List["CornellNote"]] = relationship(
        "CornellNote",
        back_populates="owner",
        foreign_keys="CornellNote.owner_id",
        cascade="all, delete-orphan"
    )
    explore_conversations: Mapped[List["ExploreConversation"]] = relationship(
        "ExploreConversation",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"
