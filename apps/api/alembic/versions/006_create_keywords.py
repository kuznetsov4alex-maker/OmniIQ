"""create keywords table

Revision ID: 006
Revises: 005
Create Date: 2026-07-06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "keywords",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("query", sa.String(500), nullable=False),
        sa.Column("cluster", sa.String(100), nullable=True),
        sa.Column("intent", sa.String(50), nullable=True),
        sa.Column("difficulty", sa.String(20), nullable=True),
        sa.Column("yandex_position", sa.Integer(), nullable=True),
        sa.Column("ai_mentioned", sa.Boolean(), nullable=True),
        sa.Column("article_generated", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("article_title", sa.String(500), nullable=True),
        sa.Column("article_content", sa.Text(), nullable=True),
        sa.Column("article_meta", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_keywords_company_id", "keywords", ["company_id"])


def downgrade() -> None:
    op.drop_index("ix_keywords_company_id", table_name="keywords")
    op.drop_table("keywords")
