"""add user auth provider

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "auth_provider",
            sa.String(length=30),
            nullable=False,
            server_default="password",
        ),
    )
    op.add_column(
        "users",
        sa.Column("google_subject", sa.String(length=255), nullable=True),
    )
    op.create_index(
        "ix_users_google_subject",
        "users",
        ["google_subject"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_google_subject", table_name="users")
    op.drop_column("users", "google_subject")
    op.drop_column("users", "auth_provider")
