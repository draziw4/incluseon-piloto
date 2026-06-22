"""create student goals

Revision ID: e7f8a9b0c1d2
Revises: c4d7e9a1b2f3
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, Sequence[str], None] = "c4d7e9a1b2f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    goal_status = sa.Enum(
        "not_started",
        "in_progress",
        "completed",
        "paused",
        name="student_goal_statuses"
    )
    goal_priority = sa.Enum(
        "low",
        "medium",
        "high",
        name="student_goal_priorities"
    )
    op.create_table(
        "student_goals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("area", sa.String(length=100), nullable=False),
        sa.Column("status", goal_status, nullable=False, server_default="not_started"),
        sa.Column("priority", goal_priority, nullable=False, server_default="medium"),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("evidence_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"])
    )
    op.create_index("ix_student_goals_student_id", "student_goals", ["student_id"])
    op.create_index("ix_student_goals_created_by_id", "student_goals", ["created_by_id"])


def downgrade() -> None:
    op.drop_index("ix_student_goals_created_by_id", table_name="student_goals")
    op.drop_index("ix_student_goals_student_id", table_name="student_goals")
    op.drop_table("student_goals")
    sa.Enum(name="student_goal_priorities").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="student_goal_statuses").drop(op.get_bind(), checkfirst=True)
