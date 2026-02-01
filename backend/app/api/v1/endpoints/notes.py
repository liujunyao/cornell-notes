"""笔记相关 API 端点"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
import math

from app.api.deps import get_db, get_current_user
from app.api.v1.schemas import (
    NoteCreate,
    NoteUpdate,
    NoteResponse,
    NoteListResponse,
    NoteListItem,
    PaginationMeta,
)
from app.models import User, CornellNote, NoteContent, Notebook

router = APIRouter()


@router.get("", response_model=NoteListResponse)
async def get_notes(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    notebook_id: Optional[str] = Query(None, description="笔记本ID"),
    is_starred: Optional[bool] = Query(None, description="是否星标"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    sort: str = Query("created_at", description="排序字段"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取笔记列表

    Args:
        page: 页码
        page_size: 每页数量
        notebook_id: 笔记本ID（可选）
        is_starred: 是否仅返回星标笔记（可选）
        search: 搜索关键词（可选）
        sort: 排序字段
        current_user: 当前用户
        db: 数据库会话

    Returns:
        NoteListResponse: 笔记列表
    """
    # 构建查询
    query = db.query(CornellNote).filter(
        CornellNote.owner_id == current_user.id,
        CornellNote.deleted_at.is_(None)
    )

    # 过滤条件
    if notebook_id:
        query = query.filter(CornellNote.notebook_id == notebook_id)

    if is_starred is not None:
        query = query.filter(CornellNote.is_starred == is_starred)

    if search:
        query = query.filter(
            or_(
                CornellNote.title.contains(search),
            )
        )

    # 排序
    sort_field = sort.lstrip("-")
    if sort.startswith("-"):
        query = query.order_by(desc(getattr(CornellNote, sort_field)))
    else:
        query = query.order_by(getattr(CornellNote, sort_field))

    # 分页
    total = query.count()
    total_pages = math.ceil(total / page_size)
    offset = (page - 1) * page_size

    notes = query.offset(offset).limit(page_size).all()

    return NoteListResponse(
        items=[NoteListItem.model_validate(note) for note in notes],
        pagination=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建笔记

    Args:
        note_data: 笔记数据
        current_user: 当前用户
        db: 数据库会话

    Returns:
        NoteResponse: 创建的笔记

    Raises:
        HTTPException: 笔记本不存在时抛出 404 错误
    """
    # 确定笔记本ID
    notebook_id = note_data.notebook_id

    # 如果未指定笔记本，使用用户的第一个笔记本（默认笔记本）
    if not notebook_id:
        default_notebook = db.query(Notebook).filter(
            Notebook.owner_id == current_user.id,
            Notebook.deleted_at.is_(None)
        ).first()

        if not default_notebook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户没有笔记本，请先创建笔记本"
            )

        notebook_id = default_notebook.id
    else:
        # 如果指定了笔记本，验证笔记本是否存在且属于当前用户
        notebook = db.query(Notebook).filter(
            Notebook.id == notebook_id,
            Notebook.owner_id == current_user.id
        ).first()
        if not notebook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记本不存在"
            )

    # 创建笔记
    new_note = CornellNote(
        title=note_data.title,
        notebook_id=notebook_id,
        owner_id=current_user.id,
        access_level=note_data.access_level,
        last_edited_by=current_user.id
    )

    db.add(new_note)
    db.flush()  # 获取笔记 ID

    # 创建笔记内容
    cue_text = note_data.content.cue_column if note_data.content else ""
    note_text = note_data.content.note_column if note_data.content else ""
    summary_text = note_data.content.summary_row if note_data.content else ""

    note_content = NoteContent(
        note_id=new_note.id,
        cue_column=cue_text,
        note_column=note_text,
        summary_row=summary_text,
    )

    # 计算字数（中文字符 + 英文单词）
    total_text = cue_text + note_text + summary_text
    new_note.word_count = len(total_text.strip())

    db.add(note_content)
    db.commit()
    db.refresh(new_note)

    # 显式访问content以确保加载
    _ = new_note.content

    return NoteResponse.model_validate(new_note)


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取笔记详情

    Args:
        note_id: 笔记ID
        current_user: 当前用户
        db: 数据库会话

    Returns:
        NoteResponse: 笔记详情

    Raises:
        HTTPException: 笔记不存在或无权访问时抛出错误
    """
    from sqlalchemy.orm import joinedload

    note = db.query(CornellNote).options(
        joinedload(CornellNote.content)
    ).filter(
        CornellNote.id == note_id,
        CornellNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )

    # 权限检查
    if note.owner_id != current_user.id and note.access_level.value == "private":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该笔记"
        )

    # 增加浏览次数
    note.view_count += 1
    db.commit()
    db.refresh(note)

    # 显式访问content以确保加载
    _ = note.content

    return NoteResponse.model_validate(note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新笔记

    Args:
        note_id: 笔记ID
        note_data: 更新数据
        current_user: 当前用户
        db: 数据库会话

    Returns:
        NoteResponse: 更新后的笔记

    Raises:
        HTTPException: 笔记不存在或无权访问时抛出错误
    """
    from sqlalchemy.orm import joinedload

    note = db.query(CornellNote).options(
        joinedload(CornellNote.content)
    ).filter(
        CornellNote.id == note_id,
        CornellNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )

    # 权限检查：只有所有者可以编辑
    if note.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权编辑该笔记"
        )

    # 更新笔记本ID（移动笔记）
    if note_data.notebook_id is not None:
        # 验证目标笔记本是否存在且属于当前用户
        target_notebook = db.query(Notebook).filter(
            Notebook.id == note_data.notebook_id,
            Notebook.owner_id == current_user.id,
            Notebook.deleted_at.is_(None)
        ).first()

        if not target_notebook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="目标笔记本不存在"
            )

        note.notebook_id = note_data.notebook_id

    # 更新笔记
    if note_data.title is not None:
        note.title = note_data.title
    if note_data.is_starred is not None:
        note.is_starred = note_data.is_starred
    if note_data.access_level is not None:
        note.access_level = note_data.access_level

    note.last_edited_by = current_user.id

    # 更新笔记内容
    if note_data.content:
        if not note.content:
            # 如果内容不存在，创建新内容
            note_content = NoteContent(
                note_id=note.id,
                cue_column=note_data.content.cue_column or "",
                note_column=note_data.content.note_column or "",
                summary_row=note_data.content.summary_row or "",
            )
            db.add(note_content)
        else:
            # 更新现有内容
            if note_data.content.cue_column is not None:
                note.content.cue_column = note_data.content.cue_column
            if note_data.content.note_column is not None:
                note.content.note_column = note_data.content.note_column
            if note_data.content.summary_row is not None:
                note.content.summary_row = note_data.content.summary_row
            if note_data.content.mindmap_data is not None:
                note.content.mindmap_data = note_data.content.mindmap_data

            # 增加版本号
            note.content.version += 1

        # 重新计算字数
        if note.content:
            total_text = (note.content.cue_column or "") + (note.content.note_column or "") + (note.content.summary_row or "")
            note.word_count = len(total_text.strip())

    db.commit()
    db.refresh(note)

    # 显式访问content以确保加载
    _ = note.content

    return NoteResponse.model_validate(note)


@router.post("/{note_id}/copy", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def copy_note(
    note_id: str,
    notebook_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """复制笔记

    Args:
        note_id: 要复制的笔记ID
        notebook_id: 目标笔记本ID（可选，默认使用原笔记本）
        current_user: 当前用户
        db: 数据库会话

    Returns:
        NoteResponse: 复制的新笔记

    Raises:
        HTTPException: 笔记不存在或无权访问时抛出错误
    """
    # 获取原笔记
    original_note = db.query(CornellNote).filter(
        CornellNote.id == note_id,
        CornellNote.deleted_at.is_(None)
    ).first()

    if not original_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )

    # 权限检查
    if original_note.owner_id != current_user.id and original_note.access_level.value == "private":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该笔记"
        )

    # 确定目标笔记本
    target_notebook_id = notebook_id or original_note.notebook_id

    # 验证目标笔记本
    target_notebook = db.query(Notebook).filter(
        Notebook.id == target_notebook_id,
        Notebook.owner_id == current_user.id,
        Notebook.deleted_at.is_(None)
    ).first()

    if not target_notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="目标笔记本不存在"
        )

    # 创建新笔记（副本）
    new_note = CornellNote(
        title=f"{original_note.title} - 副本",
        notebook_id=target_notebook_id,
        owner_id=current_user.id,
        access_level=original_note.access_level,
        is_starred=False,  # 副本默认不星标
        last_edited_by=current_user.id,
        word_count=original_note.word_count
    )

    db.add(new_note)
    db.flush()  # 获取新笔记 ID

    # 复制笔记内容
    if original_note.content:
        new_content = NoteContent(
            note_id=new_note.id,
            cue_column=original_note.content.cue_column or "",
            note_column=original_note.content.note_column or "",
            summary_row=original_note.content.summary_row or "",
        )
        db.add(new_content)

    db.commit()
    db.refresh(new_note)

    # 显式访问content以确保加载
    _ = new_note.content

    return NoteResponse.model_validate(new_note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除笔记（软删除）

    Args:
        note_id: 笔记ID
        current_user: 当前用户
        db: 数据库会话

    Raises:
        HTTPException: 笔记不存在或无权删除时抛出错误
    """
    note = db.query(CornellNote).filter(
        CornellNote.id == note_id,
        CornellNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )

    # 权限检查：只有所有者可以删除
    if note.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除该笔记"
        )

    # 软删除
    from datetime import datetime
    note.deleted_at = datetime.utcnow()

    db.commit()

    return None
