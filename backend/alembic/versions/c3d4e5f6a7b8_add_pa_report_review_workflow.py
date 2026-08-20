"""add PA report review workflow

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "student_progress_reports",
        sa.Column("professional_type", sa.String(length=20), server_default="aee", nullable=False),
    )
    op.add_column(
        "student_progress_reports",
        sa.Column("review_status", sa.String(length=30), nullable=True),
    )
    op.add_column(
        "student_progress_reports",
        sa.Column("review_notes", sa.Text(), nullable=True),
    )
    op.add_column(
        "student_progress_reports",
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "student_progress_reports",
        sa.Column("reviewed_by_name", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "student_progress_reports",
        sa.Column("reviewed_by_role", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "student_progress_reports",
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
    )
    op.create_foreign_key(
        "student_progress_reports_reviewed_by_id_fkey",
        "student_progress_reports",
        "users",
        ["reviewed_by_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(
        "ck_student_progress_reports_professional_type",
        "student_progress_reports",
        "professional_type IN ('aee', 'support')",
    )
    op.create_check_constraint(
        "ck_student_progress_reports_review_status",
        "student_progress_reports",
        "review_status IS NULL OR review_status IN ('pending', 'reviewed', 'needs_adjustment')",
    )
    op.create_check_constraint(
        "ck_student_progress_reports_support_daily",
        "student_progress_reports",
        "professional_type = 'aee' OR report_type = 'daily'",
    )
    op.create_index(
        op.f("ix_student_progress_reports_professional_type"),
        "student_progress_reports",
        ["professional_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_progress_reports_review_status"),
        "student_progress_reports",
        ["review_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_progress_reports_reviewed_by_id"),
        "student_progress_reports",
        ["reviewed_by_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_student_progress_reports_reviewed_by_id"), table_name="student_progress_reports")
    op.drop_index(op.f("ix_student_progress_reports_review_status"), table_name="student_progress_reports")
    op.drop_index(op.f("ix_student_progress_reports_professional_type"), table_name="student_progress_reports")
    op.drop_constraint("ck_student_progress_reports_support_daily", "student_progress_reports", type_="check")
    op.drop_constraint("ck_student_progress_reports_review_status", "student_progress_reports", type_="check")
    op.drop_constraint("ck_student_progress_reports_professional_type", "student_progress_reports", type_="check")
    op.drop_constraint("student_progress_reports_reviewed_by_id_fkey", "student_progress_reports", type_="foreignkey")
    op.drop_column("student_progress_reports", "reviewed_at")
    op.drop_column("student_progress_reports", "reviewed_by_role")
    op.drop_column("student_progress_reports", "reviewed_by_name")
    op.drop_column("student_progress_reports", "reviewed_by_id")
    op.drop_column("student_progress_reports", "review_notes")
    op.drop_column("student_progress_reports", "review_status")
    op.drop_column("student_progress_reports", "professional_type")
