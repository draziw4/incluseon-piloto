"""extend student registration with support and medication fields

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("students", sa.Column("difficulties", sa.Text(), nullable=True))
    op.add_column(
        "students",
        sa.Column(
            "takes_medication",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column("students", sa.Column("medications", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("students", "medications")
    op.drop_column("students", "takes_medication")
    op.drop_column("students", "difficulties")
