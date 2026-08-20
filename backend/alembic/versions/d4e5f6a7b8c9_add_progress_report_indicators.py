"""add structured progress report indicators

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


INDICATOR_COLUMNS = (
    "participation_level",
    "autonomy_level",
    "communication_level",
    "regulation_level",
    "support_level",
)


def upgrade() -> None:
    for column_name in INDICATOR_COLUMNS:
        op.add_column(
            "student_progress_reports",
            sa.Column(column_name, sa.Integer(), nullable=True),
        )

    op.create_check_constraint(
        "ck_student_progress_reports_indicator_ranges",
        "student_progress_reports",
        " AND ".join(
            f"({column_name} IS NULL OR {column_name} BETWEEN 1 AND 5)"
            for column_name in INDICATOR_COLUMNS
        ),
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_student_progress_reports_indicator_ranges",
        "student_progress_reports",
        type_="check",
    )
    for column_name in reversed(INDICATOR_COLUMNS):
        op.drop_column("student_progress_reports", column_name)
