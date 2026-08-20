"""create student progress reports

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "student_progress_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("report_type", sa.String(length=20), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("activities", sa.Text(), nullable=True),
        sa.Column("participation_engagement", sa.Text(), nullable=True),
        sa.Column("progress", sa.Text(), nullable=True),
        sa.Column("difficulties", sa.Text(), nullable=True),
        sa.Column("strategies_and_resources", sa.Text(), nullable=True),
        sa.Column("communication_socialization", sa.Text(), nullable=True),
        sa.Column("autonomy_functionality", sa.Text(), nullable=True),
        sa.Column("family_school_notes", sa.Text(), nullable=True),
        sa.Column("next_steps", sa.Text(), nullable=True),
        sa.Column("created_by_name", sa.String(length=255), nullable=True),
        sa.Column("created_by_role", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "report_type IN ('daily', 'weekly')",
            name="ck_student_progress_reports_type",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name="student_progress_reports_created_by_id_fkey",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["students.id"],
            name="student_progress_reports_student_id_fkey",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_student_progress_reports_created_by_id"),
        "student_progress_reports",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_progress_reports_period_start"),
        "student_progress_reports",
        ["period_start"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_progress_reports_report_type"),
        "student_progress_reports",
        ["report_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_progress_reports_student_id"),
        "student_progress_reports",
        ["student_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_student_progress_reports_student_id"), table_name="student_progress_reports")
    op.drop_index(op.f("ix_student_progress_reports_report_type"), table_name="student_progress_reports")
    op.drop_index(op.f("ix_student_progress_reports_period_start"), table_name="student_progress_reports")
    op.drop_index(op.f("ix_student_progress_reports_created_by_id"), table_name="student_progress_reports")
    op.drop_table("student_progress_reports")
