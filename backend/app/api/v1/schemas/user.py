"""用户相关的 Pydantic 模型"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

from app.models.user import UserType


# 用户注册
class UserRegister(BaseModel):
    """用户注册请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=6, max_length=72, description="密码 (6-72字符)")
    full_name: Optional[str] = Field(None, max_length=100, description="全名")
    user_type: UserType = Field(UserType.STUDENT, description="用户类型")
    invite_code: str = Field(..., min_length=1, description="邀请码")


# 用户登录
class UserLogin(BaseModel):
    """用户登录请求"""
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


# 令牌响应
class Token(BaseModel):
    """令牌响应"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间(秒)")


# 用户响应
class UserResponse(BaseModel):
    """用户响应"""
    id: str
    username: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    user_type: UserType
    verified: bool
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    model_config = {
        "from_attributes": True
    }


# 登录响应
class LoginResponse(BaseModel):
    """登录响应"""
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


# 修改密码
class ChangePassword(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., description="当前密码")
    new_password: str = Field(..., min_length=6, max_length=72, description="新密码 (6-72字符)")


# 更新用户信息
class UpdateProfile(BaseModel):
    """更新用户信息请求"""
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, max_length=20, description="手机号")
    full_name: Optional[str] = Field(None, max_length=100, description="真实姓名")
    bio: Optional[str] = Field(None, max_length=500, description="个人简介")
    location: Optional[str] = Field(None, max_length=100, description="所在地")
