"""
Embedder — generates vector embeddings and stores knowledge chunks.

Uses OpenAI text-embedding-3-large (3072 dims).
Chunks text into overlapping windows for better retrieval.
"""

import logging
from textwrap import wrap

from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.knowledge.models import KnowledgeChunk

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.openai_api_key)

CHUNK_SIZE = 800      # characters per chunk
CHUNK_OVERLAP = 100   # overlap between chunks


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks."""
    if len(text) <= CHUNK_SIZE:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]
        # Try to break at sentence boundary
        last_period = chunk.rfind(". ")
        if last_period > CHUNK_SIZE // 2:
            chunk = chunk[: last_period + 1]
        chunks.append(chunk.strip())
        start += len(chunk) - CHUNK_OVERLAP

    return [c for c in chunks if c]


async def generate_embedding(text: str) -> list[float] | None:
    """Generate embedding vector via OpenAI."""
    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-test"):
        logger.warning("OpenAI API key not configured — skipping embedding")
        return None

    try:
        response = await client.embeddings.create(
            model=settings.openai_embedding_model,
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return None


async def embed_and_store(
    db: AsyncSession,
    company_id,
    text: str,
    source: str,
    source_url: str | None = None,
) -> list[KnowledgeChunk]:
    """
    Chunk text, generate embeddings, and store as KnowledgeChunk records.
    Returns list of created chunks.
    """
    chunks_text = chunk_text(text)
    created_chunks: list[KnowledgeChunk] = []

    for i, chunk_content in enumerate(chunks_text):
        embedding = await generate_embedding(chunk_content)

        chunk = KnowledgeChunk(
            company_id=company_id,
            content=chunk_content,
            source=source,
            source_url=source_url,
            chunk_metadata={"chunk_index": i, "total_chunks": len(chunks_text)},
        )
        db.add(chunk)
        await db.flush()

        # Store embedding in pgvector column if available
        if embedding:
            try:
                await db.execute(
                    text(
                        "UPDATE knowledge_chunks SET embedding = :emb WHERE id = :id"
                    ),
                    {"emb": str(embedding), "id": str(chunk.id)},
                )
            except Exception as e:
                logger.warning(f"Could not store embedding: {e}")

        created_chunks.append(chunk)

    return created_chunks


async def semantic_search(
    db: AsyncSession,
    company_id,
    query: str,
    limit: int = 5,
) -> list[tuple[KnowledgeChunk, float]]:
    """
    Search knowledge chunks by semantic similarity.
    Returns list of (chunk, similarity_score) tuples.
    """
    query_embedding = await generate_embedding(query)

    if not query_embedding:
        # Fallback: simple text search
        result = await db.execute(
            text(
                """
                SELECT id, content, source, source_url, chunk_metadata, created_at,
                       0.5 as similarity
                FROM knowledge_chunks
                WHERE company_id = :company_id
                  AND content ILIKE :query
                LIMIT :limit
                """
            ),
            {"company_id": str(company_id), "query": f"%{query}%", "limit": limit},
        )
        rows = result.fetchall()
        chunks = []
        for row in rows:
            chunk = KnowledgeChunk(
                id=row.id,
                company_id=company_id,
                content=row.content,
                source=row.source,
                source_url=row.source_url,
                chunk_metadata=row.chunk_metadata,
                created_at=row.created_at,
            )
            chunks.append((chunk, float(row.similarity)))
        return chunks

    # pgvector cosine similarity search
    try:
        result = await db.execute(
            text(
                """
                SELECT id, content, source, source_url, chunk_metadata, created_at,
                       1 - (embedding <=> :embedding::vector) as similarity
                FROM knowledge_chunks
                WHERE company_id = :company_id
                  AND embedding IS NOT NULL
                ORDER BY embedding <=> :embedding::vector
                LIMIT :limit
                """
            ),
            {
                "company_id": str(company_id),
                "embedding": str(query_embedding),
                "limit": limit,
            },
        )
        rows = result.fetchall()
        chunks = []
        for row in rows:
            chunk = KnowledgeChunk(
                id=row.id,
                company_id=company_id,
                content=row.content,
                source=row.source,
                source_url=row.source_url,
                chunk_metadata=row.chunk_metadata,
                created_at=row.created_at,
            )
            chunks.append((chunk, float(row.similarity)))
        return chunks
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return []
