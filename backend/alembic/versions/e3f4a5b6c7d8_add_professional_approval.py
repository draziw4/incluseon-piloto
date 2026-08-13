"""add professional approval

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, Sequence[str], None] = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    account_statuses = postgresql.ENUM(
        "pending", "active", "rejected", "suspended", name="account_statuses"
    )
    account_statuses.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column(
            "account_status",
            account_statuses,
            nullable=False,
            server_default="active",
        ),
    )
    user_roles = postgresql.ENUM(
        "admin",
        "psychologist",
        "supervisor",
        "aee",
        "support_professional",
        "school",
        "guardian",
        name="user_roles",
        create_type=False,
    )
    op.add_column("users", sa.Column("requested_role", user_roles, nullable=True))
    op.add_column("users", sa.Column("credential_reference", sa.String(120), nullable=True))
    op.add_column("users", sa.Column("review_note", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("reviewed_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "reviewed_at")
    op.drop_column("users", "review_note")
    op.drop_column("users", "credential_reference")
    op.drop_column("users", "requested_role")
    op.drop_column("users", "account_status")
    postgresql.ENUM(name="account_statuses").drop(op.get_bind(), checkfirst=True)
