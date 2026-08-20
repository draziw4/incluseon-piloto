"""preserve history on professional delete

Revision ID: a1b2c3d4e5f6
Revises: f4a5b6c7d8e9
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f4a5b6c7d8e9"
branch_labels = None
depends_on = None


FOREIGN_KEYS = (
    ("student_goals", "student_goals_created_by_id_fkey", "created_by_id"),
    ("assessments", "assessments_psychologist_id_fkey", "psychologist_id"),
    ("ai_reports", "ai_reports_created_by_id_fkey", "created_by_id"),
    ("ai_reports", "fk_ai_reports_last_edited_by_id_users", "last_edited_by_id"),
    ("ai_report_revisions", "ai_report_revisions_edited_by_id_fkey", "edited_by_id"),
    ("appointments", "appointments_professional_id_fkey", "professional_id"),
    ("pilot_feedback", "pilot_feedback_created_by_id_fkey", "created_by_id"),
)

REQUIRED_COLUMNS = (
    ("student_goals", "created_by_id"),
    ("assessments", "psychologist_id"),
    ("ai_reports", "created_by_id"),
    ("ai_report_revisions", "edited_by_id"),
    ("appointments", "professional_id"),
    ("pilot_feedback", "created_by_id"),
)


def upgrade() -> None:
    op.add_column(
        "behavior_records",
        sa.Column("created_by_name", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "behavior_records",
        sa.Column("created_by_role", sa.String(length=50), nullable=True),
    )
    op.execute(
        """
        UPDATE behavior_records AS record
        SET created_by_name = users.name,
            created_by_role = users.role::text
        FROM users
        WHERE users.id = record.created_by_id
        """
    )

    for table_name, column_name in REQUIRED_COLUMNS:
        op.alter_column(table_name, column_name, nullable=True)

    for table_name, constraint_name, column_name in FOREIGN_KEYS:
        op.drop_constraint(constraint_name, table_name, type_="foreignkey")
        op.create_foreign_key(
            constraint_name,
            table_name,
            "users",
            [column_name],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    for table_name, constraint_name, column_name in reversed(FOREIGN_KEYS):
        op.drop_constraint(constraint_name, table_name, type_="foreignkey")
        op.create_foreign_key(
            constraint_name,
            table_name,
            "users",
            [column_name],
            ["id"],
        )

    for table_name, column_name in reversed(REQUIRED_COLUMNS):
        op.alter_column(table_name, column_name, nullable=False)

    op.drop_column("behavior_records", "created_by_role")
    op.drop_column("behavior_records", "created_by_name")
