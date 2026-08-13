"""add behavior record author

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4a5b6c7d8e9"
down_revision: Union[str, Sequence[str], None] = "e3f4a5b6c7d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "behavior_records",
        sa.Column("created_by_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        op.f("ix_behavior_records_created_by_id"),
        "behavior_records",
        ["created_by_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_behavior_records_created_by_id_users",
        "behavior_records",
        "users",
        ["created_by_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_behavior_records_created_by_id_users",
        "behavior_records",
        type_="foreignkey",
    )
    op.drop_index(
        op.f("ix_behavior_records_created_by_id"),
        table_name="behavior_records",
    )
    op.drop_column("behavior_records", "created_by_id")
