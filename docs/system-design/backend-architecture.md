# 康奈尔笔记应用 - 后端架构设计

本文档定义后端应用的整体架构、分层设计、业务逻辑实现和开发规范。

## 一、后端技术栈

### 1.1 核心框架

```
FastAPI 0.100+
  ├─ 异步优先 (async/await)
  ├─ 自动 API 文档 (OpenAPI)
  ├─ 高性能 (Uvicorn)
  └─ 类型安全 (Pydantic)

Python 3.10+
  ├─ 类型注解 (Type Hints)
  ├─ 结构模式匹配 (Pattern Matching)
  └─ 性能改进

SQLAlchemy 2.0+
  ├─ ORM 对象关系映射
  ├─ 异步驱动支持
  └─ 数据库独立抽象

Pydantic V2
  ├─ 数据验证
  ├─ JSON Schema 生成
  └─ 自定义验证器
```

### 1.2 数据库与缓存

```
数据存储：
  PostgreSQL 14+
  ├─ ACID 事务
  ├─ JSON 数据类型
  ├─ 全文搜索支持
  └─ 扩展性强

缓存层：
  Redis 7.0+
  ├─ 会话存储
  ├─ 查询缓存
  ├─ 实时消息队列
  └─ 分布式锁

搜索引擎：
  Elasticsearch 8.0+ (可选)
  ├─ 全文搜索
  ├─ 分面聚合
  └─ 实时分析
```

### 1.3 认证与安全

```
JWT (JSON Web Tokens)
  ├─ python-jose 库
  ├─ HS256 算法
  └─ Access + Refresh Token

密码加密：
  Passlib + bcrypt
  ├─ Argon2 (推荐)
  └─ PBKDF2 (备选)

CORS 保护
  ├─ 跨源资源共享
  └─ 白名单管理
```

### 1.4 实时通信

```
WebSocket
  ├─ python-socketio
  ├─ 双向通信
  └─ 事件驱动

消息队列（可选）：
  Celery + Redis
  ├─ 异步任务处理
  ├─ 定时任务
  └─ 分布式处理
```

---

## 二、项目结构

### 2.1 分层架构

```
backend/
├── app/
│   ├── main.py                     # 应用入口
│   ├── core/
│   │   ├── config.py              # 配置管理
│   │   ├── security.py            # 认证与安全
│   │   └── dependencies.py        # 依赖注入
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py          # 路由聚合
│   │       ├── endpoints/         # 端点实现
│   │       │   ├── auth.py
│   │       │   ├── notes.py
│   │       │   ├── reviews.py
│   │       │   ├── highlights.py
│   │       │   ├── collaboration.py
│   │       │   └── ...
│   │       └── schemas/           # 请求/响应模式
│   │           ├── auth.py
│   │           ├── notes.py
│   │           ├── reviews.py
│   │           └── ...
│   │
│   ├── models/                    # SQLAlchemy 模型
│   │   ├── __init__.py
│   │   ├── user.py               # 用户模型
│   │   ├── notebook.py           # 笔记本模型
│   │   ├── note.py               # 笔记模型
│   │   ├── highlight.py          # 高亮模型
│   │   ├── review.py             # 复习模型
│   │   └── ...
│   │
│   ├── services/                 # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── user_service.py       # 用户服务
│   │   ├── note_service.py       # 笔记服务
│   │   ├── review_service.py     # 复习服务
│   │   ├── highlight_service.py  # 高亮服务
│   │   ├── ai_service.py         # AI 服务
│   │   └── ...
│   │
│   ├── crud/                     # 数据访问层
│   │   ├── __init__.py
│   │   ├── base.py              # 基础 CRUD
│   │   ├── user.py
│   │   ├── note.py
│   │   └── ...
│   │
│   ├── utils/                   # 工具函数
│   │   ├── __init__.py
│   │   ├── ai.py               # AI 相关
│   │   ├── storage.py          # 文件存储
│   │   ├── email.py            # 邮件发送
│   │   ├── time.py             # 时间处理
│   │   └── ...
│   │
│   ├── schemas/                # Pydantic 模式（共享）
│   │   └── ...
│   │
│   └── exceptions.py           # 自定义异常
│
├── migrations/                 # Alembic 数据库迁移
│   ├── alembic.ini
│   └── versions/
│
├── tests/                      # 测试文件
│   ├── conftest.py            # pytest 配置
│   ├── test_api/
│   ├── test_services/
│   └── test_crud/
│
├── scripts/                    # 辅助脚本
│   ├── init_db.py            # 初始化数据库
│   ├── create_user.py        # 创建测试用户
│   └── seed_data.py          # 生成测试数据
│
├── requirements.txt           # 依赖列表
├── pyproject.toml            # 项目配置
├── Dockerfile                # 容器配置
├── docker-compose.yml        # 本地开发配置
└── .env.example             # 环境变量模板
```

### 2.2 CRUD 基类

