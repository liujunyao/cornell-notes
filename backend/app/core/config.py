"""应用配置"""
from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置类"""

    # 应用基本信息
    app_name: str = "康奈尔笔记 API"
    app_version: str = "0.1.0"

    # 数据库配置
    database_url: str = "sqlite:///./cornell_notes.db"

    # JWT 配置
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # AI 配置
    # 深度探索的api_key
    explore_api_key: Optional[str] = None
    explore_base_url: Optional[str] = None
    explore_model_name: Optional[str] = None

    # 邀请码配置
    invite_code: str = "cornell2024"  # 默认邀请码，建议通过环境变量设置

    class Config:
        # 获取项目根目录（backend目录）
        env_file = Path(__file__).parent.parent.parent / ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = False  # 不区分大小写


settings = Settings()
