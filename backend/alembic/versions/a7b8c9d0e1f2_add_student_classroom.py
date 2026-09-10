"""add student school grade and class group

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("students", sa.Column("school_grade", sa.String(length=100), nullable=True))
    op.add_column("students", sa.Column("class_group", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("students", "class_group")
    op.drop_column("students", "school_grade")