```python
# app/crud/base.py

from typing import Generic, TypeVar, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    async def create(
        self, db: AsyncSession, *, obj_in: CreateSchemaType
    ) -> ModelType:
        db_obj = self.model(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get(
        self, db: AsyncSession, id: int | str
    ) -> Optional[ModelType]:
        return await db.get(self.model, id)

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        query = select(self.model).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | dict
    ) -> ModelType:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(
        self, db: AsyncSession, *, id: int | str
    ) -> ModelType:
        obj = await db.get(self.model, id)
        await db.delete(obj)
        await db.commit()
        return obj
```

---

## 三、认证与授权

### 3.1 JWT 实现

```python
# app/core/security.py

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
security = HTTPBearer()

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=30)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm="HS256"
    )
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm="HS256"
    )

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
) -> dict:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    return {"user_id": user_id, "payload": payload}
```

### 3.2 依赖注入

```python
# app/core/dependencies.py

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import async_session_maker
from app.core.security import get_current_user
from app.crud.user import crud_user

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user = await crud_user.get(db, id=current_user["user_id"])
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user
```

---

## 四、业务逻辑层

### 4.1 服务层设计

```python
# app/services/note_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.note import crud_note
from app.crud.highlight import crud_highlight
from app.schemas.note import NoteCreate, NoteUpdate
from app.models.note import CornellNote
from app.utils.ai import generate_questions, auto_highlight

class NoteService:
    """笔记服务 - 处理笔记相关业务逻辑"""

    @staticmethod
    async def create_note(
        db: AsyncSession,
        user_id: str,
        notebook_id: str,
        title: str
    ) -> CornellNote:
        """创建新笔记并生成复习计划"""
        note_data = NoteCreate(
            notebook_id=notebook_id,
            owner_id=user_id,
            title=title
        )
        note = await crud_note.create(db, obj_in=note_data)

        # 自动创建复习计划
        await NoteService.generate_review_schedule(db, note.id)

        return note

    @staticmethod
    async def update_note_content(
        db: AsyncSession,
        note_id: str,
        cue_column: str = None,
        note_column: str = None,
        summary_row: str = None
    ) -> CornellNote:
        """更新笔记内容"""
        note = await crud_note.get(db, note_id)
        if not note:
            raise ValueError(f"Note {note_id} not found")

        update_data = NoteUpdate(
            cue_column=cue_column,
            note_column=note_column,
            summary_row=summary_row
        )
        return await crud_note.update(db, db_obj=note, obj_in=update_data)

    @staticmethod
    async def ai_auto_highlight(
        db: AsyncSession,
        note_id: str
    ) -> list[dict]:
        """AI 自动高亮"""
        note = await crud_note.get(db, note_id)
        if not note:
            raise ValueError(f"Note {note_id} not found")

        # 调用 AI 服务生成高亮
        highlights = await auto_highlight(note.content.note_column)

        # 保存高亮
        saved_highlights = []
        for hl in highlights:
            saved = await crud_highlight.create(
                db,
                obj_in={
                    "note_id": note_id,
                    "content": hl["content"],
                    "highlight_type": hl["type"],
                    "is_ai_generated": True,
                    "ai_confidence": hl["confidence"]
                }
            )
            saved_highlights.append(saved)

        return saved_highlights

    @staticmethod
    async def generate_review_schedule(
        db: AsyncSession,
        note_id: str
    ) -> list:
        """基于艾宾浩斯曲线生成复习计划"""
        from app.crud.review import crud_review_schedule
        from datetime import datetime, timedelta
        from app.models.review import ReviewSchedule

        schedules = []
        intervals = [0, 1, 7, 15, 30]  # 天数

        for interval in intervals:
            scheduled_date = (
                datetime.utcnow().date() + timedelta(days=interval)
            )
            schedule_data = {
                "note_id": note_id,
                "scheduled_date": scheduled_date,
                "review_level": intervals.index(interval) + 1
            }
            schedule = await crud_review_schedule.create(
                db, obj_in=schedule_data
            )
            schedules.append(schedule)

        return schedules
```

### 4.2 API 端点实现

```python
# app/api/v1/endpoints/notes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import (
    get_db, get_current_active_user
)
from app.services.note_service import NoteService
from app.schemas.note import (
    NoteResponse, NoteCreate, NoteUpdate
)
from app.models.user import User

router = APIRouter(
    prefix="/notes",
    tags=["notes"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_in: NoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """创建新笔记"""
    note = await NoteService.create_note(
        db,
        user_id=current_user.id,
        notebook_id=note_in.notebook_id,
        title=note_in.title
    )
    return note

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取笔记详情"""
    from app.crud.note import crud_note

    note = await crud_note.get(db, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # 权限检查
    if note.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this note"
        )

    return note

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_in: NoteUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新笔记内容"""
    from app.crud.note import crud_note

    note = await crud_note.get(db, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    if note.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    updated_note = await NoteService.update_note_content(
        db,
        note_id,
        **note_in.dict(exclude_unset=True)
    )
    return updated_note

@router.post("/{note_id}/ai/highlight")
async def ai_highlight(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """AI 自动高亮"""
    highlights = await NoteService.ai_auto_highlight(db, note_id)
    return {
        "code": 200,
        "data": {"highlights": highlights}
    }
```

---

## 五、数据库管理

