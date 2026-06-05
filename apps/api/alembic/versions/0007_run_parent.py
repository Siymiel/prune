"""Add parent_run_id to runs for workflow composition tracking.

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-05
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("runs", sa.Column("parent_run_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_runs_parent_run_id",
        "runs", "runs",
        ["parent_run_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_runs_parent_run_id", "runs", ["parent_run_id"])


def downgrade() -> None:
    op.drop_index("ix_runs_parent_run_id", table_name="runs")
    op.drop_constraint("fk_runs_parent_run_id", "runs", type_="foreignkey")
    op.drop_column("runs", "parent_run_id")
