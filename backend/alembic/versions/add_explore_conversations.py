"""添加深度探索对话表

Revision ID: add_explore_conversations
Revises:
Create Date: 2026-01-31

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_explore_conversations'
down_revision = None
depends_on = None


def upgrade() -> None:
    # 创建深度探索对话会话表
    op.create_table(
        'explore_conversations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('note_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('qa_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['note_id'], ['cornell_notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_explore_conversations_id'), 'explore_conversations', ['id'], unique=False)
    op.create_index(op.f('ix_explore_conversations_note_id'), 'explore_conversations', ['note_id'], unique=False)
    op.create_index(op.f('ix_explore_conversations_user_id'), 'explore_conversations', ['user_id'], unique=False)

    # 创建深度探索问答对表
    op.create_table(
        'explore_qa_pairs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('conversation_id', sa.String(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('question_time', sa.DateTime(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('answer_time', sa.DateTime(), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['explore_conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_explore_qa_pairs_id'), 'explore_qa_pairs', ['id'], unique=False)
    op.create_index(op.f('ix_explore_qa_pairs_conversation_id'), 'explore_qa_pairs', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_explore_qa_pairs_sequence'), 'explore_qa_pairs', ['sequence'], unique=False)


def downgrade() -> None:
    # 删除问答对表
    op.drop_index(op.f('ix_explore_qa_pairs_sequence'), table_name='explore_qa_pairs')
    op.drop_index(op.f('ix_explore_qa_pairs_conversation_id'), table_name='explore_qa_pairs')
    op.drop_index(op.f('ix_explore_qa_pairs_id'), table_name='explore_qa_pairs')
    op.drop_table('explore_qa_pairs')

    # 删除对话会话表
    op.drop_index(op.f('ix_explore_conversations_user_id'), table_name='explore_conversations')
    op.drop_index(op.f('ix_explore_conversations_note_id'), table_name='explore_conversations')
    op.drop_index(op.f('ix_explore_conversations_id'), table_name='explore_conversations')
    op.drop_table('explore_conversations')
