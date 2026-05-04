"""Initial schema migration.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-05-05 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Create banlist_items table
    op.create_table(
        "banlist_items",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("faceit_name", sa.String(32), nullable=False),
        sa.Column("reason", sa.String(250), nullable=False),
        sa.Column("author", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("faceit_name"),
    )

    # Create indexes
    op.create_index("idx_faceit_name_lower", "banlist_items", ["faceit_name"])
    op.create_index("ix_banlist_items_faceit_name", "banlist_items", ["faceit_name"])


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_index("ix_banlist_items_faceit_name", table_name="banlist_items")
    op.drop_index("idx_faceit_name_lower", table_name="banlist_items")
    op.drop_table("banlist_items")
