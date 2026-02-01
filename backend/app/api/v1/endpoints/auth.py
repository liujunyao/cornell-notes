"""认证相关 API 端点"""
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.api.v1.schemas import (
    UserRegister,
    UserLogin,
    LoginResponse,
    UserResponse,
    ChangePassword,
    UpdateProfile,
)
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models import User, Notebook

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册

    Args:
        user_data: 注册数据
        db: 数据库会话

    Returns:
        UserResponse: 创建的用户信息

    Raises:
        HTTPException: 用户名或邮箱已存在时抛出 409 错误
        HTTPException: 邀请码错误时抛出 403 错误
    """
    # 验证邀请码
    if user_data.invite_code != settings.invite_code:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="邀请码错误，暂不允许注册"
        )

    # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用户名已存在"
        )

    # 检查邮箱是否已存在
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="邮箱已被注册"
        )

    # 创建新用户
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        user_type=user_data.user_type,
    )

    db.add(new_user)
    db.flush()  # 获取用户 ID

    # 为新用户创建默认笔记本
    default_notebook = Notebook(
        title="默认笔记本",
        description="系统自动创建的默认笔记本",
        color="#3A6EA5",
        owner_id=new_user.id
    )

    db.add(default_notebook)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=LoginResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录

    Args:
        login_data: 登录数据
        db: 数据库会话

    Returns:
        LoginResponse: 登录令牌和用户信息

    Raises:
        HTTPException: 认证失败时抛出 401 错误
    """
    # 查找用户
    user = db.query(User).filter(User.username == login_data.username).first()

    # 验证用户名和密码
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查用户是否被禁用
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
        )

    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    db.commit()

    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "user_type": user.user_type.value},
        expires_delta=access_token_expires
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """获取当前登录用户信息

    Args:
        current_user: 当前登录用户（从JWT令牌中解析）

    Returns:
        UserResponse: 用户信息

    Raises:
        HTTPException: 未登录时抛出 401 错误
    """
    return current_user


@router.put("/change-password", response_model=dict)
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """修改密码

    Args:
        password_data: 密码修改数据
        current_user: 当前登录用户
        db: 数据库会话

    Returns:
        dict: 成功消息

    Raises:
        HTTPException: 当前密码错误时抛出 400 错误
    """
    # 验证当前密码
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码错误"
        )

    # 更新密码
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "密码修改成功"}


@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    profile_data: UpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新用户信息

    Args:
        profile_data: 用户信息数据
        current_user: 当前登录用户
        db: 数据库会话

    Returns:
        UserResponse: 更新后的用户信息

    Raises:
        HTTPException: 邮箱已被使用时抛出 409 错误
    """
    # 如果修改邮箱，检查是否已被其他用户使用
    if profile_data.email and profile_data.email != current_user.email:
        existing_user = db.query(User).filter(
            User.email == profile_data.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="该邮箱已被其他用户使用"
            )
        current_user.email = profile_data.email

    # 更新其他字段
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.location is not None:
        current_user.location = profile_data.location

    db.commit()
    db.refresh(current_user)

    return current_user
