"""添加思维导图数据字段

Revision ID: add_mindmap_data
Revises: add_explore_conversations
Create Date: 2026-02-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_mindmap_data'
down_revision = 'add_explore_conversations'
depends_on = None


def upgrade() -> None:
    # 添加 mindmap_data 字段到 note_contents 表
    op.add_column('note_contents', sa.Column('mindmap_data', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # 删除 mindmap_data 字段
    op.drop_column('note_contents', 'mindmap_data')
