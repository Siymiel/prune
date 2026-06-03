"""Add error column to trace_steps.

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-03
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trace_steps", sa.Column("error", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("trace_steps", "error")