### 5.1 模型定义示例

```python
# app/models/note.py

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db import Base

class CornellNote(Base):
    __tablename__ = "cornell_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notebook_id = Column(
        UUID(as_uuid=True), ForeignKey("notebooks.id"), nullable=False
    )
    owner_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title = Column(String(300), nullable=False)
    is_archived = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    access_level = Column(String(20), default="private")
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_edited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    deleted_at = Column(DateTime, nullable=True)

    # 关系
    notebook = relationship("Notebook", back_populates="notes")
    owner = relationship("User", foreign_keys=[owner_id])
    editor = relationship("User", foreign_keys=[last_edited_by])
    content = relationship("NoteContent", back_populates="note", uselist=False)
    highlights = relationship("Highlight", back_populates="note")
```

### 5.2 数据库迁移

```bash
# 创建新迁移
alembic revision --autogenerate -m "Add cornell_notes table"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1

# 查看迁移历史
alembic history
```

---

## 六、异步处理

### 6.1 异步任务（可选 - Celery）

```python
# app/tasks/email.py

from celery import shared_task

@shared_task
def send_review_reminder(user_id: str, note_title: str):
    """发送复习提醒邮件 - 异步任务"""
    # 构建邮件内容
    # 发送邮件
    # 记录日志
    pass

# 使用
from app.tasks.email import send_review_reminder

# 立即执行
send_review_reminder.delay(user_id, note_title)

# 延迟执行（5分钟后）
send_review_reminder.apply_async(
    args=[user_id, note_title],
    countdown=300
)
```

### 6.2 WebSocket 实时同步

```python
# app/api/v1/endpoints/ws.py

from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from app.core.security import get_current_user
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, note_id: str, websocket: WebSocket):
        await websocket.accept()
        if note_id not in self.active_connections:
            self.active_connections[note_id] = []
        self.active_connections[note_id].append(websocket)

    def disconnect(self, note_id: str, websocket: WebSocket):
        self.active_connections[note_id].remove(websocket)

    async def broadcast(self, note_id: str, message: dict):
        for connection in self.active_connections.get(note_id, []):
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/notes/{note_id}/ws")
async def websocket_endpoint(note_id: str, websocket: WebSocket):
    await manager.connect(note_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # 广播编辑事件给其他连接
            await manager.broadcast(note_id, {
                "type": "edit",
                "data": data
            })
    except WebSocketDisconnect:
        manager.disconnect(note_id, websocket)
```

---

## 七、错误处理

### 7.1 自定义异常

```python
# app/exceptions.py

class AppException(Exception):
    """基础异常"""
    def __init__(self, code: int, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class NotFoundError(AppException):
    def __init__(self, resource: str):
        super().__init__(
            code=404,
            message=f"{resource} not found",
            status_code=404
        )

class PermissionError(AppException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            code=403,
            message=message,
            status_code=403
        )

class ValidationError(AppException):
    def __init__(self, message: str):
        super().__init__(
            code=422,
            message=message,
            status_code=422
        )
```

### 7.2 异常处理中间件

```python
# app/main.py

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from app.exceptions import AppException

app = FastAPI()

@app.exception_handler(AppException)
async def app_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
            "request_id": request.headers.get("x-request-id")
        }
    )
```

---

## 八、性能优化

### 8.1 数据库优化

```python
# 使用 eager loading 避免 N+1 查询
from sqlalchemy.orm import selectinload

query = select(CornellNote).options(
    selectinload(CornellNote.owner),
    selectinload(CornellNote.highlights)
)

# 批量操作
await session.execute(
    insert(Highlight).values([
        {"note_id": note_id, "content": "text1"},
        {"note_id": note_id, "content": "text2"},
    ])
)
```

### 8.2 缓存策略

```python
# 使用 Redis 缓存热门笔记
from app.utils.cache import get_cache, set_cache

async def get_popular_notes(db, limit=10):
    cache_key = f"popular_notes:{limit}"
    cached = await get_cache(cache_key)
    if cached:
        return cached

    notes = await crud_note.get_popular(db, limit)
    await set_cache(cache_key, notes, expire=3600)  # 1小时过期
    return notes
```

---

## 九、日志与监控

### 9.1 日志配置

```python
# app/core/logging.py

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# 使用
logger.info(f"Note {note_id} created by user {user_id}")
logger.error(f"Failed to process review: {exc}")
```

### 9.2 监控指标

```
关键指标：
  - 请求响应时间
  - 数据库查询时间
  - API 端点调用量
  - 错误率
  - 活跃用户数
```

---

## 十、开发工作流

### 10.1 本地开发

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 运行数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 运行测试
pytest

# 代码检查
black app/ tests/
ruff check app/ tests/
mypy app/
```

### 10.2 调试技巧

```python
# 使用 pdb 调试
import pdb; pdb.set_trace()

# 快速打印
from pprint import pprint
pprint({"user": user, "note": note})

# API 文档
# Swagger: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

---

本文档与数据模型和 API 设计文档配套，后端开发应严格按照此架构进行实现。

**最后更新**: 2024-01-29
**版本**: 1.0
**维护者**: 后端团队
