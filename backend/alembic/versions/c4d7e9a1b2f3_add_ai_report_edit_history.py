"""add AI report edit history

Revision ID: c4d7e9a1b2f3
Revises: 5872988ac27d
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d7e9a1b2f3"
down_revision: Union[str, Sequence[str], None] = "5872988ac27d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ai_reports",
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1")
    )
    op.add_column(
        "ai_reports",
        sa.Column("last_edited_by_id", sa.Integer(), nullable=True)
    )
    op.add_column(
        "ai_reports",
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_foreign_key(
        "fk_ai_reports_last_edited_by_id_users",
        "ai_reports",
        "users",
        ["last_edited_by_id"],
        ["id"]
    )
    op.create_table(
        "ai_report_revisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("report_id", sa.Integer(), nullable=False),
        sa.Column("edited_by_id", sa.Integer(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["report_id"], ["ai_reports.id"]),
        sa.ForeignKeyConstraint(["edited_by_id"], ["users.id"])
    )
    op.create_index(
        "ix_ai_report_revisions_report_id",
        "ai_report_revisions",
        ["report_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_ai_report_revisions_report_id", table_name="ai_report_revisions")
    op.drop_table("ai_report_revisions")
    op.drop_constraint(
        "fk_ai_reports_last_edited_by_id_users",
        "ai_reports",
        type_="foreignkey"
    )
    op.drop_column("ai_reports", "updated_at")
    op.drop_column("ai_reports", "last_edited_by_id")
    op.drop_column("ai_reports", "revision")
