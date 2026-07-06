"""create knowledge tables (entities, knowledge_chunks) + pgvector

Revision ID: 002
Revises: 001
Create Date: 2026-07-06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Enable pgvector extension (requires pgvector installed in PostgreSQL)
    # Uses SAVEPOINT so a missing extension doesn't abort the whole transaction
    conn = op.get_bind()
    try:
        conn.execute(sa.text("SAVEPOINT pgvector_check"))
        conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.execute(sa.text("RELEASE SAVEPOINT pgvector_check"))
        pgvector_available = True
    except Exception:
        conn.execute(sa.text("ROLLBACK TO SAVEPOINT pgvector_check"))
        pgvector_available = False
        import warnings
        warnings.warn(
            "pgvector not installed — embeddings use text-search fallback. "
            "See: https://github.com/pgvector/pgvector",
            stacklevel=2,
        )

    # ── entities ──────────────────────────────────────────────
    op.create_table(
        "entities",
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
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "source_urls",
            postgresql.ARRAY(sa.Text),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_entities_company_id", "entities", ["company_id"])

    # ── knowledge_chunks ──────────────────────────────────────
    op.create_table(
        "knowledge_chunks",
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
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("source_url", sa.Text, nullable=True),
        sa.Column(
            "chunk_metadata",
            postgresql.JSONB,
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_knowledge_chunks_company_id", "knowledge_chunks", ["company_id"])

    # pgvector embedding column — only if extension is available
    if pgvector_available:
        op.execute(
            "ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(3072)"
        )
        op.execute(
            """
            CREATE INDEX ix_knowledge_chunks_embedding
            ON knowledge_chunks
            USING hnsw (embedding vector_cosine_ops)
            """
        )


def downgrade() -> None:
    op.drop_table("knowledge_chunks")
    op.drop_table("entities")
