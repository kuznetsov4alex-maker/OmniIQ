import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge.agent import ExtractedEntity, extract_entities
from app.knowledge.embedder import embed_and_store, semantic_search
from app.knowledge.models import Entity, KnowledgeChunk
from app.knowledge.schemas import (
    IngestRequest,
    IngestResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeSearchResult,
)


class KnowledgeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def ingest(
        self,
        company_id: uuid.UUID,
        company_name: str,
        data: IngestRequest,
    ) -> IngestResponse:
        # 1. Chunk + embed + store
        chunks = await embed_and_store(
            db=self.db,
            company_id=company_id,
            text=data.content,
            source=data.source,
            source_url=data.source_url,
        )

        # 2. Extract entities via Knowledge Agent
        extracted: list[ExtractedEntity] = await extract_entities(
            text=data.content,
            company_name=company_name,
        )

        # 3. Save entities (deduplicate by name)
        existing_names = set()
        existing_result = await self.db.execute(
            select(Entity.name).where(Entity.company_id == company_id)
        )
        existing_names = {row[0].lower() for row in existing_result.fetchall()}

        saved_entities = 0
        for e in extracted:
            if e.name.lower() not in existing_names:
                entity = Entity(
                    company_id=company_id,
                    type=e.type,
                    name=e.name,
                    description=e.description,
                    source_urls=[data.source_url] if data.source_url else [],
                )
                self.db.add(entity)
                existing_names.add(e.name.lower())
                saved_entities += 1

        await self.db.flush()

        return IngestResponse(
            company_id=company_id,
            chunks_created=len(chunks),
            entities_extracted=saved_entities,
            message=f"Ingested {len(chunks)} chunks, extracted {saved_entities} new entities.",
        )

    async def list_entities(
        self, company_id: uuid.UUID
    ) -> tuple[list[Entity], int]:
        count_result = await self.db.execute(
            select(func.count()).where(Entity.company_id == company_id)
        )
        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Entity)
            .where(Entity.company_id == company_id)
            .order_by(Entity.created_at.desc())
        )
        return list(result.scalars().all()), total

    async def search(
        self,
        company_id: uuid.UUID,
        request: KnowledgeSearchRequest,
    ) -> KnowledgeSearchResponse:
        results = await semantic_search(
            db=self.db,
            company_id=company_id,
            query=request.query,
            limit=request.limit,
        )

        return KnowledgeSearchResponse(
            query=request.query,
            results=[
                KnowledgeSearchResult(
                    id=chunk.id,
                    content=chunk.content,
                    source=chunk.source,
                    source_url=chunk.source_url,
                    similarity=score,
                )
                for chunk, score in results
            ],
        )
