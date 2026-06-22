"""add AI report task id

Revision ID: a9b0c1d2e3f4
Revises: f8a9b0c1d2e3
"""

from alembic import op
import sqlalchemy as sa


revision = "a9b0c1d2e3f4"
down_revision = "f8a9b0c1d2e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ai_reports", sa.Column("task_id", sa.String(length=255), nullable=True))
    op.create_index("ix_ai_reports_task_id", "ai_reports", ["task_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_ai_reports_task_id", table_name="ai_reports")
    op.drop_column("ai_reports", "task_id")
