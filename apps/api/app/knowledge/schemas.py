import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EntityType = Literal["brand", "product", "person", "location", "service"]
SourceType = Literal["manual", "website", "document"]


# ── Ingestion ──────────────────────────────────────────────────

class IngestRequest(BaseModel):
    content: str = Field(..., min_length=10, description="Text content to ingest")
    source: SourceType = "manual"
    source_url: str | None = None


class IngestResponse(BaseModel):
    company_id: uuid.UUID
    chunks_created: int
    entities_extracted: int
    message: str


# ── Entity ─────────────────────────────────────────────────────

class EntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    type: EntityType
    name: str
    description: str | None
    verified: bool
    source_urls: list[str]
    created_at: datetime


class EntityListResponse(BaseModel):
    items: list[EntityResponse]
    total: int


# ── Search ─────────────────────────────────────────────────────

class KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., min_length=3)
    limit: int = Field(default=5, ge=1, le=20)


class KnowledgeSearchResult(BaseModel):
    id: uuid.UUID
    content: str
    source: str
    source_url: str | None
    similarity: float


class KnowledgeSearchResponse(BaseModel):
    query: str
    results: list[KnowledgeSearchResult]
