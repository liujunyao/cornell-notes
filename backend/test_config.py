"""测试配置加载"""
from app.core.config import settings

print("=" * 60)
print("配置加载测试")
print("=" * 60)

print(f"\n应用配置:")
print(f"  APP_NAME: {settings.app_name}")
print(f"  APP_VERSION: {settings.app_version}")

print(f"\n数据库配置:")
print(f"  DATABASE_URL: {settings.database_url}")

print(f"\nJWT 配置:")
print(f"  SECRET_KEY: {settings.secret_key[:20]}...")
print(f"  ALGORITHM: {settings.algorithm}")
print(f"  ACCESS_TOKEN_EXPIRE_MINUTES: {settings.access_token_expire_minutes}")

print(f"\nAI 配置:")
print(f"  EXPLORE_API_KEY: {settings.explore_api_key[:20] + '...' if settings.explore_api_key else 'None'}")
print(f"  EXPLORE_BASE_URL: {settings.explore_base_url}")
print(f"  EXPLORE_MODEL_NAME: {settings.explore_model_name}")

print("\n" + "=" * 60)

# 检查 AI 配置是否完整
if settings.explore_api_key and settings.explore_base_url and settings.explore_model_name:
    print("✓ AI 服务配置完整")
else:
    print("✗ AI 服务配置不完整")
    if not settings.explore_api_key:
        print("  缺少: EXPLORE_API_KEY")
    if not settings.explore_base_url:
        print("  缺少: EXPLORE_BASE_URL")
    if not settings.explore_model_name:
        print("  缺少: EXPLORE_MODEL_NAME")

print("=" * 60)
