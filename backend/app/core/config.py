"""应用配置"""
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
    
    class Config:
        env_file = ".env"


settings = Settings()
