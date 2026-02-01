"""笔记本相关的 API 端点"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.api.v1.schemas.notebook import (
    NotebookCreate,
    NotebookUpdate,
    NotebookResponse,
    NotebookListResponse,
)
from app.models.user import User
from app.models.notebook import Notebook
from app.models.cornell_note import CornellNote

router = APIRouter()


@router.get("", response_model=NotebookListResponse)
def list_notebooks(
    page: int = 1,
    page_size: int = 50,
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前用户的笔记本列表"""
    # 基础查询
    query = db.query(Notebook).filter(
        Notebook.owner_id == current_user.id,
        Notebook.deleted_at.is_(None),
    )

    # 是否包含已归档的
    if not include_archived:
        query = query.filter(Notebook.is_archived == False)

    # 按创建时间升序（从早到晚）
    query = query.order_by(Notebook.created_at.asc())

    # 分页
    total = query.count()
    offset = (page - 1) * page_size
    notebooks = query.offset(offset).limit(page_size).all()

    # 统计每个笔记本的笔记数量
    notebook_ids = [nb.id for nb in notebooks]
    note_counts = dict(
        db.query(CornellNote.notebook_id, func.count(CornellNote.id))
        .filter(
            CornellNote.notebook_id.in_(notebook_ids),
            CornellNote.deleted_at.is_(None),
        )
        .group_by(CornellNote.notebook_id)
        .all()
    ) if notebook_ids else {}

    # 构建响应
    items = []
    for nb in notebooks:
        nb_dict = {
            "id": nb.id,
            "title": nb.title,
            "description": nb.description,
            "color": nb.color,
            "icon": nb.icon or "📚",  # 如果为 None，使用默认图标
            "owner_id": nb.owner_id,
            "is_archived": nb.is_archived,
            "is_public": nb.is_public,
            "note_count": note_counts.get(nb.id, 0),
            "created_at": nb.created_at,
            "updated_at": nb.updated_at,
        }
        items.append(NotebookResponse(**nb_dict))

    return NotebookListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
def create_notebook(
    notebook_data: NotebookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新笔记本"""
    new_notebook = Notebook(
        title=notebook_data.title,
        description=notebook_data.description,
        color=notebook_data.color,
        icon=notebook_data.icon,
        owner_id=current_user.id,
    )

    db.add(new_notebook)
    db.commit()
    db.refresh(new_notebook)

    return NotebookResponse(
        id=new_notebook.id,
        title=new_notebook.title,
        description=new_notebook.description,
        color=new_notebook.color,
        icon=new_notebook.icon or "📚",  # 确保有默认值
        owner_id=new_notebook.owner_id,
        is_archived=new_notebook.is_archived,
        is_public=new_notebook.is_public,
        note_count=0,
        created_at=new_notebook.created_at,
        updated_at=new_notebook.updated_at,
    )


@router.get("/{notebook_id}", response_model=NotebookResponse)
def get_notebook(
    notebook_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取笔记本详情"""
    notebook = (
        db.query(Notebook)
        .filter(
            Notebook.id == notebook_id,
            Notebook.owner_id == current_user.id,
            Notebook.deleted_at.is_(None),
        )
        .first()
    )

    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记本不存在",
        )

    # 统计笔记数量
    note_count = (
        db.query(func.count(CornellNote.id))
        .filter(
            CornellNote.notebook_id == notebook_id,
            CornellNote.deleted_at.is_(None),
        )
        .scalar()
    )

    return NotebookResponse(
        id=notebook.id,
        title=notebook.title,
        description=notebook.description,
        color=notebook.color,
        icon=notebook.icon or "📚",  # 确保有默认值
        owner_id=notebook.owner_id,
        is_archived=notebook.is_archived,
        is_public=notebook.is_public,
        note_count=note_count or 0,
        created_at=notebook.created_at,
        updated_at=notebook.updated_at,
    )


@router.put("/{notebook_id}", response_model=NotebookResponse)
def update_notebook(
    notebook_id: str,
    notebook_data: NotebookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新笔记本"""
    notebook = (
        db.query(Notebook)
        .filter(
            Notebook.id == notebook_id,
            Notebook.owner_id == current_user.id,
            Notebook.deleted_at.is_(None),
        )
        .first()
    )

    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记本不存在",
        )

    # 更新字段
    update_data = notebook_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(notebook, field, value)

    db.commit()
    db.refresh(notebook)

    # 统计笔记数量
    note_count = (
        db.query(func.count(CornellNote.id))
        .filter(
            CornellNote.notebook_id == notebook_id,
            CornellNote.deleted_at.is_(None),
        )
        .scalar()
    )

    return NotebookResponse(
        id=notebook.id,
        title=notebook.title,
        description=notebook.description,
        color=notebook.color,
        icon=notebook.icon or "📚",  # 确保有默认值
        owner_id=notebook.owner_id,
        is_archived=notebook.is_archived,
        is_public=notebook.is_public,
        note_count=note_count or 0,
        created_at=notebook.created_at,
        updated_at=notebook.updated_at,
    )


@router.delete("/{notebook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notebook(
    notebook_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除笔记本（软删除）"""
    notebook = (
        db.query(Notebook)
        .filter(
            Notebook.id == notebook_id,
            Notebook.owner_id == current_user.id,
            Notebook.deleted_at.is_(None),
        )
        .first()
    )

    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记本不存在",
        )

    # 检查是否有笔记
    note_count = (
        db.query(func.count(CornellNote.id))
        .filter(
            CornellNote.notebook_id == notebook_id,
            CornellNote.deleted_at.is_(None),
        )
        .scalar()
    )

    if note_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"笔记本中还有 {note_count} 条笔记，请先删除或移动笔记",
        )

    # 软删除
    from datetime import datetime
    notebook.deleted_at = datetime.utcnow()
    db.commit()

    return None
