"""create company_integrations table

Revision ID: 005
Revises: 004
Create Date: 2026-07-06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "company_integrations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("companies.id"),
            nullable=False,
        ),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="disconnected"),
        sa.Column("credentials", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("label", sa.String(255), nullable=True),
        sa.Column(
            "unlocked_tasks",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_company_integrations_company_id",
        "company_integrations",
        ["company_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_company_integrations_company_id",
        table_name="company_integrations",
    )
    op.drop_table("company_integrations")
