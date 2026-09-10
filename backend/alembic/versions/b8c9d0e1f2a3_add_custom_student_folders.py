"""add custom student folders

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "student_folders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "name", name="uq_student_folders_owner_name"),
    )
    op.create_index("ix_student_folders_owner_id", "student_folders", ["owner_id"])
    op.add_column("students", sa.Column("folder_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_students_folder_id_student_folders",
        "students",
        "student_folders",
        ["folder_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_students_folder_id", "students", ["folder_id"])


def downgrade() -> None:
    op.drop_index("ix_students_folder_id", table_name="students")
    op.drop_constraint("fk_students_folder_id_student_folders", "students", type_="foreignkey")
    op.drop_column("students", "folder_id")
    op.drop_index("ix_student_folders_owner_id", table_name="student_folders")
    op.drop_table("student_folders")
