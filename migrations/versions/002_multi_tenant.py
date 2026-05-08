"""Multi-tenant: api_keys table and namespace_id on banlist_items.

Revision ID: 002_multi_tenant
Revises: 001_initial_schema
Create Date: 2026-05-08 03:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002_multi_tenant"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SELF_HOSTED_NAMESPACE_ID = "00000000-0000-0000-0000-000000000001"


def upgrade() -> None:
    op.create_table(
        "api_keys",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("key_hash", sa.String(64), nullable=False),
        sa.Column("discord_user_id", sa.String(32), nullable=True),
        sa.Column("label", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash"),
        sa.UniqueConstraint("discord_user_id"),
    )
    op.create_index("ix_api_keys_key_hash", "api_keys", ["key_hash"])
    op.create_index("ix_api_keys_discord_user_id", "api_keys", ["discord_user_id"])

    # Add the namespace column with the self-hosted sentinel as default for
    # any pre-existing rows, then enforce NOT NULL once filled.
    op.add_column(
        "banlist_items",
        sa.Column(
            "namespace_id",
            postgresql.UUID(as_uuid=False),
            nullable=True,
        ),
    )
    op.execute(
        sa.text(
            "UPDATE banlist_items SET namespace_id = :ns WHERE namespace_id IS NULL"
        ).bindparams(ns=SELF_HOSTED_NAMESPACE_ID)
    )
    op.alter_column("banlist_items", "namespace_id", nullable=False)
    op.create_index("ix_banlist_items_namespace_id", "banlist_items", ["namespace_id"])

    # The legacy global-unique on faceit_name has to go: in multi-tenant mode
    # two namespaces can ban the same nickname.
    op.drop_constraint("banlist_items_faceit_name_key", "banlist_items", type_="unique")
    op.create_unique_constraint(
        "uq_banlist_namespace_name",
        "banlist_items",
        ["namespace_id", "faceit_name"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_banlist_namespace_name", "banlist_items", type_="unique")
    op.create_unique_constraint(
        "banlist_items_faceit_name_key", "banlist_items", ["faceit_name"]
    )
    op.drop_index("ix_banlist_items_namespace_id", table_name="banlist_items")
    op.drop_column("banlist_items", "namespace_id")

    op.drop_index("ix_api_keys_discord_user_id", table_name="api_keys")
    op.drop_index("ix_api_keys_key_hash", table_name="api_keys")
    op.drop_table("api_keys")
