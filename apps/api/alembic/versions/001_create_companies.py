"""create companies table

Revision ID: 001
Revises:
Create Date: 2026-07-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("domain", sa.String(255), nullable=True),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
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
    op.create_index("ix_companies_user_id", "companies", ["user_id"])
    op.create_index("ix_companies_domain", "companies", ["domain"])


def downgrade() -> None:
    op.drop_index("ix_companies_domain", table_name="companies")
    op.drop_index("ix_companies_user_id", table_name="companies")
    op.drop_table("companies")
