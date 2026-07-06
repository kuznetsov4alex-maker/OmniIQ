"""create signals table

Revision ID: 003
Revises: 002
Create Date: 2026-07-06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "signals",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("channel", sa.String(100), nullable=False),
        sa.Column("metric", sa.String(100), nullable=False),
        sa.Column("value", sa.Float, nullable=False),
        sa.Column("raw_data", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column(
            "collected_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_signals_company_type", "signals", ["company_id", "type"])
    op.create_index("ix_signals_collected_at", "signals", ["collected_at"])


def downgrade() -> None:
    op.drop_index("ix_signals_collected_at", table_name="signals")
    op.drop_index("ix_signals_company_type", table_name="signals")
    op.drop_table("signals")
