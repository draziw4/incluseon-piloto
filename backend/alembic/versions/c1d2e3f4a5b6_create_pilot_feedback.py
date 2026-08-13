"""create pilot feedback

Revision ID: c1d2e3f4a5b6
Revises: b0c1d2e3f4a5
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b0c1d2e3f4a5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pilot_feedback",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("page_path", sa.String(length=500), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("expected_result", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="received"),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )
    op.create_index("ix_pilot_feedback_created_by_id", "pilot_feedback", ["created_by_id"])
    op.create_index("ix_pilot_feedback_category", "pilot_feedback", ["category"])
    op.create_index("ix_pilot_feedback_status", "pilot_feedback", ["status"])


def downgrade() -> None:
    op.drop_index("ix_pilot_feedback_status", table_name="pilot_feedback")
    op.drop_index("ix_pilot_feedback_category", table_name="pilot_feedback")
    op.drop_index("ix_pilot_feedback_created_by_id", table_name="pilot_feedback")
    op.drop_table("pilot_feedback")
