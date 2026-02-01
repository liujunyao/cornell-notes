"""深度探索对话管理 API 端点"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone

from app.api.deps import get_current_user, get_db
from app.api.v1.schemas import (
    ConversationSaveRequest,
    ConversationResponse,
    ConversationListResponse,
)
from app.models import User, ExploreConversation, ExploreQAPair, CornellNote

router = APIRouter()


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def save_conversation(
    request: ConversationSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """保存深度探索对话记录

    Args:
        request: 对话保存请求
        current_user: 当前用户
        db: 数据库会话

    Returns:
        ConversationResponse: 保存的对话记录

    Raises:
        HTTPException: 笔记不存在或无权限
    """
    # 验证笔记是否存在且属于当前用户
    note = db.query(CornellNote).filter(
        CornellNote.id == request.note_id,
        CornellNote.owner_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在或无权限"
        )

    # 检查是否已存在该笔记的对话记录
    existing_conversation = db.query(ExploreConversation).filter(
        ExploreConversation.note_id == request.note_id,
        ExploreConversation.user_id == current_user.id
    ).first()

    if existing_conversation:
        # 删除旧的问答对
        db.query(ExploreQAPair).filter(
            ExploreQAPair.conversation_id == existing_conversation.id
        ).delete()

        # 添加新的问答对
        for i, qa in enumerate(request.qa_pairs):
            qa_pair = ExploreQAPair(
                id=str(uuid.uuid4()),
                conversation_id=existing_conversation.id,
                question=qa.question,
                answer=qa.answer,
                sequence=i + 1,
                question_time=datetime.now(timezone.utc),
                answer_time=datetime.now(timezone.utc),
            )
            db.add(qa_pair)

        # 更新统计
        existing_conversation.qa_count = len(request.qa_pairs)
        existing_conversation.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(existing_conversation)
        return existing_conversation
    else:
        # 创建新对话
        conversation = ExploreConversation(
            id=str(uuid.uuid4()),
            note_id=request.note_id,
            user_id=current_user.id,
            qa_count=len(request.qa_pairs)
        )
        db.add(conversation)
        db.flush()  # 获取 conversation.id

        # 添加问答对
        for i, qa in enumerate(request.qa_pairs):
            qa_pair = ExploreQAPair(
                id=str(uuid.uuid4()),
                conversation_id=conversation.id,
                question=qa.question,
                answer=qa.answer,
                sequence=i + 1,
                question_time=datetime.now(timezone.utc),
                answer_time=datetime.now(timezone.utc),
            )
            db.add(qa_pair)

        db.commit()
        db.refresh(conversation)
        return conversation


@router.get("/conversations/{note_id}", response_model=ConversationResponse | None)
async def get_conversation(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取笔记的深度探索对话记录

    如果没有对话记录，返回 null（前端可以判断是否为空）

    Args:
        note_id: 笔记ID
        current_user: 当前用户
        db: 数据库会话

    Returns:
        ConversationResponse | None: 对话记录，如果不存在则返回 null
    """
    # 先验证笔记是否存在且属于当前用户
    note = db.query(CornellNote).filter(
        CornellNote.id == note_id,
        CornellNote.owner_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"笔记不存在或无权限访问 (note_id: {note_id})"
        )

    # 查询对话记录（可能不存在）
    conversation = db.query(ExploreConversation).filter(
        ExploreConversation.note_id == note_id,
        ExploreConversation.user_id == current_user.id
    ).first()

    return conversation  # 如果没有，FastAPI 会返回 null


@router.delete("/conversations/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除笔记的深度探索对话记录

    Args:
        note_id: 笔记ID
        current_user: 当前用户
        db: 数据库会话

    Raises:
        HTTPException: 对话记录不存在
    """
    conversation = db.query(ExploreConversation).filter(
        ExploreConversation.note_id == note_id,
        ExploreConversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话记录不存在"
        )

    db.delete(conversation)
    db.commit()
