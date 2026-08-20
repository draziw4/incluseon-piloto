"""create persistent in-app notifications

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recipient_user_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("resource_type", sa.String(length=80), nullable=True),
        sa.Column("resource_id", sa.Integer(), nullable=True),
        sa.Column("action_url", sa.String(length=500), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["recipient_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_recipient_user_id"), "notifications", ["recipient_user_id"])
    op.create_index(op.f("ix_notifications_event_type"), "notifications", ["event_type"])
    op.create_index(op.f("ix_notifications_student_id"), "notifications", ["student_id"])
    op.create_index(op.f("ix_notifications_read_at"), "notifications", ["read_at"])
    op.create_index(op.f("ix_notifications_created_at"), "notifications", ["created_at"])
    op.create_index(
        "ix_notifications_recipient_unread_created",
        "notifications",
        ["recipient_user_id", "read_at", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_recipient_unread_created", table_name="notifications")
    op.drop_index(op.f("ix_notifications_created_at"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_read_at"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_student_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_event_type"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_recipient_user_id"), table_name="notifications")
    op.drop_table("notifications")
