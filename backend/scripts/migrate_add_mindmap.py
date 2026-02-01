"""
数据库迁移脚本 - 添加思维导图字段
执行: python scripts/migrate_add_mindmap.py
"""
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def main():
    print("[*] Starting database migration...")
    print(f"[*] Database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url}")

    try:
        engine = create_engine(settings.database_url)

        with engine.connect() as conn:
            # 检查字段是否已存在
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='note_contents' AND column_name='mindmap_data'
            """))

            if result.fetchone():
                print("[!] Column mindmap_data already exists, skipping migration")
                return

            # 添加字段
            print("[+] Adding column: note_contents.mindmap_data (JSON)")
            conn.execute(text("ALTER TABLE note_contents ADD COLUMN mindmap_data JSON"))
            conn.commit()

            print("[OK] Migration completed successfully!")

    except Exception as e:
        print(f"[ERROR] Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
